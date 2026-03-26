# Prompt Claude Code — Rediseño Selector de Envíos LinkDrop

## Contexto

Archivo a modificar: el componente `EnvioClient` que muestra las opciones de courier (Starken, Chilexpress, Blue Express) cuando un cliente recibe un link de envío de una PYME.

El diseño actual tiene problemas:
- Usa iniciales genéricas ("SK", "CX", "BX") como si fueran logos — estos son carriers nacionales conocidos, no startups
- Muestra badges de "Empresa verificada · +120k entregas" que son innecesarios — todo chileno conoce estas marcas
- El color de Starken está como rojo (#E31E24) cuando su marca es **verde** (#00A651)
- Tiene taglines redundantes como "Seguimiento en tiempo real", "Red de puntos más grande de Chile"

## Qué hacer

Rediseñar SOLO la sección de cards de courier (la parte dentro de `{/* Cards */}`) y el `COURIER_CONFIG`. No tocar el formulario, el header de la tienda, los skeletons, ni la lógica de Supabase/cotización.

### 1. Reemplazar `COURIER_CONFIG` completo con esto:

```typescript
const COURIER_CONFIG: Record<
  string,
  {
    color: string;
    colorLight: string;
    label: string;
  }
> = {
  starken: {
    color: "#00A651",      // Verde — color real de Starken
    colorLight: "#E8F8EE",
    label: "Starken",
  },
  chilexpress: {
    color: "#FFC600",      // Amarillo/dorado — color real de Chilexpress
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

### 2. Rediseñar las cards con estilo lista limpia (radio select)

El nuevo diseño es una lista unificada dentro de un solo contenedor con borde redondeado. Cada opción es una fila con:

- **Radio button** a la izquierda con el color de marca del courier cuando está seleccionado
- **Barra vertical de color** (4px ancho, color de marca) como indicador visual — opacidad 100% cuando seleccionado, 35% cuando no
- **Nombre del courier** en texto bold, sin iniciales, sin iconos de badge, sin "empresa verificada"
- Solo el courier más barato muestra un tag pequeño "Mejor precio" en verde
- **Tiempo de entrega** debajo del nombre (ej: "2-3 días") — sin taglines adicionales
- **Precio** alineado a la derecha en bold, en el color de marca cuando seleccionado, gris cuando no

### 3. Comportamiento

- Al hacer click en una fila, se selecciona ese courier (estado `selectedCourier`)
- La fila seleccionada cambia su background al `colorLight` del courier
- Ya NO hay botón "Seleccionar" por cada card — en su lugar, agregar UN solo botón al fondo de la lista: "Continuar con [nombre courier]" que ejecuta `elegir(selectedCourier)`
- El botón de continuar aparece solo cuando hay un courier seleccionado
- Mantener el fade-in escalonado que ya existe con `cardsVisible`

### 4. Estructura visual de referencia

```
┌──────────────────────────────────────────────┐
│ ○  ▎ Starken          Mejor precio   $3.620  │
│     ▎ 2-3 días                               │
├──────────────────────────────────────────────┤
│ ●  ▎ Chilexpress                     $5.670  │  ← seleccionado (fondo amarillo claro)
│     ▎ 1-2 días                               │
├──────────────────────────────────────────────┤
│ ○  ▎ Blue Express                    $8.970  │
│     ▎ 1-2 días                               │
└──────────────────────────────────────────────┘

        [ Continuar con Chilexpress → ]
```

### 5. Lo que NO debe cambiar

- El componente `StoreHeader` (logo + nombre pyme)
- El formulario de datos del cliente
- Los skeletons de carga
- La tarjeta de destino confirmado (con MapPinIcon y PencilSquareIcon)
- El título "Elige cómo deseas recibir tu pedido"
- El footer "Pago seguro con FLOW" y "Powered by LinkDrop"
- Toda la lógica de Supabase, realtime, cotización, routing
- El overlay de transición

### 6. Lo que SÍ se puede eliminar

- El import de `CheckBadgeIcon` (ya no se usa)
- Las propiedades `initials`, `deliveries`, `tagline`, `iconBg`, `iconText`, `bgAccent`, `textAccent`, `borderAccent` del COURIER_CONFIG
- Cualquier referencia a "Empresa verificada"
- Los badges de entregas (+120k, +500k, +80k)

### 7. Estilo

- Usar Tailwind CSS consistente con el resto del componente
- Los colores de marca usar clases `style={{ color: cfg.color }}` inline ya que son dinámicos
- Mantener `rounded-2xl` para el contenedor exterior
- Separadores entre filas con `border-t border-[#F0F0EB]`
- Tipografía: nombre courier `font-bold text-[15px]`, días `text-xs text-[#888]`, precio `font-bold text-base`

### 8. Botón continuar

Cuando `selectedCourier` no es null, mostrar debajo de la lista:

```tsx
<button
  onClick={() => elegir(selectedCourier)}
  disabled={transitioning}
  className="w-full bg-[#1A1A18] text-white font-bold py-4 rounded-xl text-[15px] mt-4 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
>
  Continuar con {COURIER_CONFIG[selectedCourier].label} →
</button>
```
