from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
import pandas as pd
import numpy as np
import json
import os
import uvicorn
from typing import Optional

# --- CONFIG ---
CONFIG_FILE = os.path.join(os.path.dirname(__file__), "config.json")
with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
    config = json.load(f)

API_CONFIG = config['api']
DATOS_LOCALES_CONFIG = config['datos_locales']
RESOURCE_ID = API_CONFIG['resource_id']
API_URL = API_CONFIG['base_url']

# --- APP ---
app = FastAPI(
    title="API Precios Combustible Argentina",
    description="Consulta precios de nafta y diesel en estaciones de servicio de Argentina usando datos de datos.gob.ar",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

# --- HELPERS ---
def haversine(lat1, lon1, lat2, lon2):
    if pd.isna(lat1) or pd.isna(lon1) or pd.isna(lat2) or pd.isna(lon2):
        return np.nan
    R = 6371
    phi1, phi2 = np.radians(lat1), np.radians(lat2)
    dphi = np.radians(lat2 - lat1)
    dlambda = np.radians(lon2 - lon1)
    a = np.sin(dphi/2)**2 + np.cos(phi1)*np.cos(phi2)*np.sin(dlambda/2)**2
    return R * 2 * np.arcsin(np.sqrt(a))


def obtener_datos(provincia: str, localidad: Optional[str], limit: int) -> pd.DataFrame:
    if API_CONFIG.get('usar_datos_locales'):
        return pd.DataFrame(DATOS_LOCALES_CONFIG['estaciones'])

    filtros = {"provincia": provincia.upper()}
    if localidad:
        filtros["localidad"] = localidad.upper()

    params = {
        "resource_id": RESOURCE_ID,
        "limit": limit,
        "filters": json.dumps(filtros)
    }
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

    try:
        r = requests.get(API_URL, params=params, headers=headers, timeout=API_CONFIG['timeout'])
        r.raise_for_status()
        data = r.json()
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Timeout al consultar datos.gob.ar")
    except requests.exceptions.ConnectionError:
        raise HTTPException(status_code=502, detail="No se puede alcanzar datos.gob.ar")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if not data.get('success'):
        raise HTTPException(status_code=502, detail=data.get('error', {}).get('__all__', 'Error de API externa'))

    records = data['result'].get('records', [])
    if not records:
        return pd.DataFrame()

    df = pd.DataFrame(records)

    if 'precio' in df.columns:
        df['precio'] = pd.to_numeric(df['precio'].astype(str).str.replace(',', '.'), errors='coerce')
    if 'latitud' in df.columns:
        df['latitud'] = pd.to_numeric(df['latitud'], errors='coerce')
    if 'longitud' in df.columns:
        df['longitud'] = pd.to_numeric(df['longitud'], errors='coerce')

    return df


def df_a_lista(df: pd.DataFrame) -> list:
    return [
        {k: (None if pd.isna(v) else v) for k, v in row.items()}
        for row in df.to_dict(orient='records')
    ]


# --- ENDPOINTS ---

@app.get("/", tags=["Info"])
def root():
    return {
        "nombre": "API Precios Combustible Argentina",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": ["/precios", "/precios/cercanos", "/precios/baratos", "/health"]
    }


@app.get("/health", tags=["Info"])
def health():
    return {"status": "ok"}


@app.get("/precios", tags=["Precios"])
def precios(
    provincia: str = Query(default="BUENOS AIRES", description="Nombre de la provincia"),
    localidad: Optional[str] = Query(default=None, description="Nombre de la localidad"),
    producto: Optional[str] = Query(default=None, description="Tipo de combustible (ej: Nafta 95, Diesel, GNC)"),
    limit: int = Query(default=1000, ge=1, le=5000, description="Máximo de registros a traer de la API"),
):
    """
    Devuelve estaciones de servicio filtradas por provincia, localidad y producto.
    Ordenadas por precio ascendente.
    """
    df = obtener_datos(provincia, localidad, limit)

    if df.empty:
        return {"total": 0, "estaciones": []}

    if producto:
        df = df[df['producto'].str.upper() == producto.upper()]

    if 'precio' in df.columns:
        df = df.sort_values('precio')

    cols = [c for c in ['empresa', 'direccion', 'localidad', 'provincia', 'producto', 'precio', 'latitud', 'longitud', 'fecha_vigencia'] if c in df.columns]
    df = df[cols]

    return {"total": len(df), "estaciones": df_a_lista(df)}


@app.get("/precios/cercanos", tags=["Precios"])
def precios_cercanos(
    lat: float = Query(..., description="Latitud del usuario"),
    lon: float = Query(..., description="Longitud del usuario"),
    radio_km: float = Query(default=5.0, description="Radio de búsqueda en km"),
    provincia: str = Query(default="BUENOS AIRES", description="Provincia para pre-filtrar"),
    localidad: Optional[str] = Query(default=None, description="Localidad para pre-filtrar"),
    producto: Optional[str] = Query(default=None, description="Tipo de combustible"),
    limit: int = Query(default=1000, ge=1, le=5000),
):
    """
    Devuelve estaciones dentro del radio GPS indicado, ordenadas por distancia.
    """
    df = obtener_datos(provincia, localidad, limit)

    if df.empty:
        return {"total": 0, "estaciones": []}

    if producto:
        df = df[df['producto'].str.upper() == producto.upper()]

    df['distancia_km'] = df.apply(
        lambda x: haversine(lat, lon, x.get('latitud'), x.get('longitud')), axis=1
    )
    df = df[df['distancia_km'] <= radio_km].sort_values('distancia_km')
    df['distancia_km'] = df['distancia_km'].round(2)

    cols = [c for c in ['empresa', 'direccion', 'localidad', 'provincia', 'producto', 'precio', 'latitud', 'longitud', 'distancia_km', 'fecha_vigencia'] if c in df.columns]
    df = df[cols]

    return {"total": len(df), "radio_km": radio_km, "estaciones": df_a_lista(df)}


@app.get("/precios/baratos", tags=["Precios"])
def precios_baratos(
    provincia: str = Query(default="BUENOS AIRES"),
    localidad: Optional[str] = Query(default=None),
    producto: Optional[str] = Query(default=None, description="Tipo de combustible (ej: Nafta 95)"),
    top: int = Query(default=10, ge=1, le=100, description="Cuántos resultados devolver"),
    limit: int = Query(default=1000, ge=1, le=5000),
):
    """
    Devuelve las N estaciones más baratas para un producto y zona.
    """
    df = obtener_datos(provincia, localidad, limit)

    if df.empty:
        return {"total": 0, "estaciones": []}

    if producto:
        df = df[df['producto'].str.upper() == producto.upper()]

    if 'precio' in df.columns:
        df = df.dropna(subset=['precio']).sort_values('precio').head(top)

    cols = [c for c in ['empresa', 'direccion', 'localidad', 'provincia', 'producto', 'precio', 'latitud', 'longitud', 'fecha_vigencia'] if c in df.columns]
    df = df[cols]

    return {"total": len(df), "estaciones": df_a_lista(df)}


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8002))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
