# Prompt para Claude Code — Refactor LinkDrop: Cliente llena sus datos en el link

## Contexto del proyecto

LinkDrop es una plataforma donde PyMEs chilenas generan un link de envío para sus clientes. El cliente abre el link, ve opciones de courier con precios reales, elige uno y paga. La app usa **Next.js (App Router)**, **Supabase**, **n8n** para orquestación, y la **API de Envia.com** para cotizar couriers.

## Qué quiero cambiar

Actualmente la PyME llena TODOS los datos (su negocio, dirección del cliente, dimensiones del paquete) y al generar el link ya se cotizan los couriers. Quiero separar el flujo:

1. **La PyME solo llena:** datos de su negocio (nombre, logo) + dirección de origen + dimensiones del paquete → genera el link
2. **El cliente abre el link y:** llena sus datos de envío (nombre, teléfono, comuna, dirección, número/depto) → se cotizan los couriers en tiempo real → elige courier → paga

## Flujo nuevo

```
PyME (CreateLink)                    Cliente (/envio?id=X)
─────────────────                    ─────────────────────
1. Llena: negocio + origen + paquete
2. Click "Generar link"
   → POST webhook/crear-envio
   → Inserta en Supabase sin datos de cliente
   → estado = "pendiente_destino"
   → Devuelve { id }
3. Recibe link /envio?id=X
4. Envía link por WhatsApp
                                     5. Cliente abre el link
                                     6. Ve formulario: nombre, teléfono,
                                        comuna, dirección, número/depto
                                     7. Click "Ver opciones de envío"
                                        → POST webhook/cotizar-envio
                                          con { id, datos_destino }
                                        → Cotiza 3 couriers
                                        → Actualiza Supabase con
                                          datos_destino + cotizaciones
                                        → estado = "pendiente"
                                        → Devuelve { cotizaciones }
                                     8. Muestra couriers con precios
                                     9. Cliente elige courier
                                     10. Redirige a /confirmacion?id=X&courier=Y
```

## Los workflows de n8n ya están configurados. Solo hay que modificar el frontend.

Los webhooks disponibles son:
- `POST https://mochidrop-n8n.utdxt3.easypanel.host/webhook/crear-envio` — recibe datos de PyME, devuelve `{ id }`
- `POST https://mochidrop-n8n.utdxt3.easypanel.host/webhook/cotizar-envio` — recibe `{ id, datos_destino }`, devuelve `{ cotizaciones }`
- `POST https://mochidrop-n8n.utdxt3.easypanel.host/webhook/confirmar-envio` — genera guía (ya existía, no tocar)

---

## Archivo 1: `CreateLinkClient.tsx` (formulario de la PyME)

### Quitar completamente:
- Toda la sección 2 "Datos del cliente (destinatario)" — los campos: clienteNombre, clienteTelefono, clienteComuna, clienteDireccion, clienteNumero
- Del `FormState`: eliminar clienteNombre, clienteTelefono, clienteComuna, clienteDireccion, clienteNumero
- Del `DEFAULT`: eliminar esos campos
- Del `isComplete()`: quitar validaciones de campos del cliente
- Del payload del webhook: quitar `datos_destino`

### Agregar:
- Campo `origenNumero` al FormState para el número de la dirección de origen (actualmente no existe)

### Renumerar secciones:
- Sección 1: Tu negocio (nombre + logo) — sin cambios
- Sección 2: Desde dónde despachas (origenComuna, origenDireccion, origenNumero) — era la 3
- Sección 3: Dimensiones del paquete — era la 4

### Cambiar el payload del webhook:
```javascript
const payload = {
  nombre_pyme: form.nombrePyme.trim(),
  logo_pyme: logoUrl,
  origen: {
    comuna: form.origenComuna.trim(),
    direccion: form.origenDireccion.trim(),
    numero: form.origenNumero.trim(),
  },
  paquete: {
    largo: Number(form.largo),
    alto: Number(form.alto),
    ancho: Number(form.ancho),
    peso: Number(form.peso),
  },
};
```

### Cambiar la validación `isComplete()`:
```javascript
function isComplete(s: FormState) {
  return (
    s.nombrePyme.trim() !== "" &&
    s.origenComuna.trim() !== "" &&
    s.origenDireccion.trim() !== "" &&
    Number(s.largo) > 0 &&
    Number(s.alto) > 0 &&
    Number(s.ancho) > 0 &&
    Number(s.peso) > 0
  );
}
```

### En el preview (columna derecha):
- Donde dice "Envío para" con los datos del cliente, cambiar por un placeholder que muestre:
  - Icono de formulario + texto "Tu cliente completará sus datos aquí"
  - Subtexto: "Nombre, dirección y comuna de destino"

### La URL del webhook NO cambia:
```
https://mochidrop-n8n.utdxt3.easypanel.host/webhook/crear-envio
```

### Cambiar cómo se extrae el ID de la respuesta:
El webhook ahora devuelve `{ id: 123 }` (número directo, no string). Ajustar:
```javascript
const data = await res.json();
const id = data?.id;
if (!id) throw new Error("no_id");
```

---

## Archivo 2: `EnvioClient.tsx` (página del cliente)

Este archivo necesita el cambio más grande. Actualmente asume que las cotizaciones ya existen cuando el cliente abre el link. Ahora tiene dos fases:

### Fase 1 — Formulario de dirección (cuando NO hay cotizaciones)

Detectar la fase:
```typescript
const mostrarFormulario = !envio.cotizaciones || Object.keys(envio.cotizaciones).length === 0;
```

Cuando `mostrarFormulario` es true, mostrar:
- Header con logo y nombre de la PyME (ya están en Supabase)
- Formulario con campos:
  - Nombre completo * (text)
  - Teléfono (tel, opcional)
  - Comuna * (text)
  - Dirección * (text)
  - Número / Depto (text, opcional)
- Botón "Ver opciones de envío →"
- Al hacer click en el botón:
  1. Mostrar loading
  2. Llamar a `POST https://mochidrop-n8n.utdxt3.easypanel.host/webhook/cotizar-envio` con:
     ```json
     {
       "id": <id del envío desde URL>,
       "datos_destino": {
         "nombre": "...",
         "telefono": "...",
         "comuna": "...",
         "direccion": "...",
         "number": "..."
       }
     }
     ```
  3. Al recibir respuesta exitosa con `{ cotizaciones }`: actualizar el estado local del envío con las cotizaciones recibidas. Esto hará que `mostrarFormulario` se vuelva false y se muestre la fase 2.
  4. Si hay error: mostrar mensaje de error al usuario

### Fase 2 — Selección de courier (cuando SÍ hay cotizaciones)

Es el flujo actual, NO necesita cambios:
- Cards de courier con precio, tipo, tiempo
- Click en courier → redirige a `/confirmacion?id=X&courier=Y`

### Actualizar el tipo `EnvioType`:
```typescript
type EnvioType = {
  nombre_pyme: string;
  logo_pyme: string;
  datos_destino?: {  // ahora es opcional, puede no existir aún
    nombre: string;
    direccion: string;
    comuna: string;
    telefono?: string;
    number: string;
  };
  cotizaciones?: {  // ahora es opcional, puede no existir aún
    starken?: { price: number; tipo: string; tiempo: string };
    chilexpress?: { price: number; tipo: string; tiempo: string };
    blueexpress?: { price: number; tipo: string; tiempo: string };
  };
  estado?: string;
  courier?: string;
  tracking?: string;
  tracking_url?: string;
};
```

### Mantener sin cambios:
- La lógica de Supabase Realtime (channels)
- La redirección a `/final` si estado es "Creado "
- El diseño visual de las cards de courier
- El overlay de transición

### Diseño del formulario del cliente:
Usar el mismo estilo visual que ya tiene la app (Tailwind). El formulario debe verse bien en mobile (max-w-md, padding, rounded cards). Inspirarse en cómo se ve actualmente la sección de "Datos del destinatario" con el ícono de MapPin y el card de fondo gris.

---

## Archivo 3: `/confirmacion` — NO MODIFICAR

La página de confirmación lee `envio.datos_destino` y `envio.cotizaciones` de Supabase. Para cuando el cliente llega ahí, ambos campos ya existen (se guardaron en el paso de cotización). No necesita cambios.

---

## Estructura de la tabla `envios` en Supabase (NO modificar)

Columnas relevantes (tipo `jsonb` para los objetos):
- `id` — int, autoincrement, PK
- `nombre_pyme` — text
- `logo_pyme` — text (URL)
- `datos_destino` — jsonb (null inicialmente, se llena cuando el cliente completa su dirección)
- `datos_pymes` — jsonb `{ email, phone, street, number, comuna }`
- `datos_paquetes` — jsonb `{ largo, alto, ancho, peso }`
- `cotizaciones` — jsonb (null inicialmente, se llena al cotizar)
- `estado` — text (`"pendiente_destino"` → `"pendiente"` → `"Creado "`)
- `courier`, `tracking`, `tracking_url` — text

## Stack técnico
- Next.js 14+ con App Router (`"use client"` components)
- Supabase (DB + Storage + Realtime)
- TailwindCSS + inline styles (la app mezcla ambos, mantener el estilo existente)
- heroicons para íconos (`@heroicons/react/24/solid`)

## Instrucciones de ejecución

1. Modifica `CreateLinkClient.tsx` — quitar campos del cliente, renumerar secciones, ajustar payload y validación
2. Modifica `EnvioClient.tsx` — agregar fase de formulario antes de mostrar couriers
3. No tocar `/confirmacion`, `/pago`, `/final` ni ningún otro archivo
4. Testea que compile sin errores de TypeScript
