# Prompt Claude Code — Fix polling no espera tracking_url en /final (LinkDrop)

## IMPORTANTE: Regla de seguridad

**NO modificar, renombrar ni eliminar ningún archivo que no se mencione aquí.** Solo se modifica `FinalClient`.

## El problema

Después del fix anterior, la página ya no queda en blanco. Pero la sección de tracking se queda en el skeleton de "Generando guía de despacho…" y el usuario debe recargar para ver el tracking URL. Esto pasa porque el polling se detiene cuando encuentra `cotizaciones[key]` (que ya existía antes del pago), pero `tracking_url` llega después — cuando N8N termina de generar la guía.

## Fix

El polling debe seguir corriendo hasta que `tracking_url` esté presente en los datos, no solo hasta que las cotizaciones existan.

### Cambio 1: En el useEffect de polling

Buscar la condición que detiene el polling. Actualmente dice algo como:

```typescript
if (cotizacion) {
  setGenerating(false);
  if (pollInterval) clearInterval(pollInterval);
}
```

Reemplazar con:

```typescript
if (cotizacion) {
  // Datos suficientes para mostrar la UI principal
  setGenerating(false);
}

// Solo dejar de hacer polling cuando tracking_url esté disponible
if (data.tracking_url) {
  if (pollInterval) clearInterval(pollInterval);
}
```

Esto hace que:
- La animación de "Procesando" se detiene apenas hay cotización (UI principal visible)
- Pero el polling **sigue corriendo** hasta que `tracking_url` llegue (tracking se actualiza en vivo)

### Cambio 2: En el useEffect de realtime

En el handler del realtime, agregar lo mismo. El realtime ya actualiza `envio` con `setEnvio(newData)`, lo cual hace que el componente se re-renderice y muestre el tracking cuando llega. No necesita cambios adicionales — solo asegurarse de que el `setEnvio(newData)` siga ahí (ya debería estar).

### Cambio 3: Safety net del timeout de 30s

El timeout de 30 segundos que detiene todo debe también dejar de hacer polling, pero eso ya está bien. No cambiar.

## Lo que NO se toca

- Todo lo demás en `FinalClient` — no se toca
- Ningún otro archivo

## Resumen

Un solo cambio lógico: separar "dejar de animar" de "dejar de hacer polling". La animación se detiene cuando hay cotización. El polling se detiene cuando hay `tracking_url`.
