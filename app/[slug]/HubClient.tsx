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

function ComunaAutocomplete({ value, onChange }: { value: string; onChange: (v: string) => void }) {
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
        style={{ width: "100%", boxSizing: "border-box", border: "1.5px solid #E8E8E3", borderRadius: 12, padding: "13px 16px", fontSize: 15, color: "#1A1A18", background: "#fff", outline: "none", fontFamily: "inherit" }}
        onFocusCapture={(e) => { e.currentTarget.style.borderColor = "#E8553D"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(232,85,61,0.1)"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "#E8E8E3"; e.currentTarget.style.boxShadow = "none"; }}
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

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.id === pymeId) setIsOwner(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsOwner(session?.user?.id === pymeId);
    });
    return () => subscription.unsubscribe();
  }, [pymeId]);

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "cotizar",  label: "Cotizar",      icon: "📦" },
    { id: "rastrear", label: "Rastrear",     icon: "🔍" },
    { id: "info",     label: "Info",         icon: "💬" },
    ...(isOwner ? [{ id: "crear" as Tab, label: "Crear envío", icon: "✦" }] : []),
  ];

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #F2EDE4 0%, #EBE4D8 40%, #E8E0D2 100%)", fontFamily: "'Instrument Sans', system-ui, sans-serif" }}>
      <style>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hub-tab-content { animation: fade-up 0.22s ease both; }
        .hub-tab-btn:hover { opacity: 0.85; }
      `}</style>

      <div style={{ maxWidth: 460, margin: "0 auto", padding: "0 20px 80px" }}>

        {/* Profile hero */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 56, paddingBottom: 32, gap: 0 }}>

          {/* Avatar */}
          <div style={{
            width: 88, height: 88, borderRadius: "50%",
            background: "#fff",
            boxShadow: "0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)",
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden", marginBottom: 16, flexShrink: 0,
          }}>
            {logoPyme
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={logoPyme} alt={nombrePyme} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontSize: 36 }}>🏪</span>
            }
          </div>

          {/* Name */}
          <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800, color: "#1A1A18", letterSpacing: "-0.03em", textAlign: "center" }}>
            {nombrePyme}
          </h1>
          <p style={{ margin: "0 0 20px", fontSize: 13, color: "#7A7A72", textAlign: "center" }}>
            linkdrop.cl/{slug}
          </p>

          {/* Owner / Login badge */}
          {isOwner ? (
            <span style={{ fontSize: 11, fontWeight: 700, color: "#2D8A56", background: "rgba(255,255,255,0.7)", border: "1px solid #B8E2C8", borderRadius: 100, padding: "5px 14px", backdropFilter: "blur(4px)" }}>
              ✓ Mi tienda
            </span>
          ) : (
            <button onClick={() => setShowLogin(true)} style={{
              fontSize: 12, fontWeight: 600, color: "#5C5C57",
              background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.9)",
              borderRadius: 100, padding: "7px 18px", cursor: "pointer",
              fontFamily: "inherit", backdropFilter: "blur(4px)",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}>
              Soy la tienda →
            </button>
          )}
        </div>

        {/* Tab pills */}
        <div style={{
          display: "flex", gap: 8, marginBottom: 24,
          background: "rgba(255,255,255,0.5)", borderRadius: 18,
          padding: 6, backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.8)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        }}>
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                className="hub-tab-btn"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                  padding: "10px 6px", borderRadius: 13, border: "none",
                  background: active ? "#fff" : "transparent",
                  boxShadow: active ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                  cursor: "pointer", fontFamily: "inherit", transition: "all 0.18s",
                }}
              >
                <span style={{ fontSize: tab.id === "crear" ? 13 : 16 }}>{tab.icon}</span>
                <span style={{ fontSize: 11, fontWeight: active ? 700 : 500, color: active ? "#1A1A18" : "#9C9C95", whiteSpace: "nowrap" }}>
                  {tab.label}
                </span>
                {tab.id === "crear" && (
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#E8553D", display: "block" }} />
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
        <p style={{ textAlign: "center", marginTop: 40, fontSize: 11, color: "#B0A898" }}>
          Powered by <span style={{ fontWeight: 700, color: "#9A9088" }}>LinkDrop</span>
        </p>
      </div>

      {showLogin && (
        <LoginModal pymeId={pymeId} onClose={() => setShowLogin(false)} />
      )}
    </div>
  );
}

// ─── Tab Cotizar ──────────────────────────────────────────────────────────────

function TabCotizar({ pymeId, couriersHabilitados, defaultDims }: { pymeId: string; couriersHabilitados: string[] | null; defaultDims: HubProps["defaultDims"] }) {
  const [nombre, setNombre] = useState("");
  const [comuna, setComuna] = useState("");
  const [calle, setCalle] = useState("");
  const [numero, setNumero] = useState("");
  const [depto, setDepto] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [cotizando, setCotizando] = useState(false);
  const [resultados, setResultados] = useState<Record<string, CotizacionItem> | null>(null);
  const [error, setError] = useState("");

  const hasDims = defaultDims.largo && defaultDims.alto && defaultDims.ancho && defaultDims.peso;

  const canCotizar = nombre.trim() && comuna && calle.trim() && numero.trim();

  async function handleCotizar() {
    if (!nombre.trim()) { setError("Ingresa tu nombre"); return; }
    if (!comuna) { setError("Ingresa tu comuna de destino"); return; }
    if (!calle.trim()) { setError("Ingresa tu calle"); return; }
    if (!numero.trim()) { setError("Ingresa el número de tu dirección"); return; }
    const preset = selectedPreset ? PKG_PRESETS.find((p) => p.id === selectedPreset) : null;
    const dims = preset ?? (hasDims ? { largo: defaultDims.largo!, alto: defaultDims.alto!, ancho: defaultDims.ancho!, peso: defaultDims.peso! } : null);
    if (!dims) { setError("Selecciona un tamaño de paquete"); return; }

    setError("");
    setCotizando(true);
    setResultados(null);
    try {
      const res = await fetch("/api/cotizar-publico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pymeId,
          largo: dims.largo, alto: dims.alto, ancho: dims.ancho, peso: dims.peso,
          datosDestino: { nombre: nombre.trim(), comuna, calle: calle.trim(), numero: numero.trim(), depto: depto.trim() },
        }),
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

  const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: "1.5px solid #E8E8E3", borderRadius: 12, padding: "13px 16px", fontSize: 15, color: "#1A1A18", background: "#fff", outline: "none", fontFamily: "inherit" };

  const allowed = couriersHabilitados ?? Object.keys(COURIER_CONFIG);
  const resultKeys = resultados ? Object.keys(resultados).filter((k) => allowed.includes(k) && resultados![k]?.price != null) : [];
  const cheapest = resultKeys.length > 0 ? resultKeys.reduce((a, b) => (resultados![a]!.price! < resultados![b]!.price! ? a : b)) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Intro */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E8E8E3", padding: "18px 20px" }}>
        <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#1A1A18" }}>¿Cuánto sale enviar a tu dirección?</p>
        <p style={{ margin: 0, fontSize: 13, color: "#9C9C95", lineHeight: 1.6 }}>Ingresa tu dirección y elige el tamaño del paquete para ver el precio aproximado de cada courier.</p>
      </div>

      {/* Datos destino */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: "#1A1A18" }}>Tu nombre</p>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: María González" style={inputStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = "#E8553D"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(232,85,61,0.1)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "#E8E8E3"; e.currentTarget.style.boxShadow = "none"; }} />
        </div>
        <div>
          <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: "#1A1A18" }}>Tu comuna de destino</p>
          <ComunaAutocomplete value={comuna} onChange={setComuna} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
          <div>
            <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: "#1A1A18" }}>Calle</p>
            <input value={calle} onChange={(e) => setCalle(e.target.value)} placeholder="Ej: Av. Providencia" style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#E8553D"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(232,85,61,0.1)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#E8E8E3"; e.currentTarget.style.boxShadow = "none"; }} />
          </div>
          <div>
            <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: "#1A1A18" }}>Número</p>
            <input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="123" style={{ ...inputStyle, width: 90 }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#E8553D"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(232,85,61,0.1)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#E8E8E3"; e.currentTarget.style.boxShadow = "none"; }} />
          </div>
        </div>
        <div>
          <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: "#1A1A18" }}>Depto / Piso <span style={{ fontWeight: 400, color: "#9C9C95" }}>(opcional)</span></p>
          <input value={depto} onChange={(e) => setDepto(e.target.value)} placeholder="Ej: Depto 301" style={inputStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = "#E8553D"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(232,85,61,0.1)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "#E8E8E3"; e.currentTarget.style.boxShadow = "none"; }} />
        </div>
      </div>

      {/* Tamaño del paquete */}
      <div>
        <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: "#1A1A18" }}>
          Tamaño del paquete
          <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 500, color: "#9C9C95" }}>aprox.</span>
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {PKG_PRESETS.map((p) => {
            const active = selectedPreset === p.id;
            return (
              <button key={p.id} onClick={() => setSelectedPreset(active ? null : p.id)} style={{
                border: `1.5px solid ${active ? "#1A1A18" : "#E8E8E3"}`,
                borderRadius: 12, padding: "12px 8px",
                background: active ? "#1A1A18" : "#fff",
                cursor: "pointer", fontFamily: "inherit",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                transition: "all 0.15s",
              }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: active ? "#fff" : "#1A1A18" }}>{p.label}</p>
                <p style={{ margin: 0, fontSize: 10, color: active ? "rgba(255,255,255,0.55)" : "#9C9C95" }}>{p.desc}</p>
              </button>
            );
          })}
          {!hasDims && !selectedPreset && (
            <div style={{ gridColumn: "1/-1", background: "#FFFBE8", border: "1px solid #F5E0A0", borderRadius: 10, padding: "10px 14px" }}>
              <p style={{ margin: 0, fontSize: 12, color: "#8B6914" }}>Selecciona un tamaño para cotizar</p>
            </div>
          )}
        </div>
        {hasDims && !selectedPreset && (
          <p style={{ margin: "8px 0 0", fontSize: 11, color: "#9C9C95" }}>Sin selección se usarán las dimensiones por defecto de la tienda.</p>
        )}
      </div>

      {error && <p style={{ margin: 0, fontSize: 13, color: "#C23E28", background: "#FFF0ED", padding: "10px 14px", borderRadius: 10 }}>{error}</p>}

      {/* Botón */}
      <button onClick={handleCotizar} disabled={cotizando || !canCotizar} style={{
        width: "100%", padding: "15px", borderRadius: 14, border: "none",
        background: cotizando || !canCotizar ? "#D1D1CC" : "#E8553D",
        color: "#fff", fontSize: 15, fontWeight: 700, cursor: cotizando || !canCotizar ? "not-allowed" : "pointer",
        fontFamily: "inherit", transition: "all 0.2s",
      }}>
        {cotizando ? "Cotizando…" : "Ver precios de envío →"}
      </button>

      {/* Resultados */}
      {resultados && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#9C9C95", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Precios aproximados a {comuna}
          </p>
          {resultKeys.length === 0 && (
            <p style={{ fontSize: 13, color: "#9C9C95", textAlign: "center", padding: "20px 0" }}>No hay couriers disponibles para esta comuna.</p>
          )}
          {resultKeys.map((key) => {
            const cot = resultados![key]!;
            const cfg = COURIER_CONFIG[key] ?? { color: "#5C5C57", colorLight: "#F5F5F0", label: key };
            const isCheapest = key === cheapest;
            return (
              <div key={key} style={{ background: "#fff", border: `1.5px solid ${isCheapest ? cfg.color : "#E8E8E3"}`, borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, position: "relative" }}>
                {isCheapest && (
                  <span style={{ position: "absolute", top: -10, left: 14, fontSize: 10, fontWeight: 700, background: cfg.color, color: "#fff", borderRadius: 100, padding: "2px 10px" }}>Más económico</span>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, background: cfg.colorLight, borderRadius: 100, padding: "3px 10px" }}>{cfg.label}</span>
                  {cot.tiempo && <span style={{ fontSize: 11, color: "#9C9C95" }}>{cot.tiempo}</span>}
                </div>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#1A1A18" }}>
                  ${(cot.price ?? 0).toLocaleString("es-CL")}
                </p>
              </div>
            );
          })}
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#9C9C95", textAlign: "center", lineHeight: 1.6 }}>
            * Precio referencial. El precio final lo verás en el link de envío que te comparta la tienda.
          </p>
        </div>
      )}
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
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E8E8E3", padding: "18px 20px" }}>
        <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#1A1A18" }}>Rastrea tu pedido</p>
        <p style={{ margin: 0, fontSize: 13, color: "#9C9C95", lineHeight: 1.6 }}>Ingresa el número de seguimiento que te envió la tienda.</p>
      </div>

      <div>
        <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: "#1A1A18" }}>Número de tracking</p>
        <input
          type="text" value={tracking} onChange={(e) => setTracking(e.target.value)}
          placeholder="Ej: 12345678"
          onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
          style={{ width: "100%", boxSizing: "border-box", border: "1.5px solid #E8E8E3", borderRadius: 12, padding: "13px 16px", fontSize: 15, color: "#1A1A18", background: "#fff", outline: "none", fontFamily: "inherit" }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "#E8553D"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(232,85,61,0.1)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "#E8E8E3"; e.currentTarget.style.boxShadow = "none"; }}
        />
      </div>

      {error && <p style={{ margin: 0, fontSize: 13, color: "#C23E28", background: "#FFF0ED", padding: "10px 14px", borderRadius: 10 }}>{error}</p>}

      <button onClick={handleBuscar} disabled={buscando || !tracking.trim()} style={{
        width: "100%", padding: "15px", borderRadius: 14, border: "none",
        background: buscando || !tracking.trim() ? "#D1D1CC" : "#1A1A18",
        color: "#fff", fontSize: 15, fontWeight: 700, cursor: buscando || !tracking.trim() ? "not-allowed" : "pointer",
        fontFamily: "inherit", transition: "all 0.2s",
      }}>
        {buscando ? "Buscando…" : "Rastrear pedido →"}
      </button>

      {resultado && (
        <div style={{ background: "#fff", border: "1.5px solid #B8E2C8", borderRadius: 14, padding: "18px 20px" }}>
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
      <div style={{ textAlign: "center", padding: "48px 24px" }}>
        <p style={{ fontSize: 32, marginBottom: 12 }}>📦</p>
        <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: "#1A1A18" }}>Próximamente</p>
        <p style={{ margin: 0, fontSize: 13, color: "#9C9C95" }}>{nombrePyme} aún no ha configurado esta sección.</p>
      </div>
    );
  }
  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E8E8E3", padding: "20px" }}>
      <div style={{ fontSize: 14, color: "#1A1A18", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
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
        <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 600, color: "#1A1A18" }}>¿Qué vas a enviar?</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {PKG_PRESETS.map((p) => {
            const active = selectedPreset === p.id;
            return (
              <button key={p.id} onClick={() => setSelectedPreset(active ? null : p.id)} style={{
                border: `1.5px solid ${active ? "#E8553D" : "#E8E8E3"}`,
                borderRadius: 12, padding: "14px 8px",
                background: active ? "#FFF0ED" : "#fff",
                cursor: "pointer", fontFamily: "inherit",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                transition: "all 0.15s",
              }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: active ? "#E8553D" : "#1A1A18" }}>{p.label}</p>
                <p style={{ margin: 0, fontSize: 10, color: active ? "#E8553D" : "#9C9C95" }}>{p.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {error && <p style={{ margin: 0, fontSize: 13, color: "#C23E28", background: "#FFF0ED", padding: "10px 14px", borderRadius: 10 }}>{error}</p>}

      {!generatedUrl ? (
        <button onClick={handleGenerar} disabled={generando} style={{
          width: "100%", padding: "15px", borderRadius: 14, border: "none",
          background: generando ? "#D1D1CC" : "#E8553D",
          color: "#fff", fontSize: 15, fontWeight: 700, cursor: generando ? "not-allowed" : "pointer",
          fontFamily: "inherit", transition: "all 0.2s",
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
        <button onClick={() => { setGeneratedUrl(""); setSelectedPreset(null); }} style={{ background: "none", border: "1.5px solid #E8E8E3", borderRadius: 12, padding: "12px", fontSize: 13, color: "#5C5C57", cursor: "pointer", fontFamily: "inherit" }}>
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
