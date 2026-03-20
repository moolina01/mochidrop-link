# Prompt: Rediseño Landing Page MochiDrop

## Contexto del proyecto

MochiDrop (mochidrop.cl) es un SaaS chileno que genera links de envío para PYMEs que venden por Instagram/WhatsApp y no tienen e-commerce. El vendedor pega los datos del cliente → se genera un link personalizado con su marca → el cliente abre el link, elige courier (Starken, Chilexpress, BlueExpress), paga el envío → se genera la guía automática y el tracking llega solo.

**Stack actual:** Next.js 16 + React 19 + TypeScript + Tailwind CSS 4 + Framer Motion + Supabase + N8N webhooks.

## Objetivo

Rediseñar COMPLETAMENTE la landing page actual (`/` o la página principal) con nuevo diseño visual, nueva estructura y nuevo copy. No es un ajuste — es un reemplazo total del contenido y estilo de la landing. Mantén intactas las rutas, componentes funcionales (formularios conectados a Supabase/N8N) y la estructura del proyecto. Solo transforma la landing page.

---

## DISEÑO VISUAL — Seguir exactamente estas especificaciones

### Paleta de colores (usar como variables de Tailwind o CSS custom properties)

```
Background general:    #FAFAF7
Surface / cards:       #FFFFFF
Texto principal:       #1A1A18
Texto secundario:      #5C5C57
Texto muted:           #9C9C95
Acento principal:      #E8553D
Acento hover/glow:     #FF6B52
Acento suave (fondos): #FFF0ED
Verde:                 #2D8A56
Verde suave:           #E8F5ED
Púrpura:               #6C5CE7
Púrpura suave:         #F0EEFF
Amarillo:              #F0B429
Bordes:                #E8E8E3
```

### Tipografía

- **Font principal:** "Instrument Sans" de Google Fonts (weights: 400, 500, 600, 700)
- Importar desde: `https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700`
- Fallback: `-apple-system, sans-serif`
- Anti-aliasing: `antialiased`

### Tokens de diseño

- Border radius grande: 16px
- Border radius pequeño: 10px
- Bordes de cards: 1.5px solid #E8E8E3
- Shadow md: `0 4px 20px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)`
- Shadow lg: `0 12px 40px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)`
- Max-width contenido: 1100px (secciones amplias), 900px (secciones de lectura), 700px (CTAs y calculadora)

### Efecto especial

- Aplicar un grain overlay sutil sobre toda la página (SVG noise filter con opacity 0.03, position fixed, pointer-events none, z-index alto). Esto le da textura al fondo crema.

### Estilo general

- Estética cálida, editorial, no corporativa. Fondo crema (#FAFAF7), no blanco puro.
- Cards con borde sutil y fondo blanco, hover con translateY(-4px) y shadow.
- Botones primarios: fondo #E8553D, texto blanco, border-radius 100px (pill), box-shadow con color del acento. Hover sube y se ilumina.
- Botones secundarios: fondo blanco, borde #E8E8E3, border-radius 100px. Hover oscurece el borde.
- Mobile-first y totalmente responsive.

---

## ESTRUCTURA DE SECCIONES — Seguir este orden exacto

### 1. NAVBAR (fixed, blur backdrop)

- Logo: cuadrado redondeado (8px) color #E8553D con letra "M" blanca + texto "MochiDrop" en bold
- CTA derecha: botón pill negro (#1A1A18) → "Probar gratis →" → link a WhatsApp: `https://wa.me/56994284520?text=Hola,%20quiero%20probar%20MochiDrop%20gratis`
- Background: rgba del fondo con backdrop-filter blur(20px)
- Borde inferior sutil

### 2. HERO

- Badge superior: pill con fondo #FFF0ED, texto #E8553D, ícono de pulso animado (círculo que hace pulse), texto: "Para PYMEs que venden por Instagram y WhatsApp"
- Título H1 (clamp 38px a 64px, weight 700, letter-spacing -0.03em, line-height 1.08):
  ```
  Deja de cotizar envíos
  uno por uno.
  ```
  "uno por uno." en color #E8553D con un highlight suave (pseudo-element con fondo #FFF0ED detrás)
- Subtítulo (17-20px, color #5C5C57, max-width 600px centrado):
  ```
  Manda un link, tu cliente elige courier, paga el envío y recibe su tracking. Sin explicar tarifas, sin hacer filas, sin perder ventas.
  ```
- Dos botones:
  - Primario: "Quiero probarlo gratis" → WhatsApp
  - Secundario: "Ver cómo funciona ↓" → scroll a sección #como-funciona
- Animaciones de entrada: fadeInUp escalonado (0s, 0.1s, 0.2s, 0.3s para badge, título, subtítulo, botones)

### 3. SECCIÓN DOLOR — "¿Te suena familiar?"

- Card grande con fondo blanco, borde, y una línea de 4px en el top con gradient de #E8553D a #F0B429
- Label superior: "¿Te suena familiar?" (13px, uppercase, letter-spacing 0.1em, color #E8553D)
- Título: "Cada envío te cuesta 15 minutos de tu vida" (24-32px, bold)
- 4 items de dolor, cada uno con:
  - Fondo #FDF6F5, border-left 3px solid #E8553D, border-radius 10px
  - Emoji a la izquierda, texto con la frase de dolor en bold y la explicación en color secundario

  Los 4 dolores exactos:

  😩 **"¿Cuánto sale el envío a Temuco?"** — y tienes que abrir Starken, Chilexpress, cotizar, sacar captura y mandarlo por WhatsApp. Por cada cliente.

  🔄 **"¿Y a La Serena? ¿Y a Concepción?"** — las mismas preguntas todo el día. Mientras tanto, pierdes tiempo que podrías usar para vender.

  💸 **"Ya, déjalo, mejor no compro"** — el cliente se aburre de esperar la cotización o no quiere transferir el envío aparte. Venta perdida.

  🏃 **Ir a dejar el paquete, hacer la guía a mano, mandar el tracking...** — tiempo muerto que se repite con cada pedido.

### 4. CÓMO FUNCIONA — 3 pasos

- Label: "Cómo funciona"
- Título: "De 15 minutos a 30 segundos"
- Grid de 3 columnas (1 columna en mobile), cada card con:
  - Número en cuadrado redondeado (12px radius): paso 1 = #E8553D, paso 2 = #6C5CE7, paso 3 = #2D8A56
  - Hover: translateY(-4px) + shadow
  - Flechas "→" entre cards (ocultar en mobile)

  **Paso 1:** "Pegas los datos" — Nombre y dirección del cliente. MochiDrop genera un link personalizado con tu marca.

  **Paso 2:** "Tu cliente elige y paga" — Ve las opciones de courier con precios reales. Elige, paga el envío y listo. Todo en el link.

  **Paso 3:** "Guía + tracking automático" — Recibes la guía lista para imprimir. Tu cliente recibe el seguimiento automáticamente.

### 5. COMPARACIÓN — Antes vs Después

- Label: "Antes vs. Después"
- Título: "Tu día con y sin MochiDrop"
- Grid de 2 columnas (1 en mobile)

  **Columna "Sin MochiDrop"** (fondo #FDF6F5, borde #F0D0CA):
  - ❌ Sin MochiDrop (título en #E8553D)
  - Cotizas envío manualmente en cada courier
  - Mandas capturas de precio por WhatsApp
  - Esperas que el cliente te transfiera
  - Generas la guía a mano en la web del courier
  - Copias y pegas el tracking por WhatsApp
  - ~15 minutos por cada envío

  **Columna "Con MochiDrop"** (fondo #E8F5ED, borde #B8DCCA):
  - ✅ Con MochiDrop (título en #2D8A56)
  - Pegas los datos del cliente → se genera el link
  - Mandas el link por WhatsApp
  - El cliente elige courier y paga solo
  - La guía se genera automáticamente
  - El tracking llega solo al cliente
  - ~30 segundos por cada envío

### 6. CALCULADORA DE TIEMPO

- Card con fondo oscuro (#1A1A18), texto blanco
- Efecto decorativo: radial-gradient sutil de #E8553D con opacity 0.15 en esquina superior derecha
- Label: "Calculadora de tiempo" (color #FF6B52)
- Título: "¿Cuánto tiempo estás perdiendo?"
- Subtítulo: "Ingresa cuántos envíos haces a la semana" (color rgba blanco 0.6)
- Input numérico estilizado (fondo rgba blanco 0.1, borde rgba blanco 0.15, texto blanco, font-size 28px bold, width 120px centrado)
  - Default value: 15
- Panel de resultados (fondo rgba blanco 0.08, border-radius 10px):
  - Fila: "Tiempo manual por semana" → cálculo (envíos × 15 min)
  - Fila: "Tiempo con MochiDrop" → cálculo (envíos × 0.5 min)
  - Fila total (con borde top): "Tiempo que recuperas al mes" → ((manual - mochi) × 4) formateado en horas → color #FF6B52, font-size más grande
- La calculadora debe ser reactiva (recalcular en cada cambio del input)

### 7. STATS / SOCIAL PROOF

- Label: "En números"
- Título: "Hecho para vendedoras reales"
- Grid de 3 columnas (1 en mobile), cada stat card:
  - Número grande (36px, bold, color #E8553D)
  - Descripción debajo (14px, color secundario)

  **30s** — Tiempo promedio por envío
  **3** — Couriers para elegir
  **$0** — Para empezar a usar

### 8. CTA FINAL

- Max-width 700px, centrado
- Título: "¿Lista para dejar de cotizar envíos a mano?"
- Subtítulo: "Crea tu primer link de envío en menos de un minuto. Sin tarjeta, sin compromiso, sin letra chica."
- Botón primario grande: "Empezar gratis por WhatsApp →" → link WhatsApp
- Tag debajo del botón: pill verde (#E8F5ED fondo, #2D8A56 texto): "✓ 20 envíos gratis cada mes, para siempre"

### 9. FOOTER

- Borde top sutil
- "© 2025 MochiDrop — Santiago, Chile 🇨🇱"
- Links: contacto@mochidrop.cl · WhatsApp
- Color #9C9C95, links hover a #E8553D

---

## ANIMACIONES (Framer Motion)

Usar Framer Motion para todas las animaciones de entrada:

- **fadeInUp:** `initial={{ opacity: 0, y: 24 }}` → `animate={{ opacity: 1, y: 0 }}` con duración 0.8s, ease
- Hero: escalonar badge (0s), título (0.1s), subtítulo (0.2s), botones (0.3s)
- Secciones: usar `whileInView` con `viewport={{ once: true }}` para animar al hacer scroll
- Cards de pasos y stats: escalonar entrada con delay incremental (index × 0.1s)
- Cards hover: `whileHover={{ y: -4 }}` con transition spring
- Botones: `whileHover={{ y: -2 }}` + scale sutil

---

## REGLAS TÉCNICAS

1. Componetizar cada sección en su propio componente React (Hero, PainSection, HowItWorks, Comparison, Calculator, Stats, FinalCTA, Footer, Navbar)
2. Todo el copy va hardcodeado (no necesita CMS)
3. Asegurar que todos los links de WhatsApp apunten a: `https://wa.me/56994284520?text=Hola,%20quiero%20probar%20MochiDrop%20gratis`
4. La calculadora debe funcionar con estado local (useState)
5. Totalmente responsive: mobile-first
6. Si existe un layout general (layout.tsx), asegurar que la font "Instrument Sans" esté importada ahí
7. Mantener las integraciones existentes con Supabase y N8N intactas — si el formulario actual de "Genera tu link" está conectado, mantener esa funcionalidad aunque cambie el diseño visual
8. Usar Tailwind para todo el styling, extendiendo el theme si es necesario para los colores custom. Si algún estilo es complejo (grain overlay, gradients específicos), usar CSS inline o un archivo CSS complementario
9. Smooth scroll para los anchor links internos

---

## IMPORTANTE

- NO cambiar la estructura de carpetas del proyecto
- NO tocar rutas que no sean la landing page
- NO modificar la lógica de negocio, conexiones a Supabase, o webhooks de N8N
- SÍ reemplazar completamente el contenido visual y copy de la landing
- SÍ mantener cualquier formulario funcional que exista, adaptando su estilo al nuevo diseño
- Antes de empezar, explorar la estructura actual del proyecto para entender qué archivos tocar
