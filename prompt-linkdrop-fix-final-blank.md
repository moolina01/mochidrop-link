# Prompt Claude Code — Fix página /final se queda en blanco después del redirect de Flow

## IMPORTANTE: Regla de seguridad

**NO modificar, renombrar ni eliminar ningún archivo que no se mencione explícitamente aquí.** Solo se modifica `FinalClient`. No tocar APIs, Supabase config, ni otros componentes.

## El problema

Cuando Flow (pasarela de pago) redirige al usuario de vuelta a `/final?id=X&courier=Y`, la página se queda en blanco. El usuario tiene que recargar manualmente para ver los datos. Esto pasa porque:

1. `setTimeout(() => setGenerating(false), 1500)` es un delay arbitrario. Si N8N aún no terminó de procesar cuando el timeout expira, la página intenta renderizar con datos incompletos.
2. Si `envio.cotizaciones[courierKey]` no tiene datos aún (N8N no actualizó), `info` es `null` y la página retorna `<LoadingFallback />` para siempre — pantalla en blanco.
3. El realtime solo escucha `UPDATE`. Si el row ya existía antes y no hay un update posterior, nunca dispara.

## La solución

Reemplazar el `setTimeout` arbitrario con un sistema de **polling + realtime** que espere hasta que los datos estén realmente listos.

### 1. Cambiar la lógica del useEffect de carga inicial

Reemplazar el useEffect actual de carga:

```typescript
useEffect(() => {
  if (!id) return;

  let pollInterval: NodeJS.Timeout | null = null;
  let mounted = true;

  async function fetchEnvio() {
    const { data } = await supabase
      .from("envios")
      .select("*")
      .eq("id", Number(id))
      .single();

    if (!mounted) return;

    if (data) {
      setEnvio(data);

      // Verificar si los datos están completos para mostrar la UI
      const key = (data.courier ?? courierParam)?.toLowerCase() as "starken" | "chilexpress" | "blueexpress";
      const cotizacion = key ? data.cotizaciones?.[key] : null;

      if (cotizacion) {
        // Datos completos — podemos mostrar la UI
        setGenerating(false);
        setLoading(false);
        if (pollInterval) clearInterval(pollInterval);
        return;
      }
    }

    // Si es la primera carga, dejar de mostrar el loading general
    // pero mantener el estado "generating" (animación de procesando)
    setLoading(false);
  }

  // Primera carga
  fetchEnvio();

  // Polling cada 2 segundos hasta que los datos estén completos
  pollInterval = setInterval(fetchEnvio, 2000);

  // Timeout máximo de 30 segundos — si después de eso no hay datos, 
  // dejar de animar y mostrar lo que haya
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

### 2. Actualizar el useEffect de realtime

El realtime actual está bien, pero agregar que cuando reciba un update, también detenga el generating:

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

        // Si el update trae datos completos, dejar de animar
        const key = (newData.courier ?? courierParam)?.toLowerCase() as "starken" | "chilexpress" | "blueexpress";
        const cotizacion = key ? newData.cotizaciones?.[key] : null;
        if (cotizacion) {
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

### 3. Mejorar el fallback cuando no hay `info`

Actualmente si `info` es null retorna `<LoadingFallback />` que es una pantalla en blanco con spinner. Cambiarlo a un mensaje útil:

Reemplazar:
```typescript
if (!info) return <LoadingFallback />;
```

Con:
```typescript
if (!info) {
  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <StoreHeader nombre={envio.nombre_pyme} logo={envio.logo_pyme} />
      <div className="max-w-md mx-auto px-4 py-10 text-center">
        <div className="w-16 h-16 rounded-full bg-[#E8553D]/10 flex items-center justify-center mx-auto mb-4">
          <div className="animate-spin h-8 w-8 border-3 border-[#E8E8E3] border-t-[#E8553D] rounded-full" />
        </div>
        <p className="text-[#1A1A18] font-bold text-lg">Procesando tu envío…</p>
        <p className="text-[#9C9C95] text-sm mt-2">Estamos generando tu guía de despacho. Esto puede tomar unos segundos.</p>
        <p className="text-[#9C9C95] text-xs mt-6">Si la página no se actualiza, <button onClick={() => window.location.reload()} className="text-[#E8553D] underline">recarga aquí</button>.</p>
      </div>
    </div>
  );
}
```

### 4. Eliminar el `setTimeout` viejo

Eliminar esta línea del useEffect original:
```typescript
setTimeout(() => setGenerating(false), 1500);
```

Ya no se usa — el polling y realtime se encargan de determinar cuándo los datos están listos.

## Lo que NO se toca

- El componente `StoreHeader` — queda igual
- La función `copyLink` y `fallbackCopy` — quedan igual
- La UI final (success banner, card courier, tracking, destinatario) — queda igual
- La animación de "Procesando tu envío" — queda igual pero ahora se controla por datos reales, no por timeout
- El realtime channel — se mantiene, solo se agrega lógica para detener generating
- Nada fuera de este archivo

## Resumen del cambio

| Antes | Después |
|-------|---------|
| `setTimeout(1500ms)` para dejar de animar | Polling cada 2s hasta que `cotizaciones[courier]` exista |
| Si `info` es null → spinner infinito en blanco | Si `info` es null → mensaje claro + botón de recarga |
| Realtime solo actualiza datos | Realtime también detiene la animación de carga |
| Sin timeout máximo | Timeout de 30s como safety net |
