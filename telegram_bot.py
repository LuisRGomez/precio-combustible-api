#!/usr/bin/env python3
"""
telegram_bot.py — Bot interactivo @Tankear_bot con long polling.
Corre como servicio systemd (Restart=always).

Comandos:
  /start           → bienvenida + menú
  /precios [prov]  → precios actuales por provincia
  /barata [prod prov] → estaciones más baratas
  /alerta prod max [prov] → crear alerta de precio
  /misalertas      → ver alertas activas
  /cancelar_alerta N → cancelar alerta #N
  /suscribir [prov]→ suscribirse a actualizaciones diarias
  /baja            → darse de baja
  /ayuda           → lista de comandos
  /scraper         → (admin) lanzar scraper a demanda
  /status          → (admin) estado del sistema
"""

import os
import sqlite3
import requests
import subprocess
import time
from datetime import datetime
from zoneinfo import ZoneInfo
from collections import defaultdict

# ── Config ────────────────────────────────────────────────────────────────────
DB_PATH   = os.environ.get("DB_PATH",            "/var/www/tankear/data/tankear.db")
TG_TOKEN  = os.environ.get("TELEGRAM_BOT_TOKEN", "")
API_BASE  = f"https://api.telegram.org/bot{TG_TOKEN}"
SITIO     = "https://tankear.com.ar"
ADMIN_ID  = 1209008738

PROVINCIAS_VALIDAS = {
    "buenos aires", "caba", "capital federal", "cordoba", "córdoba",
    "santa fe", "mendoza", "tucuman", "tucumán", "entre rios", "entre ríos",
    "salta", "misiones", "chaco", "corrientes", "santiago del estero",
    "san juan", "jujuy", "rio negro", "río negro", "neuquen", "neuquén",
    "formosa", "chubut", "san luis", "catamarca", "la rioja", "la pampa",
    "santa cruz", "tierra del fuego",
}

PROD_CANONICAL = [
    ("súper",     "Nafta Súper"),
    ("super",     "Nafta Súper"),
    ("premium",   "Nafta Premium"),
    ("grado 2",   "Gasoil G2"),
    ("grado 3",   "Gasoil G3"),
    ("gnc",       "GNC"),
    ("gas natural", "GNC"),
    ("infinia",   "Nafta Premium"),
]

PROV_NORM = {
    "capital federal": "CABA",
    "caba":            "CABA",
    "buenos aires":    "BUENOS AIRES",
    "córdoba":         "CORDOBA",
    "cordoba":         "CORDOBA",
    "tucumán":         "TUCUMAN",
    "tucuman":         "TUCUMAN",
    "entre ríos":      "ENTRE RIOS",
    "entre rios":      "ENTRE RIOS",
    "río negro":       "RIO NEGRO",
    "rio negro":       "RIO NEGRO",
    "neuquén":         "NEUQUEN",
    "neuquen":         "NEUQUEN",
}


# ── Helpers ───────────────────────────────────────────────────────────────────
def log(msg: str):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}", flush=True)


def horario_actual() -> str:
    """Devuelve 'Nocturno' entre 00:00 y 06:00 hora argentina, sino 'Diurno'."""
    hora = datetime.now(ZoneInfo("America/Argentina/Buenos_Aires")).hour
    return "Nocturno" if hora < 6 else "Diurno"


def norm_prov(s: str) -> str:
    k = (s or "").lower().strip()
    return PROV_NORM.get(k, s.upper().strip())


def prod_label(raw: str) -> str:
    p = (raw or "").lower()
    for key, label in PROD_CANONICAL:
        if key in p:
            return label
    return raw.title() if raw else "?"


def _conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# ── Telegram API ──────────────────────────────────────────────────────────────
def api(method: str, **kwargs) -> dict:
    try:
        r = requests.post(f"{API_BASE}/{method}", json=kwargs, timeout=35)
        return r.json()
    except Exception as e:
        log(f"API error {method}: {e}")
        return {}


def send(chat_id, text: str, reply_markup=None, parse_mode="Markdown"):
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": parse_mode,
        "disable_web_page_preview": True,
    }
    if reply_markup:
        payload["reply_markup"] = reply_markup
    return api("sendMessage", **payload)


def get_updates(offset: int = 0, timeout: int = 30) -> list:
    data = api("getUpdates", offset=offset, timeout=timeout,
               allowed_updates=["message"])
    return data.get("result", [])


# ── DB helpers ────────────────────────────────────────────────────────────────
def save_subscriber(chat_id: int, username: str, first_name: str,
                    provincia: str = "", zona: str = ""):
    conn = _conn()
    conn.execute("""
        INSERT INTO telegram_subscribers
            (chat_id, username, first_name, zona, provincia, activo, updated_at)
        VALUES (?, ?, ?, ?, ?, 1, datetime('now'))
        ON CONFLICT(chat_id) DO UPDATE SET
            username   = excluded.username,
            first_name = excluded.first_name,
            zona       = CASE WHEN excluded.zona != '' THEN excluded.zona ELSE zona END,
            provincia  = CASE WHEN excluded.provincia != '' THEN excluded.provincia ELSE provincia END,
            activo     = 1,
            updated_at = datetime('now')
    """, (chat_id, username or "", first_name or "", zona or "", provincia or ""))
    conn.commit()
    conn.close()


def get_subscriber(chat_id: int) -> dict:
    conn = _conn()
    row = conn.execute(
        "SELECT * FROM telegram_subscribers WHERE chat_id=?", (chat_id,)
    ).fetchone()
    conn.close()
    return dict(row) if row else {}


def unsub(chat_id: int):
    conn = _conn()
    conn.execute(
        "UPDATE telegram_subscribers SET activo=0 WHERE chat_id=?", (chat_id,)
    )
    conn.commit()
    conn.close()


def log_msg(chat_id: int, username: str, first_name: str,
            text: str, intencion: str, score: int = 0):
    try:
        conn = _conn()
        conn.execute("""
            INSERT INTO telegram_messages
                (chat_id, username, first_name, text, intencion, score_lead)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (chat_id, username or "", first_name or "", text or "", intencion, score))
        conn.commit()
        conn.close()
    except Exception:
        pass


def create_alert(chat_id: int, username: str, producto: str,
                 precio_max: float, provincia: str = "") -> int:
    conn = _conn()
    cur = conn.execute("""
        INSERT INTO telegram_alerts (chat_id, username, producto, precio_max, provincia)
        VALUES (?, ?, ?, ?, ?)
    """, (chat_id, username or "", producto, precio_max, provincia or ""))
    conn.commit()
    aid = cur.lastrowid
    conn.close()
    return aid


def get_alerts(chat_id: int) -> list:
    conn = _conn()
    rows = conn.execute(
        "SELECT * FROM telegram_alerts WHERE chat_id=? AND activo=1 ORDER BY created_at DESC",
        (chat_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def cancel_alert(alert_id: int, chat_id: int):
    conn = _conn()
    conn.execute(
        "UPDATE telegram_alerts SET activo=0 WHERE id=? AND chat_id=?",
        (alert_id, chat_id)
    )
    conn.commit()
    conn.close()


# ── Queries de precios ────────────────────────────────────────────────────────
def precios_provincia(provincia: str = None) -> dict:
    """Retorna {label: {avg, min}} usando solo registros recientes (últimas 72h)."""
    conn = _conn()
    fecha_filter = "fecha_vigencia >= datetime((SELECT MAX(fecha_vigencia) FROM estaciones), '-72 hours')"
    precio_filter = "precio >= 1000"
    horario = horario_actual()

    if provincia:
        rows = conn.execute(f"""
            SELECT producto, AVG(precio) AS avg_p, MIN(precio) AS min_p
            FROM estaciones
            WHERE {precio_filter} AND {fecha_filter}
              AND tipohorario = ?
              AND UPPER(provincia) = ?
            GROUP BY producto HAVING COUNT(*) >= 3
            ORDER BY producto
        """, (horario, provincia.upper())).fetchall()
    else:
        rows = conn.execute(f"""
            SELECT producto, AVG(precio) AS avg_p, MIN(precio) AS min_p
            FROM estaciones
            WHERE {precio_filter} AND {fecha_filter}
              AND tipohorario = ?
            GROUP BY producto HAVING COUNT(*) >= 10
            ORDER BY producto
        """, (horario,)).fetchall()
    conn.close()

    result = {}
    for r in rows:
        lbl = prod_label(r["producto"])
        if lbl == "?":
            continue
        if lbl not in result or result[lbl]["avg"] > r["avg_p"]:
            result[lbl] = {"avg": round(r["avg_p"], 1), "min": round(r["min_p"], 1)}
    return result


def estaciones_baratas(provincia: str = None, producto_kw: str = "super",
                       top: int = 5) -> list:
    """Retorna las N estaciones más baratas para un producto (datos recientes)."""
    conn = _conn()
    fecha_filter = "fecha_vigencia >= datetime((SELECT MAX(fecha_vigencia) FROM estaciones), '-72 hours')"
    horario = horario_actual()
    q = f"""
        SELECT empresa, bandera, direccion, localidad, provincia, producto, precio
        FROM estaciones
        WHERE precio >= 1000 AND {fecha_filter}
          AND tipohorario = ?
          AND LOWER(producto) LIKE ?
    """
    params = [horario, f"%{producto_kw.lower()}%"]
    if provincia:
        q += " AND UPPER(provincia) = ?"
        params.append(provincia.upper())
    q += " ORDER BY precio ASC LIMIT ?"
    params.append(top)
    rows = conn.execute(q, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def provincias_disponibles() -> list:
    conn = _conn()
    rows = conn.execute(
        "SELECT DISTINCT provincia FROM estaciones WHERE provincia IS NOT NULL ORDER BY provincia"
    ).fetchall()
    conn.close()
    return [r["provincia"] for r in rows]


def db_stats() -> dict:
    """Estadísticas rápidas de la DB para /status."""
    conn = _conn()
    total = conn.execute("SELECT COUNT(*) FROM estaciones").fetchone()[0]
    recientes = conn.execute("""
        SELECT COUNT(*) FROM estaciones
        WHERE fecha_vigencia >= datetime((SELECT MAX(fecha_vigencia) FROM estaciones), '-72 hours')
    """).fetchone()[0]
    max_fecha = conn.execute("SELECT MAX(fecha_vigencia) FROM estaciones").fetchone()[0]
    subs = conn.execute("SELECT COUNT(*) FROM telegram_subscribers WHERE activo=1").fetchone()[0]
    conn.close()
    return {"total": total, "recientes": recientes, "max_fecha": max_fecha, "subs": subs}


# ── Handlers ─────────────────────────────────────────────────────────────────
def handle_start(chat_id: int, username: str, first_name: str):
    save_subscriber(chat_id, username, first_name)
    nombre = first_name or "ahí"
    msg = (
        f"⛽ *¡Hola {nombre}! Soy Tankear* 🇦🇷\n\n"
        "Te ayudo a encontrar el combustible más barato y a estar al tanto de los cambios de precio.\n\n"
        "*¿Qué puedo hacer por vos?*\n\n"
        "📊 /precios — Precios actuales por provincia\n"
        "💰 /barata — Estaciones más baratas\n"
        "🔔 /alerta — Creá una alerta de precio\n"
        "📋 /misalertas — Tus alertas activas\n"
        "📍 /suscribir — Recibí actualizaciones diarias\n"
        f"❓ /ayuda — Todos los comandos\n\n"
        f"[Ver mapa completo →]({SITIO})"
    )
    send(chat_id, msg)


def handle_precios(chat_id: int, args: list, sub: dict):
    if args:
        prov = norm_prov(" ".join(args))
    elif sub.get("provincia"):
        prov = sub["provincia"]
    else:
        prov = None

    precios = precios_provincia(prov)
    if not precios:
        prov_txt = prov.title() if prov else "el país"
        send(chat_id, f"⚠️ No encontré precios para *{prov_txt}*. Probá con otra provincia.")
        return

    prov_txt = prov.title() if prov else "Promedio nacional"
    lineas = [f"⛽ *Precios — {prov_txt}*\n"]
    for lbl in ["Nafta Súper", "Nafta Premium", "Gasoil G2", "Gasoil G3", "GNC"]:
        if lbl in precios:
            p = precios[lbl]
            lineas.append(f"• *{lbl}*: ${p['avg']:.0f}/L  _(mín ${p['min']:.0f})_")

    lineas.append(f"\n[Ver mapa →]({SITIO})")
    send(chat_id, "\n".join(lineas))


def handle_barata(chat_id: int, args: list, sub: dict):
    producto_kw = "super"
    prov = None

    if args:
        txt = " ".join(args).lower()
        for kw, lbl in [("premium", "premium"), ("gasoil", "grado"), ("gnc", "gnc"),
                         ("g2", "grado 2"), ("g3", "grado 3"), ("super", "super"),
                         ("súper", "super")]:
            if kw in txt:
                producto_kw = lbl
                txt = txt.replace(kw, "").strip()
                break
        if txt:
            prov = norm_prov(txt)

    if not prov and sub.get("provincia"):
        prov = sub["provincia"]

    estaciones = estaciones_baratas(prov, producto_kw, top=5)
    if not estaciones:
        prov_txt = prov.title() if prov else "el país"
        send(chat_id, f"⚠️ No encontré estaciones con ese combustible en *{prov_txt}*.")
        return

    prod_label_txt = prod_label(estaciones[0]["producto"])
    prov_txt = prov.title() if prov else "todo el país"
    lineas = [f"💰 *{prod_label_txt} más barata — {prov_txt}*\n"]
    for i, e in enumerate(estaciones, 1):
        empresa = (e.get("bandera") or e.get("empresa") or "?").title()
        dir_txt = (e.get("direccion") or "").title()
        loc_txt = (e.get("localidad") or "").title()
        lineas.append(f"{i}. *{empresa}* — ${e['precio']:.0f}/L\n   📍 {dir_txt}, {loc_txt}")

    lineas.append(f"\n[Ver todas →]({SITIO})")
    send(chat_id, "\n".join(lineas))


def handle_alerta(chat_id: int, username: str, args: list):
    if len(args) < 2:
        send(chat_id,
             "📋 *Uso:* `/alerta producto precio_máximo [provincia]`\n\n"
             "*Ejemplos:*\n"
             "`/alerta super 1400`\n"
             "`/alerta premium 1600 Córdoba`\n"
             "`/alerta gnc 300`\n\n"
             "Te aviso cuando el precio baje de ese valor.")
        return

    prod_raw = args[0].lower()
    try:
        precio_max = float(args[1].replace(",", ".").replace("$", ""))
    except ValueError:
        send(chat_id, "⚠️ El precio tiene que ser un número, ej: `1400`")
        return

    prov = norm_prov(" ".join(args[2:])) if len(args) > 2 else ""

    prod_label_txt = None
    for kw, lbl in PROD_CANONICAL:
        if kw in prod_raw:
            prod_label_txt = lbl
            break
    if not prod_label_txt:
        prod_label_txt = prod_raw.title()

    aid = create_alert(chat_id, username, prod_label_txt, precio_max, prov)
    prov_txt = f" en *{prov.title()}*" if prov else " (todo el país)"
    send(chat_id,
         f"🔔 *Alerta creada* (#{aid})\n\n"
         f"Te aviso cuando *{prod_label_txt}*{prov_txt} "
         f"baje de *${precio_max:.0f}/L*.")


def handle_misalertas(chat_id: int):
    alerts = get_alerts(chat_id)
    if not alerts:
        send(chat_id,
             "📋 No tenés alertas activas.\n\n"
             "Creá una con `/alerta super 1400`")
        return

    lineas = ["📋 *Tus alertas activas:*\n"]
    for a in alerts:
        prov_txt = f" ({a['provincia'].title()})" if a.get("provincia") else ""
        lineas.append(
            f"🔔 *#{a['id']}* — {a['producto']}{prov_txt}: max ${a['precio_max']:.0f}/L"
        )

    lineas.append("\nPara cancelar: `/cancelar_alerta 3` (con el número)")
    send(chat_id, "\n".join(lineas))


def handle_cancelar_alerta(chat_id: int, args: list):
    if not args:
        send(chat_id, "Indicá el número de alerta. Ej: `/cancelar_alerta 3`\nVer tus alertas: /misalertas")
        return
    try:
        aid = int(args[0])
    except ValueError:
        send(chat_id, "⚠️ Indicá el número de alerta, ej: `/cancelar_alerta 3`")
        return

    cancel_alert(aid, chat_id)
    send(chat_id, f"✅ Alerta #{aid} cancelada.")


def handle_suscribir(chat_id: int, username: str, first_name: str, args: list):
    prov = norm_prov(" ".join(args)) if args else ""
    save_subscriber(chat_id, username, first_name, provincia=prov)
    prov_txt = f" para *{prov.title()}*" if prov else ""
    send(chat_id,
         f"✅ *¡Listo!* Quedaste suscripto{prov_txt}.\n\n"
         "Cada mañana te mando un resumen de precios y te aviso si hay cambios importantes.\n\n"
         "Para darte de baja: /baja")


def handle_baja(chat_id: int):
    unsub(chat_id)
    send(chat_id,
         "👋 *Baja procesada.*\n\n"
         "Ya no vas a recibir actualizaciones automáticas.\n"
         "Si querés volver: /suscribir")


def handle_ayuda(chat_id: int):
    send(chat_id,
         "❓ *Comandos de Tankear*\n\n"
         "⛽ `/precios` — Precios nacionales\n"
         "⛽ `/precios Córdoba` — Precios de una provincia\n\n"
         "💰 `/barata` — Nafta super más barata (zona guardada)\n"
         "💰 `/barata premium BuenosAires` — Por producto y provincia\n\n"
         "🔔 `/alerta super 1400` — Alerta cuando super baje de $1.400\n"
         "🔔 `/alerta gnc 300 Mendoza` — Alerta en provincia específica\n"
         "📋 `/misalertas` — Ver tus alertas activas\n"
         "🗑️ `/cancelar_alerta 3` — Cancelar alerta #3\n\n"
         "📍 `/suscribir` — Recibir actualizaciones diarias\n"
         "📍 `/suscribir Tucumán` — Suscribirse con provincia\n"
         "❌ `/baja` — Darse de baja\n\n"
         f"[Ver mapa completo →]({SITIO})")


def handle_promos(chat_id: int):
    """Muestra promos activas (no vencidas) detectadas por promo_detector."""
    try:
        import sqlite3 as _sqlite3
        from datetime import datetime, date
        import re as _re

        con = _sqlite3.connect(DB_PATH)
        con.row_factory = _sqlite3.Row
        rows = con.execute("""
            SELECT marca, tarjeta, descuento, vigencia, asunto, texto_msg, created_at
            FROM telegram_promos
            WHERE publicado = 1
            ORDER BY created_at DESC
            LIMIT 30
        """).fetchall()
        con.close()

        if not rows:
            send(chat_id, "🎫 No hay promos guardadas aún.")
            return

        hoy = date.today()

        def _vencida(vigencia_str: str) -> bool:
            """Intenta determinar si la promo ya venció."""
            if not vigencia_str:
                return False
            # Buscar fecha con año: dd/mm/yyyy o dd-mm-yyyy
            m = _re.search(r'(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})', vigencia_str)
            if m:
                d, mo, a = int(m.group(1)), int(m.group(2)), int(m.group(3))
                a = a if a > 100 else 2000 + a
                try:
                    return date(a, mo, d) < hoy
                except Exception:
                    return False
            # Solo dd/mm sin año → asumir año actual
            m2 = _re.search(r'(\d{1,2})[\/\-](\d{1,2})', vigencia_str)
            if m2:
                d, mo = int(m2.group(1)), int(m2.group(2))
                try:
                    fecha = date(hoy.year, mo, d)
                    if fecha < date(hoy.year, 1, 15):
                        fecha = date(hoy.year + 1, mo, d)
                    return fecha < hoy
                except Exception:
                    return False
            return False

        activas = [r for r in rows if not _vencida(r["vigencia"])]

        if not activas:
            send(chat_id, "🎫 No hay promos activas en este momento.")
            return

        lineas = ["🎫 *Promos activas*\n"]
        for r in activas[:8]:  # máx 8 para no superar límite Telegram
            marca   = r["marca"] or ""
            tarjeta = r["tarjeta"] or ""
            desc    = r["descuento"] or ""
            vig     = r["vigencia"] or ""
            asunto  = r["asunto"] or ""

            def e(s): return _re.sub(r'([_\*\[\]\(\)~`>#+\-=|{}\.!\\])', r'\\\1', str(s))

            # Línea de título
            if desc:
                titulo = f"*{e(desc)} de reintegro*"
                if marca: titulo += f" en *{e(marca)}*"
                if tarjeta and tarjeta.upper() != marca.upper(): titulo += f" con *{e(tarjeta)}*"
            else:
                titulo = f"*{e(asunto[:55])}*" if asunto else f"*{e(marca or tarjeta)}*"

            linea = f"⛽ {titulo}"
            if vig:
                linea += f"\n   📅 _{e(vig)}_"
            lineas.append(linea)

        send(chat_id, "\n\n".join(lineas))

    except Exception as ex:
        send(chat_id, f"❌ Error al obtener promos: {ex}")


def handle_scraper(chat_id: int):
    """Lanza el scraper a demanda. Solo admin."""
    if chat_id != ADMIN_ID:
        send(chat_id, "⛔ Comando reservado para administradores.")
        return

    send(chat_id, "🚀 *Lanzando scraper...*\nEsperá unos minutos para el reporte.")
    try:
        subprocess.Popen(
            ["/var/www/tankear/api/notify_scraper.sh"],
            stdout=open("/var/log/tankear-scraper.log", "a"),
            stderr=subprocess.STDOUT,
        )
        send(chat_id, "✅ *Scraper lanzado OK*\nEl reporte llega en unos minutos.")
    except Exception as e:
        send(chat_id, f"❌ *Error al lanzar scraper:*\n`{e}`")


def handle_status(chat_id: int):
    """Estado del sistema. Solo admin."""
    if chat_id != ADMIN_ID:
        send(chat_id, "⛔ Comando reservado para administradores.")
        return

    try:
        stats = db_stats()
        msg = (
            "🖥️ *Estado del sistema*\n\n"
            f"📦 Estaciones en DB: `{stats['total']:,}`\n"
            f"✅ Registros recientes (72h): `{stats['recientes']:,}`\n"
            f"📅 Fecha más reciente: `{stats['max_fecha'] or 'N/A'}`\n"
            f"👥 Suscriptores activos: `{stats['subs']}`\n\n"
            f"🕐 Hora servidor: `{datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}`"
        )
        send(chat_id, msg)
    except Exception as e:
        send(chat_id, f"❌ Error obteniendo estado: `{e}`")


def handle_nlp(chat_id: int, text: str, username: str, first_name: str, sub: dict):
    """Manejo básico de lenguaje natural."""
    t = text.lower()

    if any(w in t for w in ["precio", "cuánto", "cuanto", "nafta", "gasoil", "gnc", "combustible"]):
        prov = None
        for p in PROVINCIAS_VALIDAS:
            if p in t:
                prov = norm_prov(p)
                break
        handle_precios(chat_id, [prov] if prov else [], sub)
        return "precios"

    if any(w in t for w in ["barata", "barato", "económica", "economica", "más barata", "mas barata"]):
        handle_barata(chat_id, [], sub)
        return "barata"

    if any(w in t for w in ["alerta", "avisame", "avisá", "notifica", "cuando baje"]):
        send(chat_id,
             "🔔 Para crear una alerta usá:\n"
             "`/alerta super 1400`\n"
             "`/alerta premium 1600 Córdoba`")
        return "alerta_info"

    if any(w in t for w in ["hola", "buenas", "buen dia", "buen día", "ola"]):
        nombre = first_name or "ahí"
        send(chat_id, f"¡Hola {nombre}! 👋 Escribí /ayuda para ver qué puedo hacer.")
        return "saludo"

    send(chat_id,
         "No entendí bien 🤔\n\n"
         "Probá con:\n"
         "• /precios Buenos Aires\n"
         "• /barata Córdoba\n"
         "• /ayuda — para ver todos los comandos")
    return "unknown"


# ── Loop principal ────────────────────────────────────────────────────────────
def process_update(update: dict):
    msg = update.get("message") or update.get("edited_message")
    if not msg:
        return

    chat_id    = msg["chat"]["id"]
    text       = (msg.get("text") or "").strip()
    username   = msg.get("from", {}).get("username", "")
    first_name = msg.get("from", {}).get("first_name", "")

    if not text:
        return

    log(f"@{username or chat_id}: {text[:80]}")

    sub   = get_subscriber(chat_id)
    parts = text.split()
    cmd   = parts[0].lower().lstrip("/").split("@")[0]
    args  = parts[1:]
    intencion = cmd

    if cmd == "start":
        handle_start(chat_id, username, first_name)

    elif cmd in ("precios", "precio"):
        handle_precios(chat_id, args, sub)

    elif cmd in ("barata", "baratas", "barato"):
        handle_barata(chat_id, args, sub)

    elif cmd == "alerta":
        handle_alerta(chat_id, username, args)

    elif cmd in ("misalertas", "alertas", "mis_alertas"):
        handle_misalertas(chat_id)

    elif cmd in ("cancelar_alerta", "borrararerta", "deleteralerta"):
        handle_cancelar_alerta(chat_id, args)

    elif cmd in ("suscribir", "suscribirme", "subscribe"):
        handle_suscribir(chat_id, username, first_name, args)

    elif cmd in ("baja", "desuscribir", "unsubscribe", "cancelar"):
        handle_baja(chat_id)

    elif cmd in ("ayuda", "help", "comandos"):
        handle_ayuda(chat_id)

    elif cmd == "scraper":
        handle_scraper(chat_id)

    elif cmd == "status":
        handle_status(chat_id)

    elif cmd == "promos":
        handle_promos(chat_id)

    else:
        intencion = handle_nlp(chat_id, text, username, first_name, sub)

    log_msg(chat_id, username, first_name, text, intencion,
            score=2 if intencion in ("precios", "barata", "alerta") else 1)


def main():
    if not TG_TOKEN:
        log("❌ TELEGRAM_BOT_TOKEN no configurado. Saliendo.")
        return

    me = api("getMe")
    if not me.get("ok"):
        log(f"❌ Token inválido: {me}")
        return
    bot_name = me["result"]["username"]
    log(f"✅ Bot @{bot_name} iniciado — long polling")

    # ── Registrar comandos en Telegram (aparecen al escribir /) ──────────────
    cmds_publicos = [
        {"command": "start",   "description": "Bienvenida y ayuda"},
        {"command": "nafta",   "description": "Nafta más barata cerca tuyo"},
        {"command": "gasoil",  "description": "Gasoil más barato cerca tuyo"},
        {"command": "precios", "description": "Precios por provincia"},
        {"command": "promos",  "description": "Promociones activas de combustible"},
        {"command": "mapa",    "description": "Ver mapa de estaciones"},
        {"command": "ayuda",   "description": "Lista de comandos"},
    ]
    api("setMyCommands", json={"commands": cmds_publicos})
    # Comandos admin: igual que público + scraper y status
    api("setMyCommands", json={
        "commands": cmds_publicos + [
            {"command": "scraper", "description": "🔧 Lanzar scraper ahora"},
            {"command": "status",  "description": "🔧 Estado de la base de datos"},
        ],
        "scope": {"type": "chat", "chat_id": ADMIN_ID},
    })
    log("✅ Comandos registrados en Telegram")

    offset = 0
    while True:
        try:
            updates = get_updates(offset=offset, timeout=30)
            for upd in updates:
                try:
                    process_update(upd)
                except Exception as e:
                    log(f"Error procesando update {upd.get('update_id')}: {e}")
                offset = upd["update_id"] + 1
        except requests.exceptions.Timeout:
            pass  # normal en long polling
        except requests.exceptions.ConnectionError as e:
            log(f"Conexión perdida: {e} — reintentando en 5s")
            time.sleep(5)
        except KeyboardInterrupt:
            log("Interrumpido por usuario")
            break
        except Exception as e:
            log(f"Error inesperado: {e} — reintentando en 10s")
            time.sleep(10)


if __name__ == "__main__":
    main()
