# Prompt Claude Code — Fix pantalla blanca en /final (LinkDrop)

## IMPORTANTE: Regla de seguridad

**NO modificar, renombrar ni eliminar ningún archivo que no se mencione aquí.** Solo se modifica `FinalClient`.

## El bug

Después de que Flow redirige a `/final?id=55&courier=blueexpress`, la página se queda en blanco sin errores en consola. El usuario debe recargar manualmente para ver el contenido.

## Causa raíz

Hay múltiples puntos donde el componente puede quedar atrapado mostrando nada:

### Problema 1: `courierKey` puede ser string vacío
```typescript
const courierKey = (envio.courier ?? courierParam)?.toLowerCase()
```
Si `envio.courier` es `""` (string vacío), el operador `??` NO lo atrapa (solo atrapa `null`/`undefined`). Resultado: `courierKey = ""`, `info = envio.cotizaciones[""]` = `undefined`, y la página retorna `<LoadingFallback />` para siempre.

### Problema 2: `setTimeout` de 1.5s es arbitrario
Si los datos no están listos cuando el timeout expira, la página pasa de la animación a intentar renderizar con datos incompletos.

### Problema 3: `if (!info) return <LoadingFallback />` es una trampa
Retorna un spinner sin contexto ni salida. Si `info` nunca se resuelve, el usuario ve blanco para siempre.

## Fix

### Fix 1: Cambiar `??` por `||` para courierKey

Buscar esta línea:
```typescript
const courierKey = (envio.courier ?? courierParam)?.toLowerCase() as "starken" | "chilexpress" | "blueexpress";
```

Reemplazar con:
```typescript
const courierKey = (envio.courier || courierParam || "")?.toLowerCase() as "starken" | "chilexpress" | "blueexpress";
```

El operador `||` atrapa tanto `null`/`undefined` como `""` (string vacío).

### Fix 2: Reemplazar setTimeout con polling inteligente

Eliminar el `setTimeout(() => setGenerating(false), 1500)` del useEffect de carga inicial.

Reemplazar el useEffect completo de carga inicial con:

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

    // Verificar si los datos están completos
    const key = (data.courier || courierParam || "").toLowerCase() as "starken" | "chilexpress" | "blueexpress";
    const cotizacion = key ? data.cotizaciones?.[key] : null;

    if (cotizacion) {
      // Datos listos — mostrar la UI final
      setGenerating(false);
      if (pollInterval) clearInterval(pollInterval);
    }
  }

  // Primera carga
  fetchEnvio();

  // Polling cada 2s hasta que los datos estén completos
  pollInterval = setInterval(fetchEnvio, 2000);

  // Safety net: después de 30s, dejar de animar pase lo que pase
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

### Fix 3: El realtime también debe detener generating

En el useEffect de realtime, agregar la misma lógica:

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

### Fix 4: Reemplazar el fallback de `!info` con UI útil

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

- `StoreHeader` — queda igual
- `copyLink` / `fallbackCopy` — quedan igual
- La UI final (success banner, card courier, tracking, destinatario) — queda igual
- La animación de "Procesando tu envío" — queda igual
- Nada fuera de este archivo
- No tocar APIs, Supabase config, ni otros componentes

## Resumen

| Cambio | Qué resuelve |
|--------|-------------|
| `??` → `\|\|` en courierKey | String vacío `""` ya no rompe el lookup |
| setTimeout → polling 2s | No depende de un delay arbitrario |
| Realtime detiene generating | Update en vivo también resuelve la espera |
| Fallback de `!info` con UI | Nunca más pantalla blanca sin contexto |
| Safety net 30s | Worst case: para de animar y muestra botón de recarga |
