# PRD: Cotizador de Seguros de Auto v2 - Tankear.com.ar

**Versión**: 1.0
**Fecha**: Abril 2026
**Propietario del Producto**: Product Manager - Monetización
**Stakeholders**: Growth, Engineering, Design, Data Analytics

---

## 1. Problem Statement

### El Problema

Actualmente, Tankear captura leads de seguros de auto **después** de que el usuario abandona la plataforma (post-redirect a 123seguro.com). Además, el formulario actual pide datos insuficientes (falta marca/modelo del auto y suma asegurada), lo que genera **cotizaciones imprecisas** y **baja tasa de conversión a compra**. No hay visibilidad sobre cuántos usuarios cotizaron vs. cuántos compraron.

### Quién Experimenta Este Problema

- **Usuarios**: No pueden obtener cotizaciones precisas sin marca/modelo/valor del auto
- **Tankear**: Pierde oportunidad de capturar leads de calidad antes del redirect; no mide conversiones
- **123seguro**: Recibe tráfico con datos incompletos, cotizaciones imprecisas, usuarios no calificados

### Impacto del Negocio

- **Lead Quality**: Datos incompletos = cotizaciones rechazadas por 123seguro = perdida de comisiones
- **Conversion Rate**: Sin lead capture en-site y con datos pobres, conversión estimada en <5%
- **Analytics Gap**: No sabemos cuántos cotizaron, cuántos compraron, cuál es el LTV de un lead capturado
- **Competitive Risk**: Otros comparadores (Seguros.com.ar, Asegurador.com.ar) ofrecen cotizaciones instantáneas con mejor UX

### Evidence

- Código actual: `SeguroCalculator.tsx` hace POST a `/api/insurance/quote` pero no captura respuesta antes del redirect
- URL de redirect: `https://www.123seguro.com/cotizador/auto?utm_source=tankear&utm_medium=widget...` (sin dato de lead)
- Mi Garage ya almacena autos del usuario (data disponible) pero NO se aprovecha en cotizador

---

## 2. Oportunidad de Negocio

Rediseñar el flujo de cotización para:
1. **Capturar leads ANTES del redirect** con datos completos (nombre, email, teléfono)
2. **Solicitar marca, modelo y valor del auto** para cotizaciones precisas
3. **Pre-poblar desde Mi Garage** si el usuario está logueado (reducir fricción)
4. **Trackear conversiones** via UTM + analytics events
5. **Aumentar lead quality** = mayor comisión por conversión

**Objetivo**: Pasar de <5% a 15%+ conversion rate en 6 meses.

---

## 3. Objetivos de la Feature

### Objetivos del Usuario
- ✅ Obtener cotizaciones de seguros precisas sin abandonar Tankear
- ✅ Reutilizar datos de "Mi Garage" para no re-ingresar información
- ✅ Recibir resultados rápidamente con opciones de cobertura clara

### Objetivos del Negocio
- ✅ Capturar leads de calidad ANTES del redirect (conversion tracking)
- ✅ Aumentar tasa de conversión a compra (lead quality + mejor UX)
- ✅ Obtener visibilidad sobre el full funnel: cotización → compra → comisión
- ✅ Embeber el cotizador en múltiples pages (Dashboard, RoadTrip, Dólar) para aumentar reach
- ✅ Recopilar data de preferencias de cobertura (útil para CRM/retargeting)

### Métricas de Éxito (KPIs)
- **Adoption**: 40% de usuarios que visitan el cotizador completan el Step 1 (lead capture)
- **Conversion**: 15% de leads capturados son derivados a compra (via UTM tracking)
- **Lead Quality**: 80%+ de leads tienen marca/modelo/valor del auto completo
- **Time to Value**: Promedio <90 segundos de Step 1 a Step 2
- **Engagement Velocity**: 25% de usuarios con autos en Mi Garage pre-completan el formulario
- **ROAS**: Incremento de comisiones recibidas en 40% vs. versión anterior en 6 meses

---

## 4. Non-Goals (Fuera de Scope v1)

- ❌ **Integración con API de 123seguro para cotizaciones instantáneas**: Requiere acuerdo comercial, es fase 2
- ❌ **Recomendación automática de cobertura**: Requiere ML model, es feature futura
- ❌ **Soporte para seguros de motocicleta o camiones**: Solo autos particulares/comerciales v1
- ❌ **Comparación multi-proveedor de seguros**: Tankear es afiliado exclusivo de 123seguro v1
- ❌ **Portal de gestión de pólizas post-compra**: Integración con 123seguro, fuera de scope

---

## 5. User Personas & Stories

### Personas

#### Persona A: Diego (Usuario Casual - 45%)
- **Demografía**: 28-35 años, CABA, sueldo medio-alto, conductor ocasional
- **Motivación**: Acaba de comprar auto usado, busca seguro urgente
- **Pain Point**: No sabe qué cobertura contratar; quiere comparar rápido
- **Uso**: Entra desde Google → Tankear → Cotizador de seguros → compra
- **Dispositivo**: Mobile (70%), Desktop (30%)

#### Persona B: María (Usuario Logueado - 35%)
- **Demografía**: 32-42 años, usuario frecuente de Tankear, tiene 2 autos en "Mi Garage"
- **Motivación**: Renuevar seguro anual, hacer cambios de cobertura
- **Pain Point**: Molesto reingresar datos del auto, quiere que Tankear "recuerde"
- **Uso**: Login → Dashboard → Mi Garage → Cotizador (datos pre-poblados) → compra
- **Dispositivo**: Desktop (60%), Mobile (40%)

#### Persona C: Roberto (Usuario de Road Trip - 20%)
- **Demografía**: 35-50 años, viajero frecuente, usa Road Trip Planner de Tankear
- **Motivación**: Busca seguro con cobertura de ruta larga
- **Pain Point**: Quiere cotizar sin abandonar la página del road trip
- **Uso**: RoadTripPage (embebido) → Cotizador modal → compra
- **Dispositivo**: Mobile (90%), Desktop (10%)

---

## 6. User Stories

### MUST HAVE (P0) - Core User Flows

#### Story 1: Capturar Lead en Step 1
```
As Diego (usuario casual sin login),
I want to enter my contact info (name, email, phone) before seeing insurance quotes,
So that Tankear has my data even if I don't complete the purchase (lead capture for CRM/retargeting).

Acceptance Criteria:
- [ ] Form shows fields: Name, Email (validated), Phone (Argentina format)
- [ ] Email validation prevents invalid addresses
- [ ] Phone format accepts +54, 0054, or local format (ej: 11 2345 6789)
- [ ] Submit button is disabled until all required fields are filled
- [ ] Form saves to DB (leads_captured table) with timestamp and referrer URL
- [ ] User can see a success message before redirect ("Tus datos fueron guardados")
- [ ] Error if email already exists: show "Ya existe un lead con este email" + option to continue

Given: Diego is on the cotizador (not logged in)
When: He enters Name = "Diego", Email = "diego@gmail.com", Phone = "1123456789"
Then: Data is saved to DB and he can proceed to Step 2

Given: Diego enters an invalid email "diego@invalid"
When: He clicks "Siguiente"
Then: Error appears "Email inválido, intenta de nuevo"

Given: Diego's email already exists in leads_captured table
When: He clicks "Siguiente"
Then: Message "Vemos que ya te contactamos. Continúa para ver nuevas opciones" + proceed option
```

#### Story 2: Solicitar Marca, Modelo, Año del Auto
```
As María (usuario logueado con autos en Mi Garage),
I want to select or enter my car's brand, model, year, and value,
So that insurance quotes are precise and match my vehicle.

Acceptance Criteria:
- [ ] Car brand field: dropdown with autocomplete (Fiat, Ford, Chevrolet, Toyota, etc.)
- [ ] Model field: depends on selected brand, shows only valid models
- [ ] Year field: calendar picker, min 1990, max current year
- [ ] Vehicle value field: number input with $ARS currency formatting
- [ ] If logged in + autos in Mi Garage: show "(Usar auto guardado)" button
- [ ] Click "Usar auto guardado" → pre-fills all fields + image of car
- [ ] Manual entry → shows input fields for all 4 fields
- [ ] Submit requires: brand, model, year, value (all P0)
- [ ] Form has helper text: "Necesitamos estos datos para cotizaciones precisas"

Given: María is logged in and has "Honda Civic 2020" in Mi Garage
When: She opens the cotizador
Then: A card appears "Usar Honda Civic 2020" with image + button to pre-fill

Given: Diego (not logged in) selects brand "Toyota"
When: He clicks the Model dropdown
Then: Only Toyota models appear (Corolla, Hilux, Fortuner, etc.)

Given: María clicks "Usar auto guardado" for her Honda
When: The form updates
Then: All fields are pre-filled (brand=Honda, model=Civic, year=2020, value=$X)
```

#### Story 3: Solicitar Datos de Uso del Auto & Cobertura
```
As any user,
I want to select my car's usage (personal/commercial) and desired coverage level,
So that I get quotes tailored to my needs.

Acceptance Criteria:
- [ ] Usage field: radio buttons "Uso Particular" vs "Uso Comercial"
- [ ] GNC field: checkbox "¿Usa GNC?" (sí/no)
- [ ] Coverage options: 3 presets "Cobertura Básica", "Cobertura Completa", "Cobertura Premium"
- [ ] Each coverage option shows tooltip with details (responsabilidad civil, todo riesgo, casco, etc.)
- [ ] User can also select "Custom" to see/edit individual coverages
- [ ] Default selection: "Cobertura Completa" (most popular)
- [ ] All fields are required before Step 2
- [ ] Form groups all questions logically (auto info, usage, coverage)

Given: Diego selects "Uso Comercial" and "No uses GNC"
When: He sees coverage options
Then: Available quotes are filtered to commercial policies (typically higher price)

Given: Roberto checks "Usa GNC"
When: He advances
Then: Coverage options are adjusted (GNC coverage is included in quotes)
```

#### Story 4: Two-Step Flow with Step 1 = Auto + Lead, Step 2 = Results
```
As any user,
I want a clear two-step flow where Step 1 captures my car + contact info,
and Step 2 shows results before redirecting to 123seguro,
So I don't feel rushed and can review options.

Acceptance Criteria:
- [ ] Step 1 form: Name, Email, Phone, Brand, Model, Year, Value, Usage, GNC, Coverage
- [ ] All fields marked as required; form won't submit if empty
- [ ] "Siguiente" button clearly leads to Step 2
- [ ] Progress indicator shows "Paso 1 de 2"
- [ ] Step 1 saves data to leads_captured table
- [ ] Step 2 shows "Resultados de tu cotización" with:
  - [ ] Summary of car (brand/model/year/value)
  - [ ] Summary of coverage selected
  - [ ] Disclaimer: "Estos precios son orientativos. Finaliza en 123seguro para confirmación."
  - [ ] "Ver Opciones en 123seguro" button (CTA, high contrast)
- [ ] Button redirects to 123seguro with all data in UTM params + custom headers
- [ ] Analytics event fired: event_name="insurance_quote_step2_view" + all user data

Given: Diego completes Step 1 with all required fields
When: He clicks "Siguiente"
Then: He sees Step 2 with a summary + "Ver Opciones en 123seguro" button

Given: Diego is on Step 2
When: He clicks "Ver Opciones en 123seguro"
Then: He is redirected to 123seguro with UTM params: utm_source=tankear&utm_medium=cotizador&utm_campaign=seguros_auto&leadid={DB_ID}
```

#### Story 5: Pre-populate from Mi Garage (Logged In Users)
```
As María (logged in user),
I want my auto data from "Mi Garage" to automatically pre-fill the cotizador,
So I don't have to re-enter brand, model, year, value.

Acceptance Criteria:
- [ ] On page load, if user is logged in + has autos in Mi Garage: show "(Usar auto guardado)"
- [ ] Clicking button → auto-fills brand, model, year, value fields
- [ ] If only 1 auto in Mi Garage → pre-fill by default (no button needed)
- [ ] If 2+ autos → show dropdown selector "¿Cuál auto quieres asegurar?"
- [ ] User can still manually edit pre-filled fields
- [ ] Contact info (name, email from user session) is also pre-filled but editable

Given: María logs in and has "Honda Civic 2020" in Mi Garage
When: She opens the cotizador
Then: Brand, Model, Year, Value are already filled in

Given: María has 2 cars in Mi Garage (Honda + Ford)
When: She opens the cotizador
Then: Dropdown shows "Honda Civic 2020" / "Ford Focus 2019" + she selects one

Given: María's email in the form is "maria@gmail.com" (from session)
When: She clicks into the email field
Then: She can edit it if needed before proceeding
```

#### Story 6: Lead Capture with UTM Tracking
```
As the Analytics team,
I want every lead captured to have full attribution data (source, medium, campaign, user_id),
So we can track conversion rates from cotizador to purchase.

Acceptance Criteria:
- [ ] leads_captured table has columns: id, user_id, email, phone, name, car_brand, car_model, car_year, car_value, usage_type, gnc, coverage_level, referred_from_url, utm_source, utm_medium, utm_campaign, utm_content, created_at, converted_at (nullable)
- [ ] On lead capture, automatically extract UTM params from current URL
- [ ] On form submit (Step 1), write record to leads_captured + fire analytics event
- [ ] Event schema: {event: "insurance_lead_captured", user_id, email, car_brand, referred_from_page, utm_source, timestamp}
- [ ] When user redirects to 123seguro, pass leadid={record_id} in URL
- [ ] 123seguro's webhook confirms purchase → update leads_captured.converted_at
- [ ] Dashboard shows: total leads by source, conversion rate, LTV per lead by channel

Given: Diego visits /seguros?utm_source=google&utm_medium=cpc&utm_campaign=auto
When: He completes Step 1
Then: leads_captured record has utm_source="google", utm_medium="cpc", utm_campaign="auto"

Given: María purchases insurance after lead capture
When: 123seguro's webhook fires with leadid={X}
Then: leads_captured[X].converted_at is updated with timestamp + "Comprado" flag

Given: Analytics team opens dashboard
When: They filter by utm_source="road_trip_page"
Then: They see 150 leads captured, 20 converted, 13% conversion rate
```

#### Story 7: Embed Cotizador in Dashboard, RoadTrip, Dólar Pages
```
As the Growth team,
I want to embed the insurance quote form in high-traffic pages (Dashboard, RoadTrip, DólarPage),
So we increase opportunity to capture leads from engaged users.

Acceptance Criteria:
- [ ] Cotizador component is exported as reusable module (embeddable in any page)
- [ ] Embed accepts props: ref_page="dashboard"|"road_trip"|"dolar_page", modal=true|false
- [ ] Modal mode: Form appears in lightbox, doesn't navigate away
- [ ] Full-page mode: Form is section on page (e.g., RoadTrip page footer)
- [ ] All tracking works the same (refer_page="dashboard" logged in DB)
- [ ] Responsive design works on mobile + desktop
- [ ] Each embed has its own analytics tracking (ref_page dimension)
- [ ] Versioning: embed v1 supports 2-step flow, modal or inline

Given: User is on Dashboard
When: They see "Asegura tu auto" card → clicks → modal appears with cotizador
Then: Completion of Step 1 doesn't navigate away; modal shows Step 2 results + redirect button

Given: User is on RoadTrip page planning a trip
When: They scroll to bottom and see "Viajar asegurado" section
Then: Inline cotizador is visible; Step 1 completion updates page to show Step 2 results

Given: Analytics team checks dashboard
When: They filter events by ref_page="road_trip"
Then: They see 500 cotizador opens, 180 Step 1 completions, 36% conversion rate
```

#### Story 8: Improved CTA & Messaging
```
As Diego (user considering buying insurance),
I want the call-to-action to feel urgent and clear,
So I'm motivated to complete the process and not abandon.

Acceptance Criteria:
- [ ] CTA button text: "Ver mis opciones" (not "Ver cotizaciones")
- [ ] Button color: vibrant (teal/orange) with high contrast
- [ ] Microcopy before button: "Completa en 2 minutos"
- [ ] Step 1 header: "Asegura tu auto en 2 pasos"
- [ ] Step 2 header: "Opciones disponibles para tu {marca} {modelo}"
- [ ] Inline help text: "Necesitamos estos datos para cotizaciones precisas"
- [ ] If validation error: "Ups, falta llenar {field}. Intenta de nuevo."
- [ ] No aggressive copy (e.g., no "¡ÚLTIMAS PLAZAS!" or fake urgency)

Given: Diego is on Step 1
When: He sees the form header
Then: It reads "Asegura tu auto en 2 pasos"

Given: Diego has filled 5/8 fields
When: He clicks "Ver mis opciones"
Then: Form shows inline error "Falta Email y Valor del auto" (highlight empty fields)

Given: Diego is on Step 2
When: He sees the header
Then: It displays "Opciones disponibles para tu Ford Focus"
```

### SHOULD HAVE (P1) - Fast Follows

#### Story 9: Show Estimated Price Range in Step 2
```
As any user,
I want to see an estimated price range for my insurance before leaving Tankear,
So I can decide if it's worth completing the purchase on 123seguro.

Acceptance Criteria:
- [ ] Step 2 shows: "Precio estimado: $X.XXX - $Y.YYY/mes"
- [ ] Price is based on simple rules (brand, model, value, coverage) - not real quotes
- [ ] Disclaimer: "Precios estimados. Confirmación en 123seguro."
- [ ] Tooltip explains factors that affect price (marca, cobertura, provincia, etc.)

Note: Requires pricing rules table or integration with 123seguro's pricing model.
Target: Fast follow (2-3 weeks after v1).
```

#### Story 10: Email Confirmation & Lead Nurture
```
As María,
I want to receive an email confirming my cotización (with a link to re-visit 123seguro),
So I can easily come back if I don't complete the purchase immediately.

Acceptance Criteria:
- [ ] After Step 1 completion, send transactional email with:
  - Summary of car + coverage
  - Link to 123seguro (pre-populated with UTM params)
  - Reminder that quote is valid for 24h
- [ ] Email sent within 1 minute of lead capture
- [ ] Email can be tracked for open/click events
- [ ] Include option to opt-out of future emails (comply with AACC/GDPR-style regulations)

Note: Requires email service (SendGrid, Mailgun). Fast follow.
```

#### Story 11: Retargeting Pixel & Audience Segment
```
As the Growth team,
I want to tag users who started the cotizador but didn't complete,
So we can retarget them with ads.

Acceptance Criteria:
- [ ] Fire pixel on Step 1 open: `segment.track('insurance_quote_started')`
- [ ] Fire pixel on Step 1 completion: `segment.track('insurance_lead_captured')`
- [ ] Fire pixel on Step 2 redirect: `segment.track('insurance_quote_converted')`
- [ ] Create audience in Segment: "Insurance Quote Non-Completers" (open but not captured)
- [ ] Audience syncs to Google Ads, Facebook for retargeting campaigns

Note: Requires Segment setup. Fast follow.
```

#### Story 12: Admin Dashboard for Leads
```
As the Growth Manager,
I want to see a real-time dashboard of insurance leads (status, conversion, revenue),
So I can track campaign performance and optimize.

Acceptance Criteria:
- [ ] Dashboard shows: Total leads, conversion rate, LTV, leads by source/campaign
- [ ] Filterable by: date range, utm_source, utm_medium, ref_page, converted (yes/no)
- [ ] Export CSV option
- [ ] Webhook status: when was last 123seguro conversion confirmed?
- [ ] Alerts: if conversion rate drops below 10%

Note: Requires BI setup (e.g., Mixpanel, Amplitude, or custom analytics table). Fast follow.
```

### COULD HAVE (P2) - Architectural Considerations

#### Story 13: A/B Test CTA Copy & Button Color
```
Hypothesis: "Ver mis opciones" converts better than "Ver cotizaciones"
A/B test button color (teal vs orange) to determine best-performing variant.
```

#### Story 14: Integration with 123seguro Pricing API
```
Future: Call 123seguro's real-time pricing API to show exact prices in Step 2 (not estimates).
Requires API contract + latency optimization.
```

#### Story 15: Custom Coverage Builder
```
Future: Allow users to customize coverage item-by-item instead of presets.
Requires more complex UX, educational content.
```

#### Story 16: Soporte Multi-Proveedor de Seguros
```
Future: Integrate with 2nd, 3rd insurance provider (not just 123seguro).
Requires separate affiliate agreements, pricing integration, complex routing logic.
```

---

## 7. Requisitos Funcionales Detallados

### RF-1: Formulario de Step 1 (Auto + Lead Capture)

**Descripción**: Form con 8 campos requeridos: nombre, email, teléfono, marca, modelo, año, valor, tipo de uso, GNC, cobertura.

**Detalles**:
- Campos:
  1. **Nombre**: Text input, min 3 chars, max 100 chars
  2. **Email**: Email input, validación RFC 5322, verificación de duplicados en DB
  3. **Teléfono**: Text input, formato Argentina (+54 / 0054 / local), min 10 dígitos
  4. **Marca del Auto**: Dropdown con ~50 marcas (Fiat, Ford, Chevrolet, Toyota, Volkswagen, Renault, Hyundai, etc.)
  5. **Modelo del Auto**: Dropdown dinámico (depende de marca seleccionada)
  6. **Año del Auto**: Select/Picker, rango 1990-2026
  7. **Valor del Auto**: Number input, currency formato $ARS, min $50k, max $10M
  8. **Uso del Auto**: Radio buttons "Uso Particular" / "Uso Comercial"
  9. **Usa GNC**: Checkbox "Sí" / "No"
  10. **Cobertura Deseada**: Radio buttons "Cobertura Básica", "Cobertura Completa" (default), "Cobertura Premium"

- Validaciones:
  - Todos los campos son required; submit deshabilitado si alguno está vacío
  - Email: validar formato + no permitir emails genéricos no-domain (invalid@invalid)
  - Teléfono: convertir a formato standar antes de guardar
  - Modelo: re-validar que sea modelo válido para la marca seleccionada
  - Valor: debe ser número positivo, > $50k

- Persistencia:
  - Al hacer click en "Siguiente", POST a `/api/insurance/leads` con payload:
    ```json
    {
      "name": "Diego",
      "email": "diego@gmail.com",
      "phone": "+541123456789",
      "car_brand": "Ford",
      "car_model": "Focus",
      "car_year": 2020,
      "car_value": 1200000,
      "usage_type": "particular",
      "has_gnc": false,
      "coverage_level": "completa",
      "referred_from_url": "https://tankear.com.ar/seguros?utm_source=google...",
      "user_id": "maria_123" // null si no logueado
    }
    ```
  - Respuesta: `{ id: "lead_xyz", success: true, next_step: "redirect_or_show_results" }`
  - Si email duplicado: `{ error: "Email ya existe", action: "continue_anyway" }`

- Integración con Mi Garage:
  - Si user logueado + tiene 1 auto en Mi Garage: botón "(Usar auto guardado)" visible
  - Click en botón → auto-fill brand, model, year, value desde DB
  - Si 2+ autos: dropdown selector

---

### RF-2: Pantalla de Step 2 (Resultados)

**Descripción**: Mostrar resumen de cotización y CTA a 123seguro.

**Detalles**:
- Contenido:
  - Header: "Opciones disponibles para tu {marca} {modelo} {año}"
  - Card 1 - Resumen del auto:
    - Imagen (auto genérica por marca/modelo)
    - Marca, modelo, año, valor
    - Uso (particular/comercial), GNC (sí/no)
  - Card 2 - Cobertura seleccionada:
    - Nombre de cobertura (Básica/Completa/Premium)
    - Breakdown: "Responsabilidad civil, Todo riesgo, Asistencia 24h..."
  - Card 3 - Precio estimado (P1):
    - "Precio estimado: $X.XXX - $Y.YYY/mes"
    - Disclaimer: "Precios orientativos. Confirmación en 123seguro."
  - Button grande: "Ver mis opciones en 123seguro" (CTA)
  - Link pequeño: "Cambiar datos" (vuelve a Step 1)

- Redirect:
  - Click en CTA → GET a `https://www.123seguro.com/cotizador/auto?leadid={lead_id}&utm_source=tankear&utm_medium=cotizador&utm_campaign=seguros_auto&utm_content={coverage_level}`
  - Parámetro `leadid` usado por 123seguro para asociar la compra al lead

---

### RF-3: Lead Capture & Database Schema

**Descripción**: Persistencia de leads con tracking de conversión.

**Tabla**: `leads_captured`
```sql
CREATE TABLE leads_captured (
  id VARCHAR(36) PRIMARY KEY, -- UUID
  user_id VARCHAR(36), -- FK a users table (nullable if not logged in)
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,

  -- Car details
  car_brand VARCHAR(50) NOT NULL,
  car_model VARCHAR(100) NOT NULL,
  car_year INT NOT NULL,
  car_value BIGINT NOT NULL, -- en centavos (1.2M = 120000000)

  -- Preferences
  usage_type ENUM('particular', 'comercial') NOT NULL,
  has_gnc BOOLEAN NOT NULL,
  coverage_level ENUM('basica', 'completa', 'premium') NOT NULL,

  -- Attribution
  referred_from_url TEXT,
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  utm_content VARCHAR(100),
  ref_page ENUM('cotizador', 'dashboard', 'road_trip', 'dolar_page', 'home') DEFAULT 'cotizador',

  -- Status tracking
  status ENUM('capturado', 'derivado', 'convertido', 'no_convertido') DEFAULT 'capturado',
  converted_at TIMESTAMP NULLABLE,

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY unique_email_per_day (email, DATE(created_at)),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at),
  INDEX idx_status (status),
  INDEX idx_utm_source (utm_source)
);
```

---

### RF-4: Analytics & Event Tracking

**Descripción**: Eventos fired para tracking de funnel.

**Eventos a trackear**:
1. **insurance_quote_opened**
   - When: Usuario abre la página del cotizador
   - Payload: `{ ref_page, user_id, timestamp }`

2. **insurance_step1_viewed**
   - When: Step 1 form es visible al usuario
   - Payload: `{ ref_page, user_id, timestamp }`

3. **insurance_step1_field_focused**
   - When: Usuario hace focus en cada campo (para detectar fricción)
   - Payload: `{ field_name, timestamp }`

4. **insurance_lead_captured**
   - When: Usuario completa Step 1 y hace submit
   - Payload: `{ lead_id, email, car_brand, car_model, coverage_level, utm_source, timestamp }`

5. **insurance_step2_viewed**
   - When: Step 2 (resultados) es visible
   - Payload: `{ lead_id, timestamp }`

6. **insurance_redirect_clicked**
   - When: Usuario hace click en "Ver mis opciones en 123seguro"
   - Payload: `{ lead_id, timestamp }`

7. **insurance_lead_converted**
   - When: Webhook de 123seguro confirma compra
   - Payload: `{ lead_id, purchase_price, timestamp }`

**Implementación**:
- Fire eventos vía `window.analytics.track()` (Segment/Mixpanel/custom GA4)
- Backend también log eventos en tabla `analytics_events` para redundancia
- Dashboard expone: funnel drop-off, time between steps, conversion by source

---

### RF-5: Integración con 123seguro (Redirect)

**Descripción**: Cuando usuario hace click en CTA, redirigir a 123seguro con parámetros.

**URL de redirect**:
```
https://www.123seguro.com/cotizador/auto?
  leadid={lead_id}&
  utm_source=tankear&
  utm_medium=cotizador&
  utm_campaign=seguros_auto&
  utm_content={coverage_level}&
  car_brand={marca}&
  car_model={modelo}&
  car_year={año}&
  car_value={valor}&
  usage_type={tipo_uso}&
  has_gnc={booleano}
```

**Header Custom** (si 123seguro acepta):
```
X-Tankear-LeadId: {lead_id}
X-Tankear-Email: {email}
X-Tankear-Phone: {phone}
```

**Webhook de 123seguro** (confirmación de compra):
- 123seguro envía POST a `/api/insurance/webhooks/conversion` con:
  ```json
  {
    "leadid": "lead_xyz",
    "purchase_id": "purchase_456",
    "purchase_price": 1500000,
    "timestamp": "2026-04-05T10:30:00Z"
  }
  ```
- Tankear verifica `leadid` existe en `leads_captured`, actualiza `status='convertido'` y `converted_at`

---

### RF-6: Responsive Design & Cross-Device

**Descripción**: Formulario funciona en mobile (iOS/Android), tablet, desktop.

**Breakpoints**:
- Mobile: <576px - Single column, full-width inputs, touch-friendly (min 44px tap targets)
- Tablet: 576px-992px - Single column, increased padding
- Desktop: >992px - Single or 2-column layout (si es necesario)

**Mobile UX specifics**:
- Keyboard handling: inputs push up cuando virtual keyboard aparece
- Select fields: usan native mobile picker (date picker, dropdown)
- CTA button: min 44x44px (touch target), sticky bottom if needed

---

### RF-7: Embedded Cotizador (Embeds)

**Descripción**: Componente reutilizable que puede embeberse en múltiples páginas.

**Props del componente**:
```typescript
interface InsuranceQuoteEmbedProps {
  refPage: 'cotizador' | 'dashboard' | 'road_trip' | 'dolar_page' | 'home';
  modal?: boolean; // default true = modal, false = inline
  onQuoteSubmitted?: (leadId: string) => void;
  onRedirect?: (redirectUrl: string) => void;
}
```

**Comportamiento**:
- **Modal mode**:
  - Form aparece en lightbox/modal
  - Step 1 completion no navega
  - Step 2 results en modal + botón "Ver mis opciones" hace redirect en nueva tab

- **Inline mode**:
  - Form es parte del page layout
  - Após Step 1, Step 2 results aparecen below form
  - CTA button hace redirect normal o en nueva tab (configurable)

**Importación en componentes**:
```typescript
import { InsuranceQuoteEmbed } from '@tankear/insurance';

// En Dashboard
<InsuranceQuoteEmbed refPage="dashboard" modal={true} />

// En RoadTrip
<InsuranceQuoteEmbed refPage="road_trip" modal={false} />
```

---

## 8. Requisitos No-Funcionales

### RNF-1: Performance
- **Step 1 load time**: <1.5s (incluyendo fetch de marcas/modelos de auto)
- **Step 1 to Step 2**: <500ms (API call para crear lead debe ser fast)
- **Redirect latency**: <200ms desde click a redirect (no lag)
- **Form input response**: <50ms (debounce para validación de email)
- **Optimization**:
  - Lazy load imágenes de autos
  - Minify & compress JS/CSS
  - Cache lista de marcas/modelos en localStorage o CDN

### RNF-2: Disponibilidad & Reliability
- **SLA**: 99.5% uptime (horario de negocio)
- **Graceful degradation**: Si Mi Garage no carga, formulario sigue funcionando sin pre-fill
- **Error handling**: Si 123seguro redirect falla, mostrar fallback (email con link manual)
- **Retry logic**: Si POST a `/api/insurance/leads` falla, reintentar 3 veces con backoff exponencial

### RNF-3: Seguridad
- **HTTPS only**: Todos los requests deben ser encrypted
- **CSRF protection**: Form token en todos los POSTs
- **Input sanitization**: Todos los campos sanitizados antes de guardar en DB (prevent SQL injection, XSS)
- **Rate limiting**: Max 10 leads por IP por hora (prevent abuse)
- **PII protection**: No loguear datos completos de email/phone en logs públicos; usar hashing

### RNF-4: Compliance & Privacy
- **AACC / GDPR-style**:
  - Consentimiento implícito al capturar lead (form acepta términos)
  - Link a política de privacidad visible en form
  - Opción de opt-out en email de confirmación
- **Data retention**: Mantener leads_captured por 12 meses; después anonimizar
- **Webhook verification**: Verificar firma HMAC en webhook de 123seguro (prevent spoofing)

### RNF-5: Localization & Internationalization
- **v1**: Solo español Argentina (es-AR)
- **Future**: Estructura para soportar es-ES, pt-BR si expande

### RNF-6: Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Android Chrome 90+)
- No soporte para IE 11

### RNF-7: Accessibility (WCAG 2.1 Level AA)
- Form labels asociadas con inputs (`<label for="email">`)
- Color contrast ratio >= 4.5:1 para texto
- Keyboard navigation completa (Tab/Enter/Escape)
- Error messages en aria-live regions
- Screen reader support (testing con NVDA)

### RNF-8: Monitoring & Observability
- **Logging**: Todos los eventos críticos loguados con timestamp, user_id, lead_id
- **Metrics**:
  - Form load time (histogram)
  - API latency para `/api/insurance/leads` (p50, p95, p99)
  - Error rate por tipo (validation error, API error, network error)
  - Funnel completion rate por step
- **Alerting**: Trigger alert si error rate > 5% en últimos 5 min

---

## 9. Métricas de Éxito (KPIs)

### Leading Indicators (0-7 días post-launch)

| Métrica | Target | Cómo medir | Herramienta |
|---------|--------|-----------|-------------|
| **Feature Adoption** | 40% de users que abren cotizador completan Step 1 | (leads_captured / quote_opens) × 100 | Analytics DB |
| **Time to Complete Step 1** | Median <90 segundos | timestamp diferencias entre quote_opened y lead_captured | Analytics |
| **Form Validation Error Rate** | <10% (dropoff due to validation) | (validation_errors / step1_submissions) × 100 | Event tracking |
| **Mi Garage Pre-fill Adoption** | 35% de logged-in users usan botón "Usar auto guardado" | (pre_fills_used / logged_in_opens) × 100 | Analytics |
| **Step 2 Redirect Rate** | 85% de Step 1 completers llegan a Step 2 | (step2_views / step1_completions) × 100 | Analytics |
| **CTA Click-Through** | 75% de Step 2 viewers hacen click en "Ver mis opciones" | (redirects / step2_views) × 100 | Analytics |

### Lagging Indicators (14-30 días post-launch)

| Métrica | Target | Cómo medir | Herramienta |
|---------|--------|-----------|-------------|
| **Lead Quality** | 80% de leads tienen todos 4 campos de auto (brand, model, year, value) completos | (leads_with_full_auto_data / total_leads) × 100 | Analytics DB |
| **Conversion Rate (Lead → Purchase)** | 15% (leads capturados que se convierten en compra) | (leads_converted / total_leads) × 100 | Webhook + DB |
| **Cost per Qualified Lead** | $5 ARS (calculado después de saber conversion rate) | Total spend / total leads | Financial tracking |
| **Lead to Purchase Latency** | <48 horas (promedio) | (converted_at - created_at) para converted leads | Analytics |
| **Embed Performance** | 30% of embedded cotizadores (Dashboard, RoadTrip) generan leads | (leads_by_embed / total_embeds_shown) × 100 | Event tracking |

### Business Metrics (30-180 días)

| Métrica | Target | Cómo medir |
|---------|--------|-----------|
| **Revenue per Lead** | $150 ARS (comisión promedio por lead convertido) | Total commission / total leads |
| **LTV Improvement** | +40% vs. old system (estimado: $5.25 → $7.35 por lead) | Compare old funnel vs. new |
| **CAC Payback Period** | <3 meses (cuánto tarda recuperar cost de acquisition) | LTV / (total spend / total leads) |
| **Monthly Recurring Commission** | +25% mes-a-mes (due to better lead quality) | Total monthly commission trend |
| **Retention of Purchased Customers** | 65% renuevan seguro al año siguiente | Track customers 12 months post-purchase |

### Guardrail Metrics (alertas si se degradan)

| Métrica | Mínimo Aceptable | Acción |
|---------|------------------|--------|
| **API Availability** | 99.5% | Page alert si cae |
| **Form Load Time (p95)** | <3 segundos | Investigate if breaches |
| **Error Rate** | <5% | Investigate cause |
| **Email Validation Failure** | <1% | Improve validation logic |

---

## 10. Criterios de Aceptación (Acceptance Criteria)

### Feature Completion Checklist

#### Pre-Launch
- [ ] Backend API `/api/insurance/leads` implementado y testeado (unit + integration tests)
- [ ] Database schema (leads_captured) creado y migrado en producción
- [ ] Frontend form validations implementadas (client + server side)
- [ ] Mi Garage integration testeado (pre-fill works para 1, 2, 3+ autos)
- [ ] Analytics eventos configurados y firing correctamente
- [ ] 123seguro webhook endpoint implementado y testeado
- [ ] Redirect URL a 123seguro validada (parámetros correctos)
- [ ] Mobile responsiveness testeado en iOS Safari y Android Chrome
- [ ] Accessibility audit completado (WCAG 2.1 Level AA)
- [ ] Performance tested (load time, API latency, redirect latency)
- [ ] Error handling testeado (network errors, validation errors, edge cases)
- [ ] Rate limiting implementado en endpoint de leads
- [ ] Security review completado (CSRF, input sanitization, PII protection)
- [ ] Staging environment deployado y QA-tested
- [ ] Documentation completada (API spec, component docs, runbook)

#### Launch
- [ ] Feature flag creado (para early rollout: 10% → 25% → 50% → 100%)
- [ ] Monitoring & alerting configurado
- [ ] On-call rotation establecido
- [ ] Stakeholders notificados (123seguro, Growth team, Finance)

#### Post-Launch (First Week)
- [ ] Analytics dashboard accesible y mostrando datos en real-time
- [ ] 0 critical incidents en producción
- [ ] Form completion rate >= 35%
- [ ] No more than 5% validation error rate
- [ ] Redirect to 123seguro working para 100% de users
- [ ] Team debriefing: lessons learned, improvements para v1.1

---

## 11. User Workflow & Wireframe Description

### Flow Overview

```
Start: User visits /seguros
  ↓
Check: Is user logged in?
  ├─ YES → Check: Autos in Mi Garage?
  │         ├─ YES → Show: "Usar auto guardado" button (pre-fill option)
  │         └─ NO → Manual entry
  │
  └─ NO → Manual entry (no pre-fill)
  ↓
STEP 1: Form Appearance
┌─────────────────────────────────────────┐
│ Asegura tu auto en 2 pasos              │
│─────────────────────────────────────────│
│                                         │
│ [Nombre: ________________________]      │
│ [Email: _________________________]      │
│ [Teléfono: ______________________]      │
│ [Marca: ▼] [Modelo: ▼]                 │
│ [Año: ▼] [Valor: $_____________]       │
│ ○ Uso Particular  ○ Uso Comercial      │
│ ☐ Usa GNC                              │
│ ○ Cobertura Básica                     │
│ ○ Cobertura Completa (selected)        │
│ ○ Cobertura Premium                    │
│─────────────────────────────────────────│
│          [Siguiente →]                  │
│       o Cambiar datos                  │
└─────────────────────────────────────────┘
  ↓
STEP 2: Results
┌─────────────────────────────────────────┐
│ Opciones disponibles para tu Ford Focus │
│─────────────────────────────────────────│
│                                         │
│ [Auto Card]  [Ford Focus 2020]         │
│              Valor: $1.200.000          │
│              Uso: Particular, Sin GNC  │
│                                         │
│ [Coverage Card] Cobertura Completa     │
│ • Responsabilidad civil                │
│ • Todo riesgo                          │
│ • Asistencia 24h                       │
│                                         │
│ Precio estimado: $1.500-$1.800/mes     │
│ (Precios orientativos. Confirmación    │
│  en 123seguro)                         │
│─────────────────────────────────────────│
│   [Ver mis opciones en 123seguro ▶]    │
│         ← Cambiar datos                │
└─────────────────────────────────────────┘
  ↓
Redirect to:
https://www.123seguro.com/cotizador/auto?
  leadid=lead_xyz&
  utm_source=tankear&
  utm_medium=cotizador&
  utm_campaign=seguros_auto&
  utm_content=completa
```

### Embedded Modal (Dashboard)

```
[Dashboard Content]
  ├─ [Cards for: Mis autos, Mis viajes, etc.]
  │
  └─ [Insurance Card]
     "Asegura tu auto en 2 pasos"
     [Abre formulario en modal]

     └─ [Modal Window]
        ├─ STEP 1 form (same as above)
        └─ STEP 2 results (same as above)

        On "Ver mis opciones":
        - Redirect in new tab (don't close modal)
        - Modal closes
```

### Inline Embed (RoadTrip Page)

```
[RoadTrip Planner Content]
├─ Trip details
├─ Route map
├─ Estimated time/distance
│
└─ Footer Section:
   ┌────────────────────────────┐
   │ Viaja asegurado            │
   │                            │
   │ [Cotizador inline aquí]    │
   │ STEP 1 form                │
   │ STEP 2 results             │
   │ CTA → redirect in new tab  │
   └────────────────────────────┘
```

---

## 12. Riesgos & Mitigations

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|--------|-----------|
| **API bottleneck**: `/api/insurance/leads` se vuelve cuello de botella si tráfico aumenta rápido | Media | Alto | Implementar caching, rate limiting, horizontal scaling; monitor latency |
| **Data quality**: Usuarios ingresan datos falsos o incompletos (ej: valor del auto inválido) | Alta | Medio | Validación robusta (client + server), limpieza de data en batch, alertas |
| **123seguro integration fails**: Webhook de conversión no funciona, no sabemos si compraron | Media | Alto | Monitoring proactivo del webhook, fallback polling cada 24h, alertas |
| **Privacy violation**: Accidentalmente loguear PII (email, phone) en logs públicos | Baja | Crítico | Code review, automated secret scanning, PII redaction en logs |
| **Mobile UX breaks**: Form no funciona bien en mobile (keyboard handling, layout) | Media | Medio | QA testing en múltiples devices, responsive design testing |
| **Lead duplicate capture**: Mismo usuario crea 2 leads (abrir form 2 veces) | Alta | Bajo | Deduplicación en DB, session-based fingerprinting, idempotent API |
| **Competitive response**: Otros competidores lanzan feature similar | Baja | Bajo | Continuar innovando, mejorar UX, mejor targeting/messaging |
| **Regulatory**: AACC o autoridad regulatoria cuestiona lead capture practices | Muy baja | Crítico | Legal review, transparent privacy policy, opt-out mechanism |
| **Embeds cannibalize**: Users en Dashboard/RoadTrip dejan de visitar /seguros page | Media | Bajo | Monitor traffic by channel, optimize each channel, A/B test |

**Mitigations a implementar antes de launch:**
1. Load testing: Simular 10x current traffic, verificar API no colapsa
2. Webhook testing: Integración completa con staging 123seguro
3. Security audit: Scan para secrets, PII, CSRF, injection vulnerabilities
4. Mobile testing: iOS Safari, Android Chrome, Firefox Mobile
5. Accessibility testing: NVDA screen reader, keyboard navigation
6. Disaster recovery: Documentar runbook para recovery si data loss

---

## 13. Timeline & Dependencies

### Propuesta: 6 Semanas a Producción (v1 MVP)

#### Week 1: Design & Spec Finalization
- [ ] Design review: Figma wireframes + prototyping (2-3 días)
- [ ] API spec finalized (Open API / Swagger)
- [ ] Database schema reviewed by DBA
- [ ] Tech stack & architecture confirmed

**Deliverables**: Final Figma file, API spec, DB design doc

#### Week 2-3: Backend Development (2 semanas)
- [ ] API endpoint `/api/insurance/leads` (POST)
- [ ] Database migrations + schema creation
- [ ] Authentication & authorization (solo user logueado puede ver pre-fill)
- [ ] Mi Garage integration (fetch autos)
- [ ] Analytics event tracking (backend)
- [ ] Webhook endpoint para 123seguro conversiones
- [ ] Rate limiting + error handling
- [ ] Unit tests + integration tests (>80% coverage)

**Deliverables**: Working API in staging, test suite, monitoring setup

#### Week 3-4: Frontend Development (2 semanas)
- [ ] React component: InsuranceQuoteForm (Step 1)
- [ ] React component: InsuranceQuoteResults (Step 2)
- [ ] Form validation (client-side)
- [ ] Mobile responsive design
- [ ] Analytics event firing (client-side)
- [ ] Embed component (reusable props)
- [ ] Error states & loading states
- [ ] E2E tests (Cypress, >70% coverage)

**Deliverables**: Working frontend in staging, E2E tests

#### Week 4-5: Integration & QA (1.5 semanas)
- [ ] End-to-end testing (full flow: form → API → 123seguro)
- [ ] Load testing (10x traffic simulation)
- [ ] Security audit (OWASP top 10, PII handling)
- [ ] Accessibility testing (WCAG 2.1 AA)
- [ ] Mobile testing (iOS/Android real devices)
- [ ] Performance testing (lighthouse, API latency)
- [ ] Documentation: API docs, component docs, runbook

**Deliverables**: QA sign-off, security clearance, performance report

#### Week 5-6: Launch Prep & Monitoring (1 semana)
- [ ] Feature flag setup (10% → 100% rollout)
- [ ] Monitoring & alerting configured (Datadog/New Relic/custom)
- [ ] On-call runbook + escalation
- [ ] Stakeholder comms (123seguro, Growth, Finance)
- [ ] Analytics dashboard setup
- [ ] Staging final sign-off
- [ ] Prod deployment (blue-green or canary)

**Deliverables**: Live in production, monitoring active, team trained

### Critical Dependencies

| Tarea | Depende De | Owner | ETA |
|-------|-----------|-------|-----|
| API spec | Product design finalization | PM | Semana 1 |
| DB schema | API spec | Backend Lead | Semana 1 |
| Frontend dev | Design finalization | Frontend Lead | Semana 2 |
| 123seguro webhook | Acuerdo API con 123seguro | Partnerships | Semana 2 |
| Mi Garage integration | Backend API de Mi Garage (existing) | Backend | Semana 3 |
| Analytics setup | Event naming/schema approval | Data team | Semana 3 |
| Load testing | Infrastructure/staging ready | DevOps | Semana 4 |
| Feature flag | Feature flagging platform live | DevOps | Semana 5 |

**Risk Mitigations**:
- Si 123seguro webhook retrasado: Implementar polling fallback
- Si Mi Garage API no disponible: Lanzar sin pre-fill en Week 1, agregar en Week 1.5
- Si load testing revela problema: Agregar 1 semana buffer

### Post-Launch Roadmap (P1 Fast Follows)

- **Week 7-8**: Pricing estimates integration (Story 9)
- **Week 9-10**: Email confirmation + nurture (Story 10)
- **Week 11-12**: Retargeting pixel + audience (Story 11)
- **Week 13-14**: Admin dashboard para leads (Story 12)
- **Ongoing**: A/B tests (CTA copy, button color), monitoring, optimizations

---

## 14. Success Criteria by Phase

### MVP Launch (v1)
- ✅ 2-step form completo (auto + lead + cobertura)
- ✅ Mi Garage pre-fill working
- ✅ Lead capture en DB antes del redirect
- ✅ Analytics events firing
- ✅ Webhook de conversión funcionando (basic)
- ✅ 40%+ form completion rate
- ✅ <500ms API latency (p95)
- ✅ 0 critical bugs en Week 1

### Month 1 (Optimization)
- ✅ 50%+ form completion rate
- ✅ 15%+ lead-to-purchase conversion rate
- ✅ <90 segundos promedio tiempo a completar
- ✅ Embedded cotizadores vivos en Dashboard + RoadTrip
- ✅ 30%+ de leads from embeds

### Month 3 (Scale)
- ✅ +40% monthly commission (vs baseline)
- ✅ 65%+ overall lead-to-purchase conversion rate
- ✅ <60 segundos promedio tiempo a completar
- ✅ Embedded en 5+ pages / sections
- ✅ 25%+ of total insurance leads from new flow

---

## 15. Open Questions

| Pregunta | Responde | Blocking? | Notas |
|----------|----------|-----------|-------|
| ¿123seguro puede recibir webhook de conversión en nuestro endpoint? | Partnerships | SÍ | Crítico para tracking |
| ¿Cuál es la lista oficial de marcas/modelos de autos vendidos en Argentina? | Data team | SÍ | Llenar dropdown |
| ¿Máximo valor de auto a considerar? ($10M límite razonable?) | Finance/123seguro | NO | Validación de form |
| ¿Qué coverage types incluir? (Básica, Completa, Premium = suficiente?) | 123seguro | NO | Puede ser configurado |
| ¿Timing esperado para conversión? (24h después del lead?) | 123seguro analytics | NO | Para retargeting strategy |
| ¿Podemos usar pixel de Google Ads / Facebook en form submit? | Legal | SÍ | Compliance check |
| ¿Retención de data histórica: 12 meses? (AACC/GDPR compliance) | Legal | SÍ | Data retention policy |

---

## 16. Appendix: Technical Considerations

### Stack Recomendado

- **Backend**: Node.js + Express (si ya existe), Go (si queremos performance), o Python + FastAPI
- **Database**: MySQL/PostgreSQL (relacional para leads_captured)
- **Frontend**: React (si ya existe), TypeScript recommended
- **Analytics**: Segment (cloud) o custom events DB + Google Analytics 4
- **Deployment**: Docker + Kubernetes (o simple EC2/managed containers)
- **Monitoring**: Datadog, New Relic, o CloudWatch + custom alerts

### API Examples

**POST /api/insurance/leads**
```json
Request:
{
  "name": "Diego García",
  "email": "diego@gmail.com",
  "phone": "+541123456789",
  "car_brand": "Ford",
  "car_model": "Focus",
  "car_year": 2020,
  "car_value": 1200000,
  "usage_type": "particular",
  "has_gnc": false,
  "coverage_level": "completa",
  "referred_from_url": "https://tankear.com.ar/seguros?utm_source=google&utm_medium=cpc&utm_campaign=seguros",
  "user_id": "user_123" // nullable
}

Response (200 OK):
{
  "id": "lead_abc123xyz",
  "status": "capturado",
  "message": "Lead capturado exitosamente",
  "next_url": "https://www.123seguro.com/cotizador/auto?leadid=lead_abc123xyz&utm_source=tankear&utm_medium=cotizador&utm_campaign=seguros_auto&utm_content=completa"
}

Response (400 Bad Request):
{
  "error": "Validación fallida",
  "details": {
    "email": "Email inválido",
    "car_value": "Debe ser > $50000"
  }
}
```

**POST /api/insurance/webhooks/conversion** (from 123seguro)
```json
Request:
{
  "leadid": "lead_abc123xyz",
  "purchase_id": "purchase_456",
  "purchase_price": 1500000,
  "timestamp": "2026-04-05T10:30:00Z"
}

Response (200 OK):
{
  "status": "success",
  "message": "Conversión registrada"
}
```

---

## 17. Resumen Ejecutivo

### El Challenge
Tankear captura leads de seguros después de que el usuario abandona la plataforma. Falta información crítica (marca/modelo del auto). Conversión estimada: <5%.

### La Solución
Rediseñar el cotizador con:
1. **Step 1**: Captura de lead + datos completos del auto (ANTES del redirect)
2. **Step 2**: Resumen de cotización + CTA mejorado
3. **Pre-fill desde Mi Garage** para usuarios logueados
4. **Tracking de conversiones** via UTM + webhook
5. **Embeds** en Dashboard, RoadTrip, DólarPage

### El Impacto Esperado
- **Adopción**: 40% form completion vs <5% hoy
- **Lead Quality**: 80% con datos completos del auto
- **Conversion**: 15% lead-to-purchase vs <5% hoy
- **Revenue**: +40% comisiones en 6 meses
- **LTV**: $7.35 por lead vs $5.25 hoy

### Timeline
6 semanas a producción (MVP). Fast follows: pricing estimates, email nurture, retargeting, admin dashboard.

### Next Steps
1. Kickoff con Engineering, Design, Data, 123seguro partnerships
2. Design finalization (Figma)
3. API spec + DB schema review
4. Sprint planning Week 1-2

---

**Documento preparado por**: Product Management Team
**Revisado por**: Engineering Lead, Design Lead, Data Analytics Lead
**Aprobado por**: Director de Monetización
**Última actualización**: Abril 2026
