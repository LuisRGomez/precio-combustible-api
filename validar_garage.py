#!/usr/bin/env python3
"""
validar_garage.py — Validación nocturna de contribuciones de consumo.

Ejecutar DESPUÉS del cron de precio_ciencia.py:
  10 9 * * * cd /var/www/tankear/api && DB_PATH=/var/www/tankear/data/tankear.db \
             /var/www/tankear/venv/bin/python /var/www/tankear/api/validar_garage.py \
             >> /var/log/tankear-garage.log 2>&1

Estrategia:
  1. Carga todas las contribuciones en estado 'pendiente'.
  2. Aplica reglas de validación sobre los datos aportados.
  3. Calcula un puntaje de confianza (0.0 – 1.0).
  4. Aprueba si confianza >= UMBRAL_APROBACION, rechaza si < UMBRAL_RECHAZO.
  5. Actualiza el estado en la tabla contribuciones_consumo.
  6. (Opcional) promedia contribuciones aprobadas por modelo y las ofrece
     como referencia comunitaria en /autos/contribuciones.
"""

import os
import sqlite3
from datetime import datetime

os.environ.setdefault("DB_PATH", "/var/www/tankear/data/tankear.db")
DB_PATH = os.environ.get("DB_PATH", "/var/www/tankear/data/tankear.db")

# ── Parámetros ────────────────────────────────────────────────────────────────

UMBRAL_APROBACION = 0.45   # confianza mínima para aprobar
UMBRAL_RECHAZO    = 0.10   # confianza máxima para rechazar (debajo = spam/error)

# Rangos físicamente plausibles para consumo en km/L
CONSUMO_MIN = 3.0    # menos de esto → claramente erróneo (ej. un camión pesado anda ~2.5)
CONSUMO_MAX = 35.0   # más de esto → imposible para autos de calle

# Rango de litros de tanque
TANQUE_MIN = 10.0
TANQUE_MAX = 200.0


def log(msg: str):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}", flush=True)


def conectar() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# ── Reglas de validación ──────────────────────────────────────────────────────

def validar_contribucion(row: sqlite3.Row) -> tuple[str, float]:
    """
    Valida una contribución y devuelve (estado, confianza).
    estado: 'aprobado' | 'rechazado' | 'pendiente'
    confianza: 0.0 – 1.0
    """
    puntos = 0.0
    maxp   = 0.0

    ciudad = row["consumo_ciudad"]
    mixto  = row["consumo_mixto"]
    ruta   = row["consumo_ruta"]
    tanque = row["litros_tanque"]
    km_prop = row["km_propios"] or 0

    consumos_presentes = [c for c in [ciudad, mixto, ruta] if c is not None]

    # ── Regla 1: al menos un consumo ──────────────────────────────────────────
    maxp += 1.0
    if consumos_presentes:
        puntos += 1.0
    else:
        # Sin ningún consumo: rechazar directamente
        return 'rechazado', 0.0

    # ── Regla 2: rangos plausibles ────────────────────────────────────────────
    maxp += len(consumos_presentes) * 1.0
    for c in consumos_presentes:
        if CONSUMO_MIN <= c <= CONSUMO_MAX:
            puntos += 1.0
        else:
            puntos -= 1.0  # penalización por dato absurdo

    # ── Regla 3: consistencia interna (ruta >= mixto >= ciudad) ───────────────
    if ruta is not None and mixto is not None:
        maxp += 1.0
        if ruta >= mixto:
            puntos += 1.0
        else:
            puntos -= 0.5  # penalty

    if mixto is not None and ciudad is not None:
        maxp += 1.0
        if mixto >= ciudad:
            puntos += 1.0
        else:
            puntos -= 0.5

    # ── Regla 4: tanque plausible ─────────────────────────────────────────────
    if tanque is not None:
        maxp += 1.0
        if TANQUE_MIN <= tanque <= TANQUE_MAX:
            puntos += 1.0

    # ── Regla 5: km_propios bonus (más km = más confianza) ───────────────────
    maxp += 1.0
    if km_prop >= 10000:
        puntos += 1.0
    elif km_prop >= 1000:
        puntos += 0.6
    elif km_prop >= 100:
        puntos += 0.3
    # < 100 km → no bonus

    # ── Regla 6: marca y modelo no vacíos ────────────────────────────────────
    maxp += 0.5
    if (row["marca"] or "").strip() and (row["modelo"] or "").strip():
        puntos += 0.5

    # ── Cálculo de confianza ──────────────────────────────────────────────────
    confianza = max(0.0, puntos / maxp) if maxp > 0 else 0.0
    confianza = round(confianza, 3)

    if confianza >= UMBRAL_APROBACION:
        return 'aprobado', confianza
    elif confianza < UMBRAL_RECHAZO:
        return 'rechazado', confianza
    else:
        return 'pendiente', confianza  # necesita revisión manual


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    log("=" * 60)
    log("ValidarGarage — inicio")

    conn = conectar()

    # Cargar pendientes
    pendientes = conn.execute("""
        SELECT * FROM contribuciones_consumo
        WHERE estado = 'pendiente'
    """).fetchall()

    log(f"  → {len(pendientes)} contribuciones pendientes")

    if not pendientes:
        log("Nada que procesar. Saliendo.")
        conn.close()
        return

    stats = {"aprobado": 0, "rechazado": 0, "pendiente": 0}

    for row in pendientes:
        nuevo_estado, confianza = validar_contribucion(row)
        conn.execute("""
            UPDATE contribuciones_consumo
            SET estado = ?, confianza = ?
            WHERE id = ?
        """, (nuevo_estado, confianza, row["id"]))
        stats[nuevo_estado] += 1

    conn.commit()

    log(f"Resultados:")
    log(f"  Aprobadas:  {stats['aprobado']}")
    log(f"  Rechazadas: {stats['rechazado']}")
    log(f"  Pendientes: {stats['pendiente']}  (requieren revisión manual)")

    # ── Resumen duplicados (mismo marca+modelo, múltiples contribuciones) ─────
    duplicados = conn.execute("""
        SELECT marca, modelo, COUNT(*) AS n,
               AVG(consumo_ruta) AS avg_ruta
        FROM contribuciones_consumo
        WHERE estado = 'aprobado'
          AND consumo_ruta IS NOT NULL
        GROUP BY LOWER(marca), LOWER(modelo)
        HAVING n >= 2
        ORDER BY n DESC
        LIMIT 10
    """).fetchall()

    if duplicados:
        log(f"\nModelos con múltiples contribuciones aprobadas (top 10):")
        for d in duplicados:
            log(f"  {d['marca']} {d['modelo']}: {d['n']} aportes · ruta promedio {round(d['avg_ruta'], 1)} km/L")

    conn.close()
    log("ValidarGarage finalizado OK")


if __name__ == "__main__":
    main()
