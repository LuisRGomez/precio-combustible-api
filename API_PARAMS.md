# 📋 PARÁMETROS DE LA API DE DATOS.GOB.AR

## URL Base
```
https://datos.gob.ar/api/3/action/datastore_search
```

## Parámetros Disponibles

### 1️⃣ OBLIGATORIOS

| Parámetro | Tipo | Ejemplo | Descripción |
|-----------|------|---------|-------------|
| `resource_id` | string | `energia_80ac25de-a44a-4445-9215-090cf55cfda5` | ID único del dataset de combustibles |

### 2️⃣ PAGINACIÓN

| Parámetro | Tipo | Rango | Descripción |
|-----------|------|-------|-------------|
| `limit` | int | 1-32000 | Registros por página (default: 100) |
| `offset` | int | ≥ 0 | Saltar N registros (default: 0) |

### 3️⃣ BÚSQUEDA Y FILTRADO

| Parámetro | Tipo | Ejemplo | Descripción |
|-----------|------|---------|-------------|
| `fields` | string (CSV) | `empresa,producto,precio` | Solo traer estas columnas |
| `filters` | JSON | `{"provincia":"BUENOS AIRES"}` | Filtrar por valores específicos |
| `sort` | string (CSV) | `precio asc` | Ordenamiento (asc/desc) |
| `q` | string | `YPF` | Búsqueda de texto en todos los campos |

### 4️⃣ FORMATO

| Parámetro | Tipo | Valor | Descripción |
|-----------|------|-------|-------------|
| `format` | string | `json`, `xml`, `csv` | Formato de respuesta (default: json) |

## 📝 Ejemplos de Consultas

### Ejemplo 1: Todos los registros de una provincia
```
GET /api/3/action/datastore_search?resource_id=energia_80ac25de-a44a-4445-9215-090cf55cfda5&limit=100&filters={"provincia":"BUENOS AIRES"}
```

### Ejemplo 2: Solo nafta en MORENO
```
GET /api/3/action/datastore_search?resource_id=energia_80ac25de-a44a-4445-9215-090cf55cfda5&limit=100&filters={"localidad":"MORENO","producto":"Nafta 95"}
```

### Ejemplo 3: Buscar por empresa
```
GET /api/3/action/datastore_search?resource_id=energia_80ac25de-a44a-4445-9215-090cf55cfda5&q=YPF&limit=50
```

### Ejemplo 4: Solo ciertos campos
```
GET /api/3/action/datastore_search?resource_id=energia_80ac25de-a44a-4445-9215-090cf55cfda5&fields=empresa,precio,localidad&limit=100
```

### Ejemplo 5: Paginación (página 2, 50 registros/página)
```
GET /api/3/action/datastore_search?resource_id=energia_80ac25de-a44a-4445-9215-090cf55cfda5&limit=50&offset=50
```

## 🔍 Campos Disponibles en el Dataset

```
- _id                 (ID del registro)
- empresa             (YPF, Shell, Petrobras, ACA, etc.)
- direccion           (Ubicación física)
- producto            (Nafta 95, Nafta 98, Diesel, GNC, etc.)
- precio              (Precio en pesos)
- latitud             (GPS)
- longitud            (GPS)
- provincia           (Provincia de Argentina)
- localidad           (Ciudad/Municipio)
- fecha_vigencia      (Fecha del registro)
```

## 🚀 Cómo Enviar en Python

### Con `requests`:
```python
import requests

# Búsqueda simple
response = requests.get(
    "https://datos.gob.ar/api/3/action/datastore_search",
    params={
        "resource_id": "energia_80ac25de-a44a-4445-9215-090cf55cfda5",
        "limit": 100,
        "filters": {"provincia": "BUENOS AIRES"}
    }
)

data = response.json()
print(data['result']['records'])
```

### Con filtros avanzados:
```python
import json

params = {
    "resource_id": "energia_80ac25de-a44a-4445-9215-090cf55cfda5",
    "limit": 50,
    "filters": json.dumps({
        "localidad": "MORENO",
        "producto": "Nafta 95"
    }),
    "sort": "precio asc"
}

response = requests.get(
    "https://datos.gob.ar/api/3/action/datastore_search",
    params=params
)
```

## ⚠️ Limitaciones/Consideraciones

- La API puede tardar si pides muchos registros
- Los datos se actualizan diariamente aprox
- Timeout recomendado: 30-60 segundos
- Sin autenticación, hay rate limiting (requests/minuto)
- Los precios se devuelven como strings con comas (requiere limpieza)

---

**¿Qué quieres hacer?**
1. Eliminar todo mock y conectar a la API directamente
2. Agregar filtros más específicos
3. Cambiar el formato de respuesta
