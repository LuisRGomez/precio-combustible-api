#!/usr/bin/env python3
"""
nocturno_notify.py — Aviso de precios nocturnos al canal @tankear_ar.
Corre a las 00:05 via cron:
  5 0 * * * DB_PATH=/var/www/tankear/data/tankear.db TELEGRAM_BOT_TOKEN=... /var/www/tankear/venv/bin/python3 /var/www/tankear/api/nocturno_notify.py
"""

import os
import sqlite3
from datetime import datetime

import requests

DB_PATH  = os.environ.get("DB_PATH",            "/var/www/tankear/data/tankear.db")
TG_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
CANAL    = "@tankear_ar"
API_BASE = f"https://api.telegram.org/bot{TG_TOKEN}"


def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}", flush=True)


def _conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def tg_send(text: str) -> bool:
    if not TG_TOKEN:
        log("Sin token TG")
        return False
    try:
        r = requests.post(f"{API_BASE}/sendMessage", json={
            "chat_id":                  CANAL,
            "text":                     text,
            "parse_mode":               "Markdown",
            "disable_web_page_preview": True,
        }, timeout=15)
        return r.ok
    except Exception as e:
        log(f"TG error: {e}")
        return False


def obtener_precios_nocturnos() -> dict:
    """Devuelve promedios y mínimos de precios nocturnos actuales."""
    conn = _conn()
    fecha_filter = "fecha_vigencia >= datetime((SELECT MAX(fecha_vigencia) FROM estaciones), '-72 hours')"
    rows = conn.execute(f"""
        SELECT producto, AVG(precio) AS avg_p, MIN(precio) AS min_p, COUNT(*) as n
        FROM estaciones
        WHERE precio >= 1000
          AND tipohorario = 'Nocturno'
          AND {fecha_filter}
        GROUP BY producto
        HAVING COUNT(*) >= 10
        ORDER BY producto
    """).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def obtener_diferencias_top() -> list:
    """Estaciones donde el precio nocturno es más barato que el diurno."""
    conn = _conn()
    fecha_filter = "fecha_vigencia >= datetime((SELECT MAX(fecha_vigencia) FROM estaciones), '-72 hours')"
    rows = conn.execute(f"""
        SELECT d.empresa, d.bandera, d.localidad, d.provincia, d.producto,
               d.precio AS precio_diurno,
               n.precio AS precio_nocturno,
               ROUND(d.precio - n.precio, 1) AS ahorro
        FROM estaciones d
        JOIN estaciones n
          ON d.empresa = n.empresa
         AND d.producto = n.producto
         AND d.direccion = n.direccion
        WHERE d.tipohorario = 'Diurno'
          AND n.tipohorario = 'Nocturno'
          AND d.precio >= 1000
          AND n.precio >= 1000
          AND n.precio < d.precio
          AND d.{fecha_filter}
        ORDER BY ahorro DESC
        LIMIT 5
    """).fetchall()
    conn.close()
    return [dict(r) for r in rows]


PROD_EMOJI = {
    "súper": "🟢",
    "super": "🟢",
    "premium": "🔵",
    "grado 2": "🟡",
    "grado 3": "🟠",
    "gnc": "⚪",
}

def emoji_prod(producto: str) -> str:
    p = producto.lower()
    for kw, em in PROD_EMOJI.items():
        if kw in p:
            return em
    return "⛽"

def nombre_corto(producto: str) -> str:
    p = producto.lower()
    if "súper" in p or "super" in p:
        return "Nafta Súper"
    if "premium" in p or "ron" in p:
        return "Nafta Premium"
    if "grado 3" in p:
        return "Gasoil G3"
    if "grado 2" in p:
        return "Gasoil G2"
    if "gnc" in p:
        return "GNC"
    return producto[:20]


def main():
    log("nocturno_notify.py — inicio")

    precios = obtener_precios_nocturnos()
    if not precios:
        log("Sin datos de precios nocturnos, abortando.")
        return

    hora = datetime.now().strftime("%d/%m %H:%M")

    msg = f"🌙 *Precios Nocturnos — {hora}*\n"
    msg += "_Precios vigentes hasta las 06:00 hs_\n\n"

    for r in precios:
        em  = emoji_prod(r["producto"])
        nom = nombre_corto(r["producto"])
        msg += f"{em} *{nom}*: ${r['avg_p']:,.0f} promedio · desde ${r['min_p']:,.0f}\n"

    # Estaciones con descuento nocturno
    difs = obtener_diferencias_top()
    if difs:
        msg += "\n💡 *Estaciones más baratas de noche:*\n"
        for d in difs[:3]:
            em  = emoji_prod(d["producto"])
            nom = nombre_corto(d["producto"])
            loc = d["localidad"].title() if d["localidad"] else d["provincia"].title()
            msg += (f"{em} {d['empresa'].title()} ({loc})\n"
                    f"   {nom}: ${d['precio_nocturno']:,.0f} "
                    f"_(${d['ahorro']:,.0f} menos que de día)_\n")

    msg += "\n[Ver todas las estaciones →](https://tankear.com.ar)"

    ok = tg_send(msg)
    log(f"{'✅ Enviado' if ok else '❌ Error al enviar'}")


if __name__ == "__main__":
    main()
