# Prompt Claude Code — Separar campos de dirección en 3 (calle, número, depto)

## IMPORTANTE

1. **NO hacer deploy, NO hacer push, NO subir nada.** Todos los cambios quedan en local.
2. **NO modificar archivos que no se mencionen explícitamente aquí.**

---

## El problema

La API de Envía espera `street` (nombre de calle) y `number` (número de la calle). Pero actualmente los formularios tienen "Dirección" (donde el usuario pone calle + número juntos) y "Número/Depto" (donde pone el departamento). Resultado: Envía recibe el depto como número de calle, y la dirección llega mal al courier.

Esto afecta tanto el **origen** (datos de la PYME en `CreateLinkClient`) como el **destino** (datos del cliente en `EnvioClient`).

---

## PARTE 1: Formulario de ORIGEN — `CreateLinkClient`

### 1.1 Actualizar el type `FormState`

Reemplazar:
```typescript
origenDireccion: string;
origenNumero: string;
```

Con:
```typescript
origenCalle: string;
origenNumero: string;
origenDepto: string;
```

### 1.2 Actualizar `DEFAULT`

Reemplazar:
```typescript
origenDireccion: "",
origenNumero: "",
```

Con:
```typescript
origenCalle: "",
origenNumero: "",
origenDepto: "",
```

### 1.3 Actualizar `isComplete`

Reemplazar:
```typescript
s.origenDireccion.trim() !== "" &&
```

Con:
```typescript
s.origenCalle.trim() !== "" &&
s.origenNumero.trim() !== "" &&
```

(Número ahora es obligatorio porque es el número de la calle. Depto es opcional.)

### 1.4 Actualizar los campos del formulario en la sección "Desde dónde despachas"

Reemplazar el grid actual de Comuna + Dirección + Número/Depto con:

```tsx
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
  <Field label="Comuna de origen *">
    <TextInput
      value={form.origenComuna}
      onChange={(v) => set("origenComuna", v)}
      placeholder="Ej: Las Condes"
    />
  </Field>
  <Field label="Calle *">
    <TextInput
      value={form.origenCalle}
      onChange={(v) => set("origenCalle", v)}
      placeholder="Ej: Av. El Bosque"
    />
  </Field>
</div>
<div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
  <Field label="Número *">
    <TextInput
      value={form.origenNumero}
      onChange={(v) => set("origenNumero", v)}
      placeholder="Ej: 500"
    />
  </Field>
  <Field label="Depto / Oficina">
    <TextInput
      value={form.origenDepto}
      onChange={(v) => set("origenDepto", v)}
      placeholder="Ej: Of. 301"
    />
  </Field>
</div>
```

### 1.5 Actualizar el payload que se envía a N8N

En la función `doGenerateLink`, buscar:
```typescript
origen: {
  comuna: form.origenComuna.trim(),
  direccion: form.origenDireccion.trim(),
  numero: form.origenNumero.trim(),
},
```

Reemplazar con:
```typescript
origen: {
  comuna: form.origenComuna.trim(),
  calle: form.origenCalle.trim(),
  numero: form.origenNumero.trim(),
  depto: form.origenDepto.trim(),
},
```

---

## PARTE 2: Formulario de DESTINO — `EnvioClient`

### 2.1 Actualizar el state del formulario

Buscar:
```typescript
const [formCliente, setFormCliente] = useState({
  nombre: "", telefono: "", comuna: "", direccion: "", numero: "",
});
```

Reemplazar con:
```typescript
const [formCliente, setFormCliente] = useState({
  nombre: "", telefono: "", comuna: "", calle: "", numero: "", depto: "",
});
```

### 2.2 Actualizar la validación

Buscar la validación que verifica campos obligatorios antes de cotizar. Agregar `formCliente.numero.trim()` como obligatorio y actualizar `formCliente.direccion` a `formCliente.calle`:

```typescript
if (!formCliente.nombre.trim() || !formCliente.comuna.trim() || !formCliente.calle.trim() || !formCliente.numero.trim()) {
  setErrorCotizar("Completa los campos obligatorios (*).");
  return;
}
```

### 2.3 Actualizar los campos del formulario

Reemplazar el grid actual que tiene Comuna + Número/Depto + Dirección con:

```tsx
<div className="grid grid-cols-2 gap-3">
  <div>
    <label className="block text-sm font-semibold text-[#1A1A18] mb-1.5">
      Comuna <span className="text-[#E8553D]">*</span>
    </label>
    <input
      type="text"
      value={formCliente.comuna}
      onChange={(e) => setFormCliente((s) => ({ ...s, comuna: e.target.value }))}
      placeholder="Ej: Providencia"
      className="w-full border border-[#E8E8E3] rounded-xl px-4 py-3 text-sm text-[#1A1A18] bg-[#FAFAF7] outline-none transition-all focus:border-[#E8553D] focus:ring-2 focus:ring-[#E8553D]/10 placeholder:text-[#9C9C95]"
    />
  </div>
  <div>
    <label className="block text-sm font-semibold text-[#1A1A18] mb-1.5">
      Calle <span className="text-[#E8553D]">*</span>
    </label>
    <input
      type="text"
      value={formCliente.calle}
      onChange={(e) => setFormCliente((s) => ({ ...s, calle: e.target.value }))}
      placeholder="Ej: Blanco Viel"
      className="w-full border border-[#E8E8E3] rounded-xl px-4 py-3 text-sm text-[#1A1A18] bg-[#FAFAF7] outline-none transition-all focus:border-[#E8553D] focus:ring-2 focus:ring-[#E8553D]/10 placeholder:text-[#9C9C95]"
    />
  </div>
</div>

<div className="grid grid-cols-2 gap-3">
  <div>
    <label className="block text-sm font-semibold text-[#1A1A18] mb-1.5">
      Número <span className="text-[#E8553D]">*</span>
    </label>
    <input
      type="text"
      value={formCliente.numero}
      onChange={(e) => setFormCliente((s) => ({ ...s, numero: e.target.value }))}
      placeholder="Ej: 1377"
      className="w-full border border-[#E8E8E3] rounded-xl px-4 py-3 text-sm text-[#1A1A18] bg-[#FAFAF7] outline-none transition-all focus:border-[#E8553D] focus:ring-2 focus:ring-[#E8553D]/10 placeholder:text-[#9C9C95]"
    />
  </div>
  <div>
    <label className="block text-sm font-semibold text-[#1A1A18] mb-1.5">
      Depto / Oficina
    </label>
    <input
      type="text"
      value={formCliente.depto}
      onChange={(e) => setFormCliente((s) => ({ ...s, depto: e.target.value }))}
      placeholder="Ej: 1007"
      className="w-full border border-[#E8E8E3] rounded-xl px-4 py-3 text-sm text-[#1A1A18] bg-[#FAFAF7] outline-none transition-all focus:border-[#E8553D] focus:ring-2 focus:ring-[#E8553D]/10 placeholder:text-[#9C9C95]"
    />
  </div>
</div>
```

### 2.4 Actualizar el payload que se envía a `/api/cotizar-envio`

Buscar donde se arma `datos_destino` en la función `cotizarEnvio`:

Reemplazar con:
```typescript
datos_destino: {
  nombre: formCliente.nombre.trim(),
  telefono: formCliente.telefono.trim(),
  comuna: formCliente.comuna.trim(),
  calle: formCliente.calle.trim(),
  numero: formCliente.numero.trim(),
  depto: formCliente.depto.trim(),
},
```

### 2.5 Actualizar donde se muestra el destino confirmado en `EnvioClient`

Buscar donde se renderiza la dirección del destino (después de resetear cotizaciones). Cambiar las referencias de `envio.datos_destino?.direccion` y `envio.datos_destino?.number` a:

```tsx
{envio.datos_destino?.calle || envio.datos_destino?.direccion} {envio.datos_destino?.numero || envio.datos_destino?.number}
{(envio.datos_destino?.depto) ? `, Depto ${envio.datos_destino.depto}` : ""}, {envio.datos_destino?.comuna}
```

Los fallbacks (`|| envio.datos_destino?.direccion` y `|| envio.datos_destino?.number`) son para retrocompatibilidad con envíos viejos que tienen el formato anterior.

---

## PARTE 3: Actualizar tipos `EnvioType` en TODOS los archivos

En todos los componentes que definen `EnvioType` o `datos_destino`, actualizar el tipo:

```typescript
datos_destino?: {
  nombre: string;
  calle: string;
  numero: string;
  depto?: string;
  comuna: string;
  telefono?: string;
  // Retrocompatibilidad con datos viejos
  direccion?: string;
  number?: string;
};
```

Archivos que probablemente definen este tipo:
- `EnvioClient` (página /envio)
- `ConfirmacionClient` (página /confirmacion)
- `FinalClient` (página /final)
- `PagoClient` (página /pago, si aún existe con UI)

---

## PARTE 4: Actualizar display de dirección en TODOS los componentes

En cada componente que renderiza la dirección del destinatario, reemplazar el patrón:
```tsx
{envio.datos_destino?.direccion}{envio.datos_destino?.number ? ` ${envio.datos_destino.number}` : ""}, {envio.datos_destino?.comuna}
```

Con:
```tsx
{envio.datos_destino?.calle || envio.datos_destino?.direccion} {envio.datos_destino?.numero || envio.datos_destino?.number}{envio.datos_destino?.depto ? `, Depto ${envio.datos_destino.depto}` : ""}, {envio.datos_destino?.comuna}
```

Buscar y reemplazar en:
- `EnvioClient` — tarjeta de destino confirmado
- `ConfirmacionClient` — sección destinatario
- `FinalClient` — sección destinatario
- `PagoClient` — si tiene sección de destinatario

---

## PARTE 5: API route `/api/cotizar-envio` (si existe como proxy a N8N)

Si existe un archivo `/api/cotizar-envio/route.ts` que transforma datos antes de enviar a N8N, verificar que pase los campos nuevos (`calle`, `numero`, `depto`) tal cual al webhook de N8N. Si solo hace passthrough del body, no necesita cambios.

---

## Lo que NO se toca

- **N8N workflows** — se actualizan manualmente por separado (no los toca Claude Code)
- **Supabase schema** — no se modifica la estructura de la tabla
- **API de Flow** — no se toca
- **No hacer deploy, no hacer push, no subir nada a producción**

## NO hacer git push ni deploy

Repito: todos los cambios quedan en local. NO ejecutar `git push`, `vercel deploy`, ni ningún comando que suba código a producción.
