"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/utils/supabase";

// ─── Constantes ───────────────────────────────────────────────────────────────

const N8N_CREATE_LINK =
  "https://mochidrop-n8n.utdxt3.easypanel.host/webhook/crear-envio";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type FormState = {
  // Negocio
  nombrePyme: string;
  logoFile: File | null;
  logoPreview: string;

  // Origen (desde dónde despacha la PyME)
  origenComuna: string;
  origenDireccion: string;
  origenNumero: string;

  // Paquete
  largo: string;  // cm
  alto: string;   // cm
  ancho: string;  // cm
  peso: string;   // kg
};

const DEFAULT: FormState = {
  nombrePyme: "",
  logoFile: null,
  logoPreview: "",
  origenComuna: "",
  origenDireccion: "",
  origenNumero: "",
  largo: "",
  alto: "",
  ancho: "",
  peso: "",
};

function isComplete(s: FormState) {
  return (
    s.nombrePyme.trim() !== "" &&
    s.origenComuna.trim() !== "" &&
    s.origenDireccion.trim() !== "" &&
    Number(s.largo) > 0 &&
    Number(s.alto) > 0 &&
    Number(s.ancho) > 0 &&
    Number(s.peso) > 0
  );
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

function SectionTitle({ n, label }: { n: number; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <div style={{
        width: 26, height: 26, borderRadius: "50%",
        background: "#E8553D", color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 700, flexShrink: 0,
      }}>
        {n}
      </div>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1A1A18", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {label}
      </p>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ margin: "0 0 5px", fontSize: 13, fontWeight: 600, color: "#1A1A18" }}>{label}</p>
      {children}
      {hint && <p style={{ margin: "5px 0 0", fontSize: 11, color: "#9C9C95" }}>{hint}</p>}
    </div>
  );
}

function TextInput({
  value, onChange, placeholder, type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%", boxSizing: "border-box",
        border: "1px solid #E8E8E3", borderRadius: 10,
        padding: "11px 14px", fontSize: 14, color: "#1A1A18",
        background: "#fff", outline: "none", fontFamily: "inherit",
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "#E8553D";
        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(232,85,61,0.1)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "#E8E8E3";
        e.currentTarget.style.boxShadow = "none";
      }}
    />
  );
}

function Divider() {
  return <div style={{ height: 1, background: "#E8E8E3", margin: "8px 0" }} />;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function CreateLinkClient() {
  const [form, setForm] = useState<FormState>(DEFAULT);
  const [loading, setLoading] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => isComplete(form), [form]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((s) => ({ ...s, [key]: value }));
  }

  async function onPickLogo(file?: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      setForm((s) => ({ ...s, logoFile: file, logoPreview: String(reader.result) }));
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setError("");
    setLoading(true);

    try {
      // 1. Subir logo a Supabase Storage (si hay)
      let logoUrl = "";
      if (form.logoFile) {
        const ext = form.logoFile.name.split(".").pop();
        const path = `logos/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("mochidrop")
          .upload(path, form.logoFile, { upsert: true });
        if (!uploadErr) {
          const { data: publicData } = supabase.storage
            .from("mochidrop")
            .getPublicUrl(path);
          logoUrl = publicData.publicUrl;
        }
      }

      // 2. Llamar al webhook de N8N que crea el envío y cotiza couriers
      const payload = {
        nombre_pyme: form.nombrePyme.trim(),
        logo_pyme: logoUrl,
        origen: {
          comuna: form.origenComuna.trim(),
          direccion: form.origenDireccion.trim(),
          numero: form.origenNumero.trim(),
        },
        paquete: {
          largo: Number(form.largo),
          alto: Number(form.alto),
          ancho: Number(form.ancho),
          peso: Number(form.peso),
        },
      };

      const res = await fetch(N8N_CREATE_LINK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.message ?? `HTTP ${res.status}`);
      }

      const data = await res.json();
      const id = data?.id;
      if (!id) throw new Error("no_id");

      const baseUrl = window.location.origin;
      setGeneratedUrl(`${baseUrl}/envio?id=${id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setError(
        msg && msg !== "no_id"
          ? `Error: ${msg}`
          : "No pudimos generar el link. Verifica los datos y vuelve a intentar."
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyUrl() {
    if (!generatedUrl) return;
    await navigator.clipboard.writeText(generatedUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Preview helpers
  const allDims =
    form.largo && form.alto && form.ancho && form.peso
      ? `${form.largo}×${form.alto}×${form.ancho} cm · ${form.peso} kg`
      : null;

  return (
    <div>
      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        backdropFilter: "blur(12px)",
        background: "rgba(250,250,247,0.9)",
        borderBottom: "1px solid #E8E8E3",
      }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto", padding: "0 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between", height: 60,
        }}>
          <a href="/" style={{ textDecoration: "none" }}>
            <svg width="168" height="32" viewBox="0 0 168 32" fill="none">
              <g transform="translate(14, 16) rotate(-42) scale(0.32)">
                <rect x="-30" y="-16" width="48" height="28" rx="14" stroke="#E8553D" strokeWidth="7" />
                <rect x="8" y="-4" width="48" height="28" rx="14" stroke="#E8553D" strokeWidth="7" />
              </g>
              <circle cx="14" cy="15" r="1.4" fill="#E8553D" opacity="0.65" />
              <circle cx="16.5" cy="17" r="0.9" fill="#E8553D" opacity="0.35" />
              <text x="44" y="21" fontFamily="'Instrument Sans', sans-serif" fontSize="15" fontWeight="600"><tspan fill="#1A1A18">link</tspan><tspan fill="#E8553D">drop</tspan></text>
            </svg>
          </a>
          <a href="/" style={{ fontSize: 13, color: "#5C5C57", textDecoration: "none", fontWeight: 500 }}>
            ← Volver al inicio
          </a>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 24px 100px" }}>

        {/* Page header */}
        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: "#E8553D", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Crear link de envío
          </p>
          <h1 style={{ margin: "0 0 10px", fontSize: 28, fontWeight: 700, color: "#1A1A18", lineHeight: 1.2 }}>
            Tu cliente elige courier y paga solo.
          </h1>
          <p style={{ margin: 0, fontSize: 15, color: "#5C5C57" }}>
            Completa los datos del envío. LinkDrop cotiza los couriers en tiempo real y te genera el link para enviar por WhatsApp.
          </p>
        </div>

        {/* Two-column grid */}
        <div style={{ display: "grid", gap: 24, gridTemplateColumns: "1fr" }} className="gen-grid">

          {/* ── LEFT: Form ──────────────────────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* 1 — Tu negocio */}
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E8E8E3", padding: "24px", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
              <SectionTitle n={1} label="Tu negocio" />
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <Field label="Nombre de tu tienda *">
                  <TextInput
                    value={form.nombrePyme}
                    onChange={(v) => set("nombrePyme", v)}
                    placeholder="Ej: Tienda Luna"
                  />
                </Field>
                <Field label="Logo" hint="Opcional — aparece en el link que ve tu cliente">
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 10,
                      background: "#F5F5F0", border: "1px solid #E8E8E3",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      overflow: "hidden", flexShrink: 0,
                    }}>
                      {form.logoPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={form.logoPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span style={{ fontSize: 20 }}>🏪</span>
                      )}
                    </div>
                    <label style={{
                      cursor: "pointer", background: "#F5F5F0",
                      border: "1px solid #E8E8E3", borderRadius: 8,
                      padding: "8px 14px", fontSize: 13, fontWeight: 600, color: "#1A1A18",
                    }}>
                      {form.logoPreview ? "Cambiar logo" : "Subir logo"}
                      <input type="file" accept="image/*" style={{ display: "none" }}
                        onChange={(e) => onPickLogo(e.target.files?.[0])} />
                    </label>
                    {form.logoPreview && (
                      <button type="button" onClick={() => setForm((s) => ({ ...s, logoFile: null, logoPreview: "" }))}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#9C9C95", fontFamily: "inherit" }}>
                        Quitar
                      </button>
                    )}
                  </div>
                </Field>
              </div>
            </div>

            {/* 2 — Origen */}
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E8E8E3", padding: "24px", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
              <SectionTitle n={2} label="Desde dónde despachas" />
              <p style={{ margin: "0 0 16px", fontSize: 13, color: "#5C5C57" }}>
                Dirección de retiro del paquete. Los couriers calculan el precio desde aquí.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Comuna de origen *">
                  <TextInput
                    value={form.origenComuna}
                    onChange={(v) => set("origenComuna", v)}
                    placeholder="Ej: Las Condes"
                  />
                </Field>
                <Field label="Dirección *">
                  <TextInput
                    value={form.origenDireccion}
                    onChange={(v) => set("origenDireccion", v)}
                    placeholder="Ej: Av. El Bosque 500"
                  />
                </Field>
              </div>
              <div style={{ marginTop: 12 }}>
                <Field label="Número/Depto">
                  <TextInput
                    value={form.origenNumero}
                    onChange={(v) => set("origenNumero", v)}
                    placeholder="Ej: 1234, Of. 5"
                  />
                </Field>
              </div>
            </div>

            {/* 3 — Paquete */}
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E8E8E3", padding: "24px", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
              <SectionTitle n={3} label="Dimensiones del paquete" />
              <p style={{ margin: "0 0 16px", fontSize: 13, color: "#5C5C57" }}>
                Necesario para cotizar el precio real del envío con cada courier.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
                <Field label="Largo (cm) *">
                  <TextInput
                    value={form.largo}
                    onChange={(v) => set("largo", v.replace(/[^\d.]/g, ""))}
                    placeholder="30"
                    type="number"
                  />
                </Field>
                <Field label="Alto (cm) *">
                  <TextInput
                    value={form.alto}
                    onChange={(v) => set("alto", v.replace(/[^\d.]/g, ""))}
                    placeholder="20"
                    type="number"
                  />
                </Field>
                <Field label="Ancho (cm) *">
                  <TextInput
                    value={form.ancho}
                    onChange={(v) => set("ancho", v.replace(/[^\d.]/g, ""))}
                    placeholder="15"
                    type="number"
                  />
                </Field>
                <Field label="Peso (kg) *">
                  <TextInput
                    value={form.peso}
                    onChange={(v) => set("peso", v.replace(/[^\d.]/g, ""))}
                    placeholder="1.5"
                    type="number"
                  />
                </Field>
              </div>
              <p style={{ margin: "12px 0 0", fontSize: 12, color: "#9C9C95" }}>
                💡 Si no sabes el peso exacto, estima por exceso. Los couriers cobran por el mayor entre el peso real y el volumétrico.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div style={{ background: "#FFF0ED", border: "1px solid #E8553D", borderRadius: 12, padding: "12px 16px", fontSize: 13, color: "#C23E28" }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || loading}
              style={{
                width: "100%", padding: "16px", borderRadius: 14, border: "none",
                fontSize: 16, fontWeight: 700, color: "#fff", fontFamily: "inherit",
                cursor: canSubmit && !loading ? "pointer" : "not-allowed",
                background: canSubmit && !loading ? "#E8553D" : "#D1D1CC",
                boxShadow: canSubmit && !loading ? "0 4px 20px rgba(232,85,61,0.3)" : "none",
                transition: "all 0.2s",
              }}
            >
              {loading ? "Cotizando couriers y generando link…" : "Generar link de envío →"}
            </button>

            {!canSubmit && !generatedUrl && (
              <p style={{ textAlign: "center", fontSize: 12, color: "#9C9C95", margin: "-8px 0 0" }}>
                Completa todos los campos marcados con * para continuar
              </p>
            )}

            {/* Generated URL */}
            {generatedUrl && (
              <div style={{ background: "#F5FBF7", border: "1px solid #2D8A56", borderRadius: 14, padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%", background: "#2D8A56",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#2D8A56" }}>
                    ¡Link generado! Cópialo y mándalo por WhatsApp.
                  </p>
                </div>
                <div style={{ background: "#fff", border: "1px solid #E8E8E3", borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1A1A18", wordBreak: "break-all" }}>{generatedUrl}</p>
                </div>
                <p style={{ margin: "0 0 12px", fontSize: 13, color: "#5C5C57" }}>
                  Tu cliente abre el link, ve los precios reales de cada courier, elige y paga con tarjeta. Tú no tocas nada.
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={copyUrl} style={{
                    flex: 1, padding: "11px", borderRadius: 10,
                    border: "1px solid #E8E8E3", background: "#fff",
                    fontSize: 14, fontWeight: 700, color: "#1A1A18",
                    cursor: "pointer", fontFamily: "inherit",
                  }}>
                    {copied ? "✓ Copiado" : "📋 Copiar link"}
                  </button>
                  <a href={generatedUrl} target="_blank" rel="noreferrer" style={{
                    flex: 1, padding: "11px", borderRadius: 10,
                    background: "#1A1A18", fontSize: 14, fontWeight: 700, color: "#fff",
                    textDecoration: "none", textAlign: "center", display: "block",
                  }}>
                    Abrir →
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: Preview ───────────────────────────────────────────────── */}
          <div style={{ position: "sticky", top: 76, height: "fit-content" }}>
            <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 700, color: "#9C9C95", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Así lo ve tu cliente
            </p>

            {/* Phone-style card */}
            <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #E8E8E3", overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
              {/* Header de la tienda */}
              <div style={{ background: "#FAFAF7", padding: "14px 16px", borderBottom: "1px solid #E8E8E3", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: form.logoPreview ? "transparent" : "#E8553D",
                  display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0,
                }}>
                  {form.logoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.logoPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 64 64" fill="none">
                      <g transform="translate(32,32) rotate(-42) scale(0.58)">
                        <rect x="-30" y="-16" width="48" height="28" rx="14" stroke="#fff" strokeWidth="7" />
                        <rect x="8" y="-4" width="48" height="28" rx="14" stroke="#fff" strokeWidth="7" />
                      </g>
                    </svg>
                  )}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1A1A18" }}>
                    {form.nombrePyme || "Tu Tienda"}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: "#9C9C95" }}>Link de envío seguro</p>
                </div>
              </div>

              <div style={{ padding: "16px" }}>
                {/* Destinatario placeholder */}
                <div style={{ background: "#FAFAF7", border: "1px solid #E8E8E3", borderRadius: 10, padding: "10px 12px", marginBottom: 14, display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 18 }}>📋</span>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1A1A18" }}>Tu cliente completará sus datos aquí</p>
                    <p style={{ margin: 0, fontSize: 12, color: "#9C9C95" }}>Nombre, dirección y comuna de destino</p>
                  </div>
                </div>

                {/* Dimensiones */}
                {allDims && (
                  <div style={{ background: "#F5F5F0", borderRadius: 8, padding: "8px 12px", marginBottom: 14, display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 12 }}>📦</span>
                    <p style={{ margin: 0, fontSize: 11, color: "#5C5C57" }}>{allDims}</p>
                  </div>
                )}

                {/* Couriers */}
                <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 600, color: "#9C9C95", textTransform: "uppercase", letterSpacing: "0.08em" }}>Elige tu courier</p>
                {[
                  { name: "Starken", days: "2-3 días", highlight: false },
                  { name: "Chilexpress", days: "1-2 días", highlight: false },
                  { name: "Blue Express", days: "3-4 días", highlight: true },
                ].map((c, i) => (
                  <div key={i} style={{
                    border: c.highlight ? "1.5px solid #E8553D" : "1px solid #E8E8E3",
                    background: c.highlight ? "#FFF0ED" : "#fff",
                    borderRadius: 8, padding: "8px 12px", marginBottom: 6,
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#1A1A18" }}>{c.name}</p>
                      <p style={{ margin: 0, fontSize: 10, color: "#9C9C95" }}>{c.days}</p>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: c.highlight ? "#E8553D" : "#9C9C95" }}>
                      {c.highlight ? "precio real" : "—"}
                    </p>
                  </div>
                ))}

                <div style={{ background: "#E8553D", color: "#fff", textAlign: "center", borderRadius: 10, padding: "11px", marginTop: 8, fontSize: 13, fontWeight: 700 }}>
                  Pagar envío →
                </div>

                <p style={{ textAlign: "center", fontSize: 11, color: "#9C9C95", margin: "10px 0 0" }}>
                  🔒 Pago seguro con FLOW
                </p>
              </div>
            </div>

            {/* Info pills */}
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                "Los precios de courier se calculan en tiempo real al generar el link",
                "Tu cliente paga con tarjeta — sin transferencias",
                "La guía de despacho llega a tu correo automáticamente",
              ].map((tip, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 12, flexShrink: 0, marginTop: 1 }}>✓</span>
                  <p style={{ margin: 0, fontSize: 12, color: "#5C5C57" }}>{tip}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .gen-grid {
            grid-template-columns: 1.15fr 0.85fr !important;
          }
        }
      `}</style>
    </div>
  );
}
