"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/utils/supabase";

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

const C = {
  bg:      "#F5F0E8",
  card:    "#FFFFFF",
  border:  "#E8E2D8",
  text:    "#1A1A14",
  muted:   "#8A8A7A",
  accent:  "#C17F3E",
  red:     "#E8553D",
  green:   "#2D8A56",
  greenBg: "#EEF7F2",
};

const COURIER_CONFIG: Record<string, { color: string; colorLight: string; label: string }> = {
  starken:           { color: "#2D7A2D", colorLight: "#EEF7EE", label: "Starken" },
  starken_domicilio: { color: "#2D7A2D", colorLight: "#EEF7EE", label: "Starken Domicilio" },
  starken_sucursal:  { color: "#2D7A2D", colorLight: "#EEF7EE", label: "Starken Sucursal" },
  chilexpress:       { color: "#B8860B", colorLight: "#FFF8E8", label: "Chilexpress" },
  blueexpress:       { color: "#1A5FB4", colorLight: "#EEF3FC", label: "Blue Express" },
  noventa9Minutos:   { color: "#C0392B", colorLight: "#FDECEA", label: "99 Minutos" },
  "99minutos":       { color: "#C0392B", colorLight: "#FDECEA", label: "99 Minutos" },
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

// ─── ComunaAutocomplete ───────────────────────────────────────────────────────

function ComunaAutocomplete({ value, onChange, placeholder = "Busca tu comuna..." }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
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
      <div style={{ position: "relative" }}>
        <svg style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: C.muted, pointerEvents: "none" }}
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text" value={query} autoComplete="off" placeholder={placeholder}
          onChange={(e) => { setQuery(e.target.value); onChange(""); setOpen(true); }}
          onFocus={() => { if (query.length >= 2) setOpen(true); }}
          style={{
            width: "100%", boxSizing: "border-box", paddingLeft: 40, paddingRight: 16,
            paddingTop: 14, paddingBottom: 14,
            border: `1.5px solid ${C.border}`, borderRadius: 12,
            fontSize: 15, color: C.text, background: C.card, outline: "none", fontFamily: "inherit",
          }}
          onFocusCapture={(e) => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(193,127,62,0.12)`; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; }}
        />
      </div>
      {open && results.length > 0 && (
        <div style={{ position: "absolute", zIndex: 50, width: "100%", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.08)", marginTop: 4, overflow: "hidden" }}>
          {results.map((c) => (
            <button key={c} type="button" onMouseDown={() => { setQuery(c); onChange(c); setOpen(false); }}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "11px 16px", fontSize: 14, color: C.text, background: "none", border: "none", borderBottom: `1px solid ${C.border}`, cursor: "pointer", fontFamily: "inherit" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = C.bg; }}
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

  const initials = nombrePyme.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  const tabs: { id: Tab; label: string }[] = [
    { id: "cotizar",  label: "Cotizar envío"     },
    { id: "rastrear", label: "Rastrear pedido"   },
    { id: "info",     label: "Políticas de envío" },
    ...(isOwner ? [{ id: "crear" as Tab, label: "Crear envío" }] : []),
  ];

  const tabIndex = tabs.findIndex((t) => t.id === activeTab);

  const TAB_ICONS: Record<Tab, React.ReactElement> = {
    cotizar: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"/>
        <polyline points="16.5 9.4 7.55 4.24"/><line x1="3.29" y1="7" x2="12" y2="12"/><line x1="12" y1="12" x2="12" y2="22"/>
      </svg>
    ),
    rastrear: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
    info: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    crear: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    ),
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Instrument Sans', system-ui, sans-serif" }}>
      <style>{`
        @keyframes hub-in { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .hub-content { animation: hub-in 0.22s cubic-bezier(0.16,1,0.3,1) both; }
        .hub-btn-press:active { transform: scale(0.97); opacity: 0.85; }
        .hub-tab-btn { transition: color 0.2s ease; }
        .hub-tab-btn:hover { opacity: 0.75; }
        .login-btn:hover { background: #F0EDE6 !important; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ background: C.bg, paddingBottom: 0 }}>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 20px" }}>

          {/* Fila superior: solo botón login a la derecha */}
          <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 18, paddingBottom: 24 }}>
            {isOwner ? (
              <span style={{
                fontSize: 11, fontWeight: 600, letterSpacing: "0.01em",
                color: C.green, background: C.greenBg,
                border: `1px solid #C2DFD0`, borderRadius: 100, padding: "6px 14px",
              }}>
                Mi tienda
              </span>
            ) : (
              <button onClick={() => setShowLogin(true)} className="hub-btn-press login-btn" style={{
                fontSize: 12, fontWeight: 500, color: C.muted,
                background: "transparent", border: `1px solid ${C.border}`,
                borderRadius: 100, padding: "7px 16px",
                cursor: "pointer", fontFamily: "inherit",
                transition: "background 0.15s",
              }}>
                Iniciar sesión
              </button>
            )}
          </div>

          {/* Logo centrado */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
            <div style={{
              width: 76, height: 76, borderRadius: "50%",
              background: C.card,
              border: `1px solid ${C.border}`,
              boxShadow: "0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)",
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden", marginBottom: 16,
            }}>
              {logoPyme
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={logoPyme} alt={nombrePyme} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontSize: 24, fontWeight: 700, color: C.text, letterSpacing: "-0.03em" }}>{initials}</span>
              }
            </div>

            {/* Nombre */}
            <h1 style={{
              margin: "0 0 6px", textAlign: "center",
              fontSize: 24, fontWeight: 700,
              color: C.text, letterSpacing: "-0.04em", lineHeight: 1.1,
            }}>
              {nombrePyme}
            </h1>

            {/* Subtítulo */}
            <p style={{
              margin: "0 0 28px", textAlign: "center",
              fontSize: 13, color: C.muted, letterSpacing: "0.01em", lineHeight: 1.5,
            }}>
              Envíos simples y rápidos a todo Chile ✨
            </p>

            {/* Tabs iOS-style segmented control */}
            <div style={{
              position: "relative", display: "flex", alignSelf: "stretch",
              background: "#EEEBE4", borderRadius: 14, padding: 4, marginBottom: 20,
            }}>
              {/* Sliding pill activo */}
              <div style={{
                position: "absolute", inset: 4,
                width: `calc((100% - 8px) / ${tabs.length})`,
                left: `calc(${tabIndex} * (100% - 8px) / ${tabs.length} + 4px)`,
                background: C.card,
                borderRadius: 10,
                boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.06)",
                transition: "left 0.3s cubic-bezier(0.16,1,0.3,1)",
                zIndex: 0,
              }} />

              {tabs.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="hub-tab-btn"
                    style={{
                      flex: 1, position: "relative", zIndex: 1,
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      gap: 4, padding: "10px 4px",
                      background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    <span style={{ color: active ? C.text : C.muted, display: "flex", transition: "color 0.2s" }}>
                      {TAB_ICONS[tab.id]}
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: active ? 700 : 500,
                      color: active ? C.text : C.muted,
                      letterSpacing: "0.01em", whiteSpace: "nowrap",
                      transition: "color 0.2s, font-weight 0.2s",
                    }}>
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 20px 80px" }}>
        {activeTab === "cotizar" && <div key="c" className="hub-content"><TabCotizar pymeId={pymeId} couriersHabilitados={couriersHabilitados} defaultDims={defaultDims} /></div>}
        {activeTab === "rastrear" && <div key="r" className="hub-content"><TabRastrear pymeId={pymeId} /></div>}
        {activeTab === "info" && <div key="i" className="hub-content"><TabInfo infoEnvios={infoEnvios} nombrePyme={nombrePyme} /></div>}
        {activeTab === "crear" && isOwner && <div key="cr" className="hub-content"><TabCrear pymeId={pymeId} nombrePyme={nombrePyme} couriersHabilitados={couriersHabilitados} defaultDims={defaultDims} /></div>}
      </div>

      {showLogin && <LoginModal pymeId={pymeId} onClose={() => setShowLogin(false)} />}
    </div>
  );
}

// ─── Tab Cotizar ──────────────────────────────────────────────────────────────

const AVATAR_COLORS = ["#C17F3E","#2D8A56","#1A5FB4","#8B5CF6","#C0392B","#D97706"];
const AVATARS       = ["MA","JG","CC","RV","LP","SS"];

function TabCotizar({ pymeId, couriersHabilitados, defaultDims }: {
  pymeId: string; couriersHabilitados: string[] | null; defaultDims: HubProps["defaultDims"];
}) {
  const [comuna, setComuna] = useState("");
  const [cotizando, setCotizando] = useState(false);
  const [resultados, setResultados] = useState<Record<string, CotizacionItem> | null>(null);
  const [error, setError] = useState("");

  const FALLBACK = { largo: 30, alto: 20, ancho: 10, peso: 1 };
  const dims = (defaultDims.largo && defaultDims.alto && defaultDims.ancho && defaultDims.peso)
    ? { largo: defaultDims.largo, alto: defaultDims.alto, ancho: defaultDims.ancho, peso: defaultDims.peso }
    : FALLBACK;

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

  const allowed    = couriersHabilitados ?? Object.keys(COURIER_CONFIG);
  const resultKeys = resultados
    ? Object.keys(resultados).filter((k) => allowed.includes(k) && resultados![k]?.price != null)
    : [];
  const cheapest   = resultKeys.length > 0
    ? resultKeys.reduce((a, b) => (resultados![a]!.price! < resultados![b]!.price! ? a : b))
    : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Título */}
      <div>
        <p style={{ margin: "0 0 2px", fontSize: 17, fontWeight: 700, color: C.text, letterSpacing: "-0.02em" }}>Cotiza el envío a tu dirección</p>
        <p style={{ margin: 0, fontSize: 13, color: C.muted }}>Ingresa tu comuna para ver los precios disponibles.</p>
      </div>

      {/* Search bar */}
      <ComunaAutocomplete value={comuna} onChange={setComuna} placeholder="Busca tu comuna o dirección..." />

      {error && (
        <p style={{ margin: 0, fontSize: 13, color: C.red, background: "#FEF0ED", border: "1px solid #FBCFC8", padding: "10px 14px", borderRadius: 10 }}>{error}</p>
      )}

      <button onClick={handleCotizar} disabled={cotizando || !comuna} className="hub-btn-press" style={{
        width: "100%", padding: "15px", borderRadius: 12, border: "none",
        background: cotizando || !comuna ? "#D8D4CC" : C.text,
        color: "#fff", fontSize: 14, fontWeight: 700,
        cursor: cotizando || !comuna ? "not-allowed" : "pointer",
        fontFamily: "inherit", transition: "all 0.2s", letterSpacing: "-0.01em",
      }}>
        {cotizando ? "Cotizando…" : "Ver opciones de envío"}
      </button>

      {/* Resultados */}
      {resultados && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Opciones disponibles
          </p>
          {resultKeys.length === 0 && (
            <p style={{ fontSize: 13, color: C.muted, textAlign: "center", padding: "24px 0" }}>No hay couriers disponibles para {comuna}.</p>
          )}
          {resultKeys.map((key) => {
            const cot = resultados![key]!;
            const cfg = COURIER_CONFIG[key] ?? { color: C.muted, colorLight: C.bg, label: key };
            const isCheapest = key === cheapest;
            return (
              <div key={key} style={{
                background: C.card, borderRadius: 14,
                border: `1.5px solid ${isCheapest ? C.green : C.border}`,
                padding: "14px 16px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                position: "relative", gap: 12,
              }}>
                {isCheapest && (
                  <span style={{ position: "absolute", top: -10, left: 14, fontSize: 10, fontWeight: 700, background: C.green, color: "#fff", borderRadius: 100, padding: "2px 10px" }}>
                    Más económico
                  </span>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
                  {cot.tiempo && <span style={{ fontSize: 11, color: C.muted }}>{cot.tiempo}</span>}
                </div>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: "-0.03em" }}>
                  ${(cot.price ?? 0).toLocaleString("es-CL")}
                </p>
              </div>
            );
          })}
          {resultKeys.length > 0 && (
            <p style={{ margin: 0, fontSize: 11, color: C.muted, textAlign: "center" }}>
              Precio referencial — el valor final estará en tu link de envío.
            </p>
          )}
        </div>
      )}

      {/* Dudas */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px" }}>
        <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: C.text }}>¿Tienes dudas del envío?</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex" }}>
              {AVATARS.map((ini, i) => (
                <div key={i} style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                  border: `2px solid ${C.card}`, marginLeft: i === 0 ? 0 : -8,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, fontWeight: 700, color: "#fff", position: "relative", zIndex: AVATARS.length - i,
                }}>{ini}</div>
              ))}
            </div>
            <p style={{ margin: 0, fontSize: 12, color: C.muted }}>+98 clientes felices</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: C.green, background: C.greenBg, border: `1px solid #B8DFC9`, borderRadius: 100, padding: "4px 10px", whiteSpace: "nowrap" }}>Despacho en 24hrs</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: C.accent, background: "#FBF3E8", border: "1px solid #E8D8B8", borderRadius: 100, padding: "4px 10px", whiteSpace: "nowrap" }}>Envío seguro</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px" }}>
          <p style={{ margin: "0 0 2px", fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "-0.04em" }}>+1.240</p>
          <p style={{ margin: 0, fontSize: 11, color: C.muted }}>envíos realizados</p>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px" }}>
          <p style={{ margin: "0 0 2px", fontSize: 22, fontWeight: 800, color: C.green, letterSpacing: "-0.04em" }}>98%</p>
          <p style={{ margin: 0, fontSize: 11, color: C.muted }}>entregados correctamente</p>
        </div>
      </div>

    </div>
  );
}

// ─── Tab Rastrear ─────────────────────────────────────────────────────────────

const TRACKING_STEPS = [
  { id: "confirmado",   label: "Pedido confirmado"   },
  { id: "preparacion",  label: "En preparación"       },
  { id: "transito",     label: "En tránsito"          },
  { id: "reparto",      label: "En reparto"           },
  { id: "entregado",    label: "Entregado"            },
];

function stepIndexFromStatus(status?: string): number {
  if (!status) return -1;
  const s = status.toLowerCase();
  if (s.includes("entregado") || s.includes("delivered"))       return 4;
  if (s.includes("reparto") || s.includes("out_for_delivery"))  return 3;
  if (s.includes("tránsito") || s.includes("transito") || s.includes("in_transit")) return 2;
  if (s.includes("preparac") || s.includes("processing"))       return 1;
  return 0;
}

function TabRastrear({ pymeId }: { pymeId: string }) {
  const [tracking, setTracking] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [resultado, setResultado] = useState<{ tracking_url?: string; courier?: string; pago_status?: string } | null>(null);
  const [error, setError] = useState("");

  async function handleBuscar() {
    if (!tracking.trim()) { setError("Ingresa tu número de seguimiento"); return; }
    setError(""); setBuscando(true); setResultado(null);
    try {
      const { data, error: dbErr } = await supabase
        .from("envios")
        .select("tracking_url, courier, pago_status, tracking")
        .eq("pyme_id", pymeId)
        .eq("tracking", tracking.trim())
        .maybeSingle();

      if (dbErr || !data) { setError("No encontramos un envío con ese número."); return; }
      setResultado({ tracking_url: data.tracking_url ?? undefined, courier: data.courier ?? undefined, pago_status: data.pago_status ?? undefined });
    } catch {
      setError("Error al buscar. Intenta de nuevo.");
    } finally {
      setBuscando(false);
    }
  }

  const currentStep = resultado ? stepIndexFromStatus(resultado.pago_status) : -1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      <div>
        <p style={{ margin: "0 0 2px", fontSize: 17, fontWeight: 700, color: C.text, letterSpacing: "-0.02em" }}>Rastrea tu pedido</p>
        <p style={{ margin: 0, fontSize: 13, color: C.muted }}>Ingresa el número de seguimiento que te envió la tienda.</p>
      </div>

      <div style={{ position: "relative" }}>
        <svg style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: C.muted, pointerEvents: "none" }}
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text" value={tracking} onChange={(e) => setTracking(e.target.value)}
          placeholder="Ej: 12345678" onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
          style={{ width: "100%", boxSizing: "border-box", paddingLeft: 40, paddingRight: 16, paddingTop: 14, paddingBottom: 14, border: `1.5px solid ${C.border}`, borderRadius: 12, fontSize: 15, color: C.text, background: C.card, outline: "none", fontFamily: "inherit" }}
          onFocus={(e) => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(193,127,62,0.12)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; }}
        />
      </div>

      {error && <p style={{ margin: 0, fontSize: 13, color: C.red, background: "#FEF0ED", border: "1px solid #FBCFC8", padding: "10px 14px", borderRadius: 10 }}>{error}</p>}

      <button onClick={handleBuscar} disabled={buscando || !tracking.trim()} className="hub-btn-press" style={{
        width: "100%", padding: "15px", borderRadius: 12, border: "none",
        background: buscando || !tracking.trim() ? "#D8D4CC" : C.text,
        color: "#fff", fontSize: 14, fontWeight: 700,
        cursor: buscando || !tracking.trim() ? "not-allowed" : "pointer",
        fontFamily: "inherit", transition: "all 0.2s",
      }}>
        {buscando ? "Buscando…" : "Rastrear pedido"}
      </button>

      {/* Timeline resultado */}
      {resultado && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: C.text }}>Pedido #{tracking}</p>
              {resultado.courier && (
                <span style={{ fontSize: 11, fontWeight: 600, color: COURIER_CONFIG[resultado.courier]?.color ?? C.muted, background: COURIER_CONFIG[resultado.courier]?.colorLight ?? C.bg, borderRadius: 100, padding: "2px 10px" }}>
                  {COURIER_CONFIG[resultado.courier]?.label ?? resultado.courier}
                </span>
              )}
            </div>
            {currentStep === 4 && (
              <span style={{ fontSize: 11, fontWeight: 700, background: C.greenBg, color: C.green, border: `1px solid #B8DFC9`, borderRadius: 100, padding: "4px 12px" }}>Entregado ✓</span>
            )}
          </div>

          {/* Steps */}
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {TRACKING_STEPS.map((step, i) => {
              const done    = i <= currentStep;
              const current = i === currentStep;
              return (
                <div key={step.id} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: "50%", flexShrink: 0, zIndex: 1,
                      background: done ? (current && i < 4 ? C.accent : C.green) : C.bg,
                      border: `2px solid ${done ? (current && i < 4 ? C.accent : C.green) : C.border}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {done && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </div>
                    {i < TRACKING_STEPS.length - 1 && (
                      <div style={{ width: 2, height: 28, background: i < currentStep ? C.green : C.border, marginTop: 2 }} />
                    )}
                  </div>
                  <p style={{ margin: "2px 0 24px", fontSize: 13, fontWeight: current ? 700 : 500, color: done ? C.text : C.muted }}>
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>

          {resultado.tracking_url && (
            <a href={resultado.tracking_url} target="_blank" rel="noopener noreferrer"
              style={{ display: "block", padding: "13px", borderRadius: 12, background: C.text, color: "#fff", textAlign: "center", fontSize: 14, fontWeight: 700, textDecoration: "none", marginTop: 4 }}>
              Ver seguimiento oficial →
            </a>
          )}
        </div>
      )}

      {/* WhatsApp dudas */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <p style={{ margin: 0, fontSize: 13, color: C.muted }}>¿Problemas con tu envío?</p>
        <a href="https://wa.me/" target="_blank" rel="noreferrer" style={{
          fontSize: 12, fontWeight: 700, color: "#25D366",
          background: "#F0FBF4", border: "1px solid #B8E2C8",
          borderRadius: 100, padding: "7px 14px", textDecoration: "none", whiteSpace: "nowrap",
        }}>
          WhatsApp
        </a>
      </div>

    </div>
  );
}

// ─── Tab Info (Políticas) ─────────────────────────────────────────────────────

const POLITICAS = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
        <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
    titulo: "Envíos",
    texto: "Despachamos en 24 hrs hábiles.\nTrabajamos con Starken y Chilexpress.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
    titulo: "Cobertura",
    texto: "Enviamos a todo Chile.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="1 4 1 10 7 10"/>
        <path d="M3.51 15a9 9 0 1 0 .49-4.45"/>
      </svg>
    ),
    titulo: "Cambios y devoluciones",
    texto: "Tienes hasta 10 días para solicitar un cambio.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
    titulo: "Seguimiento",
    texto: "Recibirás un link de seguimiento apenas tu pedido sea enviado.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    titulo: "Retiros",
    texto: "Disponible retiro en tienda en Santiago Centro.",
  },
];

function TabInfo({ nombrePyme }: { infoEnvios: string | null; nombrePyme: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

      {POLITICAS.map((p, i) => (
        <div key={i} style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          padding: "18px 18px",
          display: "flex", alignItems: "center", gap: 16,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}>
          {/* Ícono en círculo */}
          <div style={{
            width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
            background: C.bg,
            border: `1px solid ${C.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: C.accent,
          }}>
            {p.icon}
          </div>

          {/* Texto */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: "0 0 3px", fontSize: 14, fontWeight: 600, color: C.text }}>{p.titulo}</p>
            <p style={{ margin: 0, fontSize: 12, color: C.muted, lineHeight: 1.6, whiteSpace: "pre-line" }}>{p.texto}</p>
          </div>

          {/* Chevron */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C8C4BC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
      ))}

      {/* Trust card */}
      <div style={{
        marginTop: 6,
        background: "linear-gradient(135deg, #FBF5EC 0%, #F5EDE0 100%)",
        border: "1px solid #EAD9C0",
        borderRadius: 20,
        padding: "28px 24px",
        textAlign: "center",
      }}>
        <p style={{ margin: "0 0 8px", fontSize: 26 }}>💕</p>
        <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: "-0.02em" }}>
          Gracias por confiar en {nombrePyme}
        </p>
        <p style={{ margin: 0, fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
          Cada pedido es preparado con mucho cuidado ✨
        </p>
      </div>

    </div>
  );
}

// ─── Tab Crear envío ──────────────────────────────────────────────────────────

const PKG_PRESETS = [
  { id: "sobre",  label: "Sobre",       desc: "hasta 0.3 kg", largo: 30, alto: 20, ancho: 3,  peso: 0.3 },
  { id: "xs",     label: "Pequeño",     desc: "hasta 0.7 kg", largo: 35, alto: 25, ancho: 10, peso: 0.7 },
  { id: "m",      label: "Mediano",     desc: "hasta 1.5 kg", largo: 40, alto: 30, ancho: 15, peso: 1.5 },
  { id: "l",      label: "Grande",      desc: "hasta 3 kg",   largo: 45, alto: 35, ancho: 20, peso: 3   },
  { id: "caja_g", label: "Caja grande", desc: "hasta 8 kg",   largo: 55, alto: 45, ancho: 30, peso: 8   },
];

function TabCrear({ pymeId, nombrePyme, couriersHabilitados, defaultDims }: {
  pymeId: string; nombrePyme: string; couriersHabilitados: string[] | null; defaultDims: HubProps["defaultDims"];
}) {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [generando, setGenerando] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerar() {
    const preset = selectedPreset ? PKG_PRESETS.find((p) => p.id === selectedPreset) : null;
    const dims = preset ?? (defaultDims.largo ? { largo: defaultDims.largo, alto: defaultDims.alto!, ancho: defaultDims.ancho!, peso: defaultDims.peso! } : null);
    if (!dims) { setError("Selecciona un tamaño de paquete"); return; }
    setError(""); setGenerando(true); setGeneratedUrl("");
    try {
      const res = await fetch("/api/crear-envio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pyme_id: pymeId, nombre_pyme: nombrePyme, largo: dims.largo, alto: dims.alto, ancho: dims.ancho, peso: dims.peso, couriers: couriersHabilitados ?? [] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al generar");
      setGeneratedUrl(`${window.location.origin}/envio/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al generar");
    } finally {
      setGenerando(false);
    }
  }

  async function copyUrl() {
    await navigator.clipboard.writeText(generatedUrl).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <p style={{ margin: "0 0 2px", fontSize: 17, fontWeight: 700, color: C.text, letterSpacing: "-0.02em" }}>Crear link de envío</p>
        <p style={{ margin: 0, fontSize: 13, color: C.muted }}>Elige el tamaño y genera el link para mandárselo al cliente.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {PKG_PRESETS.map((p) => {
          const active = selectedPreset === p.id;
          return (
            <button key={p.id} onClick={() => setSelectedPreset(active ? null : p.id)} className="hub-btn-press" style={{
              border: `1.5px solid ${active ? C.text : C.border}`,
              borderRadius: 12, padding: "12px 8px",
              background: active ? C.text : C.card,
              cursor: "pointer", fontFamily: "inherit",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              transition: "all 0.15s",
            }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: active ? "#fff" : C.text }}>{p.label}</p>
              <p style={{ margin: 0, fontSize: 10, color: active ? "rgba(255,255,255,0.6)" : C.muted }}>{p.desc}</p>
            </button>
          );
        })}
      </div>

      {error && <p style={{ margin: 0, fontSize: 13, color: C.red, background: "#FEF0ED", border: "1px solid #FBCFC8", padding: "10px 14px", borderRadius: 10 }}>{error}</p>}

      {!generatedUrl ? (
        <button onClick={handleGenerar} disabled={generando} className="hub-btn-press" style={{
          width: "100%", padding: "15px", borderRadius: 12, border: "none",
          background: generando ? "#D8D4CC" : C.red,
          color: "#fff", fontSize: 14, fontWeight: 700,
          cursor: generando ? "not-allowed" : "pointer",
          fontFamily: "inherit", transition: "all 0.2s",
        }}>
          {generando ? "Generando…" : "Generar link →"}
        </button>
      ) : (
        <div style={{ background: C.text, borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "16px 18px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Link listo</p>
            <p style={{ margin: 0, fontSize: 11, fontFamily: "monospace", color: "rgba(255,255,255,0.6)", wordBreak: "break-all" }}>{generatedUrl}</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            <button onClick={copyUrl} style={{ padding: "14px", background: "none", border: "none", borderRight: "1px solid rgba(255,255,255,0.08)", color: copied ? "#4CD38A" : "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              {copied ? "✓ Copiado" : "Copiar link"}
            </button>
            <a href={`https://wa.me/?text=${encodeURIComponent(`Para coordinar tu pedido completa este link: ${generatedUrl}`)}`} target="_blank" rel="noreferrer"
              style={{ padding: "14px", display: "flex", alignItems: "center", justifyContent: "center", color: "#25D366", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
              WhatsApp
            </a>
          </div>
        </div>
      )}

      {generatedUrl && (
        <button onClick={() => { setGeneratedUrl(""); setSelectedPreset(null); }} style={{
          background: "none", border: `1.5px solid ${C.border}`, borderRadius: 12,
          padding: "12px", fontSize: 13, color: C.muted, cursor: "pointer", fontFamily: "inherit",
        }}>
          Crear otro link
        </button>
      )}
    </div>
  );
}

// ─── Login Modal ──────────────────────────────────────────────────────────────

function LoginModal({ pymeId, onClose }: { pymeId: string; onClose: () => void }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function handleLogin() {
    if (!email || !password) { setError("Completa todos los campos"); return; }
    setLoading(true); setError("");
    const { data, error: signInErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (signInErr) { setError("Email o contraseña incorrectos"); setLoading(false); return; }
    if (data.user?.id !== pymeId) {
      await supabase.auth.signOut();
      setError("Esta cuenta no es dueña de esta tienda");
      setLoading(false); return;
    }
    onClose();
  }

  const inputS: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "13px 16px", fontSize: 15, color: C.text, background: C.bg, outline: "none", fontFamily: "inherit" };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, padding: "28px 24px 44px" }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: C.border, margin: "0 auto 24px" }} />
        <p style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: C.text }}>Ingresar como tienda</p>
        <p style={{ margin: "0 0 24px", fontSize: 13, color: C.muted }}>Usa el email y contraseña de tu cuenta LinkDrop.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" style={inputS}
            onFocus={(e) => { e.currentTarget.style.borderColor = C.accent; }} onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }} />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" style={inputS}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            onFocus={(e) => { e.currentTarget.style.borderColor = C.accent; }} onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }} />
          {error && <p style={{ margin: 0, fontSize: 13, color: C.red, background: "#FEF0ED", padding: "10px 14px", borderRadius: 10 }}>{error}</p>}
          <button onClick={handleLogin} disabled={loading} style={{ width: "100%", padding: "15px", borderRadius: 12, border: "none", background: loading ? "#D8D4CC" : C.text, color: "#fff", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
            {loading ? "Ingresando…" : "Ingresar →"}
          </button>
        </div>
      </div>
    </div>
  );
}
