# ESTRATEGIA COMPLETA DE CAPTACIÓN DE LEADS - TANKEAR.COM.AR

**Última actualización:** Abril 2026
**Objetivo:** Capturar emails y números de WhatsApp/celular para venta de seguros y construcción de base de datos
**Meta anual:** 50,000+ leads cualificados con 60%+ tasa de conversión a cotizaciones

---

## ÍNDICE
1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Marco Estratégico](#marco-estratégico)
3. [Tácticas por Página/Touchpoint](#tácticas-por-páginatouchpoint)
4. [Estrategias Transversales](#estrategias-transversales)
5. [Canales de Notificación](#canales-de-notificación)
6. [Segmentación y Personalización](#segmentación-y-personalización)
7. [Calendario de Implementación](#calendario-de-implementación)
8. [KPIs y Métricas](#kpis-y-métricas)

---

## RESUMEN EJECUTIVO

### Enfoque: Propuesta de Valor Contextual
El éxito de esta estrategia radica en **no pedir datos sin ofrecer valor inmediato**. Cada formulario de captura debe estar acompañado de una propuesta específica que el usuario entienda y valore en el contexto donde se le presenta.

**Stack técnico existente:**
- POST /leads (backend) - email, celular, zona, página_origen
- MiniLeadForm & LeadCaptureForm (frontend)
- FloatingLeadBanner (35 segundos después de entrar)
- Telegram planeado

**Oportunidades identificadas:** 7 páginas principales con 40+ puntos de captación únicos

**Estrategia de canales:**
- **Email** (60%): Para notificaciones recurrentes (cambios de precio, recordatorios)
- **WhatsApp** (35%): Para alertas urgentes, recordatorios críticos (vencimiento VTV), promos
- **Telegram** (5%): Para early adopters, comunidad de conductores

---

## MARCO ESTRATÉGICO

### Segmentación de Leads por Etapa

```
AWARENESS → CONSIDERATION → CONVERSION → RETENTION
   ↓             ↓               ↓            ↓
Newsletters  Alertas precio   Cotizador    Cross-sell
Road trips   Comparativas      Lead gate    Referidos
Noticias     Mi Garage         WhatsApp     Loyalty
```

### Propuestas de Valor por Tipo de Lead

| Tipo de Lead | Valor Ofrecido | Urgencia | Canal Principal | Probabilidad de Seguros |
|---|---|---|---|---|
| **Precio de nafta** | Ahorros en combustible | Baja | Email | 30% |
| **Dólar blue** | Información financiera | Media | Email/WhatsApp | 20% |
| **VTV/Patente** | Recordatorios legales | Alta | WhatsApp + Email | 75% |
| **Seguro expirado** | Renovación sin sorpresas | Muy alta | WhatsApp | 90% |
| **Road trip** | Seguridad en ruta | Media | Email | 40% |
| **Newsletter** | Comunidad de conductores | Baja | Email | 35% |
| **Sorteos** | Premios reales | Muy alta | WhatsApp/Email | 55% |

---

## TÁCTICAS POR PÁGINA/TOUCHPOINT

### 1. DASHBOARD / PRECIOS DE NAFTA

**Objetivo:** Capturar 8,000-10,000 leads/mes (35% del tráfico)

#### 1.1 Alerta Básica de Precio
**Propuesta de valor:** "Avisame cuando cambie el precio en mi zona"

- **Copy del CTA:** "Recibí alertas de cambios de precio en {ZONA}"
- **Ubicación:** Card de precios en el dashboard (debajo de cada precio regional)
- **Tipo de componente:** MiniLeadForm (2 campos: email + zona automática)
- **Frecuencia:** Cada vez que hay cambio significativo (>$0.30/litro en cualquier dirección)
- **Canal:** Email (primario) + WhatsApp (opcional)
- **Segmentación capturada:** zona, tipo de vehículo (si es posible detectar)
- **Timing de notificación:** En tiempo real (máximo 5 minutos después del cambio)
- **Puente a seguros:** Dentro del email de alerta, footer con CTA: "¿Caro tu seguro? Cotiza el nuestro"

**Variante - Alerta Inteligente:**
- **Copy:** "Avisame si los precios suben más del 5% en una semana"
- **Propuesta:** Anticiparse a cambios importantes antes de llenar el tanque
- **Ubicación:** Tooltip sobre histórico de precios
- **Frecuencia:** Una notificación cuando se cumple el umbral

#### 1.2 Predicción de Precio (Lead Magnet)
**Propuesta de valor:** "Descargá nuestro análisis: Cómo ahorrar $500/mes en nafta"

- **Copy del CTA:** "Descargá la guía de ahorros (gratis + entrada al sorteo de $1,000)"
- **Ubicación:** Banner horizontal en dashboard, arriba del fold
- **Tipo de componente:** LeadCaptureForm (email + celular para Telegram)
- **Conversión esperada:** 10-15% de visitantes
- **Contenido del magnet:** PDF con 8-10 tips sobre consumo eficiente, comparativas históricas
- **Puente a seguros:** En el PDF: estadísticas sobre accidentes en rutas y CTA para cotizar
- **Timing:** Mostrar después de 45 segundos en página

#### 1.3 Comparador Histórico (Gamificación)
**Propuesta de valor:** "Gana premios comparando precios en tu zona"

- **Copy:** "Participa: ¿Recordás el precio más bajo de nafta en el último mes? Adivina y gana"
- **Ubicación:** Modal interactivo (puede activarse desde FloatingLeadBanner después de 35 seg)
- **Mecánica:**
  - Usuario ingresa su predicción
  - Se revela la respuesta correcta
  - Si acierta: entra al sorteo mensual de $5,000
  - Si no: opción de suscribirse para futuras notificaciones
- **Lead capture:** Email obligatorio para participar
- **Frecuencia:** Semanal (lunes)
- **Puente a seguros:** "Viaja seguro ganando premios: contrata tu seguro y duplica los puntos del sorteo"

---

### 2. COTIZADOR DE SEGUROS

**Objetivo:** Capturar 5,000-6,000 leads/mes (conversion tool)

#### 2.1 Lead Gate Mejorado (Ya Existe + Optimización)
**Propuesta de valor:** "Obtené 5 cotizaciones comparadas sin salir de Tankear"

- **Copy actual:** Mantener: "Compará seguros sin dejar Tankear"
- **Mejora propuesta:** Agregar subtítulo: "Recibirás cotizaciones directas de 5 aseguradoras"
- **Ubicación:** Justo antes del redirect a multicotizador
- **Campos capturados:** email, celular, tipo de vehículo, zona, año modelo
- **Frecuencia de pedido:** Una sola vez (session storage para evitar re-pedir en misma sesión)
- **Puente a seguros:** El gate ES el puente - lead va directo a cotizaciones

**Variante - Urgencia:**
- **Copy alternativo:** "3 de cada 4 usuarios logran ahorrar 40% en seguros"
- **Elemento visual:** Badge con número de cotizaciones en los últimos 7 días
- **A/B testing:** Testar diferentes textos (urgencia vs. confianza)

#### 2.2 Notificación Post-Cotización
**Propuesta de valor:** "Avisame si baja el precio de mi seguro"

- **Copy del CTA:** "Seguí monitoreando tu cotización - Avisame si cambia el precio"
- **Ubicación:** Después de que el usuario ve resultados de cotización
- **Tipo de componente:** MiniLeadForm (email + WhatsApp checkbox)
- **Frecuencia:** Máximo 1 notificación/mes (evitar spam)
- **Canal:** Email (cotizaciones comparadas), WhatsApp (si baja precio significativo: >10%)
- **Timing de notificación:** Cada martes (cuando típicamente hay promociones)
- **Puente a seguros:** El seguimiento IS la venta - usuario recibe email con mejor precio

**Segmentación inteligente:**
- Si usuario vio seguro "Full": alertar si precio baja en Full
- Si vio "Terceros": alertar si baja en Terceros + oportunidad de upgrade a Full
- Por tipo de vehículo (motos, autos, camionetas reciben diferentes promo cycles)

#### 2.3 Abandono de Cotización
**Propuesta de valor:** "¿No encontraste lo que buscabas? Te ayudamos"

- **Copy del CTA:** "Completá tu perfil y recibí asesoramiento personalizado"
- **Trigger:** Usuario ingresa datos pero no completa cotización (abandono después de 2 min)
- **Tipo de componente:** LeadCaptureForm (email, celular, razón del abandono)
- **Ubicación:** Modal lightbox o banner sticky en footer
- **Frecuencia:** Una sola vez por sesión
- **Canal:** Email con propuesta: "Hablemos de tu cobertura ideal"
- **Puente a seguros:** Follow-up email con asesor que contacta en 24hs

#### 2.4 Comparativa de Beneficios (Content Gate)
**Propuesta de valor:** "Descargá la matriz: 20 coberturas comparadas (Full vs Terceros)"

- **Copy:** "Guía PDF: ¿Qué cobertura necesitás? Analizá caso por caso"
- **Ubicación:** Arriba de los resultados de cotización, antes de scroll
- **Tipo:** LeadCaptureForm (email + WhatsApp)
- **Conversión esperada:** 15-20% de quienes ven cotizaciones
- **Lead magnet:** PDF con matriz de 20 coberturas, ejemplos de sinestros, casos reales
- **Puente a seguros:** Al final del PDF: CTA "Cotizar con coberturas personalizadas"

---

### 3. PÁGINA DEL DÓLAR

**Objetivo:** Capturar 2,000-3,000 leads/mes (nicho pero altamente segmentado)

#### 3.1 Alerta Dólar Blue Personalizada
**Propuesta de valor:** "Avisame cuando el dólar blue supere ${UMBRAL_PERSONALIZADO}"

- **Copy del CTA:** "Quiero saber si el dólar sube"
- **Ubicación:** Card de dólar blue en dashboard + página dedicada del dólar
- **Tipo de componente:** MiniLeadForm (email + WhatsApp + campo de umbral numérico)
- **Frecuencia:** Una sola notificación cuando se cruza el umbral (luego resets)
- **Canal:** WhatsApp (urgente) + Email
- **Segmentación:** Capturar intención: "¿Por qué monitoreás el dólar? Viaje / Importaciones / Financiero"
- **Puente a seguros:** En notificación WhatsApp: "El dólar sube = gasolina sube. Tu seguro cubre el valor de mercado del auto"

#### 3.2 Alerta de Volatilidad
**Propuesta de valor:** "Avisame si cambia más del X% en un día"

- **Copy:** "Quiero saber cuando hay volatilidad extrema (>5% diario)"
- **Ubicación:** Junto a gráfico de histórico de dólar
- **Tipo:** MiniLeadForm (email)
- **Frecuencia:** Una notificación por evento de volatilidad
- **Análisis técnico:** Usar datos de BlueyDolar API para disparar alertas automáticas
- **Puente a seguros:** Email con contexto: "Volatilidad = oportunidad de revisar tu cobertura de responsabilidad"

#### 3.3 Newsletter Semanal de Finanzas del Conductor
**Propuesta de valor:** "Resumen semanal: dólar, nafta, inflación y cómo te afecta"

- **Copy del CTA:** "Recibí el resumen financiero de los conductores"
- **Ubicación:** Footer de la página del dólar, banner lateral
- **Tipo:** MiniLeadForm (email)
- **Contenido:**
  - Promedio semanal de dólar, nafta, inflación
  - Impacto en costos de mantenimiento
  - Análisis de seguros (Ej: "Cómo la inflación afecta tu prima")
  - Recomendaciones de ahorro
- **Frecuencia de envío:** Todos los lunes 7 AM
- **Conversión esperada:** 8-12%
- **Puente a seguros:** En newsletter: sección "Protege tu inversión" con CTA a cotizador

---

### 4. MI GARAGE (La Joya de la Corona)

**Objetivo:** Capturar 12,000-15,000 leads/mes (máxima relevancia, máxima conversión)

Este módulo tiene el potencial más alto de conversión a seguros porque ofrece **recordatorios de alto valor emocional** (VTV, seguro vencido).

#### 4.1 Recordatorio de VTV (Muy Alto Valor)
**Propuesta de valor:** "Recordame cuándo vence mi VTV"

- **Copy del CTA:** "Cargá tu auto y recibí un aviso antes de que venza"
- **Ubicación:** Centro del dashboard de Mi Garage, card dedicada
- **Tipo de componente:** LeadCaptureForm (email + WhatsApp, checkbox obligatorio para WhatsApp)
- **Campos capturados:** email, celular, patente, zona (auto-filled si es posible), fecha VTV
- **Frecuencia de notificación:**
  - Primera alerta: 30 días antes de vencer
  - Segunda alerta: 10 días antes
  - Tercera alerta: 1 día antes (WhatsApp)
- **Canal:** Email (informativo) + WhatsApp (urgencia última semana)
- **Timing:** 9 AM para la alerta a 30 días, 6 PM para la de 1 día
- **Puente a seguros:**
  - En notificación de VTV vencida: "¿Vencida tu VTV? También expiró tu seguro. Cotiزá aquí"
  - Si VTV vence, hay posibilidad de que seguro también venza → cross-sell natural

**Mecanismo de re-conversión:**
- Usuario hace click en notificación VTV
- El sistema lo lleva a página de "Servicios relacionados a VTV"
- Muestra revisores cercanos + CTA a cotizador de seguros

#### 4.2 Recordatorio de Vencimiento de Seguro (CRÍTICO)
**Propuesta de valor:** "Recordame cuándo vence mi seguro" → VENTA DIRECTA

- **Copy del CTA:** "Ingresá tu número de póliza y recibí recordatorios antes de que venza"
- **Ubicación:** Card prominente en Mi Garage (primera posición después de datos del auto)
- **Tipo de componente:** LeadCaptureForm (email + WhatsApp + número de póliza)
- **Campos capturados:** email, celular, número de póliza, aseguradora actual, tipo de cobertura
- **Frecuencia de notificación:**
  - 60 días antes: Email soft - "Comienza tu búsqueda"
  - 30 días antes: Email + WhatsApp - "Hora de cotizar"
  - 14 días antes: Email + WhatsApp - "Evita quedarte sin cobertura"
  - 7 días antes: WhatsApp - Link directo a cotizador
- **Canal:** Email (emails de valor) + WhatsApp (alerts urgentes)
- **Puente a seguros:** DIRECTO A COTIZADOR - Este es un lead "caliente"
- **Segmentación por tipo de cobertura:**
  - Si tiene "Terceros": mostrar beneficios de "Full" en emails
  - Si tiene "Full": alertar sobre deducibles, ofertas de upgrade

**Tasa de conversión esperada:** 70-80% (El usuario NECESITA renovar)

#### 4.3 Recordatorio de Cambio de Aceite
**Propuesta de valor:** "Recordame cambiar el aceite cada X km"

- **Copy del CTA:** "Configura el mantenimiento de tu auto"
- **Ubicación:** Subsección "Mantenimiento" dentro de Mi Garage
- **Tipo de componente:** LeadCaptureForm (email + WhatsApp)
- **Campos capturados:** email, celular, marca/modelo, km actuales, km recomendado para cambio
- **Frecuencia:** Una notificación cuando quedan 500 km antes del cambio recomendado
- **Canal:** Email (recordatorio simple)
- **Puente a seguros:**
  - En notificación: "¿Mantienes tu auto en regla? Los seguros valoran el buen mantenimiento - obtén mejores precios"
  - Footer: Link a cotizador con descuento "Autos bien mantenidos"

#### 4.4 Recordatorio de Patente/Impuesto Automotor
**Propuesta de valor:** "Recordame pagar la patente"

- **Copy del CTA:** "Cargá tu vencimiento de patente y no te pierdas el deadline"
- **Ubicación:** Card dedicada en Mi Garage (junto a VTV)
- **Tipo de componente:** MiniLeadForm (email + WhatsApp)
- **Frecuencia de notificación:**
  - 45 días antes: Email recordatorio
  - 15 días antes: Email + WhatsApp urgencia
  - 2 días antes: WhatsApp crítico
- **Canal:** Email + WhatsApp
- **Puente a seguros:** "Tu patente en día + seguro vigente = máxima protección legal"

#### 4.5 Historial de Gastos y Análisis
**Propuesta de valor:** "Descargá el reporte de gastos anuales de tu auto"

- **Copy del CTA:** "Ver cuánto gasté en mantenimiento (email + descargable)"
- **Ubicación:** Sección "Análisis de gastos" en Mi Garage
- **Tipo de componente:** LeadCaptureForm (email + WhatsApp)
- **Lead magnet:** PDF con:
  - Gasto total en mantenimiento
  - Desglose por categoría (combustible, seguros, servicios)
  - Comparativa con promedio nacional
  - Recomendaciones de ahorro
- **Conversión esperada:** 12-18%
- **Puente a seguros:**
  - En PDF: "Te gastas $X al año en auto - invierte en protegerlo: seguro a partir de $YYY"
  - Simulador: "¿Cuánto te ahorraría cambiar de seguro?"

#### 4.6 Desafío de Mantenimiento (Gamificación)
**Propuesta de valor:** "Completa el checklist de mantenimiento y gana puntos"

- **Copy:** "Sigue el plan de mantenimiento recomendado - gana puntos y descuentos"
- **Ubicación:** Dashboard de Mi Garage, motivador visual
- **Mecánica:**
  - Usuario marca tareas completadas (VTV, seguro, cambio de aceite, revisión general)
  - Acumula puntos (10 puntos por tarea)
  - 50 puntos = Descuento en cotizador
  - 100 puntos = Entrada a sorteo mensual
- **Lead capture:** Email para recibir notificaciones de tareas pendientes
- **Frecuencia:** Notificaciones semanales de tareas no completadas
- **Puente a seguros:** Tareas incluyen "Cotizar seguro" → lead directo

---

### 5. ROAD TRIP PLANNER

**Objetivo:** Capturar 3,000-4,000 leads/mes (alta relevancia en momento de viaje)

#### 5.1 Resumen de Viaje por Email
**Propuesta de valor:** "Mandame el resumen de mi viaje por email con consejos de seguridad"

- **Copy del CTA:** "Recibí el resumen del viaje + tips de seguridad"
- **Ubicación:** Página de resultado del road trip, antes de descargar
- **Tipo de componente:** MiniLeadForm (email + WhatsApp para viajeros frecuentes)
- **Contenido del email:**
  - Mapa del viaje con distancia total
  - Tiempo estimado de manejo
  - Estaciones de servicio en ruta
  - Zonas de mal clima (si aplica)
  - Puntos de peligro (autopistas con accidentes frecuentes)
  - Checklist pre-viaje
- **Conversión esperada:** 20-25%
- **Puente a seguros:** En el email: "Viajas {DISTANCIA} km: Asegúrate que tu cobertura sea Full (riesgos ampliados). Cotiza aquí"

#### 5.2 Alertas de Clima en Ruta
**Propuesta de valor:** "Avisame si hay mal tiempo en mi ruta antes de salir"

- **Copy del CTA:** "Recibí alertas de clima en mi ruta de viaje"
- **Ubicación:** Section de Road Trip Planner, junto a mapa
- **Tipo de componente:** MiniLeadForm (email + WhatsApp checkbox)
- **Frecuencia:** Alertas solo si hay cambios significativos (tormenta, vientos, nieve) 4-6 horas antes
- **Canal:** WhatsApp (urgencia) + Email
- **Segmentación:** Por tipo de vehículo (motos reciben alertas más agresivas)
- **Puente a seguros:** "Viajas en moto = cobertura especial recomendada. ¿La revisamos?"

#### 5.3 Directorio de Servicios en Ruta
**Propuesta de valor:** "Guía descargable: Talleres, gasolineras y hoteles en ruta"

- **Copy:** "Descargá la guía de servicios en tu ruta + número de emergencias"
- **Ubicación:** Banner en Road Trip Planner, antes de finalizar viaje
- **Tipo:** LeadCaptureForm (email + celular)
- **Lead magnet:** PDF con:
  - Mapa de gasolineras en ruta
  - Talleres cercanos a la ruta
  - Hoteles/hospedajes
  - Números de emergencia (policía, ambulancia, grúas)
  - Cobertura recomendada para viaje
- **Conversión esperada:** 8-12%
- **Puente a seguros:** En PDF: "Protege tu viaje: cobertura de asistencia incluye grúa 24/7"

#### 5.4 Notificación de Compañero Conductor
**Propuesta de valor:** "Invitá a otro conductor al viaje - Ambos entran al sorteo mensual"

- **Copy:** "Comparte el viaje con amigos y gana premios"
- **Ubicación:** Botón de "Compartir viaje" en resultado del road trip
- **Mecánica:**
  - Usuario ingresa email de amigo
  - Se envía invitación con link a viaje
  - Ambos entran al sorteo de $2,000 en nafta
- **Lead capture:** Email de invitado se captura automáticamente
- **Frecuencia:** Una invitación por viaje planificado
- **Puente a seguros:** Después del sorteo: CTA a cotizador

---

### 6. NOTICIAS

**Objetivo:** Capturar 4,000-5,000 leads/mes (bajo compromiso, alta volumen)

#### 6.1 Newsletter Semanal del Conductor Argentino
**Propuesta de valor:** "Recibí las noticias de conducción que importan - Resumen semanal"

- **Copy del CTA:** "Suscribete al newsletter semanal de Tankear"
- **Ubicación:**
  - Sidebar de página de noticias (sticky)
  - Footer de cada noticia
  - Banner flotante en newsletter page (después de 40 segundos)
- **Tipo de componente:** MiniLeadForm (email)
- **Contenido del newsletter:**
  - 3-4 noticias de seguridad vial
  - 1-2 cambios de regulación
  - Tips de mantenimiento
  - Alerta de precio de nafta
  - Oferta de seguros especial
- **Frecuencia de envío:** Todos los miércoles 9 AM
- **Conversión esperada:** 15-20%
- **Puente a seguros:** Una noticia por newsletter menciona seguros (rotativo)

**Variante - Newsletter Diaria:**
- **Copy:** "Noticia urgente: cambios en la ruta/alerta de clima"
- **Ubicación:** Banner de urgencia si hay noticia crítica
- **Frecuencia:** Solo para noticias críticas (accidentes masivos, cortes de ruta, cambios legales)

#### 6.2 Categorías de Suscripción (Micro-segments)
**Propuesta de valor:** "Recibí solo las noticias que te interesan"

- **Copy:** "Personaliza tus intereses: Seguridad / Regulación / Combustibles / Viajes"
- **Ubicación:** En formulario de newsletter
- **Tipo:** Checkboxes en LeadCaptureForm
- **Segmentación creada:**
  - Seguridad vial → lead con alto interés en seguros
  - Regulación → lead profesional (taxi, uber, delivery)
  - Combustibles → lead frugal (potencial cliente precio sensible)
  - Viajes → lead aventurero (potencial cliente road trip)
- **Puente a seguros:** Cada segmento recibe CTAs diferentes
  - Seguridad: "Tu seguro cubre esto?"
  - Regulación: "Cobertura legal incluida"
  - Combustibles: "Complementa con seguro"
  - Viajes: "Asistencia en ruta 24/7"

#### 6.3 Noticia Interactiva (Poll/Quiz)
**Propuesta de valor:** "Participa en la encuesta semanal de conductores"

- **Copy:** "¿Cuál es tu mayor gasto de conducción? Vota y entra al sorteo"
- **Ubicación:** Widget interactivo en artículos principales
- **Tipo:** Mini-encuesta (3-4 opciones)
- **Lead capture:** Email obligatorio para votar
- **Resultado:** Muestra estadísticas + CTA relevante
  - Si elige "Seguro": muestra cotizador
  - Si elige "Nafta": muestra alertas de precio
  - Si elige "VTV/Mantenimiento": muestra Mi Garage
- **Frecuencia:** Semanal
- **Conversión esperada:** 18-22%

#### 6.4 Lead Magnet: Ebook "Guía de Derechos del Conductor"
**Propuesta de valor:** "Descargá gratis: Todos tus derechos como conductor argentino"

- **Copy:** "Ebook: Qué hacer ante un accidente, multas, denuncias"
- **Ubicación:** Banner en categoría "Regulación" de noticias
- **Tipo:** LeadCaptureForm (email + celular)
- **Contenido:**
  - Derechos tras accidente
  - Cómo reclamar a la aseguradora
  - Multas y cómo apelar
  - Documentación obligatoria
- **Conversión esperada:** 10-14%
- **Puente a seguros:** En ebook: "¿Tu seguro cubre esto? Comparadores y cotizador incluido"

---

### 7. VUELOS

**Objetivo:** Capturar 1,500-2,000 leads/mes (nicho específico: viajeros aéreos)

#### 7.1 Alerta de Estado de Vuelo
**Propuesta de valor:** "Avisame si cambia el estado de mi vuelo"

- **Copy del CTA:** "Quiero saber si mi vuelo se retrasa o cancela"
- **Ubicación:** Página de búsqueda de vuelos, en campo de entrada
- **Tipo de componente:** MiniLeadForm (email + WhatsApp checkbox)
- **Frecuencia:** Notificaciones solo si hay cambios (retrasos, cancelaciones)
- **Canal:** WhatsApp (inmediato) + Email
- **Segmentación:** Capturar: "¿Dónde sale tu vuelo?" → Identificar conductores locales que viajan
- **Puente a seguros:** En alerta: "Vuelo retrasado = conducción de noche más peligrosa. ¿Cómo está tu seguro?"

**Mecanismo de valor agregado:**
- Si hay retraso: envía alertas de gasolineras cercanas al aeropuerto
- Si hay cancelación: avisa sobre alternativas de ruta (auto en lugar de avión)
- En ambos casos: CTA a cotizador

#### 7.2 Recordatorio de Estacionamiento
**Propuesta de valor:** "Recordame dónde dejé el auto en el aeropuerto"

- **Copy:** "Guardá la ubicación de tu auto en el parking y recibí recordatorios"
- **Ubicación:** Página de vuelos, sección "Servicios en el aeropuerto"
- **Tipo:** MiniLeadForm (email)
- **Campos:** email, ubicación del parking (foto/descripción), fecha de regreso
- **Frecuencia:** Recordatorio 1 hora antes de llegada estimada
- **Canal:** Email
- **Puente a seguros:** "¿Dejaste tu auto en parking por días? ¿Tiene cobertura de robo/daño? Cotiza aquí"

#### 7.3 Pack de Viajero (Lead Magnet)
**Propuesta de valor:** "Guía descargable: Todo lo que necesitas antes de viajar"

- **Copy:** "Descargá: Documentación, seguros, checklist de auto"
- **Ubicación:** Banner en homepage de vuelos
- **Tipo:** LeadCaptureForm (email + celular)
- **Contenido:**
  - Documentación obligatoria para conducir
  - Checklist de auto antes de viajar
  - Tipos de seguros recomendados
  - Contactos de emergencia
  - Números de seguros en ruta
- **Conversión esperada:** 12-16%
- **Puente a seguros:** En PDF: matriz de seguros recomendados por destino

---

## ESTRATEGIAS TRANSVERSALES

### A. FLOTANTE BANNER (FloatingLeadBanner - Aparece a los 35 segundos)

**Objetivo:** Capturar 6,000-8,000 leads/mes (12-15% de todo el tráfico)

#### Banner Universal (Aparece en todas las páginas)
**Propuesta de valor:** Rotativa según página

```
Dashboard (Nafta) → "No te pierdas ningún cambio de precio"
Seguros → "Cotizá ahora sin salir de Tankear"
Mi Garage → "Recordá tu VTV y seguro"
Noticias → "Suscribete al newsletter semanal"
Road Trip → "Viajá seguro con nuestras alertas"
Vuelos → "Alertas de estado de vuelo"
Dólar → "No pierdas las variaciones del dólar"
```

**Especificaciones técnicas:**
- **Timing:** Aparece después de 35 segundos en página
- **Ubicación:** Bottom-right corner (no invasivo)
- **Tamaño:** 320x200px (mobile) / 380x180px (desktop)
- **Cierre:** X visible después de 3 segundos (permite UX fluido)
- **Frecuencia:** Una sola vez por sesión (no vuelve a mostrar si se cierra)
- **Copy del CTA:** Varía por página (ver arriba)
- **Form:** MiniLeadForm de 2-3 campos
- **Conversión esperada:** 8-12% de quienes ven el banner

**Variante - Exit Intent:**
- Aparece cuando usuario mueve mouse fuera del viewport (a punto de irse)
- Propuesta más agresiva: "¿Te vas? Recibí alertas de precio antes de volver"
- Conversión esperada: 15-18%

---

### B. SORTEOS Y GAMIFICACIÓN

**Objetivo:** Aumentar captación en 25-30% mediante incentivo emocional fuerte

#### B.1 Sorteo Mensual Principal
**Propuesta de valor:** "Gana $5,000 en nafta - Participa suscribiéndote"

- **Premio:** $5,000 en bonos de gasolinera (canje en 300+ puntos del país)
- **Mecánica:**
  - Cada email capturado = 1 entrada
  - Cada WhatsApp capturado = 2 entradas (incentiva canal de mayor valor)
  - Cada lead magnet descargado = 3 entradas
  - Referidos = 5 entradas (ver sección B.3)
- **Promoción:**
  - Anuncio en footer de todos los emails
  - Banner en homepage
  - Social media (si aplica)
  - Notificación a subscribers anteriores
- **Frecuencia:** Sorteo el último viernes de cada mes (transparencia: transmisión en vivo)
- **Elegibilidad:**
  - Mínimo 1 email válido
  - Mayor de 18 años
  - Conductor registrado (para validación)
- **Lead capture:** 8,000-10,000 leads por sorteo
- **ROI:** Costo $5,000 = 10,000 leads = $0.50 costo de adquisición

**Comunicación:**
- Email de bienvenida: "¡Estás dentro del sorteo! Ya tienes 1 entrada"
- Recordatorio a mitad de mes: "Falta 1 semana - Invita amigos y multiplica tus posibilidades"
- Recordatorio 2 días antes: "Última chance - Referidos dobles hoy"
- Ganador: "¡GANASTE! Instrucciones de canje dentro de 24hs"

#### B.2 Sorteo Semanal (Más Pequeño, Mayor Frecuencia)
**Propuesta de valor:** "Gana $500 en nafta cada semana"

- **Premio:** $500 en bonos (premio más alcanzable = genera buzz constante)
- **Mecánica:**
  - Random entre todos los suscriptores de la semana anterior
  - 1 entrada = 1 email
  - 2 entradas = email + WhatsApp
- **Promoción:** Anuncio en newsletter del miércoles, drawing el viernes
- **Lead capture:** 3,000-4,000 leads por semana
- **Beneficio:** Mantiene tráfico constante durante la semana

#### B.3 Programa de Referidos (Muy Alto Valor)
**Propuesta de valor:** "Invitá a amigos conductores - Ambos entran a sorteos dobles"

- **Mecánica:**
  - Usuario registrado genera link único de referido
  - Comparte con amigos (WhatsApp, email, SMS)
  - Cuando amigo se suscribe: ambos reciben bonus
- **Bonus:**
  - Por referido: +2 entradas al sorteo mensual
  - Por 5 referidos en mes: Entrada "Platino" con x5 posibilidades
  - Por 10 referidos: Acceso a "Sorteo VIP" de $1,000
- **Lead capture:**
  - Leads directos de amigos (email validado)
  - Leads del usuario original (se motiva a capturar más si refiere)
- **Implementación técnica:**
  - Generar link único por usuario: `tankear.com.ar?ref=USER_ID_HASH`
  - Tracking en backend (POST /leads incluir `referrer_id`)
  - Dashboard de usuario muestra: "8 amigos invitados - 16 entradas bonus"
- **Conversión esperada:** 20-30% de usuarios generan al menos 1 referido

**Email de invitación (template sugerido):**
```
Asunto: Te paso un dato: Gana $5,000 en nafta invitando amigos

Hola {USER_NAME}!

Te encontraste una forma de ganar premios GRATIS:
- Invitá a tus amigos conductores
- Cada invitación = 2 entradas extras al sorteo de $5,000
- Ellos también participan

Tu link único: {REFERRAL_LINK}

Comparte en WhatsApp, email o lo que prefieras.

¿Ya invitaste 5 amigos? Acceso al Sorteo VIP de $1,000!

🔗 {REFERRAL_LINK}
```

---

### C. LEAD MAGNETS (CONTENT GATES)

**Objetivo:** Capturar 3,000-4,000 leads/mes de alta intención

#### Lead Magnet #1: "Guía para Ahorrar $500/mes en tu Seguro"
- **Ubicación:** Cotizador de seguros + newsletter
- **Formato:** PDF 8-10 páginas
- **Contenido:**
  - 10 formas de reducir prima
  - Coberturas innecesarias a eliminar
  - Mejores épocas para cotizar
  - Checklist de negociación
  - Comparativa de aseguradoras
  - Casos reales de ahorro
- **Lead capture:** Email + celular
- **Conversión esperada:** 12-15%
- **CTA post-descarga:** "Cotiza y confirma tu ahorro"

#### Lead Magnet #2: "Checklist Completo de Mantenimiento de Auto"
- **Ubicación:** Mi Garage + Noticias
- **Formato:** PDF imprimible (A4)
- **Contenido:**
  - Mantenimiento mensual
  - Mantenimiento cada 6 meses
  - Mantenimiento anual
  - Checklist de seguridad
  - Costos estimados
- **Lead capture:** Email
- **Conversión esperada:** 10-12%
- **CTA post-descarga:** "Registra tu auto para recordatorios automáticos"

#### Lead Magnet #3: "Reporte de Costos: ¿Cuánto te cuesta tu auto en 2026?"
- **Ubicación:** Mi Garage + Dashboard
- **Formato:** PDF + Dashboard interactivo
- **Contenido:**
  - Desglose de gastos por categoría
  - Comparativa nacional
  - Simulación de escenarios
  - Recomendaciones personalizadas
- **Lead capture:** Email + celular
- **Conversión esperada:** 10-14%
- **CTA post-descarga:** "Reduce costos: cotiza seguros más económicos"

#### Lead Magnet #4: "Guía: Cómo Actuar en un Accidente de Tránsito"
- **Ubicación:** Noticias + Blog
- **Formato:** PDF con checklist
- **Contenido:**
  - Pasos inmediatos
  - Documentación a recopilar
  - Fotografías importantes
  - Números de contacto
  - Qué NO hacer
  - Cómo reclamar a la aseguradora
- **Lead capture:** Email
- **Conversión esperada:** 14-18%
- **CTA post-descarga:** "¿Tu seguro cubre esto? Verifica aquí"

---

### D. SEGMENTACIÓN AVANZADA

**Data Captured por Cada Touchpoint:**

```json
{
  "email": "string (required)",
  "phone": "string (optional)",
  "zone": "string (from IP or user input)",
  "vehicle_type": "string (sedan, suv, moto, camioneta, etc)",
  "year": "int",
  "license_plate": "string (optional, from Mi Garage)",
  "preferred_channel": "email | whatsapp | telegram",
  "utm_source": "page_origin",
  "intent": "insurance | fuel_price | vtv | trip | news | flight",
  "frequency_preference": "daily | weekly | on_demand",
  "referrer_id": "string (for referral tracking)",
  "created_at": "timestamp",
  "lead_score": "int (0-100)"
}
```

**Segmentación Inteligente (Ejemplos):**

1. **Lead VTV/Seguro Vencido** → Urgencia MÁXIMA
   - Trigger: Usuario ingresa fecha VTV/seguro vencido
   - Action: Email en 1 hora, WhatsApp en 2 horas
   - Message: "Necesitas renovar AHORA"
   - Conversion esperada: 70-80%

2. **Lead Precio Sensible** → Medium Priority
   - Trigger: Usuario suscrito a alertas de precio/dólar
   - Action: Email diario, WhatsApp semanal
   - Message: "Oportunidad de ahorrar"
   - Conversion esperada: 35-40%

3. **Lead Aventurero (Road Trip)** → Low Priority, High Lifetime Value
   - Trigger: Usuario planificó viaje
   - Action: Email informativo, descuentos en seguros de viaje
   - Message: "Viaja seguro"
   - Conversion esperada: 40-45%

4. **Lead Profesional (Regulación)** → Very High Priority
   - Trigger: Usuario interesado en noticias de regulación
   - Segments: Taxi, Uber, Delivery (vehicle-dependent)
   - Message: "Cobertura especial profesional"
   - Conversion esperada: 50-60%

---

## CANALES DE NOTIFICACIÓN

### Canal 1: EMAIL

**Ventajas:**
- Abierto (alcance 100% a inbox)
- Largo formato (educar + vender)
- Rastreable (clicks, conversiones)
- Costo = 0

**Desventajas:**
- Tasa de apertura 20-30%
- Requiere contenido de calidad
- Spam filtering

**Estrategia de Frecuencia:**
```
Newsletter general:           1x por semana (lunes 9 AM)
Alertas de precio:            En tiempo real (max 3/semana)
Recordatorios VTV/Seguro:     1-2 semanas antes (spacing)
Lead magnet + followup:       2 emails después de descarga
Cross-sell:                   1x cada 2 semanas
Celebraciones (sorteo):       1x por mes (viernes)
```

**Template Básico (para todos los emails):**
```
[Header de marca Tankear - Logo + color azul]

Asunto: {EMOJI} {BENEFICIO ESPECÍFICO}

---

Hola {USER_FIRST_NAME}!

[Body: 100-150 palabras]
- Noticia/alerta
- Por qué le interesa
- Acción recomendada

---

[CTA PRIMARIO - Botón grande]
→ {ACTION} ←

[CTA SECUNDARIO - Link]
Si prefieres, puedes {ALTERNATIVE_ACTION} aquí.

---

[Footer]
¿Cambiar preferencias? Gestiona alertas aquí.
¿Dejar de recibir? Unsubscribe (obligatorio).

Tankear.com.ar | Contáctanos | Política de privacidad
```

---

### Canal 2: WHATSAPP

**Ventajas:**
- Tasa de apertura 98%+
- Urgencia/intimidad
- Facilita conversación
- SMS fallback si no tiene WhatsApp

**Desventajas:**
- Requiere opt-in explícito
- Mensaje corto (constraints)
- Costo (por mensaje enviado)
- Riesgo de spam si no es selectivo

**Estrategia de Frecuencia:**
```
Alertas críticas (VTV/Seguro próximo a vencer): MAX 3/mes
Cambios de precio (urgentes):                    1-2/semana
Notificaciones de estado (vuelo, clima):        On-demand
Sorteos/Promos:                                  1x por mes
Cross-sell suave:                                1x cada 2 semanas
```

**Template Básico (WhatsApp):**
```
{EMOJI} {BENEFICIO EN CAPS}

Hola {NAME}!

{NOTICIA CORTA - 1 línea}

{CALL TO ACTION - Link o instrucción}

Responde o presiona aquí → {LINK}

Tankear 🚗
```

**Ejemplos Reales:**

1. **VTV Próxima a Vencer:**
```
⚠️ TU VTV VENCE EN 7 DÍAS

Hola Juan, tu VTV vence el 15 de mayo.
Sabes que sin VTV no puedes circular.

Hacé click aquí para buscar revisores:
→ tankear.com.ar/garage/juan/vtv

Tankear 🚗
```

2. **Precio de Nafta Bajó:**
```
⛽ ¡PRECIO BAJÓ!

Hola Juan, la nafta en La Plata bajó a $1.850/L
(Bajó $0.45 desde ayer)

→ Ver detalles

Tankear 🚗
```

3. **Cotización de Seguros:**
```
🔥 OFERTA ESPECIAL PARA TI

Encontramos un seguro a $850/mes para tu auto.
Eso es $150 menos que lo que pagas ahora.

→ Ver cotización

Tankear 🚗
```

---

### Canal 3: TELEGRAM (En desarrollo)

**Ventajas:**
- Comunidad activa
- Bajo costo
- Formato flexible (canales, bots)
- Potencial de viralidad

**Desventajas:**
- Audiencia más pequeña (early adopters)
- Menos conversión que WhatsApp/Email
- Requiere strategy de contenido

**Estrategia:**
- Canal: @TankearAlerts
- Contenido: Alertas de precio, noticias, tips
- Frecuencia: 2-3 posts/día
- CTA: Link a Tankear.com.ar o WhatsApp
- Meta: 5,000 subscribers en 6 meses

---

## SEGMENTACIÓN Y PERSONALIZACIÓN

### Matriz de Personalización

| Segment | Channel Primario | Copy Tone | Frecuencia | CTA Primario | Conversion Esperada |
|---|---|---|---|---|---|
| **VTV/Seguro Vencido** | WhatsApp | Urgente | 3x en semana | Cotizar ahora | 75% |
| **Precio Sensible** | Email | Racional/Data | 1x/semana | Comparar precios | 35% |
| **Aventurero (Road Trip)** | Email | Inspirador | 1-2x/mes | Planificar viaje | 40% |
| **Profesional (Taxi/Uber)** | WhatsApp | Práctico | 2x/semana | Cobertura profesional | 55% |
| **Financiero (Dólar)** | Email | Análisis | 1x/semana | Seguimiento | 25% |
| **Early Adopter (Telegram)** | Telegram | Casual | 3x/día | Community building | 20% |

### Dynamic Content (Ejemplos)

**Personalisación por Zona:**
```
Subject: Nafta en {ZONE} subió a ${PRICE}
Body: En tu zona ({ZONE}), la nafta está a ${PRICE}/L
     El promedio nacional es ${NATIONAL_AVG}
     Ahorrar con nosotros: ${SAVINGS_POTENTIAL}/mes
```

**Personalización por Tipo de Vehículo:**
```
Para Motos:
"Tu moto necesita cobertura especial en lluvia"
"Seguro para motos desde $300/mes"

Para Autos (sedan):
"Seguro Full para sedanes desde $550/mes"

Para SUV:
"Protección para SUVs en rutas: cobertura ampliada"
```

**Personalización por Último Comportamiento:**
```
Si visitó cotizador:
"Vimos que cotizaste hace 3 días - ¿Necesitas ajustes?"

Si descargó lead magnet:
"Leíste nuestra guía - Ahora cotiza y verifica tu ahorro"

Si refirió amigos:
"¡Gracias por 3 referidos! Acceso a Sorteo VIP 🎁"
```

---

## CALENDARIO DE IMPLEMENTACIÓN

### Fase 1: MVP (Semanas 1-4)

**Semana 1: Setup + Dashboard/Nafta**
- [ ] Conectar backend POST /leads con formularios existentes
- [ ] Implementar FloatingLeadBanner (35 seg) en homepage
- [ ] Lanzar alerta de precio basic en Dashboard
- [ ] Crear plantilla de email base
- [ ] Setup de MiniLeadForm para Dashboard

**Semana 2: Mi Garage (Crítico)**
- [ ] Implementar VTV reminder (30-10-1 dias)
- [ ] Implementar Seguro reminder (60-30-14-7 días)
- [ ] Crear LeadCaptureForm para VTV/Seguro
- [ ] Email workflow básico (automation)
- [ ] Tests de frecuencia (no spam)

**Semana 3: Cotizador + Lead Magnet**
- [ ] Mejorar lead gate pre-redirect
- [ ] Crear PDF "Guía para ahorrar $500/mes"
- [ ] Implementar alert de precio post-cotización
- [ ] Setup tracking de conversión

**Semana 4: Testing + Optimization**
- [ ] A/B test copy de CTA
- [ ] A/B test timing de FloatingBanner
- [ ] Test de frecuencia de notificaciones
- [ ] Métricas baseline

**Expected Output Fase 1:** 5,000-8,000 leads

---

### Fase 2: Expansion (Semanas 5-8)

**Semana 5: Sorteos**
- [ ] Lanzar sorteo mensual ($5,000 en nafta)
- [ ] Crear landing page de sorteo
- [ ] Email campaign de promoción
- [ ] Setup de tracking de participantes

**Semana 6: Gamificación + Referidos**
- [ ] Programa de referidos (link único)
- [ ] Dashboard de usuario con contador
- [ ] Email templates de invitación
- [ ] Bonus tracking en backend

**Semana 7: Canales Adicionales**
- [ ] Dólar alerts (blue + volatilidad)
- [ ] Road Trip Planner integration
- [ ] Página de Noticias newsletter
- [ ] Newsletter semanal automation

**Semana 8: Telegram + Testing**
- [ ] Telegram channel setup (@TankearAlerts)
- [ ] Bot de alertas automáticas
- [ ] Testing de cross-posting
- [ ] Optimización de engagement

**Expected Output Fase 2:** 15,000-20,000 leads acumulados

---

### Fase 3: Refinement (Semanas 9-12)

**Semana 9: WhatsApp Channel**
- [ ] Integración WhatsApp Business API
- [ ] Opt-in flows mejorados
- [ ] SMS fallback para no-WhatsApp
- [ ] Testing de frequency

**Semana 10: Lead Scoring**
- [ ] Implementar lead scoring (0-100)
- [ ] Segmentación automática
- [ ] Dynamic email content
- [ ] CRM integration (si aplica)

**Semana 11: Landing Pages**
- [ ] Landing page por segment
- [ ] Vuelos alerts landing
- [ ] Mi Garage educational page
- [ ] Dólar alerts landing

**Semana 12: Optimization + Scale**
- [ ] Análisis de todos KPIs
- [ ] Reoptimización de copy
- [ ] Scaling de canales ganadores
- [ ] Plan Q2

**Expected Output Fase 3:** 35,000-45,000 leads acumulados

---

## KPIs Y MÉTRICAS

### Top-Level Metrics (Objetivos Globales)

| Métrica | Target | Justificación |
|---|---|---|
| **Leads capturados/mes** | 10,000+ | Base de datos |
| **Email conversion rate** | 60%+ | Tasa de cotización |
| **WhatsApp opt-in rate** | 30%+ | Canal de urgencia |
| **Cost per lead** | <$0.50 | ROI de sorteos |
| **Lead-to-insurance conversion** | 10-15% | Venta real |

### Page-Level Metrics

**Dashboard/Nafta:**
- Suscriptores a alertas de precio: 8,000/mes
- Email open rate: 25-30%
- Click-through rate: 8-12%
- Conversion a cotizador: 5-8%

**Mi Garage (VTV/Seguro):**
- VTV reminders enviados: 5,000/mes
- Seguro reminders enviados: 6,000/mes
- Email open rate: 35-40% (alta relevancia)
- Conversion a cotizador: 15-20%
- WhatsApp open rate: 95%+

**Cotizador:**
- Leads pre-gate: 6,000/mes
- Conversion post-gate: 100% (forced)
- Email capture rate: 95%+
- Phone capture rate: 70%+
- Post-quote alerts: 3,000/mes

**Sorteos:**
- Leads generados: 8,000/mes
- Referidos generados: 2,000/mes
- Monthly active participants: 40,000+
- Re-engagement rate: 60%+

### Segmentation Metrics

**VTV/Seguro Vencido:**
- Lead volume: 5,000/mes
- Email open rate: 35-40%
- Conversion to quote: 70-80%
- Actual insurance sale: 50-60%
- LTV (lifetime value): $200-300

**Price Sensitive:**
- Lead volume: 3,000/mes
- Email frequency: 3-4/semana
- Click rate: 12-15%
- Conversion rate: 35-40%
- LTV: $100-150

**Road Trip/Travel:**
- Lead volume: 3,500/mes
- Engagement rate: 40%+
- Email read rate: 30%+
- Conversion to trip insurance: 25-30%
- LTV: $150-200

---

### Conversion Funnel (Ejemplo)

```
100 visitantes a Dashboard
  ↓
20 ven FloatingBanner (35 seg)
  ↓
3 hacen click en banner
  ↓
2 completan form (email)
  ↓
1 hace click en email posteriormente
  ↓
0.5 cotiza seguros
  ↓
0.05 compra seguro

CONVERSION RATE: 0.05% (visitante → venta)
LEAD RATE: 2% (visitante → email)
VENTA RATE: 10% (email → cotización → venta)
```

---

### Dashboard de Tracking (Recomendado)

```
[MAIN METRICS]
- Total leads (MTD): 12,450
- Leads by channel: Email 70% | WhatsApp 25% | Telegram 5%
- Cost per lead: $0.35
- Conversion to quote: 12.3%

[BY PAGE]
- Dashboard: 5,230 leads | 42% of total
- Mi Garage: 4,120 leads | 33% of total
- Seguros: 1,850 leads | 15% of total
- Otros: 1,250 leads | 10% of total

[EMAIL PERFORMANCE]
- Open rate: 28.5%
- Click rate: 9.2%
- Conversion rate: 11.8%
- Unsubscribe rate: 0.8%

[WHATSAPP PERFORMANCE]
- Open rate: 97.3%
- Click rate: 22.1%
- Conversion rate: 18.5%

[REFERRAL TRACKING]
- New referrals: 250 (this week)
- Referral conversion rate: 60%
- Top referrer: Juan Rodriguez (25 refs)

[SORTEO PARTICIPATION]
- Active participants: 38,500
- New entries: 5,200 (this week)
- Referral entries: 1,850 (35.6% of new)
```

---

### Monthly Business Metrics

| Mes | Leads | Email Suscriptores | WhatsApp Suscriptores | Quote Conversions | Insurance Sales | Revenue |
|---|---|---|---|---|---|
| Mes 1 | 8,000 | 6,400 | 1,500 | 960 | 100 | $8,000 |
| Mes 2 | 12,000 | 11,400 | 3,200 | 1,560 | 165 | $13,200 |
| Mes 3 | 15,000 | 16,800 | 5,400 | 2,100 | 210 | $16,800 |
| Mes 4 | 18,000 | 24,500 | 7,200 | 2,520 | 280 | $22,400 |
| Mes 5 | 22,000 | 32,100 | 9,500 | 3,080 | 350 | $28,000 |
| Mes 6 | 25,000 | 42,000 | 12,000 | 3,500 | 420 | $33,600 |

**Supuestos:**
- Email opt-in: 80% de leads
- WhatsApp opt-in: 30% de leads (segunda ola)
- Conversion a cotización: 12-14% de suscriptores
- Conversion a venta: 10-12% de cotizaciones
- Comisión promedio por seguros: $80-100

---

## CONSIDERACIONES FINALES

### Email Compliance (RGPD/CCPA)
- Explícito consentimiento en cada form (checkbox)
- Link de unsubscribe visible en todos los emails
- No vender/compartir datos con terceros
- Guardar logs de consentimiento
- Política de privacidad actualizada y accesible

### Seguridad de Datos
- Usar HTTPS en todas las formas
- No guardar números completos de tarjeta
- Encriptar teléfonos en base de datos
- Limpieza mensual de leads inactivos (>90 días sin engagement)

### Testing y Optimization
- A/B test de subject lines (mínimo 2 semanas)
- A/B test de CTA copy ("Cotizar ahora" vs "Ver opciones")
- A/B test de timing (mañana vs tarde)
- A/B test de frecuencia (3x/semana vs 2x/semana)
- Análisis de resultados cada 2 semanas

### Escalabilidad
- Backend debe soportar 100,000+ leads
- Email provider con API integrada (SendGrid, AWS SES, etc)
- WhatsApp Business API con rate limiting
- Cron jobs para envío automático sin bloqueo

---

## CONCLUSIÓN

Esta estrategia propone **40+ puntos de captura únicos** distribuidos en 7 páginas principales, cada uno con propuesta de valor específica que **no requiere "vender" forzadamente** sino ofrecer un servicio legítimo (alertas, recordatorios, análisis).

El enfoque de **segmentación y personalización** garantiza que cada lead reciba mensajes relevantes, aumentando conversion rates significativamente respecto a campañas genéricas.

**Implementación phased** reduce riesgo y permite optimización continua.

**Expected outcome en 6 meses:** 50,000+ leads base de datos, 10-12% conversion a cotizaciones, 5,000+ pólizas vendidas.

