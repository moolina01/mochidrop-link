# Prompt para Claude Code — Rediseño UI premium de todas las páginas que ve el cliente

## Contexto

LinkDrop es una plataforma donde PyMEs chilenas generan un link de envío. El cliente (comprador) abre ese link y completa su dirección, elige un courier, confirma y paga. Actualmente la UI del cliente es funcional pero básica. Necesito un rediseño visual premium de TODAS las páginas que ve el cliente, manteniendo la funcionalidad intacta.

**Stack:** Next.js 14+ (App Router), TailwindCSS + inline styles, Supabase, heroicons.

**Colores de marca LinkDrop:**
- Rojo primario: `#E8553D`
- Negro texto: `#1A1A18`
- Gris texto secundario: `#5C5C57`
- Gris claro: `#9C9C95`
- Fondo: `#FAFAF7`
- Bordes: `#E8E8E3`
- Fondo cards: `#FFFFFF`
- Verde éxito: `#2D8A56`

---

## Principios de diseño

1. **Cada página debe sentirse personalizada de la PyME** — el logo y nombre de la tienda son protagonistas, LinkDrop es solo un "powered by" discreto al final
2. **Mobile-first** — el 90% de los clientes abrirán el link desde WhatsApp en su celular
3. **Confianza** — el cliente está por pagar, necesita sentir que es seguro y profesional
4. **Claridad** — cada paso debe ser obvio, sin confusión sobre qué hacer
5. **Micro-interacciones** — transiciones suaves, hover states, focus states, loading states con animación
6. **Sin emojis en la UI principal** — usar íconos de heroicons en su lugar (más profesional)

---

## Páginas a rediseñar (4 en total)

### 1. `/envio` — EnvioClient.tsx (FASE 1: Formulario del cliente)

Esta es la primera impresión. El cliente abre el link de WhatsApp y ve esto.

**Header de la tienda (siempre visible):**
- Logo de la PyME grande y centrado (si existe), con borde sutil y sombra suave, circular, ~80px
- Nombre de la tienda en tipografía bold, grande (text-2xl)
- Subtítulo: "Completa tus datos de envío" en gris
- Fondo sutil degradado o color suave detrás del header para diferenciarlo del form

**Formulario de dirección:**
- Card con fondo blanco, rounded-2xl, sombra suave, padding generoso
- Cada input debe tener:
  - Label con font-semibold, tamaño legible
  - Input con bordes redondeados (rounded-xl), padding cómodo para dedos en mobile
  - Focus state: borde que cambia al color primario (#E8553D) con ring sutil
  - Placeholder con texto gris claro de ejemplo real
- Campos organizados limpiamente:
  - Nombre completo (ancho completo)
  - Teléfono (ancho completo, con hint "Para coordinar la entrega")
  - Comuna y Número/Depto (grid 2 columnas en desktop, stack en mobile)
  - Dirección (ancho completo)
- Los campos obligatorios deben tener un asterisco rojo sutil, no agresivo
- Botón "Ver opciones de envío →" — grande, prominente, color primario #E8553D, texto blanco, bold, rounded-xl, con sombra del color primario (box-shadow con opacity), disabled state gris cuando faltan campos
- Hint debajo del botón si faltan campos: texto gris pequeño "Completa los campos marcados con * para continuar"

**Loading al cotizar:**
- Cuando el cliente presiona el botón, mostrar un estado de loading atractivo
- El botón cambia a "Cotizando mejores precios..." con un spinner inline
- Opcionalmente: skeleton placeholders donde irán las cards de courier

**Indicador de confianza:**
- Al final del formulario, una línea sutil con ícono de candado + "Tus datos están protegidos"
- "Powered by LinkDrop" discreto en el footer

---

### 2. `/envio` — EnvioClient.tsx (FASE 2: Selección de courier)

Después de cotizar, el cliente ve las opciones de envío.

**Transición:**
- Transición suave del formulario a las opciones (fade out form, fade in options)
- O scroll suave hacia las opciones si se mantiene todo en la misma vista

**Datos del destinatario (confirmación):**
- Card compacta con ícono de MapPin de heroicons, mostrando nombre y dirección que acaba de ingresar
- Botón/link pequeño "Editar dirección" que vuelve al formulario (resetea cotizaciones en el estado local)

**Cards de courier:**
- Cada courier en una card independiente, grande, tocable (todo el card es botón)
- Layout de cada card:
  - Izquierda: Nombre del courier en bold grande + tipo de servicio debajo en gris
  - Derecha: Precio prominente en bold + tiempo estimado debajo con ícono de reloj
  - Borde izquierdo de color según courier (verde Starken, rojo Chilexpress, azul BlueExpress) como accent
- Hover/active: elevación sutil, borde que cambia al color del courier
- El courier más barato debe tener un badge sutil: "Mejor precio" o un ícono de estrella
- Espacio entre cards generoso (gap-4)

**Si algún courier no está disponible**, simplemente no mostrarlo (ya funciona así).

**Footer:**
- "Powered by LinkDrop" discreto
- Ícono de candado + "Pago seguro"

---

### 3. `/confirmacion` — ConfirmacionClient.tsx

El cliente ya eligió un courier. Esta es la pantalla de confirmación antes del pago.

**Layout:**
- Header con logo de la PyME + nombre (igual que /envio)
- Título: "Confirma tu envío"
- Subtítulo: "Revisa los datos antes de pagar"

**Card de resumen del envío:**
- Sección 1: Courier seleccionado
  - Nombre del courier, tipo de servicio, precio grande y prominente
  - Tiempo estimado de entrega con ícono de reloj
  - Imagen/logo del courier si existe (ya las tiene el código: /unnamed.jpg, /images-3.png, /images-4.png)
- Sección 2: Datos del destinatario
  - Nombre, dirección completa, teléfono
  - Ícono de MapPin
- Separador sutil entre secciones (divider con línea gris clara)

**Botón de pago:**
- "Pagar $XX.XXX →" — GRANDE, prominente, color primario o azul (como el actual bg-blue-600 pero mejorado)
- Mostrar el precio en el botón mismo
- Sombra del color del botón
- Al presionar: loading state con spinner

**Indicadores de confianza:**
- Debajo del botón: íconos de métodos de pago o "Pago seguro con FLOW"
- Ícono de candado + shield

---

### 4. `/final` — FinalClient.tsx

El envío fue creado exitosamente. Pantalla de éxito.

**Animación de entrada:**
- Check mark animado (scale + fade in) — el ícono verde actual está bien pero mejorar la animación
- Confetti sutil o un efecto de éxito (opcional, no obligatorio)

**Layout:**
- Header con logo de la PyME
- Gran ícono de check verde con animación
- Título: "¡Tu envío está en camino!" en bold grande
- Subtítulo: mensaje positivo

**Card de resumen:**
- Courier + servicio + precio
- Número de tracking prominente, copiable con botón
- Link de seguimiento como botón/link destacado
- Datos del destinatario

**Acciones:**
- Botón principal: "Seguir mi envío →" (abre tracking URL)
- Botón secundario: "Copiar link de tracking" con feedback visual al copiar

**Footer:**
- "Powered by LinkDrop"

---

## Instrucciones técnicas

1. **Mantener TODA la funcionalidad existente** — no cambiar lógica de negocio, llamadas a API, webhooks, Supabase queries, ni routing. Solo cambiar la UI/presentación.
2. **Mantener los mismos archivos** — modificar `EnvioClient.tsx`, `ConfirmacionClient.tsx`, `FinalClient.tsx` in-place.
3. **Usar TailwindCSS** como método principal de styling (los archivos actuales mezclan Tailwind con inline styles — migrar a Tailwind puro donde sea posible para consistencia).
4. **Mobile-first** — diseñar para 375px de ancho primero, responsive hacia arriba.
5. **Mantener max-w-md** como ancho máximo del contenido (ya existe).
6. **No agregar dependencias externas** — usar solo lo que ya está: TailwindCSS, heroicons, Next.js.
7. **Transiciones con TailwindCSS** — usar `transition-all duration-200` o `duration-300` para hover y focus states.
8. **No romper TypeScript** — mantener los tipos existentes, no agregar `@ts-ignore`.

## Orden de ejecución

1. Rediseñar `EnvioClient.tsx` (ambas fases — es la más importante, primera impresión)
2. Rediseñar `ConfirmacionClient.tsx`
3. Rediseñar `FinalClient.tsx`
4. Verificar que todo compile sin errores
