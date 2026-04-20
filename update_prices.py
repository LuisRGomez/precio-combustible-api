#!/usr/bin/env python3
import os, sqlite3, requests
from datetime import datetime, date, timedelta

DB_PATH    = os.environ.get("DB_PATH",            "/var/www/tankear/data/tankear.db")
TG_TOKEN   = os.environ.get("TELEGRAM_BOT_TOKEN", "")
CANAL      = "@tankear_ar"
UMBRAL_PC  = 1.5    # % mínimo para considerar "subida"
PRECIO_MIN = 500.0  # filtro de outliers — nada por debajo de $500 es válido
MAX_CAMBIO = 25.0   # % máximo creíble en un día — si supera esto es error de datos

PROD_CANONICAL = [
    ("súper",   "Nafta Súper"),
    ("super",   "Nafta Súper"),
    ("premium", "Nafta Premium"),
    ("grado 2", "Gasoil G2"),
    ("grado 3", "Gasoil G3"),
    ("gnc",     "GNC"),
    ("gas natural", "GNC"),
]


def log(m): print(f"[{datetime.now().strftime('%H:%M:%S')}] {m}", flush=True)
def _conn(): c = sqlite3.connect(DB_PATH); c.row_factory = sqlite3.Row; return c

def prod_label(raw):
    p = (raw or "").lower()
    for k, l in PROD_CANONICAL:
        if k in p: return l
    return raw.title() if raw else "?"

def tg_send(chat_id, text, parse_mode="Markdown"):
    if not TG_TOKEN: log("Sin token"); return False
    try:
        r = requests.post(
            f"https://api.telegram.org/bot{TG_TOKEN}/sendMessage",
            json={"chat_id": chat_id, "text": text, "parse_mode": parse_mode,
                  "disable_web_page_preview": True},
            timeout=35)
        if not r.ok: log(f"TG {r.status_code}: {r.text[:200]}"); return False
        return True
    except Exception as e: log(f"TG error: {e}"); return False

def snapshot_hoy():
    """
    Guarda snapshot del día usando SOLO registros con fecha_vigencia reciente (72h).
    Así los snapshots futuros son comparables entre sí y no mezclan datos viejos.
    """
    hoy = date.today().isoformat()
    c = _conn()
    ya = c.execute("SELECT COUNT(*) FROM precios_historico WHERE fecha_snapshot=?", (hoy,)).fetchone()[0]
    if ya:
        c.close(); log(f"Snapshot {hoy} ya existe ({ya} registros)"); return 0
    rows = c.execute("""
        SELECT empresa, bandera, producto, precio, provincia, localidad, direccion, fecha_vigencia
        FROM estaciones
        WHERE precio >= ?
          AND fecha_vigencia >= datetime(
              (SELECT MAX(fecha_vigencia) FROM estaciones), '-72 hours')
    """, (PRECIO_MIN,)).fetchall()
    ins = 0
    for r in rows:
        try:
            c.execute("""INSERT OR IGNORE INTO precios_historico
                (empresa, bandera, direccion, localidad, provincia, producto, precio, fecha_vigencia, fecha_snapshot)
                VALUES (?,?,?,?,?,?,?,?,?)""",
                (r["empresa"], r["bandera"], r["direccion"], r["localidad"],
                 r["provincia"], r["producto"], r["precio"], r["fecha_vigencia"], hoy))
            ins += 1
        except: pass
    c.commit(); c.close()
    log(f"Snapshot {hoy}: {ins} registros (72h recientes, >= ${PRECIO_MIN:.0f})")
    return ins

def get_promedios_desde_estaciones() -> dict:
    """
    Usa solo los precios con fecha_vigencia reciente (últimas 72hs desde
    el registro más nuevo). Evita que datos viejos del dataset tiren el promedio.
    """
    c = _conn()
    ultima = c.execute(
        "SELECT MAX(fecha_vigencia) FROM estaciones WHERE precio >= ?", (PRECIO_MIN,)
    ).fetchone()[0]
    if not ultima:
        c.close(); return {}
    rows = c.execute("""
        SELECT producto, AVG(precio) avg_p, COUNT(*) n
        FROM estaciones
        WHERE precio >= ?
          AND fecha_vigencia >= datetime(?, '-72 hours')
        GROUP BY producto HAVING n >= 5
    """, (PRECIO_MIN, ultima)).fetchall()
    c.close()
    return {r["producto"]: round(r["avg_p"], 0) for r in rows}

def get_promedios_historico(fecha: str) -> dict:
    c = _conn()
    rows = c.execute("""
        SELECT producto, AVG(precio) avg_p
        FROM precios_historico
        WHERE fecha_snapshot=? AND precio >= ?
        GROUP BY producto HAVING COUNT(*) >= 10
    """, (fecha, PRECIO_MIN)).fetchall()
    c.close()
    return {r["producto"]: round(r["avg_p"], 0) for r in rows}

def get_fecha_comparacion() -> tuple:
    """Busca el snapshot más útil: prioriza hace 7 días, sino el más reciente disponible."""
    hoy = date.today().isoformat()
    c = _conn()
    rows = c.execute("""
        SELECT DISTINCT fecha_snapshot FROM precios_historico
        WHERE fecha_snapshot < ? ORDER BY fecha_snapshot DESC
    """, (hoy,)).fetchall()
    c.close()
    if not rows: return None, None
    fechas = [r["fecha_snapshot"] for r in rows]
    for dias in range(7, 0, -1):
        objetivo = (date.today() - timedelta(days=dias)).isoformat()
        if objetivo in fechas:
            return objetivo, dias
    ultima = fechas[-1]
    dias = (date.today() - date.fromisoformat(ultima)).days
    return ultima, dias

def check_alerts():
    c = _conn(); alerts = c.execute("SELECT * FROM telegram_alerts WHERE activo=1").fetchall(); c.close()
    triggered = 0
    for a in alerts:
        prod = (a["producto"] or "").lower(); c = _conn()
        q = "SELECT AVG(precio) avg_p FROM estaciones WHERE LOWER(producto) LIKE ? AND precio >= ?"
        params = [f"%{prod}%", PRECIO_MIN]
        if a["provincia"]: q += " AND UPPER(provincia)=?"; params.append(a["provincia"].upper())
        row = c.execute(q, params).fetchone(); c.close()
        if not row or row["avg_p"] is None: continue
        pa = round(row["avg_p"], 0)
        if pa <= a["precio_max"]:
            pv = f" en {a['provincia'].title()}" if a["provincia"] else ""
            msg = (f"🔔 *¡Alerta!*\n*{a['producto']}*{pv}\n"
                   f"Precio actual: *${pa:.0f}/L* ✅\nUmbral: ${a['precio_max']:.0f}\n"
                   f"[Ver →](https://tankear.com.ar)")
            if tg_send(a["chat_id"], msg):
                c = _conn()
                c.execute("UPDATE telegram_alerts SET triggered_at=datetime('now'),activo=0 WHERE id=?", (a["id"],))
                c.commit(); c.close()
                triggered += 1
    return triggered

def get_subscribers():
    c = _conn(); rows = c.execute("SELECT * FROM telegram_subscribers WHERE activo=1").fetchall()
    c.close(); return [dict(r) for r in rows]

def main():
    log("=" * 55); log("update_prices.py — inicio")
    if not TG_TOKEN: log("❌ Sin TELEGRAM_BOT_TOKEN"); return

    precios_hoy = get_promedios_desde_estaciones()
    log(f"Productos válidos en DB: {len(precios_hoy)}")
    for p, v in precios_hoy.items(): log(f"  {prod_label(p)}: ${v:.0f}")
    if not precios_hoy: log("❌ Sin datos"); return

    snapshot_hoy()

    fecha_cmp, dias_atras = get_fecha_comparacion()
    precios_ant = {}
    if fecha_cmp:
        precios_ant = get_promedios_historico(fecha_cmp)
        log(f"Comparando con hace {dias_atras} día(s): {fecha_cmp} ({len(precios_ant)} productos)")
    else:
        log("Sin snapshots anteriores — primer día")

    cambios = []; vistos = set(); descartados = []
    for prod, ph in precios_hoy.items():
        pa = precios_ant.get(prod)
        if not pa or pa <= 0: continue
        lb = prod_label(prod)
        if lb in vistos or lb == "?": continue
        dp = (ph - pa) / pa * 100
        # Filtro de calidad: cambios > MAX_CAMBIO% son casi siempre error de datos
        if abs(dp) > MAX_CAMBIO:
            log(f"  ⚠️  {lb}: {dp:+.1f}% supera el límite de {MAX_CAMBIO}% — descartado (datos históricos inconsistentes)")
            descartados.append(lb)
            continue
        if abs(dp) >= UMBRAL_PC:
            vistos.add(lb)
            cambios.append({"lbl": lb, "ph": ph, "pa": round(pa, 0), "dp": round(dp, 1)})

    log(f"Cambios >={UMBRAL_PC}%: {len(cambios)}")
    for c in cambios: log(f"  {c['lbl']}: ${c['pa']:.0f} → ${c['ph']:.0f} ({c['dp']:+.1f}%)")

    hoy_fmt = datetime.now().strftime("%d/%m/%Y")
    if cambios:
        lns = [f"⛽ *Tankear — {hoy_fmt}*\n"]
        subio = [c for c in cambios if c["dp"] > 0]
        bajo  = [c for c in cambios if c["dp"] < 0]
        if subio:
            lns.append("🔴 *Subas:*")
            for c in sorted(subio, key=lambda x: x["dp"], reverse=True):
                lns.append(f"  • *{c['lbl']}*: ${c['pa']:.0f} → ${c['ph']:.0f} (+{c['dp']:.1f}%)")
        if bajo:
            lns.append("🟢 *Bajas:*")
            for c in sorted(bajo, key=lambda x: x["dp"]):
                lns.append(f"  • *{c['lbl']}*: ${c['pa']:.0f} → ${c['ph']:.0f} ({c['dp']:.1f}%)")
        if dias_atras: lns.append(f"\n_vs hace {dias_atras} día(s)_")
    else:
        estable_txt = f" (sin cambios en {dias_atras} días)" if dias_atras else ""
        lns = [f"⛽ *Tankear — {hoy_fmt}*\n", f"Precios estables{estable_txt}:\n"]
        vistos2 = set()
        for prod, precio in sorted(precios_hoy.items(), key=lambda x: x[1], reverse=True):
            lb = prod_label(prod)
            if lb in vistos2 or lb == "?": continue
            vistos2.add(lb); lns.append(f"• *{lb}*: ${precio:.0f}/L")

    lns.append(f"\n[Ver mapa →](https://tankear.com.ar)")
    ok = tg_send(CANAL, "\n".join(lns))
    log(f"Canal {CANAL}: {'✅' if ok else '❌'}")

    if cambios:
        subs = get_subscribers(); log(f"Subs: {len(subs)}"); n = 0
        for s in subs:
            nm = s.get("first_name") or "ahí"
            lns2 = [f"⛽ *¡Hola {nm}!* Cambios de precio:\n"]
            for c in sorted(cambios, key=lambda x: x["dp"], reverse=True):
                e = "🔴" if c["dp"] > 0 else "🟢"; sg = "+" if c["dp"] > 0 else ""
                lns2.append(f"{e} *{c['lbl']}*: ${c['ph']:.0f}/L ({sg}{c['dp']:.1f}%)")
            lns2.append("\n[Ver →](https://tankear.com.ar)")
            if tg_send(s["chat_id"], "\n".join(lns2)): n += 1
        log(f"Notificados: {n}/{len(subs)}")

    t = check_alerts(); log(f"Alertas: {t}")
    log("update_prices.py — OK ✅")

if __name__ == "__main__": main()
