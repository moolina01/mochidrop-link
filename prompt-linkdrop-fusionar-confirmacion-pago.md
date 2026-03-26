# Prompt Claude Code — Fusionar Confirmación + Pago en una sola página (LinkDrop)

## IMPORTANTE: Regla de seguridad

**NO modificar, renombrar ni eliminar ningún archivo que no se mencione explícitamente aquí.** No tocar APIs, utilidades, tipos globales, configuración de Supabase, ni ningún otro componente. Los únicos archivos que se modifican son los dos indicados abajo. Si algo no está claro, NO asumas — déjalo como está.

## Contexto

Actualmente el flujo tiene 3 pasos separados:
1. `/envio` → usuario elige courier
2. `/confirmacion` → usuario revisa datos (botón lleva a `/pago`)
3. `/pago` → usuario pone email y paga (llama a `/api/flow/create-order`)

El paso 2 y 3 son casi idénticos visualmente. Vamos a fusionarlos: la página de confirmación ahora incluye el campo de email y el botón de pago directo. La página de `/pago` se simplifica a solo manejar el redirect de vuelta por errores de Flow.

## Archivo 1: Página de confirmación (modificar)

### Agregar estos estados nuevos (junto a los estados existentes):

```typescript
const [email, setEmail] = useState("");
const [paying, setPaying] = useState(false);
const [payError, setPayError] = useState<string | null>(null);
```

### Agregar import de `CreditCardIcon`:

```typescript
import { MapPinIcon, ClockIcon, LockClosedIcon, ShieldCheckIcon, CreditCardIcon } from "@heroicons/react/24/solid";
```

### Leer el query param `error` para manejar rechazos de Flow:

```typescript
const error = searchParams.get("error");

// Dentro del useEffect, después de setLoading(false):
if (error === "rejected") {
  setPayError("El pago fue rechazado. Intenta de nuevo.");
}
```

### Reemplazar la función `confirmarEnvio` con `handlePagar`:

Eliminar completamente la función `confirmarEnvio` que hacía `router.push('/pago')`. Reemplazar con:

```typescript
async function handlePagar() {
  if (!email.trim()) {
    setPayError("Ingresa tu email para continuar.");
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setPayError("Ingresa un email válido.");
    return;
  }

  setPaying(true);
  setPayError(null);

  try {
    const res = await fetch("/api/flow/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        envioId: id,
        amount: info!.price,
        email: email.trim(),
        courier,
      }),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      setPayError(data.error ?? "Error al crear la orden de pago.");
      setPaying(false);
      return;
    }

    window.location.href = `${data.url}?token=${data.token}`;
  } catch {
    setPayError("Error de conexión. Intenta de nuevo.");
    setPaying(false);
  }
}
```

### Agregar el campo de email en el JSX

Después de la card de resumen (courier + destinatario) y ANTES del botón de pago, agregar:

```tsx
{/* Email para comprobante */}
<div className="bg-white rounded-2xl border border-[#E8E8E3] shadow-sm px-5 py-4">
  <label className="block text-xs font-semibold text-[#9C9C95] uppercase tracking-wider mb-2">
    Tu email <span className="text-[#E8553D]">*</span>
  </label>
  <input
    type="email"
    value={email}
    onChange={(e) => { setEmail(e.target.value); setPayError(null); }}
    placeholder="nombre@ejemplo.com"
    className="w-full rounded-xl border border-[#E8E8E3] px-4 py-3 text-sm text-[#1A1A18] bg-[#FAFAF7] placeholder:text-[#9C9C95] focus:outline-none focus:border-[#E8553D] focus:ring-2 focus:ring-[#E8553D]/10 transition-all"
  />
  <p className="text-[11px] text-[#9C9C95] mt-1.5">Para enviarte el comprobante de pago</p>
</div>

{/* Error de pago */}
{payError && (
  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center font-medium">
    {payError}
  </p>
)}
```

### Modificar el botón

Cambiar el botón actual que decía "Pagar $X →" (y llamaba a `confirmarEnvio`):

```tsx
<button
  onClick={handlePagar}
  disabled={paying}
  className="w-full bg-[#E8553D] text-white font-bold py-4 rounded-xl text-base transition-all shadow-[0_4px_16px_rgba(232,85,61,0.35)] hover:shadow-[0_6px_20px_rgba(232,85,61,0.45)] hover:-translate-y-0.5 active:translate-y-0 disabled:bg-[#D1D1CC] disabled:shadow-none disabled:translate-y-0 flex items-center justify-center gap-2"
>
  {paying ? (
    <>
      <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
      Procesando pago…
    </>
  ) : (
    <>
      <CreditCardIcon className="w-5 h-5" />
      {`Pagar $${info.price.toLocaleString("es-CL")} con tarjeta →`}
    </>
  )}
</button>
```

### Cambiar el subtítulo del header

En el `<p>` debajo del nombre de la tienda, cambiar "Confirma tu envío" por "Confirma y paga tu envío".

## Archivo 2: Página de pago `/pago` (simplificar)

La página de `/pago` YA NO necesita mostrar UI de checkout. Su único rol ahora es:

1. Si Flow redirige de vuelta con `?error=rejected`, redirigir a la confirmación con el error
2. Si el envío ya fue pagado, redirigir a `/final`

Simplificar `PagoClient` a:

```typescript
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";

function LoadingFallback() {
  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center">
      <div className="animate-spin h-10 w-10 border-4 border-[#E8E8E3] border-t-[#E8553D] rounded-full" />
    </div>
  );
}

export default function PagoClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const id      = searchParams.get("id");
  const courier = searchParams.get("courier");
  const error   = searchParams.get("error");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function check() {
      const { data } = await supabase
        .from("envios")
        .select("estado, pago_status")
        .eq("id", Number(id))
        .single();

      if (data?.estado === "Creado " || data?.pago_status === "pagado") {
        router.push(`/final?id=${id}`);
        return;
      }

      // Si hay error de pago rechazado, volver a confirmación con el error
      if (error === "rejected") {
        router.push(`/confirmacion?id=${id}&courier=${courier}&error=rejected`);
        return;
      }

      // Si no hay error y no está pagado, volver a confirmación
      router.push(`/confirmacion?id=${id}&courier=${courier}`);
    }

    check();
  }, [id, courier, error, router]);

  // Siempre muestra loading porque esta página solo redirige
  return <LoadingFallback />;
}
```

## Lo que NO se toca

- `/api/flow/create-order` — no se modifica, se llama exactamente igual
- `/api/cotizar-envio` — no se toca
- La página de `/envio` — no se toca
- La página de `/final` — no se toca
- Supabase config, tipos globales, utils — no se toca
- El componente `StoreHeader` dentro de confirmación — no se toca
- El formulario de datos del cliente en `/envio` — no se toca
- Los skeletons de carga — no se tocan
- La tarjeta de destino confirmado — no se toca
- La lógica de realtime de Supabase — no se toca

## Resumen de cambios

| Archivo | Acción |
|---------|--------|
| Confirmación (`ConfirmacionClient`) | Agregar: estados email/paying/payError, función handlePagar, campo de email, botón con CreditCardIcon, lectura de ?error=rejected. Eliminar: función confirmarEnvio |
| Pago (`PagoClient`) | Simplificar a: solo redirect logic (a /final si pagado, a /confirmacion si error o acceso directo). Sin UI de checkout |

Ningún otro archivo se modifica.
