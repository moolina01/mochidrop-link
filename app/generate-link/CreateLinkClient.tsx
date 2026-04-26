"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/utils/supabase";
import type { User } from "@supabase/supabase-js";

// ─── Constantes ───────────────────────────────────────────────────────────────

const N8N_CREATE_LINK = "/api/crear-envio";
const templatesKey = (uid: string) => `ld_pkg_templates_${uid}`;
const lastUrlKey = (uid: string) => `ld_last_url_${uid}`;

const ALL_COURIERS = [
  { key: "starken_domicilio", label: "Starken Domicilio" },
  { key: "starken_sucursal",  label: "Starken Sucursal" },
  { key: "chilexpress",       label: "Chilexpress" },
  { key: "blueexpress",       label: "Blue Express" },
  { key: "noventa9Minutos",   label: "99 Minutos" },
] as const;

const DEFAULT_COURIERS = ALL_COURIERS.map((c) => c.key);
const MAX_TEMPLATES = 3;

function templateLabel(pkg: PackageState): string {
  return `${pkg.largo}×${pkg.alto}×${pkg.ancho} cm · ${pkg.peso} kg`;
}

function saveTemplate(pkg: PackageState, uid: string) {
  try {
    const label = templateLabel(pkg);
    const existing: PackageTemplate[] = JSON.parse(localStorage.getItem(templatesKey(uid)) ?? "[]");
    const deduped = existing.filter((t) => t.label !== label);
    const updated = [{ ...pkg, label }, ...deduped].slice(0, MAX_TEMPLATES);
    localStorage.setItem(templatesKey(uid), JSON.stringify(updated));
  } catch {}
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

type ProfileState = {
  nombrePyme: string;
  logoFile: File | null;
  logoPreview: string;
  logoUrl: string;
  origenComuna: string;
  origenCalle: string;
  origenNumero: string;
  origenDepto: string;
};

type PackageState = {
  largo: string;
  alto: string;
  ancho: string;
  peso: string;
};

type PackageTemplate = PackageState & { label: string };

type ActiveTab = "tienda" | "crear";

const DEFAULT_PROFILE: ProfileState = {
  nombrePyme: "",
  logoFile: null,
  logoPreview: "",
  logoUrl: "",
  origenComuna: "",
  origenCalle: "",
  origenNumero: "",
  origenDepto: "",
};

const DEFAULT_PACKAGE: PackageState = {
  largo: "",
  alto: "",
  ancho: "",
  peso: "",
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function isProfileComplete(p: ProfileState) {
  return (
    p.nombrePyme.trim() !== "" &&
    p.origenComuna.trim() !== "" &&
    p.origenCalle.trim() !== "" &&
    p.origenNumero.trim() !== ""
  );
}

function isPackageComplete(pkg: PackageState) {
  return (
    Number(pkg.largo) > 0 &&
    Number(pkg.alto) > 0 &&
    Number(pkg.ancho) > 0 &&
    Number(pkg.peso) > 0
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
          await supabase.from("pymes").insert({ auth_id: data.user.id, email: email.trim() });
          onSuccess();
        } else {
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
        <button onClick={onClose} style={{
          position: "absolute", top: 16, right: 16,
          background: "none", border: "none", cursor: "pointer",
          fontSize: 20, color: "#9C9C95", fontFamily: "inherit", lineHeight: 1,
        }}>✕</button>

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

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <p style={{ margin: "0 0 5px", fontSize: 13, fontWeight: 600, color: "#1A1A18" }}>Email</p>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com" style={inputStyle}
              onKeyDown={(e) => e.key === "Enter" && handleAuth()} />
          </div>
          <div>
            <p style={{ margin: "0 0 5px", fontSize: 13, fontWeight: 600, color: "#1A1A18" }}>Contraseña</p>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres" style={inputStyle}
              onKeyDown={(e) => e.key === "Enter" && handleAuth()} />
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

          <button onClick={handleAuth} disabled={loading} style={{
            width: "100%", padding: "14px", borderRadius: 12, border: "none",
            fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: "inherit",
            background: loading ? "#D1D1CC" : "#E8553D",
            cursor: loading ? "not-allowed" : "pointer", marginTop: 4,
          }}>
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

const PLANES = [
  { nombre: "Emprende", precio: "$4.990", periodo: "/ mes", links: "40 links", destacado: true },
  { nombre: "Pro", precio: "$12.990", periodo: "/ mes", links: "Links ilimitados", destacado: false },
];

const WA_UPGRADE = "https://wa.me/56994284520?text=Hola,%20quiero%20subir%20mi%20plan%20en%20LinkDrop";

function LimitModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay>
      <div style={{
        background: "#fff", borderRadius: 24, padding: "32px",
        width: "100%", maxWidth: 440, boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
        position: "relative",
      }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#9C9C95", fontFamily: "inherit", lineHeight: 1 }}>✕</button>

        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%",
            background: "linear-gradient(135deg, #E8553D, #c93d27)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px", boxShadow: "0 8px 24px rgba(232,85,61,0.3)",
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700, color: "#1A1A18" }}>
            Alcanzaste tu límite de links
          </h2>
          <p style={{ margin: 0, fontSize: 14, color: "#5C5C57", lineHeight: 1.6 }}>
            Tu plan gratuito incluye 5 links. Elige un plan para seguir generando sin interrupciones.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          {PLANES.map((plan) => (
            <div key={plan.nombre} style={{
              border: "1.5px solid", borderColor: plan.destacado ? "#E8553D" : "#E8E8E3",
              borderRadius: 14, padding: "16px 14px", position: "relative",
              background: plan.destacado ? "#FFF8F6" : "#FAFAF7",
            }}>
              {plan.destacado && (
                <div style={{
                  position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)",
                  background: "#E8553D", color: "#fff",
                  fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 100,
                  whiteSpace: "nowrap", letterSpacing: "0.05em",
                }}>MÁS POPULAR</div>
              )}
              <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: "#1A1A18" }}>{plan.nombre}</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 2, marginBottom: 6 }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: "#1A1A18" }}>{plan.precio}</span>
                <span style={{ fontSize: 11, color: "#9C9C95" }}>{plan.periodo}</span>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: "#5C5C57", fontWeight: 500 }}>{plan.links}</p>
            </div>
          ))}
        </div>

        <a href={WA_UPGRADE} target="_blank" rel="noopener noreferrer" style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          width: "100%", padding: "14px", borderRadius: 12,
          fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: "inherit",
          background: "#25D366", textDecoration: "none",
          boxShadow: "0 4px 16px rgba(37,211,102,0.35)", boxSizing: "border-box",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
          </svg>
          Subir mi plan por WhatsApp
        </a>

        <p style={{ margin: "12px 0 0", fontSize: 12, color: "#9C9C95", textAlign: "center" }}>
          Te respondemos en minutos y activamos tu plan al instante.
        </p>
      </div>
    </ModalOverlay>
  );
}

// ─── SettingsModal + CouriersModal ────────────────────────────────────────────

const COURIER_META: Record<string, { color: string; bg: string; desc: string }> = {
  starken_domicilio: { color: "#00A651", bg: "#E8F8EE", desc: "Entrega a domicilio" },
  starken_sucursal:  { color: "#00A651", bg: "#E8F8EE", desc: "Retiro en sucursal" },
  chilexpress:       { color: "#E6A800", bg: "#FFFBE8", desc: "Entrega a domicilio" },
  blueexpress:       { color: "#0055B8", bg: "#E8F0FA", desc: "Entrega a domicilio" },
  noventa9Minutos:   { color: "#FF3B30", bg: "#FFF0EE", desc: "Entrega express" },
};

function Toggle({ active, onChange, disabled }: { active: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button onClick={onChange} disabled={disabled} style={{
      flexShrink: 0, width: 44, height: 24, borderRadius: 100,
      background: active ? "#E8553D" : "#D1D1CC",
      border: "none", cursor: disabled ? "not-allowed" : "pointer",
      position: "relative", transition: "background 0.2s", marginLeft: 16,
    }}>
      <div style={{
        position: "absolute", top: 3, width: 18, height: 18, borderRadius: "50%",
        background: "#fff", transition: "left 0.2s",
        left: active ? 23 : 3, boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
      }} />
    </button>
  );
}

function CouriersModal({
  couriersHabilitados, onSave, onClose,
}: {
  couriersHabilitados: string[];
  onSave: (couriers: string[]) => Promise<void>;
  onClose: () => void;
}) {
  const [local, setLocal] = useState<string[]>(couriersHabilitados);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggle(key: string) {
    setLocal((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
    setSaved(false);
  }

  async function handleSave() {
    if (local.length === 0) return;
    setSaving(true);
    await onSave(local);
    setSaving(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1200);
  }

  return (
    <ModalOverlay>
      <div style={{
        background: "#fff", borderRadius: 20, width: "100%", maxWidth: 420,
        boxShadow: "0 24px 64px rgba(0,0,0,0.15)", position: "relative", overflow: "hidden",
      }}>

        {/* Navegación estilo Apple */}
        <div style={{ display: "flex", alignItems: "center", padding: "18px 20px 0" }}>
          <button onClick={onClose} style={{
            display: "flex", alignItems: "center", gap: 4,
            background: "none", border: "none", cursor: "pointer",
            fontSize: 14, color: "#E8553D", fontFamily: "inherit", fontWeight: 500, padding: 0,
          }}>
            <svg width="9" height="15" viewBox="0 0 9 15" fill="none">
              <path d="M8 1L1.5 7.5L8 14" stroke="#E8553D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Configuración
          </button>
        </div>

        {/* Título + descripción estilo Apple */}
        <div style={{ padding: "14px 20px 20px" }}>
          <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 700, color: "#1A1A18", letterSpacing: "-0.02em" }}>
            Couriers
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: "#9C9C95", lineHeight: 1.5 }}>
            Activa o desactiva los couriers que aparecerán en tus links de envío. Tu cliente solo verá las opciones que tengas habilitadas.
          </p>
        </div>

        {/* Lista estilo iOS — fila separada por línea interna */}
        <div style={{ background: "#F5F5F0", margin: "0 0 8px", padding: "0 20px" }}>
          <p style={{ margin: 0, padding: "8px 0", fontSize: 11, fontWeight: 600, color: "#9C9C95", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Disponibles
          </p>
        </div>

        <div style={{ background: "#fff", border: "1px solid #F0F0EB", margin: "0 20px", borderRadius: 14, overflow: "hidden" }}>
          {ALL_COURIERS.map(({ key, label }, i) => {
            const active = local.includes(key);
            const meta = COURIER_META[key] ?? { color: "#1A1A18", bg: "#F5F5F0", desc: "" };
            const isLast = i === ALL_COURIERS.length - 1;
            return (
              <button
                key={key}
                onClick={() => toggle(key)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "13px 16px", width: "100%", textAlign: "left",
                  background: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit",
                  borderBottom: isLast ? "none" : "1px solid #F5F5F0",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#FAFAF7"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
              >
                {/* Dot de color del courier */}
                <div style={{
                  width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                  background: meta.color, opacity: active ? 1 : 0.3,
                }} />

                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: active ? "#1A1A18" : "#9C9C95" }}>
                    {label}
                  </p>
                  <p style={{ margin: "1px 0 0", fontSize: 11, color: "#C8C8C2" }}>{meta.desc}</p>
                </div>

                {/* Checkmark cuando activo */}
                {active && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E8553D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>

        <p style={{ margin: "10px 20px 0", fontSize: 11, color: "#C8C8C2", lineHeight: 1.5 }}>
          Los cambios aplicarán a los links que generes a partir de ahora. Los links existentes no se modifican.
        </p>

        {/* Footer */}
        <div style={{ padding: "16px 20px 24px" }}>
          {local.length === 0 && (
            <p style={{ margin: "0 0 10px", fontSize: 12, color: "#C23E28", textAlign: "center" }}>
              Activa al menos un courier para continuar
            </p>
          )}
          <button
            onClick={handleSave}
            disabled={saving || local.length === 0}
            style={{
              width: "100%", padding: "14px", borderRadius: 12, border: "none",
              fontSize: 15, fontWeight: 600, color: "#fff", fontFamily: "inherit", cursor: "pointer",
              background: saved ? "#2D8A56" : saving || local.length === 0 ? "#D1D1CC" : "#1A1A18",
              transition: "background 0.2s",
            }}
          >
            {saving ? "Guardando…" : saved ? "✓ Guardado" : "Guardar"}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

function SettingsModal({
  askInstagram, onToggleInstagram,
  couriersHabilitados,
  onOpenCouriers,
  isPro, pymeSlug, linkFijoEnabled, defaultDims,
  onSaveLinkFijo,
  onClose,
}: {
  askInstagram: boolean;
  onToggleInstagram: (val: boolean) => Promise<void>;
  couriersHabilitados: string[];
  onOpenCouriers: () => void;
  isPro: boolean;
  pymeSlug: string;
  linkFijoEnabled: boolean;
  defaultDims: { largo: string; alto: string; ancho: string; peso: string };
  onSaveLinkFijo: (enabled: boolean, dims: { largo: string; alto: string; ancho: string; peso: string }) => Promise<void>;
  onClose: () => void;
}) {
  const [savingInsta, setSavingInsta] = useState(false);
  const [dims, setDims] = useState(defaultDims);
  const [savingDims, setSavingDims] = useState(false);
  const [savedDims, setSavedDims] = useState(false);
  const activeCount = couriersHabilitados.length;

  return (
    <ModalOverlay>
      <div style={{
        background: "#fff", borderRadius: 20, padding: "28px",
        width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        position: "relative",
      }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#9C9C95", fontFamily: "inherit", lineHeight: 1 }}>✕</button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#F5F5F0", border: "1px solid #E8E8E3", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5C5C57" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1A1A18" }}>Configuración</h2>
            <p style={{ margin: 0, fontSize: 13, color: "#9C9C95" }}>Opciones para tus links de envío</p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Instagram */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            border: "1px solid", borderColor: askInstagram ? "#E8553D" : "#E8E8E3",
            borderRadius: 12, padding: "14px 16px", transition: "border-color 0.2s",
          }}>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#1A1A18" }}>Pedir Instagram al cliente</p>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: "#9C9C95" }}>El cliente ingresa su @usuario al llenar el formulario</p>
            </div>
            <Toggle active={askInstagram} disabled={savingInsta} onChange={async () => {
              setSavingInsta(true);
              await onToggleInstagram(!askInstagram);
              setSavingInsta(false);
            }} />
          </div>

          {/* Couriers — navega al modal dedicado */}
          <button
            onClick={() => { onClose(); onOpenCouriers(); }}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              border: "1px solid #E8E8E3", borderRadius: 12, padding: "14px 16px",
              background: "#FAFAF7", cursor: "pointer", width: "100%", textAlign: "left", fontFamily: "inherit",
              transition: "border-color 0.18s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#1A1A18"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E8E8E3"; }}
          >
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#1A1A18" }}>Couriers disponibles</p>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: "#9C9C95" }}>
                {activeCount === ALL_COURIERS.length ? "Todos activos" : `${activeCount} de ${ALL_COURIERS.length} activos`}
              </p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9C9C95" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          {/* Link fijo — visible para todos los Pro */}
          {isPro && (
            <div style={{ border: "1px solid #E8E8E3", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#1A1A18" }}>Link permanente</p>
                  <p style={{ margin: "3px 0 0", fontSize: 12, color: "#9C9C95" }}>{linkFijoEnabled ? "Activo" : "Desactivado"}</p>
                </div>
                <Toggle active={linkFijoEnabled} onChange={async () => { await onSaveLinkFijo(!linkFijoEnabled, dims); }} />
              </div>

              {/* Dimensiones por defecto — siempre visible para Pro (requerido para que funcione el link fijo) */}
              {isPro && (
                <div style={{ borderTop: "1px solid #F0F0EB", padding: "14px 16px", background: "#FAFAF7" }}>
                  <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 600, color: "#1A1A18" }}>
                    Dimensiones por defecto del paquete
                    <span style={{ fontWeight: 400, color: "#9C9C95", marginLeft: 4 }}>— requerido para el link fijo</span>
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {(["largo", "alto", "ancho", "peso"] as const).map((field) => (
                      <div key={field}>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5C5C57", marginBottom: 4, textTransform: "capitalize" }}>
                          {field} {field === "peso" ? "(kg)" : "(cm)"}
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={dims[field]}
                          onChange={(e) => setDims((d) => ({ ...d, [field]: e.target.value }))}
                          placeholder={field === "peso" ? "1" : "20"}
                          style={{ width: "100%", border: "1px solid #E8E8E3", borderRadius: 8, padding: "8px 10px", fontSize: 13, color: "#1A1A18", background: "#fff", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={async () => {
                      setSavingDims(true);
                      await onSaveLinkFijo(linkFijoEnabled, dims);
                      setSavingDims(false);
                      setSavedDims(true);
                      setTimeout(() => setSavedDims(false), 2500);
                    }}
                    disabled={savingDims}
                    style={{ marginTop: 10, width: "100%", padding: "10px", borderRadius: 8, border: "none", background: savingDims ? "#D1D1CC" : savedDims ? "#2D8A56" : "#1A1A18", color: "#fff", fontSize: 13, fontWeight: 600, cursor: savingDims ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "background 0.2s" }}
                  >
                    {savingDims ? "Guardando…" : savedDims ? "✓ Guardado exitosamente" : "Guardar dimensiones"}
                  </button>
                  {linkFijoEnabled && pymeSlug && (
                    <p style={{ margin: "10px 0 0", fontSize: 11, color: "#9C9C95", fontFamily: "ui-monospace, monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {typeof window !== "undefined" ? window.location.origin : ""}/{pymeSlug}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ModalOverlay>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function CreateLinkClient() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("tienda");
  const [profile, setProfile] = useState<ProfileState>(DEFAULT_PROFILE);
  const [pkg, setPkg] = useState<PackageState>(DEFAULT_PACKAGE);

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState("");

  const [loading, setLoading] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [error, setError] = useState("");

  const [templates, setTemplates] = useState<PackageTemplate[]>([]);

  const generatedCardRef = useRef<HTMLDivElement>(null);

  // Auth
  const [user, setUser] = useState<User | null>(null);
  const [pendingAction, setPendingAction] = useState<"save" | "generate" | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showCouriersModal, setShowCouriersModal] = useState(false);
  const [pymeSlug, setPymeSlug] = useState("");
  const [linkFijoEnabled, setLinkFijoEnabled] = useState(false);
  const [defaultDims, setDefaultDims] = useState({ largo: "", alto: "", ancho: "", peso: "" });
  const [copiedFijo, setCopiedFijo] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [linksCount, setLinksCount] = useState<{ used: number; limit: number } | null>(null);
  const [askInstagram, setAskInstagram] = useState(false);
  const [couriersHabilitados, setCouriersHabilitados] = useState<string[]>(DEFAULT_COURIERS);

  const profileComplete = useMemo(() => isProfileComplete(profile), [profile]);
  const pkgComplete = useMemo(() => isPackageComplete(pkg), [pkg]);
  const isPro = linksCount?.limit === 999;
  const canGenerate = profileComplete && pkgComplete;

  const allDims = pkg.largo && pkg.alto && pkg.ancho && pkg.peso
    ? `${pkg.largo}×${pkg.alto}×${pkg.ancho} cm · ${pkg.peso} kg`
    : null;

  const searchParams = useSearchParams();

  // Auth listener
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (!data.user && searchParams.get("login") === "1") {
        setShowAuthModal(true);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Cargar perfil de pyme cuando hay usuario
  useEffect(() => {
    if (!user) {
      setLinksCount(null);
      setAskInstagram(false);
      setGeneratedUrl("");
      setTemplates([]);
      return;
    }
    // Restaurar link y templates solo si hay sesión activa
    const saved = localStorage.getItem(lastUrlKey(user.id));
    if (saved) setGeneratedUrl(saved);
    try {
      const t: PackageTemplate[] = JSON.parse(localStorage.getItem(templatesKey(user.id)) ?? "[]");
      if (t.length) setTemplates(t);
    } catch {}
    supabase
      .from("pymes")
      .select("links_creados, limite_links, ask_instagram, nombre_tienda, logo_url, origen_comuna, origen_calle, origen_numero, origen_depto, couriers_habilitados, slug, link_fijo_enabled, default_largo, default_alto, default_ancho, default_peso")
      .eq("auth_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setLinksCount({ used: data.links_creados, limit: data.limite_links });
          setAskInstagram(data.ask_instagram ?? false);
          setCouriersHabilitados(data.couriers_habilitados ?? DEFAULT_COURIERS);
          setPymeSlug(data.slug ?? "");
          setLinkFijoEnabled(data.link_fijo_enabled ?? false);
          setDefaultDims({
            largo: String(data.default_largo ?? ""),
            alto: String(data.default_alto ?? ""),
            ancho: String(data.default_ancho ?? ""),
            peso: String(data.default_peso ?? ""),
          });
          const loadedProfile: ProfileState = {
            nombrePyme: data.nombre_tienda ?? "",
            logoFile: null,
            logoPreview: data.logo_url ?? "",
            logoUrl: data.logo_url ?? "",
            origenComuna: data.origen_comuna ?? "",
            origenCalle: data.origen_calle ?? "",
            origenNumero: data.origen_numero ?? "",
            origenDepto: data.origen_depto ?? "",
          };
          // Solo sobrescribir el formulario si el DB tiene datos guardados.
          // Para nuevos usuarios el DB está vacío — no pisar lo que ya escribieron.
          if (isProfileComplete(loadedProfile)) {
            setProfile(loadedProfile);
            setActiveTab("crear");
          }
        }
      });
  }, [user]);

  useEffect(() => {
    if (generatedUrl && generatedCardRef.current) {
      setTimeout(() => {
        generatedCardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 120);
    }
  }, [generatedUrl]);

  function setP<K extends keyof ProfileState>(key: K, value: ProfileState[K]) {
    setProfile((s) => ({ ...s, [key]: value }));
  }

  function setPkg_<K extends keyof PackageState>(key: K, value: PackageState[K]) {
    setPkg((s) => ({ ...s, [key]: value }));
  }

  async function onPickLogo(file?: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      setProfile((s) => ({ ...s, logoFile: file, logoPreview: String(reader.result) }));
    reader.readAsDataURL(file);
  }

  async function doSaveProfile(currentUser: User) {
    setProfileError("");
    setProfileSaving(true);
    setProfileSaved(false);
    try {
      let logoUrl = profile.logoUrl;
      if (profile.logoFile) {
        const ext = profile.logoFile.name.split(".").pop();
        const path = `logos/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("mochidrop")
          .upload(path, profile.logoFile, { upsert: true });
        if (uploadErr) throw new Error(`Error al subir el logo: ${uploadErr.message}`);
        const { data: publicData } = supabase.storage.from("mochidrop").getPublicUrl(path);
        logoUrl = publicData.publicUrl;
        setProfile((p) => ({ ...p, logoUrl }));
      }

      await supabase.from("pymes").update({
        nombre_tienda: profile.nombrePyme.trim(),
        logo_url: logoUrl || null,
        origen_comuna: profile.origenComuna.trim(),
        origen_calle: profile.origenCalle.trim(),
        origen_numero: profile.origenNumero.trim(),
        origen_depto: profile.origenDepto.trim() || null,
      }).eq("auth_id", currentUser.id);

      setProfileSaved(true);
      setTimeout(() => {
        setActiveTab("crear");
        setProfileSaved(false);
      }, 900);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleSaveProfile() {
    if (!profileComplete) return;
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      setPendingAction("save");
      setShowAuthModal(true);
      return;
    }
    await doSaveProfile(currentUser);
  }

  async function doGenerateLink(currentUser: User) {
    setError("");
    setLoading(true);
    try {
      const { data: pymeData } = await supabase
        .from("pymes")
        .select("links_creados, limite_links, email, ask_instagram, nombre_tienda")
        .eq("auth_id", currentUser.id)
        .single();

      if (pymeData && pymeData.links_creados >= pymeData.limite_links) {
        setShowLimitModal(true);
        return;
      }

      // Usar logo ya guardado (profile.logoUrl), o subir si hay uno nuevo sin guardar
      let logoUrl = profile.logoUrl;
      if (profile.logoFile && !profile.logoUrl) {
        const ext = profile.logoFile.name.split(".").pop();
        const path = `logos/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("mochidrop")
          .upload(path, profile.logoFile, { upsert: true });
        if (uploadErr) throw new Error(`Error al subir el logo: ${uploadErr.message}`);
        const { data: publicData } = supabase.storage.from("mochidrop").getPublicUrl(path);
        logoUrl = publicData.publicUrl;
      }

      const payload = {
        nombre_pyme: profile.nombrePyme.trim(),
        logo_pyme: logoUrl,
        pyme_id: currentUser.id,
        email: pymeData?.email ?? currentUser.email ?? "",
        origen: {
          comuna: profile.origenComuna.trim(),
          calle: profile.origenCalle.trim(),
          numero: profile.origenNumero.trim(),
          depto: profile.origenDepto.trim(),
        },
        paquete: {
          largo: Number(pkg.largo),
          alto: Number(pkg.alto),
          ancho: Number(pkg.ancho),
          peso: Number(pkg.peso),
        },
        ask_instagram: askInstagram,
      };

      const res = await fetch(N8N_CREATE_LINK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `Error ${res.status}`);

      const id = data?.id;
      if (!id) throw new Error("N8N respondió OK pero no devolvió el ID del envío. Revisa el workflow en N8N.");

      const newCount = (pymeData?.links_creados ?? 0) + 1;
      // Si el perfil local no está guardado en DB (usuario recién registrado), guardarlo ahora.
      const profileAlreadySaved = Boolean(pymeData?.nombre_tienda);
      const updates: Record<string, unknown> = { links_creados: newCount };
      if (!profileAlreadySaved && isProfileComplete(profile)) {
        updates.nombre_tienda = profile.nombrePyme.trim();
        updates.logo_url = logoUrl || null;
        updates.origen_comuna = profile.origenComuna.trim();
        updates.origen_calle = profile.origenCalle.trim();
        updates.origen_numero = profile.origenNumero.trim();
        updates.origen_depto = profile.origenDepto.trim() || null;
      }
      await supabase
        .from("pymes")
        .update(updates)
        .eq("auth_id", currentUser.id);
      setLinksCount((prev) => prev ? { ...prev, used: newCount } : prev);

      // Guardar snapshot de couriers en el envío
      await supabase.from("envios").update({ couriers_habilitados: couriersHabilitados }).eq("id", Number(id));

      const slug = slugify(profile.nombrePyme);
      const code = Number(id).toString(36);
      const base = slug ? `/${slug}/envio/${code}` : `/envio?id=${id}`;
      const newUrl = `${window.location.origin}${base}`;
      localStorage.setItem(lastUrlKey(user!.id), newUrl);
      setGeneratedUrl(newUrl);
      saveTemplate(pkg, user!.id);
      setTemplates(() => {
        try { return JSON.parse(localStorage.getItem(templatesKey(user!.id)) ?? "[]"); } catch { return []; }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    if (!canGenerate) return;
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      setPendingAction("generate");
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

  function linkFijoUrl() {
    return `${typeof window !== "undefined" ? window.location.origin : ""}/${pymeSlug}`;
  }

  async function copyLinkFijo() {
    await navigator.clipboard.writeText(linkFijoUrl()).catch(() => {});
    setCopiedFijo(true);
    setTimeout(() => setCopiedFijo(false), 2500);
  }

  async function handleSaveLinkFijo(enabled: boolean, dims: { largo: string; alto: string; ancho: string; peso: string }) {
    setLinkFijoEnabled(enabled);
    setDefaultDims(dims);
    if (user) {
      const updates: Record<string, unknown> = {
        link_fijo_enabled: enabled,
        default_largo: Number(dims.largo) || null,
        default_alto: Number(dims.alto) || null,
        default_ancho: Number(dims.ancho) || null,
        default_peso: Number(dims.peso) || null,
      };
      // Auto-generate slug on first enable if account doesn't have one yet
      if (enabled && !pymeSlug && profile.nombrePyme) {
        const generatedSlug = slugify(profile.nombrePyme);
        if (generatedSlug) {
          updates.slug = generatedSlug;
          setPymeSlug(generatedSlug);
        }
      }
      await supabase.from("pymes").update(updates).eq("auth_id", user.id);
    }
  }

  async function copyWhatsAppMsg() {
    if (!generatedUrl) return;
    const msg = `Para coordinar tu pedido necesito que completes este formulario con tus datos: 👉 ${generatedUrl} Es rápido, menos de 1 minuto 🙌 — ${profile.nombrePyme}`;
    await navigator.clipboard.writeText(msg).catch(() => {});
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2500);
  }

  return (
    <div style={{ overflowX: "hidden" }}>
      <style>{`
        .gen-body { padding: 40px 24px 100px; }
        .gen-grid-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .gen-grid-4col { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; }
        .gen-header-email { display: inline; }
        .gen-links-count { display: inline; }
        @media (max-width: 640px) {
          .gen-body { padding: 24px 16px 80px; }
          .gen-grid-2col { grid-template-columns: 1fr; }
          .gen-grid-4col { grid-template-columns: 1fr 1fr; }
          .gen-header-email { display: none; }
          .gen-links-count { font-size: 11px; }
        }
        @keyframes link-slide-up {
          0% { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes confirm-pop {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .link-slide-up { animation: link-slide-up 0.3s ease both; }
        .confirm-icon { animation: confirm-pop 0.3s ease-out both; }
        @keyframes pulse-live {
          0%, 100% { box-shadow: 0 0 0 0 rgba(45,138,86,0.5); }
          50% { box-shadow: 0 0 0 5px rgba(45,138,86,0); }
        }
        .dot-live { animation: pulse-live 1.8s ease-in-out infinite; }
      `}</style>

      {/* Modales */}
      {showSettingsModal && (
        <SettingsModal
          askInstagram={askInstagram}
          onToggleInstagram={async (val) => {
            setAskInstagram(val);
            if (user) await supabase.from("pymes").update({ ask_instagram: val }).eq("auth_id", user.id);
          }}
          couriersHabilitados={couriersHabilitados}
          onOpenCouriers={() => setShowCouriersModal(true)}
          isPro={isPro}
          pymeSlug={pymeSlug}
          linkFijoEnabled={linkFijoEnabled}
          defaultDims={defaultDims}
          onSaveLinkFijo={handleSaveLinkFijo}
          onClose={() => setShowSettingsModal(false)}
        />
      )}
      {showCouriersModal && (
        <CouriersModal
          couriersHabilitados={couriersHabilitados}
          onSave={async (couriers) => {
            setCouriersHabilitados(couriers);
            if (user) await supabase.from("pymes").update({ couriers_habilitados: couriers }).eq("auth_id", user.id);
          }}
          onClose={() => setShowCouriersModal(false)}
        />
      )}
      {showAuthModal && (
        <AuthModal
          onClose={() => { setShowAuthModal(false); setPendingAction(null); }}
          onSuccess={async () => {
            setShowAuthModal(false);
            const { data: { user: u } } = await supabase.auth.getUser();
            if (u) {
              if (pendingAction === "save") await doSaveProfile(u);
              else if (pendingAction === "generate") await doGenerateLink(u);
            }
            setPendingAction(null);
          }}
        />
      )}
      {showLimitModal && <LimitModal onClose={() => setShowLimitModal(false)} />}

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
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
              <text x="44" y="21" fontFamily="'Instrument Sans', sans-serif" fontSize="15" fontWeight="600">
                <tspan fill="#1A1A18">link</tspan><tspan fill="#E8553D">drop</tspan>
              </text>
            </svg>
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {user && (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {linksCount && (
                  isPro ? (
                    <span className="gen-links-count" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "#2D8A56", background: "#F0FAF4", border: "1px solid #B8E2C8", borderRadius: 100, padding: "3px 10px" }}>
                      ✦ Plan Pro
                    </span>
                  ) : (
                    <span className="gen-links-count" style={{ fontSize: 12, color: "#5C5C57", fontWeight: 500 }}>
                      <span style={{ fontWeight: 700, color: linksCount.used >= linksCount.limit ? "#C23E28" : "#1A1A18" }}>
                        {linksCount.used}
                      </span>
                      <span style={{ color: "#9C9C95" }}> / {linksCount.limit} links</span>
                    </span>
                  )
                )}
                <span className="gen-header-email" style={{ fontSize: 12, color: "#9C9C95" }}>{user.email}</span>
                <button
                  onClick={() => setShowSettingsModal(true)}
                  title="Configuración"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, background: "none", border: "1px solid #E8E8E3", borderRadius: 8, cursor: "pointer", color: "#5C5C57", flexShrink: 0 }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </button>
                <button
                  onClick={() => supabase.auth.signOut()}
                  style={{ fontSize: 12, color: "#5C5C57", background: "none", border: "1px solid #E8E8E3", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontFamily: "inherit" }}
                >
                  Salir
                </button>
              </div>
            )}
            {!user && (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <a href="/" style={{ fontSize: 13, color: "#5C5C57", textDecoration: "none", fontWeight: 500 }}>
                  ← Volver al inicio
                </a>
                <button
                  onClick={() => { setPendingAction(null); setShowAuthModal(true); }}
                  title="Iniciar sesión"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: 34, height: 34, borderRadius: "50%",
                    background: "#F5F5F0", border: "1px solid #E8E8E3",
                    cursor: "pointer", color: "#5C5C57", flexShrink: 0,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1000, margin: "0 auto" }} className="gen-body">

        {/* Page header */}
        <div style={{ marginBottom: 28, textAlign: "center" }}>
          <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: "#E8553D", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Crear link de envío
          </p>
          <h1 style={{ margin: "0 0 10px", fontSize: 28, fontWeight: 700, color: "#1A1A18", lineHeight: 1.2 }}>
            Tu cliente elige courier y paga solo.
          </h1>
          <p style={{ margin: 0, fontSize: 15, color: "#5C5C57" }}>
            Configura tu tienda una vez — después crear links toma menos de 30 segundos.
          </p>
        </div>

        {/* ── TabBar ─────────────────────────────────────────────────────────── */}
        <div style={{
          display: "flex", gap: 4,
          background: "#F0F0EB", borderRadius: 14, padding: 4,
          marginBottom: 28, maxWidth: 400,
        }}>
          {([
            { id: "tienda", label: "Mi Tienda" },
            { id: "crear", label: "Crear Link" },
          ] as { id: ActiveTab; label: string }[]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, padding: "10px 0", borderRadius: 10, border: "none",
                fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
                transition: "all 0.18s",
                background: activeTab === tab.id ? "#fff" : "transparent",
                color: activeTab === tab.id ? "#1A1A18" : "#9C9C95",
                boxShadow: activeTab === tab.id ? "0 1px 6px rgba(0,0,0,0.1)" : "none",
              }}
            >
              {tab.label}
              {tab.id === "tienda" && profileComplete && (
                <span style={{
                  display: "inline-block", width: 6, height: 6, borderRadius: "50%",
                  background: "#2D8A56", marginLeft: 6, verticalAlign: "middle", marginTop: -2,
                }} />
              )}
            </button>
          ))}
        </div>

        {/* ── Two-column grid ────────────────────────────────────────────────── */}
        <div style={{ display: "grid", gap: 24, gridTemplateColumns: "1fr" }} className="gen-grid">

          {/* ── LEFT: Form ─────────────────────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* ════ TAB 1: Mi Tienda ════ */}
            {activeTab === "tienda" && (
              <>
                {/* 1 — Identidad */}
                <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E8E8E3", padding: "24px", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
                  <SectionTitle n={1} label="Tu tienda" />
                  <p style={{ margin: "-8px 0 18px", fontSize: 13, color: "#9C9C95" }}>
                    Aparece en el encabezado del link que ve tu cliente.
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <Field label="Nombre *">
                      <TextInput
                        value={profile.nombrePyme}
                        onChange={(v) => setP("nombrePyme", v)}
                        placeholder="Ej: Tienda Luna"
                      />
                    </Field>
                    <Field label="Logo" hint="Opcional — dale cara a tu tienda">
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: 10,
                          background: "#F5F5F0", border: "1px solid #E8E8E3",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          overflow: "hidden", flexShrink: 0,
                        }}>
                          {profile.logoPreview ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={profile.logoPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <span style={{ fontSize: 20 }}>🏪</span>
                          )}
                        </div>
                        <label style={{
                          cursor: "pointer", background: "#F5F5F0",
                          border: "1px solid #E8E8E3", borderRadius: 8,
                          padding: "8px 14px", fontSize: 13, fontWeight: 600, color: "#1A1A18",
                        }}>
                          {profile.logoPreview ? "Cambiar" : "Subir logo"}
                          <input type="file" accept="image/*" style={{ display: "none" }}
                            onChange={(e) => onPickLogo(e.target.files?.[0])} />
                        </label>
                        {profile.logoPreview && (
                          <button type="button"
                            onClick={() => setProfile((s) => ({ ...s, logoFile: null, logoPreview: "", logoUrl: "" }))}
                            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#9C9C95", fontFamily: "inherit" }}>
                            Quitar
                          </button>
                        )}
                      </div>
                    </Field>
                  </div>
                </div>

                {/* 2 — Dirección de retiro */}
                <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E8E8E3", padding: "24px", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
                  <SectionTitle n={2} label="Dirección de retiro" />
                  <p style={{ margin: "-8px 0 18px", fontSize: 13, color: "#9C9C95" }}>
                    El courier viene aquí a buscar el paquete. También calcula el precio desde esta dirección.
                  </p>
                  <div className="gen-grid-2col">
                    <Field label="Comuna *">
                      <TextInput value={profile.origenComuna} onChange={(v) => setP("origenComuna", v)} placeholder="Ej: Las Condes" />
                    </Field>
                    <Field label="Calle *">
                      <TextInput value={profile.origenCalle} onChange={(v) => setP("origenCalle", v)} placeholder="Ej: Av. El Bosque" />
                    </Field>
                  </div>
                  <div style={{ marginTop: 12 }} className="gen-grid-2col">
                    <Field label="Número *">
                      <TextInput value={profile.origenNumero} onChange={(v) => setP("origenNumero", v)} placeholder="Ej: 500" />
                    </Field>
                    <Field label="Depto / Piso">
                      <TextInput value={profile.origenDepto} onChange={(v) => setP("origenDepto", v)} placeholder="Opcional" />
                    </Field>
                  </div>
                </div>

                {profileError && (
                  <div style={{ background: "#FFF0ED", border: "1px solid #E8553D", borderRadius: 12, padding: "12px 16px", fontSize: 13, color: "#C23E28" }}>
                    {profileError}
                  </div>
                )}

                <button
                  onClick={handleSaveProfile}
                  disabled={!profileComplete || profileSaving}
                  style={{
                    width: "100%", padding: "16px", borderRadius: 14, border: "none",
                    fontSize: 16, fontWeight: 700, color: "#fff", fontFamily: "inherit",
                    cursor: profileComplete && !profileSaving ? "pointer" : "not-allowed",
                    background: profileSaved ? "#2D8A56" : profileComplete && !profileSaving ? "#E8553D" : "#D1D1CC",
                    boxShadow: profileComplete && !profileSaving ? "0 4px 20px rgba(232,85,61,0.3)" : "none",
                    transition: "all 0.2s",
                  }}
                >
                  {profileSaving ? "Guardando…" : profileSaved ? "✓ Guardado" : "Guardar y continuar →"}
                </button>

                {!profileComplete && (
                  <p style={{ textAlign: "center", fontSize: 12, color: "#9C9C95", margin: "-8px 0 0" }}>
                    Completa los campos marcados con * para continuar
                  </p>
                )}
              </>
            )}

            {/* ════ TAB 2: Crear Link ════ */}
            {activeTab === "crear" && (
              <>
                {/* Banner de tienda guardada */}
                {profileComplete ? (
                  <div style={{
                    background: "#F5FBF7", border: "1px solid rgba(45,138,86,0.2)",
                    borderRadius: 14, padding: "14px 18px",
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                        background: profile.logoPreview ? "transparent" : "#E8553D",
                        border: "1px solid rgba(0,0,0,0.06)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        overflow: "hidden",
                      }}>
                        {profile.logoPreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={profile.logoPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <span style={{ fontSize: 18 }}>🏪</span>
                        )}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1A1A18" }}>
                          {profile.nombrePyme}
                        </p>
                        <p style={{ margin: 0, fontSize: 12, color: "#5C5C57" }}>
                          📍 {profile.origenComuna}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab("tienda")}
                      style={{
                        background: "none", border: "1px solid #D1D1CC", borderRadius: 8,
                        padding: "6px 12px", fontSize: 12, fontWeight: 600, color: "#5C5C57",
                        cursor: "pointer", fontFamily: "inherit", flexShrink: 0,
                      }}
                    >
                      Editar
                    </button>
                  </div>
                ) : (
                  <div style={{
                    background: "#FFF0ED", border: "1px solid rgba(232,85,61,0.2)",
                    borderRadius: 14, padding: "16px 18px",
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                  }}>
                    <p style={{ margin: 0, fontSize: 14, color: "#C23E28", fontWeight: 500 }}>
                      Primero configura los datos de tu tienda para poder generar links.
                    </p>
                    <button
                      onClick={() => setActiveTab("tienda")}
                      style={{
                        background: "#E8553D", border: "none", borderRadius: 8,
                        padding: "8px 14px", fontSize: 13, fontWeight: 700, color: "#fff",
                        cursor: "pointer", fontFamily: "inherit", flexShrink: 0,
                      }}
                    >
                      Configurar →
                    </button>
                  </div>
                )}

                {/* ── Pro: hero link permanente ── */}
                {isPro && linkFijoEnabled && pymeSlug && (
                  <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #E8E8E3", overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
                    <div style={{ padding: "28px 24px 20px", textAlign: "center", borderBottom: "1px solid #F0F0EB" }}>
                      <div style={{ width: 64, height: 64, borderRadius: 18, margin: "0 auto 14px", background: profile.logoPreview ? "transparent" : "#1A1A18", border: "1px solid #E8E8E3", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.1)" }}>
                        {profile.logoPreview
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={profile.logoPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <span style={{ fontSize: 26 }}>🏪</span>}
                      </div>
                      <p style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 700, color: "#1A1A18", letterSpacing: "-0.02em" }}>{profile.nombrePyme || "Tu Tienda"}</p>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "#5C5C57", background: "#F5F5F0", border: "1px solid #E8E8E3", borderRadius: 100, padding: "3px 10px" }}>
                        <span className="dot-live" style={{ width: 7, height: 7, borderRadius: "50%", background: "#2D8A56", display: "inline-block", flexShrink: 0 }} />
                        Activo
                      </span>
                      <p style={{ margin: "10px 0 0", fontSize: 13, color: "#9C9C95", lineHeight: 1.4 }}>Compártelo con todos tus clientes — siempre lleva al mismo lugar.</p>
                    </div>
                    <div style={{ padding: "16px 20px 0" }}>
                      <div style={{ background: "#F8F8F5", border: "1px solid #E8E8E3", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                        <p style={{ margin: 0, flex: 1, fontSize: 12, color: "#5C5C57", fontFamily: "ui-monospace, monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{linkFijoUrl()}</p>
                        <a href={linkFijoUrl()} target="_blank" rel="noreferrer" style={{ flexShrink: 0, color: "#9C9C95", display: "flex" }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </a>
                      </div>
                    </div>
                    <div style={{ padding: "10px 20px 16px" }}>
                      <button onClick={copyLinkFijo} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: "inherit", cursor: "pointer", transition: "background 0.2s", background: copiedFijo ? "#C23E28" : "#E8553D", boxShadow: copiedFijo ? "none" : "0 4px 16px rgba(232,85,61,0.35)" }}>
                        {copiedFijo ? "✓ Copiado" : "Copiar link"}
                      </button>
                    </div>
                    <div style={{ borderTop: "1px solid #F0F0EB", padding: "12px 20px 16px", display: "flex", gap: 8 }}>
                      <a href={`https://wa.me/?text=${encodeURIComponent(`¡Hola! Coordina tu envío directamente desde aquí: 👉 ${linkFijoUrl()} — ${profile.nombrePyme}`)}`} target="_blank" rel="noreferrer" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 0", borderRadius: 10, border: "1px solid #E8E8E3", background: "#fff", fontSize: 13, fontWeight: 600, color: "#1A1A18", textDecoration: "none" }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" /></svg>
                        WhatsApp
                      </a>
                      <button onClick={() => { if (typeof navigator !== "undefined" && navigator.share) { navigator.share({ title: profile.nombrePyme, url: linkFijoUrl() }); } else { copyLinkFijo(); } }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 0", borderRadius: 10, border: "1px solid #E8E8E3", background: "#fff", fontSize: 13, fontWeight: 600, color: "#1A1A18", cursor: "pointer", fontFamily: "inherit" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5C5C57" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" /></svg>
                        Compartir
                      </button>
                    </div>
                  </div>
                )}

                {/* Pro sin link fijo: CTA para activarlo */}
                {isPro && !linkFijoEnabled && (
                  <div style={{ background: "#F5FBF7", border: "1.5px dashed rgba(45,138,86,0.35)", borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 700, color: "#1A1A18" }}>Activa tu link permanente</p>
                      <p style={{ margin: 0, fontSize: 12, color: "#5C5C57" }}>Con tu plan Pro puedes tener un link fijo de tienda que nunca cambia.</p>
                    </div>
                    <button onClick={() => setShowSettingsModal(true)} style={{ flexShrink: 0, background: "#2D8A56", border: "none", borderRadius: 10, padding: "9px 14px", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>Activar →</button>
                  </div>
                )}

                {/* Toggle colapsable para link manual (solo Pro con link fijo) */}
                {isPro && linkFijoEnabled && pymeSlug && (
                  <button
                    onClick={() => { setShowManual((v) => !v); setGeneratedUrl(""); setPkg(DEFAULT_PACKAGE); }}
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderRadius: 12, border: "1px solid #E8E8E3", background: "#FAFAF7", fontSize: 14, fontWeight: 600, color: "#5C5C57", cursor: "pointer", fontFamily: "inherit" }}
                  >
                    <span>Generar link con dimensiones específicas</span>
                    <span style={{ fontSize: 18, fontWeight: 400, color: "#9C9C95", display: "inline-block", transform: showManual ? "rotate(45deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>+</span>
                  </button>
                )}

                {/* Paquete — siempre visible si no Pro+linkFijo, colapsable si sí */}
                {(!(isPro && linkFijoEnabled && pymeSlug) || showManual) && (
                <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E8E8E3", padding: "24px", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
                  <SectionTitle n={1} label="Dimensiones del paquete" />
                  {templates.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "-4px 0 16px" }}>
                      {templates.map((t) => (
                        <button
                          key={t.label}
                          onClick={() => setPkg({ largo: t.largo, alto: t.alto, ancho: t.ancho, peso: t.peso })}
                          style={{
                            background: "#F5F5F0", border: "1px solid #E8E8E3",
                            borderRadius: 100, padding: "4px 11px",
                            fontSize: 11, fontWeight: 500, color: "#5C5C57",
                            cursor: "pointer", fontFamily: "inherit",
                            transition: "border-color 0.15s, color 0.15s",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#E8553D"; e.currentTarget.style.color = "#E8553D"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E8E8E3"; e.currentTarget.style.color = "#5C5C57"; }}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  )}
                  <p style={{ margin: "-8px 0 18px", fontSize: 13, color: "#9C9C95" }}>
                    Para cotizar el precio real de cada courier.
                  </p>
                  <div className="gen-grid-4col">
                    <Field label="Largo (cm) *">
                      <TextInput value={pkg.largo} onChange={(v) => setPkg_("largo", v.replace(/[^\d.]/g, ""))} placeholder="30" type="number" />
                    </Field>
                    <Field label="Alto (cm) *">
                      <TextInput value={pkg.alto} onChange={(v) => setPkg_("alto", v.replace(/[^\d.]/g, ""))} placeholder="20" type="number" />
                    </Field>
                    <Field label="Ancho (cm) *">
                      <TextInput value={pkg.ancho} onChange={(v) => setPkg_("ancho", v.replace(/[^\d.]/g, ""))} placeholder="15" type="number" />
                    </Field>
                    <Field label="Peso (kg) *">
                      <TextInput value={pkg.peso} onChange={(v) => setPkg_("peso", v.replace(/[^\d.]/g, ""))} placeholder="1.5" type="number" />
                    </Field>
                  </div>
                  <p style={{ margin: "12px 0 0", fontSize: 12, color: "#9C9C95" }}>
                    Sin los datos exactos, estima por exceso.
                  </p>
                </div>
                )}

                {/* Error */}
                {error && (
                  <div style={{ background: "#FFF0ED", border: "1px solid #E8553D", borderRadius: 12, padding: "12px 16px", fontSize: 13, color: "#C23E28" }}>
                    {error}
                  </div>
                )}

                {/* Generate button */}
                <button
                  onClick={handleGenerate}
                  disabled={!canGenerate || loading}
                  style={{
                    width: "100%", padding: "16px", borderRadius: 14, border: "none",
                    fontSize: 16, fontWeight: 700, color: "#fff", fontFamily: "inherit",
                    cursor: canGenerate && !loading ? "pointer" : "not-allowed",
                    background: canGenerate && !loading ? "#E8553D" : "#D1D1CC",
                    boxShadow: canGenerate && !loading ? "0 4px 20px rgba(232,85,61,0.3)" : "none",
                    transition: "all 0.2s",
                  }}
                >
                  {loading ? "Generando link…" : "Generar link de envío →"}
                </button>

                {!pkgComplete && profileComplete && !generatedUrl && (
                  <p style={{ textAlign: "center", fontSize: 12, color: "#9C9C95", margin: "-8px 0 0" }}>
                    Completa las dimensiones del paquete para continuar
                  </p>
                )}

                {generatedUrl && (
                  <div ref={generatedCardRef} style={{ padding: "4px 0 0" }}>
                    <button
                      onClick={() => { if (user) localStorage.removeItem(lastUrlKey(user.id)); setGeneratedUrl(""); setPkg(DEFAULT_PACKAGE); }}
                      style={{
                        width: "100%", padding: "13px", borderRadius: 12,
                        border: "1.5px solid #E8E8E3", background: "transparent",
                        fontSize: 14, fontWeight: 500, color: "#5C5C57",
                        cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      Crear otro link
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── RIGHT: Preview / Link generado ─────────────────────────────── */}
          <div style={{ position: "sticky", top: 76, height: "fit-content" }}>
            <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 700, color: "#9C9C95", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {generatedUrl
                ? (isPro && linkFijoEnabled && pymeSlug ? "Link puntual · 48h" : "Tu link")
                : (isPro && linkFijoEnabled && pymeSlug ? "Tu cuenta" : "Así lo ve tu cliente")}
            </p>

            {/* ── Link generado en el panel derecho ── */}
            {generatedUrl && (
              <div className="link-slide-up" style={{
                background: "#fff", borderRadius: 16,
                border: "1px solid #F0F0EB", overflow: "hidden",
              }}>
                {/* Confirmación */}
                <div style={{ padding: "24px 20px 16px", textAlign: "center", borderBottom: "1px solid #F0F0EB" }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%",
                    background: "#fdf3f0",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 12px",
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E84B2A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <p style={{ margin: 0, fontSize: 17, fontWeight: 500, color: "#1A1A18", letterSpacing: "-0.02em" }}>
                    ¡Link listo para compartir!
                  </p>
                </div>

                {/* URL card */}
                <div style={{ padding: "16px 16px 12px" }}>
                  <div style={{
                    background: "#fdf3f0", borderRadius: 12,
                    padding: "12px 14px",
                    display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <p style={{
                      margin: 0, flex: 1,
                      fontFamily: "ui-monospace, 'Cascadia Code', monospace",
                      fontSize: 11, fontWeight: 400, color: "#c0391b",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {generatedUrl}
                    </p>
                    <button onClick={copyUrl} title={copied ? "Copiado" : "Copiar link"} style={{
                      flexShrink: 0, width: 30, height: 30, borderRadius: 8,
                      border: "none", background: copied ? "#c93d27" : "#E84B2A",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", transition: "background 0.15s",
                    }}>
                      {copied ? (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {allDims && (
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 10 }}>
                      {[allDims, `${couriersHabilitados.length} courier${couriersHabilitados.length !== 1 ? "s" : ""}`, "Válido 48h"].map((chip) => (
                        <span key={chip} style={{
                          background: "#F5F5F0", borderRadius: 100,
                          padding: "3px 10px", fontSize: 10, color: "#5C5C57",
                        }}>{chip}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Compartir */}
                <div style={{ borderTop: "1px solid #F0F0EB", padding: "12px 16px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`Para coordinar tu pedido necesito que completes este formulario con tus datos: 👉 ${generatedUrl} Es rápido, menos de 1 minuto 🙌 — ${profile.nombrePyme}`)}`}
                      target="_blank" rel="noreferrer"
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: "10px 6px", borderRadius: 10, border: "1px solid #F0F0EB", background: "#fff", fontSize: 10, fontWeight: 500, color: "#1A1A18", textDecoration: "none" }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                      </svg>
                      WhatsApp
                    </a>
                    <a
                      href={`mailto:?subject=${encodeURIComponent(`Link de envío — ${profile.nombrePyme}`)}&body=${encodeURIComponent(`Hola, para coordinar tu pedido completa este formulario: ${generatedUrl}`)}`}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: "10px 6px", borderRadius: 10, border: "1px solid #F0F0EB", background: "#fff", fontSize: 10, fontWeight: 500, color: "#1A1A18", textDecoration: "none" }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5C5C57" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 7l10 7 10-7" />
                      </svg>
                      Email
                    </a>
                    <button
                      onClick={() => { if (typeof navigator !== "undefined" && navigator.share) { navigator.share({ title: `Link de envío — ${profile.nombrePyme}`, url: generatedUrl }); } else { copyUrl(); } }}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: "10px 6px", borderRadius: 10, border: "1px solid #F0F0EB", background: "#fff", fontSize: 10, fontWeight: 500, color: "#1A1A18", cursor: "pointer", fontFamily: "inherit" }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5C5C57" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                        <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
                      </svg>
                      Compartir
                    </button>
                  </div>
                </div>

                {/* Cuota */}
                {linksCount && !isPro && (
                  <div style={{ borderTop: "1px solid #F0F0EB", padding: "12px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <p style={{ margin: 0, fontSize: 11, color: "#9C9C95" }}>Links usados</p>
                      <p style={{ margin: 0, fontSize: 11, fontWeight: 500, color: linksCount.used >= linksCount.limit ? "#E84B2A" : "#1A1A18" }}>
                        {linksCount.used} / {linksCount.limit}
                      </p>
                    </div>
                    <div style={{ height: 3, background: "#F0F0EB", borderRadius: 100, overflow: "hidden" }}>
                      <div style={{
                        height: "100%",
                        width: `${Math.min((linksCount.used / linksCount.limit) * 100, 100)}%`,
                        background: linksCount.used >= linksCount.limit ? "#E84B2A" : "#1A1A18",
                        borderRadius: 100, transition: "width 0.4s ease",
                      }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Panel derecho: Pro dashboard o preview ── */}
            {!generatedUrl && isPro && linkFijoEnabled && pymeSlug ? (
              /* Pro dashboard — reemplaza el preview */
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

                {/* Estado del link fijo */}
                <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E8E8E3", overflow: "hidden" }}>
                  <div style={{ padding: "16px 18px", borderBottom: "1px solid #F0F0EB", display: "flex", alignItems: "center", gap: 10 }}>
                    <span className="dot-live" style={{ width: 8, height: 8, borderRadius: "50%", background: "#2D8A56", display: "inline-block", flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1A1A18" }}>Tu link está activo</p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9C9C95", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "ui-monospace, monospace" }}>
                        {linkFijoUrl()}
                      </p>
                    </div>
                    <a href={linkFijoUrl()} target="_blank" rel="noreferrer" style={{ flexShrink: 0, color: "#9C9C95", display: "flex" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                  </div>
                  <button onClick={copyLinkFijo} style={{ width: "100%", padding: "13px 18px", border: "none", background: copiedFijo ? "#C23E28" : "#E8553D", fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit", transition: "background 0.15s" }}>
                    {copiedFijo ? "✓ Copiado" : "Copiar link"}
                  </button>
                </div>

                {/* Couriers activos — acceso rápido */}
                <button
                  onClick={() => setShowCouriersModal(true)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderRadius: 14, border: "1px solid #E8E8E3", background: "#fff", cursor: "pointer", fontFamily: "inherit", width: "100%", textAlign: "left" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#1A1A18"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E8E8E3"; }}
                >
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1A1A18" }}>Couriers</p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9C9C95" }}>
                      {couriersHabilitados.length === ALL_COURIERS.length ? "Todos activos" : `${couriersHabilitados.length} de ${ALL_COURIERS.length} activos`}
                    </p>
                  </div>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9C9C95" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>

                {/* Configuración rápida */}
                <button
                  onClick={() => setShowSettingsModal(true)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderRadius: 14, border: "1px solid #E8E8E3", background: "#fff", cursor: "pointer", fontFamily: "inherit", width: "100%", textAlign: "left" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#1A1A18"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E8E8E3"; }}
                >
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1A1A18" }}>Configuración</p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9C9C95" }}>Instagram, link permanente y más</p>
                  </div>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9C9C95" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>

                {/* Plan / Links usados */}
                <div style={{ padding: "14px 16px", borderRadius: 14, border: "1px solid #B8E2C8", background: "#F0FAF4" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1A1A18" }}>Plan Pro</p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "#2D8A56" }}>Links ilimitados · sin restricciones</p>
                    </div>
                    <span style={{ fontSize: 16 }}>✦</span>
                  </div>
                </div>
              </div>
            ) : !generatedUrl ? (
              /* Preview normal (no Pro o sin link fijo) */
              <>
              <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #E8E8E3", overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
              {/* Header de la tienda */}
              <div style={{ background: "#FAFAF7", padding: "14px 16px", borderBottom: "1px solid #E8E8E3", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: profile.logoPreview ? "transparent" : "#E8553D",
                  display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0,
                }}>
                  {profile.logoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.logoPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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
                    {profile.nombrePyme || "Tu Tienda"}
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
            </>
            ) : null}
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
