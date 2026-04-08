#!/usr/bin/env python3
"""
scraper_do.py — Scraper de precios para DigitalOcean.
Pagina el dataset de datos.energia.gob.ar y guarda en SQLite.

Uso:
  DB_PATH=/var/www/tankear/data/tankear.db python3 scraper_do.py
"""

import os
import sys
import math
import requests
from datetime import datetime

import db_sqlite as db

# ── Config ────────────────────────────────────────────────────────────────────
RESOURCE_ID     = "80ac25de-a44a-4445-9215-090cf55cfda5"
API_URL         = "http://datos.energia.gob.ar/api/3/action/datastore_search"
PAGE_SIZE       = 10000
REQUEST_TIMEOUT = 120

_PROV_NORM = {
    "CAPITAL FEDERAL": "CABA",
}


# ── Helpers ───────────────────────────────────────────────────────────────────
def log(msg: str):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}", flush=True)


def norm_prov(prov: str) -> str:
    return _PROV_NORM.get((prov or "").strip().upper(), (prov or "").strip().upper())


def safe_float(v) -> float | None:
    try:
        f = float(str(v).replace(",", "."))
        return f if math.isfinite(f) else None
    except (ValueError, TypeError):
        return None


# ── Fetch ─────────────────────────────────────────────────────────────────────
def fetch_page(offset: int) -> dict:
    params = {
        "resource_id": RESOURCE_ID,
        "limit":       PAGE_SIZE,
        "offset":      offset,
    }
    headers = {"User-Agent": "Tankear-Scraper/2.0"}
    r = requests.get(API_URL, params=params, headers=headers, timeout=REQUEST_TIMEOUT)
    r.raise_for_status()
    data = r.json()
    if not data.get("success"):
        raise RuntimeError(f"CKAN error offset={offset}: {data.get('error')}")
    return data["result"]


def fetch_all() -> list:
    log("Iniciando paginación...")
    result  = fetch_page(0)
    total   = result.get("total", 0)
    records = result.get("records", [])
    log(f"Total según API: {total:,}")

    offset = len(records)
    while offset < total:
        page  = fetch_page(offset)
        batch = page.get("records", [])
        if not batch:
            break
        records.extend(batch)
        offset += len(batch)
        log(f"  {offset:,}/{total:,}")

    log(f"Paginación completa: {len(records):,} registros")
    return records


# ── Transform ─────────────────────────────────────────────────────────────────
def build_rows(records: list) -> list:
    rows = []
    for rec in records:
        precio = safe_float(rec.get("precio"))
        if precio is None or precio < 10:
            continue
        rows.append({
            "empresa":        (rec.get("empresa")        or "").strip().upper(),
            "bandera":        (rec.get("bandera")        or "").strip().upper(),
            "cuit":           (rec.get("cuit")           or "").strip(),
            "direccion":      (rec.get("direccion")      or "").strip(),
            "localidad":      (rec.get("localidad")      or "").strip().upper(),
            "provincia":      norm_prov(rec.get("provincia", "")),
            "region":         (rec.get("region")         or "").strip().upper(),
            "latitud":        safe_float(rec.get("latitud")),
            "longitud":       safe_float(rec.get("longitud")),
            "producto":       (rec.get("producto")       or "").strip(),
            "precio":         precio,
            "tipohorario":    (rec.get("tipohorario")    or "").strip(),
            "fecha_vigencia": (rec.get("fecha_vigencia") or "").strip(),
        })
    return rows


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    log("=" * 55)
    log("scraper_do.py — inicio")

    try:
        raw = fetch_all()
    except Exception as e:
        log(f"ERROR al descargar datos: {e}")
        sys.exit(1)

    rows = build_rows(raw)
    log(f"Filas válidas tras filtrado: {len(rows):,}")

    if not rows:
        log("ERROR: Sin datos válidos para guardar")
        sys.exit(1)

    try:
        n = db.save_estaciones(rows)
        log(f"Estaciones guardadas: {n:,}")
    except Exception as e:
        log(f"ERROR al guardar en DB: {e}")
        sys.exit(1)

    log("scraper_do.py — OK ✅")


if __name__ == "__main__":
    main()
