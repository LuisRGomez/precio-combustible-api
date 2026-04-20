import sqlite3
import math
import os
from typing import Optional
from datetime import datetime, timedelta

DB_PATH = os.environ.get('DB_PATH', '/var/www/tankear/data/tankear.db')


def _conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")       # mejor concurrencia lectura/escritura
    conn.execute("PRAGMA busy_timeout=5000")       # esperar 5s si hay lock
    return conn


def init_db():
    conn = _conn()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS user_sessions (
            ip          TEXT PRIMARY KEY,
            lat         REAL,
            lon         REAL,
            localidad   TEXT,
            provincia   TEXT,
            source      TEXT,
            updated_at  TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS localidades (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            localidad     TEXT NOT NULL,
            provincia     TEXT NOT NULL,
            lat           REAL,
            lon           REAL,
            codigo_postal TEXT
        );
        CREATE UNIQUE INDEX IF NOT EXISTS idx_loc_unique ON localidades(localidad, provincia);
        CREATE INDEX IF NOT EXISTS idx_loc_prov ON localidades(provincia);

        CREATE TABLE IF NOT EXISTS meta (
            key   TEXT PRIMARY KEY,
            value TEXT
        );

        CREATE TABLE IF NOT EXISTS estaciones (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            empresa         TEXT,
            bandera         TEXT,
            cuit            TEXT,
            direccion       TEXT,
            localidad       TEXT,
            provincia       TEXT,
            region          TEXT,
            latitud         REAL,
            longitud        REAL,
            producto        TEXT,
            precio          REAL,
            tipohorario     TEXT,
            fecha_vigencia  TEXT,
            fecha_scraping  TEXT DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_est_prov ON estaciones(provincia);
        CREATE INDEX IF NOT EXISTS idx_est_prov_loc ON estaciones(provincia, localidad);
        CREATE INDEX IF NOT EXISTS idx_est_producto ON estaciones(producto);

        /* ── Histórico de precios (snapshot diario) ─────────────────── */
        CREATE TABLE IF NOT EXISTS precios_historico (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            empresa         TEXT,
            bandera         TEXT,
            direccion       TEXT,
            localidad       TEXT,
            provincia       TEXT,
            producto        TEXT,
            precio          REAL,
            fecha_vigencia  TEXT,
            fecha_snapshot  TEXT DEFAULT (date('now')),
            UNIQUE(empresa, direccion, producto, fecha_snapshot)
        );
        CREATE INDEX IF NOT EXISTS idx_hist_fecha ON precios_historico(fecha_snapshot);
        CREATE INDEX IF NOT EXISTS idx_hist_prov_prod ON precios_historico(provincia, producto);

        /* ── Comunidad: reportes de estaciones ──────────────────────── */
        CREATE TABLE IF NOT EXISTS reportes_estacion (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            empresa         TEXT,
            bandera         TEXT,
            direccion       TEXT,
            localidad       TEXT,
            provincia       TEXT,
            tipo            TEXT NOT NULL,
            comentario      TEXT,
            ip_reporter     TEXT,
            created_at      TEXT DEFAULT (datetime('now')),
            estado          TEXT DEFAULT 'pendiente'
        );
        CREATE INDEX IF NOT EXISTS idx_rep_est ON reportes_estacion(empresa, direccion);

        /* ── Comunidad: precios reportados por usuarios ─────────────── */
        CREATE TABLE IF NOT EXISTS precios_comunidad (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            empresa         TEXT,
            bandera         TEXT,
            direccion       TEXT,
            localidad       TEXT,
            provincia       TEXT,
            producto        TEXT,
            precio          REAL,
            ip_reporter     TEXT,
            created_at      TEXT DEFAULT (datetime('now')),
            estado          TEXT DEFAULT 'pendiente'
        );
        CREATE INDEX IF NOT EXISTS idx_pc_est ON precios_comunidad(empresa, direccion);
        CREATE INDEX IF NOT EXISTS idx_pc_prov ON precios_comunidad(provincia);

        /* ── Precios estimados (ciencia de datos, IDW + tendencia) ──── */
        CREATE TABLE IF NOT EXISTS precios_estimados (
            id               INTEGER PRIMARY KEY AUTOINCREMENT,
            empresa          TEXT,
            bandera          TEXT,
            direccion        TEXT,
            localidad        TEXT,
            provincia        TEXT,
            latitud          REAL,
            longitud         REAL,
            producto         TEXT,
            precio_real      REAL,
            fecha_real       TEXT,
            dias_stale       INTEGER,
            precio_estimado  REAL,
            confianza        REAL,
            n_vecinos        INTEGER,
            distancia_max_km REAL,
            metodo           TEXT,
            fecha_calculo    TEXT DEFAULT (datetime('now')),
            UNIQUE(empresa, direccion, producto)
        );
        CREATE INDEX IF NOT EXISTS idx_pe_prov_prod ON precios_estimados(provincia, producto);
        CREATE INDEX IF NOT EXISTS idx_pe_coords ON precios_estimados(latitud, longitud);
    """)
    conn.commit()
    conn.close()


# ─── Sessions ────────────────────────────────────────────────────────────────

def save_session(ip: str, lat: Optional[float], lon: Optional[float],
                 localidad: Optional[str], provincia: Optional[str], source: str):
    conn = _conn()
    conn.execute("""
        INSERT OR REPLACE INTO user_sessions (ip, lat, lon, localidad, provincia, source, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    """, (ip, lat, lon, localidad, provincia, source))
    conn.commit()
    conn.close()


def get_session(ip: str, max_age_hours: int = 1) -> Optional[dict]:
    conn = _conn()
    row = conn.execute("""
        SELECT * FROM user_sessions
        WHERE ip = ? AND updated_at >= datetime('now', ?)
    """, (ip, f'-{max_age_hours} hours')).fetchone()
    conn.close()
    return dict(row) if row else None


# ─── Localidades ─────────────────────────────────────────────────────────────

def seed_localidades(records: list):
    conn = _conn()
    conn.executemany("""
        INSERT OR IGNORE INTO localidades (localidad, provincia, lat, lon, codigo_postal)
        VALUES (:localidad, :provincia, :lat, :lon, :codigo_postal)
    """, records)
    conn.execute("INSERT OR REPLACE INTO meta (key, value) VALUES ('loc_seeded_at', datetime('now'))")
    conn.commit()
    conn.close()


def localidades_seeded() -> bool:
    conn = _conn()
    row = conn.execute("SELECT value FROM meta WHERE key = 'loc_seeded_at'").fetchone()
    conn.close()
    if not row:
        return False
    try:
        seeded_at = datetime.fromisoformat(row[0])
        return (datetime.utcnow() - seeded_at) < timedelta(hours=24)
    except Exception:
        return False


def get_localidad_coords(localidad: str, provincia: str) -> Optional[dict]:
    conn = _conn()
    row = conn.execute("""
        SELECT lat, lon, codigo_postal FROM localidades
        WHERE localidad = ? AND provincia = ?
        LIMIT 1
    """, (localidad.upper().strip(), provincia.upper().strip())).fetchone()
    conn.close()
    return dict(row) if row else None


def query_localidades(provincia: Optional[str] = None) -> list:
    conn = _conn()
    if provincia:
        rows = conn.execute(
            "SELECT localidad, provincia, lat, lon, codigo_postal FROM localidades WHERE provincia = ? ORDER BY localidad",
            (provincia.upper().strip(),)
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT localidad, provincia, lat, lon, codigo_postal FROM localidades ORDER BY provincia, localidad"
        ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def query_provincias() -> list:
    conn = _conn()
    rows = conn.execute(
        "SELECT DISTINCT provincia FROM localidades ORDER BY provincia"
    ).fetchall()
    conn.close()
    return [r[0] for r in rows]


def localidades_count() -> int:
    conn = _conn()
    row = conn.execute("SELECT COUNT(*) FROM localidades").fetchone()
    conn.close()
    return row[0] if row else 0


def _haversine_simple(lat1, lon1, lat2, lon2) -> float:
    R = 6371
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi  = math.radians(lat2 - lat1)
    dlam  = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlam/2)**2
    return R * 2 * math.asin(math.sqrt(a))


def localidad_mas_cercana(lat: float, lon: float, provincia: str = None) -> Optional[dict]:
    conn = _conn()
    q = "SELECT localidad, provincia, lat, lon FROM localidades WHERE lat IS NOT NULL AND lon IS NOT NULL"
    params = []
    if provincia:
        q += " AND provincia = ?"
        params.append(provincia.upper().strip())
    rows = conn.execute(q, params).fetchall()
    conn.close()

    if not rows:
        return None

    best, best_dist = None, float('inf')
    for row in rows:
        try:
            d = _haversine_simple(lat, lon, row['lat'], row['lon'])
        except Exception:
            continue
        if d < best_dist:
            best_dist = d
            best = {"localidad": row['localidad'], "provincia": row['provincia'],
                    "lat": row['lat'], "lon": row['lon'], "distancia_km": round(d, 1)}
    return best


# ─── Estaciones (safe save) ─────────────────────────────────────────────────

def save_estaciones(records: list, min_count: int = 1000):
    """Reemplaza estaciones SOLO si el dataset nuevo tiene al menos min_count registros.
    Usa transacción atómica: si falla el INSERT, el DELETE se revierte."""
    if len(records) < min_count:
        raise ValueError(
            f"Solo {len(records)} registros (mínimo {min_count}). "
            f"Abortando para proteger los {estaciones_count()} existentes."
        )
    conn = _conn()
    try:
        conn.execute("BEGIN IMMEDIATE")
        conn.execute("DELETE FROM estaciones")
        conn.executemany("""
            INSERT INTO estaciones (empresa, bandera, cuit, direccion, localidad, provincia,
                                    region, latitud, longitud, producto, precio, tipohorario,
                                    fecha_vigencia, fecha_scraping)
            VALUES (:empresa, :bandera, :cuit, :direccion, :localidad, :provincia,
                    :region, :latitud, :longitud, :producto, :precio, :tipohorario,
                    :fecha_vigencia, datetime('now'))
        """, records)
        conn.execute("INSERT OR REPLACE INTO meta (key, value) VALUES ('estaciones_updated_at', datetime('now'))")
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def get_estaciones(provincia: Optional[str] = None, localidad: Optional[str] = None,
                   producto: Optional[str] = None, limit: int = 2000) -> list:
    conn = _conn()
    q = "SELECT * FROM estaciones WHERE 1=1"
    params = []
    if provincia:
        q += " AND provincia = ?"
        params.append(provincia.upper().strip())
    if localidad:
        q += " AND localidad = ?"
        params.append(localidad.upper().strip())
    if producto:
        q += " AND producto LIKE ?"
        params.append(f"%{producto}%")
    q += " ORDER BY precio ASC LIMIT ?"
    params.append(limit)
    rows = conn.execute(q, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def estaciones_count() -> int:
    conn = _conn()
    try:
        row = conn.execute("SELECT COUNT(*) FROM estaciones").fetchone()
        conn.close()
        return row[0] if row else 0
    except Exception:
        conn.close()
        return 0


def estaciones_age_hours() -> Optional[float]:
    conn = _conn()
    row = conn.execute("SELECT value FROM meta WHERE key = 'estaciones_updated_at'").fetchone()
    conn.close()
    if not row:
        return None
    try:
        updated = datetime.fromisoformat(row[0])
        return (datetime.utcnow() - updated).total_seconds() / 3600
    except Exception:
        return None


# ─── Histórico de precios ───────────────────────────────────────────────────

def snapshot_precios():
    """Copia las estaciones actuales al histórico (1 snapshot por día, dedup por UNIQUE)."""
    conn = _conn()
    result = conn.execute("""
        INSERT OR IGNORE INTO precios_historico
            (empresa, bandera, direccion, localidad, provincia, producto, precio, fecha_vigencia, fecha_snapshot)
        SELECT empresa, bandera, direccion, localidad, provincia, producto, precio, fecha_vigencia, date('now')
        FROM estaciones
        WHERE precio IS NOT NULL
    """)
    inserted = result.rowcount
    conn.commit()
    conn.close()
    return inserted


def get_price_history(provincia: Optional[str] = None, producto: Optional[str] = None,
                      localidad: Optional[str] = None, days: int = 90) -> list:
    """Devuelve serie temporal de precios promedio agrupados por día."""
    conn = _conn()
    q = """SELECT fecha_snapshot, producto,
                  ROUND(AVG(precio), 0) as precio_promedio,
                  ROUND(MIN(precio), 0) as precio_min,
                  ROUND(MAX(precio), 0) as precio_max,
                  COUNT(*) as estaciones
           FROM precios_historico
           WHERE fecha_snapshot >= date('now', ?)"""
    params = [f'-{days} days']
    if provincia:
        q += " AND provincia = ?"
        params.append(provincia.upper().strip())
    if localidad:
        q += " AND localidad = ?"
        params.append(localidad.upper().strip())
    if producto:
        q += " AND producto LIKE ?"
        params.append(f"%{producto}%")
    q += " GROUP BY fecha_snapshot, producto ORDER BY fecha_snapshot, producto"
    rows = conn.execute(q, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def cleanup_historico(keep_days: int = 365):
    """Borra snapshots más viejos que keep_days."""
    conn = _conn()
    conn.execute("DELETE FROM precios_historico WHERE fecha_snapshot < date('now', ?)",
                 (f'-{keep_days} days',))
    conn.commit()
    conn.close()


# ─── Comunidad: reportes de estaciones ──────────────────────────────────────

def create_reporte_estacion(data: dict) -> int:
    conn = _conn()
    cur = conn.execute("""
        INSERT INTO reportes_estacion
            (empresa, bandera, direccion, localidad, provincia, tipo, comentario, ip_reporter)
        VALUES (:empresa, :bandera, :direccion, :localidad, :provincia, :tipo, :comentario, :ip_reporter)
    """, data)
    id_ = cur.lastrowid
    conn.commit()
    conn.close()
    return id_


def get_reportes_estacion(empresa: Optional[str] = None, direccion: Optional[str] = None,
                          provincia: Optional[str] = None, limit: int = 50) -> list:
    conn = _conn()
    q = "SELECT id, empresa, bandera, direccion, localidad, provincia, tipo, comentario, created_at, estado FROM reportes_estacion WHERE 1=1"
    params = []
    if empresa:
        q += " AND empresa = ?"
        params.append(empresa)
    if direccion:
        q += " AND direccion = ?"
        params.append(direccion)
    if provincia:
        q += " AND provincia = ?"
        params.append(provincia.upper().strip())
    q += " ORDER BY created_at DESC LIMIT ?"
    params.append(limit)
    rows = conn.execute(q, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def count_reportes_activos(empresa: str, direccion: str) -> int:
    """Cuenta reportes pendientes/confirmados para una estación (para mostrar en el frontend)."""
    conn = _conn()
    row = conn.execute("""
        SELECT COUNT(*) FROM reportes_estacion
        WHERE empresa = ? AND direccion = ? AND estado IN ('pendiente', 'confirmado')
    """, (empresa, direccion)).fetchone()
    conn.close()
    return row[0] if row else 0


# ─── Comunidad: precios reportados ──────────────────────────────────────────

def create_precio_comunidad(data: dict) -> int:
    conn = _conn()
    cur = conn.execute("""
        INSERT INTO precios_comunidad
            (empresa, bandera, direccion, localidad, provincia, producto, precio, ip_reporter)
        VALUES (:empresa, :bandera, :direccion, :localidad, :provincia, :producto, :precio, :ip_reporter)
    """, data)
    id_ = cur.lastrowid
    conn.commit()
    conn.close()
    return id_


def get_precios_comunidad(empresa: Optional[str] = None, direccion: Optional[str] = None,
                          provincia: Optional[str] = None, producto: Optional[str] = None,
                          days: int = 30, limit: int = 50) -> list:
    conn = _conn()
    q = """SELECT id, empresa, bandera, direccion, localidad, provincia, producto, precio, created_at, estado
           FROM precios_comunidad
           WHERE created_at >= datetime('now', ?) """
    params = [f'-{days} days']
    if empresa:
        q += " AND empresa = ?"
        params.append(empresa)
    if direccion:
        q += " AND direccion = ?"
        params.append(direccion)
    if provincia:
        q += " AND provincia = ?"
        params.append(provincia.upper().strip())
    if producto:
        q += " AND producto LIKE ?"
        params.append(f"%{producto}%")
    q += " ORDER BY created_at DESC LIMIT ?"
    params.append(limit)
    rows = conn.execute(q, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def has_recent_reporte(ip: str, empresa: str, direccion: str, hours: int = 24) -> bool:
    """Evita spam: True si esta IP ya reportó esta estación en las últimas N horas."""
    conn = _conn()
    row = conn.execute("""
        SELECT COUNT(*) FROM reportes_estacion
        WHERE ip_reporter = ? AND empresa = ? AND direccion = ? AND created_at >= datetime('now', ?)
    """, (ip, empresa, direccion, f'-{hours} hours')).fetchone()
    conn.close()
    return row[0] > 0 if row else False


def has_recent_precio(ip: str, empresa: str, direccion: str, producto: str, hours: int = 24) -> bool:
    """Evita spam: True si esta IP ya reportó precio para esta estación+producto en N horas."""
    conn = _conn()
    row = conn.execute("""
        SELECT COUNT(*) FROM precios_comunidad
        WHERE ip_reporter = ? AND empresa = ? AND direccion = ? AND producto = ?
              AND created_at >= datetime('now', ?)
    """, (ip, empresa, direccion, producto, f'-{hours} hours')).fetchone()
    conn.close()
    return row[0] > 0 if row else False


# ─── Precios estimados (ciencia de datos) ───────────────────────────────────

def upsert_precios_estimados(records: list):
    """Inserta o reemplaza estimaciones. records: lista de dicts con todas las columnas."""
    conn = _conn()
    conn.executemany("""
        INSERT OR REPLACE INTO precios_estimados
            (empresa, bandera, direccion, localidad, provincia, latitud, longitud,
             producto, precio_real, fecha_real, dias_stale,
             precio_estimado, confianza, n_vecinos, distancia_max_km, metodo, fecha_calculo)
        VALUES
            (:empresa, :bandera, :direccion, :localidad, :provincia, :latitud, :longitud,
             :producto, :precio_real, :fecha_real, :dias_stale,
             :precio_estimado, :confianza, :n_vecinos, :distancia_max_km, :metodo, datetime('now'))
    """, records)
    conn.commit()
    conn.close()


def get_precios_estimados(provincia: Optional[str] = None, localidad: Optional[str] = None,
                          producto: Optional[str] = None, confianza_min: float = 0.3,
                          limit: int = 200) -> list:
    """Devuelve estimaciones filtradas. Útil para frontend y como fallback del smart endpoint."""
    conn = _conn()
    q = """SELECT empresa, bandera, direccion, localidad, provincia, latitud, longitud,
                  producto, precio_estimado, confianza, n_vecinos, distancia_max_km,
                  metodo, dias_stale, precio_real, fecha_real, fecha_calculo
           FROM precios_estimados
           WHERE confianza >= ?"""
    params: list = [confianza_min]
    if provincia:
        q += " AND provincia = ?"
        params.append(provincia.upper().strip())
    if localidad:
        q += " AND localidad = ?"
        params.append(localidad.upper().strip())
    if producto:
        q += " AND producto LIKE ?"
        params.append(f"%{producto}%")
    q += " ORDER BY confianza DESC LIMIT ?"
    params.append(limit)
    rows = conn.execute(q, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_estaciones_stale(min_dias: int = 60, max_dias: int = 730) -> list:
    """Devuelve estaciones con precio viejo (para calcular estimaciones IDW)."""
    conn = _conn()
    rows = conn.execute("""
        SELECT empresa, bandera, direccion, localidad, provincia, latitud, longitud,
               producto, precio, fecha_vigencia,
               CAST(julianday('now') - julianday(fecha_vigencia) AS INTEGER) AS dias_stale
        FROM estaciones
        WHERE fecha_vigencia IS NOT NULL
          AND latitud IS NOT NULL AND longitud IS NOT NULL
          AND precio > 100
          AND julianday('now') - julianday(fecha_vigencia) BETWEEN ? AND ?
        ORDER BY dias_stale ASC
    """, (min_dias, max_dias)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_estaciones_fresh(max_dias: int = 30) -> list:
    """Devuelve estaciones con precio reciente (vecinos para IDW)."""
    conn = _conn()
    rows = conn.execute("""
        SELECT empresa, bandera, direccion, localidad, provincia, latitud, longitud,
               producto, precio, fecha_vigencia
        FROM estaciones
        WHERE fecha_vigencia IS NOT NULL
          AND latitud IS NOT NULL AND longitud IS NOT NULL
          AND precio > 100
          AND julianday('now') - julianday(fecha_vigencia) <= ?
        ORDER BY fecha_vigencia DESC
    """, (max_dias,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]
