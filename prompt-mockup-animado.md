# Prompt para Claude Code — Mockup animado del teléfono en el Hero
## MochiDrop Link Landing Page

---

## QUÉ NECESITO

Transformar el componente PhoneMockup actual (que es estático) en una versión animada que simule el flujo real del producto en loop. El visitante debe ver el teléfono "funcionando" mientras lee el headline.

---

## FLUJO DE LA ANIMACIÓN

La animación es un loop infinito que simula lo que el cliente final ve cuando abre el link de MochiDrop. El ciclo completo dura aproximadamente 8-9 segundos y tiene estas fases:

### Fase 1 — Estado inicial (1.5s)
- Se muestra la pantalla con el header "Tu Tienda" y los datos del envío (nombre, dirección)
- Las 3 opciones de courier están visibles pero ninguna está seleccionada
- El botón "Pagar envío →" está en estado deshabilitado (gris o con opacidad baja)

### Fase 2 — Selección de courier (3s)
- Primero se destaca Starken (borde #E8553D, fondo #FFF0ED) durante 1 segundo
- Luego cambia a Chilexpress durante 0.8 segundos
- Finalmente se queda en Blue Express (como eligiendo el más barato)
- Cada cambio debe tener una transición suave (200ms)
- Al seleccionar Blue Express, el botón "Pagar envío →" se activa (fondo #E8553D, color blanco)

### Fase 3 — Pago (2s)
- El botón cambia a "Procesando..." con un color más tenue o un pequeño spinner/loading
- Después de 1.2 segundos, el botón cambia a "✓ Pagado" con fondo verde (#2D8A56)
- La transición del botón debe ser suave

### Fase 4 — Confirmación (2s)
- Toda la pantalla del teléfono hace una transición suave a una pantalla de confirmación
- La pantalla de confirmación muestra:
  - Un ícono de check grande (círculo verde con checkmark blanco, centrado)
  - Texto: "Envío confirmado" (font-weight 600, font-size 12px)
  - Texto secundario: "El tracking llegará a tu correo" (font-size 9px, color gris)
- Después de 2 segundos, vuelve al estado inicial (Fase 1) con un fade suave

### Loop
- El ciclo se repite infinitamente
- La transición entre Fase 4 → Fase 1 debe ser un fade out/in suave (300ms)

---

## ESPECIFICACIONES TÉCNICAS

### Animación
- Usar Framer Motion (AnimatePresence + motion.div) para las transiciones entre fases
- Usar useState + useEffect con setTimeout para controlar el flujo
- Cada fase tiene su duración controlada por un efecto
- Las transiciones entre couriers deben ser con animate={{ }} no con CSS transitions

### Estructura del componente
- Mantener el nombre `PhoneMockup`
- Mantener toda la estructura visual exterior (frame del teléfono, notch, sombras, decorative pills)
- Solo cambia el contenido INTERIOR de la pantalla (el div con fondo #FAFAF7)
- Agregar un estado `phase` que controle en qué fase está la animación
- Agregar un estado `selectedCourier` que controle cuál courier está seleccionado

### Datos de los couriers (mantener los existentes)
```javascript
const couriers = [
  { name: "Starken", price: "$3.490", days: "2-3 días" },
  { name: "Chilexpress", price: "$4.190", days: "1-2 días" },
  { name: "Blue Express", price: "$2.890", days: "3-4 días" },
];
```

### Pantalla de confirmación
```jsx
// Fase 4 — Pantalla de confirmación
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  style={{
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    padding: "40px 20px",
    textAlign: "center",
  }}
>
  {/* Círculo verde con check */}
  <div style={{
    width: 48,
    height: 48,
    borderRadius: "50%",
    background: "#2D8A56",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  }}>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  </div>
  <p style={{ fontSize: 12, fontWeight: 600, color: "#1A1A18", marginBottom: 6 }}>
    Envío confirmado
  </p>
  <p style={{ fontSize: 9, color: "#9C9C95" }}>
    El tracking llegará a tu correo
  </p>
</motion.div>
```

### Timing exacto del loop
```
0.0s - Fase 1: Estado inicial (nada seleccionado)
1.5s - Fase 2a: Se selecciona Starken
2.5s - Fase 2b: Cambia a Chilexpress
3.3s - Fase 2c: Se queda en Blue Express, botón se activa
4.5s - Fase 3a: Botón cambia a "Procesando..."
5.7s - Fase 3b: Botón cambia a "✓ Pagado" (verde)
6.5s - Fase 4: Pantalla de confirmación
8.5s - Vuelve a Fase 1 (fade)
```

### Estados del botón CTA
```javascript
// Sin selección
{ text: "Pagar envío →", bg: "#D1D1CC", color: "#fff", disabled: true }

// Con courier seleccionado
{ text: "Pagar envío →", bg: "#E8553D", color: "#fff", disabled: false }

// Procesando
{ text: "Procesando...", bg: "#B8B8B3", color: "#fff", disabled: true }

// Pagado
{ text: "✓ Pagado", bg: "#2D8A56", color: "#fff", disabled: true }
```

---

## NOTAS IMPORTANTES

- La animación debe ser SUTIL y fluida, no llamativa ni distractora. Es un detalle premium, no un GIF.
- No debe interferir con la lectura del headline. El usuario debe poder ignorarla si quiere.
- Las transiciones deben ser suaves (ease-out, 200-300ms). Nada brusco.
- La animación empieza con un delay de 1 segundo después del mount (para que el hero se cargue primero).
- En móvil la animación funciona igual (el mockup se muestra primero en mobile por el order-first).
- Usar `useRef` para los timeouts y limpiarlos en el cleanup del useEffect para evitar memory leaks.
- Mantener los DecoPill decorativos flotantes alrededor del teléfono.

---

## EJEMPLO DE ESTRUCTURA DEL ESTADO

```javascript
function PhoneMockup() {
  const [phase, setPhase] = useState("initial"); 
  // "initial" | "selecting" | "processing" | "paid" | "confirmed"
  const [selectedCourier, setSelectedCourier] = useState(-1); 
  // -1 = ninguno, 0 = Starken, 1 = Chilexpress, 2 = Blue Express
  const timeoutRef = useRef([]);

  useEffect(() => {
    // Iniciar el loop después de 1s de delay
    const startDelay = setTimeout(() => runAnimation(), 1000);
    return () => {
      clearTimeout(startDelay);
      timeoutRef.current.forEach(clearTimeout);
    };
  }, []);

  function runAnimation() {
    // Fase 2a: seleccionar Starken
    // Fase 2b: cambiar a Chilexpress
    // Fase 2c: quedarse en Blue Express
    // Fase 3: procesando → pagado
    // Fase 4: confirmación
    // Volver a Fase 1 y llamar runAnimation() de nuevo
  }

  return (
    // ... estructura del teléfono
    // Dentro de la pantalla: usar AnimatePresence para cambiar entre
    // la vista normal (couriers + botón) y la pantalla de confirmación
  );
}
```
