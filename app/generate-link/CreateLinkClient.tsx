"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/utils/supabase";
import type { User } from "@supabase/supabase-js";

// ─── Constantes ───────────────────────────────────────────────────────────────

const N8N_CREATE_LINK = "/api/crear-envio";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type FormState = {
  nombrePyme: string;
  logoFile: File | null;
  logoPreview: string;
  origenComuna: string;
  origenDireccion: string;
  origenNumero: string;
  largo: string;
  alto: string;
  ancho: string;
  peso: string;
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

// ─── Modal overlay base ───────────────────────────────────────────────────────

function ModalOverlay({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
    }}>
      {children}
    </div>
  );
}

// ─── AuthModal ────────────────────────────────────────────────────────────────

function AuthModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [mode, setMode] = useState<"register" | "login">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmMsg, setConfirmMsg] = useState("");

  async function handleAuth() {
    if (!email.trim() || password.length < 6) {
      setError("Ingresa un email válido y contraseña de al menos 6 caracteres.");
      return;
    }
    setError("");
    setConfirmMsg("");
    setLoading(true);
    try {
      if (mode === "register") {
        const { data, error: signUpErr } = await supabase.auth.signUp({ email: email.trim(), password });
        if (signUpErr) throw signUpErr;
        if (data.user && data.session) {
          // Sesión activa inmediatamente — crear fila en pymes
          await supabase.from("pymes").insert({ auth_id: data.user.id, email: email.trim() });
          onSuccess();
        } else {
          // Email confirmation required
          setConfirmMsg("Revisa tu correo y confirma tu cuenta para continuar.");
        }
      } else {
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (signInErr) throw signInErr;
        onSuccess();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      if (msg.includes("already registered")) setError("Este email ya está registrado. Inicia sesión.");
      else if (msg.includes("Invalid login")) setError("Email o contraseña incorrectos.");
      else setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    border: "1px solid #E8E8E3", borderRadius: 10,
    padding: "12px 14px", fontSize: 14, color: "#1A1A18",
    background: "#FAFAF7", outline: "none", fontFamily: "inherit",
  };

  return (
    <ModalOverlay>
      <div style={{
        background: "#fff", borderRadius: 20, padding: "32px",
        width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        position: "relative",
      }}>
        {/* Close */}
        <button onClick={onClose} style={{
          position: "absolute", top: 16, right: 16,
          background: "none", border: "none", cursor: "pointer",
          fontSize: 20, color: "#9C9C95", fontFamily: "inherit", lineHeight: 1,
        }}>✕</button>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 700, color: "#1A1A18" }}>
            {mode === "register" ? "Crea tu cuenta gratis" : "Inicia sesión"}
          </h2>
          <p style={{ margin: 0, fontSize: 14, color: "#5C5C57" }}>
            {mode === "register"
              ? "Genera hasta 5 links de envío gratis"
              : "Accede a tu cuenta"}
          </p>
        </div>

        {/* Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <p style={{ margin: "0 0 5px", fontSize: 13, fontWeight: 600, color: "#1A1A18" }}>Email</p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              style={inputStyle}
              onKeyDown={(e) => e.key === "Enter" && handleAuth()}
            />
          </div>
          <div>
            <p style={{ margin: "0 0 5px", fontSize: 13, fontWeight: 600, color: "#1A1A18" }}>Contraseña</p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              style={inputStyle}
              onKeyDown={(e) => e.key === "Enter" && handleAuth()}
            />
          </div>

          {error && (
            <p style={{ margin: 0, fontSize: 13, color: "#C23E28", background: "#FFF0ED", padding: "10px 14px", borderRadius: 8 }}>
              {error}
            </p>
          )}
          {confirmMsg && (
            <p style={{ margin: 0, fontSize: 13, color: "#2D8A56", background: "#F5FBF7", padding: "10px 14px", borderRadius: 8 }}>
              {confirmMsg}
            </p>
          )}

          <button
            onClick={handleAuth}
            disabled={loading}
            style={{
              width: "100%", padding: "14px", borderRadius: 12, border: "none",
              fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: "inherit",
              background: loading ? "#D1D1CC" : "#E8553D",
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: 4,
            }}
          >
            {loading ? "Procesando…" : mode === "register" ? "Crear cuenta →" : "Iniciar sesión →"}
          </button>

          <p style={{ margin: 0, textAlign: "center", fontSize: 13, color: "#9C9C95" }}>
            {mode === "register" ? "¿Ya tienes cuenta? " : "¿No tienes cuenta? "}
            <button
              onClick={() => { setMode(mode === "register" ? "login" : "register"); setError(""); setConfirmMsg(""); }}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#E8553D", fontWeight: 600, fontFamily: "inherit", padding: 0 }}
            >
              {mode === "register" ? "Inicia sesión" : "Regístrate"}
            </button>
          </p>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ─── LimitModal ───────────────────────────────────────────────────────────────

function LimitModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay>
      <div style={{
        background: "#fff", borderRadius: 20, padding: "32px",
        width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🎉</div>
        <h2 style={{ margin: "0 0 12px", fontSize: 22, fontWeight: 700, color: "#1A1A18" }}>
          Tu prueba gratuita ha terminado
        </h2>
        <p style={{ margin: "0 0 24px", fontSize: 14, color: "#5C5C57", lineHeight: 1.6 }}>
          Ya usaste todos tus links de prueba. Nos pondremos en contacto contigo muy pronto para activar tu plan y seguir enviando sin límites.
        </p>
        <button
          onClick={onClose}
          style={{
            width: "100%", padding: "14px", borderRadius: 12, border: "none",
            fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: "inherit",
            background: "#1A1A18", cursor: "pointer",
          }}
        >
          Entendido
        </button>
      </div>
    </ModalOverlay>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function CreateLinkClient() {
  const [form, setForm] = useState<FormState>(DEFAULT);
  const [loading, setLoading] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  // Auth
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [linksCount, setLinksCount] = useState<{ used: number; limit: number } | null>(null);

  const canSubmit = useMemo(() => isComplete(form), [form]);

  // Verificar auth al cargar
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Cargar contador de links cuando hay usuario
  useEffect(() => {
    if (!user) { setLinksCount(null); return; }
    supabase
      .from("pymes")
      .select("links_creados, limite_links")
      .eq("auth_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setLinksCount({ used: data.links_creados, limit: data.limite_links });
      });
  }, [user]);

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

  async function doGenerateLink(currentUser: User) {
    setError("");
    setLoading(true);
    try {
      // 1. Verificar límite
      const { data: pymeData } = await supabase
        .from("pymes")
        .select("links_creados, limite_links")
        .eq("auth_id", currentUser.id)
        .single();

      if (pymeData && pymeData.links_creados >= pymeData.limite_links) {
        setShowLimitModal(true);
        return;
      }

      // 2. Subir logo (si hay)
      let logoUrl = "";
      if (form.logoFile) {
        const ext = form.logoFile.name.split(".").pop();
        const path = `logos/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("mochidrop")
          .upload(path, form.logoFile, { upsert: true });
        if (uploadErr) {
          throw new Error(`Error al subir el logo: ${uploadErr.message}`);
        }
        const { data: publicData } = supabase.storage.from("mochidrop").getPublicUrl(path);
        logoUrl = publicData.publicUrl;
      }

      // 3. Llamar al webhook de N8N
      const payload = {
        nombre_pyme: form.nombrePyme.trim(),
        logo_pyme: logoUrl,
        pyme_id: currentUser.id,
        email: currentUser.email,
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

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error ?? `Error ${res.status}`);
      }

      const id = data?.id;
      if (!id) throw new Error("N8N respondió OK pero no devolvió el ID del envío. Revisa el workflow en N8N.");

      // 4. Incrementar contador
      const newCount = (pymeData?.links_creados ?? 0) + 1;
      await supabase
        .from("pymes")
        .update({ links_creados: newCount })
        .eq("auth_id", currentUser.id);
      setLinksCount((prev) => prev ? { ...prev, used: newCount } : prev);

      const baseUrl = window.location.origin;
      setGeneratedUrl(`${baseUrl}/envio?id=${id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    await doGenerateLink(currentUser);
  }

  async function copyUrl() {
    if (!generatedUrl) return;
    await navigator.clipboard.writeText(generatedUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const allDims =
    form.largo && form.alto && form.ancho && form.peso
      ? `${form.largo}×${form.alto}×${form.ancho} cm · ${form.peso} kg`
      : null;

  return (
    <div>
      {/* Modales */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={async () => {
            setShowAuthModal(false);
            const { data: { user: u } } = await supabase.auth.getUser();
            if (u) await doGenerateLink(u);
          }}
        />
      )}
      {showLimitModal && <LimitModal onClose={() => setShowLimitModal(false)} />}

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
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {user && (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {linksCount && (
                  <span style={{ fontSize: 12, color: "#5C5C57", fontWeight: 500 }}>
                    <span style={{ fontWeight: 700, color: linksCount.used >= linksCount.limit ? "#C23E28" : "#1A1A18" }}>
                      {linksCount.used}
                    </span>
                    <span style={{ color: "#9C9C95" }}> / {linksCount.limit} links usados</span>
                  </span>
                )}
                <span style={{ fontSize: 12, color: "#9C9C95" }}>{user.email}</span>
                <button
                  onClick={() => supabase.auth.signOut()}
                  style={{ fontSize: 12, color: "#5C5C57", background: "none", border: "1px solid #E8E8E3", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontFamily: "inherit" }}
                >
                  Salir
                </button>
              </div>
            )}
            {!user && (
              <a href="/" style={{ fontSize: 13, color: "#5C5C57", textDecoration: "none", fontWeight: 500 }}>
                ← Volver al inicio
              </a>
            )}
          </div>
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
                  <TextInput value={form.largo} onChange={(v) => set("largo", v.replace(/[^\d.]/g, ""))} placeholder="30" type="number" />
                </Field>
                <Field label="Alto (cm) *">
                  <TextInput value={form.alto} onChange={(v) => set("alto", v.replace(/[^\d.]/g, ""))} placeholder="20" type="number" />
                </Field>
                <Field label="Ancho (cm) *">
                  <TextInput value={form.ancho} onChange={(v) => set("ancho", v.replace(/[^\d.]/g, ""))} placeholder="15" type="number" />
                </Field>
                <Field label="Peso (kg) *">
                  <TextInput value={form.peso} onChange={(v) => set("peso", v.replace(/[^\d.]/g, ""))} placeholder="1.5" type="number" />
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
              {loading ? "Generando link…" : "Generar link de envío →"}
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
                  Tu cliente abre el link, llena sus datos, elige courier y paga. Tú no tocas nada.
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
