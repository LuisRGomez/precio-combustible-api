# TANKEAR.COM.AR - ROADMAP ESTRATÉGICO 12 MESES

**Abril 2026 - Abril 2027 | Recién Lanzado | Argentina | B2C**

---

## CONTEXTO ESTRATÉGICO

### Situación Actual
- **Producto**: Comparador de precios de combustible + cotizador de seguros
- **Lanzamiento**: Abril 2026
- **Stack**: React + TypeScript + FastAPI + SQLite
- **Equipo**: 3 engineers, 1 PM, 1 designer
- **Métricas baseline**: ~1000 presupuestos/mes, $4K MRR

### Modelo de Negocio
1. **Primario (80% de ingresos)**: Comisiones por cotizaciones de seguros (afiliado 123seguro.com)
   - Actual: ~$4K MRR
   - Target Y1: $50K MRR

2. **Secundario (10%)**: Publicidad display (AdSidebar, PublicitarModal)
   - Potencial: $3K MRR

3. **Terciario (10%)**: Leads directos para aseguradoras
   - Futuro: $15K MRR

4. **Futuro**: Marketplace (GNC, talleres, lubricantes)
   - Potencial Y2: $20K MRR

### TAM / SAM / SOM
- **TAM**: ~10M de conductores en Argentina
- **SAM**: Conductores que buscan comparar combustible + comprar seguros (~1M)
- **SOM Y1**: 0.5% = 50K MAU (objetivo realista para Q2)

### Métrica de Éxito Primaria (OKR Anual)
**Objetivo**: Pasar de $4K MRR a $50K MRR en comisiones por seguros

- Q2 (abril-junio): $8K MRR
- Q3 (julio-septiembre): $15K MRR
- Q4 (octubre-diciembre): $30K MRR
- Q1'27 (enero-marzo): $50K MRR

---

## NOW (0-2 MESES | Abril-Mayo 2026)

### Tema Estratégico
**"Fix the Money Maker"** - Resolver bloqueadores críticos que impiden monetización

### Problemas Críticos a Resolver
1. **Cotizador no pide marca/modelo**: Sin datos vehiculares, 123seguro no puede pre-llenar seguros relevantes
2. **SEO en inglés está roto**: Penalización por meta tags en español, sin hreflang, pierdo 80% de tráfico EN
3. **No hay visibilidad operativa**: Sin admin dashboard de métricas, no sé si las cosas funcionan
4. **Lead se captura tarde**: Usuarios ven presupuesto y se van sin contacto
5. **Telegram no funciona**: Canal de engagement/notificaciones abandonado

### Iniciativas de NOW

#### M1: Cotizador Mejorado - Capturar Marca/Modelo (MUST)
**Problema**: Usuarios llegan al cotizador → calculan presupuesto → presupuesto no tiene contexto de vehículo → 123seguro no puede personalizar → baja conversión

**Solución**:
- Agregar selector de marca/modelo/año al INICIO del flujo (antes del cálculo)
- Si usuario está logged in, pre-llenar desde Mi Garage
- Pasar estos datos a 123seguro.com en el redirect de afiliado
- Capturar lead en email/WhatsApp DESPUÉS del presupuesto (no antes)

**Cambios Técnicos**:
```javascript
// Frontend: Agregar VehicleSelector
<Cotizador>
  <VehicleSelector
    defaultFromGarage={user?.garage?.[0]}
    required={true}
    onSelect={setSelectedVehicle}
  />
  <FuelCalculator vehicle={selectedVehicle} />
  <ResultsCard />
</Cotizador>

// Backend: POST /api/quoter/presupuesto
Request body: {
  vehicle_id?: string,
  vehicle_brand: string,     // NEW
  vehicle_model: string,     // NEW
  vehicle_year: number,      // NEW
  fuel_type: 'nafta' | 'diesel',
  liters: number,
  province: string
}

// Afiliado: Pasar datos a 123seguro
window.location.href = `https://123seguro.com/quote?
  brand=${vehicle.brand}&
  model=${vehicle.model}&
  year=${vehicle.year}&
  email=${user.email}&
  phone=${user.phone}&
  affiliate_id=tankear`
```

**Dependencias**:
- Necesita coordinación con 123seguro.com para soportar parámetros nuevos (semana 1)
- API de vehículos estable (ya existe, no es blocker)

**Riesgos**:
- 123seguro no soporta parámetros nuevos (40% prob)
  - Mitigación: Fallback - si 123seguro no responde, permitir continuar pero con advertencia
- Duplicación de lógica entre cotizador y Mi Garage
  - Mitigación: Refactorizar a componente compartido después

**Timeline**: 2-3 semanas
- Semana 1: Kick-off, call con 123seguro, diseño
- Semana 2-3: Desarrollo e integración
- Semana 4: Testing, QA, deploy

**KPI/Success Metric**:
- Conversión presupuesto → 123seguro sube de 20% a 28% (+40%)
- Leads per presupuesto suben de 5% a 5.75% (+15%)
- Revenue MRR sube de $4K a $6.5K

**RICE Score**:
- Reach: 1000 presupuestos/mes × 100% = 1000
- Impact: 2 (incremento de 40% en conversión)
- Confidence: 60% (depende de 123seguro)
- Effort: 0.5 PM (2 semanas)
- **RICE = (1000 × 2 × 0.6) / 0.5 = 2400** ✓ Prioridad alta

**Owner**: Backend lead + Frontend lead

---

#### M2: SEO English Fix (MUST)
**Problema**: Meta tags en español para todas las páginas, sin hreflang, Google penaliza como contenido duplicado. Pierdo 80% del tráfico EN.

**Solución**:
- Agregar hreflang tags bidireccionales (es ↔ en)
- Traducir meta descriptions, OpenGraph tags a inglés para rutas /en/*
- Crear sitemap_en.xml
- Actualizar robots.txt para permitir /en/*
- Agregar `lang="en"` en HTML root para rutas en inglés

**Cambios Técnicos**:
```javascript
// Frontend: Agregar hreflang en <head>
// Para ruta /es/provincia/buenos-aires
<link rel="alternate" hreflang="es" href="https://tankear.com.ar/es/provincia/buenos-aires" />
<link rel="alternate" hreflang="en" href="https://tankear.com.ar/en/province/buenos-aires" />
<link rel="alternate" hreflang="x-default" href="https://tankear.com.ar/provincia/buenos-aires" />

// Traducir meta tags
if (locale === 'en') {
  document.title = "Gas prices in Buenos Aires | Tankear";
  setMetaTag('description', 'Compare fuel prices across gas stations in Buenos Aires. Find the cheapest gas near you.');
  setOGTag('title', 'Gas prices in Buenos Aires | Tankear');
} else {
  document.title = "Precios de nafta en Buenos Aires | Tankear";
  setMetaTag('description', 'Compará precios de combustible en estaciones de Buenos Aires. Encontrá la nafta más barata cerca de ti.');
}

// Backend: Traducir structured data
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": locale === 'en' ? "Tankear - Gas Price Comparison" : "Tankear - Comparador de Precios de Nafta",
  "url": "https://tankear.com.ar/en",
  ...
}
```

**Cambios de Configuración**:
- `robots.txt`: Allow /en/* (actualmente bloqueado o ignorado)
- `sitemap_en.xml`: URLs de rutas en inglés con prioridad 0.8
- `next.config.js` (si usan Next.js): Configurar i18n routing correctamente

**Timeline**: 1 semana (paralelizable con M1)
- Día 1: Audit SEO actual (Screaming Frog / Google Search Console)
- Día 2-3: Implementar hreflang y meta tags
- Día 4: Traducir contenido clave (title, description, OG)
- Día 5: QA y submit sitemap_en.xml a Google Search Console

**KPI/Success Metric**:
- Baseline: 200 visitas/mes desde Google EN
- Target (30 días después): 600 visitas/mes (+200% or +400 visitas)
- Mejora en indexación: Google indexa todas las URLs en /en/*

**RICE Score**:
- Reach: 600 usuarios/mes potenciales
- Impact: 1.5 (SEO es fundamental pero no directo a ingresos inmediatos)
- Confidence: 90% (técnicamente bien definido)
- Effort: 0.25 PM (1 semana)
- **RICE = (600 × 1.5 × 0.9) / 0.25 = 3240** ✓ Prioridad muy alta

**Owner**: Frontend lead + Marketing

---

#### M3: Admin Dashboard v1 - Métricas Core (MUST)
**Problema**: Admin con JWT existe pero sin métricas. No hay visibilidad de conversión, leads, revenue. Decisiones ciegas.

**Solución - MVP**:
Dashboard con 5 gráficos principales:
1. **Presupuestos/día** (tendencia últimos 30 días)
2. **Leads capturados/día** (desglosado: email vs WhatsApp)
3. **Click-throughs a 123seguro** (funnel: presupuesto → click → ¿conversión?)
4. **Revenue estimado** (presupuestos × tasa de conversión estimada)
5. **Traffic por fuente** (Organic vs Direct vs Referral vs Social)

**Cambios Técnicos**:
```javascript
// Backend: GET /api/admin/metrics?from=YYYY-MM-DD&to=YYYY-MM-DD
Response: {
  presupuestos: [
    { date: "2026-04-01", count: 45 },
    { date: "2026-04-02", count: 52 },
    ...
  ],
  leads: [
    { date: "2026-04-01", email: 3, whatsapp: 2, total: 5 },
    { date: "2026-04-02", email: 5, whatsapp: 1, total: 6 },
    ...
  ],
  clicksAfiliado: [
    { date: "2026-04-01", count: 30, source: "cotizador" },
    ...
  ],
  revenue: {
    estimated: 1200,  // presupuestos × 0.5% aprox
    confirmed: 0      // cuando tengamos tracking de conversión real
  },
  traffic: {
    organic: 45,      // %
    direct: 30,
    referral: 15,
    social: 10
  }
}

// Frontend: React dashboard
<AdminDashboard>
  <MetricCard title="Presupuestos" data={presupuestos} chart="line" />
  <MetricCard title="Leads" data={leads} chart="stacked-bar" />
  <MetricCard title="Conversión" data={clicksAfiliado} chart="funnel" />
  <MetricCard title="Revenue Est." data={revenue} chart="number" />
  <TrafficSourceChart data={traffic} />
  <DateRangePicker onApply={refetch} />
  <ExportButton format="csv" />
</AdminDashboard>
```

**Librerías**:
- `recharts` o `chart.js` para gráficos
- `date-fns` para manejo de fechas

**Timeline**: 2 semanas (paralelizable con M1 y M2)
- Semana 1: Diseño de dashboard, endpoints de API
- Semana 2: Frontend, testing, deploy

**KPI/Success Metric**:
- Visibilidad en tiempo real de métricas core (refreshing cada 5-10 min)
- Capacidad de detectar anomalías dentro de 48h de deploy
- PM puede tomar decisiones con datos (no gut feeling)

**RICE Score**:
- Reach: 1 user (PM) pero enabler crítico para todo
- Impact: 3 (decisiones basadas en datos)
- Confidence: 95%
- Effort: 0.5 PM (2 semanas)
- **RICE = (1 × 3 × 0.95) / 0.5 = 5.7** (recalcular sin Reach literal: 3 × 0.95 / 0.5 = 5.7)

**Owner**: Backend lead + Data analyst (si hay)

---

#### S1: Lead Capture Timing Optimization (SHOULD)
**Problema**: Usuario calcula presupuesto, ve número → se va sin dejar contacto. Lead se pierde.

**Solución**:
- Mostrar modal DESPUÉS de mostrar resultado del presupuesto
- Copy: "Obtén presupuestos de seguros personalizados directamente en tu inbox"
- Campos: email (requerido), teléfono (opcional)
- Después de capturar: redirigir a 123seguro

**Timeline**: 1 semana (depende de M1)

**KPI**:
- +15% de leads por presupuesto (actual: ~5%, target: ~5.75%)
- Email capture rate: >60%

**Owner**: Frontend lead

---

#### S2: Telegram Bot Activation (SHOULD)
**Problema**: Canal Telegram existe pero no funciona. Oportunidad para notificaciones y engagement.

**Solución**:
- Bot que responde: "Enviame tu zona y vehículo" → suscribirse a alerts de precio
- Mensaje diario (opt-in): "Nafta en tu zona hoy: $X (ayer: $X-1, cambio: +5%)"
- CTA: "Ver estaciones recomendadas" → link a /provincia

**Cambios Técnicos**:
```python
# Bot command handlers
@bot.message_handler(commands=['start'])
def start_handler(message):
    markup = get_location_keyboard()
    bot.send_message(message.chat_id,
      "Bienvenido a Tankear! Elegí tu zona para recibir precios diarios de nafta 🚗",
      reply_markup=markup)

@bot.callback_query_handler(func=lambda call: call.data.startswith('zone_'))
def zone_selected(call):
    zone_id = call.data.split('_')[1]
    # Guardar suscripción en DB
    save_telegram_subscription(call.from_user.id, zone_id)

# Daily task (cron)
@scheduler.scheduled_job('cron', hour=8, minute=0)
def send_daily_prices():
    subscriptions = get_all_telegram_subscriptions()
    for sub in subscriptions:
        prices = get_prices_for_zone(sub.zone_id)
        message = format_price_message(prices)
        bot.send_message(sub.chat_id, message)
```

**Stack**: `python-telegram-bot` + APScheduler (para cron)

**Timeline**: 1 semana

**KPI**:
- 100 suscriptores en 30 días
- 50% open rate en notificaciones
- +20% en engagement (revisitas)

**Owner**: Backend lead

---

### Roadmap Visual: NOW

```
SEMANA 1:
├─ M1: Kick-off + call 123seguro (BD)
├─ M2: Kick-off SEO audit
└─ M3: Design dashboard

SEMANA 2-3:
├─ M1: Desarrollo vehicle selector + integración 123seguro
├─ M2: Implementar hreflang + meta tags
└─ M3: Desarrollo endpoints + frontend

SEMANA 4:
├─ M1: Testing cotizador
├─ M2: Testing hreflang + submit sitemap
├─ M3: Testing dashboard
└─ S1: Kick-off lead capture modal

SEMANA 5-6:
├─ M1: Deploy (monitor)
├─ S1: Desarrollo + testing
├─ S2: Kick-off Telegram
└─ Monitor M2 en Google Search Console

SEMANA 7-8:
├─ S1: Deploy
├─ S2: Testing + deploy
└─ Monitoreo integral de KPIs
```

### Blockers y Dependencias: NOW

| Blocker | Propietario | "Need by" | Mitigación |
|---------|-------------|-----------|-----------|
| 123seguro.com upgrade a parámetros nuevos | BD | Semana 1 | Tener fallback: redirigir sin parámetros si no responden |
| Acceso a Search Console de Google | Marketing | Semana 2 | Pedir acceso asap, tener cuenta de backup |
| Servidor de staging estable | DevOps | Semana 1 | Test en staging antes de producción |

### Inversión: NOW

| Iniciativa | PM-weeks | Designer-weeks | Engineering-weeks | Costo (si 3rd party) |
|-----------|----------|-----------------|-------------------|---------------------|
| M1 | 0.5 | 0.5 | 2.5 | $0 (interno) |
| M2 | 0.25 | 0 | 1.5 | $0 (interno) |
| M3 | 0.5 | 0.5 | 2 | $0 (interno) |
| S1 | 0.25 | 0.5 | 1 | $0 (interno) |
| S2 | 0.25 | 0 | 1 | $0 (interno) |
| **TOTAL** | **1.75** | **1.5** | **8** | **$0** |

**Conclusion**: 8 person-weeks de engineering ÷ 3 engineers = ~3 weeks de trabajo paralelo. Timeline realista: 8 semanas (fin mayo).

---

## NEXT (2-6 MESES | Junio-Octubre 2026)

### Tema Estratégico
**"Scale Monetization"** - Abrir nuevos canales de ingresos

### Iniciativas de NEXT

#### M4: Integración Directa con Aseguradoras (MUST)
**Problema**: 100% de ingresos por comisiones van a través de 123seguro.com. Ellos toman 50%, nosotros el 50% restante. Oportunidad: conectar directamente con aseguradoras y tomar 40-50% de la prima.

**Modelo Actual**:
- Usuario calcula presupuesto → redirige a 123seguro → 123seguro vende seguro a usuario → nosotros recibimos comisión (~$150 por seguro de $1000)

**Modelo Propuesto**:
- Usuario calcula presupuesto → opción A) Cotizar con asegurador local (DIRECTO) o B) 123seguro (fallback)
- Si elige A → lead va directo a Zurich/MAPFRE/Monterrey → ellos dan 30-40% de la prima (~$350-400 por seguro)
- Si elige B → sigue flujo actual

**Ventaja Financiera**:
- Seguro $1000/año vía 123seguro: $150 comisión para nosotros
- Mismo seguro vía directo: $350-400 comisión para nosotros
- **+133% comisión por transacción**

**Estrategia de Onboarding**:
1. Contactar 3 aseguradoras locales (Zurich, Seguros Monterrey, MAPFRE)
2. Preparar deck: tráfico actual, demo del producto, términos propuestos
3. Negociar: tasa de comisión, formato de lead, trackeo de conversión
4. Firmar cartas de intención (mayo), contratos (junio)
5. Integración técnica (julio-agosto)
6. Live (septiembre)

**Cambios Técnicos**:
```javascript
// Frontend: Mostrar opciones de seguro
<InsuranceOptions>
  <OptionCard
    insurer="MAPFRE"
    commission="40%"
    features={['Cobertura full', 'Sin carencias']}
    onClick={() => quoteDirect('mapfre')}
  />
  <OptionCard
    insurer="123Seguro (Múltiples opciones)"
    commission="25%"
    onClick={() => quoteAffiliate()}
  />
</InsuranceOptions>

// Backend: POST /api/leads/insurance-company
Request: {
  user_email: string,
  user_phone: string,
  vehicle_brand: string,
  vehicle_model: string,
  vehicle_year: number,
  insurance_company: 'mapfre' | 'monterrey' | 'zurich' | 'affiliateProxy',
  coverage_type: 'liability' | 'comprehensive' | 'theft',
  deductible?: number
}

// Cada asegurador tiene endpoint diferente:
if (insurance_company === 'mapfre') {
  await fetch('https://mapfre.com/api/leads', {
    method: 'POST',
    body: JSON.stringify(leadData),
    headers: { 'Authorization': `Bearer ${MAPFRE_API_KEY}` }
  });
}

// Webhook para conversión:
@app.post('/api/webhooks/insurance-conversion')
def insurance_conversion(event: ConversionEvent):
  # Recibido desde asegurador cuando usuario compra
  # event.lead_id + event.status ('won' | 'lost')
  update_lead_status(event.lead_id, event.status)
  update_revenue_tracking(event)
```

**Riesgos**:
- Aseguradoras lentas en onboarding (8-12 semanas típico)
  - Mitigación: Iniciar contactos EN MES 2 de NOW (finales de abril), no esperar a junio
- Chargeback/fraud si pasos leads de baja calidad
  - Mitigación: Validación estricta (teléfono verificado, email, geo-IP)
- Cannibalización: usuarios prefieren 123seguro por más opciones
  - Mitigación: A/B test - 50% ve opción directa, 50% ve 123seguro

**Timeline**: Kick-off mayo (mientras se termina NOW), live septiembre
- Mayo: Contactos + deck + demo
- Junio: Negoción + firmas
- Julio-agosto: Integración técnica + testing
- Septiembre: Go live

**KPI**:
- Firmar 2-3 aseguradoras en Q2/Q3
- 200+ leads/mes a seguros directos para fin Q3
- +80% conversion rate vs 123seguro (porque es más directo y personalizado)
- MRR sube de $8K (fin NOW) a $15K (fin Q3)

**RICE Score**:
- Reach: 400 presupuestos/mes esperados en Q3
- Impact: 2.5 (comisión 3x mayor)
- Confidence: 60% (depende de aseguradoras)
- Effort: 1.5 PM (6 semanas)
- **RICE = (400 × 2.5 × 0.6) / 1.5 = 400**

**Owner**: CEO/BD + Backend lead

---

#### M5: Admin Dashboard v2 - Analytics Avanzado (MUST)
**Objetivo**: Entender rentabilidad por canal, región, usuario, cohorte.

**Métricas Nuevas**:
1. **LTV (Lifetime Value)**: ¿Cuánto ingresos genera un usuario en su vida?
2. **CAC (Customer Acquisition Cost)**: ¿Cuánto gasto en marketing para traer un usuario?
3. **LTV/CAC Ratio**: Debe ser >3 para negocio saludable, >10 es great
4. **Cohort Analysis**: Usuarios reclutados en semana X, qué % convierte en semana Y?
5. **Funnel by Channel**: Organic vs Paid vs Referral, cuál convierte mejor?
6. **Churn Rate**: % de usuarios que se van cada mes

**Cambios Técnicos**:
```javascript
// Backend: GET /api/admin/analytics/ltv-cac
Response: {
  ltv: {
    allTime: 1200,
    q3: 800,
    q4: 1500
  },
  cac: {
    organic: 45,
    direct: 0,
    referral: 60
  },
  ratio: {
    organic: 1200 / 45 = 26.7, // excellent
    direct: 'N/A',
    referral: 1200 / 60 = 20   // excellent
  }
}

// Cohort analysis endpoint
GET /api/admin/analytics/cohorts?cohort_date=2026-04-01
Response: {
  cohort_date: "2026-04-01",
  cohort_size: 150,
  week_0: { users: 150, converted: 8, revenue: 1200 },   // 5% conversion week 1
  week_1: { users: 142, converted: 12, revenue: 1800 },  // 8% additional
  week_2: { users: 130, converted: 10, revenue: 1500 },  // 7% additional
  ...
  retention: [100%, 95%, 87%, 79%, 68%]  // % retención por semana
}

// Churn rate
GET /api/admin/analytics/churn?month=2026-06
Response: {
  month: "2026-06",
  users_start_month: 500,
  users_churned: 50,
  churn_rate: "10%"
}
```

**Timeline**: 3 semanas (finales de Q2 / principios de Q3)

**KPI**:
- Identificar top 3 canales por rentabilidad (LTV/CAC)
- Ranking de cohorts (cuáles tienen mejor LTV)
- Detectar churn early

**Owner**: Data analyst + Backend

---

#### S3: Publicidad Display - Monetización (SHOULD)
**Idea**: AdSidebar y PublicitarModal ya existen. Monetizarlos vendiéndolos a sponsors.

**Modelo**:
- **Sidebar sponsor**: $500/mes por 2 spots rotativos (30 días)
  - Target: GNC stations, branded talleres, lubricantes (YPF, Shell)
- **Modal semanal**: $1000/mes por branded modal (1x por semana)
  - Target: Seguros, servicios vehiculares

**Proceso de Venta**:
1. Crear media kit (tráfico, audiencia, placements)
2. Outreach a 10-15 partners potenciales (junio)
3. Deals esperados para julio-agosto

**KPI**:
- 4 sponsors en el sidebar para fin Q3 = $2K MRR
- 1 sponsor en modal para fin Q3 = $1K MRR
- **Total**: $3K MRR adicionales en publicidad

**Timeline**: 4 semanas (kick-off junio, live agosto)

**Owner**: Sales / Partnership lead

---

#### S4: Mobile App v0.1 (SHOULD)
**Justificación**: 70% del tráfico es mobile. App nativa = mejor UX, push notifications, offline, instalable.

**MVP Features**:
1. Presupuestos (offline, usa data local)
2. Precios cercanos en mapa (geolocalización)
3. Mi Garage (vehículos, mantenimiento)
4. Alerta de precios (push notifications)

**Stack**: React Native + Expo (rapid deployment)

**Cambios**:
- API endpoints deben ser mobile-friendly (CORS, tamaño minimal)
- Autenticación: usar deep links + OAuth o JWT en localStorage

**Timeline**: 8 semanas (junio-agosto, beta en agosto, production septiembre)

**KPI**:
- 5K instalaciones en 90 días
- 2.5 min average time-on-app vs 1.2 min en web
- 3+ star rating en App Store

**Owner**: Mobile engineer (hire si no hay)

---

### Roadmap Visual: NEXT

```
JUNIO (Semana 1-4):
├─ M4: Contactos aseguradoras + deck
├─ S3: Outreach publicidad
└─ M5: Kick-off analytics

JULIO (Semana 5-9):
├─ M4: Negoción + firmas aseguradoras
├─ M5: Desarrollo endpoints analytics
└─ S4: Kick-off mobile app

AGOSTO (Semana 10-13):
├─ M4: Integración técnica aseguradoras
├─ M5: Frontend analytics dashboard
├─ S3: Deals publicidad + setup
└─ S4: Beta mobile app

SEPTIEMBRE (Semana 14-17):
├─ M4: Go live aseguradoras directas
├─ M5: Deploy analytics
├─ S3: Lanzar publicidad
└─ S4: Production app release

OCTUBRE (Semana 18-22):
├─ Monitoreo + optimización de todos
├─ A/B testing conversión
└─ Preparar Q4
```

### Capacidad: NEXT

Para NEXT necesitas:
- Mantener 1 engineer en "operational mode" (bugs, support, monitoring)
- 2-2.5 engineers disponibles para features

Si timelines se solapan (muy probable), prioritize así:
1. **M4** (aseguradoras): +80% ingresos, worth delay en S4
2. **M5** (analytics): enables decisiones en M4
3. **S4** (mobile): nice-to-have, puede atrasar a septiembre
4. **S3** (ads): parallel, no requiere engineering

---

## LATER (6-12 MESES | Noviembre 2026 - Abril 2027)

### Tema Estratégico
**"Build the Marketplace"** - Expandir más allá de seguros

### Iniciativas de LATER

#### M7: Marketplace - GNC / Talleres / Lubricantes (MUST)
**Visión**: Tankear no solo compara precio de nafta. Es el portal centralizado para todo lo relacionado con vehículos: combustible, seguros, servicios, repuestos.

**Fase 1 (Meses 6-8 de LATER)**: GNC
- Integrar 5-10 estaciones GNC en Buenos Aires
- Cada estación: inventario, horarios, reseñas
- Transacciones: click → WhatsApp/teléfono (manual, no pagos aún)
- Comisión: 10% por lead cerrado

**Fase 2 (Meses 9-12)**: Talleres
- Talleres: repuestos, servicios de mantenimiento
- Reseñas comunitarias
- Reserva de servicios (simple: email al taller)

**Arquitectura**:
```
Marketplace:
├── Products (inventory: GNC, repuestos, servicios)
├── Vendors (estaciones, talleres, shops)
├── Orders (leads o transacciones)
├── Reviews (UGC comunitario)
├── Payouts (pagos a vendors)
└── Analytics (vendor dashboard)

New API Endpoints:
POST /api/marketplace/products
GET /api/marketplace/vendors?location=lat,lng&radius=5&category=GNC
GET /api/marketplace/products?vendor_id=123&category=GNC
POST /api/marketplace/orders (lead/transaction)
GET /api/marketplace/reviews?product_id=123
POST /api/admin/payouts (para vendors)
```

**Technical Stack**:
- Database: Add tables para products, vendors, orders, reviews
- Backend: FastAPI endpoints para CRUD
- Frontend: New marketplace section con filtros, búsqueda, reviews
- Payment: Inicialmente manual (bank transfer), luego integración Stripe

**Riesgos**:
- Integración operacional compleja (cada vendor es diferente)
- QA: asegurar que información de inventory es correcta
- Fraud: leads fake, sobrecargos
- Responsibility: ¿somos liable si hay problema?

**Mitigación**:
- MVP ultra simple: solo GNC (producto simple)
- Manual approval de vendors (no auto-approve)
- Manual payments por ahora (reducir fraud)
- Términos de servicio claros: Tankear es facilitador, no responsable

**Timeline**: 12 semanas (kick-off noviembre, beta enero, production marzo)

**KPI**:
- 50 transacciones GNC/mes en Q2'27
- 10 talleres activos
- $15K MRR en comisiones marketplace

---

#### M8: Payments & Vendor Management (MUST)
**Objetivo**: Pasar de transacciones manuales a pagos automatizados.

**Integración Stripe**:
- Stripe Connect: vendors se conectan, Tankear toma comisión, ellos reciben payments
- Simplifica: no necesito gestionar bank transfers manualmente
- Compliance: Stripe maneja taxes, reporting

**Vendor Dashboard**:
- Mi inventario (GNC, repuestos, etc.)
- Órdenes recibidas (pending, completed, canceled)
- Payouts history
- Analytics: top products, conversion rate

**Timeline**: 10 semanas (paralelizable con M7)

---

#### S5: Programa de Referral (SHOULD)
**Idea**: "Referí un amigo, ambos obtienen $100 en cofre de ahorro de nafta"

**Mecánica**:
- User A invita User B vía link único (`/ref/abc123`)
- User B instala app/abre link → se crea cuenta linked a A
- Cuando B completa primer presupuesto → A + B reciben $100 crédito
- Crédito usable en marketplace (GNC, servicios)

**KPI**:
- 25% de usuarios tienen 1+ referral
- +25% en net new user acquisition via referral

**Timeline**: 3 semanas (kick-off enero, live febrero)

---

#### S6: Expansion Regional - Perú & Chile (SHOULD)
**Mercados**:
- Perú: ~5M conductores, modelo similar a Argentina
- Chile: ~4M conductores, modelo similar

**Estrategia**:
- Replicar modelo exacto (combustible + seguros + marketplace)
- Adaptar: partners locales de seguros, moneda (SOL, CLP), pricing

**Riesgos**:
- Regulación de seguros diferente en cada país
- Partners/afiliados distintos
- Soporte en español/Peruvian Spanish

**KPI**:
- 30K MAU región por Q1'27
- $20K MRR en región (perú + chile)

**Timeline**: 8 semanas (kick-off febrero, beta marzo, production mayo)

---

#### S7: ML Predictions - Optimal Refill Time (COULD)
**Idea**: Usar precio histórico para predecir cuándo es óptimo cargar nafta.

**Funcionalidad**:
- "En base a precios históricos, cargá nafta el jueves (ahorras $200/mes)"
- Notificación: "Nafta bajó en tu zona, es buen momento para cargar"

**Tech**: Time series forecasting (Prophet, ARIMA)

**KPI**:
- +15% en ahorro usuario promedio
- +20% en engagement

**Timeline**: 6 semanas (experimental, puede postergarse)

---

### Roadmap Visual: LATER

```
NOVIEMBRE-DICIEMBRE (Semana 1-8):
├─ M7: Integración GNC estaciones (API, datos)
├─ M8: Diseño vendor management
└─ S5: Kick-off referral program

ENERO-FEBRERO (Semana 9-16):
├─ M7: Beta marketplace GNC
├─ M8: Integración Stripe
└─ S6: Kick-off expansion regional (Perú)

MARZO-ABRIL (Semana 17-26):
├─ M7: Production marketplace
├─ M8: Go live vendor payouts
├─ S5: Deploy referral
├─ S6: Beta Perú + Chile
└─ S7: (optional) ML models
```

---

## KPI TARGETS CONSOLIDADOS

### Phase NOW (Abril-Mayo 2026)

| KPI | Baseline | Target | Owner |
|-----|----------|--------|-------|
| Presupuestos/día | 30 | 35 (+17%) | PM |
| Presupuestos → Lead conversion | 5% | 5.75% (+15%) | PM |
| Clicks to 123seguro | 1500/mo | 2100/mo (+40%) | PM |
| Leads generated/mes | 75 | 110 (+47%) | Sales |
| MRR (revenue) | $4K | $8K (+100%) | Finance |
| Organic traffic EN | 200/mo | 600/mo (+200%) | Marketing |
| Telegram subscribers | 0 | 100 | Engagement |

**Medición**: Daily en admin dashboard (M3)

---

### Phase NEXT (Junio-Octubre 2026)

| KPI | Q2 End | Q3 Target | Q4 Target | Owner |
|-----|--------|----------|----------|-------|
| MRR total | $8K | $15K | $30K | Finance |
| CAC (customer acquisition cost) | <$120 | <$100 | <$80 | Analytics |
| LTV (lifetime value) | $800 | $1000 | $1500 | Analytics |
| LTV/CAC ratio | >6.7 | >10 | >18 | Analytics |
| Presupuestos/mes | 1000 | 1500 | 2500 | PM |
| Conversion rate | 20% | 25% | 30% | PM |
| Mobile app installs | 0 | 2.5K | 5K | Product |
| Direct insurance leads/mo | 0 | 200 | 500 | Sales |
| Publicidad revenue | $0 | $1K | $3K | Sales |

---

### Phase LATER (Noviembre 2026 - Abril 2027)

| KPI | Target | Owner |
|-----|--------|-------|
| MRR (seguros) | $50K | Finance |
| MRR (marketplace) | $15K | Finance |
| MRR (publicidad) | $3K | Finance |
| **Total MRR** | **$68K** | Finance |
| Total MAU | 100K | Product |
| Regional users (Perú/Chile) | 30K | Product |
| App installs | 15K | Product |
| Marketplace transactions/mo | 100+ | Product |

---

## RESUMEN POR FRAMEWORK

### MoSCoW Summary

**MUST (Blockers de éxito)**:
- M1: Cotizador mejorado
- M2: SEO English fix
- M3: Admin dashboard v1
- M4: Integración aseguradoras directas
- M5: Analytics avanzado
- M7: Marketplace
- M8: Payments/Vendor management

**SHOULD (High value, no blocking)**:
- S1: Lead capture timing
- S2: Telegram bot
- S3: Publicidad display
- S4: Mobile app
- S5: Referral program
- S6: Expansion regional

**COULD (Low priority)**:
- S7: ML predictions

**WON'T (Explícitamente out of scope Y1)**:
- Búsqueda full-text de precios históricos
- Matching automático de seguros
- Integración con banking (seguros de crédito)
- API pública para partners

---

### RICE Prioritization Summary

| Rank | Initiative | RICE Score | Phase |
|------|-----------|-----------|-------|
| 1 | M2 (SEO EN) | 3240 | NOW |
| 2 | M1 (Cotizador) | 2400 | NOW |
| 3 | M5 (Analytics v2) | 2000 (est) | NEXT |
| 4 | M4 (Seguros directo) | 400 | NEXT |
| 5 | S3 (Publicidad) | 250 | NEXT |
| 6 | M7 (Marketplace) | 300 (est) | LATER |
| 7 | S4 (Mobile) | 200 | NEXT |
| 8 | S5 (Referral) | 180 | LATER |
| 9 | S6 (Expansion) | 150 | LATER |
| 10 | S7 (ML) | 100 | LATER |

---

## CAPACIDAD Y RECURSOS

### Team Assumption
- 3 Backend engineers
- 1-2 Frontend engineers
- 1 PM (product manager)
- 1 Designer
- 0.5 Data analyst (part-time)

### Allocation Target

| Phase | Features (%) | Tech Debt (%) | Unplanned (%) |
|-------|-------------|---------------|--------------|
| NOW | 70% | 15% | 15% |
| NEXT | 65% | 20% | 15% |
| LATER | 55% | 30% | 15% |

**Reasoning**:
- NOW muy enfocado (dinero)
- NEXT expande pero mantiene core estable
- LATER más complejo, requiere deuda técnica (refactoring)

### Hires Estimados

| Cuando | Rol | Por Qué |
|--------|-----|--------|
| Junio | Mobile engineer | S4 mobile app |
| Agosto | Data analyst (full-time) | M5 analytics, LTV/CAC tracking |
| Noviembre | DevOps / Infrastructure | M7/M8 marketplace, vendor mgmt |

**Costo estimado**: $150K-180K salary + benefits por hire (Argentina senior)

---

## RISK REGISTER

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| **123seguro no soporta parámetros** | CRITICAL | 40% | Call ASAP, tener fallback, test antes de deploy |
| **Aseguradoras lentas** | HIGH | 70% | Iniciar contactos en mes 2 de NOW, no esperar |
| **Churn usuario alto** (sin engagement) | HIGH | 50% | Mantener features gratis valiosas (mapa, dólar, noticias) |
| **Competencia entra AR** (GasBuddy, Similar) | MEDIUM | 20% | Build moat: comunidad, network, data |
| **Fraud en marketplace** | MEDIUM | 40% | Validación estricta, manual approval vendors, KYC |
| **Team burnout** (scope too big) | MEDIUM | 45% | Priorizar ruthlessly, cortar scope, no agregar features nuevas |
| **Integración técnica aseguradoras lenta** | MEDIUM | 60% | Empezar integración en paralelo a negociación |
| **Product-market fit débil** (baja conversión) | CRITICAL | 30% | A/B testing agresivo, user research, iterate rápido |

---

## ROADMAP EJECUTIVO (1-PAGER)

### Visión (12 meses)
Tankear crece de $4K MRR (abril 2026) a $68K MRR (abril 2027) al resolver bloqueadores de monetización, abrir nuevos canales de ingresos (seguros directos, publicidad, marketplace) y expandir regionalmente.

### Estrategia por Fase

**NOW (abril-mayo)**: Fix the core
- Cotizador mejorado: +40% conversión
- SEO en inglés: +200% tráfico EN
- Admin dashboard: visibilidad operativa
- **Target**: $8K MRR (+100% de baseline)

**NEXT (junio-octubre)**: Scale revenue
- Seguros directos: +80% comisión por transacción
- Analytics avanzado: optimize acquisition
- Publicidad: nuevo canal
- Mobile app: better engagement
- **Target**: $30K MRR (+275% de baseline)

**LATER (noviembre-abril 2027)**: Build marketplace
- GNC / talleres / lubricantes
- Vendor management + pagos
- Expansion regional (Perú, Chile)
- Referral & network effects
- **Target**: $68K MRR (+1,600% de baseline)

### Resource Investment
- Team: 3-4 engineers, 1 PM, 1 designer, 0.5 analyst
- Budget: ~$180K hires en el año, $0 3rd party (MVP)
- Timeline: 52 semanas, 70% capacity en features, 20% tech debt, 10% buffer

### Key Bets
1. **Dinero en cotizador**: Todo depende de mejorar M1
2. **Partner con aseguradoras**: Multiplica comisión 3x
3. **Marketplace**: Abre nuevos ingresos, network effects

### Success Metrics
- **Primary**: $68K MRR (12 months)
- **Secondary**: 100K MAU, LTV/CAC > 15, 30% conversion rate
- **Tertiary**: Regional presence (Perú/Chile), app installs 15K+

---

## PRÓXIMOS PASOS (SEMANA 1)

### Acciones Inmediatas

**TODOS**:
1. Confirmar roadmap con stakeholders (CEO, Board si hay)
2. Calendario de review: roadmap review mensual (último Friday)

**PM**:
1. Setup admin dashboard logging (M3 depends)
2. Contactar 123seguro para call (M1 dependency)
   - Email: "Queremos integrar parámetros de vehículo en nuestro flujo de cotización para mejorar conversión. ¿Es posible? ¿Cuál es el timeline?"
3. Reservar time con aseguradoras (BD) para mes 2
   - Zurich, MAPFRE, Seguros Monterrey
   - Agenda: mayo para negociación, junio para firma
4. Plan inicial de A/B testing (frontend)

**ENGINEERING**:
1. Code review de M1 design doc
2. Reservar staging environment estable
3. Setup para M3 API endpoints (métricas)

**MARKETING**:
1. Acceso a Google Search Console
2. SEO audit actual (Screaming Frog o similar)

**SALES** (si hay):
1. Media kit para publicidad (S3)
2. Target list de sponsors

---

## VERSIONING

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-04-05 | Initial roadmap - NOW/NEXT/LATER, RICE + MoSCoW |

---

**Creado por**: Product Management
**Fecha**: 5 de abril de 2026
**Próxima revisión**: 2 de mayo de 2026 (después de hito NOW-M1 completado)
