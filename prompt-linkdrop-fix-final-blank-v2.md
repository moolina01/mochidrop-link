# Prompt Claude Code — Fix pantalla blanca en /final después de pago Flow (LinkDrop)

## IMPORTANTE: Regla de seguridad

**NO modificar, renombrar ni eliminar ningún archivo que no se mencione aquí.** Se modifican solo 2 archivos.

## El bug

Después de pagar en Flow, el usuario llega a `/final?id=55&courier=blueexpress` y la página queda en blanco. Al recargar manualmente, aparece todo correctamente.

## Causa raíz

El archivo `/api/flow/return` usa `NextResponse.redirect()` para enviar al usuario a `/final`. Este redirect server-side puede causar que Next.js no hidrate correctamente los client components — `useSearchParams()` puede devolver `null` en el primer render, y el componente nunca ejecuta el fetch porque `if (!id) return;` lo bloquea.

Adicionalmente, en `FinalClient`:
- `envio.courier ?? courierParam` usa `??` que no atrapa strings vacíos `""`
- `if (!info) return <LoadingFallback />` es un spinner invisible sin salida
- `setTimeout(1500)` es un delay arbitrario que puede expirar antes de que los datos estén listos

## Archivo 1: `/api/flow/return/route.ts`

### Cambiar el redirect de `NextResponse.redirect()` a una página HTML que haga redirect del lado del cliente

Esto garantiza que el browser haga una navegación fresca y Next.js hidrate correctamente.

Buscar estas líneas (hay 2 redirects a `/final`):

```typescript
return NextResponse.redirect(`${baseUrl}/final?id=${envioId}&courier=${courier}`);
```

Reemplazar con:

```typescript
const finalUrl = `${baseUrl}/final?id=${envioId}&courier=${courier}`;
return new NextResponse(
  `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=${finalUrl}"><script>window.location.href="${finalUrl}"</script></head><body></body></html>`,
  {
    status: 200,
    headers: { "Content-Type": "text/html" },
  }
);
```

Hacer lo mismo para los redirects a `/pago` con error. Buscar cada `NextResponse.redirect(...)` en el archivo y reemplazarlo con el mismo patrón HTML pero con la URL correspondiente:

```typescript
// Para errores — mismo patrón:
const errorUrl = `${baseUrl}/pago?id=${envioId}&courier=${courier}&error=rejected`;
return new NextResponse(
  `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=${errorUrl}"><script>window.location.href="${errorUrl}"</script></head><body></body></html>`,
  {
    status: 200,
    headers: { "Content-Type": "text/html" },
  }
);
```

Para mantener el código limpio, crear un helper al inicio del archivo:

```typescript
function clientRedirect(url: string) {
  return new NextResponse(
    `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=${url}"><script>window.location.href="${url}"</script></head><body></body></html>`,
    {
      status: 200,
      headers: { "Content-Type": "text/html" },
    }
  );
}
```

Y reemplazar TODOS los `NextResponse.redirect(url)` en el archivo por `clientRedirect(url)`.

## Archivo 2: `FinalClient` (fixes defensivos)

Estos cambios son de protección adicional por si el redirect HTML tampoco resuelve en algún edge case.

### Fix 1: Cambiar `??` por `||` en courierKey

Buscar:
```typescript
const courierKey = (envio.courier ?? courierParam)?.toLowerCase() as "starken" | "chilexpress" | "blueexpress";
```

Reemplazar con:
```typescript
const courierKey = (envio.courier || courierParam || "").toLowerCase() as "starken" | "chilexpress" | "blueexpress";
```

### Fix 2: Reemplazar setTimeout con polling

Reemplazar el useEffect de carga inicial completo con:

```typescript
useEffect(() => {
  if (!id) return;

  let pollInterval: ReturnType<typeof setInterval> | null = null;
  let mounted = true;

  async function fetchEnvio() {
    const { data } = await supabase
      .from("envios")
      .select("*")
      .eq("id", Number(id))
      .single();

    if (!mounted || !data) return;

    setEnvio(data);
    setLoading(false);

    const key = (data.courier || courierParam || "").toLowerCase() as "starken" | "chilexpress" | "blueexpress";
    const cotizacion = key ? data.cotizaciones?.[key] : null;

    if (cotizacion) {
      setGenerating(false);
      if (pollInterval) clearInterval(pollInterval);
    }
  }

  fetchEnvio();
  pollInterval = setInterval(fetchEnvio, 2000);

  const maxTimeout = setTimeout(() => {
    if (mounted) {
      setGenerating(false);
      setLoading(false);
      if (pollInterval) clearInterval(pollInterval);
    }
  }, 30000);

  return () => {
    mounted = false;
    if (pollInterval) clearInterval(pollInterval);
    clearTimeout(maxTimeout);
  };
}, [id, courierParam]);
```

### Fix 3: Realtime también detiene generating

Reemplazar el useEffect de realtime con:

```typescript
useEffect(() => {
  if (!id) return;

  const channel = supabase
    .channel("envios-final-updates")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "envios",
        filter: `id=eq.${id}`,
      },
      (payload) => {
        const newData = payload.new as EnvioType;
        setEnvio(newData);

        const key = (newData.courier || courierParam || "").toLowerCase() as "starken" | "chilexpress" | "blueexpress";
        if (key && newData.cotizaciones?.[key]) {
          setGenerating(false);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [id, courierParam]);
```

### Fix 4: Fallback útil cuando no hay info

Buscar:
```typescript
if (!info) return <LoadingFallback />;
```

Reemplazar con:
```typescript
if (!info) {
  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <StoreHeader nombre={envio.nombre_pyme} logo={envio.logo_pyme} />
      <div className="max-w-md mx-auto px-4 py-10 text-center">
        <div className="w-16 h-16 rounded-full bg-[#E8553D]/10 flex items-center justify-center mx-auto mb-4">
          <div className="animate-spin h-8 w-8 border-[3px] border-[#E8E8E3] border-t-[#E8553D] rounded-full" />
        </div>
        <p className="text-[#1A1A18] font-bold text-lg">Procesando tu envío…</p>
        <p className="text-[#9C9C95] text-sm mt-2">
          Estamos generando tu guía de despacho. Esto puede tomar unos segundos.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 text-[#E8553D] text-sm font-semibold underline underline-offset-2"
        >
          Recargar página
        </button>
      </div>
    </div>
  );
}
```

## Lo que NO se toca

- `/api/flow/create-order` — no se toca
- `/api/flow/confirmation` — no se toca
- `buildFlowFormData` utility — no se toca
- Página `/envio` — no se toca
- Página `/confirmacion` — no se toca
- Supabase config — no se toca
- `StoreHeader`, `copyLink`, `fallbackCopy` en FinalClient — no se tocan
- La UI final del componente (success banner, cards, tracking) — no se toca

## Resumen

| Archivo | Cambio | Qué resuelve |
|---------|--------|-------------|
| `/api/flow/return` | `NextResponse.redirect()` → HTML con `window.location.href` | Next.js hidrata correctamente después del redirect de Flow |
| `FinalClient` | `??` → `\|\|` en courierKey | String vacío no rompe el lookup |
| `FinalClient` | setTimeout → polling 2s | Espera datos reales en vez de delay arbitrario |
| `FinalClient` | Realtime detiene generating | Update en vivo resuelve la espera |
| `FinalClient` | Fallback de `!info` con UI | Nunca más pantalla blanca sin contexto |
