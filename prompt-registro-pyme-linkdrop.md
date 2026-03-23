# Prompt para Claude Code — Sistema de registro PyME + límite de 5 links gratis

## Contexto del proyecto

LinkDrop es una plataforma Next.js (App Router) donde PyMEs chilenas generan links de envío para sus clientes. Usa Supabase (DB + Auth + Storage + Realtime) y TailwindCSS + inline styles.

Actualmente cualquier persona puede generar links infinitos sin registro. Necesito agregar un sistema de registro simple con email y un límite de 5 links gratis por cuenta.

## Qué necesito

### 1. Registro/Login con Supabase Auth

**Flujo de registro (mínima fricción):**
- La PyME llega a `/crear-link`, llena el formulario normalmente (negocio + origen + paquete)
- Al presionar "Generar link de envío →", si **no está autenticada**, se muestra un modal/overlay pidiendo que se registre o inicie sesión
- El modal tiene dos modos: **Registro** (email + contraseña) y **Login** (email + contraseña), con toggle entre ambos
- Después de autenticarse exitosamente, el link se genera automáticamente (sin que tenga que volver a presionar el botón)
- Si **ya está autenticada**, el link se genera directamente sin mostrar el modal

**Implementación Auth:**
- Usar `supabase.auth.signUp()` para registro
- Usar `supabase.auth.signInWithPassword()` para login
- Usar `supabase.auth.getUser()` o `supabase.auth.onAuthStateChange()` para detectar si está autenticada
- El cliente Supabase ya existe en `@/utils/supabase` — usar ese mismo
- Guardar la sesión con el auth de Supabase (maneja cookies/localStorage automáticamente)

### 2. Tabla `pymes` en Supabase (crear con SQL)

Crear la tabla ejecutando este SQL en Supabase (incluir instrucción en el código o en un comentario):

```sql
CREATE TABLE pymes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  links_creados INT DEFAULT 0,
  limite_links INT DEFAULT 5,
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE pymes ENABLE ROW LEVEL SECURITY;

-- Policy: cada usuario solo ve su propia fila
CREATE POLICY "Users can view own pyme" ON pymes FOR SELECT USING (auth_id = auth.uid());
CREATE POLICY "Users can update own pyme" ON pymes FOR UPDATE USING (auth_id = auth.uid());
```

**Al registrarse**, crear automáticamente una fila en `pymes` con el `auth_id` del usuario recién creado. Esto se puede hacer desde el frontend justo después del `signUp()` exitoso, usando el service role o una función insert que el RLS permita:

```sql
-- Agregar policy de insert
CREATE POLICY "Users can insert own pyme" ON pymes FOR INSERT WITH CHECK (auth_id = auth.uid());
```

### 3. Lógica de límite de 5 links

**En `CreateLinkClient.tsx`, el flujo del botón "Generar link" debe ser:**

```
1. Validar formulario (isComplete) → si no completo, no avanzar
2. Verificar autenticación: supabase.auth.getUser()
   → Si NO autenticado: mostrar modal de registro/login → esperar auth → continuar
   → Si autenticado: continuar
3. Verificar límite: consultar tabla pymes WHERE auth_id = user.id
   → Si links_creados >= limite_links (5):
     Mostrar modal de "Límite alcanzado" con mensaje:
     "Has alcanzado tu límite de 5 links gratuitos. 
      Nos pondremos en contacto contigo pronto para darte acceso a más."
     Botón: "Entendido" (cierra el modal)
     NO generar el link
   → Si links_creados < limite_links: continuar
4. Generar el link (llamar al webhook, etc.)
5. Después de generar exitosamente: incrementar links_creados
   UPDATE pymes SET links_creados = links_creados + 1 WHERE auth_id = user.id
```

### 4. Vincular envíos con la PyME

**En la tabla `envios`**, agregar el `pyme_id` al crear el envío. Modificar el payload que se envía al webhook:

```javascript
const payload = {
  nombre_pyme: form.nombrePyme.trim(),
  logo_pyme: logoUrl,
  pyme_id: user.id,  // auth_id del usuario autenticado
  origen: { ... },
  paquete: { ... },
};
```

**NOTA:** Esto requiere que la tabla `envios` tenga una columna `pyme_id` (UUID, nullable). Incluir el SQL:
```sql
ALTER TABLE envios ADD COLUMN IF NOT EXISTS pyme_id UUID;
```

Y en el workflow de n8n `crear-envio`, el campo `pyme_id` se guardará automáticamente si se incluye en el payload (pero no es necesario modificar el workflow, solo asegurarse de que el nodo Supabase lo acepte — por ahora se puede omitir si complica, lo importante es el conteo en la tabla `pymes`).

---

## Archivos a modificar/crear

### Modificar: `CreateLinkClient.tsx`

Cambios principales:

1. **Agregar estado de autenticación:**
```typescript
const [user, setUser] = useState<any>(null);
const [authChecked, setAuthChecked] = useState(false);
const [showAuthModal, setShowAuthModal] = useState(false);
const [showLimitModal, setShowLimitModal] = useState(false);
```

2. **Verificar auth al cargar:**
```typescript
useEffect(() => {
  supabase.auth.getUser().then(({ data }) => {
    setUser(data.user);
    setAuthChecked(true);
  });
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user ?? null);
  });
  return () => subscription.unsubscribe();
}, []);
```

3. **Modificar `handleSubmit`:** Agregar la lógica de verificación de auth y límite ANTES de llamar al webhook.

4. **Agregar componente AuthModal:** Modal con form de email + contraseña, toggle entre registro y login, manejo de errores (email ya registrado, contraseña incorrecta, etc.).

5. **Agregar componente LimitModal:** Modal simple con mensaje de límite alcanzado.

6. **Mostrar estado de sesión:** En el navbar, si el usuario está autenticado, mostrar su email pequeño y un botón de cerrar sesión. Si no está autenticado, no mostrar nada (se pedirá auth al generar).

7. **Mostrar contador:** En algún lugar visible (cerca del botón de generar o en el header), mostrar "X de 5 links usados" cuando el usuario está autenticado.

### NO modificar:
- `EnvioClient.tsx` — la página del cliente no necesita auth
- `/confirmacion` — no necesita cambios
- `/pago` — no necesita cambios
- `/final` — no necesita cambios
- Workflows de n8n — no necesitan cambios

---

## Diseño de los modales

### AuthModal (registro/login)
- Overlay oscuro con blur (fondo semi-transparente)
- Card centrada, max-w-md, rounded-2xl, bg-white, shadow-xl
- Título: "Crea tu cuenta gratis" (registro) / "Inicia sesión" (login)
- Subtítulo: "Genera hasta 5 links de envío gratis" (registro) / "Accede a tu cuenta" (login)
- Campos: Email (type=email), Contraseña (type=password, mínimo 6 caracteres)
- Botón principal: estilo #E8553D (el rojo de LinkDrop), texto blanco, bold
- Toggle: "¿Ya tienes cuenta? Inicia sesión" / "¿No tienes cuenta? Regístrate" — texto clickeable, color gris
- Mostrar errores inline (rojo, debajo del formulario)
- Botón X para cerrar el modal (esquina superior derecha)
- Al registrarse exitosamente: crear fila en tabla `pymes`, cerrar modal, continuar con la generación del link
- **Supabase Auth por defecto envía email de confirmación.** Para evitar fricción, deshabilitar la confirmación de email o manejarla. Si está habilitada, mostrar mensaje "Revisa tu email para confirmar tu cuenta". PERO lo ideal es que en Supabase Dashboard → Auth → Settings → desactivar "Enable email confirmations" para que el registro sea instantáneo.

### LimitModal (límite alcanzado)
- Mismo estilo de overlay
- Card centrada con icono de candado o similar
- Título: "Has alcanzado tu límite"
- Mensaje: "Ya usaste tus 5 links gratuitos. Nos pondremos en contacto contigo muy pronto para darte acceso ilimitado."
- Botón: "Entendido" → cierra el modal
- No mostrar opciones de pago ni upgrade (aún no existe)

---

## Stack técnico (recordatorio)
- Next.js 14+ con App Router (`"use client"` components)
- Supabase (DB + Auth + Storage + Realtime)
- TailwindCSS + inline styles (la app mezcla ambos, mantener consistencia con el estilo existente de `CreateLinkClient.tsx` que usa inline styles)
- El cliente Supabase está en `@/utils/supabase`

## Instrucciones de ejecución

1. Primero genera el SQL necesario (tabla `pymes`, policies RLS, columna `pyme_id` en envios) y muéstralo para que lo ejecute manualmente en Supabase SQL Editor
2. Modifica `CreateLinkClient.tsx` con toda la lógica de auth, límite, y modales
3. Verifica que compile sin errores de TypeScript
4. NO tocar otros archivos
