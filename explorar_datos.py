import requests
import pandas as pd
import numpy as np

# --- CONFIGURACIÓN ---
RESOURCE_ID = "energia_80ac25de-a44a-4445-9215-090cf55cfda5"
API_URL = f"https://datos.gob.ar/api/3/action/datastore_search?resource_id={RESOURCE_ID}"
USAR_DATOS_LOCALES = True  # Cambiar a False cuando la API esté disponible

def obtener_datos_locales():
    """Retorna datos de prueba locales (simulación)"""
    datos = {
        'empresa': ['YPF', 'Shell', 'Petrobras', 'ACA', 'YPF', 'Shell', 'Petrobras'],
        'direccion': [
            'Ruta 5 km 35',
            'Avenida General Paz 1500',
            'Ruta 3 km 25',
            'Moreno 450',
            'Avenida San Martín 800',
            'Ruta 2 km 40',
            'Camino a La Reja 200'
        ],
        'producto': ['Nafta 95', 'Nafta 95', 'Nafta 95', 'Nafta 95', 'Diesel', 'Diesel', 'Nafta 95'],
        'precio': [2.15, 2.18, 2.12, 2.20, 2.35, 2.38, 2.14],
        'latitud': [-34.630, -34.635, -34.640, -34.632, -34.631, -34.638, -34.634],
        'longitud': [-58.845, -58.850, -58.855, -58.848, -58.843, -58.852, -58.847],
        'provincia': ['BUENOS AIRES'] * 7,
        'localidad': ['MORENO', 'MORENO', 'MORENO', 'MORENO', 'MORENO', 'MORENO', 'MORENO'],
        'fecha_vigencia': ['2026-03-23'] * 7
    }
    return pd.DataFrame(datos)


def obtener_datos_completos(limit=1000):
    """Trae los datos de la API y los limpia"""
    if USAR_DATOS_LOCALES:
        print(f"--- Usando datos locales de prueba ---")
        df = obtener_datos_locales()
        print(f"✓ Se obtuvieron {len(df)} registros")
        return df
    
    print(f"--- Conectando a Datos.gob.ar (Trayendo {limit} registros) ---")
    try:
        url = f"{API_URL}&limit={limit}"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        r = requests.get(url, headers=headers, timeout=30)
        
        if r.status_code != 200:
            print(f"Error HTTP {r.status_code}")
            return None
        
        data = r.json()
        
        if not data.get('success'):
            print(f"API respondió con error: {data}")
            return None
        
        df = pd.DataFrame(data['result']['records'])
        print(f"✓ Se obtuvieron {len(df)} registros")
        return df
    except Exception as e:
        print(f"Error: {e}")
        return None


# --- EJECUCIÓN ---
print("=" * 80)
print("EXPLORADOR DE DATOS - Búsqueda de Combustibles")
print("=" * 80)

df_nafta = obtener_datos_completos(limit=5000)

if df_nafta is not None:
    print("\n" + "=" * 80)
    print("INFORMACIÓN GENERAL DEL DATASET")
    print("=" * 80)
    print(f"Total de registros: {len(df_nafta)}")
    print(f"\nColumnas disponibles ({len(df_nafta.columns)}):")
    for col in df_nafta.columns:
        print(f"  - {col}")
    
    print("\n" + "=" * 80)
    print("PRIMERAS 5 FILAS (todos los campos)")
    print("=" * 80)
    pd.set_option('display.max_columns', None)
    pd.set_option('display.max_colwidth', None)
    pd.set_option('display.width', None)
    print(df_nafta.head().to_string())
    
    print("\n" + "=" * 80)
    print("FILTRADO POR MORENO (todos los datos)")
    print("=" * 80)
    moreno = df_nafta[df_nafta['localidad'].str.upper() == 'MORENO']
    print(f"Registros en MORENO: {len(moreno)}")
    print("\n" + moreno.to_string(index=False))
    
    print("\n" + "=" * 80)
    print("ESTADÍSTICAS Y TIPOS DE DATOS")
    print("=" * 80)
    print("\nTipos de datos:")
    print(df_nafta.dtypes)
    
    print("\n\nValores únicos por columna:")
    for col in df_nafta.columns:
        unique_count = df_nafta[col].nunique()
        print(f"  {col}: {unique_count} valores únicos")
        if unique_count <= 10:
            print(f"    → {df_nafta[col].unique().tolist()}")
    
    print("\n" + "=" * 80)
    print("RESUMEN ESTADÍSTICO (si hay columnas numéricas)")
    print("=" * 80)
    print(df_nafta.describe().to_string())
