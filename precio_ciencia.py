#!/usr/bin/env python3
"""
precio_ciencia.py — Algoritmos de estimación de precios para estaciones con datos viejos.

Ejecutar DESPUÉS del scraper (cron: 5 9 * * *):
  5 9 * * * cd /var/www/tankear/api && DB_PATH=/var/www/tankear/data/tankear.db \
            /var/www/tankear/venv/bin/python /var/www/tankear/api/precio_ciencia.py \
            >> /var/log/tankear-ciencia.log 2>&1

Algoritmos (en orden de prioridad / confianza):
  1. IDW  — Inverse Distance Weighting con vecinos frescos del mismo producto/provincia
  2. Trend — regresión lineal sobre histórico propio (≥3 snapshots en 90 días)
  3. Regional — promedio ponderado de la provincia/producto del día
"""

import os
import sys
import math
from datetime import datetime

os.environ.setdefault("DB_PATH", "/var/www/tankear/data/tankear.db")
import db_sqlite as db

# ── Parámetros ────────────────────────────────────────────────────────────────

MIN_STALE_DIAS   = 60    # solo procesar estaciones con precio > 60 días de antigüedad
MAX_STALE_DIAS   = 730   # ignorar si el precio tiene > 2 años (probablemente datos basura)
MAX_FRESH_DIAS   = 30    # vecinos frescos: precio < 30 días
IDW_N_VECINOS    = 5     # máximo vecinos a usar en IDW
IDW_MAX_KM       = 100   # radio máximo de búsqueda de vecinos (km)
IDW_EPSILON      = 0.01  # evitar división por cero en IDW (km²)
TREND_MIN_PUNTOS = 3     # mínimo de snapshots históricos para aplicar tendencia
TREND_MAX_DIAS   = 90    # ventana histórica para tendencia (días)
REGIONAL_CONF    = 0.20  # confianza fija para estimación regional (fallback)


def log(msg: str):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}", flush=True)


# ── Geometría ─────────────────────────────────────────────────────────────────

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Distancia en km entre dos puntos (Haversine)."""
    R = 6371.0
    φ1, φ2 = math.radians(lat1), math.radians(lat2)
    dφ = math.radians(lat2 - lat1)
    dλ = math.radians(lon2 - lon1)
    a = math.sin(dφ / 2) ** 2 + math.cos(φ1) * math.cos(φ2) * math.sin(dλ / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


# ── Algoritmo 1: IDW ─────────────────────────────────────────────────────────

def estimar_idw(stale: dict, frescos: list) -> dict | None:
    """
    Inverse Distance Weighting: precio estimado = Σ(p_i / d²_i) / Σ(1 / d²_i)
    donde d_i es la distancia al vecino i.
    Confianza = min(n/IDW_N_VECINOS, 1) × (1 - dist_max / IDW_MAX_KM)
    """
    lat0, lon0 = stale["latitud"], stale["longitud"]
    producto   = stale["producto"]

    # Filtrar vecinos: mismo producto en la provincia (o adyacente)
    mismos = [f for f in frescos if f["producto"] == producto]
    if not mismos:
        return None

    # Calcular distancias
    con_dist = []
    for f in mismos:
        d = haversine_km(lat0, lon0, f["latitud"], f["longitud"])
        if d <= IDW_MAX_KM:
            con_dist.append((d, f))

    if not con_dist:
        return None

    # Ordenar por distancia, tomar los N más cercanos
    con_dist.sort(key=lambda x: x[0])
    vecinos = con_dist[:IDW_N_VECINOS]

    # IDW
    pesos     = [1.0 / (d ** 2 + IDW_EPSILON) for d, _ in vecinos]
    peso_tot  = sum(pesos)
    precio_est = sum(w * f["precio"] for w, (_, f) in zip(pesos, vecinos)) / peso_tot

    n         = len(vecinos)
    dist_max  = vecinos[-1][0]
    confianza = min(n / IDW_N_VECINOS, 1.0) * (1.0 - dist_max / IDW_MAX_KM)
    confianza = max(0.0, round(confianza, 3))

    return {
        **stale,
        "precio_real":      stale["precio"],
        "fecha_real":       stale["fecha_vigencia"],
        "dias_stale":       stale["dias_stale"],
        "precio_estimado":  round(precio_est, 2),
        "confianza":        confianza,
        "n_vecinos":        n,
        "distancia_max_km": round(dist_max, 1),
        "metodo":           "idw",
    }


# ── Algoritmo 2: Tendencia histórica ─────────────────────────────────────────

def estimar_trend(stale: dict, historico: list) -> dict | None:
    """
    Regresión lineal simple sobre (días_desde_primer_punto, precio).
    Extrapola al día de hoy.
    Confianza basada en R² de la regresión.
    """
    if len(historico) < TREND_MIN_PUNTOS:
        return None

    # Convertir fechas a días desde el primer snapshot
    fechas = sorted(historico, key=lambda x: x["fecha_snapshot"])
    t0 = datetime.strptime(fechas[0]["fecha_snapshot"], "%Y-%m-%d")
    xs = [(datetime.strptime(f["fecha_snapshot"], "%Y-%m-%d") - t0).days for f in fechas]
    ys = [f["precio_promedio"] for f in fechas]

    n  = len(xs)
    sx = sum(xs)
    sy = sum(ys)
    sx2 = sum(x ** 2 for x in xs)
    sxy = sum(x * y for x, y in zip(xs, ys))

    denom = n * sx2 - sx ** 2
    if denom == 0:
        return None

    slope     = (n * sxy - sx * sy) / denom
    intercept = (sy - slope * sx) / n

    # Predecir precio de hoy
    today_days = (datetime.now() - t0).days
    precio_est = intercept + slope * today_days

    # R²
    y_mean  = sy / n
    ss_tot  = sum((y - y_mean) ** 2 for y in ys)
    y_pred  = [intercept + slope * x for x in xs]
    ss_res  = sum((y - yp) ** 2 for y, yp in zip(ys, y_pred))
    r2      = 1 - ss_res / ss_tot if ss_tot > 0 else 0

    if precio_est < 100 or precio_est > 100_000:
        return None  # extrapolación absurda

    confianza = max(0.0, round(r2 * 0.6, 3))  # máx 0.6 por método menos robusto

    return {
        **stale,
        "precio_real":      stale["precio"],
        "fecha_real":       stale["fecha_vigencia"],
        "dias_stale":       stale["dias_stale"],
        "precio_estimado":  round(precio_est, 2),
        "confianza":        confianza,
        "n_vecinos":        n,
        "distancia_max_km": 0.0,
        "metodo":           "trend",
    }


# ── Algoritmo 3: Media regional ───────────────────────────────────────────────

def estimar_regional(stale: dict, frescos: list) -> dict | None:
    """
    Promedio simple de todos los frescos de la misma provincia+producto.
    Confianza fija baja (REGIONAL_CONF).
    """
    mismos = [
        f for f in frescos
        if f["producto"] == stale["producto"]
        and f["provincia"] == stale["provincia"]
    ]
    if not mismos:
        return None

    precio_est = sum(f["precio"] for f in mismos) / len(mismos)
    return {
        **stale,
        "precio_real":      stale["precio"],
        "fecha_real":       stale["fecha_vigencia"],
        "dias_stale":       stale["dias_stale"],
        "precio_estimado":  round(precio_est, 2),
        "confianza":        REGIONAL_CONF,
        "n_vecinos":        len(mismos),
        "distancia_max_km": None,
        "metodo":           "regional_avg",
    }


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    log("=" * 60)
    log("PrecioCiencia — inicio")

    db.init_db()

    log("Cargando estaciones stale...")
    stale_list = db.get_estaciones_stale(min_dias=MIN_STALE_DIAS, max_dias=MAX_STALE_DIAS)
    log(f"  → {len(stale_list)} estaciones con precio > {MIN_STALE_DIAS} días")

    if not stale_list:
        log("No hay estaciones stale. Saliendo.")
        return

    log("Cargando estaciones frescas (vecinos IDW)...")
    fresh_list = db.get_estaciones_fresh(max_dias=MAX_FRESH_DIAS)
    log(f"  → {len(fresh_list)} estaciones frescas disponibles")

    # Agrupar frescos por (provincia, producto) para acceso rápido
    fresh_by_prov_prod: dict[tuple, list] = {}
    for f in fresh_list:
        key = (f["provincia"], f["producto"])
        fresh_by_prov_prod.setdefault(key, []).append(f)

    # Cargar histórico de precios (para tendencia)
    log("Cargando histórico de precios...")
    # Construimos un índice (empresa, direccion, producto) → lista de snapshots
    conn_rows = db._conn()
    hist_rows = conn_rows.execute("""
        SELECT empresa, direccion, producto, fecha_snapshot,
               AVG(precio) AS precio_promedio
        FROM precios_historico
        WHERE fecha_snapshot >= date('now', ?)
        GROUP BY empresa, direccion, producto, fecha_snapshot
        ORDER BY fecha_snapshot
    """, (f'-{TREND_MAX_DIAS} days',)).fetchall()
    conn_rows.close()

    hist_index: dict[tuple, list] = {}
    for r in hist_rows:
        key = (r["empresa"], r["direccion"], r["producto"])
        hist_index.setdefault(key, []).append(dict(r))

    # Procesar cada estación stale
    resultados: list[dict] = []
    stats = {"idw": 0, "trend": 0, "regional_avg": 0, "sin_estimacion": 0}

    for stale in stale_list:
        # 1. Intentar IDW (mejor calidad)
        frescos_disponibles = fresh_by_prov_prod.get(
            (stale["provincia"], stale["producto"]), []
        )
        est = estimar_idw(stale, frescos_disponibles)

        # 2. Fallback: tendencia histórica propia
        if est is None or est["confianza"] < 0.1:
            key = (stale["empresa"], stale["direccion"], stale["producto"])
            hist = hist_index.get(key, [])
            trend_est = estimar_trend(stale, hist)
            if trend_est and (est is None or trend_est["confianza"] > est["confianza"]):
                est = trend_est

        # 3. Fallback: media regional
        if est is None:
            est = estimar_regional(stale, fresh_list)

        if est:
            resultados.append(est)
            stats[est["metodo"]] = stats.get(est["metodo"], 0) + 1
        else:
            stats["sin_estimacion"] += 1

    log(f"Estimaciones calculadas: {len(resultados)}")
    log(f"  IDW:       {stats['idw']}")
    log(f"  Tendencia: {stats['trend']}")
    log(f"  Regional:  {stats['regional_avg']}")
    log(f"  Sin est.:  {stats['sin_estimacion']}")

    if resultados:
        db.upsert_precios_estimados(resultados)
        log(f"✅ {len(resultados)} estimaciones guardadas en precios_estimados")

    log("PrecioCiencia finalizado OK")


if __name__ == "__main__":
    main()
