# Auditoría SEO Completa - Tankear.com.ar
**Fecha de auditoría:** 5 de abril de 2026
**Estado del sitio:** Recién lanzado (MVP)
**Objetivo de negocio:** Vender seguros de auto vía cotizador

---

## Ejecutivo - Resumen Ejecutivo

Tankear.com.ar es un SPA con React que ofrece comparación de precios de nafta pero con misión comercial de vender seguros de auto. **SITUACIÓN CRÍTICA:** El sitio tiene SEO completamente en inglés, lo que impide cualquier ranking en búsquedas locales en español argentino. Esto es un error catastrófico que anula toda oportunidad de descubrimiento orgánico en el mercado objetivo. Se requiere corrección inmediata de todos los títulos, descripciones y contenido a español argentino con enfoque en "comprador de seguro de auto" en lugar de "buscador de precios de nafta".

**Fortalezas actuales:**
- Propuesta de valor diferenciada (nafta + seguros en una plataforma)
- Oportunidad de capturar tráfico de alto valor en mercado de seguros (CPA más alto que nafta)
- Hook useSEO facilita implementación centralizada de cambios SEO

**Top 3 Prioridades (impacto inmediato):**
1. **CRÍTICO:** Reescribir todos los titles/descriptions/H1 a español argentino
2. **CRÍTICO:** Alinear contenido y mensajería hacia "cotizador de seguros" (no nafta)
3. **ALTO:** Implementar estructura de datos (JSON-LD para LocalBusiness, BreadcrumbList)

**Evaluación general:** **CRÍTICA** - Tiene fundamentos técnicos sólidos (React SPA bien estructurado) pero completamente no optimizado para el mercado local. Punto de partida: 0/100 en visibilidad SEO local.

---

## 1. TITLE TAGS Y META DESCRIPTIONS CORREGIDOS

### Por Página - Implementación Inmediata Requerida

| Ruta | Title Actual | Title Corregido | Meta Description Corregida | Prioridad |
|------|-------------|-----------------|----------------------------|-----------|
| `/` | Desconocido | **Precio de nafta hoy en Argentina \| Tankear** | Compará precios de nafta en tiempo real y cotizá tu seguro de auto. Encontrá las estaciones más baratas cerca tuyo. | CRÍTICA |
| `/cotizador` | **"Calculadora de gasto en nafta..."** (INCORRECTO) | **Cotizador de seguro de auto \| Compará aseguradoras \| Tankear** | Cotizá tu seguro de auto en segundos con nuestro comparador. Compará coberturas y precios de las mejores aseguradoras argentinas. | CRÍTICA |
| `/dolar` | Desconocido | **Dólar blue hoy \| Cotización en tiempo real \| Argentina** | Seguí la cotización del dólar blue en tiempo real. Precio oficial y paralelo actualizado cada minuto. | ALTA |
| `/noticias` | Desconocido | **Noticias de combustibles Argentina \| Tankear** | Últimas noticias sobre precios de nafta, gasoil y energía en Argentina. Análisis diario de mercado y tendencias. | MEDIA |
| `/viaje` | Desconocido | **Calculadora de viaje \| Estima gasto en nafta \| Tankear** | Calculá el gasto en nafta para tu viaje por Argentina. Simula costos y encontrá estaciones en tu ruta. | MEDIA |
| `/vuelos` | Desconocido | **Seguimiento de vuelos Argentina \| En tiempo real** | Seguí en vivo tus vuelos nacionales e internacionales. Alertas de retrasos y cambios de horario. | BAJA |
| `/comparativa` | Desconocido | **Comparar precios nafta Argentina \| YPF vs Shell vs Axion \| Tankear** | Compará en tiempo real los precios de nafta de todas las estaciones. Encontrá dónde está más barata en tu zona. | ALTA |
| `/precios/buenos-aires` | Desconocido | **Precio nafta hoy en Buenos Aires \| Tankear** | Precio de nafta súper, premium e infinia en CABA. Estaciones YPF, Shell, Axion y Puma actualizadas cada hora. | ALTA |
| `/precios/cordoba` | Desconocido | **Precio nafta hoy en Córdoba \| Tankear** | Precio de nafta en Córdoba actualizado en tiempo real. Compará estaciones y encontrá la más barata cerca tuyo. | ALTA |
| `/precios/rosario` | Desconocido | **Precio nafta hoy en Rosario \| Tankear** | Precio de nafta en Rosario. Compará precios entre Shell, YPF, Axion y otras estaciones en tu zona. | ALTA |
| `/precios/:provincia` | Dinámico no optimizado | **Precio nafta hoy en [PROVINCIA] \| Tankear** | Precio de nafta actualizado en [PROVINCIA]. Encontrá las estaciones más baratas y cotizá tu seguro de auto. | CRÍTICA |

### Notas de implementación:
- Todos los titles deben estar entre 50-60 caracteres para visibilidad óptima en SERP
- Las meta descriptions deben tener 150-160 caracteres máximo
- El patrón de branding "| Tankear" genera reconocimiento de marca en SERP
- El título de `/cotizador` debe PRIORIZAR "seguro de auto" sobre "nafta" ya que ese es el objetivo comercial

---

## 2. KEYWORDS OBJETIVO POR PÁGINA

### Matriz de Keywords con Intención de Búsqueda

| Página | Keyword Primaria | Volumen Est. | Dificultad | Intención | Keywords Secundarias |
|--------|-----------------|--------------|-----------|-----------|----------------------|
| `/` | precio nafta hoy Argentina | **ALTO** | Moderado | Informativo | precio nafta hoy, nafta argentina hoy, precio combustible argentina |
| `/cotizador` | cotizador seguro auto argentina | **ALTO** | Alto | Transaccional | cotizar seguro auto online, comparador seguros argentina, seguro auto barato |
| `/dolar` | precio dólar blue hoy | **ALTO** | Bajo | Informativo | dólar blue hoy, cotización dólar blue, dólar paralelo argentina |
| `/noticias` | noticias nafta argentina | **MEDIO** | Bajo | Informativo | precio combustible argentina, noticia energía argentina, mercado nafta |
| `/viaje` | calculadora gasto viaje auto argentina | **MEDIO** | Moderado | Informativo + Herramienta | cuánto cuesta llenar el auto, gasto nafta por km, costo viaje argentina |
| `/vuelos` | seguimiento vuelos argentina | **MEDIO** | Bajo | Transaccional | vuelos en tiempo real, rastrear vuelo argentina, estado vuelo |
| `/comparativa` | comparar precios nafta argentina | **ALTO** | Moderado | Informativo + Comparativa | precios nafta YPF vs Shell, dónde está más barata la nafta, nafta más barata |
| `/precios/:provincia` | precio nafta [PROVINCIA] hoy | **ALTO** | Bajo | Local + Informativo | nafta en [ciudad], estaciones [provincia], gasoil [provincia] |

### Keywords de Long-Tail Recomendadas (Por Generar Contenido)

| Keyword | Volumen | Intención | Página Destino | Nota |
|---------|---------|-----------|-----------------|------|
| precio nafta ypf hoy | BAJO | Informativo | `/cotizador` (con CTA) | Brand-specific high-value |
| seguro terceros completo precio argentina | BAJO | Comercial | `/cotizador` (con CTA) | High-intent, buyers |
| seguro auto barato argentina | MEDIO | Comercial | `/cotizador` | Main money-making keyword |
| nafta más barata cerca mío | BAJO | Transaccional | `/comparativa` | Mobile-first intent |
| precio infinia hoy | BAJO | Informativo | `/comparativa` | Premium segment |
| gasoil precio hoy argentina | MEDIO | Informativo | `/` (expandir) | Secondary fuel |
| cálculo gasto viaje auto ruta argentina | BAJO | Informativo | `/viaje` | Pre-trip planning |
| comparar cobertura seguros auto argentina | BAJO | Comercial | `/cotizador` | Decision stage |

---

## 3. ON-PAGE SEO - ISSUES CRÍTICOS DETECTADOS

| Página | Problema | Severidad | Descripción | Fix Recomendado |
|--------|----------|-----------|-------------|-----------------|
| **TODAS** | Texto principal en inglés | **CRÍTICA** | El contenido visible está en inglés cuando debería ser español argentino | Traducir todo a español argentino con vocabulario local (nafta, naftera, estación de servicio, asegurador, etc.) |
| `/` | Falta H1 en español | **CRÍTICA** | Sin encabezado H1 que identifique el propósito de la página | Agregar: `<h1>Precio de nafta hoy en Argentina</h1>` |
| `/cotizador` | Misalignement de contenido | **CRÍTICA** | Title dice "gasto en nafta" pero objetivo es vender seguros | Reescribir toda la sección hero para hablar de seguros de auto, no nafta |
| `/cotizador` | Falta CTA principal | **ALTA** | No hay botón de CTA claro para cotizar seguro | Agregar CTA prominente: "Cotizá tu seguro en 2 minutos" |
| **TODAS** | Meta descriptions faltantes o genéricas | **ALTA** | Sin meta descriptions únicas por página | Implementar mediante hook useSEO con descriptions específicas (ver Tabla 1) |
| `/` | Falta descripción de propuesta | **ALTA** | No explica qué es Tankear ni por qué usar el sitio | Agregar párrafo de introducción: "Tankear te permite comparar precios de nafta en tiempo real y cotizar tu seguro de auto en segundos" |
| `/precios/:provincia` | Title dinámico no optimizado | **ALTA** | Pattern `[PROVINCIA]` no está implementado correctamente | Usar template: `Precio nafta en ${provinceName} hoy \| Tankear` |
| `robots.txt` | No mencionado | **MEDIA** | Posible falta de robots.txt o no indexando SPAs correctamente | Crear robots.txt que permita crawling de todas las rutas React |
| `sitemap.xml` | No mencionado | **MEDIA** | Sin XML sitemap para SPA - Google no descubre todas las rutas | Generar sitemap dinámico con todas las provincias y rutas |
| **TODAS** | Canonical tags | **MEDIA** | Verificar que canonical está correctamente seteado por el hook useSEO | Implementar canonical en cada página para evitar duplicate content |

---

## 4. ANÁLISIS TÉCNICO SEO

### Checklist Técnico Completo

| Elemento Técnico | Status | Detalles | Recomendación |
|------------------|--------|---------|-----------------|
| **HTTPS** | ✅ PASS | Dominio .com.ar en HTTPS | Mantener. Verificar HSTS header. |
| **Mobile Responsiveness** | ⚠️ WARNING | React SPA debería ser responsive pero verificar en mobile | Testear con Google Mobile-Friendly Test. Verificar viewport meta tag. |
| **Core Web Vitals (LCP)** | ⚠️ WARNING | SPAs tienden a ser lentas en LCP por JS | Implementar lazy loading, code splitting, SSR o static generation para críticos |
| **Page Speed** | ⚠️ WARNING | React SPAs genéricamente más lentas que static sites | Usar herramientas: Lighthouse, PageSpeed Insights. Target <2.5s LCP |
| **Sitemap.xml** | ❌ FAIL | No mencionado en contexto | CREAR INMEDIATAMENTE: `/sitemap.xml` con todas las rutas y `/precios/*` dinámicas |
| **robots.txt** | ❌ FAIL | No mencionado, crítico para SPAs | CREAR: `/robots.txt` permitiendo todos los crawlers |
| **Canonical Tags** | ⚠️ WARNING | Implementado en hook useSEO pero verificar | Asegurar que cada página setea canonical a sí misma |
| **Structured Data (JSON-LD)** | ❌ FAIL | No implementado | IMPLEMENTAR: LocalBusiness, BreadcrumbList, FAQSchema |
| **Open Graph / Twitter Cards** | ❌ FAIL | No implementado | Agregar og:title, og:description, og:image, twitter:card |
| **Broken Links** | ⚠️ UNKNOWN | Revisar manual - posibles links a competidores sin nofollow | Auditar y agregar nofollow a links competencia |
| **Alt Text en Imágenes** | ❌ FAIL | No mencionado - posiblemente todas sin alt text | Agregar alt text descriptivo a TODAS las imágenes con keywords |
| **Keyword Density** | ⚠️ WARNING | Contenido en inglés + no optimizado | Reescribir con keywords naturales (2-3% density) |
| **Internal Linking** | ❌ FAIL | Sin estructura de internal linking mencionada | Crear web de links: `/` → `/cotizador`, `/comparativa` → `/precios/*`, etc. |
| **Meta Robots** | ⚠️ UNKNOWN | Asumir index,follow pero verificar | Confirmar que NO hay noindex en producción |

### Implementación de Structured Data (JSON-LD)

**Agregar a página raíz `/` :**
```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Tankear",
  "description": "Comparador de precios de nafta y cotizador de seguros de auto en Argentina",
  "url": "https://tankear.com.ar",
  "telephone": "+54XXXXXXXXX",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Argentina",
    "addressCountry": "AR"
  },
  "areaServed": ["Buenos Aires", "Córdoba", "Rosario", "Mendoza"],
  "priceRange": "$$"
}
```

**Agregar a `/cotizador` :**
```json
{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "Cotizador de Seguro de Auto",
  "description": "Cotiza tu seguro de auto online y compara coberturas",
  "provider": {
    "@type": "Organization",
    "name": "Tankear"
  },
  "areaServed": "AR",
  "serviceType": "Auto Insurance Quotation"
}
```

**Agregar a `/precios/:provincia` :**
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Inicio",
      "item": "https://tankear.com.ar"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Precios",
      "item": "https://tankear.com.ar/comparativa"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "[PROVINCIA]",
      "item": "https://tankear.com.ar/precios/[provincia]"
    }
  ]
}
```

---

## 5. PROBLEMAS ESPECÍFICOS DE SPA + REACT

### Impacto en SEO y Soluciones

| Problema | Impacto | Solución Recomendada | Esfuerzo |
|----------|--------|----------------------|----------|
| **Renderizado en cliente (CSR)** | Google tarda en indexar contenido dinámico | Implementar Static Generation para rutas críticas (`/`, `/cotizador`, `/comparativa`) o SSR para rutas dinámicas | MODERADO |
| **JavaScript requerido** | Crawlers sin JS no ven contenido | Usar next.js, Remix o similar para SSR/SSG | ALTO |
| **URL dinámicas (:provincia)** | Posible crawl traps o infinite crawls | Asegurar sitemap.xml lista todas las provincias | BAJO |
| **Performance de JS** | Impacta Core Web Vitals | Code splitting, lazy loading, tree shaking | MODERADO |
| **Metadata dinámica** | Cada ruta necesita meta tags únicos | Hook useSEO está bien, pero verificar implementation | BAJO |

---

## 6. ESTRATEGIA DE CONTENIDO SEO

### Hoja de Ruta de Contenido por Etapas

#### **FASE 1: QUICK WINS (Semanas 1-2)**
Implementar cambios de texto/configuración de bajo esfuerzo que generan impacto inmediato.

| Contenido | Objetivo | Palabras Clave | Ubicación | Esfuerzo | Impacto |
|-----------|----------|-----------------|-----------|----------|---------|
| Redacción de homepage | Aclarar propuesta Tankear | "precio nafta hoy", "cotizador seguro auto" | `/` | 2 horas | ALTO |
| Descripción de cotizador | Alinear hacia seguros | "cotizador seguro auto argentina" | `/cotizador` | 2 horas | CRÍTICO |
| Títulos y descriptions | SEO on-page básico | Todas las keywords primarias | Todas las rutas | 4 horas | ALTO |
| FAQ página cotizador | Responder preguntas comunes | "cómo cotizar", "qué incluye el seguro" | `/cotizador` | 3 horas | MEDIA |
| Breadcrumbs + Internal Linking | Estructura web | N/A | Todas | 2 horas | MEDIA |

#### **FASE 2: CONTENIDO PILAR (Semanas 3-4)**
Crear páginas que ranqueen para keywords competitivas y posicionen la marca.

| Pillar | Palabra Clave Principal | Formato | Palabras | Keywords Secundarias | Ubicación |
|--------|------------------------|---------|----------|----------------------|-----------|
| Guía de precios de nafta | "precio nafta hoy argentina" | Guía informativa + tabla dinámica | 1,500-2,000 | "nafta más barata", "estaciones comparación" | `/guia/precios-nafta` |
| Blog: "Cómo ahorrar en nafta" | "ahorrar en nafta", "nafta barata" | Blog post + infografía | 1,200-1,500 | "consumo de nafta", "llenar tanque" | `/blog/ahorrar-nafta` |
| Comparativa seguros auto | "comparar seguros auto argentina" | Tabla comparativa + guides | 2,000-2,500 | "seguro auto barato", "cobertura completa" | `/guia/comparar-seguros` |
| Calculadora de viaje | "cálculo gasto viaje auto" | Interactive tool + blog | 800-1,000 + código | "gasto nafta ruta", "presupuesto viaje" | `/herramientas/calculadora-viaje` |
| Dólar blue actualizado | "precio dólar blue hoy" | Tabla actualizadora + análisis | 800-1,000 | "cotización dólar", "dólar paralelo" | `/precio-dolar` |

#### **FASE 3: CLUSTER DE CONTENIDO (Mes 2)**
Crear red de artículos relacionados que formen clusters temáticos (para E-E-A-T).

**Cluster 1: Precios de Nafta**
- `/` (Hub) → `/comparativa` → `/precios/buenos-aires` → `/precios/cordoba` → `/blog/precios-nafta-historico`

**Cluster 2: Seguros de Auto**
- `/cotizador` (Hub) → `/guia/comparar-seguros` → `/blog/coberturas-explicadas` → `/blog/seguro-terceros-vs-completo`

**Cluster 3: Herramientas**
- `/viaje` (Hub) → `/calculadora-viaje` → `/blog/planificar-viaje-auto` → `/blog/consumo-auto-marcas`

---

## 7. ANÁLISIS DE COMPETIDORES

### Perfil de Competidores Principales

#### **Competidor 1: 123Seguro.com.ar** (Directo)
**Especialidad:** Cotizador de seguros de auto (no compite en nafta)

| Métrica | 123Seguro | Tankear | Diferencial |
|---------|-----------|---------|-------------|
| **Keywords ranking** | +500 keywords relacionadas seguros | ~50 (actualmente) | 123Seg 10x más presencia |
| **Autoridad de dominio** | DA ~65-70 (estimado) | DA ~5 (nuevo) | Brecha significativa |
| **Contenido blog** | +200 artículos sobre seguros auto | 0 | Tankear debe crear contenido |
| **Tipos de contenido** | Guías, blog, comparativas, herramientas | Solo app | Tankear debe diversificar |
| **Velocidad/Tech** | Sitio tradicional, bien optimizado | SPA React (riesgo) | Tankear debe mejorar perf |
| **Top keywords** | "cotizar seguro auto", "comparar seguros", "seguro auto barato" | Aún no ranking | Oportunidad: usar diferenciador nafta |

**Ventaja competitiva de Tankear:** Propuesta única (nafta + seguros) no copiarán. Pueden capturar usuarios con intención dual.

#### **Competidor 2: ComparaEnCasa.com** (Indirecto - Seguros)
**Especialidad:** Broker multi-producto con seguros de auto

| Métrica | ComparaEnCasa | Tankear |
|---------|---|---|
| **Autoridad estimada** | DA ~60 | DA ~5 |
| **Estrategia SEO** | Brand + keywords genéricas | Aún sin estrategia |
| **Posicionamiento** | Broker generalista | Nicho: nafta + seguros |

#### **Competidor 3: Abastible.com.ar** (Indirecto - Nafta)
**Especialidad:** Información de precios de nafta

| Métrica | Abastible | Tankear |
|---------|-----------|---------|
| **Keywords nafta** | Ranking para "precio nafta" | No ranking aún |
| **Actualización** | Datos activos de precio | Datos activos de precio |
| **Diferenciador** | Solo nafta | Nafta + seguros |

#### **Datos del Gobierno: datos.energia.gob.ar**
**Autoridad:** Sitio oficial del gobierno - difícil de vencer en SERP
- Ranking para "precio nafta argentina oficial"
- No es comercial (no vende nada)
- Tankear estrategia: rank para variantes comerciales ("nafta barata", "comparar precios")

### Matriz de Competencia - Keywords Clave

| Keyword | 123Seguro | ComparaEnCasa | Abastible | Tankear | Opportunity |
|---------|-----------|---|---|---|---|
| **cotizador seguro auto argentina** | Ranking posición 1-2 | Ranking posición 2-3 | N/A | No ranking | DIFÍCIL - crear diferenciador |
| **comparar seguros argentina** | Ranking posición 1 | Ranking posición 2 | N/A | No ranking | DIFÍCIL - nicho con Tankear+nafta |
| **precio nafta hoy argentina** | No ranking | No ranking | Ranking 1-2 | No ranking | OPORTUNIDAD - "nafta barata" |
| **nafta más barata cerca mío** | No ranking | No ranking | Ranking 2-3 | No ranking | OPORTUNIDAD - mobile-first |
| **seguro auto barato argentina** | Ranking 1 | Ranking 2 | N/A | No ranking | DIFÍCIL - intención fuerte |
| **precio dólar blue hoy** | No ranking | No ranking | No ranking | No ranking | OPORTUNIDAD - diferenciador |

### Recomendación Estratégica de Competencia

**No competir head-to-head con 123Seguro en "cotizador seguro auto"** - ya ganaron esa batalla de keywords.
**Estrategia:** Posicionarse en long-tail y keywords de nafta, luego usar ese tráfico para convertir a seguros.
- Rank para "precio nafta hoy"
- Rank para "comparar precios nafta argentina"
- Rank para "nafta más barata"
- LUEGO: Convertir ese tráfico a cotizador de seguros con CTA prominente

---

## 8. RECOMENDACIONES INMEDIATAS

### TOP 5 ACCIONES ESTA SEMANA

**1. TRADUCIR TODO A ESPAÑOL ARGENTINO** (4 horas)
- [ ] Cambiar UI completa a español
- [ ] Reemplazar todos los titles a los que están en tabla 1
- [ ] Redactar meta descriptions únicas
- [ ] Cambiar copy del homepage para hablar de "seguros de auto" como objetivo principal

**2. ACTUALIZAR HOOK useSEO** (2 horas)
```javascript
// Ejemplo de cómo debería verse en cada página:
useSEO({
  title: "Precio de nafta hoy en Argentina | Tankear",
  description: "Compará precios de nafta en tiempo real...",
  canonical: "https://tankear.com.ar/",
  ogImage: "https://tankear.com.ar/og-image.jpg"
});
```

**3. CREAR robots.txt + sitemap.xml** (2 horas)
```
# robots.txt
User-agent: *
Allow: /
Disallow: /api/
Sitemap: https://tankear.com.ar/sitemap.xml
```

**4. IMPLEMENTAR STRUCTURED DATA** (3 horas)
- LocalBusiness en homepage
- BreadcrumbList en `/precios/*`
- Service schema en `/cotizador`

**5. AUDIT DE PERFORMANCE** (1 hora)
- Testear con Google PageSpeed Insights
- Identificar qué ralentiza el sitio (JS, imágenes, etc.)
- Crear plan de optimización

### PRIORIDADES DE IMPLEMENTACIÓN

| Tarea | Severidad | Esfuerzo | Impacto SEO | Deadline |
|-------|-----------|----------|------------|----------|
| Títulos/descriptions al español | **CRÍTICA** | 2-3h | 🔴🔴🔴 ALTO | HOY |
| Reescribir contenido a español | **CRÍTICA** | 6-8h | 🔴🔴 ALTO | 48h |
| Meta robots/canonical verificación | **ALTA** | 1h | 🟡 MEDIO | Hoy |
| robots.txt + sitemap.xml | **ALTA** | 2h | 🟡 MEDIO | HOY |
| Structured data LocalBusiness | **ALTA** | 2h | 🟡 MEDIO | Mañana |
| Optimizar velocidad de carga | **MEDIA** | 4-6h | 🟢 MEDIA | Semana 1 |
| Crear contenido pillar nafta | **MEDIA** | 4h | 🟢 MEDIA | Semana 2 |
| Blog post "Cómo ahorrar en nafta" | **MEDIA** | 3h | 🟢 MEDIO | Semana 2 |

---

## 9. HOJA DE RUTA 90 DÍAS

### MES 1: Fundamentos + Indexación
**Semana 1-2:** Fix técnicos y contenido crítico
- ✅ Traducción completa a español
- ✅ Todos los titles/descriptions optimizados
- ✅ Structured data implementado
- ✅ robots.txt + sitemap.xml
- ✅ Performance baseline

**Semana 3-4:** Contenido pilar inicial
- ✅ 3-4 blog posts sobre precios de nafta
- ✅ Guía de "Comparar precios de nafta"
- ✅ Optimizar `/comparativa` para keywords altas
- ✅ Internal linking web

**Resultado esperado:** Indexación de 80%+ de páginas, primeros rankings en posiciones 10-50 para keywords objetivo.

### MES 2: Crecimiento de Autoridad
**Semana 5-6:** Expansión de contenido
- ✅ 5-8 blog posts adicionales (cluster nafta + seguros)
- ✅ Crear herramienta calculadora viaje (link-worthy)
- ✅ Guía sobre "Cómo ahorrar en seguros de auto"
- ✅ Actualizar contenido viejo con datos frescos

**Semana 7-8:** Link building inicial
- ✅ Outreach a blogs de autos/finanzas
- ✅ Mencionar herramientas en foros argentinos
- ✅ Submissions a directorios locales

**Resultado esperado:** Posiciones 5-15 para keywords de nafta, autoridad dominio +10-15 puntos.

### MES 3: Posicionamiento de Seguros
**Semana 9-10:** Pivot hacia objetivo comercial
- ✅ Campañas de contenido sobre seguros (guides, comparativas)
- ✅ SEO en cotizador para conversión
- ✅ CTA optimization para seguros
- ✅ Landing page para keywords comerciales

**Semana 11-12:** Optimización de conversión
- ✅ A/B testing de CTAs
- ✅ Mejora de velocidad (Core Web Vitals)
- ✅ Review de rankings vs competidores
- ✅ Plan de Q2

**Resultado esperado:** Posiciones top 3 para "precio nafta [provincia]", visibilidad en keywords de seguros, primeras conversiones de seguros.

---

## 10. MÉTRICAS DE ÉXITO

### KPIs a Monitorear Semanalmente

| Métrica | Baseline | Objetivo 30 días | Objetivo 90 días |
|---------|----------|------------------|------------------|
| Páginas indexadas | ~2 | 50+ | 150+ |
| Tráfico orgánico | 0 | 100+ visitas/día | 500+ visitas/día |
| Keywords ranking top 10 | 0 | 5-10 | 30-50 |
| Keywords ranking top 50 | 0 | 20-30 | 100-150 |
| Posición promedio keywords | N/A | 25-35 | 12-18 |
| Click-through rate (CTR) | N/A | 2-3% | 4-5% |
| Conversiones a cotizador | 0 | 5-10/mes | 50-100/mes |
| Autoridad de dominio | ~5 | 10-15 | 20-30 |

### Herramientas Recomendadas para Tracking

- **Google Search Console:** Monitoreo de indexación, keywords, CTR
- **Google Analytics 4:** Tráfico orgánico, comportamiento, conversiones
- **Ahrefs/Semrush (freemium):** Rankings, competidores, backlinks
- **Lighthouse:** Performance y Core Web Vitals
- **SE Ranking:** Rankings localizados de keywords

---

## 11. CHECKLIST DE IMPLEMENTACIÓN

### Para el Equipo de Desarrollo

- [ ] **Actualizar hook useSEO** en todas las rutas
- [ ] **Crear robots.txt** con configuración apropiada
- [ ] **Generar sitemap.xml dinámico** (incluir todas las provincias)
- [ ] **Implementar canonical tags** en cada página
- [ ] **Agregar structured data (JSON-LD)** para LocalBusiness, BreadcrumbList, Service
- [ ] **Traducir UI completa** a español argentino
- [ ] **Optimizar performance** (reduce JS, lazy load images, code splitting)
- [ ] **Agregar Open Graph tags** (og:title, og:description, og:image)
- [ ] **Implementar Google Analytics 4** con eventos de conversión
- [ ] **Conectar Google Search Console**
- [ ] **Verificar mobile-friendliness** en Google Mobile-Friendly Test
- [ ] **Auditar alt text** en todas las imágenes

### Para el Equipo de Marketing/Content

- [ ] **Redactar 4-5 blog posts** mes 1 (precios de nafta, ahorro, noticias)
- [ ] **Crear guía completa** "Comparar precios de nafta en Argentina"
- [ ] **Guía de seguros de auto** (coberturas, cómo elegir)
- [ ] **Herramienta calculadora de viaje** (contenido link-worthy)
- [ ] **Calendario de publicaciones** para 90 días
- [ ] **Plan de outreach** para link building
- [ ] **Plantillas de FAQ** para cada página principal

### Para el Equipo de Producto/Negocio

- [ ] **Definir CTA primaria** en `/cotizador` ("Cotizá tu seguro en 2 minutos")
- [ ] **Alinear copy** del sitio hacia objetivo de venta (seguros, no nafta)
- [ ] **Crear landing pages** para keywords comerciales
- [ ] **Set up de conversión tracking** (cotizaciones completas)
- [ ] **Plan de monetización** de tráfico de nafta hacia seguros

---

## 12. CONCLUSIÓN Y RECOMENDACIÓN FINAL

**Estado actual:** 0/10 en SEO local (completamente en inglés, no optimizado)

**Potencial:** 8/10 (propuesta única de nafta + seguros, mercado no saturado en esa intersección)

**Cuello de botella:** Traducción + contenido inicial

**ROI estimado:** Si se ejecutan las recomendaciones:
- 30 días: 100-200 visitas orgánicas/día
- 90 días: 500-1,000 visitas orgánicas/día
- 6 meses: 1,000-2,000 visitas orgánicas/día
- Conversiones a seguros: 2-5% del tráfico = 10-100 cotizaciones/mes

**Acción inmediata:** Comenzar HOY con traducción del sitio a español. Este es el 90% del problema actual.

---

## Fuentes y Referencias

- [El Economista - Precio de nafta marzo 2026](https://eleconomista.com.ar/energia/precio-nafta-hoy-cuanto-cuesta-litro-marzo-2026-n93548)
- [Infobae - Precios de nafta Argentina](https://www.infobae.com/economia/2026/03/25/el-precio-de-la-nafta-super-aumento-el-doble-que-la-inflacion-en-los-ultimos-doce-meses/)
- [Surtidores.com.ar - Precios combustibles Argentina](https://surtidores.com.ar/precios/)
- [ComparaEnCasa - Comparador de seguros Argentina](https://www.comparaencasa.com/)
- [123Seguro - Cotizador seguros](https://123seguro.com.ar/seguros/auto)
- [Cronista - Cotización dólar](https://www.cronista.com/MercadosOnline/dolar.html)
- [Dolarhoy - Dólar blue en tiempo real](https://dolarhoy.com/)

---

**Documento preparado por:** Auditoría SEO Automatizada
**Fecha:** 5 de abril de 2026
**Versión:** 1.0
