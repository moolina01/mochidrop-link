"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/utils/supabase";
import type { User } from "@supabase/supabase-js";

// ─── Constantes ───────────────────────────────────────────────────────────────

const N8N_CREATE_LINK = "/api/crear-envio";
const templatesKey = (uid: string) => `ld_pkg_templates_${uid}`;
const lastUrlKey = (uid: string) => `ld_last_url_${uid}`;
const lastEnvioIdKey = (uid: string) => `ld_last_envio_id_${uid}`;

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

type DeliveryPropioState = {
  enabled: boolean;
  precio: string;
  telefono: string;
  banco: string;
  cuenta: string;
  titular: string;
  rut: string;
  email: string;
};

const DEFAULT_DELIVERY_PROPIO: DeliveryPropioState = {
  enabled: false, precio: "", telefono: "", banco: "",
  cuenta: "", titular: "", rut: "", email: "",
};

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

type ActiveTab = "tienda" | "crear" | "envios";

type EnvioResumen = {
  id: number;
  datos_destino: { nombre: string; comuna: string; telefono?: string };
  courier: string;
  tracking: string;
  created_at: string;
  pickup_agendado?: boolean;
  pickup_id?: string;
  pickup_date?: string;
  pickup_time_from?: number;
  pickup_time_to?: number;
  pickup_status?: string;
  pickup_attempts?: number;
  tracking_url?: string;
  label_url?: string;
};

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

const COMUNAS_CHILE = [
  "Alhué","Alto Biobío","Alto del Carmen","Alto Hospicio","Ancud","Andacollo","Angol","Antofagasta","Antuco","Arauco",
  "Arica","Aysén","Buin","Bulnes","Cabildo","Cabrero","Calama","Caldera","Calera","Calera de Tango","Calle Larga",
  "Camarones","Camiña","Canela","Cañete","Carahue","Cartagena","Casablanca","Castro","Catemu","Cauquenes",
  "Cerrillos","Cerro Navia","Chaitén","Chañaral","Chépica","Chiguayante","Chile Chico","Chillán","Chillán Viejo",
  "Chimbarongo","Cholchol","Chonchi","Cisnes","Cobquecura","Cochamó","Coelemu","Coihueco","Colbún","Colchane",
  "Colina","Collipulli","Coltauco","Combarbalá","Concepción","Conchalí","Constitución","Contulmo","Copiapó",
  "Coquimbo","Coronel","Corral","Coyhaique","Cunco","Curacautín","Curacaví","Curanilahue","Curarrehue","Curepto",
  "Curicó","Diego de Almagro","Doñihue","El Bosque","El Carmen","El Monte","El Quisco","El Tabo","Empedrado",
  "Ercilla","Estación Central","Florida","Freire","Freirina","Fresia","Frutillar","Futaleufú","Futrono",
  "Galvarino","General Lagos","Graneros","Guaitecas","Hijuelas","Hualaihué","Hualañé","Hualpén","Huara",
  "Huasco","Huechuraba","Illapel","Independencia","Iquique","Isla de Maipo","Isla de Pascua","Juan Fernández",
  "La Calera","La Cisterna","La Cruz","La Estrella","La Florida","La Granja","La Higuera","La Ligua",
  "La Pintana","La Reina","La Serena","La Unión","Lago Ranco","Lago Verde","Laguna Blanca","Lampa","Lanco",
  "Las Cabras","Las Condes","Lautaro","Lebu","Licantén","Limache","Linares","Lo Barnechea","Lo Espejo",
  "Lo Prado","Lolol","Loncoche","Longaví","Lonquimay","Los Andes","Los Álamos","Los Lagos","Los Muermos",
  "Los Sauces","Los Vilos","Lota","Lumaco","Macul","Maipú","Malloa","Marchihue","María Elena","María Pinto",
  "Mariquina","Maule","Máfil","Melipilla","Molina","Monte Patria","Mostazal","Mulchén","Nancagua","Navidad",
  "Negrete","Ninhue","Nogales","Nueva Imperial","Ñiquén","Ñuñoa","Olivar","Olmué","Ovalle","Paine","Palena",
  "Palmilla","Panguipulli","Papudo","Paredones","Parral","Pedro Aguirre Cerda","Pelarco","Pelluhue","Pemuco",
  "Peñaflor","Peñalolén","Peralillo","Perquenco","Petorca","Peumo","Pica","Pichidegua","Pichilemu","Pirque",
  "Pitrufquén","Placilla","Portezuelo","Pozo Almonte","Primavera","Providencia","Puchuncaví","Pudahuel",
  "Puente Alto","Puerto Montt","Puerto Natales","Puerto Octay","Puerto Varas","Puerto Williams","Punitaqui",
  "Punta Arenas","Puqueldón","Purén","Putaendo","Queilén","Quellón","Quemchi","Quilaco","Quilicura","Quilleco",
  "Quillón","Quillota","Quinchao","Quinta de Tilcoco","Quinta Normal","Quintero","Quirihue","Rancagua","Rauco",
  "Recoleta","Renaico","Renca","Rengo","Requínoa","Retiro","Rinconada","Río Bueno","Río Claro","Río Hurtado",
  "Río Ibáñez","Río Negro","Río Verde","Romeral","Sagrada Familia","San Antonio","San Bernardo","San Carlos",
  "San Clemente","San Esteban","San Felipe","San Fernando","San Gregorio","San Ignacio","San Javier",
  "San Joaquín","San José de Maipo","San Juan de la Costa","San Miguel","San Nicolás","San Pablo","San Pedro",
  "San Pedro de Atacama","San Pedro de la Paz","San Rafael","San Ramón","San Rosendo","San Vicente",
  "Santa Bárbara","Santa Cruz","Santiago","Santo Domingo","Sierra Gorda","Talca","Talcahuano","Talagante",
  "Taltal","Temuco","Teno","Tierra Amarilla","Til Til","Timaukel","Tirúa","Tocopilla","Toltén","Tomé",
  "Torres del Paine","Traiguén","Trehuaco","Tucapel","Valdivia","Vallenar","Valparaíso","Victoria","Vicuña",
  "Villa Alegre","Villa Alemana","Villarrica","Viña del Mar","Vitacura","Yerbas Buenas","Yumbel","Yungay","Zapallar",
];

function ComunaAutocomplete({ value, onChange, placeholder = "Ej: Las Condes" }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  const results = query.length >= 2
    ? COMUNAS_CHILE.filter((c) => c.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : [];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function select(comuna: string) {
    setQuery(comuna);
    onChange(comuna);
    setOpen(false);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    border: "1px solid #E8E8E3", borderRadius: 10,
    padding: "11px 14px", fontSize: 14, color: "#1A1A18",
    background: "#fff", outline: "none", fontFamily: "inherit",
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input
        type="text"
        value={query}
        autoComplete="off"
        placeholder={placeholder}
        onChange={(e) => { setQuery(e.target.value); onChange(""); setOpen(true); }}
        style={inputStyle}
        onFocus={(e) => { e.currentTarget.style.borderColor = "#E8553D"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(232,85,61,0.1)"; if (query.length >= 2) setOpen(true); }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "#E8E8E3"; e.currentTarget.style.boxShadow = "none"; }}
      />
      {open && results.length > 0 && (
        <div style={{ position: "absolute", zIndex: 50, width: "100%", background: "#fff", border: "1px solid #E8E8E3", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", marginTop: 4, overflow: "hidden" }}>
          {results.map((comuna) => (
            <button
              key={comuna}
              type="button"
              onMouseDown={() => select(comuna)}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 14px", fontSize: 14, color: "#1A1A18", background: "none", border: "none", borderBottom: "1px solid #F5F5F0", cursor: "pointer", fontFamily: "inherit" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#FFF0ED"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
            >
              {comuna}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const COURIER_LABELS: Record<string, string> = {
  starken_domicilio: "Starken Dom.",
  starken_sucursal: "Starken Suc.",
  chilexpress: "Chilexpress",
  blueexpress: "Blue Express",
  noventa9Minutos: "99 Minutos",
  "99minutos": "99 Minutos",
};

function courierLabel(key: string) {
  return COURIER_LABELS[key] ?? key;
}

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

// ─── DeliveryPropioModal ──────────────────────────────────────────────────────

function DeliveryPropioModal({
  initial, onSave, onClose,
}: {
  initial: DeliveryPropioState;
  onSave: (dp: DeliveryPropioState) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<DeliveryPropioState>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const set = (k: keyof DeliveryPropioState, v: string | boolean) => {
    setForm((p) => ({ ...p, [k]: v }));
    setFieldErrors((p) => { const n = { ...p }; delete n[k as string]; return n; });
  };

  function formatRut(raw: string): string {
    const clean = raw.replace(/[^0-9kK]/g, "").toUpperCase();
    if (clean.length < 2) return clean;
    const verifier = clean.slice(-1);
    const body = clean.slice(0, -1);
    const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${formatted}-${verifier}`;
  }

  function validateRut(rut: string): boolean {
    const clean = rut.replace(/[^0-9kK]/g, "").toUpperCase();
    if (clean.length < 2) return false;
    const verifier = clean.slice(-1);
    const body = clean.slice(0, -1);
    let sum = 0; let mul = 2;
    for (let i = body.length - 1; i >= 0; i--) {
      sum += parseInt(body[i]) * mul;
      mul = mul === 7 ? 2 : mul + 1;
    }
    const expected = 11 - (sum % 11);
    const expectedChar = expected === 11 ? "0" : expected === 10 ? "K" : String(expected);
    return verifier === expectedChar;
  }

  function formatPrecio(raw: string): string {
    const digits = raw.replace(/[^0-9]/g, "");
    return digits ? Number(digits).toLocaleString("es-CL") : "";
  }

  async function handleSave() {
    if (form.enabled) {
      const errors: Record<string, string> = {};
      const precioNum = Number(String(form.precio).replace(/[^0-9]/g, ""));
      if (!form.precio || isNaN(precioNum) || precioNum <= 0) errors.precio = "Ingresa un precio válido";
      if (!form.banco) errors.banco = "Campo obligatorio";
      if (!form.cuenta) errors.cuenta = "Campo obligatorio";
      if (!form.titular) errors.titular = "Campo obligatorio";
      if (!form.rut) errors.rut = "Campo obligatorio";
      else if (!validateRut(form.rut)) errors.rut = "RUT inválido — verifica el dígito verificador";
      if (!form.email) errors.email = "Campo obligatorio";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Email inválido";
      if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    }
    setSaving(true);
    await onSave({ ...form, precio: String(Number(String(form.precio).replace(/[^0-9]/g, ""))) });
    setSaving(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1200);
  }

  return (
    <ModalOverlay>
      <div style={{
        background: "#fff", borderRadius: 20, width: "100%", maxWidth: 420,
        boxShadow: "0 24px 64px rgba(0,0,0,0.15)", position: "relative", overflow: "hidden", maxHeight: "90vh", overflowY: "auto",
      }}>
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

        <div style={{ padding: "14px 20px 8px" }}>
          <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 700, color: "#1A1A18", letterSpacing: "-0.02em" }}>
            Delivery Propio
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: "#9C9C95", lineHeight: 1.5 }}>
            Ofrece tu propio servicio de entrega dentro de Santiago con precio fijo y pago por transferencia.
          </p>
        </div>

        <div style={{ padding: "12px 20px" }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "#F5F5F0", borderRadius: 12, padding: "14px 16px", marginBottom: 16,
          }}>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#1A1A18" }}>Activar delivery propio</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#9C9C95" }}>Solo para comunas de Santiago</p>
            </div>
            <Toggle active={form.enabled} onChange={() => set("enabled", !form.enabled)} />
          </div>

          {form.enabled && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: "#9C9C95", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Info del servicio
              </p>
              <div>
                <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 500, color: "#5C5C57" }}>Precio ($) <span style={{ color: "#E8553D" }}>*</span></p>
                <input
                  type="text" inputMode="numeric"
                  value={form.precio}
                  onChange={(e) => set("precio", formatPrecio(e.target.value))}
                  placeholder="3.990"
                  style={{ width: "100%", border: `1.5px solid ${fieldErrors.precio ? "#E8553D" : "#E8E8E3"}`, borderRadius: 10, padding: "10px 12px", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box", color: "#1A1A18" }}
                />
                {fieldErrors.precio && <p style={{ margin: "4px 0 0", fontSize: 11, color: "#E8553D" }}>{fieldErrors.precio}</p>}
              </div>
              <div>
                <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 500, color: "#5C5C57" }}>Teléfono de contacto</p>
                <input
                  type="text" value={form.telefono}
                  onChange={(e) => set("telefono", e.target.value)}
                  placeholder="+56 9 1234 5678"
                  style={{ width: "100%", border: "1.5px solid #E8E8E3", borderRadius: 10, padding: "10px 12px", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box", color: "#1A1A18" }}
                />
              </div>

              <p style={{ margin: "8px 0 4px", fontSize: 11, fontWeight: 700, color: "#9C9C95", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Datos de transferencia
              </p>
              {([
                { key: "banco",   label: "Banco",                placeholder: "Banco Estado",      required: true },
                { key: "cuenta",  label: "Número de cuenta",     placeholder: "00012345678",        required: true },
                { key: "titular", label: "Nombre del titular",   placeholder: "María López",        required: true },
                { key: "rut",     label: "RUT",                  placeholder: "12.345.678-9",       required: true, isRut: true },
                { key: "email",   label: "Email de transferencia", placeholder: "hola@mitienda.cl", required: true },
              ] as { key: string; label: string; placeholder: string; required: boolean; isRut?: boolean }[]).map(({ key, label, placeholder, required, isRut }) => (
                <div key={key}>
                  <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 500, color: "#5C5C57" }}>
                    {label} {required && <span style={{ color: "#E8553D" }}>*</span>}
                  </p>
                  <input
                    value={form[key as keyof DeliveryPropioState] as string}
                    onChange={(e) => {
                      const val = isRut ? formatRut(e.target.value) : e.target.value;
                      set(key as keyof DeliveryPropioState, val);
                    }}
                    placeholder={placeholder}
                    style={{
                      width: "100%", border: `1.5px solid ${fieldErrors[key] ? "#E8553D" : "#E8E8E3"}`, borderRadius: 10,
                      padding: "10px 12px", fontSize: 14, outline: "none",
                      fontFamily: "inherit", boxSizing: "border-box", color: "#1A1A18",
                    }}
                  />
                  {fieldErrors[key] && <p style={{ margin: "4px 0 0", fontSize: 11, color: "#E8553D" }}>{fieldErrors[key]}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: "8px 20px 24px" }}>
          {Object.keys(fieldErrors).length > 0 && (
            <p style={{ margin: "0 0 10px", fontSize: 12, color: "#E8553D", textAlign: "center" }}>Corrige los campos marcados en rojo antes de guardar.</p>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: "100%", padding: "14px", borderRadius: 12,
              background: saved ? "#2D8A56" : "#1A1A18", color: "#fff",
              border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              transition: "background 0.2s",
            }}
          >
            {saved ? "✓ Guardado" : saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
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
  onOpenDeliveryPropio,
  deliveryPropioEnabled,
  isPro, pymeSlug, linkFijoEnabled, defaultDims,
  onSaveLinkFijo,
  onClose,
}: {
  askInstagram: boolean;
  onToggleInstagram: (val: boolean) => Promise<void>;
  couriersHabilitados: string[];
  onOpenCouriers: () => void;
  onOpenDeliveryPropio: () => void;
  deliveryPropioEnabled: boolean;
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

          {/* Delivery Propio */}
          <button
            onClick={() => { onClose(); onOpenDeliveryPropio(); }}
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
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#1A1A18" }}>Delivery Propio</p>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: "#9C9C95" }}>
                {deliveryPropioEnabled ? "Activo — Solo Santiago" : "Desactivado"}
              </p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9C9C95" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

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

// ─── MisEnviosView ────────────────────────────────────────────────────────────

const CARRIER_LABEL: Record<string, string> = {
  starken: "Starken",
  starken_domicilio: "Starken",
  starken_sucursal: "Starken Sucursal",
  chilexpress: "Chilexpress",
  blueexpress: "Blue Express",
  noventa9Minutos: "99 Minutos",
  "99minutos": "99 Minutos",
};

const CARRIER_COLOR: Record<string, string> = {
  starken: "#00A651", starken_domicilio: "#00A651", starken_sucursal: "#00A651",
  chilexpress: "#B8960C", blueexpress: "#0055B8",
  noventa9Minutos: "#FF3B30", "99minutos": "#FF3B30",
};

type CarrierSchedule = { date: string; time_from: number; time_to: number };

function getChileanHolidays(year: number): Set<string> {
  const holidays: string[] = [
    `${year}-01-01`, // Año Nuevo
    `${year}-05-01`, // Día del Trabajo
    `${year}-05-21`, // Día de las Glorias Navales
    `${year}-06-20`, // Día Nacional de los Pueblos Indígenas (3er viernes de junio — aprox, fijo por simplicidad)
    `${year}-07-16`, // Virgen del Carmen
    `${year}-08-15`, // Asunción de la Virgen
    `${year}-09-18`, // Independencia Nacional
    `${year}-09-19`, // Día de las Glorias del Ejército
    `${year}-10-12`, // Encuentro de Dos Mundos
    `${year}-10-31`, // Día de las Iglesias Evangélicas
    `${year}-11-01`, // Día de Todos los Santos
    `${year}-12-08`, // Inmaculada Concepción
    `${year}-12-25`, // Navidad
  ];

  // Semana Santa (Viernes Santo y Sábado Santo) — cálculo Algoritmo de Butcher
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d2 = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d2 - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  const easter = new Date(year, month - 1, day);

  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2);
  holidays.push(localDateStr(goodFriday));

  return new Set(holidays);
}

function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getNextBusinessDays(n: number): string[] {
  const days: string[] = [];
  const d = new Date();
  let currentYear = d.getFullYear();
  let holidays = getChileanHolidays(currentYear);

  while (days.length < n) {
    d.setDate(d.getDate() + 1);
    if (d.getFullYear() !== currentYear) {
      currentYear = d.getFullYear();
      holidays = getChileanHolidays(currentYear);
    }
    const dateStr = localDateStr(d);
    if (d.getDay() !== 0 && d.getDay() !== 6 && !holidays.has(dateStr)) {
      days.push(dateStr);
    }
  }
  return days;
}

function formatBusinessDay(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("es-CL", { weekday: "short", day: "numeric", month: "short" });
}

type PickupResult = {
  carrier: string;
  pickup_number: string;
  pickup_date: string;
  total_packages: number;
};

function MisEnviosView({ userId, isPro, origenComuna, onPendientesCount }: { userId: string; isPro: boolean; origenComuna: string; onPendientesCount?: (n: number) => void }) {
  const [envios, setEnvios] = useState<EnvioResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [scheduling, setScheduling] = useState(false);
  const [showSchedulePanel, setShowSchedulePanel] = useState(false);
  const [carrierSchedule, setCarrierSchedule] = useState<Record<string, CarrierSchedule>>({});
  const [pickupResults, setPickupResults] = useState<PickupResult[]>([]);
  const [toastMsg, setToastMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [reagendarEnvioId, setReagendarEnvioId] = useState<number | null>(null);
  const [reagendarSched, setReagendarSched] = useState<CarrierSchedule>({ date: "", time_from: 9, time_to: 18 });
  const [reagendarLoading, setReagendarLoading] = useState(false);
  const [reagendarError, setReagendarError] = useState("");
  const [envioTab, setEnvioTab] = useState<"pendientes" | "agendados" | "sucursal">("pendientes");
  const businessDays = getNextBusinessDays(3);


  useEffect(() => {
    supabase
      .from("envios")
      .select("id, datos_destino, courier, tracking, tracking_url, label_url, created_at, pickup_agendado, pickup_id, pickup_date, pickup_time_from, pickup_time_to, pickup_status, pickup_attempts")
      .eq("pyme_id", userId)
      .not("tracking_url", "is", null)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        console.log("[MisEnvios] data:", data, "error:", error, "userId:", userId);
        setEnvios((data as EnvioResumen[]) ?? []);
        setLoading(false);
      });
  }, [userId]);

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.size === pendientes.length ? new Set() : new Set(pendientes.map((e) => e.id))
    );
  }

  function openSchedulePanel() {
    // Inicializar schedule por carrier con valores default
    const groups: Record<string, number> = {};
    for (const id of selected) {
      const envio = pendientes.find((e) => e.id === id);
      if (!envio) continue;
      const c = envio.courier ?? "desconocido";
      groups[c] = (groups[c] ?? 0) + 1;
    }
    const defaultDate = businessDays[0] ?? "";
    const initial: Record<string, CarrierSchedule> = {};
    for (const carrier of Object.keys(groups)) {
      const is99 = carrier.includes("99") || carrier.includes("noventa");
      initial[carrier] = is99
        ? { date: defaultDate, time_from: 9, time_to: 18 }
        : carrierSchedule[carrier] ?? { date: defaultDate, time_from: 9, time_to: 18 };
    }
    setCarrierSchedule(initial);
    setShowSchedulePanel(true);
  }

  async function handleAgendar() {
    if (!selected.size) return;
    setScheduling(true);
    setErrorMsg("");
    setPickupResults([]);

    const agendadosIds = new Set<number>();
    const pickupIdByEnvio: Record<number, string | null> = {};
    const results: PickupResult[] = [];
    let errores = 0;

    const groups: Record<string, number[]> = {};
    for (const id of selected) {
      const envio = pendientes.find((e) => e.id === id);
      if (!envio) continue;
      const carrier = envio.courier ?? "desconocido";
      if (!groups[carrier]) groups[carrier] = [];
      groups[carrier].push(id);
    }

    for (const [courier, ids] of Object.entries(groups)) {
      const sched = carrierSchedule[courier] ?? { date: businessDays[0], time_from: 9, time_to: 18 };
      try {
        const res = await fetch("/api/agendar-retiro", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pyme_id: userId,
            envio_ids: ids,
            courier,
            pickup_date: sched.date,
            time_from: sched.time_from,
            time_to: sched.time_to,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          ids.forEach((id) => {
            agendadosIds.add(id);
            pickupIdByEnvio[id] = data.pickup_id ?? null;
          });
          results.push({
            carrier: courier,
            pickup_number: data.pickup_number ?? "—",
            pickup_date: data.pickup_date ?? sched.date,
            total_packages: data.total_packages ?? ids.length,
          });
        } else {
          errores++;
          setErrorMsg(`No pudimos agendar el retiro con ${CARRIER_LABEL[courier] ?? courier}. Inténtalo nuevamente o contáctanos.`);
        }
      } catch {
        errores++;
        setErrorMsg("Error de conexión al agendar retiro.");
      }
    }

    setScheduling(false);
    setShowSchedulePanel(false);

    if (agendadosIds.size > 0) {
      setPickupResults(results);
      const n = agendadosIds.size;
      setToastMsg(`Retiro${n > 1 ? "s" : ""} agendado${n > 1 ? "s" : ""} correctamente`);
      setTimeout(() => setToastMsg(""), 3000);
      setEnvioTab("agendados");
      setEnvios((prev) => prev.map((e) => {
        if (!agendadosIds.has(e.id)) return e;
        const sched = Object.entries(groups).find(([, ids]) => ids.includes(e.id));
        const schedData = sched ? carrierSchedule[sched[0]] : null;
        return {
          ...e,
          pickup_agendado:  true,
          pickup_id:        pickupIdByEnvio[e.id] ?? e.pickup_id,
          pickup_date:      schedData?.date ?? e.pickup_date,
          pickup_time_from: schedData?.time_from ?? e.pickup_time_from,
          pickup_time_to:   schedData?.time_to ?? e.pickup_time_to,
          pickup_status:    "scheduled",
          pickup_attempts:  0,
        };
      }));
      setSelected(new Set());
    }
  }

  function toggleExpand(envio: EnvioResumen) {
    setExpandedId((prev) => prev === envio.id ? null : envio.id);
  }

  function openReagendar(envio: EnvioResumen) {
    const courier = envio.courier;
    const is99 = courier.includes("99") || courier.includes("noventa");
    const isStarken = courier.startsWith("starken");
    setReagendarSched({
      date: businessDays[0] ?? "",
      time_from: 9,
      time_to: is99 ? 18 : isStarken ? 13 : 15,
    });
    setReagendarError("");
    setReagendarEnvioId(envio.id);
  }

  async function handleReagendar(envio: EnvioResumen) {
    setReagendarLoading(true);
    setReagendarError("");
    const attempts = (envio.pickup_attempts ?? 0) + 1;
    try {
      const res = await fetch("/api/agendar-retiro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pyme_id: userId,
          envio_ids: [envio.id],
          courier: envio.courier,
          pickup_date: reagendarSched.date,
          time_from: reagendarSched.time_from,
          time_to: reagendarSched.time_to,
          reagendar: true,
          current_attempts: envio.pickup_attempts ?? 0,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setEnvios((prev) => prev.map((e) => e.id === envio.id ? {
          ...e,
          pickup_date:      reagendarSched.date,
          pickup_time_from: reagendarSched.time_from,
          pickup_time_to:   reagendarSched.time_to,
          pickup_status:    "scheduled",
          pickup_attempts:  attempts,
          pickup_id:        data.pickup_id ?? e.pickup_id,
        } : e));
        setReagendarEnvioId(null);
      } else {
        setReagendarError("Error al re-agendar. Contáctanos en mbmolina@gmail.com");
      }
    } catch {
      setReagendarError("Error de conexión. Contáctanos en mbmolina@gmail.com");
    }
    setReagendarLoading(false);
  }

  const pendientes  = envios.filter((e) => !e.pickup_agendado);
  const sucursales  = envios.filter((e) => e.pickup_agendado && e.pickup_status === "sucursal");
  const agendados   = envios.filter((e) => e.pickup_agendado && e.pickup_status !== "sucursal");

  useEffect(() => { onPendientesCount?.(pendientes.length); }, [pendientes.length]);

  // Agrupar seleccionados por carrier para mostrar en la barra inferior
  const selectedByCarrier: Record<string, number> = {};
  for (const id of selected) {
    const envio = pendientes.find((e) => e.id === id);
    if (!envio) continue;
    const c = envio.courier ?? "otro";
    selectedByCarrier[c] = (selectedByCarrier[c] ?? 0) + 1;
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
        <div style={{ width: 32, height: 32, border: "3px solid #E8E8E3", borderTopColor: "#E8553D", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ position: "relative", paddingBottom: selected.size > 0 ? 90 : 0 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: "0 0 12px", fontSize: 20, fontWeight: 700, color: "#1A1A18" }}>Mis Envíos</h2>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {(["pendientes", "agendados", "sucursal"] as const).map((tab) => {
            const count = tab === "pendientes" ? pendientes.length : tab === "agendados" ? agendados.length : sucursales.length;
            const labels = { pendientes: "Por gestionar", agendados: "Agendados", sucursal: "En sucursal" };
            const active = envioTab === tab;
            return (
              <button key={tab} onClick={() => setEnvioTab(tab)} style={{
                fontSize: 12, fontWeight: 700, padding: "7px 14px", borderRadius: 20, cursor: "pointer",
                border: active ? "1.5px solid #1A1A18" : "1.5px solid #E8E8E3",
                background: active ? "#1A1A18" : "#fff",
                color: active ? "#fff" : "#5C5C57",
                fontFamily: "inherit", transition: "all 0.15s",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                {labels[tab]}
                {count > 0 && (
                  <span style={{
                    fontSize: 11, fontWeight: 700, borderRadius: 20, padding: "1px 7px",
                    background: active ? "rgba(255,255,255,0.2)" : "#F0F0EB",
                    color: active ? "#fff" : "#5C5C57",
                  }}>{count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Toast */}
      {toastMsg && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
          background: "#1A1A18", color: "#fff", borderRadius: 20,
          padding: "10px 20px", fontSize: 13, fontWeight: 600,
          boxShadow: "0 4px 16px rgba(0,0,0,0.2)", zIndex: 999,
          display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap",
        }}>
          <span style={{ color: "#4CD38A" }}>✓</span> {toastMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ background: "#FFF0ED", border: "1px solid #F5D5CE", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
          <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: "#E8553D" }}>{errorMsg}</p>
          <a href="mailto:mbmolina@gmail.com" style={{ fontSize: 12, fontWeight: 600, color: "#E8553D" }}>mbmolina@gmail.com</a>
        </div>
      )}

      {/* ── TAB: Por gestionar ── */}
      {envioTab === "pendientes" && <>

      {/* ── Avisos mínimo paquetes por carrier ── */}
      {(() => {
        const pendientesByCarrier: Record<string, number> = {};
        for (const e of pendientes) {
          const c = e.courier ?? "";
          if (c === "chilexpress" || c.startsWith("blue")) {
            pendientesByCarrier[c] = (pendientesByCarrier[c] ?? 0) + 1;
          }
        }
        const entries = Object.entries(pendientesByCarrier).filter(([, n]) => n < 5);
        if (!entries.length) return null;
        return (
          <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            {entries.map(([courier, count]) => {
              const label = CARRIER_LABEL[courier] ?? courier;
              const faltan = 5 - count;
              return (
                <div key={courier} style={{ display: "flex", alignItems: "center", gap: 10, background: "#FFFBEA", border: "1px solid #F5E0A0", borderRadius: 12, padding: "10px 14px" }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>📦</span>
                  <p style={{ margin: 0, fontSize: 12, color: "#5C5C57" }}>
                    <strong>{label}</strong> · {count} guía{count > 1 ? "s" : ""} — Necesitas {faltan} más para agendar retiro a domicilio.
                  </p>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* ── Pendientes de agendar ── */}
      {pendientes.length === 0 ? (
        <div style={{ background: "#fff", border: "1px solid #E8E8E3", borderRadius: 16, padding: "32px 24px", textAlign: "center", marginBottom: 24 }}>
          <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#1A1A18" }}>Sin envíos pendientes</p>
          <p style={{ margin: 0, fontSize: 13, color: "#9C9C95" }}>No hay guías generadas sin retiro agendado.</p>
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #E8E8E3", borderRadius: 16, overflow: "hidden", marginBottom: 24 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "12px 16px", borderBottom: "1px solid #F0F0EB",
            background: "#FAFAF7",
          }}>
            <input
              type="checkbox"
              checked={selected.size === pendientes.length && pendientes.length > 0}
              onChange={toggleAll}
              style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#E8553D" }}
            />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#9C9C95", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {selected.size > 0 ? `${selected.size} seleccionado${selected.size > 1 ? "s" : ""}` : `${pendientes.length} pendiente${pendientes.length > 1 ? "s" : ""}`}
            </span>
          </div>
          {pendientes.map((envio, i) => {
            const isSelected = selected.has(envio.id);
            const color = CARRIER_COLOR[envio.courier] ?? "#5C5C57";
            const label = CARRIER_LABEL[envio.courier] ?? envio.courier;
            const fecha = new Date(envio.created_at).toLocaleDateString("es-CL", { day: "numeric", month: "short" });
            const is99 = envio.courier.includes("99") || envio.courier.includes("noventa");
            return (
              <div key={envio.id} onClick={() => toggle(envio.id)} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
                borderBottom: i < pendientes.length - 1 ? "1px solid #F0F0EB" : "none",
                background: isSelected ? "#FFFBF9" : "#fff", cursor: "pointer", transition: "background 0.15s",
              }}>
                <input type="checkbox" checked={isSelected} onChange={() => toggle(envio.id)}
                  onClick={(e) => e.stopPropagation()}
                  style={{ width: 16, height: 16, flexShrink: 0, cursor: "pointer", accentColor: "#E8553D" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1A18", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180 }}>
                      {envio.datos_destino?.nombre ?? "—"}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: `${color}18`, color, border: `1px solid ${color}40` }}>
                      {label}
                    </span>
                  </div>
                  <p style={{ margin: "3px 0 0", fontSize: 12, color: "#9C9C95" }}>
                    {envio.datos_destino?.comuna ?? "—"} · {fecha}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }} className="gen-envio-actions" onClick={(e) => e.stopPropagation()}>
                  {envio.label_url && (
                    <a href={envio.label_url} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 11, fontWeight: 600, color: "#1A1A18", background: "#F0F0EB", border: "1px solid #E0E0DA", borderRadius: 8, padding: "5px 10px", textDecoration: "none", textAlign: "center" }}>
                      Descargar guía
                    </a>
                  )}
                  {!is99 && (
                    <button
                      onClick={async () => {
                        await supabase.from("envios").update({ pickup_agendado: true, pickup_status: "sucursal" }).eq("id", envio.id);
                        setEnvios((prev) => prev.map((en) => en.id === envio.id ? { ...en, pickup_agendado: true, pickup_status: "sucursal" } : en));
                        setSelected((prev) => { const next = new Set(prev); next.delete(envio.id); return next; });
                      }}
                      style={{ fontSize: 11, fontWeight: 600, color: "#5C5C57", background: "#F0F0EB", border: "1px solid #E0E0DA", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontFamily: "inherit" }}
                    >
                      Llevaré a sucursal
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      </>}{/* fin TAB pendientes */}

      {/* ── TAB: Agendados ── */}
      {envioTab === "agendados" && <>
      {agendados.length === 0 ? (
        <div style={{ background: "#fff", border: "1px solid #E8E8E3", borderRadius: 16, padding: "32px 24px", textAlign: "center" }}>
          <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#1A1A18" }}>Sin retiros agendados</p>
          <p style={{ margin: 0, fontSize: 13, color: "#9C9C95" }}>Selecciona envíos en "Por agendar" para coordinar el retiro.</p>
        </div>
      ) : (
        <div>
          <div style={{ background: "#fff", border: "1px solid #E8E8E3", borderRadius: 16, overflow: "hidden" }}>
            {agendados.map((envio, i) => {
              const color = CARRIER_COLOR[envio.courier] ?? "#5C5C57";
              const label = CARRIER_LABEL[envio.courier] ?? envio.courier;
              const fecha = envio.pickup_date
                ? new Date(envio.pickup_date + "T12:00:00").toLocaleDateString("es-CL", { day: "numeric", month: "short" })
                : new Date(envio.created_at).toLocaleDateString("es-CL", { day: "numeric", month: "short" });
              const isExpanded = expandedId === envio.id;
              const today = localDateStr(new Date());
              const isSucursal = envio.pickup_status === "sucursal";
              const isPast = !isSucursal && (envio.pickup_date ? envio.pickup_date < today : false);
              return (
                <div key={envio.id} style={{ borderBottom: i < agendados.length - 1 ? "1px solid #F0F0EB" : "none", opacity: isPast ? 0.55 : 1 }}>
                  <div
                    onClick={() => toggleExpand(envio)}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: isPast ? "#F5F5F2" : "#FAFAF7", cursor: "pointer" }}
                  >
                    <span style={{ fontSize: 14, color: isPast ? "#9C9C95" : "#2D8A56", flexShrink: 0 }}>{isPast ? "○" : "✓"}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1A18", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }}>
                          {envio.datos_destino?.nombre ?? "—"}
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: `${color}18`, color, border: `1px solid ${color}40` }}>
                          {label}
                        </span>
                      </div>
                      <p style={{ margin: "3px 0 0", fontSize: 12, color: "#9C9C95" }}>
                        {origenComuna || "—"} · {fecha}
                      </p>
                      {envio.tracking_url && (
                        <a href={envio.tracking_url} target="_blank" rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            display: "inline-block", marginTop: 5,
                            fontSize: 11, fontWeight: 600, color: "#5C5C57",
                            background: "#F0F0EB", border: "1px solid #E0E0DA",
                            borderRadius: 6, padding: "3px 10px", textDecoration: "none",
                          }}>
                          Seguir envío
                        </a>
                      )}
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, borderRadius: 20, padding: "2px 8px",
                        color: isSucursal ? "#6B5CE7" : isPast ? "#9C9C95" : "#2D8A56",
                        background: isSucursal ? "#F0EEFF" : isPast ? "#F0F0EB" : "#F0FAF5",
                        border: `1px solid ${isSucursal ? "#C4B5FD" : isPast ? "#D8D8D3" : "#86CFAD"}`,
                      }}>
                        {isSucursal ? "En sucursal" : isPast ? "Fecha vencida" : "Agendado"}
                      </span>
                      <p style={{ margin: "4px 0 0", fontSize: 11, color: "#9C9C95" }}>{isExpanded ? "▲" : "▼"}</p>
                    </div>
                  </div>
                  {isExpanded && (() => {
                    const today   = localDateStr(new Date());
                    const fechaStr = envio.pickup_date;
                    const pkFecha  = fechaStr
                      ? new Date(fechaStr + "T12:00:00").toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })
                      : null;
                    const pkHorario = envio.pickup_time_from != null && envio.pickup_time_to != null
                      ? `${envio.pickup_time_from}:00 – ${envio.pickup_time_to}:00 hrs`
                      : null;
                    const failed    = ["failed", "fallied"].includes((envio.pickup_status ?? "").toLowerCase());
                    const datePast  = fechaStr ? fechaStr < today : false;
                    const attempts  = envio.pickup_attempts ?? 0;
                    const maxIntent = attempts >= 3;
                    const isReagendando = reagendarEnvioId === envio.id;
                    const is99     = envio.courier.includes("99") || envio.courier.includes("noventa");
                    const rSched   = reagendarSched;
                    return (
                      <div style={{ padding: "12px 16px 16px", background: isSucursal ? "#F5F0FF" : "#F7FDF9", borderTop: `1px solid ${isSucursal ? "#E0D8FF" : "#E0F0E8"}` }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px" }}>
                          {envio.datos_destino?.nombre && (
                            <div>
                              <p style={{ margin: 0, fontSize: 11, color: "#9C9C95" }}>Destinatario</p>
                              <p style={{ margin: "2px 0 0", fontSize: 12, fontWeight: 600, color: "#1A1A18" }}>{envio.datos_destino.nombre}</p>
                            </div>
                          )}
                          {envio.datos_destino?.comuna && (
                            <div>
                              <p style={{ margin: 0, fontSize: 11, color: "#9C9C95" }}>Comuna destino</p>
                              <p style={{ margin: "2px 0 0", fontSize: 12, fontWeight: 600, color: "#1A1A18" }}>{envio.datos_destino.comuna}</p>
                            </div>
                          )}
                          {envio.tracking && (
                            <div>
                              <p style={{ margin: 0, fontSize: 11, color: "#9C9C95" }}>Tracking</p>
                              <p style={{ margin: "2px 0 0", fontSize: 12, fontWeight: 700, color: "#1A1A18", fontFamily: "monospace" }}>#{envio.tracking}</p>
                            </div>
                          )}
                          {envio.label_url && (
                            <div>
                              <p style={{ margin: 0, fontSize: 11, color: "#9C9C95" }}>Guía</p>
                              <a href={envio.label_url} target="_blank" rel="noopener noreferrer"
                                style={{ display: "inline-block", marginTop: 2, fontSize: 11, fontWeight: 600, color: "#1A1A18", background: "#F0F0EB", border: "1px solid #E0E0DA", borderRadius: 6, padding: "3px 10px", textDecoration: "none" }}>
                                Descargar guía
                              </a>
                            </div>
                          )}
                          {pkFecha && (
                            <div>
                              <p style={{ margin: 0, fontSize: 11, color: "#9C9C95" }}>Fecha retiro</p>
                              <p style={{ margin: "2px 0 0", fontSize: 12, fontWeight: 600, color: datePast ? "#E8553D" : "#1A1A18", textTransform: "capitalize" }}>{pkFecha}{datePast ? " (vencida)" : ""}</p>
                            </div>
                          )}
                          {pkHorario && (
                            <div>
                              <p style={{ margin: 0, fontSize: 11, color: "#9C9C95" }}>Horario</p>
                              <p style={{ margin: "2px 0 0", fontSize: 12, fontWeight: 600, color: "#1A1A18" }}>{pkHorario}</p>
                            </div>
                          )}
                          {envio.pickup_status && (
                            <div>
                              <p style={{ margin: 0, fontSize: 11, color: "#9C9C95" }}>Estado</p>
                              <p style={{ margin: "2px 0 0", fontSize: 12, fontWeight: 600, color: failed ? "#E8553D" : "#2D8A56" }}>{envio.pickup_status}</p>
                            </div>
                          )}
                          {attempts > 0 && (
                            <div>
                              <p style={{ margin: 0, fontSize: 11, color: "#9C9C95" }}>Intentos</p>
                              <p style={{ margin: "2px 0 0", fontSize: 12, fontWeight: 600, color: maxIntent ? "#E8553D" : "#1A1A18" }}>{attempts} / 3</p>
                            </div>
                          )}
                        </div>

                        {/* Mensaje soporte si 3+ intentos */}
                        {maxIntent && (
                          <div style={{ marginTop: 12, background: "#FFF0ED", border: "1px solid #F5C0B0", borderRadius: 10, padding: "12px 14px" }}>
                            <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#E8553D" }}>Límite de intentos alcanzado</p>
                            <p style={{ margin: "0 0 6px", fontSize: 12, color: "#5C5C57" }}>Contacta a soporte para coordinar el retiro:</p>
                            <a href="mailto:mbmolina@gmail.com" style={{ fontSize: 12, fontWeight: 700, color: "#E8553D" }}>mbmolina@gmail.com</a>
                            <p style={{ margin: "6px 0 0", fontSize: 12, color: "#5C5C57" }}>O lleva el paquete directamente a una sucursal del courier.</p>
                          </div>
                        )}

                        {/* Botón reagendar si fecha vencida y menos de 3 intentos */}
                        {!isSucursal && (datePast || failed) && !maxIntent && !isReagendando && (
                          <button onClick={() => openReagendar(envio)} style={{
                            marginTop: 12, width: "100%", background: "#E8553D", color: "#fff",
                            border: "none", borderRadius: 8, padding: "9px 0",
                            fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                          }}>
                            Reagendar retiro
                          </button>
                        )}

                        {/* Panel inline de reagendamiento */}
                        {!isSucursal && isReagendando && !maxIntent && (
                          <div style={{ marginTop: 12, background: "#F7F7F2", borderRadius: 10, padding: "14px" }}>
                            <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#1A1A18" }}>Nueva fecha de retiro</p>
                            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                              {businessDays.map((d) => (
                                <button key={d} onClick={() => setReagendarSched((p) => ({ ...p, date: d }))}
                                  style={{ flex: 1, padding: "8px 4px", borderRadius: 8, border: "1.5px solid", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize",
                                    borderColor: rSched.date === d ? "#E8553D" : "#E8E8E3",
                                    background: rSched.date === d ? "#FFF0ED" : "#fff",
                                    color: rSched.date === d ? "#E8553D" : "#1A1A18",
                                  }}>
                                  {formatBusinessDay(d)}
                                </button>
                              ))}
                            </div>
                            {is99 ? (
                              <p style={{ margin: "0 0 10px", fontSize: 12, color: "#5C5C57", fontWeight: 600 }}>Horario fijo: 9:00 – 18:00 hrs</p>
                            ) : (
                              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                                <div style={{ flex: 1 }}>
                                  <p style={{ margin: "0 0 4px", fontSize: 11, color: "#9C9C95" }}>Desde</p>
                                  <select value={rSched.time_from} onChange={(e) => setReagendarSched((p) => ({ ...p, time_from: Number(e.target.value) }))}
                                    style={{ width: "100%", padding: "7px 8px", borderRadius: 8, border: "1.5px solid #E8E8E3", fontSize: 12, fontFamily: "inherit" }}>
                                    {(envio.courier.startsWith("starken") || envio.courier.startsWith("blue") ? [9, 10] : [9, 10, 11]).map((h) => (
                                      <option key={h} value={h}>{h}:00 hrs</option>
                                    ))}
                                  </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                  <p style={{ margin: "0 0 4px", fontSize: 11, color: "#9C9C95" }}>Hasta</p>
                                  <select value={rSched.time_to} onChange={(e) => setReagendarSched((p) => ({ ...p, time_to: Number(e.target.value) }))}
                                    style={{ width: "100%", padding: "7px 8px", borderRadius: 8, border: "1.5px solid #E8E8E3", fontSize: 12, fontFamily: "inherit" }}>
                                    {Array.from({ length: 10 }, (_, i) => i + 10).filter((h) => {
                                      const minEnd = envio.courier.startsWith("starken") ? 13 : (envio.courier.startsWith("blue") || envio.courier === "chilexpress") ? rSched.time_from + 6 : rSched.time_from + 3;
                                      return h > rSched.time_from && h >= minEnd;
                                    }).map((h) => (
                                      <option key={h} value={h}>{h}:00 hrs</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            )}
                            {reagendarError && (
                              <div style={{ marginBottom: 8, background: "#FFF0ED", border: "1px solid #F5C0B0", borderRadius: 8, padding: "8px 12px" }}>
                                <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 600, color: "#E8553D" }}>Error al re-agendar</p>
                                <a href="mailto:mbmolina@gmail.com" style={{ fontSize: 11, color: "#E8553D", fontWeight: 600 }}>mbmolina@gmail.com</a>
                              </div>
                            )}
                            <div style={{ display: "flex", gap: 8 }}>
                              <button onClick={() => setReagendarEnvioId(null)} style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "1.5px solid #E8E8E3", background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: "#5C5C57" }}>
                                Cancelar
                              </button>
                              <button onClick={() => handleReagendar(envio)} disabled={!rSched.date || reagendarLoading}
                                style={{ flex: 2, padding: "9px 0", borderRadius: 8, border: "none", background: reagendarLoading ? "#ccc" : "#E8553D", color: "#fff", fontSize: 13, fontWeight: 700, cursor: reagendarLoading ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                                {reagendarLoading ? "Agendando…" : `Confirmar (intento ${attempts + 1}/3)`}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Soporte dentro del tab agendados */}
      {agendados.length > 0 && (
        <div style={{
          marginTop: 20, display: "flex", alignItems: "center", gap: 12,
          background: "#FAFAF7", border: "1px solid #E8E8E3", borderRadius: 14, padding: "14px 16px",
        }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>💬</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: "#1A1A18" }}>¿Tienes algún problema con un retiro?</p>
            <p style={{ margin: 0, fontSize: 12, color: "#9C9C95" }}>Escríbenos y te ayudamos a coordinarlo.</p>
          </div>
          <a href="mailto:mbmolina@gmail.com" style={{
            fontSize: 12, fontWeight: 700, color: "#E8553D",
            background: "#FFF0ED", border: "1px solid #F5C0B0",
            borderRadius: 20, padding: "7px 14px", textDecoration: "none", flexShrink: 0,
          }}>Contactar</a>
        </div>
      )}
      </>}{/* fin TAB agendados */}

      {/* ── TAB: En sucursal ── */}
      {envioTab === "sucursal" && <>
      {sucursales.length === 0 ? (
        <div style={{ background: "#fff", border: "1px solid #E8E8E3", borderRadius: 16, padding: "32px 24px", textAlign: "center" }}>
          <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#1A1A18" }}>Sin envíos en sucursal</p>
          <p style={{ margin: 0, fontSize: 13, color: "#9C9C95" }}>Cuando marques un envío como "Llevaré a sucursal" aparecerá aquí.</p>
        </div>
      ) : (
      <div>
          <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "#9C9C95", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Llevados a sucursal
          </p>
          <div style={{ background: "#fff", border: "1px solid #E8E8E3", borderRadius: 16, overflow: "hidden" }}>
            {sucursales.map((envio, i) => {
              const color = CARRIER_COLOR[envio.courier] ?? "#5C5C57";
              const label = CARRIER_LABEL[envio.courier] ?? envio.courier;
              const isExpanded = expandedId === envio.id;
              return (
                <div key={envio.id} style={{ borderBottom: i < sucursales.length - 1 ? "1px solid #F0F0EB" : "none" }}>
                  <div onClick={() => toggleExpand(envio)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "#FAFAF7", cursor: "pointer" }}>
                    <span style={{ fontSize: 14, color: "#6B5CE7", flexShrink: 0 }}>🏪</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1A18", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }}>
                          {envio.datos_destino?.nombre ?? "—"}
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: `${color}18`, color, border: `1px solid ${color}40` }}>
                          {label}
                        </span>
                      </div>
                      <p style={{ margin: "3px 0 0", fontSize: 12, color: "#9C9C95" }}>
                        {envio.datos_destino?.comuna ?? "—"}
                      </p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, borderRadius: 20, padding: "2px 8px", color: "#6B5CE7", background: "#F0EEFF", border: "1px solid #C4B5FD" }}>
                        En sucursal
                      </span>
                      <p style={{ margin: "4px 0 0", fontSize: 11, color: "#9C9C95" }}>{isExpanded ? "▲" : "▼"}</p>
                    </div>
                  </div>
                  {isExpanded && (
                    <div style={{ padding: "12px 16px 16px", background: "#F5F0FF", borderTop: "1px solid #E0D8FF" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px" }}>
                        {envio.datos_destino?.nombre && (
                          <div>
                            <p style={{ margin: 0, fontSize: 11, color: "#9C9C95" }}>Destinatario</p>
                            <p style={{ margin: "2px 0 0", fontSize: 12, fontWeight: 600, color: "#1A1A18" }}>{envio.datos_destino.nombre}</p>
                          </div>
                        )}
                        {envio.datos_destino?.comuna && (
                          <div>
                            <p style={{ margin: 0, fontSize: 11, color: "#9C9C95" }}>Comuna destino</p>
                            <p style={{ margin: "2px 0 0", fontSize: 12, fontWeight: 600, color: "#1A1A18" }}>{envio.datos_destino.comuna}</p>
                          </div>
                        )}
                        {envio.tracking && (
                          <div>
                            <p style={{ margin: 0, fontSize: 11, color: "#9C9C95" }}>Tracking</p>
                            <p style={{ margin: "2px 0 0", fontSize: 12, fontWeight: 700, color: "#1A1A18", fontFamily: "monospace" }}>#{envio.tracking}</p>
                          </div>
                        )}
                        {envio.label_url && (
                          <div>
                            <p style={{ margin: 0, fontSize: 11, color: "#9C9C95" }}>Guía</p>
                            <a href={envio.label_url} target="_blank" rel="noopener noreferrer"
                              style={{ display: "inline-block", marginTop: 2, fontSize: 11, fontWeight: 600, color: "#1A1A18", background: "#F0F0EB", border: "1px solid #E0E0DA", borderRadius: 6, padding: "3px 10px", textDecoration: "none" }}>
                              Descargar guía
                            </a>
                          </div>
                        )}
                        {envio.tracking_url && (
                          <div>
                            <p style={{ margin: 0, fontSize: 11, color: "#9C9C95" }}>Seguimiento</p>
                            <a href={envio.tracking_url} target="_blank" rel="noopener noreferrer"
                              style={{ display: "inline-block", marginTop: 2, fontSize: 11, fontWeight: 600, color: "#5C5C57", background: "#F0F0EB", border: "1px solid #E0E0DA", borderRadius: 6, padding: "3px 10px", textDecoration: "none" }}>
                              Seguir envío
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      </>}{/* fin TAB sucursal */}


      {/* Barra flotante — botón para abrir panel */}
      {selected.size > 0 && !showSchedulePanel && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: "#1A1A18", borderRadius: 16, padding: "14px 20px",
          display: "flex", alignItems: "center", gap: 16,
          boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
          zIndex: 100, minWidth: 300, maxWidth: "calc(100vw - 32px)",
        }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#fff" }}>
              {selected.size} envío{selected.size > 1 ? "s" : ""} seleccionado{selected.size > 1 ? "s" : ""}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
              {Object.entries(selectedByCarrier).map(([c, n]) => `${n} ${CARRIER_LABEL[c] ?? c}`).join(" · ")}
            </p>
          </div>
          <button onClick={openSchedulePanel} style={{
            background: "#E8553D", color: "#fff", border: "none", borderRadius: 10,
            padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer",
            fontFamily: "inherit", flexShrink: 0,
          }}>
            Agendar retiro →
          </button>
        </div>
      )}

      {/* Panel de configuración por carrier */}
      {showSchedulePanel && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200,
          display: "flex", alignItems: "flex-end", justifyContent: "center",
        }}>
          <div style={{
            background: "#fff", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 560,
            maxHeight: "90vh", overflowY: "auto",
          }} className="gen-schedule-panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1A1A18" }}>Configurar retiros</h3>
              <button onClick={() => setShowSchedulePanel(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9C9C95" }}>✕</button>
            </div>

            {/* Soporte */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "#FAFAF7", border: "1px solid #E8E8E3",
              borderRadius: 12, padding: "10px 14px", marginBottom: 16,
            }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>💬</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#1A1A18" }}>¿Problema con un retiro?</p>
                <p style={{ margin: 0, fontSize: 11, color: "#9C9C95" }}>Escríbenos y te ayudamos a coordinarlo</p>
              </div>
              <a href="mailto:mbmolina@gmail.com" style={{
                fontSize: 11, fontWeight: 700, color: "#E8553D",
                background: "#FFF0ED", border: "1px solid #F5C0B0",
                borderRadius: 20, padding: "5px 10px", textDecoration: "none", flexShrink: 0,
              }}>
                Contactar
              </a>
            </div>

            {Object.entries(selectedByCarrier).map(([courier, count]) => {
              const sched = carrierSchedule[courier] ?? { date: businessDays[0] ?? "", time_from: 9, time_to: 18 };
              const color = CARRIER_COLOR[courier] ?? "#5C5C57";
              const label = CARRIER_LABEL[courier] ?? courier;
              const is99 = courier.includes("99") || courier.includes("noventa");
              const isChileBlue = courier === "chilexpress" || courier.startsWith("blue");
              const carrierBlocked = !isPro && !is99;
              const minPkgRequired = isChileBlue && count < 5;
              const hasIssue = carrierBlocked || minPkgRequired;
              return (
                <div key={courier} style={{ background: "#FAFAF7", border: `1px solid ${hasIssue ? "#F5C0B0" : "#E8E8E3"}`, borderRadius: 14, padding: "16px", marginBottom: 12, opacity: hasIssue ? 0.9 : 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: `${color}18`, color, border: `1px solid ${color}40` }}>
                      {label}
                    </span>
                    <span style={{ fontSize: 12, color: "#9C9C95" }}>{count} paquete{count > 1 ? "s" : ""}</span>
                  </div>

                  {carrierBlocked && (
                    <div style={{ background: "#FFF0ED", border: "1px solid #F5C0B0", borderRadius: 10, padding: "12px 14px" }}>
                      <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: "#E8553D" }}>Plan Pro requerido</p>
                      <p style={{ margin: "0 0 10px", fontSize: 12, color: "#5C5C57" }}>
                        El retiro a domicilio con {label} está disponible solo en el plan Pro con links ilimitados.
                      </p>
                      <a href={WA_UPGRADE} target="_blank" rel="noopener noreferrer"
                        style={{ display: "inline-block", fontSize: 12, fontWeight: 700, color: "#fff", background: "#E8553D", borderRadius: 8, padding: "7px 14px", textDecoration: "none" }}>
                        Subir a Pro →
                      </a>
                    </div>
                  )}

                  {!carrierBlocked && minPkgRequired && (
                    <div style={{ background: "#FFFBEA", border: "1px solid #F5E0A0", borderRadius: 10, padding: "12px 14px" }}>
                      <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: "#B87800" }}>Mínimo 5 paquetes</p>
                      <p style={{ margin: 0, fontSize: 12, color: "#5C5C57" }}>
                        {label} requiere al menos 5 paquetes para agendar retiro a domicilio. Tienes {count}. Selecciona más envíos o lleva los paquetes a sucursal.
                      </p>
                    </div>
                  )}

                  {!carrierBlocked && !minPkgRequired && (
                    <>
                      <div style={{ marginBottom: 12 }}>
                        <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: "#5C5C57" }}>Fecha de retiro</p>
                        <div style={{ display: "flex", gap: 6 }}>
                          {businessDays.map((d) => (
                            <button key={d} onClick={() => setCarrierSchedule((prev) => ({ ...prev, [courier]: { ...sched, date: d } }))}
                              style={{
                                flex: 1, padding: "8px 4px", borderRadius: 8, border: "1.5px solid",
                                borderColor: sched.date === d ? "#E8553D" : "#E8E8E3",
                                background: sched.date === d ? "#FFF0ED" : "#fff",
                                color: sched.date === d ? "#E8553D" : "#1A1A18",
                                fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                                textTransform: "capitalize",
                              }}>
                              {formatBusinessDay(d)}
                            </button>
                          ))}
                        </div>
                      </div>
                      {is99 ? (
                        <div style={{ background: "#F0F0EB", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "#5C5C57", fontWeight: 600 }}>
                          Horario fijo: 9:00 – 18:00 hrs
                        </div>
                      ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          <div>
                            <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: "#5C5C57" }}>Hora inicio</p>
                            <select value={sched.time_from}
                              onChange={(e) => setCarrierSchedule((prev) => ({ ...prev, [courier]: { ...sched, time_from: Number(e.target.value) } }))}
                              style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #E8E8E3", fontSize: 13, fontFamily: "inherit", background: "#fff" }}>
                              {(courier.startsWith("starken") || courier.startsWith("blue") ? [9, 10] : courier === "chilexpress" ? [9, 10, 11] : Array.from({ length: 10 }, (_, i) => i + 9)).map((h) => (
                                <option key={h} value={h}>{h}:00</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: "#5C5C57" }}>Hora fin</p>
                            <select value={sched.time_to}
                              onChange={(e) => setCarrierSchedule((prev) => ({ ...prev, [courier]: { ...sched, time_to: Number(e.target.value) } }))}
                              style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #E8E8E3", fontSize: 13, fontFamily: "inherit", background: "#fff" }}>
                              {Array.from({ length: 10 }, (_, i) => i + 10).filter((h) => {
                                const minEnd = courier.startsWith("starken") ? 13 : (courier.startsWith("blue") || courier === "chilexpress") ? sched.time_from + 6 : sched.time_from + 3;
                                return h > sched.time_from && h >= minEnd;
                              }).map((h) => (
                                <option key={h} value={h}>{h}:00</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}

            {errorMsg && (
              <div style={{ background: "#FFF0ED", border: "1px solid #F5D5CE", borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
                <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: "#E8553D" }}>{errorMsg}</p>
                <a href="mailto:mbmolina@gmail.com" style={{ fontSize: 12, fontWeight: 600, color: "#E8553D" }}>mbmolina@gmail.com</a>
              </div>
            )}

            <button onClick={handleAgendar}
              disabled={scheduling
                || (!isPro && Object.keys(selectedByCarrier).some((c) => !c.includes("99") && !c.includes("noventa")))
                || Object.entries(selectedByCarrier).some(([c, n]) => (c === "chilexpress" || c.startsWith("blue")) && n < 5)
              }
              style={{
              width: "100%", background: "#E8553D", color: "#fff", border: "none",
              borderRadius: 12, padding: "14px 0", fontSize: 15, fontWeight: 700,
              cursor: scheduling ? "not-allowed" : "pointer", fontFamily: "inherit",
              opacity: scheduling ? 0.7 : 1, marginTop: 4,
            }}>
              {scheduling ? "Agendando…" : "Confirmar retiros"}
            </button>

          </div>
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function CreateLinkClient() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("tienda");


  function switchTab(tab: ActiveTab) {
    setActiveTab(tab);
    localStorage.setItem("mochi_active_tab", tab);
    if (tab !== "crear" && envioPageStatus === "pagado") {
      setGeneratedUrl("");
      setGeneratedEnvioId(null);
      setEnvioPageStatus("pendiente");
      if (user) { localStorage.removeItem(lastUrlKey(user.id)); localStorage.removeItem(lastEnvioIdKey(user.id)); }
    }
  }
  const [profile, setProfile] = useState<ProfileState>(DEFAULT_PROFILE);
  const [pkg, setPkg] = useState<PackageState>(DEFAULT_PACKAGE);

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState("");

  const [loading, setLoading] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [generatedEnvioId, setGeneratedEnvioId] = useState<number | null>(null);
  const [envioPageStatus, setEnvioPageStatus] = useState<"pendiente" | "pagado">("pendiente");
  const [showCancelLinkModal, setShowCancelLinkModal] = useState(false);
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
  const [showDeliveryPropioModal, setShowDeliveryPropioModal] = useState(false);
  const [deliveryPropio, setDeliveryPropio] = useState<DeliveryPropioState>(DEFAULT_DELIVERY_PROPIO);
  const [pymeSlug, setPymeSlug] = useState("");
  const [linkFijoEnabled, setLinkFijoEnabled] = useState(false);
  const [defaultDims, setDefaultDims] = useState({ largo: "", alto: "", ancho: "", peso: "" });
  const [codigoPostalOrigen, setCodigoPostalOrigen] = useState<string | null>(null);
  const [copiedFijo, setCopiedFijo] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [linksCount, setLinksCount] = useState<{ used: number; limit: number } | null>(null);
  const [proStats, setProStats] = useState<{ pagados: number; pendientes: number; topCourier: string | null } | null>(null);
  const [enviosPendientesCount, setEnviosPendientesCount] = useState(0);
  const [askInstagram, setAskInstagram] = useState(false);
  const [couriersHabilitados, setCouriersHabilitados] = useState<string[]>(DEFAULT_COURIERS);

  const profileComplete = useMemo(() => isProfileComplete(profile), [profile]);
  const pkgComplete = useMemo(() => isPackageComplete(pkg), [pkg]);
  const isPro = linksCount?.limit === 999;
  const isEmprende = !isPro && (linksCount?.limit ?? 0) >= 40;
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
    const savedEnvioId = localStorage.getItem(lastEnvioIdKey(user.id));
    if (savedEnvioId) setGeneratedEnvioId(Number(savedEnvioId));
    try {
      const t: PackageTemplate[] = JSON.parse(localStorage.getItem(templatesKey(user.id)) ?? "[]");
      if (t.length) setTemplates(t);
    } catch {}
    supabase
      .from("pymes")
      .select("links_creados, limite_links, ask_instagram, nombre_tienda, logo_url, origen_comuna, origen_calle, origen_numero, origen_depto, couriers_habilitados, slug, link_fijo_enabled, default_largo, default_alto, default_ancho, default_peso, delivery_propio_enabled, delivery_propio_precio, delivery_propio_telefono, delivery_propio_banco, delivery_propio_cuenta, delivery_propio_titular, delivery_propio_rut, delivery_propio_email, codigo_postal")
      .eq("auth_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setLinksCount({ used: data.links_creados, limit: data.limite_links });
          setAskInstagram(data.ask_instagram ?? false);
          setCouriersHabilitados(data.couriers_habilitados ?? DEFAULT_COURIERS);
          setPymeSlug(data.slug ?? "");
          setLinkFijoEnabled(data.link_fijo_enabled ?? false);
          setCodigoPostalOrigen(data.codigo_postal ?? null);
          setDefaultDims({
            largo: String(data.default_largo ?? ""),
            alto: String(data.default_alto ?? ""),
            ancho: String(data.default_ancho ?? ""),
            peso: String(data.default_peso ?? ""),
          });
          setDeliveryPropio({
            enabled: data.delivery_propio_enabled ?? false,
            precio: data.delivery_propio_precio?.toString() ?? "",
            telefono: data.delivery_propio_telefono ?? "",
            banco: data.delivery_propio_banco ?? "",
            cuenta: data.delivery_propio_cuenta ?? "",
            titular: data.delivery_propio_titular ?? "",
            rut: data.delivery_propio_rut ?? "",
            email: data.delivery_propio_email ?? "",
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
            // Respetar tab guardado; solo ir a "crear" si no hay preferencia guardada
            const saved = localStorage.getItem("mochi_active_tab") as ActiveTab | null;
            setActiveTab(saved ?? "crear");
          }

          // Backfill silencioso: si la pyme ya tiene dirección pero no tiene código postal, calcularlo ahora
          if (
            !data.codigo_postal &&
            data.origen_calle &&
            data.origen_numero &&
            data.origen_comuna
          ) {
            fetch(
              `/api/geocode?calle=${encodeURIComponent(data.origen_calle)}&numero=${encodeURIComponent(data.origen_numero)}&comuna=${encodeURIComponent(data.origen_comuna)}`
            )
              .then((r) => r.json())
              .then((geo) => {
                if (geo.postcode) {
                  setCodigoPostalOrigen(geo.postcode);
                  supabase.from("pymes").update({ codigo_postal: geo.postcode }).eq("auth_id", user!.id);
                }
              })
              .catch(() => {});
          }
        }
      });

    // Fetch pro stats
    supabase
      .from("envios")
      .select("pago_status, courier")
      .eq("pyme_id", user.id)
      .then(({ data: enviosData }) => {
        if (!enviosData) return;
        const pagados = enviosData.filter((e) => e.pago_status === "pagado").length;
        const pendientes = enviosData.filter((e) => e.pago_status === "pendiente").length;
        const courierCounts: Record<string, number> = {};
        for (const e of enviosData) {
          if (e.courier) courierCounts[e.courier] = (courierCounts[e.courier] ?? 0) + 1;
        }
        const topCourier = Object.keys(courierCounts).sort((a, b) => courierCounts[b] - courierCounts[a])[0] ?? null;
        setProStats({ pagados, pendientes, topCourier });
      });
  }, [user]);

  useEffect(() => {
    if (generatedUrl && generatedCardRef.current) {
      setTimeout(() => {
        generatedCardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 120);
    }
  }, [generatedUrl]);

  useEffect(() => {
    if (!generatedEnvioId) return;
    console.log("[realtime] suscribiendo a envio id:", generatedEnvioId);
    const channel = supabase
      .channel(`envio-status-${generatedEnvioId}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "envios",
        filter: `id=eq.${generatedEnvioId}`,
      }, (payload) => {
        console.log("[realtime] UPDATE recibido:", payload);
        const nuevo = (payload.new as { pago_status?: string }).pago_status;
        console.log("[realtime] pago_status nuevo:", nuevo);
        if (!nuevo) return;
        if (nuevo === "pendiente") {
          setEnvioPageStatus("pendiente");
        } else {
          setEnvioPageStatus("pagado");
          setEnviosPendientesCount((prev) => prev + 1);
        }
      })
      .subscribe((status) => {
        console.log("[realtime] estado canal:", status);
      });
    return () => { supabase.removeChannel(channel); };
  }, [generatedEnvioId]);

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

      // Intentar obtener código postal desde Nominatim
      let codigoPostal: string | null = null;
      try {
        const geoRes = await fetch(
          `/api/geocode?calle=${encodeURIComponent(profile.origenCalle.trim())}&numero=${encodeURIComponent(profile.origenNumero.trim())}&comuna=${encodeURIComponent(profile.origenComuna.trim())}`
        );
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          codigoPostal = geoData.postcode ?? null;
          if (codigoPostal) setCodigoPostalOrigen(codigoPostal);
        }
      } catch {
        // Si falla el geocode, igual guardamos la dirección sin código postal
      }

      await supabase.from("pymes").update({
        nombre_tienda: profile.nombrePyme.trim(),
        logo_url: logoUrl || null,
        origen_comuna: profile.origenComuna.trim(),
        origen_calle: profile.origenCalle.trim(),
        origen_numero: profile.origenNumero.trim(),
        origen_depto: profile.origenDepto.trim() || null,
        ...(codigoPostal ? { codigo_postal: codigoPostal } : {}),
      }).eq("auth_id", currentUser.id);

      setProfileSaved(true);
      setTimeout(() => {
        switchTab("crear");
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

      // Guardar snapshot de couriers, delivery propio y código postal origen en el envío
      await supabase.from("envios").update({
        pyme_id: currentUser.id,
        couriers_habilitados: couriersHabilitados,
        ...(codigoPostalOrigen ? { codigo_postal_origen: codigoPostalOrigen } : {}),
        delivery_propio: deliveryPropio.enabled ? {
          enabled: true,
          precio: Number(deliveryPropio.precio),
          telefono: deliveryPropio.telefono,
          banco: deliveryPropio.banco,
          cuenta: deliveryPropio.cuenta,
          titular: deliveryPropio.titular,
          rut: deliveryPropio.rut,
          email: deliveryPropio.email,
        } : null,
      }).eq("id", Number(id));

      const slug = slugify(profile.nombrePyme);
      const code = Number(id).toString(36);
      const base = slug ? `/${slug}/envio/${code}` : `/envio?id=${id}`;
      const newUrl = `${window.location.origin}${base}`;
      localStorage.setItem(lastUrlKey(user!.id), newUrl);
      localStorage.setItem(lastEnvioIdKey(user!.id), String(id));
      setGeneratedUrl(newUrl);
      setGeneratedEnvioId(Number(id));
      setEnvioPageStatus("pendiente");
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
        .gen-page-title { font-size: 28px; }
        .gen-page-subtitle { display: block; }
        .gen-tabbar { max-width: 400px; }
        .gen-section-pad { padding: 24px; }
        .gen-envio-actions { flex-direction: column; }
        .gen-section-pad { padding: 24px; }
        .gen-schedule-panel { padding: 24px 20px 32px; }
        @media (max-width: 640px) {
          .gen-body { padding: 16px 12px 100px; }
          .gen-grid-2col { grid-template-columns: 1fr; }
          .gen-grid-4col { grid-template-columns: 1fr 1fr; }
          .gen-header-email { display: none; }
          .gen-links-count { font-size: 11px; }
          .gen-page-title { font-size: 21px !important; }
          .gen-page-subtitle { display: none; }
          .gen-tabbar { max-width: 100% !important; }
          .gen-section-pad { padding: 16px; }
          .gen-envio-actions { flex-direction: row; flex-wrap: wrap; align-items: center; }
          .gen-schedule-panel { padding: 20px 14px 28px; }
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
        @keyframes hero-enter {
          0%   { opacity: 0; transform: translateY(20px) scale(0.97); }
          60%  { opacity: 1; transform: translateY(-4px) scale(1.005); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .hero-enter { animation: hero-enter 0.45s cubic-bezier(0.34,1.56,0.64,1) both; }
        @keyframes link-reveal {
          0%   { opacity: 0; transform: translateX(32px) scale(0.96); }
          55%  { opacity: 1; transform: translateX(-6px) scale(1.01); }
          75%  { transform: translateX(3px) scale(0.995); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }
        .link-reveal { animation: link-reveal 0.42s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes url-flash {
          0%   { background: #fdf3f0; }
          30%  { background: #ffd5cc; box-shadow: 0 0 0 3px rgba(232,85,61,0.18); }
          100% { background: #fdf3f0; box-shadow: none; }
        }
        .url-flash { animation: url-flash 0.9s ease both; animation-delay: 0.3s; }
      `}</style>

      {/* Modal cancelar link */}
      {showCancelLinkModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={() => setShowCancelLinkModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#fff", borderRadius: 20, padding: "28px 24px", maxWidth: 360, width: "100%",
            boxShadow: "0 24px 60px rgba(0,0,0,0.2)", animation: "confirm-pop 0.25s cubic-bezier(0.16,1,0.3,1) both",
          }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#FFF0ED", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E8553D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <p style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 800, color: "#1A1A18" }}>¿Eliminar este link?</p>
            <p style={{ margin: "0 0 24px", fontSize: 13, color: "#9C9C95", lineHeight: 1.6 }}>
              Ya no podrás copiar ni compartir este link, asegúrate de haberlo guardado antes de continuar
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowCancelLinkModal(false)} style={{
                flex: 1, padding: "12px", borderRadius: 12, border: "1.5px solid #E8E8E3",
                background: "#fff", fontSize: 13, fontWeight: 700, color: "#5C5C57",
                cursor: "pointer", fontFamily: "inherit",
              }}>Cancelar</button>
              <button onClick={() => {
                setShowCancelLinkModal(false);
                setGeneratedUrl(""); setGeneratedEnvioId(null); setEnvioPageStatus("pendiente");
                if (user) { localStorage.removeItem(lastUrlKey(user.id)); localStorage.removeItem(lastEnvioIdKey(user.id)); }
              }} style={{
                flex: 1, padding: "12px", borderRadius: 12, border: "none",
                background: "#E8553D", fontSize: 13, fontWeight: 700, color: "#fff",
                cursor: "pointer", fontFamily: "inherit",
              }}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

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
          onOpenDeliveryPropio={() => setShowDeliveryPropioModal(true)}
          deliveryPropioEnabled={deliveryPropio.enabled}
          isPro={isPro}
          pymeSlug={pymeSlug}
          linkFijoEnabled={linkFijoEnabled}
          defaultDims={defaultDims}
          onSaveLinkFijo={handleSaveLinkFijo}
          onClose={() => setShowSettingsModal(false)}
        />
      )}
      {showDeliveryPropioModal && (
        <DeliveryPropioModal
          initial={deliveryPropio}
          onSave={async (dp) => {
            setDeliveryPropio(dp);
            if (user) await supabase.from("pymes").update({
              delivery_propio_enabled: dp.enabled,
              delivery_propio_precio: dp.precio ? Number(dp.precio) : null,
              delivery_propio_telefono: dp.telefono || null,
              delivery_propio_banco: dp.banco || null,
              delivery_propio_cuenta: dp.cuenta || null,
              delivery_propio_titular: dp.titular || null,
              delivery_propio_rut: dp.rut || null,
              delivery_propio_email: dp.email || null,
            }).eq("auth_id", user.id);
          }}
          onClose={() => setShowDeliveryPropioModal(false)}
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
                  ) : isEmprende ? (
                    <span className="gen-links-count" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "#2D8A56", background: "#F0FAF4", border: "1px solid #B8E2C8", borderRadius: 100, padding: "3px 10px" }}>
                      ✦ Plan Emprende
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
          <h1 style={{ margin: "0 0 10px", fontWeight: 700, color: "#1A1A18", lineHeight: 1.2 }} className="gen-page-title">
            Tu cliente elige courier y paga solo.
          </h1>
          <p style={{ margin: 0, fontSize: 15, color: "#5C5C57" }} className="gen-page-subtitle">
            Configura tu tienda una vez — después crear links toma menos de 30 segundos.
          </p>
        </div>

        {/* ── TabBar ─────────────────────────────────────────────────────────── */}
        <div style={{
          display: "flex", gap: 4,
          background: "#F0F0EB", borderRadius: 14, padding: 4,
          marginBottom: 28,
        }} className="gen-tabbar">
          {([
            { id: "tienda", label: "Mi Tienda" },
            { id: "crear", label: "Crear Link" },
            { id: "envios", label: "Mis Envíos" },
          ] as { id: ActiveTab; label: string }[]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => switchTab(tab.id)}
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
              {tab.id === "envios" && enviosPendientesCount > 0 && (
                <span style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  minWidth: 16, height: 16, borderRadius: 20, fontSize: 10, fontWeight: 700,
                  background: "#E8553D", color: "#fff", marginLeft: 6, padding: "0 4px",
                  verticalAlign: "middle", marginTop: -2,
                }}>{enviosPendientesCount}</span>
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
                <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E8E8E3", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }} className="gen-section-pad">
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
                <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E8E8E3", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }} className="gen-section-pad">
                  <SectionTitle n={2} label="Dirección de retiro" />
                  <p style={{ margin: "-8px 0 18px", fontSize: 13, color: "#9C9C95" }}>
                    El courier viene aquí a buscar el paquete. También calcula el precio desde esta dirección.
                  </p>
                  <div className="gen-grid-2col">
                    <Field label="Comuna *">
                      <ComunaAutocomplete value={profile.origenComuna} onChange={(v) => setP("origenComuna", v)} />
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

            {/* ════ TAB 3: Mis Envíos ════ */}
            {activeTab === "envios" && user && (
              <MisEnviosView userId={user.id} isPro={isPro} origenComuna={profile.origenComuna} onPendientesCount={setEnviosPendientesCount} />
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
                      onClick={() => switchTab("tienda")}
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
                      onClick={() => switchTab("tienda")}
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
                  <div className="hero-enter" style={{ background: "#fff", borderRadius: 20, border: "1px solid #E8E8E3", overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
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
                <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E8E8E3", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }} className="gen-section-pad">
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
                      onClick={() => { if (user) { localStorage.removeItem(lastUrlKey(user.id)); localStorage.removeItem(lastEnvioIdKey(user.id)); } setGeneratedUrl(""); setPkg(DEFAULT_PACKAGE); }}
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

          {/* ── RIGHT: Panel fijo ─────────────────────────────── */}
          <div style={{ position: "sticky", top: 76, height: "fit-content", display: activeTab === "envios" ? "none" : "flex", flexDirection: "column", gap: 10 }}>

            {/* Tips panel — solo en Mi Tienda */}
            {activeTab === "tienda" && (
              <div style={{ animation: "tips-in 0.4s cubic-bezier(0.16,1,0.3,1) both" }}>
                <style>{`
                  @keyframes tips-in {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                  }
                  @keyframes tip-card {
                    from { opacity: 0; transform: translateY(12px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                  }
                  @keyframes pulse-dot {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.5); opacity: 0.5; }
                  }
                  .tip-card:hover {
                    transform: translateY(-2px) !important;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.10) !important;
                  }
                `}</style>

                {/* Header */}
                <div style={{
                  background: "linear-gradient(135deg, #1A1A18 0%, #2D2D2A 100%)",
                  borderRadius: 16, padding: "20px", marginBottom: 10,
                  position: "relative", overflow: "hidden",
                }}>
                  <div style={{
                    position: "absolute", top: -20, right: -20, width: 100, height: 100,
                    background: "radial-gradient(circle, rgba(232,85,61,0.3) 0%, transparent 70%)",
                    borderRadius: "50%",
                  }} />
                  <div style={{
                    position: "absolute", bottom: -10, left: 10, width: 60, height: 60,
                    background: "radial-gradient(circle, rgba(232,85,61,0.15) 0%, transparent 70%)",
                    borderRadius: "50%",
                  }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{
                      width: 7, height: 7, borderRadius: "50%", background: "#E8553D",
                      display: "inline-block", animation: "pulse-dot 2s ease-in-out infinite",
                    }} />
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#E8553D", textTransform: "uppercase", letterSpacing: "0.12em" }}>Tips LinkDrop</span>
                  </div>
                  <p style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>
                    Sácale el máximo<br />a tu cuenta
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>
                    Configura bien tu tienda y crea links en segundos
                  </p>
                </div>

                {/* Tips */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { n: "01", title: "Un link, un pedido", body: "Tu cliente elige el courier y paga solo, tú solo preparas el paquete", accent: "#E8553D" },
                    { n: "02", title: "La dirección define el precio", body: "Los couriers calculan desde tu origen, mantenla siempre actualizada", accent: "#6B5CE7" },
                    { n: "03", title: "Menos couriers, más claridad", body: "Activa solo los que usas, menos opciones es mejor experiencia para tu cliente", accent: "#2D8A56" },
                  ].map((tip, i) => (
                    <div key={i} className="tip-card" style={{
                      background: "#fff", border: "1px solid #EBEBEB",
                      borderRadius: 14, padding: "14px 16px",
                      animation: `tip-card 0.4s cubic-bezier(0.16,1,0.3,1) ${0.08 + i * 0.07}s both`,
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                      cursor: "default",
                    }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                        <span style={{
                          fontSize: 11, fontWeight: 800, color: tip.accent,
                          flexShrink: 0, letterSpacing: "0.02em", marginTop: 1,
                          minWidth: 24,
                        }}>{tip.n}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 700, color: "#1A1A18" }}>{tip.title}</p>
                          <p style={{ margin: 0, fontSize: 12, color: "#9C9C95", lineHeight: 1.55 }}>{tip.body}</p>
                        </div>
                        <div style={{
                          width: 4, height: 4, borderRadius: "50%",
                          background: tip.accent, flexShrink: 0, marginTop: 6,
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab !== "tienda" && (
            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: "#9C9C95", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {isPro && linkFijoEnabled && pymeSlug ? "Tu cuenta" : (generatedUrl ? "Tu link" : "Así lo ve tu cliente")}
            </p>
            )}

            {/* ── Contenido panel derecho — solo en Crear Link ── */}
            {activeTab === "crear" && <>

            {/* ── Pro dashboard (siempre visible cuando Pro + link fijo) ── */}
            {isPro && linkFijoEnabled && pymeSlug && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {/* Couriers */}
                <button onClick={() => setShowCouriersModal(true)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderRadius: 14, border: "1px solid #E8E8E3", background: "#fff", cursor: "pointer", fontFamily: "inherit", width: "100%", textAlign: "left" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#1A1A18"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E8E8E3"; }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1A1A18" }}>Couriers</p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9C9C95" }}>{couriersHabilitados.length === ALL_COURIERS.length ? "Todos activos" : `${couriersHabilitados.length} de ${ALL_COURIERS.length} activos`}</p>
                  </div>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9C9C95" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
                {/* Configuración */}
                <button onClick={() => setShowSettingsModal(true)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderRadius: 14, border: "1px solid #E8E8E3", background: "#fff", cursor: "pointer", fontFamily: "inherit", width: "100%", textAlign: "left" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#1A1A18"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E8E8E3"; }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1A1A18" }}>Configuración</p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9C9C95" }}>Instagram, link permanente y más</p>
                  </div>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9C9C95" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
                {/* Plan Pro badge */}
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
            )}

            {/* ── Link manual generado (Pro: aparece debajo del dashboard; no Pro: reemplaza preview) ── */}
            {generatedUrl && (
              <div className="link-reveal" style={{ borderRadius: 18, overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.06), 0 20px 40px -8px rgba(0,0,0,0.18)", border: "1px solid rgba(0,0,0,0.08)" }}>
                <style>{`
                  @keyframes link-glow {
                    0%, 100% { opacity: 0.5; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.08); }
                  }
                  @keyframes link-scan {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(400%); }
                  }
                  @keyframes url-appear {
                    from { opacity: 0; transform: translateY(4px); }
                    to { opacity: 1; transform: translateY(0); }
                  }
                  .share-btn:hover { background: rgba(255,255,255,0.12) !important; transform: translateY(-1px); }
                  .copy-btn-link:hover { background: rgba(255,255,255,0.2) !important; }
                `}</style>

                {/* Hero dark */}
                <div style={{
                  background: "linear-gradient(145deg, #1C1B18 0%, #252420 60%, #1A1916 100%)",
                  padding: "22px 20px 20px", position: "relative", overflow: "hidden",
                }}>
                  {envioPageStatus === "pendiente" && (
                    <button
                      onClick={() => setShowCancelLinkModal(true)}
                      style={{ position: "absolute", top: 12, right: 12, width: 26, height: 26, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.4)", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit", transition: "all 0.15s", zIndex: 2 }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
                    >✕</button>
                  )}
                  {/* Orbs animados */}
                  <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle, rgba(232,85,61,0.25) 0%, transparent 70%)", animation: "link-glow 3s ease-in-out infinite", pointerEvents: "none" }} />
                  <div style={{ position: "absolute", bottom: -20, left: -10, width: 80, height: 80, borderRadius: "50%", background: "radial-gradient(circle, rgba(107,92,231,0.2) 0%, transparent 70%)", animation: "link-glow 4s ease-in-out infinite 1s", pointerEvents: "none" }} />
                  {/* Scan line */}
                  <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
                    <div style={{ position: "absolute", left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(232,85,61,0.4), transparent)", animation: "link-scan 3s linear infinite" }} />
                  </div>

                  {/* Badge estado */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: envioPageStatus === "pagado" ? "#4CD38A" : "#F5A623", display: "inline-block", animation: "pulse-dot 2s ease-in-out infinite" }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                      {envioPageStatus === "pagado" ? "¡Pagado!" : "Esperando pago"}
                    </span>
                  </div>

                  {envioPageStatus === "pagado" ? (
                    <>
                      <p style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 800, color: "#fff", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
                        Tu cliente<br /><span style={{ color: "#4CD38A" }}>pagó el envío</span>
                      </p>
                      <p style={{ margin: "0 0 18px", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                        La guía se está generando, revisa Mis Envíos
                      </p>
                    </>
                  ) : (
                    <>
                      <p style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 800, color: "#fff", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
                        Tu link está<br /><span style={{ color: "#E8553D" }}>listo</span>
                      </p>
                      <p style={{ margin: "0 0 18px", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                        Compártelo, tu cliente hace el resto
                      </p>
                    </>
                  )}

                  {/* URL pill */}
                  <div style={{
                    background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12, padding: "10px 14px",
                    display: "flex", alignItems: "center", gap: 10,
                    animation: "url-appear 0.4s ease 0.2s both",
                  }}>
                    <p style={{
                      margin: 0, flex: 1,
                      fontFamily: "ui-monospace, monospace",
                      fontSize: 10, color: "rgba(255,255,255,0.6)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {generatedUrl}
                    </p>
                    <button onClick={copyUrl} className="copy-btn-link" title={copied ? "Copiado" : "Copiar"} style={{
                      flexShrink: 0, width: 28, height: 28, borderRadius: 8,
                      border: "1px solid rgba(255,255,255,0.15)",
                      background: copied ? "rgba(76,211,138,0.2)" : "rgba(255,255,255,0.08)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", transition: "all 0.15s",
                    }}>
                      {copied ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4CD38A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* CTA cuando pagado */}
                  {envioPageStatus === "pagado" && (
                    <button onClick={() => { setGeneratedUrl(""); setGeneratedEnvioId(null); setEnvioPageStatus("pendiente"); if (user) { localStorage.removeItem(lastUrlKey(user.id)); localStorage.removeItem(lastEnvioIdKey(user.id)); } switchTab("envios"); }} style={{
                      width: "100%", marginTop: 12, padding: "11px",
                      background: "#4CD38A", color: "#0F2D1E",
                      border: "none", borderRadius: 12, fontSize: 13, fontWeight: 800,
                      cursor: "pointer", fontFamily: "inherit", letterSpacing: "-0.01em",
                      animation: "url-appear 0.4s ease both",
                    }}>
                      Ver en Mis Envíos →
                    </button>
                  )}

                  {/* Chips */}
                  {allDims && (
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 10 }}>
                      {[allDims, `${couriersHabilitados.length} courier${couriersHabilitados.length !== 1 ? "s" : ""}`, "Válido 48h"].map((chip) => (
                        <span key={chip} style={{
                          background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 100, padding: "3px 10px", fontSize: 10, color: "rgba(255,255,255,0.45)",
                        }}>{chip}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Compartir */}
                <div style={{ background: "#201F1C", padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`Para coordinar tu pedido necesito que completes este formulario con tus datos: 👉 ${generatedUrl} Es rápido, menos de 1 minuto 🙌 — ${profile.nombrePyme}`)}`}
                      target="_blank" rel="noreferrer"
                      className="share-btn"
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: "10px 6px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.7)", textDecoration: "none", transition: "all 0.15s" }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" /></svg>
                      WhatsApp
                    </a>
                    <a
                      href={`mailto:?subject=${encodeURIComponent(`Link de envío — ${profile.nombrePyme}`)}&body=${encodeURIComponent(`Hola, para coordinar tu pedido completa este formulario: ${generatedUrl}`)}`}
                      className="share-btn"
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: "10px 6px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.7)", textDecoration: "none", transition: "all 0.15s" }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 7l10 7 10-7" />
                      </svg>
                      Email
                    </a>
                    <button
                      onClick={() => { if (typeof navigator !== "undefined" && navigator.share) { navigator.share({ title: `Link de envío — ${profile.nombrePyme}`, url: generatedUrl }); } else { copyUrl(); } }}
                      className="share-btn"
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: "10px 6px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.7)", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                        <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
                      </svg>
                      Compartir
                    </button>
                  </div>
                </div>

                {/* Plan / Cuota */}
                {linksCount && !isPro && (
                  <div style={{ borderTop: "1px solid #F0F0EB", padding: "12px 16px" }}>
                    {isEmprende && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "#2D8A56", background: "#F0FAF4", border: "1px solid #B8E2C8", borderRadius: 100, padding: "2px 10px" }}>
                          ✦ Plan Emprende
                        </span>
                        <span style={{ fontSize: 11, color: "#9C9C95" }}>{linksCount.used} / {linksCount.limit} links</span>
                      </div>
                    )}
                    {!isEmprende && (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <p style={{ margin: 0, fontSize: 11, color: "#9C9C95" }}>Links usados</p>
                        <p style={{ margin: 0, fontSize: 11, fontWeight: 500, color: linksCount.used >= linksCount.limit ? "#E84B2A" : "#1A1A18" }}>
                          {linksCount.used} / {linksCount.limit}
                        </p>
                      </div>
                    )}
                    <div style={{ height: 3, background: "#F0F0EB", borderRadius: 100, overflow: "hidden" }}>
                      <div style={{
                        height: "100%",
                        width: `${Math.min((linksCount.used / linksCount.limit) * 100, 100)}%`,
                        background: linksCount.used >= linksCount.limit ? "#E84B2A" : isEmprende ? "#2D8A56" : "#1A1A18",
                        borderRadius: 100, transition: "width 0.4s ease",
                      }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Preview normal (no Pro o sin link fijo activo) ── */}
            {!generatedUrl && !(isPro && linkFijoEnabled && pymeSlug) ? (
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

            </>}{/* fin activeTab === "crear" */}
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
