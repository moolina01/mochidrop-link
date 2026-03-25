Eres un experto en UX/UI para plataformas de delivery. Tu tarea es crear la vista de opciones de envío 
para [Mochibus/tu plataforma].

REQUISITOS CRÍTICOS:

1. **SKELETON LOADING (Carga visual)**
   - Mientras se cotiza, muestra 3-4 cards con skeleton loader (líneas grises animadas que parpadean)
   - Los skeletons deben tener la misma altura y estructura que las cards finales
   - Cuando todas las cotizaciones estén listas, reemplaza los skeletons con los datos reales
   - Evita ABSOLAMENTE mostrar precios uno a uno

2. **DISEÑO DE CARDS DE ENVÍO**
   Cada card debe incluir:
   - Logo/ícono de la empresa (con colores reales de marca)
   - Nombre de la empresa
   - Tiempo de entrega estimado (ej: "Entrega hoy, 14:00 - 16:30")
   - Precio destacado y grande
   - Garantía o promesa (ej: "Seguimiento en tiempo real", "Asegurado")
   - CTA: botón de selección

3. **COLORES Y BRANDING REALES** (Aumentar confianza)
   - ChileExpress: Amarillo (#FFD000) + negro
   - BlueExpress: Azul (#0052CC) + blanco
   - Starken: Rojo (#E31E24) + blanco
   - DHL: Amarillo (#FFCC00) + rojo
   - FedEx: Púrpura (#4D148C) + naranja
   - Shipit: Verde (#00B050)
   - Otros: usa sus colores corporativos reales

4. **ELEMENTOS DE CONFIANZA**
   - Pequeño ícono de "verificado" o "asegurado" en cada opción
   - Mostrar número de entregas realizadas (ej: "+50k entregas")
   - Rating o estrella si aplica
   - Poner en pequeño: "Empresa verificada" o "Socio oficial"

5. **COMPORTAMIENTO**
   - Estado 1: Mostrar skeletons mientras carga
   - Estado 2: Cuando todos los datos llegan, animar la aparición de las cards (fade-in suave)
   - Estado 3: Usuario selecciona → resaltar selección, deshabilitar otras opciones
   - Si hay error en una cotización, mostrar mensaje amigable (no mostrar error técnico)

6. **ESTRUCTURA TÉCNICA**
   - Usar React + TailwindCSS
   - Las cotizaciones deben llegar todas juntas (mejor con Promise.all() o esperar timeout)
   - Animación con Tailwind (transition-all, animate-pulse para skeleton)
   - Mobile-first, responsive

7. **COPY/TEXTOS**
   - Títulos cortos: "Elige cómo deseas recibir tu pedido"
   - Subtítulo: "Opciones verificadas y aseguradas"
   - CTA: "Seleccionar envío" o "Continuar con esta opción"

RESULTADO ESPERADO:
El usuario ve skeletons cargando → espera 2-3 segundos → aparecen todas las opciones a la vez con 
colores reales, logos, precios claros y elementos de confianza. Se siente profesional, rápido y seguro.