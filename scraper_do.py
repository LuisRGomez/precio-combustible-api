#!/usr/bin/env python3
"""
Scraper para Digital Ocean — descarga CSV de datos.energia.gob.ar y guarda en SQLite.
Ejecutar via cron cada 6 horas: 0 */6 * * * cd /var/www/tankear && /var/www/tankear/venv/bin/python scraper_do.py

Cascada de fuentes:
  1. CSV directo (download link del dataset)
  2. CKAN API paginada (datastore_search)
  3. Si ambos fallan → no toca los datos existentes (mantiene cache viejo)
"""

import csv
import io
import json
import os
import sys
import time
from datetime import datetime

import requests

# Usa el mismo DB_PATH que main_do.py
os.environ.setdefault("DB_PATH", "/var/www/tankear/data/tankear.db")
import db_sqlite as db

# ── Config ──────────────────────────────────────────────────────────────────

RESOURCE_ID = "80ac25de-a44a-4445-9215-090cf55cfda5"
CKAN_API    = "http://datos.energia.gob.ar/api/3/action/datastore_search"
CSV_URL     = ("http://datos.energia.gob.ar/dataset/"
               "1c181390-5045-475e-94dc-410429be4b17/resource/"
               "80ac25de-a44a-4445-9215-090cf55cfda5/download/"
               "precios-en-surtidor-resolucin-3142016.csv")
TIMEOUT     = 90
PAGE_SIZE   = 2000

# Wayback Machine: último snapshot conocido del CSV
WAYBACK_CSV = ("https://web.archive.org/web/2024/"
               "http://datos.energia.gob.ar/dataset/"
               "1c181390-5045-475e-94dc-410429be4b17/resource/"
               "80ac25de-a44a-4445-9215-090cf55cfda5/download/"
               "precios-en-surtidor-resolucin-3142016.csv")

# Mapeo de columnas CSV → nombres normalizados
CSV_COL_MAP = {
    "empresabandera": "bandera",
    "empresa":        "empresa",
    "cuit":           "cuit",
    "direccion":      "direccion",
    "localidad":      "localidad",
    "provincia":      "provincia",
    "region":         "region",
    "latitud":        "latitud",
    "longitud":       "longitud",
    "producto":       "producto",
    "precio":         "precio",
    "tipohorario":    "tipohorario",
    "fecha_vigencia": "fecha_vigencia",
}

PROV_NORM = {"CAPITAL FEDERAL": "CABA"}


def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}", flush=True)


def safe_float(v):
    try:
        f = float(str(v).replace(",", ".").strip())
        return f if f != 0 else None
    except (ValueError, TypeError):
        return None


def normalize_record(raw: dict) -> dict:
    """Normaliza un registro crudo (CSV o CKAN) al formato de la tabla estaciones."""
    # Normalizar keys a minúsculas
    raw_lower = {k.lower().strip(): v for k, v in raw.items()}

    rec = {}
    for src_key, dest_key in CSV_COL_MAP.items():
        val = raw_lower.get(src_key, "")
        if isinstance(val, str):
            val = val.strip()
        rec[dest_key] = val or None

    # Normalizar provincia
    if rec.get("provincia"):
        rec["provincia"] = rec["provincia"].upper()
        rec["provincia"] = PROV_NORM.get(rec["provincia"], rec["provincia"])

    # Normalizar localidad
    if rec.get("localidad"):
        rec["localidad"] = rec["localidad"].upper()

    # Floats
    rec["precio"]  = safe_float(rec.get("precio"))
    rec["latitud"]  = safe_float(rec.get("latitud"))
    rec["longitud"] = safe_float(rec.get("longitud"))

    # Si no tiene precio, descartar
    if rec["precio"] is None or rec["precio"] < 100:
        return None

    return rec


# ── Fuente 1: CSV directo ───────────────────────────────────────────────────

def _parse_csv_text(text: str) -> list:
    """Parsea texto CSV y retorna lista de records normalizados."""
    reader = csv.DictReader(io.StringIO(text))
    records = []
    for row in reader:
        rec = normalize_record(row)
        if rec:
            records.append(rec)
    return records


def fetch_csv() -> list:
    """Descarga el CSV oficial y retorna lista de records normalizados."""
    log(f"Intentando CSV: {CSV_URL[:80]}...")
    r = requests.get(CSV_URL, timeout=TIMEOUT,
                     headers={"User-Agent": "Tankear-Scraper/1.0"})
    r.raise_for_status()
    try:
        text = r.content.decode("utf-8")
    except UnicodeDecodeError:
        text = r.content.decode("latin-1")
    records = _parse_csv_text(text)
    log(f"CSV oficial: {len(records)} registros válidos")
    return records


def fetch_csv_from_url(url: str) -> list:
    """Descarga un CSV desde cualquier URL (Wayback, mirror, etc.)."""
    log(f"Descargando: {url[:80]}...")
    r = requests.get(url, timeout=TIMEOUT, headers={"User-Agent": "Tankear-Scraper/1.0"},
                     allow_redirects=True)
    r.raise_for_status()
    try:
        text = r.content.decode("utf-8")
    except UnicodeDecodeError:
        text = r.content.decode("latin-1")
    records = _parse_csv_text(text)
    log(f"CSV externo: {len(records)} registros válidos")
    return records if records else None


def fetch_csv_from_file(path: str) -> list:
    """Lee un CSV local (backup manual)."""
    log(f"Leyendo CSV local: {path}")
    with open(path, "r", encoding="utf-8") as f:
        text = f.read()
    records = _parse_csv_text(text)
    log(f"CSV local: {len(records)} registros válidos")
    return records if records else None


# ── Fuente 2: CKAN API paginada ────────────────────────────────────────────

def fetch_ckan() -> list:
    """Pagina la API CKAN y retorna todos los registros."""
    log("Intentando CKAN API paginada...")
    records = []
    offset = 0
    total = None

    while True:
        params = {
            "resource_id": RESOURCE_ID,
            "limit": PAGE_SIZE,
            "offset": offset,
        }
        r = requests.get(CKAN_API, params=params, timeout=TIMEOUT,
                         headers={"User-Agent": "Tankear-Scraper/1.0"})
        r.raise_for_status()
        data = r.json()
        if not data.get("success"):
            raise ValueError(f"CKAN error: {data.get('error', {})}")

        result = data["result"]
        if total is None:
            total = result.get("total", 0)
            log(f"CKAN: {total} registros totales")

        page_records = result.get("records", [])
        if not page_records:
            break

        for raw in page_records:
            rec = normalize_record(raw)
            if rec:
                records.append(rec)

        offset += PAGE_SIZE
        if offset >= total:
            break

        time.sleep(0.5)  # Rate limit

    log(f"CKAN: {len(records)} registros válidos")
    return records


# ── Deduplicación ───────────────────────────────────────────────────────────

def dedup(records: list) -> list:
    """Deduplica por (empresa, direccion, producto), quedándose con el más reciente."""
    seen = {}
    for rec in records:
        key = (
            (rec.get("empresa") or "").upper(),
            (rec.get("direccion") or "").upper(),
            (rec.get("producto") or "").upper(),
        )
        existing = seen.get(key)
        if existing is None:
            seen[key] = rec
        else:
            # Quedarse con el de fecha_vigencia más reciente
            new_date = rec.get("fecha_vigencia") or ""
            old_date = existing.get("fecha_vigencia") or ""
            if new_date > old_date:
                seen[key] = rec

    return list(seen.values())


# ── Siembra de localidades ──────────────────────────────────────────────────

def seed_localidades_from_estaciones(records: list):
    """Extrae localidades únicas de las estaciones y las siembra en SQLite."""
    seen = set()
    to_insert = []
    for rec in records:
        loc = rec.get("localidad")
        prov = rec.get("provincia")
        if not loc or not prov:
            continue
        key = (loc, prov)
        if key in seen:
            continue
        seen.add(key)
        to_insert.append({
            "localidad": loc,
            "provincia": prov,
            "lat": rec.get("latitud"),
            "lon": rec.get("longitud"),
            "codigo_postal": "",
        })
    if to_insert:
        db.seed_localidades(to_insert)
        log(f"Localidades actualizadas: {len(to_insert)}")


# ── Main ────────────────────────────────────────────────────────────────────

def main():
    log("=" * 60)
    log("Scraper Tankear — inicio")

    db.init_db()

    records = None

    # Fuente 1: CSV directo
    try:
        records = fetch_csv()
    except Exception as e:
        log(f"CSV falló: {e}")

    # Fuente 2: CKAN API
    if not records:
        try:
            records = fetch_ckan()
        except Exception as e:
            log(f"CKAN falló: {e}")

    # Fuente 3: Wayback Machine (datos de emergencia, puede ser viejo)
    if not records:
        try:
            log(f"Intentando Wayback Machine...")
            records = fetch_csv_from_url(WAYBACK_CSV)
        except Exception as e:
            log(f"Wayback falló: {e}")

    # Fuente 4: CSV local (si alguien lo descargó manualmente)
    if not records:
        local_csv = os.path.join(os.path.dirname(__file__), "data", "precios_backup.csv")
        if os.path.exists(local_csv):
            try:
                log(f"Intentando CSV local: {local_csv}")
                records = fetch_csv_from_file(local_csv)
            except Exception as e:
                log(f"CSV local falló: {e}")

    if not records:
        log("⚠️  Todas las fuentes fallaron. Manteniendo cache anterior.")
        current = db.estaciones_count()
        age = db.estaciones_age_hours()
        log(f"Cache actual: {current} estaciones, {age:.1f}h de antigüedad" if age else f"Cache actual: {current} estaciones")
        return

    # Deduplicar
    records = dedup(records)
    log(f"Post-dedup: {len(records)} estaciones únicas")

    # Sanity check: no reemplazar con datos parciales
    current_count = db.estaciones_count()
    if current_count > 0 and len(records) < current_count * 0.5:
        log(f"⚠️  Datos nuevos ({len(records)}) son <50% de los actuales ({current_count}). Posible error parcial. Abortando.")
        return

    # Guardar en SQLite (transacción atómica — si falla, los datos viejos se mantienen)
    try:
        db.save_estaciones(records, min_count=1000)
        log(f"✅ SQLite actualizado: {len(records)} estaciones")
    except ValueError as e:
        log(f"⚠️  Save abortado: {e}")
        return
    except Exception as e:
        log(f"❌ Error guardando: {e}")
        return

    # Snapshot histórico (1 por día, dedup por UNIQUE constraint)
    try:
        inserted = db.snapshot_precios()
        log(f"📊 Snapshot histórico: {inserted} registros nuevos")
    except Exception as e:
        log(f"⚠️  Error snapshot histórico: {e}")

    # Limpiar histórico viejo (>365 días)
    try:
        db.cleanup_historico(keep_days=365)
    except Exception:
        pass

    # Actualizar localidades también
    seed_localidades_from_estaciones(records)

    # Stats
    by_prov = {}
    for r in records:
        p = r.get("provincia", "?")
        by_prov[p] = by_prov.get(p, 0) + 1
    log(f"Provincias: {len(by_prov)}")
    for p in sorted(by_prov, key=lambda x: by_prov[x], reverse=True)[:5]:
        log(f"  {p}: {by_prov[p]}")

    log("Scraper finalizado OK")


if __name__ == "__main__":
    main()
