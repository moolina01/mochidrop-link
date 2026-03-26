# Prompt Claude Code — Rediseño Página de Confirmación LinkDrop

## Contexto

Archivo a modificar: el componente `ConfirmacionClient` que se muestra después de que el cliente elige un courier. Es la pantalla de "revisa antes de pagar". Actualmente se ve muy simple y plano — necesita más jerarquía visual, confianza y claridad de checkout real.

## Qué hacer

Rediseñar la sección de contenido (desde "REVISA LOS DATOS ANTES DE PAGAR" hasta el botón de pago). No tocar el header de la tienda (logo + nombre), ni la lógica de Supabase/routing/pago.

### 1. Reemplazar `COURIER_STYLES` y `COURIER_LOGOS`

Eliminar `COURIER_LOGOS` completamente (ya no se usan imágenes JPG/PNG de logos). Reemplazar `COURIER_STYLES` con:

```typescript
const COURIER_CONFIG: Record<string, { color: string; colorLight: string; label: string }> = {
  starken: {
    color: "#00A651",      // Verde — color real de Starken
    colorLight: "#E8F8EE",
    label: "Starken",
  },
  chilexpress: {
    color: "#FFC600",      // Amarillo — color real de Chilexpress
    colorLight: "#FFFBE8",
    label: "Chilexpress",
  },
  blueexpress: {
    color: "#0055B8",      // Azul — color real de Blue Express
    colorLight: "#E8F0FA",
    label: "Blue Express",
  },
};
```

### 2. Nueva estructura de la card de confirmación

Todo el contenido va dentro de UNA sola card (`bg-white rounded-2xl border border-[#E8E8E3] shadow-sm overflow-hidden`). La card se divide en 3 secciones separadas por `border-b border-[#E8E8E3]`:

**Sección 1 — Courier seleccionado** (padding `px-5 py-5`):
- Label superior: "RESUMEN DE ENVÍO" en `text-[11px] font-semibold uppercase tracking-wider text-[#9C9C95]`
- Fila con:
  - Cuadrado redondeado (44x44, `rounded-xl`) con el `color` de marca del courier como background, y un ícono SVG de camión blanco centrado adentro (no iniciales, no foto JPG)
  - A la derecha del ícono: nombre del courier en `font-bold text-base text-[#1A1A18]` + debajo "Llega en {tiempo}" en `text-sm text-[#5C5C57]`
  - Precio alineado a la derecha: `font-bold text-2xl text-[#1A1A18]`

**Sección 2 — Destinatario** (padding `px-5 py-4`):
- Label superior: "DESTINATARIO" en el mismo estilo que arriba
- Fila con ícono de MapPin (32x32, `rounded-lg bg-[#FAFAF7] border border-[#E8E8E3]`) + datos:
  - Nombre en `font-semibold text-sm text-[#1A1A18]`
  - Dirección + número + comuna en `text-sm text-[#5C5C57] leading-snug`
  - Teléfono (si existe) en `text-sm text-[#9C9C95]`

**Sección 3 — Total** (padding `px-5 py-4`, background `bg-[#FAFAF7]`):
- Fila flex con justify-between:
  - "Total a pagar" en `text-sm text-[#5C5C57]`
  - Monto en `font-bold text-xl text-[#1A1A18]`

### 3. Eliminar

- El título "REVISA LOS DATOS ANTES DE PAGAR" separado arriba de la card — ya no es necesario, la card tiene sus propios labels
- `COURIER_LOGOS` y las etiquetas `<img>` que renderizaban los JPG/PNG de logos
- La referencia al `tipo` del courier (el texto "normal" que aparecía) — no aporta información útil al cliente
- El import de `CheckBadgeIcon` si existe

### 4. Botón de pago

Mantener el botón tal cual está (diseño, colores, sombra, estado de loading). Solo asegurarse de que esté FUERA de la card principal, con un `mt-4` de separación.

### 5. Trust badges y footer

Mantener exactamente como están — "Pago seguro", "Procesado por FLOW", y "Powered by LinkDrop".

### 6. Lo que NO debe cambiar

- El componente `LoadingFallback`
- El header de la tienda (logo + nombre + "Confirma tu envío")
- La lógica de Supabase (fetch del envío, verificación de estado)
- La función `confirmarEnvio` y el routing a `/pago`
- El overlay de loading cuando `paying` es true
- Los estados de error/no encontrado
- El botón de pago (diseño y funcionalidad)

### 7. Ícono SVG del camión para la sección de courier

Usar este SVG inline dentro del cuadrado de color de marca:

```tsx
<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path
    d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9 1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"
    fill="white"
  />
</svg>
```

El background del contenedor del ícono se aplica con `style={{ backgroundColor: cfg.color }}` donde `cfg` es `COURIER_CONFIG[courier]`.

### 8. Resultado esperado

```
┌─────────────────────────────────────────────┐
│  RESUMEN DE ENVÍO                           │
│                                             │
│  [■ camión]  Starken              $3.620    │
│              Llega en 2-3 días              │
├─────────────────────────────────────────────┤
│  DESTINATARIO                               │
│                                             │
│  [📍]  María López                          │
│        Av. Providencia 21, Depto 12         │
│        Providencia                          │
│        +56 9 4937 8795                      │
├─────────────────────────────────────────────┤
│  Total a pagar                    $3.620    │
│                                  (fondo gris)│
└─────────────────────────────────────────────┘

         [ Pagar $3.620 → ]

     🔒 Pago seguro · 🛡️ Procesado por FLOW

         Powered by LinkDrop
```
