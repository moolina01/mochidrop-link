# Prompt para Claude Code — Integración de pagos con Flow.cl en LinkDrop

## Contexto

LinkDrop es una plataforma Next.js (App Router) donde PyMEs generan links de envío. El cliente abre el link, completa su dirección, elige un courier con precio real, y paga. Actualmente la página `/pago` muestra datos bancarios para transferencia manual. Necesito reemplazar eso con pago con tarjeta vía **Flow.cl** (pasarela de pagos chilena).

**Stack:** Next.js 14+ (App Router), Supabase, TailwindCSS, n8n para webhooks.

## Credenciales de Flow (SANDBOX)

```
API Key: 365FD1E5-5C45-4228-9E4C-5982EL53F56A
Secret Key: 9e198daa229168bce89ea69b339fa42b3b8a24a7
Base URL: https://sandbox.flow.cl/api
```

**IMPORTANTE:** Estas credenciales son de sandbox (pruebas). Guardarlas como variables de entorno:
```env
FLOW_API_KEY=68DC44F6-EB1E-4141-9513-3E1L7D02BB00
FLOW_SECRET_KEY=a9b7a6d3d6f01ca860baf83fd11bb5eed4a6df04
FLOW_API_URL=https://sandbox.flow.cl/api
NEXT_PUBLIC_BASE_URL=https://www.linkdrop.cl
```

## Cómo funciona Flow.cl

El flujo de pago con Flow es:

1. **Comercio crea orden** → `POST /payment/create` con los datos del pago + firma HMAC-SHA256
2. **Flow devuelve** → `{ url, token, flowOrder }` 
3. **Comercio redirige al cliente** → `url + "?token=" + token` (checkout de Flow)
4. **Cliente paga** en el checkout de Flow (tarjeta, débito, etc.)
5. **Flow llama al callback** → POST a `urlConfirmation` con `{ token }` (server-to-server)
6. **Flow redirige al cliente** → a `urlReturn` con `{ token }` (browser redirect)

### Firma de parámetros (HMAC-SHA256)

Todos los requests a Flow deben ir firmados. La firma se calcula así:

```javascript
const { createHmac } = require("node:crypto");

const secretKey = process.env.FLOW_SECRET_KEY;
const params = { apiKey: "...", commerceOrder: "123", ... };

// 1. Ordenar las keys alfabéticamente
const keys = Object.keys(params);
keys.sort();

// 2. Concatenar key+value sin separadores
let toSign = "";
for (const key of keys) {
  toSign += key + params[key];
}

// 3. Firmar con HMAC-SHA256
const signature = createHmac("sha256", secretKey).update(toSign).digest("hex");

// 4. Agregar la firma como parámetro "s"
params.s = signature;
```

### Endpoint de creación de orden

```
POST https://sandbox.flow.cl/api/payment/create
Content-Type: application/x-www-form-urlencoded
```

Parámetros requeridos:
- `apiKey` — API key del comercio
- `commerceOrder` — ID único de la orden (usar el ID del envío)
- `subject` — Descripción ("Envío LinkDrop #123")
- `amount` — Monto en CLP (integer, mínimo 350)
- `email` — Email del pagador
- `urlConfirmation` — URL callback server-to-server donde Flow confirma el pago
- `urlReturn` — URL donde Flow redirige al cliente después de pagar
- `s` — Firma HMAC-SHA256

**CRÍTICO:** El Content-Type es `application/x-www-form-urlencoded`, NO JSON. Los parámetros se envían como form data.

### Respuesta de Flow:
```json
{
  "url": "https://sandbox.flow.cl/app/web/pay.php",
  "token": "33373581FC32576FAF33C46FC6454B1FFEBD7E1H",
  "flowOrder": 8765456
}
```

Redirigir al cliente a: `url + "?token=" + token`

### Verificar estado de pago

```
GET https://sandbox.flow.cl/api/payment/getStatus
Parámetros: apiKey, token, s (firma)
```

Respuesta incluye `status`: 1 = pendiente, 2 = pagada, 3 = rechazada, 4 = anulada.

---

## Qué crear/modificar

### 1. API Route: `app/api/flow/create-order/route.ts` (NUEVO)

Esta API Route crea la orden de pago en Flow desde el servidor (para proteger el secretKey).

```typescript
// Recibe: { envioId, amount, email, courier }
// 1. Construir parámetros de Flow
// 2. Firmar con HMAC-SHA256
// 3. POST a Flow /payment/create (application/x-www-form-urlencoded)
// 4. Devolver { url, token, flowOrder } al frontend
```

**Parámetros de la orden:**
- `apiKey`: de env
- `commerceOrder`: `"LINKDROP-" + envioId` (debe ser único)
- `subject`: `"Envío courier - LinkDrop"`
- `amount`: el precio del courier seleccionado (integer)
- `email`: email del cliente (pedir en el formulario o usar un email genérico)
- `urlConfirmation`: `${NEXT_PUBLIC_BASE_URL}/api/flow/confirmation`
- `urlReturn`: `${NEXT_PUBLIC_BASE_URL}/api/flow/return?envioId=${envioId}&courier=${courier}`
- `paymentMethod`: 9 (todos los medios de pago)

### 2. API Route: `app/api/flow/confirmation/route.ts` (NUEVO)

Callback server-to-server de Flow. Flow envía POST con `token`.

```typescript
// 1. Recibir token del body (application/x-www-form-urlencoded)
// 2. Llamar a Flow GET /payment/getStatus con el token para verificar
// 3. Si status === 2 (pagada):
//    a. Extraer commerceOrder para obtener el envioId
//    b. Actualizar Supabase: estado del envío a "pagado"
//    c. Llamar al webhook de n8n confirmar-envio con { id, courier }
//       POST https://mochidrop-n8n.utdxt3.easypanel.host/webhook/confirmar-envio
//       Body: { id: envioId, courier: courierName }
// 4. Responder con status 200 (OBLIGATORIO, Flow requiere respuesta 200 en menos de 15 segundos)
```

**IMPORTANTE:** Este endpoint debe poder recibir `application/x-www-form-urlencoded`. Usar `request.formData()` o parsear el body manualmente.

**IMPORTANTE:** Guardar el `flowOrder` y `token` en la tabla envios para referencia futura.

Agregar columnas a envios (SQL para ejecutar manualmente):
```sql
ALTER TABLE envios ADD COLUMN IF NOT EXISTS flow_token TEXT;
ALTER TABLE envios ADD COLUMN IF NOT EXISTS flow_order TEXT;
ALTER TABLE envios ADD COLUMN IF NOT EXISTS pago_status TEXT DEFAULT 'pendiente';
```

### 3. API Route: `app/api/flow/return/route.ts` (NUEVO)

URL de retorno donde Flow redirige al cliente después de pagar.

```typescript
// 1. Recibir token del body/query (Flow envía POST con token)
// 2. Verificar estado del pago con Flow GET /payment/getStatus
// 3. Redirigir al cliente:
//    - Si pagado: redirect a /final?id=${envioId}&courier=${courier}
//    - Si rechazado/pendiente: redirect a /pago?id=${envioId}&courier=${courier}&error=rejected
```

**NOTA:** Flow envía el return como POST con `application/x-www-form-urlencoded`. El envioId y courier se pasan como query params en la urlReturn.

### 4. Modificar: `app/pago/PagoClient.tsx`

Reemplazar completamente la UI de transferencia bancaria por un flujo de pago con Flow.

**Nuevo flujo:**
1. Cargar datos del envío de Supabase (igual que ahora)
2. Mostrar resumen: courier seleccionado, precio, datos del destinatario
3. Pedir email del cliente (campo input, requerido para Flow)
4. Botón "Pagar $XX.XXX con tarjeta →"
5. Al presionar:
   a. Mostrar loading
   b. Llamar a `POST /api/flow/create-order` con `{ envioId: id, amount: precio, email, courier }`
   c. Recibir `{ url, token }`
   d. Redirigir al cliente a `url + "?token=" + token` (checkout de Flow)
6. El cliente paga en Flow
7. Flow redirige al cliente a `/api/flow/return` → que redirige a `/final`

**UI del botón de pago:**
- Color: #E8553D (rojo LinkDrop) o azul si prefieres diferenciarlo
- Grande, prominente, rounded-xl
- Mostrar el monto en el botón: "Pagar $3.620 →"
- Loading state: "Procesando pago..." con spinner
- Indicadores de confianza: íconos de tarjeta + "Pago seguro con Flow" + ícono de candado

**Mantener:**
- Header con logo de la PyME
- Resumen del envío (courier, precio, destinatario)
- Verificación de que el envío no esté ya pagado (redirect a /final)

### 5. NO MODIFICAR:
- `EnvioClient.tsx`
- `ConfirmacionClient.tsx` — solo redirige a `/pago`, no necesita cambios
- `FinalClient.tsx`
- Workflows de n8n
- Tabla envios (excepto agregar las columnas de Flow vía SQL manual)

---

## Utilidades compartidas

Crear un archivo de utilidad para la firma de Flow:

### `utils/flow.ts` (NUEVO)

```typescript
import { createHmac } from "crypto";

export function signFlowParams(params: Record<string, string | number>): string {
  const keys = Object.keys(params);
  keys.sort();
  let toSign = "";
  for (const key of keys) {
    toSign += key + params[key];
  }
  return createHmac("sha256", process.env.FLOW_SECRET_KEY!).update(toSign).digest("hex");
}

export function buildFlowFormData(params: Record<string, string | number>): URLSearchParams {
  const signed = { ...params, s: signFlowParams(params) };
  const formData = new URLSearchParams();
  for (const [key, value] of Object.entries(signed)) {
    formData.append(key, String(value));
  }
  return formData;
}
```

---

## Tarjeta de pruebas Flow Sandbox

Para probar pagos en sandbox con Webpay:
- Número: 4051 8856 0044 6623
- CVV: 123
- Expiration: cualquier fecha futura
- Al pagar, aceptar en el simulador

---

## Orden de ejecución

1. Crear `utils/flow.ts` con funciones de firma
2. Crear `app/api/flow/create-order/route.ts`
3. Crear `app/api/flow/confirmation/route.ts`
4. Crear `app/api/flow/return/route.ts`
5. Modificar `app/pago/PagoClient.tsx` — reemplazar transferencia por Flow
6. Agregar variables de entorno al `.env.local`
7. Mostrar SQL para ejecutar manualmente en Supabase
8. Verificar que compile sin errores TypeScript
