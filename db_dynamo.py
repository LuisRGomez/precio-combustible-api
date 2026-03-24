"""
DynamoDB backend — drop-in replacement for db_sqlite.py.
Implements the same public interface so main.py y geo.py no necesitan cambios.

Tables (created by template.yaml):
  combustible-sessions:     PK=ip (TTL=1h)
  combustible-localidades:  PK=provincia, SK=localidad
  combustible-historico:    PK=localidad#provincia#producto, SK=fecha (YYYY-MM-DD)
"""

import math
import os
import time
from decimal import Decimal
from typing import Optional

import boto3
from boto3.dynamodb.conditions import Key

REGION            = os.environ.get("AWS_DEFAULT_REGION",          "sa-east-1")
TABLE_SESSIONS    = os.environ.get("DYNAMODB_TABLE_SESSIONS",    "combustible-sessions")
TABLE_LOCALIDADES = os.environ.get("DYNAMODB_TABLE_LOCALIDADES", "combustible-localidades")
TABLE_HISTORICO   = os.environ.get("DYNAMODB_TABLE_HISTORICO",   "combustible-historico")

SESSION_TTL_SECONDS = 3600  # 1 hora

_dynamodb        = boto3.resource("dynamodb", region_name=REGION)
_tbl_sessions    = _dynamodb.Table(TABLE_SESSIONS)
_tbl_localidades = _dynamodb.Table(TABLE_LOCALIDADES)
_tbl_historico   = _dynamodb.Table(TABLE_HISTORICO)


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _strip_none(d: dict) -> dict:
    return {k: v for k, v in d.items() if v is not None}


def _dec_to_float(value) -> Optional[float]:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _to_decimal(value) -> Optional[Decimal]:
    if value is None:
        return None
    try:
        f = float(value)
        if not math.isfinite(f) or f == 0.0:
            return None
        return Decimal(str(round(f, 6)))
    except (TypeError, ValueError):
        return None


def _paginate_query(table, **kwargs) -> list:
    response = table.query(**kwargs)
    items = response.get("Items", [])
    while "LastEvaluatedKey" in response:
        response = table.query(ExclusiveStartKey=response["LastEvaluatedKey"], **kwargs)
        items.extend(response.get("Items", []))
    return items


def _paginate_scan(table, **kwargs) -> list:
    response = table.scan(**kwargs)
    items = response.get("Items", [])
    while "LastEvaluatedKey" in response:
        response = table.scan(ExclusiveStartKey=response["LastEvaluatedKey"], **kwargs)
        items.extend(response.get("Items", []))
    return items


# ─── Init (no-op para DynamoDB) ──────────────────────────────────────────────

def init_db():
    """No-op: tablas creadas por CloudFormation/SAM."""
    pass


# ─── Sessions ─────────────────────────────────────────────────────────────────

def save_session(ip: str, lat: Optional[float], lon: Optional[float],
                 localidad: Optional[str], provincia: Optional[str], source: str):
    item = {
        "ip":         ip,
        "lat":        _to_decimal(lat),
        "lon":        _to_decimal(lon),
        "localidad":  (localidad or "").strip().upper() or None,
        "provincia":  (provincia or "").strip().upper() or None,
        "source":     source,
        "ttl":        int(time.time()) + SESSION_TTL_SECONDS,
        "updated_at": int(time.time()),
    }
    _tbl_sessions.put_item(Item=_strip_none(item))


def get_session(ip: str, max_age_hours: int = 1) -> Optional[dict]:
    response = _tbl_sessions.get_item(Key={"ip": ip})
    item = response.get("Item")
    if not item:
        return None
    # Client-side freshness check (TTL deletion puede tardar hasta 48h)
    if (int(time.time()) - int(item.get("updated_at", 0))) > max_age_hours * 3600:
        return None
    return {
        "ip":         item.get("ip"),
        "lat":        _dec_to_float(item.get("lat")),
        "lon":        _dec_to_float(item.get("lon")),
        "localidad":  item.get("localidad"),
        "provincia":  item.get("provincia"),
        "source":     item.get("source"),
        "updated_at": item.get("updated_at"),
    }


# ─── Localidades ─────────────────────────────────────────────────────────────

def seed_localidades(records: list):
    with _tbl_localidades.batch_writer() as batch:
        for rec in records:
            localidad = (rec.get("localidad") or "").strip().upper()
            provincia = (rec.get("provincia") or "").strip().upper()
            if not localidad or not provincia:
                continue
            item = {
                "provincia":     provincia,
                "localidad":     localidad,
                "lat":           _to_decimal(rec.get("lat")),
                "lon":           _to_decimal(rec.get("lon")),
                "codigo_postal": (rec.get("codigo_postal") or "").strip() or None,
            }
            batch.put_item(Item=_strip_none(item))


def localidades_seeded() -> bool:
    response = _tbl_localidades.scan(Limit=1, Select="COUNT")
    return response.get("Count", 0) > 0


def get_localidad_coords(localidad: str, provincia: str) -> Optional[dict]:
    response = _tbl_localidades.get_item(Key={
        "provincia": provincia.upper().strip(),
        "localidad": localidad.upper().strip(),
    })
    item = response.get("Item")
    if not item:
        return None
    return {
        "lat":           _dec_to_float(item.get("lat")),
        "lon":           _dec_to_float(item.get("lon")),
        "codigo_postal": item.get("codigo_postal"),
    }


def query_localidades(provincia: Optional[str] = None) -> list:
    if provincia:
        items = _paginate_query(
            _tbl_localidades,
            KeyConditionExpression=Key("provincia").eq(provincia.upper().strip())
        )
    else:
        items = _paginate_scan(_tbl_localidades)

    result = [
        {
            "localidad":     item.get("localidad"),
            "provincia":     item.get("provincia"),
            "lat":           _dec_to_float(item.get("lat")),
            "lon":           _dec_to_float(item.get("lon")),
            "codigo_postal": item.get("codigo_postal"),
        }
        for item in items
    ]
    return sorted(result, key=lambda x: (x.get("provincia") or "", x.get("localidad") or ""))


def query_provincias() -> list:
    items = _paginate_scan(_tbl_localidades, ProjectionExpression="provincia")
    return sorted(set(item["provincia"] for item in items if item.get("provincia")))


def localidades_count() -> int:
    _tbl_localidades.reload()
    return _tbl_localidades.item_count or 0


def _haversine_simple(lat1, lon1, lat2, lon2) -> float:
    R = 6371
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlam/2)**2
    return R * 2 * math.asin(math.sqrt(a))


def localidad_mas_cercana(lat: float, lon: float, provincia: str = None) -> Optional[dict]:
    if provincia:
        items = _paginate_query(
            _tbl_localidades,
            KeyConditionExpression=Key("provincia").eq(provincia.upper().strip()),
            FilterExpression="attribute_exists(#lt) AND attribute_exists(lon)",
            ExpressionAttributeNames={"#lt": "lat"},
        )
    else:
        items = _paginate_scan(
            _tbl_localidades,
            FilterExpression="attribute_exists(#lt) AND attribute_exists(lon)",
            ExpressionAttributeNames={"#lt": "lat"},
        )

    best, best_dist = None, float("inf")
    for item in items:
        item_lat = _dec_to_float(item.get("lat"))
        item_lon = _dec_to_float(item.get("lon"))
        if item_lat is None or item_lon is None:
            continue
        try:
            d = _haversine_simple(lat, lon, item_lat, item_lon)
        except Exception:
            continue
        if d < best_dist:
            best_dist = d
            best = {
                "localidad":    item["localidad"],
                "provincia":    item["provincia"],
                "lat":          item_lat,
                "lon":          item_lon,
                "distancia_km": round(d, 1),
            }
    return best


# ─── Historico (solo DynamoDB, usado por /precios/tendencia) ─────────────────

def get_historico(localidad: str, provincia: str, producto: str,
                  fecha_desde: Optional[str] = None,
                  fecha_hasta: Optional[str] = None) -> list:
    pk = f"{localidad.upper().strip()}#{provincia.upper().strip()}#{producto.upper().strip()}"
    kce = Key("pk").eq(pk)
    if fecha_desde and fecha_hasta:
        kce = kce & Key("fecha").between(fecha_desde, fecha_hasta)
    elif fecha_desde:
        kce = kce & Key("fecha").gte(fecha_desde)
    elif fecha_hasta:
        kce = kce & Key("fecha").lte(fecha_hasta)

    items = _paginate_query(_tbl_historico, KeyConditionExpression=kce, ScanIndexForward=True)
    return [
        {
            "fecha":   item.get("fecha"),
            "precio":  _dec_to_float(item.get("precio")),
            "empresa": item.get("empresa"),
            "bandera": item.get("bandera"),
        }
        for item in items
    ]
