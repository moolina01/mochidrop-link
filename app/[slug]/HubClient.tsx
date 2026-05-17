"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/utils/supabase";
import type { User } from "@supabase/supabase-js";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type HubProps = {
  slug: string;
  pymeId: string;
  nombrePyme: string;
  logoPyme: string | null;
  couriersHabilitados: string[] | null;
  defaultDims: { largo: number | null; alto: number | null; ancho: number | null; peso: number | null };
  infoEnvios: string | null;
};

type Tab = "cotizar" | "rastrear" | "info" | "crear";

type CotizacionItem = {
  price?: number | null;
  tiempo?: string;
  label?: string;
};

const COURIER_CONFIG: Record<string, { color: string; colorLight: string; label: string }> = {
  starken:           { color: "#00A651", colorLight: "#E8F8EE", label: "Starken" },
  starken_domicilio: { color: "#00A651", colorLight: "#E8F8EE", label: "Starken Domicilio" },
  starken_sucursal:  { color: "#00A651", colorLight: "#E8F8EE", label: "Starken Sucursal" },
  chilexpress:       { color: "#B8860B", colorLight: "#FFFBE8", label: "Chilexpress" },
  blueexpress:       { color: "#0055B8", colorLight: "#E8F0FA", label: "Blue Express" },
  noventa9Minutos:   { color: "#E8553D", colorLight: "#FFF0EE", label: "99 Minutos" },
  "99minutos":       { color: "#E8553D", colorLight: "#FFF0EE", label: "99 Minutos" },
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

const PKG_PRESETS = [
  { id: "sobre",  label: "Sobre",       desc: "hasta 0.3 kg", largo: 30, alto: 20, ancho: 3,  peso: 0.3 },
  { id: "xs",     label: "Pequeño",     desc: "hasta 0.7 kg", largo: 35, alto: 25, ancho: 10, peso: 0.7 },
  { id: "m",      label: "Mediano",     desc: "hasta 1.5 kg", largo: 40, alto: 30, ancho: 15, peso: 1.5 },
  { id: "l",      label: "Grande",      desc: "hasta 3 kg",   largo: 45, alto: 35, ancho: 20, peso: 3   },
  { id: "caja_g", label: "Caja grande", desc: "hasta 8 kg",   largo: 55, alto: 45, ancho: 30, peso: 8   },
];

// ─── ComunaAutocomplete ───────────────────────────────────────────────────────

function ComunaAutocomplete({ value, onChange, placeholder = "Ej: Las Condes", inputStyle: extraStyle }: { value: string; onChange: (v: string) => void; placeholder?: string; inputStyle?: React.CSSProperties }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  const results = query.length >= 2
    ? COMUNAS_CHILE.filter((c) => c.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : [];

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input
        type="text" value={query} autoComplete="off" placeholder="Ej: Las Condes"
        onChange={(e) => { setQuery(e.target.value); onChange(""); setOpen(true); }}
        onFocus={() => { if (query.length >= 2) setOpen(true); }}
        style={{ width: "100%", boxSizing: "border-box", border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "13px 16px", fontSize: 15, color: "#F5F3EE", background: "rgba(255,255,255,0.06)", outline: "none", fontFamily: "inherit", ...extraStyle }}
        onFocusCapture={(e) => { e.currentTarget.style.borderColor = "#E8553D"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(232,85,61,0.15)"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = extraStyle?.border ? String(extraStyle.border).split(" ")[2] ?? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
      />
      {open && results.length > 0 && (
        <div style={{ position: "absolute", zIndex: 50, width: "100%", background: "#fff", border: "1px solid #E8E8E3", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", marginTop: 4, overflow: "hidden" }}>
          {results.map((c) => (
            <button key={c} type="button" onMouseDown={() => { setQuery(c); onChange(c); setOpen(false); }}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "11px 16px", fontSize: 14, color: "#1A1A18", background: "none", border: "none", borderBottom: "1px solid #F5F5F0", cursor: "pointer", fontFamily: "inherit" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#FFF0ED"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
            >{c}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── HubClient ────────────────────────────────────────────────────────────────

export default function HubClient({ slug, pymeId, nombrePyme, logoPyme, couriersHabilitados, defaultDims, infoEnvios }: HubProps) {
  const [activeTab, setActiveTab] = useState<Tab>("cotizar");
  const [isOwner, setIsOwner] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.id === pymeId) setIsOwner(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsOwner(session?.user?.id === pymeId);
    });
    return () => subscription.unsubscribe();
  }, [pymeId]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "cotizar",  label: "Cotizar"     },
    { id: "rastrear", label: "Rastrear"    },
    { id: "info",     label: "Info"        },
    ...(isOwner ? [{ id: "crear" as Tab, label: "Crear envío" }] : []),
  ];

  const tabIndex = tabs.findIndex(t => t.id === activeTab);
  const initials = nombrePyme.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'Instrument Sans', system-ui, sans-serif", background: "#0E0E0C", position: "relative", overflow: "hidden" }}>
      <style>{`
        @keyframes hub-mount {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes hub-glow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50%       { opacity: 0.6; transform: scale(1.08); }
        }
        @keyframes hub-content {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hub-mounted { animation: hub-mount 0.5s cubic-bezier(0.16,1,0.3,1) both; }
        .hub-tab-content { animation: hub-content 0.28s cubic-bezier(0.16,1,0.3,1) both; }
        .hub-action-btn { transition: transform 0.14s ease, opacity 0.14s ease; }
        .hub-action-btn:active { transform: scale(0.97); opacity: 0.85; }
        .hub-tab-trigger { transition: color 0.2s ease; }
        .hub-tab-trigger:hover { opacity: 0.75; }
        .hub-card { transition: transform 0.15s ease; }
        .hub-card:active { transform: scale(0.995); }
      `}</style>

      {/* Ambient glow blobs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{
          position: "absolute", top: "-10%", left: "50%", transform: "translateX(-50%)",
          width: 480, height: 480, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(232,85,61,0.18) 0%, transparent 70%)",
          animation: "hub-glow 6s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute", bottom: "10%", right: "-10%",
          width: 320, height: 320, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(120,100,200,0.1) 0%, transparent 70%)",
          animation: "hub-glow 8s ease-in-out infinite 2s",
        }} />
      </div>

      <div className={mounted ? "hub-mounted" : ""} style={{ position: "relative", zIndex: 1, maxWidth: 440, margin: "0 auto", padding: "0 20px 100px" }}>

        {/* Hero */}
        <div style={{ paddingTop: 64, paddingBottom: 36, display: "flex", flexDirection: "column", alignItems: "center" }}>

          {/* Avatar */}
          <div style={{
            width: 80, height: 80, borderRadius: "50%", marginBottom: 20,
            background: logoPyme ? "#000" : "#1A1A18",
            border: "1.5px solid rgba(255,255,255,0.1)",
            boxShadow: "0 0 0 6px rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden", flexShrink: 0,
          }}>
            {logoPyme
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={logoPyme} alt={nombrePyme} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontSize: 26, fontWeight: 800, color: "rgba(255,255,255,0.85)", letterSpacing: "-0.03em" }}>{initials}</span>
            }
          </div>

          <h1 style={{
            margin: "0 0 8px", textAlign: "center",
            fontSize: 26, fontWeight: 800, letterSpacing: "-0.04em",
            color: "#F5F3EE", lineHeight: 1.1,
          }}>
            {nombrePyme}
          </h1>

          <p style={{ margin: "0 0 24px", fontSize: 12, color: "rgba(255,255,255,0.3)", letterSpacing: "0.02em" }}>
            linkdrop.cl/{slug}
          </p>

          {isOwner ? (
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
              color: "#4CD38A", background: "rgba(76,211,138,0.1)",
              border: "1px solid rgba(76,211,138,0.25)",
              borderRadius: 100, padding: "5px 14px",
            }}>
              ✓ MI TIENDA
            </span>
          ) : (
            <button onClick={() => setShowLogin(true)} className="hub-action-btn" style={{
              fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)",
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 100, padding: "7px 18px", cursor: "pointer", fontFamily: "inherit",
            }}>
              Soy la tienda
            </button>
          )}
        </div>

        {/* Sliding tabs */}
        <div style={{
          position: "relative", display: "flex",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16, padding: 4, marginBottom: 20,
        }}>
          {/* Sliding pill */}
          <div style={{
            position: "absolute", top: 4, bottom: 4,
            left: `calc(${tabIndex} * (100% / ${tabs.length}) + 4px)`,
            width: `calc(100% / ${tabs.length} - 8px)`,
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
            transition: "left 0.3s cubic-bezier(0.16,1,0.3,1)",
            zIndex: 0,
          }} />
          {tabs.map((tab, i) => {
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="hub-tab-trigger" style={{
                flex: 1, position: "relative", zIndex: 1,
                padding: "10px 4px", background: "none", border: "none",
                fontSize: 12, fontWeight: active ? 700 : 500,
                color: active ? "#1A1A18" : "rgba(255,255,255,0.4)",
                cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              }}>
                {tab.label}
                {tab.id === "crear" && (
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: active ? "#E8553D" : "#E8553D", display: "inline-block", opacity: active ? 1 : 0.6 }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div>
          {activeTab === "cotizar" && (
            <div key="cotizar" className="hub-tab-content">
              <TabCotizar pymeId={pymeId} couriersHabilitados={couriersHabilitados} defaultDims={defaultDims} />
            </div>
          )}
          {activeTab === "rastrear" && (
            <div key="rastrear" className="hub-tab-content">
              <TabRastrear pymeId={pymeId} />
            </div>
          )}
          {activeTab === "info" && (
            <div key="info" className="hub-tab-content">
              <TabInfo infoEnvios={infoEnvios} nombrePyme={nombrePyme} />
            </div>
          )}
          {activeTab === "crear" && isOwner && (
            <div key="crear" className="hub-tab-content">
              <TabCrear pymeId={pymeId} nombrePyme={nombrePyme} couriersHabilitados={couriersHabilitados} defaultDims={defaultDims} />
            </div>
          )}
        </div>

        {/* Footer */}
        <p style={{ textAlign: "center", marginTop: 48, fontSize: 11, color: "rgba(255,255,255,0.15)", letterSpacing: "0.06em" }}>
          LINKDROP
        </p>
      </div>

      {showLogin && (
        <LoginModal pymeId={pymeId} onClose={() => setShowLogin(false)} />
      )}
    </div>
  );
}

// ─── Tab Cotizar ──────────────────────────────────────────────────────────────

const TRUST_ITEMS = [
  { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, label: "Envíos 100% seguros" },
  { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, label: "Despacho en 24 horas" },
  { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, label: "Atención por WhatsApp" },
];

const AVATAR_COLORS = ["#E8553D","#2D8A56","#0057B8","#8B5CF6","#F59E0B","#EC4899"];
const AVATARS = ["MA","JG","CC","RV","LP","SS"];

function TabCotizar({ pymeId, couriersHabilitados, defaultDims }: { pymeId: string; couriersHabilitados: string[] | null; defaultDims: HubProps["defaultDims"] }) {
  const [comuna, setComuna] = useState("");
  const [cotizando, setCotizando] = useState(false);
  const [resultados, setResultados] = useState<Record<string, CotizacionItem> | null>(null);
  const [error, setError] = useState("");

  const FALLBACK_DIMS = { largo: 30, alto: 20, ancho: 10, peso: 1 };
  const dims = (defaultDims.largo && defaultDims.alto && defaultDims.ancho && defaultDims.peso)
    ? { largo: defaultDims.largo, alto: defaultDims.alto, ancho: defaultDims.ancho, peso: defaultDims.peso }
    : FALLBACK_DIMS;

  async function handleCotizar() {
    if (!comuna) { setError("Ingresa tu comuna de destino"); return; }
    setError(""); setCotizando(true); setResultados(null);
    try {
      const res = await fetch("/api/cotizar-publico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pymeId, datosDestino: { comuna }, ...dims }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al cotizar");
      setResultados(data.cotizaciones ?? {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cotizar");
    } finally {
      setCotizando(false);
    }
  }

  const allowed = couriersHabilitados ?? Object.keys(COURIER_CONFIG);
  const resultKeys = resultados ? Object.keys(resultados).filter((k) => allowed.includes(k) && resultados![k]?.price != null) : [];
  const cheapest = resultKeys.length > 0 ? resultKeys.reduce((a, b) => (resultados![a]!.price! < resultados![b]!.price! ? a : b)) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Barra de búsqueda tipo ubicación */}
      <div style={{ position: "relative" }}>
        <div style={{
          position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
          color: "rgba(255,255,255,0.35)", pointerEvents: "none", display: "flex", zIndex: 2,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
        <ComunaAutocomplete
          value={comuna}
          onChange={setComuna}
          placeholder="Busca tu comuna..."
          inputStyle={{
            paddingLeft: 46, paddingRight: 16, paddingTop: 16, paddingBottom: 16,
            fontSize: 16, borderRadius: 16,
            border: "1.5px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.07)",
            color: "#F5F3EE",
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          }}
        />
      </div>

      {error && <p style={{ margin: 0, fontSize: 13, color: "#E8553D", background: "rgba(232,85,61,0.1)", border: "1px solid rgba(232,85,61,0.2)", padding: "10px 14px", borderRadius: 10 }}>{error}</p>}

      <button onClick={handleCotizar} disabled={cotizando || !comuna} className="hub-action-btn" style={{
        width: "100%", padding: "16px", borderRadius: 14, border: "none",
        background: cotizando || !comuna ? "rgba(255,255,255,0.07)" : "#E8553D",
        color: cotizando || !comuna ? "rgba(255,255,255,0.25)" : "#fff",
        fontSize: 15, fontWeight: 700, cursor: cotizando || !comuna ? "not-allowed" : "pointer",
        fontFamily: "inherit", transition: "all 0.2s", letterSpacing: "-0.01em",
      }}>
        {cotizando ? "Cotizando…" : "Ver precios de envío →"}
      </button>

      {/* Resultados */}
      {resultados && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Precios a {comuna}
          </p>
          {resultKeys.length === 0 && (
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", textAlign: "center", padding: "20px 0" }}>No hay couriers disponibles para esta comuna.</p>
          )}
          {resultKeys.map((key) => {
            const cot = resultados![key]!;
            const cfg = COURIER_CONFIG[key] ?? { color: "#5C5C57", colorLight: "#F5F5F0", label: key };
            const isCheapest = key === cheapest;
            return (
              <div key={key} style={{ background: "#fff", border: `1.5px solid ${isCheapest ? cfg.color : "transparent"}`, borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, position: "relative" }}>
                {isCheapest && (
                  <span style={{ position: "absolute", top: -10, left: 14, fontSize: 10, fontWeight: 700, background: cfg.color, color: "#fff", borderRadius: 100, padding: "2px 10px" }}>Más económico</span>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, background: cfg.colorLight, borderRadius: 100, padding: "3px 10px" }}>{cfg.label}</span>
                  {cot.tiempo && <span style={{ fontSize: 11, color: "#9C9C95" }}>{cot.tiempo}</span>}
                </div>
                <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#1A1A18", letterSpacing: "-0.02em" }}>
                  ${(cot.price ?? 0).toLocaleString("es-CL")}
                </p>
              </div>
            );
          })}
          {resultKeys.length > 0 && (
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.2)", textAlign: "center" }}>
              Precio referencial — el valor final estará en el link de envío.
            </p>
          )}
        </div>
      )}

      {/* Trust badges */}
      <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
        {TRUST_ITEMS.map((item, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 12,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 12, padding: "13px 16px",
          }}>
            <div style={{ color: "#E8553D", flexShrink: 0, display: "flex" }}>{item.icon}</div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>{item.label}</p>
          </div>
        ))}
      </div>

      {/* Social proof */}
      <div style={{
        marginTop: 4,
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 16, padding: "20px 18px",
        display: "flex", flexDirection: "column", gap: 16,
      }}>
        {/* Avatares + contadores */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex" }}>
            {AVATARS.map((initials, i) => (
              <div key={i} style={{
                width: 32, height: 32, borderRadius: "50%",
                background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                border: "2px solid #0E0E0C",
                marginLeft: i === 0 ? 0 : -10,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 700, color: "#fff",
                zIndex: AVATARS.length - i,
                position: "relative",
              }}>
                {initials}
              </div>
            ))}
          </div>
          <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.4 }}>
            <span style={{ fontWeight: 700, color: "#F5F3EE" }}>+98 clientes</span> ya recibieron sus pedidos
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "14px 16px" }}>
            <p style={{ margin: "0 0 2px", fontSize: 22, fontWeight: 800, color: "#F5F3EE", letterSpacing: "-0.04em" }}>+1.240</p>
            <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>envíos realizados</p>
          </div>
          <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "14px 16px" }}>
            <p style={{ margin: "0 0 2px", fontSize: 22, fontWeight: 800, color: "#4CD38A", letterSpacing: "-0.04em" }}>98%</p>
            <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>entregados correctamente</p>
          </div>
        </div>
      </div>

    </div>
  );
}

// ─── Tab Rastrear ─────────────────────────────────────────────────────────────

function TabRastrear({ pymeId }: { pymeId: string }) {
  const [tracking, setTracking] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [resultado, setResultado] = useState<{ tracking_url?: string; courier?: string; estado?: string } | null>(null);
  const [error, setError] = useState("");

  async function handleBuscar() {
    if (!tracking.trim()) { setError("Ingresa tu número de seguimiento"); return; }
    setError("");
    setBuscando(true);
    setResultado(null);
    try {
      const { data, error: dbError } = await supabase
        .from("envios")
        .select("tracking_url, courier, pago_status")
        .eq("pyme_id", pymeId)
        .eq("tracking", tracking.trim())
        .maybeSingle();

      if (dbError || !data) {
        setError("No encontramos un envío con ese número. Verifica que sea el tracking correcto.");
        return;
      }
      if (data.tracking_url) {
        window.open(data.tracking_url, "_blank");
      }
      setResultado({ tracking_url: data.tracking_url ?? undefined, courier: data.courier ?? undefined, estado: data.pago_status ?? undefined });
    } catch {
      setError("Error al buscar. Intenta de nuevo.");
    } finally {
      setBuscando(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", padding: "18px 20px" }}>
        <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#F5F3EE" }}>Rastrea tu pedido</p>
        <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>Ingresa el número de seguimiento que te envió la tienda.</p>
      </div>

      <div>
        <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>Número de tracking</p>
        <input
          type="text" value={tracking} onChange={(e) => setTracking(e.target.value)}
          placeholder="Ej: 12345678"
          onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
          style={{ width: "100%", boxSizing: "border-box", border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "13px 16px", fontSize: 15, color: "#F5F3EE", background: "rgba(255,255,255,0.06)", outline: "none", fontFamily: "inherit" }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "#E8553D"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(232,85,61,0.15)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
        />
      </div>

      {error && <p style={{ margin: 0, fontSize: 13, color: "#E8553D", background: "rgba(232,85,61,0.1)", border: "1px solid rgba(232,85,61,0.2)", padding: "10px 14px", borderRadius: 10 }}>{error}</p>}

      <button onClick={handleBuscar} disabled={buscando || !tracking.trim()} className="hub-action-btn" style={{
        width: "100%", padding: "16px", borderRadius: 14, border: "none",
        background: buscando || !tracking.trim() ? "rgba(255,255,255,0.08)" : "#F5F3EE",
        color: buscando || !tracking.trim() ? "rgba(255,255,255,0.3)" : "#1A1A18",
        fontSize: 15, fontWeight: 700, cursor: buscando || !tracking.trim() ? "not-allowed" : "pointer",
        fontFamily: "inherit", transition: "all 0.2s", letterSpacing: "-0.01em",
      }}>
        {buscando ? "Buscando…" : "Rastrear pedido →"}
      </button>

      {resultado && (
        <div style={{ background: "#fff", borderRadius: 14, padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#F0FAF4", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2D8A56" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1A1A18" }}>Envío encontrado</p>
              {resultado.courier && <p style={{ margin: 0, fontSize: 12, color: "#9C9C95" }}>{COURIER_CONFIG[resultado.courier]?.label ?? resultado.courier}</p>}
            </div>
          </div>
          {resultado.tracking_url && (
            <a href={resultado.tracking_url} target="_blank" rel="noopener noreferrer" style={{ display: "block", width: "100%", boxSizing: "border-box", padding: "13px", borderRadius: 12, background: "#2D8A56", color: "#fff", textAlign: "center", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
              Ver seguimiento →
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tab Info ─────────────────────────────────────────────────────────────────

function TabInfo({ infoEnvios, nombrePyme }: { infoEnvios: string | null; nombrePyme: string }) {
  if (!infoEnvios) {
    return (
      <div style={{ textAlign: "center", padding: "56px 24px" }}>
        <p style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>Próximamente</p>
        <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.25)" }}>{nombrePyme} aún no ha configurado esta sección.</p>
      </div>
    );
  }
  return (
    <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", padding: "20px" }}>
      <div style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 1.9, whiteSpace: "pre-wrap" }}>
        {infoEnvios}
      </div>
    </div>
  );
}

// ─── Tab Crear envío ──────────────────────────────────────────────────────────

function TabCrear({ pymeId, nombrePyme, couriersHabilitados, defaultDims }: { pymeId: string; nombrePyme: string; couriersHabilitados: string[] | null; defaultDims: HubProps["defaultDims"] }) {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [generando, setGenerando] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerar() {
    const preset = selectedPreset ? PKG_PRESETS.find((p) => p.id === selectedPreset) : null;
    const dims = preset ?? (defaultDims.largo ? { largo: defaultDims.largo, alto: defaultDims.alto!, ancho: defaultDims.ancho!, peso: defaultDims.peso! } : null);
    if (!dims) { setError("Selecciona un tamaño de paquete"); return; }

    setError("");
    setGenerando(true);
    setGeneratedUrl("");
    try {
      const res = await fetch("/api/crear-envio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pyme_id: pymeId,
          nombre_pyme: nombrePyme,
          largo: dims.largo, alto: dims.alto, ancho: dims.ancho, peso: dims.peso,
          couriers: couriersHabilitados ?? [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al generar");
      const url = `${window.location.origin}/envio/${data.id}`;
      setGeneratedUrl(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al generar");
    } finally {
      setGenerando(false);
    }
  }

  async function copyUrl() {
    await navigator.clipboard.writeText(generatedUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: "linear-gradient(135deg, #1A1A18 0%, #2D2D2A 100%)", borderRadius: 16, padding: "18px 20px" }}>
        <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#fff" }}>Crear link de envío</p>
        <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>Elige el tamaño del paquete y genera el link para mandárselo al cliente.</p>
      </div>

      {/* Presets */}
      <div>
        <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>¿Qué vas a enviar?</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {PKG_PRESETS.map((p) => {
            const active = selectedPreset === p.id;
            return (
              <button key={p.id} onClick={() => setSelectedPreset(active ? null : p.id)} style={{
                border: `1.5px solid ${active ? "#E8553D" : "rgba(255,255,255,0.1)"}`,
                borderRadius: 12, padding: "14px 8px",
                background: active ? "rgba(232,85,61,0.15)" : "rgba(255,255,255,0.04)",
                cursor: "pointer", fontFamily: "inherit",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                transition: "all 0.15s",
              }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: active ? "#E8553D" : "#F5F3EE" }}>{p.label}</p>
                <p style={{ margin: 0, fontSize: 10, color: active ? "rgba(232,85,61,0.7)" : "rgba(255,255,255,0.35)" }}>{p.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {error && <p style={{ margin: 0, fontSize: 13, color: "#E8553D", background: "rgba(232,85,61,0.1)", border: "1px solid rgba(232,85,61,0.2)", padding: "10px 14px", borderRadius: 10 }}>{error}</p>}

      {!generatedUrl ? (
        <button onClick={handleGenerar} disabled={generando} className="hub-action-btn" style={{
          width: "100%", padding: "16px", borderRadius: 14, border: "none",
          background: generando ? "rgba(255,255,255,0.08)" : "#E8553D",
          color: generando ? "rgba(255,255,255,0.3)" : "#fff",
          fontSize: 15, fontWeight: 700, cursor: generando ? "not-allowed" : "pointer",
          fontFamily: "inherit", transition: "all 0.2s", letterSpacing: "-0.01em",
        }}>
          {generando ? "Generando…" : "Generar link →"}
        </button>
      ) : (
        <div style={{ background: "#1A1A18", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "16px 18px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Link listo</p>
            <p style={{ margin: 0, fontSize: 11, fontFamily: "monospace", color: "rgba(255,255,255,0.6)", wordBreak: "break-all" }}>{generatedUrl}</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
            <button onClick={copyUrl} style={{ padding: "14px", background: "none", border: "none", borderRight: "1px solid rgba(255,255,255,0.08)", color: copied ? "#4CD38A" : "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              {copied ? "✓ Copiado" : "Copiar link"}
            </button>
            <a href={`https://wa.me/?text=${encodeURIComponent(`Para coordinar tu pedido completa este link: ${generatedUrl}`)}`} target="_blank" rel="noreferrer"
              style={{ padding: "14px", background: "none", border: "none", color: "#25D366", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              WhatsApp
            </a>
          </div>
        </div>
      )}

      {generatedUrl && (
        <button onClick={() => { setGeneratedUrl(""); setSelectedPreset(null); }} style={{ background: "none", border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px", fontSize: 13, color: "rgba(255,255,255,0.4)", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
          Crear otro link
        </button>
      )}
    </div>
  );
}

// ─── Login Modal ──────────────────────────────────────────────────────────────

function LoginModal({ pymeId, onClose }: { pymeId: string; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    if (!email || !password) { setError("Completa todos los campos"); return; }
    setLoading(true);
    setError("");
    const { data, error: signInErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (signInErr) { setError("Email o contraseña incorrectos"); setLoading(false); return; }
    if (data.user?.id !== pymeId) {
      await supabase.auth.signOut();
      setError("Esta cuenta no es dueña de esta tienda");
      setLoading(false);
      return;
    }
    onClose();
  }

  const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: "1.5px solid #E8E8E3", borderRadius: 12, padding: "13px 16px", fontSize: 15, color: "#1A1A18", background: "#fff", outline: "none", fontFamily: "inherit" };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0 0 0" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, padding: "28px 24px 40px" }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: "#E8E8E3", margin: "0 auto 24px" }} />
        <p style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 800, color: "#1A1A18" }}>Ingresar como tienda</p>
        <p style={{ margin: "0 0 24px", fontSize: 13, color: "#9C9C95" }}>Usa el mismo email y contraseña de tu cuenta LinkDrop.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" style={inputStyle} onFocus={(e) => { e.currentTarget.style.borderColor = "#E8553D"; }} onBlur={(e) => { e.currentTarget.style.borderColor = "#E8E8E3"; }} />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" style={inputStyle} onKeyDown={(e) => e.key === "Enter" && handleLogin()} onFocus={(e) => { e.currentTarget.style.borderColor = "#E8553D"; }} onBlur={(e) => { e.currentTarget.style.borderColor = "#E8E8E3"; }} />
          {error && <p style={{ margin: 0, fontSize: 13, color: "#C23E28", background: "#FFF0ED", padding: "10px 14px", borderRadius: 10 }}>{error}</p>}
          <button onClick={handleLogin} disabled={loading} style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none", background: loading ? "#D1D1CC" : "#E8553D", color: "#fff", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
            {loading ? "Ingresando…" : "Ingresar →"}
          </button>
        </div>
      </div>
    </div>
  );
}
