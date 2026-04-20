<p align="center">
  <img src="https://tankear.com.ar/logo.png" alt="Tankear" width="120" />
</p>

<h1 align="center">Tankear</h1>
<p align="center"><strong>El copiloto del conductor argentino</strong></p>
<p align="center">
  <a href="https://tankear.com.ar">tankear.com.ar</a> ·
  Precios de nafta en tiempo real · Cotizador de seguros · Dólar blue · Planificador de viajes · Mi Garage
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/deployed-live-22c55e" />
</p>

---

## Tabla de Contenidos

- [¿Qué es Tankear?](#qué-es-tankear)
- [Modelo de Negocio](#modelo-de-negocio)
- [Features](#features)
- [Arquitectura](#arquitectura)
- [Frontend](#frontend)
  - [Páginas](#páginas)
  - [Componentes](#componentes)
  - [Hooks](#hooks)
  - [Stack frontend](#stack-frontend)
- [Backend](#backend)
  - [Endpoints API](#endpoints-api)
  - [Base de datos](#base-de-datos)
  - [Autenticación](#autenticación)
  - [Rate limiting](#rate-limiting)
- [Scraper de precios](#scraper-de-precios)
- [APIs externas](#apis-externas)
- [Datos estáticos](#datos-estáticos)
- [Infraestructura](#infraestructura)
- [Desarrollo local](#desarrollo-local)
- [Documentación estratégica](#documentación-estratégica)
- [Estructura de directorios](#estructura-de-directorios)

---

## ¿Qué es Tankear?

**Tankear** es la plataforma de combustible más completa de Argentina. Nació como un comparador de precios de nafta y gasoil, y evolucionó en una herramienta integral para el automovilista argentino:

- Encontrá la estación más barata cerca tuyo, en tiempo real.
- Planificá un viaje de 1.600 km con paradas de combustible óptimas.
- Seguí vuelos en tiempo real sobre Argentina.
- Llevá un registro de mantenimiento, seguros y viajes de tu vehículo.
- Reportá precios y nuevas estaciones de forma colaborativa.

**100% gratuito, sin registro obligatorio, sin paywall.**

---

## Modelo de Negocio

Tankear atrae usuarios con herramientas gratuitas (precios de nafta, dólar, planificador de viajes) y los lleva al **cotizador de seguros**, que es el motor de monetización del negocio.

**Streams de ingresos:**
- **Comisiones por seguros** — Afiliado a 123seguro.com (ahora) → multicotizador propio (futuro).
- **Publicidad display** — Sidebar + banners segmentados por zona y tipo de vehículo.
- **Leads directos** — Email y celular capturados en cada touchpoint, vendibles a aseguradoras y concesionarias.
- **B2B** — Panel de flotas para empresas con múltiples vehículos (roadmap).

**Estrategia de leads:** el `FloatingLeadBanner`, el `Footer` y el `MiniLeadForm` capturan email/WhatsApp en cada página con mensajes contextuales. Los leads de mayor valor son los de VTV y seguro próximos a vencer (conversión ~80-90%).

---

## Features

### Precios de Combustible
- **Búsqueda inteligente por GPS** — Detecta tu ubicación automáticamente (GPS del browser → IP geolocalización → fallback manual). Muestra las estaciones más cercanas primero.
- **Mapa interactivo** (Leaflet + CARTO dark tiles) — Markers con precio visible sobre el mapa, filtro por radio, popup con botones de reporte.
- **Filtros avanzados** — Por provincia, localidad, barrio (CABA), empresa/bandera, tipo de combustible (Nafta Super/Premium, Gasoil G2/G3, GNC).
- **Ordenamiento múltiple** — Por distancia, precio o fecha de actualización.
- **Freshness indicators** — Chips visuales que muestran si el precio tiene 1 año, 6 meses, etc.
- **Estadísticas en vivo** — Precio promedio, mínimo, máximo, empresa más barata de la zona.
- **Gráfico histórico** — Timeline de evolución de precios por producto y zona.
- **Calculadora integrada** — 3 modos: cargar tanque, cálculo por viaje y gasto mensual por auto modelo.
- **Precios estimados** — Cuando no hay dato fresco, muestra estimación con advertencia de antigüedad.

### Cotizador de Seguros ⭐ (Motor de monetización)
- Flujo de 3 pasos: datos del vehículo (marca/modelo/año/provincia/uso/GNC/cobertura) → captura de lead → redirect al afiliado.
- El lead se captura **antes** del redirect, no después (el usuario ya fue).
- Marca y modelo con dropdowns dinámicos desde `autos.json` (300+ modelos argentinos).
- URL de afiliado construida con UTM params incluyendo marca y modelo.
- Afiliado actual: [123seguro.com](https://www.123seguro.com). Futuro: multicotizador propio.

### Comunidad (Crowdsourcing)
- **Reportar precio actual** — Cualquier usuario puede actualizar el precio de una estación.
- **Reportar problema** — Estación cerrada, ubicación incorrecta, no existe más.
- **Nueva estación** — Formulario para reportar estaciones que no están en el mapa: empresa, dirección, localidad, provincia + precio opcional.
- Todas las acciones disponibles desde el **popup del mapa**, desde las **tarjetas de la lista** y desde la **calculadora** cuando los datos son viejos.

### Calculadora de Viaje
- Ingresás origen + destino → calcula ruta completa con OSRM.
- Identifica paradas de combustible óptimas cada ~150 km.
- Para cada parada: estación más barata en 20 km de radio + litros a cargar + costo parcial.
- Clima por parada via Open-Meteo (alertas de viento patagónico, tormentas).
- Hoteles próximos a la ruta via SIT.tur.ar (Ministerio de Turismo).
- Consumo por modelo de auto (base de datos de +300 vehículos argentinos con consumo ciudad/mixto/ruta).
- Geocoding offline con dataset completo de localidades argentinas (0ms de latencia).

### Seguimiento de Vuelos en Tiempo Real
- Mapa en vivo de todos los vuelos sobre Argentina vía OpenSky Network.
- Íconos de avión rotados según heading real (true track).
- Color coding: rojo = emergencia 7700, ámbar = pérdida radio 7600, violeta = secuestro 7500, gris = en tierra, colores por aerolínea.
- **Alertas de emergencia** — Banner prominente cuando hay squawk 7700/7600/7500 activo sobre Argentina.
- Popup por vuelo: callsign, aerolínea, altitud, velocidad, heading, tasa vertical (▲/▼), squawk.
- Panel lateral con stats (total en vuelo, países de origen, aerolíneas activas) y lista con filtros.
- Fallback 3 niveles: live OpenSky → stale localStorage (30 min) → aeropuertos hardcodeados siempre visibles.
- Polling pausado cuando la pestaña está en background (ahorra rate limit).
- **Integración exclusiva**: click en un vuelo → "¿Conviene manejar?" → link al planificador con datos prellenados.

### Mi Garage (Gestión Vehicular Completa)
Módulo completo de gestión de flota personal, requiere registro:

- **Mis Autos** — CRUD de vehículos con cascading dropdowns (marca → modelo → versión), consumo ciudad/mixto/ruta, capacidad de tanque, combustible preferido.
- **Bitácora de Viajes** — Historial de viajes realizados: origen, destino, km, litros, precio/litro, costo total, tiempo, clima al momento del viaje. Agrupado por mes, con stats de consumo. Ordena de más reciente a más viejo. Filtros por año, mes, vehículo y búsqueda libre. Integración con planificador: "Guardar en bitácora" prellena los datos del viaje calculado.
- **Mantenimiento** — Historial de cambio de aceite, VTV, frenos, cubiertas, patente y más. Alertas de urgencia con semáforo visual (🔴 urgente / 🟡 pronto / 🟢 OK). Registro de talleres favoritos en localStorage.
- **Seguro** — Registro de póliza: aseguradora, cobertura, costo mensual, vencimiento. Alerta de vencimiento próximo. Benchmark de rango de precios para el modelo del vehículo. Link al cotizador de seguros.
- **Badge de alertas** en el header cuando hay mantenimiento pendiente.

### Comparativa de Precios
- Evolución histórica de precios por empresa (YPF, Shell, Axion, Puma, etc.).
- Gráfico de líneas comparativo entre compañías.
- Diferencial de precio entre la más cara y más barata.

### Dólar y Combustible
- Precio del dólar blue y oficial (via Bluelytics API, actualizado cada 15 min).
- Calculadora de equivalencia: cuántos litros de nafta por dólar.
- Evolución del tipo de cambio y su impacto en el precio del combustible.
- CTA de seguros contextual: "El dólar sube y tu seguro ajusta con él."

### Noticias
- Feed de noticias del sector energético argentino.
- Formato grid con imagen, título, bajada y fecha.

### SEO & Performance
- `lang="es-AR"` en el HTML root.
- Open Graph + Twitter Card meta tags por página.
- `useSEO()` hook reutilizable con title, description, canonical.
- Schema.org JSON-LD en Dashboard.
- `robots.txt` y `sitemap.xml` con las 24 provincias argentinas.
- Carga lazy de Leaflet (code splitting automático por Vite).

---

## Arquitectura

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              CLIENTE (Browser)                            │
│                                                                          │
│  React 18 + TypeScript + Vite                                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │Dashboard │ │ /vuelos  │ │ /viaje   │ │ /garage  │ │/comparativa  │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬───────┘  │
│       │            │            │            │              │           │
│  ┌────▼──────────────────────────────────────────────────────▼───────┐  │
│  │                        Hooks de datos                              │  │
│  │ useFuelData · useFlightData · useOSRM · useGarage · useDolar ...  │  │
│  └────────────────────────────────┬───────────────────────────────── ┘  │
└───────────────────────────────────┼──────────────────────────────────────┘
                                    │ HTTPS
┌───────────────────────────────────▼──────────────────────────────────────┐
│                       Nginx (reverse proxy)                               │
│              tankear.com.ar        → /var/www/tankear/frontend (static)   │
│              tankear.com.ar/api/*  → FastAPI :8000                        │
│              SSL via Let's Encrypt (Certbot)                              │
└───────────────────────────────────┬──────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼──────────────────────────────────────┐
│                      FastAPI (Python 3.10+)                               │
│                      uvicorn main_do:app --host 0.0.0.0 --port 8000      │
│                                                                           │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Precios    │  │  Usuarios    │  │   Garage     │  │   Vuelos     │  │
│  │  /precios/* │  │  /usuarios/* │  │  /garage/*   │  │  (proxy)     │  │
│  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                │                 │                 │           │
│  ┌──────▼────────────────▼─────────────────▼─────────────────▼───────┐  │
│  │                    SQLite DB (/data/tankear.db)                     │  │
│  └─────────────────────────────────────────────────────────────────── ┘  │
└───────────────────────────────────┬──────────────────────────────────────┘
                                    │
            ┌───────────────────────┼──────────────────────┐
            │                       │                      │
┌───────────▼──────┐   ┌────────────▼──────┐  ┌───────────▼──────┐
│  datos.gob.ar    │   │  OpenSky Network  │  │   Nominatim OSM  │
│  CSV precios     │   │  Vuelos en vivo   │  │  Reverse geocode │
│  (cron 6h)       │   │  ADS-B Argentina  │  │                  │
└──────────────────┘   └───────────────────┘  └──────────────────┘
```

---

## Frontend

### Páginas

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/` | `Dashboard.tsx` | Página principal: mapa + lista de estaciones + calculadora + estadísticas + noticias |
| `/estacion/:slug` | `StationPage.tsx` | Detalle de estación: todos los precios, mapa embebido, links a Maps/Waze |
| `/precios/:provincia` | `ProvinciaPage.tsx` | Vista de precios por provincia con filtros |
| `/comparativa` | `ComparativaPage.tsx` | Evolución histórica por empresa, gráficos comparativos |
| `/noticias` | `NoticiasPage.tsx` | Feed de noticias del sector energético |
| `/dolar` | `DolarPage.tsx` | Tipo de cambio + calculadora nafta/dólar + CTA seguros |
| `/viaje` | `RoadTripPage.tsx` | Planificador de ruta con paradas de combustible, clima y hoteles |
| `/vuelos` | `VuelosPage.tsx` | Radar de vuelos en tiempo real sobre Argentina |
| `/cotizador` | `CotizadorPage.tsx` | Cotizador de seguros con captura de lead (motor de monetización) |
| `/verificar` | `VerificarPage.tsx` | Verificación de email post-registro |

### Componentes

#### Navegación y Layout
| Componente | Descripción |
|-----------|-------------|
| `Header.tsx` | Navbar superior: logo, chip de clima, chip de Telegram, menú de usuario, badge de alertas. Auto-contenido sin prop drilling. |
| `QuickNav.tsx` | Barra de navegación rápida sticky bajo el header. Scroll-spy via IntersectionObserver. |
| `Footer.tsx` | Footer con links, canal de Telegram, newsletter (MiniLeadForm), dólar widget, clima widget. Tagline: "El copiloto del conductor argentino." |
| `AdSidebar.tsx` | Sidebar de publicidad (desktop). |
| `FloatingLeadBanner.tsx` | Banner flotante contextual (aparece a los 35s). Mensajes distintos por página: seguros en /cotizador, viaje en /viaje, dólar en /dolar, genérico en el resto. |
| `MiniLeadForm.tsx` | Formulario inline de captura de email/WhatsApp. Valida email (@) o celular (6+ dígitos). POST /leads. |

#### Combustible
| Componente | Descripción |
|-----------|-------------|
| `FuelMap.tsx` | Mapa Leaflet con markers de precios. Popup con botones "💰 Actualizar precio" y "🚩 Reportar". Modales React via `popupopen` event. |
| `StationList.tsx` | Lista de estaciones agrupadas por ubicación. Tabs por combustible, search, sort. |
| `FilterBar.tsx` | Cascading filters: Provincia → Localidad → Barrio → Empresa → Producto. |
| `PriceStats.tsx` | KPIs: precio promedio, mínimo, máximo, empresa más barata. |
| `PriceChart.tsx` | Gráfico de evolución histórica de precios con Recharts. |
| `PriceCalculator.tsx` | 3 tabs: llenar tanque / costo de viaje / gasto mensual por auto. |

#### Seguros (monetización)
| Componente | Descripción |
|-----------|-------------|
| `SeguroCalculator.tsx` | Cotizador de seguros. Flujo 3 pasos: formulario (marca/modelo/año/provincia/uso/GNC/cobertura) → captura de lead → done. Lead capturado **antes** del redirect al afiliado. Dropdowns marca/modelo dinámicos desde autos.json. |

#### Vuelos
| Componente | Descripción |
|-----------|-------------|
| `FlightMap.tsx` | Mapa Leaflet dark con íconos SVG rotados por heading real. Colores por estado de emergencia/aerolínea. |
| `FlightPanel.tsx` | Tabs "Vuelos" (lista con filtros) y "Stats". |
| `EmergencyAlert.tsx` | Banner para squawk 7700/7600/7500. Dismissible por vuelo. |

#### Mi Garage
| Componente | Descripción |
|-----------|-------------|
| `GarageSection.tsx` | Modal con 4 tabs: Mis Autos / Bitácora / Mantenimiento / Seguro. Badge en tab si hay alertas. |
| `AutosTab.tsx` | CRUD de vehículos con cascading dropdowns marca → modelo. |
| `BitacoraTab.tsx` | Timeline de viajes. Stats por mes. Integración con planificador via sessionStorage. |
| `MantenimientoTab.tsx` | Historial de servicios. Alertas urgente/pronto/OK. |
| `SeguroTab.tsx` | Card de póliza. Benchmark de precios. Alertas VTV y seguro a 15/30 días. Link al cotizador. |

#### Planificador de Viaje
| Componente | Descripción |
|-----------|-------------|
| `TripForm.tsx` | Formulario: origen, destino, auto, combustible, consumo. |
| `RouteMap.tsx` | Mapa con polyline de ruta, markers de paradas, clima y hoteles. |
| `FuelStopsPanel.tsx` | Lista de paradas con estación más barata, km, litros y costo. |
| `WeatherAlerts.tsx` | Chips de alerta climática por tramo (viento, tormenta, nieve). |

#### Comunidad
| Componente | Descripción |
|-----------|-------------|
| `CommunityActions.tsx` | Botones "Reportar" + "Precio". Modales via `ReactDOM.createPortal`. |

#### Autenticación y Usuario
| Componente | Descripción |
|-----------|-------------|
| `OnboardingModal.tsx` | Wizard de registro multi-paso. Cloudflare Turnstile. |
| `LoginModal.tsx` | Login con email/contraseña. |
| `PerfilModal.tsx` | 3 tabs: Mis datos / Mi auto / Seguridad. |

### Hooks

| Hook | Fuente de datos | Descripción |
|------|----------------|-------------|
| `useFuelData` | `GET /precios/smart` | Hook principal. Detecta ubicación (GPS → IP → manual). |
| `useFlightData` | `GET /vuelos` (proxy OpenSky) | Polling cada 10s. Fallback a localStorage 30min. |
| `useOSRM` | OSRM API | Routing + geocoding. Cascade: `ar_localidades.json` → Photon → Nominatim. |
| `useRoadTripFuel` | `GET /precios/smart` | Paradas de combustible a lo largo de ruta. |
| `useRouteWeather` | Open-Meteo | Clima por waypoint. Alertas si viento >60km/h o tormenta. |
| `useSITHoteles` | SIT.tur.ar CSV | Hoteles próximos a la ruta. Cache localStorage 24h. |
| `useUser` | `/usuarios/login` `/usuarios/me` | Auth context global. Token en localStorage. |
| `useGarage` | `GET/POST/PUT/DELETE /garage` | CRUD de vehículos del usuario. |
| `useBitacora` | `GET/POST/PUT/DELETE /bitacora` | CRUD de bitácora de viajes. |
| `useMantenimiento` | `GET/POST/PUT/DELETE /mantenimiento` | CRUD de mantenimiento + alertas. |
| `useAlertas` | `GET /garage/alertas` | Badge de alertas de mantenimiento para el header. |
| `useDolar` | Bluelytics API | USD blue/oficial. Cache localStorage 15min. |
| `useClima` | Open-Meteo / SMN | Temperatura y viento actual. |
| `useGeolocation` | Browser Geolocation API | GPS con timeout 8s y fallback. |
| `useNewsData` | `GET /noticias` | Feed de noticias. |
| `useSEO` | DOM API | Meta tags dinámicos + canonical + JSON-LD. Cleanup en unmount. |

### Stack Frontend

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| React | 18.3 | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 5.x | Build tool + HMR + code splitting |
| React Router | 6.x | Client-side routing |
| Tailwind CSS | 3.x | Utilidad CSS |
| Leaflet | 1.9 | Mapas interactivos |
| Recharts | 2.x | Gráficos de precios |
| Framer Motion | 11.x | Animaciones |
| Lucide React | latest | Iconografía |

---

## Backend

### Endpoints API

Base URL: `https://tankear.com.ar/api` (prod) · `http://localhost:8000` (dev)

Documentación interactiva (Swagger UI): `http://localhost:8000/docs`

#### Precios y Estaciones

| Método | Endpoint | Descripción |
|--------|---------|-------------|
| `GET` | `/precios/smart` | **Endpoint principal.** Búsqueda cascada: GPS → IP → provincia → fallback. Params: `lat`, `lon`, `provincia`, `localidad`, `barrio`, `producto`, `radio_km`, `limit`. |
| `GET` | `/precios/cercanos` | Estaciones en radio. Params: `lat`, `lon`, `radio_km` (def: 15). |
| `GET` | `/precios/baratos` | Más baratas. Params: `provincia`, `localidad`, `producto`. |
| `GET` | `/precios/estadisticas` | KPIs de precio por zona. |
| `GET` | `/precios/timeline` | Historial de precios. |
| `GET` | `/estacion/:slug` | Detalle de estación individual. |
| `GET` | `/provincias` | Lista de provincias con localidades. |
| `GET` | `/sitemap.xml` | SEO sitemap generado dinámicamente. |

#### Usuarios y Autenticación

| Método | Endpoint | Descripción |
|--------|---------|-------------|
| `POST` | `/usuarios/registro` | Registro. Body: `mail`, `password`, `captcha_token`. Envía email de verificación via Resend. |
| `GET` | `/verificar?token=` | Verifica email y activa la cuenta. |
| `POST` | `/usuarios/login` | Login. Retorna JWT token + perfil completo. |
| `GET` | `/usuarios/me` | Perfil del usuario autenticado. Requiere `Authorization: Bearer {token}`. |
| `PUT` | `/usuarios/perfil` | Actualizar perfil. |

#### Mi Garage

| Método | Endpoint | Descripción |
|--------|---------|-------------|
| `GET` | `/garage` | Lista vehículos del usuario. |
| `POST` | `/garage` | Agregar vehículo. |
| `PUT` | `/garage/:id` | Editar vehículo (incluye km, seguro, VTV). |
| `DELETE` | `/garage/:id` | Eliminar vehículo. |
| `GET` | `/garage/alertas` | Alertas activas: aceite, VTV, seguro (urgente/pronto/ok). |

#### Bitácora y Mantenimiento

| Método | Endpoint | Descripción |
|--------|---------|-------------|
| `GET/POST` | `/bitacora` | Listar / registrar viajes. |
| `PUT/DELETE` | `/bitacora/:id` | Editar / eliminar viaje. |
| `GET/POST` | `/mantenimiento` | Listar / registrar servicios. |
| `PUT/DELETE` | `/mantenimiento/:id` | Editar / eliminar servicio. |

#### Comunidad y Viajes

| Método | Endpoint | Descripción |
|--------|---------|-------------|
| `POST` | `/comunidad/reporte` | Reportar problema en estación. |
| `POST` | `/comunidad/precio` | Reportar precio actualizado. |
| `POST` | `/comunidad/nueva_estacion` | Reportar estación nueva. |
| `GET/POST` | `/viajes` | Listar / guardar planificación de viaje. |

#### Proxies Externos

| Método | Endpoint | Descripción |
|--------|---------|-------------|
| `GET` | `/vuelos` | Proxy a OpenSky Network con cache 12s en memoria. |
| `GET` | `/noticias` | Feed de noticias del sector. |

#### Captación y Feedback

| Método | Endpoint | Descripción |
|--------|---------|-------------|
| `POST` | `/leads` | Registrar lead (email/WhatsApp + zona + pagina_origen). Valores de `pagina_origen`: `combustible`, `cotizador_seguros`, `cotizador_seguros_float`, `road_trip_float`, `dolar_float`, `noticias_float`, `footer`. |
| `POST` | `/contacto/publicidad` | Consulta de publicidad. |
| `POST` | `/feedback` | Feedback de usuario. |

### Base de Datos

SQLite en `/var/www/tankear/data/tankear.db`. Path configurable via `DB_PATH`.

```sql
CREATE TABLE usuarios (
  id TEXT PRIMARY KEY, mail TEXT UNIQUE, celular TEXT,
  provincia TEXT, localidad TEXT,
  auto_marca TEXT, auto_modelo TEXT, auto_anio INTEGER,
  token TEXT UNIQUE, password_hash TEXT,
  verified_mail INTEGER DEFAULT 0,
  created_at TEXT, last_seen TEXT,
  failed_logins INTEGER DEFAULT 0, locked_until TEXT
);

CREATE TABLE mi_garage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id TEXT, marca TEXT, modelo TEXT, anio INTEGER,
  combustible TEXT, litros_tanque REAL,
  consumo_ciudad REAL, consumo_mixto REAL, consumo_ruta REAL,
  km_actual INTEGER, km_ultimo_aceite INTEGER,
  vencimiento_vtv TEXT, vencimiento_seguro TEXT,
  costo_seguro REAL, aseguradora TEXT, cobertura_seguro TEXT,
  created_at TEXT, updated_at TEXT
);

CREATE TABLE bitacoras_viaje (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id TEXT NOT NULL, vehiculo_id INTEGER,
  origen TEXT NOT NULL, destino TEXT NOT NULL,
  fecha_inicio TEXT NOT NULL, km_recorridos REAL,
  litros_cargados REAL, costo_total REAL, tiempo_min INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE mantenimiento_vehiculo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id TEXT NOT NULL, vehiculo_id INTEGER NOT NULL,
  tipo TEXT NOT NULL, fecha TEXT NOT NULL,
  km_vehiculo INTEGER, fecha_proxima TEXT, costo REAL,
  taller_nombre TEXT, notas TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mail TEXT, celular TEXT,
  pagina_origen TEXT DEFAULT 'combustible',
  zona TEXT, ip TEXT, fecha_registro TEXT
);
```

### Autenticación

JWT con gestión de sesiones server-side.

```
Registro  →  bcrypt hash  →  email de verificación (Resend)  →  cuenta activa
Login     →  bcrypt check  →  JWT token  →  localStorage del cliente
Requests  →  Authorization: Bearer {token}  →  verificación en backend
```

**Seguridad:** bcrypt, lockout automático, Cloudflare Turnstile en registro, tokens de verificación con expiración.

### Rate Limiting

`slowapi` aplicado por endpoint:

```python
@limiter.limit("10/hour")    # endpoints de escritura
@limiter.limit("60/minute")  # endpoints de lectura
@limiter.limit("5/hour")     # registro de usuarios
```

---

## Scraper de Precios

`scraper_do.py` — Automatiza la actualización de precios de combustible desde `datos.gob.ar`.

**Fuente principal:** Resource ID `80ac25de-a44a-4445-9215-090cf55cfda5` — CSV completo ~200k registros.
**Fallback:** CKAN API datastore_search → Wayback Machine.

```cron
0 */6 * * *   root  cd /var/www/tankear && python scraper_do.py >> /var/log/tankear-scraper.log 2>&1
```

---

## APIs Externas

| API | Uso | Auth | Cache |
|-----|-----|------|-------|
| **datos.gob.ar** | Precios combustible CSV | Ninguna | Scraper c/6h |
| **OpenSky Network** | Vuelos en vivo ADS-B | Opcional | 12s server + 30min client |
| **Open-Meteo** | Clima por coordenadas | Ninguna | 30min |
| **Nominatim (OSM)** | Reverse geocoding | Ninguna | localStorage |
| **Bluelytics** | USD blue/oficial Argentina | Ninguna | localStorage 15min |
| **OSRM** | Routing y waypoints | Ninguna | localStorage 30min |
| **ip-api.com** | IP geolocalización fallback | Ninguna | user_sessions SQLite |
| **SIT.tur.ar** | Hoteles turísticos CSV | Ninguna | localStorage 24h |
| **Resend** | Email transaccional | API Key | — |
| **Cloudflare Turnstile** | CAPTCHA en registro | Site Key / Secret | — |
| **123seguro.com** | Afiliado de seguros (actual) | UTM params | — |

---

## Datos Estáticos

### `front-end/src/data/autos.json`
+300 modelos de autos argentinos con consumo real (ciudad/mixto/ruta). Usado por `PriceCalculator`, `TripForm`, `BitacoraTab`, `SeguroCalculator`.

### `front-end/src/data/ar_localidades.json`
~4.500 localidades argentinas con coordenadas. Permite geocoding offline (0ms latencia) para el planificador.

### `front-end/src/data/airports.ts`
14 aeropuertos argentinos. Siempre visibles en el mapa de vuelos como fallback.

### `front-end/src/data/airlines.ts`
Aerolíneas con prefijos de callsign y colores para el mapa de vuelos (ARG, LAN, FBZ, JSM, etc.).

---

## Infraestructura

### Servidor

```
Digital Ocean Droplet — Ubuntu 22.04 LTS — 1 vCPU / 1GB RAM / 25GB SSD

/var/www/tankear/
├── api/main_do.py      ← FastAPI (archivo activo de producción)
├── frontend/           ← Build Vite (dist/)
├── data/tankear.db     ← SQLite DB
└── scraper_do.py
```

**Stack:** Nginx (reverse proxy) + uvicorn + systemd + Certbot (SSL).

### CI/CD

GitHub Actions (`.github/workflows/deploy.yml`) — Deploy automático en cada push a `master`:
1. Build del frontend (`npm run build`)
2. Deploy de estáticos al servidor via SSH
3. Restart uvicorn si hay cambios en backend

### Variables de Entorno

```bash
DB_PATH=/var/www/tankear/data/tankear.db
RESEND_API_KEY=re_xxxxxxxxxx
FROM_EMAIL=noreply@tankear.com.ar
TURNSTILE_SECRET=0xXXXXXXXXXXXXXXX
ADMIN_USER=admin
ADMIN_HASH=bcrypt_hash_here
NEWSAPI_KEY=xxxxxxxxxxxxxxxx
VITE_API_BASE=https://tankear.com.ar/api
```

---

## Desarrollo Local

```bash
# Clonar
git clone https://github.com/LuisRGomez/precio-combustible-api.git
cd precio-combustible-api

# Frontend
cd front-end
npm install
# Crear front-end/.env.local con: VITE_API_BASE=http://localhost:8000
npm run dev   # → http://localhost:5173

# Backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
export DB_PATH=./data/dev.db
uvicorn main_do:app --reload --port 8000
# Swagger: http://localhost:8000/docs

# Scraper (datos reales)
python scraper_do.py   # ~2-5 min, ~200k registros
```

---

## Documentación Estratégica

En `/docs/`:

| Archivo | Descripción |
|---------|-------------|
| `PLAN-MAESTRO.md` | Síntesis completa: negocio, roadmap, leads, monetización, KPIs. Empezá por acá. |
| `PRD-cotizador-seguros.md` | PRD completo del cotizador: personas, user stories, specs, analytics, timeline. |
| `ROADMAP.md` | NOW / NEXT / LATER con scoring RICE. Target: $8K MRR (NOW) → $68K MRR (LATER). |
| `SEO-AUDIT.md` | Auditoría SEO: titles/descriptions, 35+ keywords, JSON-LD, plan 90 días. |
| `COMPETITIVE-ANALYSIS.md` | Análisis vs DóndeCargo, 123seguro, Dolarito, Google Maps, Waze, GasBuddy. |
| `ESTRATEGIA-LEADS.md` | 40+ puntos de captura, valor por tipo de lead, target 50k leads/año. |
| `admin-dashboard.html` | Dashboard HTML standalone: KPIs, leads por página, tendencia 30 días. |

---

## Estructura de Directorios

```
precio-combustible-api/
├── front-end/
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.tsx         # Página principal
│       │   ├── CotizadorPage.tsx     # Motor de monetización ⭐
│       │   ├── DolarPage.tsx         # Dólar + CTA seguros
│       │   ├── RoadTripPage.tsx      # Planificador de viaje
│       │   ├── VuelosPage.tsx        # Radar de vuelos
│       │   ├── ComparativaPage.tsx
│       │   ├── NoticiasPage.tsx
│       │   ├── StationPage.tsx
│       │   ├── ProvinciaPage.tsx
│       │   └── VerificarPage.tsx
│       ├── components/
│       │   ├── Header.tsx            # Nav + Telegram chip + garage
│       │   ├── Footer.tsx            # Footer + Telegram link + newsletter
│       │   ├── FloatingLeadBanner.tsx # Banner contextual por página (35s)
│       │   ├── MiniLeadForm.tsx      # Captura email/WhatsApp inline
│       │   ├── SeguroCalculator.tsx  # Cotizador afiliado (flujo 3 pasos)
│       │   ├── FuelMap.tsx
│       │   ├── FlightMap.tsx
│       │   ├── garage/
│       │   │   └── tabs/
│       │   │       └── SeguroTab.tsx # VTV + seguro + benchmark + alertas
│       │   └── viaje/
│       ├── hooks/
│       ├── data/
│       │   ├── autos.json            # 300+ modelos con consumo
│       │   └── ar_localidades.json   # 4500 localidades geocodificadas
│       └── utils/
├── main_do.py                        # FastAPI producción
├── scraper_do.py
├── db_sqlite.py
├── geo.py
├── Procfile
├── requirements.txt
├── .github/workflows/deploy.yml      # CI/CD GitHub Actions
└── docs/                             # Documentación estratégica
```

---

## Licencia

Código propietario. Todos los derechos reservados. © 2024–2026 Tankear.

---

<p align="center">
  Hecho con ❤️ en Argentina · <a href="https://tankear.com.ar">tankear.com.ar</a> · <a href="https://t.me/tankear_ar">Telegram @tankear_ar</a>
</p>
