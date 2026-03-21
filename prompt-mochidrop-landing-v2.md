# Prompt: Rediseño Landing Page MochiDrop Link — V2 con Identidad

## Contexto del proyecto

MochiDrop Link (mochidrop.cl) es un SaaS chileno que genera links de envío para PYMEs que venden por Instagram/WhatsApp y no tienen e-commerce. El vendedor pega los datos del cliente → se genera un link personalizado con su marca → el cliente abre el link, elige courier (Starken, Chilexpress, BlueExpress), paga el envío → se genera la guía automática y el tracking llega solo.

**Stack:** Next.js 16 + React 19 + TypeScript + Tailwind CSS 4 + Framer Motion + Supabase + N8N webhooks.

## Objetivo

Rediseñar COMPLETAMENTE la landing page actual con un diseño que tenga identidad propia — NO debe sentirse como template. El diseño usa bandas diagonales, secciones con cortes angulares, motivos decorativos del logo (pills diagonales), un mockup de teléfono en el hero, y la sección de dolor con formato de chat de WhatsApp. Reemplazar todo el contenido visual y copy de la landing. Mantener intactas rutas, lógica de negocio, Supabase, N8N.

---

## LOGO

El logo de MochiDrop Link es un ícono de dos pills (rectángulos con border-radius completo) en diagonal a -42° con un pequeño gap entre ellos y dos puntos "magnéticos" en el espacio entre los pills. Aquí está el SVG del logo completo con wordmark:

```svg
<svg width="140" height="32" viewBox="0 0 140 32">
  <g transform="translate(14, 16) rotate(-42) scale(0.32)">
    <rect x="-30" y="-16" width="48" height="28" rx="14" fill="none" stroke="#E8553D" stroke-width="7"/>
    <rect x="8" y="-4" width="48" height="28" rx="14" fill="none" stroke="#E8553D" stroke-width="7"/>
  </g>
  <circle cx="14" cy="15" r="1.4" fill="#E8553D" opacity="0.65"/>
  <circle cx="16.5" cy="17" r="0.9" fill="#E8553D" opacity="0.35"/>
  <text x="34" y="19" font-family="'Instrument Sans', sans-serif" font-size="15" font-weight="600" fill="#1A1A18">mochidrop</text>
  <text x="126" y="19" font-family="'Instrument Sans', sans-serif" font-size="15" font-weight="500" fill="#E8553D">link</text>
</svg>
```

Y aquí el ícono solo (para favicon, app icon):

```svg
<svg width="64" height="64" viewBox="0 0 64 64">
  <g transform="translate(32,32) rotate(-42) scale(0.58)">
    <rect x="-30" y="-16" width="48" height="28" rx="14" fill="none" stroke="#E8553D" stroke-width="7"/>
    <rect x="8" y="-4" width="48" height="28" rx="14" fill="none" stroke="#E8553D" stroke-width="7"/>
  </g>
  <circle cx="31" cy="31" r="2.2" fill="#E8553D" opacity="0.65"/>
  <circle cx="34.5" cy="33.5" r="1.4" fill="#E8553D" opacity="0.35"/>
</svg>
```

Usar este logo en el navbar y donde corresponda. Los pills del logo en diagonal (-42°) también se usan como MOTIVO DECORATIVO sutil (opacity 0.04-0.12) en varias secciones para crear coherencia de marca.

---

## PALETA DE COLORES

```
--bg: #FAFAF7           (fondo general, crema)
--surface: #FFFFFF       (cards, campos)
--ink: #1A1A18           (texto principal)
--ink-soft: #5C5C57      (texto secundario)
--ink-muted: #9C9C95     (texto terciario)
--accent: #E8553D        (acento principal, rojo-coral)
--accent-glow: #FF6B52   (hover del acento)
--accent-soft: #FFF0ED   (fondos suaves de acento)
--green: #2D8A56         (éxito, positivo)
--green-soft: #E8F5ED    (fondo verde suave)
--purple: #6C5CE7        (acento secundario)
--dark: #141413          (fondos oscuros)
--border: #E8E8E3        (bordes sutiles)
```

## TIPOGRAFÍA

- **Font:** "Instrument Sans" de Google Fonts (400, 500, 600, 700)
- Importar: `https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700`
- Fallback: `-apple-system, sans-serif`
- Anti-aliasing: `antialiased`

---

## LO QUE HACE QUE ESTE DISEÑO NO SEA TEMPLATE

Estos son los elementos de identidad que DEBEN estar presentes. Sin ellos, la landing se ve genérica:

1. **Banda diagonal de acento en el hero:** Un `::before` pseudoelemento con `background: #FFF0ED`, `width: 70vw`, `height: 140vh`, `transform: rotate(-12deg)`, posicionado `top: -20%; right: -10%` con `border-radius: 0 0 0 80px`. Esto crea una mancha diagonal de color que rompe la monotonía del fondo.

2. **Cortes diagonales entre secciones:** Usar `transform: skewY(-2deg)` o `skewY(2deg)` en pseudoelementos `::before` para que las transiciones entre secciones no sean líneas rectas horizontales sino cortes angulares.

3. **Motivos decorativos de pills:** Los dos pills del logo (rectángulos rx=14, rotados -42°) aparecen como elementos decorativos con `opacity: 0.04-0.12` y `border: 2-3px solid #E8553D` en varias secciones: hero (200×200px, top:15% right:8%), sección de comparación (180×90px, bottom:10% left:5%), CTA final (500×250px centrado).

4. **Mockup de teléfono real en el hero:** No un screenshot — un teléfono construido con CSS (border-radius 32px, notch, screen) que muestra exactamente cómo se ve el link de envío: header con logo de "Tu Tienda", dirección del cliente, 3 opciones de courier con precio, y botón "Pagar envío".

5. **Sección de dolor con burbujas de WhatsApp:** En vez de cards o bullet points, los pain points se presentan como un chat real de WhatsApp con burbujas de cliente (fondo blanco, alineadas a la izquierda, border-bottom-left-radius: 4px) y burbujas de vendedor (fondo #E8553D, alineadas a la derecha, border-bottom-right-radius: 4px), más burbujas narrativas centradas (fondo rgba gris, pill).

6. **Sección de comparación sobre fondo oscuro:** La sección "Antes vs Después" usa `background: #141413` con texto blanco, creando un quiebre visual dramático.

---

## ESTRUCTURA DE SECCIONES — Orden exacto

### 1. NAVBAR

- Fixed, `backdrop-filter: blur(24px)`, `background: rgba(250,250,247,0.8)`
- Border-bottom: `1px solid rgba(0,0,0,0.04)` (ultra sutil)
- Logo SVG a la izquierda (usar el SVG del logo con wordmark proporcionado arriba)
- CTA derecha: botón pill negro (#1A1A18), texto "Probar gratis →", hover cambia a #E8553D
- Link a: `https://wa.me/56994284520?text=Hola,%20quiero%20probar%20MochiDrop%20gratis`

### 2. HERO

- `min-height: 100vh`, display flex, align-items center
- `::before` = banda diagonal #FFF0ED (ver specs arriba)
- `::after` = pill decorativo grande (200×200px, border 3px solid #E8553D, opacity 0.07, rotate -42deg)
- Grid interior: `1.1fr 0.9fr`, gap 60px

**Columna izquierda (contenido):**
- Badge: pill blanco con borde, dot rojo con animación pulse, texto "Para PYMEs que venden por Instagram y WhatsApp"
- H1 (clamp 36px-60px, weight 700, letter-spacing -0.035em, line-height 1.06):
  ```
  Deja de cotizar envíos
  uno por uno.
  ```
  "uno por uno." en color #E8553D
- Subtítulo (16-19px, color #5C5C57, max-width 480px):
  ```
  Manda un link, tu cliente elige courier, paga el envío y recibe su tracking. Sin explicar tarifas, sin hacer filas, sin perder ventas.
  ```
- Dos botones:
  - Primario: "Quiero probarlo gratis" (pill, #E8553D, box-shadow con color acento)
  - Ghost: "Ver cómo funciona ↓" (pill, transparente, borde #E8E8E3)
- Animaciones Framer Motion: fadeUp escalonadas (0s, 0.08s, 0.16s, 0.24s)

**Columna derecha (mockup de teléfono):**
- Container con pills decorativos flotando alrededor (3 pills, diferentes tamaños, opacity 0.08-0.12, rotate -42deg, position absolute)
- Phone frame: width 280px, bg white, border-radius 32px, box-shadow profundo, padding 16px, border sutil
- Phone notch: 100px ancho, 24px alto, bg #1A1A18, border-radius 0 0 16px 16px
- Phone screen (bg #FAFAF7, border-radius 20px, padding 20px 16px):
  - Header: cuadrado redondeado 28px con logo ícono + texto "Tu Tienda link"
  - Label "Envío para María López"
  - Campo de dirección: "📍 Av. Providencia 1234, Santiago"
  - Label "Elige tu courier"
  - 3 opciones de courier (cards con borde):
    - Starken: $3.490, 2-3 días (esta con borde #E8553D y fondo #FFF0ED = seleccionada)
    - Chilexpress: $4.190, 1-2 días
    - Blue Express: $2.890, 3-4 días
  - Botón "Pagar envío →" (bg #E8553D, white, border-radius 10px, full width)
- En mobile: el teléfono va arriba (order: -1), width reducido a 240px

### 3. SECCIÓN DOLOR — Chat de WhatsApp

- `background: #FFF0ED` (acento suave, full width)
- `::before` = corte diagonal con skewY(-2deg) del color de la sección anterior (#FAFAF7)
- Max-width 700px centrado
- Label: "¿Te suena familiar?" (12px, uppercase, letter-spacing 0.12em, color #E8553D)
- Título: "Tu WhatsApp, todos los días:" (26-36px, bold)
- Chat thread (flex column, gap 12px):

  **Burbuja cliente** (fondo white, alineado flex-start, border-radius 18px con bottom-left 4px, box-shadow sutil):
  ```
  Hola! Cuánto sale el envío a Temuco? 🤔
  ```
  timestamp "14:23" abajo a la derecha

  **Burbuja narrador** (centrada, fondo rgba(0,0,0,0.04), pill, font-size 13px, color #5C5C57):
  ```
  ⏱ 8 minutos cotizando en Starken y Chilexpress...
  ```

  **Burbuja vendedor** (fondo #E8553D, color white, alineado flex-end, border-radius 18px con bottom-right 4px):
  ```
  Starken $3.490 (2-3 días) y Chilexpress $4.190 (1-2 días). Me avisas cuál prefieres y te paso los datos para la transferencia 🙏
  ```
  timestamp "14:31"

  **Burbuja cliente:**
  ```
  Ya, déjame ver... y a Concepción cuánto sería?
  ```
  timestamp "14:45"

  **Burbuja narrador:**
  ```
  💸 Otra cotización. Otra venta en riesgo. Otro día completo así.
  ```

- Animación Framer Motion: cada burbuja aparece con fadeUp + scale(0.96→1), delay escalonado 0.12s entre cada una, trigger `whileInView` con `viewport={{ once: true }}`

### 4. CÓMO FUNCIONA — Timeline vertical

- Fondo #FAFAF7
- `::before` = corte diagonal skewY(-2deg) con color #FFF0ED de la sección anterior
- Label: "Cómo funciona"
- Título: "De 15 minutos a 30 segundos"
- Layout: NO es un grid de 3 columnas. Es una lista vertical con una línea conectora.
  - Línea vertical a la izquierda: `position absolute`, `left: 32px`, `width: 2px`, gradiente de #E8553D a #2D8A56, va de top a bottom de los steps
  - Cada step: flex row, gap 28px
    - Dot izquierdo: 64×64px, border-radius 20px, font-weight 700, font-size 22px, color white, box-shadow. Step 1 = #E8553D, Step 2 = #6C5CE7, Step 3 = #2D8A56.
    - Contenido derecho: h3 (20px, bold) + p (15px, color #5C5C57, max-width 440px)

  **Paso 1:** "Pegas los datos del cliente" — Nombre y dirección. MochiDrop genera un link personalizado con tu marca en segundos.
  **Paso 2:** "Tu cliente elige y paga" — Abre el link, ve las opciones de courier con precios reales, elige y paga. Todo sin salir del link.
  **Paso 3:** "Guía + tracking automático" — Recibes la guía lista para imprimir. Tu cliente recibe el seguimiento automáticamente. Tú no tocas nada.

- En mobile: step-dot baja a 48×48px, border-radius 14px, left de la línea a 20px

### 5. COMPARACIÓN — Fondo oscuro

- `background: #141413`, color white
- `::before` = corte diagonal skewY(2deg) con fondo #FAFAF7
- `::after` = pill decorativo (180×90px, border 2px solid #E8553D, opacity 0.06, rotate -42deg, bottom 10% left 5%)
- Label: "Antes vs. Después" (color #FF6B52)
- Título: "Tu día con y sin MochiDrop" (white)
- Grid 2 columnas, border-radius 20px, overflow hidden, border 1px solid rgba(255,255,255,0.08):

  **Columna "Sin MochiDrop"** (background rgba(232,85,61,0.08), border-right 1px solid rgba(255,255,255,0.06)):
  - Título: "✗ Sin MochiDrop" (color #FF8A7A)
  - Items en rgba(255,255,255,0.6):
    - Cotizas envío en cada courier manualmente
    - Mandas capturas de precio por WhatsApp
    - Esperas que el cliente transfiera
    - Generas la guía a mano en la web del courier
    - Copias y pegas el tracking

  **Columna "Con MochiDrop"** (background rgba(45,138,86,0.08)):
  - Título: "✓ Con MochiDrop" (color #6EDB9A)
  - Items en rgba(255,255,255,0.6):
    - Pegas los datos → se genera el link
    - Mandas el link por WhatsApp
    - El cliente elige courier y paga solo
    - La guía se genera automáticamente
    - El tracking llega solo al cliente

  **Barra inferior** (grid-column 1/-1, border-top, centered, flex, gap 48px):
  - "~15 min" (28px bold, color #FF8A7A) + "por envío manual" (12px, rgba white 0.4)
  - "~30 seg" (28px bold, color #6EDB9A) + "por envío con MochiDrop" (12px, rgba white 0.4)

- En mobile: grid 1 columna, border-right cambia a border-bottom

### 6. CALCULADORA DE TIEMPO

- Fondo #FAFAF7
- `::before` = corte diagonal skewY(-2deg) con fondo #141413
- Label: "Calculadora de tiempo"
- Título: "¿Cuánto tiempo estás perdiendo?"
- Card centrada max-width 560px:
  - Fondo white, border 1.5px solid #E8E8E3, border-radius 24px, padding 40px
  - `::before` = línea vertical de 5px en el lado izquierdo con `background: linear-gradient(to bottom, #E8553D, #6C5CE7)`, border-radius redondeado
  - Label: "¿Cuántos envíos haces a la semana?"
  - Input: font-size 36px, font-weight 700, color #E8553D, border: none, border-bottom 3px solid #E8553D, width 100px, centrado. Default: 15.
  - Texto al lado del input: "envíos / semana" (15px, color #9C9C95)
  - Resultados (3 rows):
    - "Tiempo manual por semana" → cálculo (envíos × 15 min, formateado)
    - "Tiempo con MochiDrop" → cálculo (envíos × 0.5 min, formateado)
    - "Tiempo que recuperas al mes" (row con fondo #FFF0ED, borde rgba acento) → ((manual - mochi) × 4) en horas, color #E8553D, font-size 20px
  - La calculadora debe ser reactiva (useState, onChange)

### 7. CTA FINAL

- Fondo #FAFAF7, padding 100px arriba, 120px abajo
- `::before` = pill decorativo gigante (500×250px, border 3px solid #E8553D, opacity 0.04, rotate -42deg, centrado)
- H2: "¿Lista para dejar de cotizar envíos a mano?" (28-42px, bold)
- Subtítulo: "Crea tu primer link de envío en menos de un minuto. Sin tarjeta, sin compromiso, sin letra chica." (17px, #5C5C57, max-width 500px centrado)
- Botón primario grande: "Empezar gratis por WhatsApp →" (18px, padding 18px 40px) → link WhatsApp
- Tag debajo: pill verde (#E8F5ED fondo, #2D8A56 texto): "✓ 20 envíos gratis cada mes, para siempre"

### 8. FOOTER

- border-top 1px solid #E8E8E3
- Flex, space-between, max-width 1100px centrado
- Izquierda: "© 2025 MochiDrop — Santiago, Chile 🇨🇱"
- Derecha: contacto@mochidrop.cl · WhatsApp (links, hover #E8553D)
- Font-size 13px, color #9C9C95

---

## ANIMACIONES (Framer Motion)

- **fadeUp**: `initial={{ opacity: 0, y: 20 }}` → `animate={{ opacity: 1, y: 0 }}` con `transition={{ duration: 0.7, ease: "easeOut" }}`
- **Hero**: escalonar con delays 0s, 0.08s, 0.16s, 0.24s, 0.3s
- **Chat bubbles**: `whileInView={{ opacity: 1, y: 0, scale: 1 }}` desde `initial={{ opacity: 0, y: 12, scale: 0.96 }}` con delays escalonados de 0.12s. `viewport={{ once: true }}`
- **Steps**: cada paso aparece con fadeUp, delay = index × 0.15s, trigger whileInView
- **Compare grid**: fadeUp al entrar en viewport
- **Calculator card**: fadeUp al entrar en viewport
- **Buttons**: `whileHover={{ y: -2 }}` con transition spring
- **Nav CTA hover**: transition a background #E8553D + translateY(-1px)
- **Puntos magnéticos del logo**: pueden tener un pulse sutil con CSS keyframes (no obligatorio en nav, sí en hero si aparece)

---

## REGLAS TÉCNICAS

1. Componentizar cada sección: Navbar, Hero (con PhoneMockup como subcomponente), PainChat, HowItWorks, Comparison, Calculator, FinalCTA, Footer
2. Todo el copy va hardcodeado
3. Todos los links de WhatsApp → `https://wa.me/56994284520?text=Hola,%20quiero%20probar%20MochiDrop%20gratis`
4. La calculadora usa useState para el input y cálculos reactivos
5. Mobile-first, totalmente responsive
6. Asegurar que "Instrument Sans" esté importada en layout.tsx
7. Mantener las integraciones existentes con Supabase y N8N intactas
8. Usar Tailwind para la mayoría del styling. Para elementos complejos (banda diagonal, cortes skew, mockup de teléfono, motivos decorativos con pills), usar estilos inline o un archivo CSS complementario
9. Smooth scroll para anchor links internos (#como-funciona)
10. Los SVGs del logo deben ser componentes React reutilizables (MochiDropLogo, MochiDropIcon)

---

## IMPORTANTE

- NO cambiar la estructura de carpetas del proyecto
- NO tocar rutas que no sean la landing page
- NO modificar lógica de negocio, Supabase, o webhooks N8N
- SÍ reemplazar completamente el contenido visual y copy de la landing
- SÍ mantener cualquier formulario funcional existente, adaptando su estilo al nuevo diseño
- Antes de empezar, explorar la estructura actual del proyecto para entender qué archivos tocar
- El diseño debe sentirse ÚNICO — los elementos de identidad (banda diagonal, cortes skew, pills decorativos, chat bubbles, mockup de teléfono) son lo que lo diferencia de un template genérico. NO omitirlos.
