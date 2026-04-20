# API Precios Combustible Argentina — Documentación Frontend

## Base URL
```
https://tvcpev0ryc.execute-api.sa-east-1.amazonaws.com
```

> **CORS**: `Access-Control-Allow-Origin: *` — libre desde cualquier origen.
> **Protocolo**: HTTPS, solo `GET`.
> **Infraestructura**: AWS Lambda (sa-east-1) + DynamoDB — sin cold start significativo, sin sleep.

---

## Tipos comunes

### Estacion
Todos los endpoints de precios devuelven estaciones con esta estructura:

```ts
interface Estacion {
  empresa:        string;           // Razón social legal (ej: "ALISO SRL")
  bandera:        string | null;    // Marca comercial (ej: "YPF", "Shell", "Axion", "PUMA", "Gulf")
  cuit:           string | null;    // CUIT de la empresa (ej: "30-56222704-7")
  direccion:      string;           // "HIPOLITO YRIGOYEN 305"
  localidad:      string;           // "MORON" (uppercase)
  provincia:      string;           // "BUENOS AIRES"
  region:         string | null;    // "PAMPEANA" | "PATAGONICA" | "NOA" | "NEA" | "CUYO"
  latitud:        number | null;    // -34.6523 (null si no disponible)
  longitud:       number | null;    // -58.4332 (null si no disponible)
  producto:       string;           // ver Productos
  precio:         number | null;    // 1789.0 (ARS)
  tipohorario:    string | null;    // "Diurno" | "Nocturno"
  fecha_vigencia: string | null;    // "2026-03-13T10:06:00" (ISO 8601, sin tz)
  distancia_km?:  number;           // solo en endpoints con radio GPS
  precio_vigente?: boolean;         // solo en /precios/smart cuando se envía fecha_desde
                                    // true → precio actualizado dentro del rango pedido
                                    // false → precio anterior a fecha_desde (mostrar badge ⚠️)
}
```

> **`bandera`** es el campo para mostrar logos: YPF, Shell, Axion, PUMA, Gulf, Petrobras, etc.
> **`empresa`** es la razón social legal (puede ser diferente a la marca).
> **`precio_vigente`** solo aparece en `/precios/smart` cuando se pasa `fecha_desde`. Usarlo para mostrar un badge como `"⚠️ Precio de Jun 2023"` cuando es `false`.

### Productos (valores exactos del dataset)
```
"GNC"
"Gas Oil Grado 2"
"Gas Oil Grado 3"
"Nafta (súper) entre 92 y 95 Ron"
"Nafta (premium) de más de 95 Ron"
```
> El filtro `producto` es **case-insensitive** (la API hace `.upper()` internamente).

### Provincias
```
BUENOS AIRES · CABA · CATAMARCA · CHACO · CHUBUT · CORDOBA
CORRIENTES · ENTRE RIOS · FORMOSA · JUJUY · LA PAMPA · LA RIOJA
MENDOZA · MISIONES · NEUQUEN · RIO NEGRO · SALTA · SAN JUAN
SAN LUIS · SANTA CRUZ · SANTA FE · SANTIAGO DEL ESTERO
TIERRA DEL FUEGO · TUCUMAN
```
> Usar **sin tildes** (CORDOBA no CÓRDOBA). CABA es la Ciudad Autónoma de Buenos Aires.

---

## Endpoints

---

### `GET /`
Metadatos básicos de la API.

**Respuesta**
```json
{
  "nombre": "API Precios Combustible Argentina",
  "version": "2.0.0",
  "docs": "/docs",
  "endpoints": ["/info", "/health", "/provincias", "/localidades",
                "/precios", "/precios/cercanos", "/precios/baratos", "/precios/smart"]
}
```

---

### `GET /health`
Estado del servicio.

**Respuesta**
```json
{ "status": "ok", "localidades_cacheadas": 1127 }
```

---

### `GET /info`
Metadatos del dataset fuente.

**Respuesta**
```json
{
  "dataset": "Precios en surtidor - Resolución 314/2016",
  "fuente": "datos.energia.gob.ar",
  "resource_id": "80ac25de-a44a-4445-9215-090cf55cfda5",
  "last_modified": "2026-03-24T22:00:24.961262"
}
```

---

### `GET /provincias`
Lista de provincias disponibles en el dataset.

**Respuesta**
```json
{
  "total": 24,
  "fuente": "cache",
  "provincias": ["BUENOS AIRES", "CABA", "CORDOBA", ...]
}
```

---

### `GET /localidades`
Localidades de una provincia con coordenadas.

**Query params**

| Param | Tipo | Requerido | Default | Descripción |
|---|---|---|---|---|
| `provincia` | string | ✅ | — | Nombre exacto sin tildes |

**Respuesta**
```json
{
  "total": 286,
  "localidades": [
    {
      "localidad": "MORÓN",
      "provincia": "BUENOS AIRES",
      "lat": -34.65321,
      "lon": -58.61953,
      "codigo_postal": null
    }
  ]
}
```

**Uso típico**: poblar un `<select>` de localidades al elegir provincia.

---

### `GET /precios`
Estaciones filtradas por zona, ordenadas por precio (más barato primero).

**Query params**

| Param | Tipo | Requerido | Default | Descripción |
|---|---|---|---|---|
| `provincia` | string | ✅ | `BUENOS AIRES` | Nombre exacto sin tildes |
| `localidad` | string | ❌ | — | Filtro adicional por localidad |
| `producto` | string | ❌ | — | Ver lista de Productos |
| `fecha_desde` | `YYYY-MM-DD` | ❌ | — | Solo precios vigentes desde esta fecha |
| `limit` | int (1–5000) | ❌ | `1000` | Máx registros del dataset a procesar |

**Respuesta**
```json
{
  "total": 84,
  "estaciones": [ /* Estacion[] */ ]
}
```

**Ejemplo**
```
GET /precios?provincia=BUENOS+AIRES&localidad=MORON&producto=Gas+Oil+Grado+2
```

---

### `GET /precios/baratos`
Las N estaciones más baratas para un producto y zona.

**Query params**

| Param | Tipo | Requerido | Default | Descripción |
|---|---|---|---|---|
| `provincia` | string | ✅ | `BUENOS AIRES` | |
| `localidad` | string | ❌ | — | |
| `producto` | string | ❌ | — | Si se omite, el "más barato" puede ser GNC |
| `fecha_desde` | `YYYY-MM-DD` | ❌ | — | |
| `top` | int (1–100) | ❌ | `10` | Cuántas estaciones devolver |
| `limit` | int (1–5000) | ❌ | `1000` | |

**Respuesta**
```json
{
  "total": 10,
  "estaciones": [ /* Estacion[] — ordenadas precio ASC */ ]
}
```

> ⚠️ **Siempre pasar `producto`** para resultados útiles. Sin él puede devolver GNC primero.

---

### `GET /precios/cercanos`
Estaciones dentro de un radio GPS, ordenadas por distancia.

> ℹ️ Para mayor inteligencia de ubicación usar `/precios/smart`. Este endpoint
> requiere que el front le pase `provincia` además de las coordenadas.

**Query params**

| Param | Tipo | Requerido | Default | Descripción |
|---|---|---|---|---|
| `lat` | float | ✅ | — | Latitud GPS |
| `lon` | float | ✅ | — | Longitud GPS |
| `provincia` | string | ✅ | `BUENOS AIRES` | Provincia para pre-filtrar el dataset |
| `localidad` | string | ❌ | — | Localidad dentro de la provincia |
| `radio_km` | float | ❌ | `5.0` | Radio de búsqueda en km |
| `producto` | string | ❌ | — | |
| `fecha_desde` | `YYYY-MM-DD` | ❌ | — | |
| `limit` | int | ❌ | `1000` | |

**Respuesta**
```json
{
  "total": 12,
  "radio_km": 5.0,
  "estaciones": [ /* Estacion[] con distancia_km, ordenadas ASC */ ]
}
```

---

### `GET /precios/smart` ⭐ Endpoint principal

Endpoint inteligente con resolución automática de ubicación. No requiere que el front sepa la provincia del usuario.

**Cascada de ubicación** (de mayor a menor precisión):
1. 🎯 **GPS exacto** → coordenadas del dispositivo → Nominatim para nombre de localidad
2. 📍 **Sesión GPS cacheada** → coordenadas de una request GPS previa (1 hora de vida)
3. 🌐 **IP geolocalización** → ip-api.com (solo provincia, coordenadas imprecisas)
4. 📌 **Params explícitos** → `provincia` + `localidad` pasados directamente
5. 🏙️ **Capital de provincia** → si solo hay provincia
6. 🔵 **Default** → Buenos Aires

**Query params**

| Param | Tipo | Requerido | Default | Descripción |
|---|---|---|---|---|
| `lat` | float | ❌ | — | Latitud GPS del usuario |
| `lon` | float | ❌ | — | Longitud GPS del usuario |
| `provincia` | string | ❌ | — | Sobrescribe la detección automática |
| `localidad` | string | ❌ | — | Sobrescribe la detección automática |
| `radio_km` | float | ❌ | `10.0` | Radio de búsqueda (solo cuando hay coords) |
| `producto` | string | ❌ | — | Filtro por combustible |
| `fecha_desde` | `YYYY-MM-DD` | ❌ | — | **Graceful degradation**: si no hay precios recientes en el área, devuelve los últimos disponibles con un aviso |
| `limit` | int (1–5000) | ❌ | `500` | |

**Respuesta completa**
```json
{
  "ubicacion_resuelta": {
    "method":             "gps",
    "precision":          "exacta",
    "lat":                -34.61557837743971,
    "lon":                -58.832944581843975,
    "localidad":          "LA REJA",
    "provincia":          "BUENOS AIRES",
    "geocoded":           true,
    "localidad_detectada": "LA REJA",
    "localidad_dataset":  "LA REJA",
    "distancia_dataset_km": 2.7,
    "advertencia_fecha":  "No hay precios actualizados desde 2026-02-22 en el radio. Se muestran los últimos precios disponibles.",
    "radio_ampliado":     null,
    "provincia_ajustada": null,
    "nota":               null
  },
  "total": 27,
  "estaciones": [ /* Estacion[] con distancia_km */ ]
}
```

**`ubicacion_resuelta` — campos**

| Campo | Tipo | Descripción |
|---|---|---|
| `method` | `"gps"` \| `"ip_cache"` \| `"ip_geo"` \| `"localidad"` | Método usado |
| `precision` | `"exacta"` \| `"localidad"` \| `"provincia"` \| `"aproximada"` | Nivel de precisión |
| `lat` | `number \| null` | Latitud resuelta |
| `lon` | `number \| null` | Longitud resuelta |
| `localidad` | `string \| null` | Localidad detectada |
| `provincia` | `string \| null` | Provincia detectada |
| `geocoded` | `true \| null` | `true` si se hizo reverse-geocoding (Nominatim) |
| `localidad_detectada` | `string \| null` | Localidad según GPS/IP (puede no estar en el dataset) |
| `localidad_dataset` | `string \| null` | Localidad más cercana que sí existe en el dataset |
| `distancia_dataset_km` | `number \| null` | Distancia entre `localidad_detectada` y `localidad_dataset` |
| `advertencia_fecha` | `string \| null` | Aviso si no hay precios recientes en el área (los datos mostrados pueden ser más antiguos) |
| `radio_ampliado` | `true \| null` | Se usó radio × 2 como último recurso |
| `provincia_ajustada` | `string \| null` | Provincia alternativa que se usó (ej: CABA→BA si IP era errónea) |
| `nota` | `string \| null` | Nota textual sobre el ajuste de provincia |

**`method` — cómo usarlo en UI**

```ts
switch (ubicacion.method) {
  case "gps":
    // Precisión máxima — mostrar pin exacto en mapa
    break;
  case "ip_cache":
    // Coordenadas GPS previas reutilizadas — igual de preciso
    break;
  case "ip_geo":
    // Aproximado por IP — mostrar banner "Ubicación aproximada"
    break;
  case "localidad":
    // El usuario seleccionó provincia+localidad manualmente
    break;
}
```

**Casos de uso típicos del frontend**

```
# 1. Usuario dio permiso de GPS
GET /precios/smart?lat=-34.6155&lon=-58.8329&radio_km=10&producto=Nafta+(súper)+entre+92+y+95+Ron

# 2. Sin GPS — la API usa IP automáticamente
GET /precios/smart?radio_km=10&producto=Gas+Oil+Grado+2

# 3. Usuario eligió manualmente
GET /precios/smart?provincia=SANTA+FE&localidad=ROSARIO&producto=GNC

# 4. Con fecha de referencia (se aplica con graceful degradation)
GET /precios/smart?lat=...&lon=...&fecha_desde=2026-02-01&radio_km=15
```

---

### `GET /precios/tendencia`
Serie histórica de precios para una localidad y producto.
El scraper corre diariamente a las 03:00 ART, acumulando un registro por día.

**Query params**

| Param | Tipo | Requerido | Default | Descripción |
|---|---|---|---|---|
| `localidad` | string | ✅ | — | Ej: `MORON` |
| `provincia` | string | ✅ | — | Ej: `BUENOS AIRES` |
| `producto` | string | ✅ | — | Nombre **exacto** del producto (case-insensitive) |
| `fecha_desde` | `YYYY-MM-DD` | ❌ | Hoy − 30 días | |
| `fecha_hasta` | `YYYY-MM-DD` | ❌ | Hoy | |

**Respuesta**
```json
{
  "localidad":     "MORON",
  "provincia":     "BUENOS AIRES",
  "producto":      "NAFTA (SÚPER) ENTRE 92 Y 95 RON",
  "fecha_desde":   "2026-02-24",
  "fecha_hasta":   "2026-03-24",
  "total_dias":    28,
  "precio_actual": 1176.0,
  "precio_minimo": 1089.0,
  "precio_maximo": 1176.0,
  "variacion_pct": 7.99,
  "tendencia": [
    {
      "fecha":   "2026-02-24",
      "precio":  1089.0,
      "empresa": "RIDWAY S.A.",
      "bandera": null
    }
    // ... un item por día
  ]
}
```

> **Nota**: `total_dias` crece desde el primer deploy (24/03/2026). Para backfill histórico
> invocar el scraper manualmente con `{"fecha": "YYYY-MM-DD"}`.

---

## Comportamientos importantes para el frontend

### 1. `localidad` en respuestas — CABA
Las estaciones en CABA tienen `localidad: "CAPITAL FEDERAL"` (nombre del dataset fuente), pero `provincia: "CABA"`. El frontend debe manejar ambos como la misma ciudad.

```ts
const esCABA = (est: Estacion) =>
  est.provincia === "CABA" || est.localidad === "CAPITAL FEDERAL";
```

### 2. `fecha_vigencia` puede ser muy antigua
El dataset incluye registros históricos. Algunas estaciones tienen precios de 2017–2024. Usar `fecha_desde` para filtrar, pero considerar la `advertencia_fecha` del smart endpoint (la API ya hace graceful degradation).

```ts
// Mostrar badge "precio desactualizado" si > 60 días
const esDesactualizado = (fecha: string | null) => {
  if (!fecha) return true;
  const dias = (Date.now() - new Date(fecha).getTime()) / 86400000;
  return dias > 60;
};
```

### 3. `latitud` / `longitud` pueden ser `null`
Algunas estaciones no tienen coordenadas en el dataset. Verificar antes de pintar en mapa.

```ts
const tieneCoords = (est: Estacion) =>
  est.latitud !== null && est.longitud !== null;
```

### 4. `advertencia_fecha` en `/precios/smart`
Cuando el radio no tiene precios recientes, la API devuelve los más recientes disponibles con aviso. Mostrar al usuario:

```ts
if (response.ubicacion_resuelta.advertencia_fecha) {
  showBanner(response.ubicacion_resuelta.advertencia_fecha, "warning");
}
```

### 5. `radio_ampliado: true`
La API no encontró nada dentro del radio pedido y usó el doble. Informar al usuario que los resultados son más lejanos de lo esperado.

### 6. Sesión GPS (ip_cache)
Una vez que el usuario da permiso de GPS, las coords se cachean 1 hora en el servidor. La siguiente request **sin GPS** seguirá usando esas coordenadas (`method: "ip_cache", precision: "exacta"`). Esto permite que el usuario cierre y abra la app sin pedir GPS de vuelta.

---

## Configuración recomendada en el frontend

### `utils/api.ts`
```ts
export const API_BASE = "https://tvcpev0ryc.execute-api.sa-east-1.amazonaws.com";

// Timeout generoso — Lambda puede tener cold start en primera request del día
export const API_TIMEOUT_MS = 15_000;

export async function fetchSmart(params: {
  lat?: number;
  lon?: number;
  provincia?: string;
  localidad?: string;
  producto?: string;
  radio_km?: number;
  fecha_desde?: string;
  limit?: number;
}) {
  const q = new URLSearchParams();
  if (params.lat   != null) q.set("lat",         String(params.lat));
  if (params.lon   != null) q.set("lon",         String(params.lon));
  if (params.provincia)     q.set("provincia",    params.provincia);
  if (params.localidad)     q.set("localidad",    params.localidad);
  if (params.producto)      q.set("producto",     params.producto);
  if (params.radio_km)      q.set("radio_km",     String(params.radio_km));
  if (params.fecha_desde)   q.set("fecha_desde",  params.fecha_desde);
  if (params.limit)         q.set("limit",        String(params.limit));

  const res = await fetch(`${API_BASE}/precios/smart?${q}`, {
    signal: AbortSignal.timeout(API_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<SmartResponse>;
}
```

### Tipos TypeScript completos
```ts
export interface Estacion {
  empresa:        string;           // Razón social legal
  bandera:        string | null;    // Marca: "YPF" | "Shell" | "Axion" | "PUMA" | "Gulf" | ...
  cuit:           string | null;    // "30-56222704-7"
  direccion:      string;
  localidad:      string;
  provincia:      string;
  region:         string | null;    // "PAMPEANA" | "PATAGONICA" | "NOA" | "NEA" | "CUYO"
  latitud:        number | null;
  longitud:       number | null;
  producto:       string;
  precio:         number | null;
  tipohorario:    string | null;    // "Diurno" | "Nocturno"
  fecha_vigencia: string | null;
  distancia_km?:  number;
}

export interface UbicacionResuelta {
  method:               "gps" | "ip_cache" | "ip_geo" | "localidad";
  precision:            "exacta" | "localidad" | "provincia" | "aproximada";
  lat:                  number | null;
  lon:                  number | null;
  localidad:            string | null;
  provincia:            string | null;
  geocoded:             true | null;
  localidad_detectada:  string | null;
  localidad_dataset:    string | null;
  distancia_dataset_km: number | null;
  advertencia_fecha:    string | null;
  radio_ampliado:       true | null;
  provincia_ajustada:   string | null;
  nota:                 string | null;
}

export interface SmartResponse {
  ubicacion_resuelta: UbicacionResuelta;
  total:              number;
  estaciones:         Estacion[];
}

export interface PreciosResponse {
  total:      number;
  radio_km?:  number;    // solo en /precios/cercanos
  estaciones: Estacion[];
}

export interface TendenciaResponse {
  localidad:     string;
  provincia:     string;
  producto:      string;
  fecha_desde:   string;
  fecha_hasta:   string;
  total_dias:    number;
  precio_actual: number | null;
  precio_minimo: number | null;
  precio_maximo: number | null;
  variacion_pct: number | null;
  tendencia:     Array<{
    fecha:    string;
    precio:   number;
    empresa:  string;
    bandera:  string | null;
  }>;
}

export interface Localidad {
  localidad:       string;
  provincia:       string;
  lat:             number | null;
  lon:             number | null;
  codigo_postal:   string | null;
}

export const PRODUCTOS = [
  "GNC",
  "Gas Oil Grado 2",
  "Gas Oil Grado 3",
  "Nafta (súper) entre 92 y 95 Ron",
  "Nafta (premium) de más de 95 Ron",
] as const;

export type Producto = typeof PRODUCTOS[number];
```

---

## Flujo recomendado de la app

```
App abre
  │
  ├─ ¿Tiene permiso GPS?
  │     SÍ → /precios/smart?lat=...&lon=...&radio_km=10
  │     NO  → /precios/smart?radio_km=10  (usa IP automáticamente)
  │
  ├─ Mostrar mapa/lista con ubicacion_resuelta.localidad + provincia
  │
  ├─ Si advertencia_fecha → banner amarillo
  ├─ Si method === "ip_geo" → banner "Ubicación aproximada por IP"
  ├─ Si radio_ampliado === true → "Resultados ampliados: no hay estaciones en X km"
  │
  └─ Usuario selecciona filtros (producto, radio) → nueva llamada a /precios/smart
```

---

## Errores HTTP

| Código | Descripción |
|---|---|
| `200` | OK |
| `422` | Parámetro inválido (ej: `fecha_desde` mal formateado) |
| `501` | `/precios/tendencia` fuera de entorno AWS |
| `502` | Error al contactar datos.energia.gob.ar |
| `504` | Timeout del dataset (reintentar) |

---

## Datos actuales (al 2026-03-24)
- **Registros en dataset**: 36.773
- **Localidades con coords**: 1.127
- **Provincias cubiertas**: 24
- **Histórico disponible desde**: 2026-03-24 (crece 1 día/día automáticamente)
- **Actualización de precios**: diaria a las 03:00 ART vía EventBridge cron
