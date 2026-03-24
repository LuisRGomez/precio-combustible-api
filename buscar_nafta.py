import requests
import pandas as pd
import numpy as np
import json
import os

# --- CARGAR CONFIGURACIÓN ---
CONFIG_FILE = "config.json"
if not os.path.exists(CONFIG_FILE):
    print(f"Error: {CONFIG_FILE} no encontrado")
    exit(1)

with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
    config = json.load(f)

API_CONFIG = config['api']
DATOS_LOCALES_CONFIG = config['datos_locales']
BUSQUEDA_CONFIG = config['busqueda']

RESOURCE_ID = API_CONFIG['resource_id']
API_URL = f"{API_CONFIG['base_url']}?resource_id={RESOURCE_ID}"
USAR_DATOS_LOCALES = API_CONFIG['usar_datos_locales']

def obtener_datos_locales():
    """Retorna datos de prueba locales desde config.json"""
    return pd.DataFrame(DATOS_LOCALES_CONFIG['estaciones'])

def haversine(lat1, lon1, lat2, lon2):
    """Calcula la distancia en km entre dos puntos GPS"""
    if pd.isna(lat1) or pd.isna(lon1) or pd.isna(lat2) or pd.isna(lon2):
        return np.nan
    R = 6371  # Radio de la Tierra en km
    phi1, phi2 = np.radians(lat1), np.radians(lat2)
    dphi = np.radians(lat2 - lat1)
    dlambda = np.radians(lon2 - lon1)
    a = np.sin(dphi/2)**2 + np.cos(phi1)*np.cos(phi2)*np.sin(dlambda/2)**2
    return R * 2 * np.arcsin(np.sqrt(a))

def obtener_datos_completos(limit=1000):
    """Trae los datos de la API y los limpia"""
    if USAR_DATOS_LOCALES:
        print(f"--- Usando datos locales de prueba ---")
        df = obtener_datos_locales()
        print(f"✓ Se obtuvieron {len(df)} registros")
        return df
    
    print(f"--- Conectando a Datos.gob.ar ---")
    try:
        params = {
            "resource_id": RESOURCE_ID,
            "limit": limit,
            "filters": json.dumps(API_CONFIG.get('filtros', {}))
        }
        
        print(f"📍 Parámetros de búsqueda:")
        print(f"   - Límite: {limit} registros")
        if API_CONFIG.get('filtros'):
            for key, val in API_CONFIG['filtros'].items():
                print(f"   - {key}: {val}")
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        r = requests.get(
            API_URL, 
            params=params,
            headers=headers, 
            timeout=API_CONFIG['timeout']
        )
        
        print(f"✓ Status HTTP: {r.status_code}")
        
        if r.status_code != 200:
            print(f"❌ Error HTTP {r.status_code}")
            print(f"Respuesta: {r.text[:500]}")
            return None
        
        data = r.json()
        
        if not data.get('success'):
            print(f"❌ La API retornó error:")
            print(f"   {data.get('error', {}).get('__all__', 'Error desconocido')}")
            return None
        
        records = data['result'].get('records', [])
        df = pd.DataFrame(records)
        
        if len(df) == 0:
            print("⚠️  No se encontraron registros con esos filtros")
            return df
        
        print(f"✓ Se obtuvieron {len(df)} registros")
        
        # Limpieza de Precios (vienen como string con coma)
        if 'precio' in df.columns:
            df['precio'] = df['precio'].astype(str).str.replace(',', '.').astype(float)
        
        # Limpieza de Coordenadas
        if 'latitud' in df.columns:
            df['latitud'] = pd.to_numeric(df['latitud'], errors='coerce')
        if 'longitud' in df.columns:
            df['longitud'] = pd.to_numeric(df['longitud'], errors='coerce')
        
        return df
    except requests.exceptions.Timeout:
        print(f"❌ Timeout: La API tardó más de {API_CONFIG['timeout']} segundos")
        return None
    except requests.exceptions.ConnectionError:
        print("❌ Error de conexión: No se puede alcanzar la API")
        return None
    except json.JSONDecodeError as e:
        print(f"❌ Error JSON: {e}")
        return None
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        import traceback
        traceback.print_exc()
        return None

def filtrar_combustible(df, provincia="BUENOS AIRES", localidad=None, lat_user=None, lon_user=None, radio_km=10):
    """Filtro híbrido: Ubicación administrativa + GPS"""
    
    # 1. Filtro por Provincia (Siempre obligatorio para limpiar rápido)
    res = df[df['provincia'].str.upper() == provincia.upper()].copy()
    
    # 2. Filtro por Localidad (Si se provee)
    if localidad:
        res = res[res['localidad'].str.upper() == localidad.upper()]
    
    # 3. Filtro por GPS (Si se proveen coordenadas)
    if lat_user and lon_user:
        res['distancia_km'] = res.apply(
            lambda x: haversine(lat_user, lon_user, x['latitud'], x['longitud']), axis=1
        )
        # Filtramos por radio y ordenamos por cercanía
        res = res[res['distancia_km'] <= radio_km].sort_values('distancia_km')
    else:
        # Si no hay GPS, ordenamos por precio
        res = res.sort_values('precio')
        res['distancia_km'] = "N/A"

    return res[['empresa', 'direccion', 'producto', 'precio', 'distancia_km', 'fecha_vigencia']]

# --- EJECUCIÓN ---
df_nafta = obtener_datos_completos(limit=API_CONFIG['limit'])

if df_nafta is not None:
    print("\n--- RESULTADOS ENCONTRADOS ---")
    resultados = filtrar_combustible(
        df_nafta, 
        provincia=BUSQUEDA_CONFIG['provincia'], 
        localidad=BUSQUEDA_CONFIG['localidad'], 
        lat_user=BUSQUEDA_CONFIG['latitud_usuario'], 
        lon_user=BUSQUEDA_CONFIG['longitud_usuario'],
        radio_km=BUSQUEDA_CONFIG['radio_km']
    )
    
    if not resultados.empty:
        print(resultados.to_string(index=False))
    else:
        print("No se encontraron estaciones con esos filtros.")
