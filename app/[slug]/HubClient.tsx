"use client";

import React, { useState, useEffect, useRef, useContext, createContext } from "react";
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
  deliveryPropio: { precio: number } | null;
};

type Tab = "cotizar" | "rastrear" | "info" | "crear";

type CotizacionItem = {
  price?: number | null;
  tipo?: string;
  tiempo?: string;
  tiempo_estimado?: string;
  tiempo_entrega?: string;
  service?: string;
  label?: string;
  name?: string;
  raw?: { totalPrice?: number | null; deliveryEstimate?: string };
};

const C_LIGHT = {
  bg:       "#F5F0E8",
  card:     "#FFFFFF",
  border:   "#E8E2D8",
  text:     "#1A1A14",
  muted:    "#8A8A7A",
  accent:   "#C17F3E",
  red:      "#E8553D",
  green:    "#2D8A56",
  greenBg:  "#EEF7F2",
  tabBg:    "#EEEBE4",
  warmCard: "#FBF3E8",
  warmBorder:"#EAD9C0",
  errBg:    "#FEF0ED",
  errBorder:"#FBCFC8",
  disabled: "#D8D4CC",
  inputBg:  "#F5F0E8",
};

const C_DARK = {
  bg:       "#141412",
  card:     "#1E1E1B",
  border:   "#2E2E2A",
  text:     "#F0EBE0",
  muted:    "#9A9A8A",
  accent:   "#D4924A",
  red:      "#E8553D",
  green:    "#3DAA6A",
  greenBg:  "#162318",
  tabBg:    "#252420",
  warmCard: "#252018",
  warmBorder:"#3A3020",
  errBg:    "#2A1A18",
  errBorder:"#5A2A22",
  disabled: "#2E2E2A",
  inputBg:  "#242420",
};

type Theme = typeof C_LIGHT;
const ThemeCtx = createContext<Theme>(C_LIGHT);
const useTheme = () => useContext(ThemeCtx);

const COURIER_CONFIG: Record<string, { color: string; colorLight: string; label: string }> = {
  starken:           { color: "#2D7A2D", colorLight: "#EEF7EE", label: "Starken" },
  starken_domicilio: { color: "#2D7A2D", colorLight: "#EEF7EE", label: "Starken Domicilio" },
  starken_sucursal:  { color: "#2D7A2D", colorLight: "#EEF7EE", label: "Starken Sucursal" },
  chilexpress:       { color: "#B8860B", colorLight: "#FFF8E8", label: "Chilexpress" },
  blueexpress:       { color: "#1A5FB4", colorLight: "#EEF3FC", label: "Blue Express" },
  noventa9Minutos:   { color: "#C0392B", colorLight: "#FDECEA", label: "99 Minutos" },
  "99minutos":       { color: "#C0392B", colorLight: "#FDECEA", label: "99 Minutos" },
};


// ─── Mapbox Address Search ────────────────────────────────────────────────────

type MapboxFeature = {
  id: string;
  place_name: string;
  text: string;
  address?: string;
  context?: { id: string; text: string }[];
};

type AddressResult = { label: string; calle: string; numero: string; comuna: string };

function MapboxAddressSearch({ onSelect, placeholder = "Busca tu dirección..." }: {
  onSelect: (result: AddressResult) => void;
  placeholder?: string;
}) {
  const C = useTheme();
  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState<MapboxFeature[]>([]);
  const [open, setOpen]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const [selected, setSelected] = useState(false);
  const ref   = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function handleInput(value: string) {
    setQuery(value);
    setSelected(false);
    if (timer.current) clearTimeout(timer.current);
    if (value.length < 3) { setResults([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json?country=CL&types=address&language=es&limit=5&access_token=${token}`;
        const res  = await fetch(url);
        const data = await res.json();
        setResults(data.features ?? []);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 350);
  }

  function handleSelect(feature: MapboxFeature) {
    const calle  = feature.text ?? "";
    const numero = feature.address ?? "";
    // Mapbox context order for CL: neighborhood → locality → place → district → region → country
    // "place" es la comuna en Chile
    const comunaCtx = feature.context?.find(
      (c) => c.id.startsWith("place")
    ) ?? feature.context?.find(
      (c) => c.id.startsWith("locality")
    ) ?? feature.context?.find(
      (c) => c.id.startsWith("district")
    );
    const comuna = comunaCtx?.text ?? "";
    const label  = feature.place_name;
    console.log("[mapbox] calle:", calle, "numero:", numero, "comuna:", comuna, "ctx:", feature.context?.map(c => `${c.id}=${c.text}`));
    setQuery(label);
    setSelected(true);
    setOpen(false);
    onSelect({ label, calle, numero, comuna });
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        {/* Pin icon */}
        <svg style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: selected ? C.accent : C.muted, pointerEvents: "none", transition: "color 0.2s" }}
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
        </svg>
        {loading && (
          <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)" }}>
            <div style={{ width: 14, height: 14, border: `2px solid ${C.border}`, borderTopColor: C.accent, borderRadius: "50%", animation: "hub-spin 0.7s linear infinite" }} />
          </div>
        )}
        <input
          type="text"
          value={query}
          autoComplete="off"
          placeholder={placeholder}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={(e) => { if (results.length > 0) setOpen(true); e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(193,127,62,0.12)"; }}
          onBlur={(e) => { if (!selected) { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; } }}
          style={{
            width: "100%", boxSizing: "border-box",
            paddingLeft: 40, paddingRight: loading ? 40 : 16,
            paddingTop: 14, paddingBottom: 14,
            border: `1.5px solid ${selected ? C.accent : C.border}`, borderRadius: 12,
            fontSize: 15, color: C.text, background: C.card, outline: "none", fontFamily: "inherit",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
        />
      </div>

      {open && results.length > 0 && (
        <div style={{ position: "absolute", zIndex: 50, width: "100%", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", marginTop: 6, overflow: "hidden" }}>
          {results.map((f) => {
            const mainText = f.place_name.split(",")[0];
            const subText  = f.place_name.split(",").slice(1).join(",").trim();
            return (
              <button key={f.id} type="button" onMouseDown={() => handleSelect(f)}
                style={{ display: "flex", alignItems: "flex-start", gap: 10, width: "100%", textAlign: "left", padding: "12px 16px", background: "none", border: "none", borderBottom: `1px solid ${C.border}`, cursor: "pointer", fontFamily: "inherit" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = C.bg; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
              >
                <svg style={{ flexShrink: 0, marginTop: 2, color: C.muted }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                <div>
                  <p style={{ margin: "0 0 1px", fontSize: 13, fontWeight: 600, color: C.text }}>{mainText}</p>
                  <p style={{ margin: 0, fontSize: 11, color: C.muted }}>{subText}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── HubClient ────────────────────────────────────────────────────────────────

export default function HubClient({ slug, pymeId, nombrePyme, logoPyme, couriersHabilitados, defaultDims, infoEnvios, deliveryPropio = null }: HubProps) {
  const [activeTab, setActiveTab] = useState<Tab>("cotizar");
  const [isOwner, setIsOwner] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showOwnerMenu, setShowOwnerMenu] = useState(false);
  const [dark, setDark] = useState(false);
  const C = dark ? C_DARK : C_LIGHT;

  useEffect(() => {
    if (!showOwnerMenu) return;
    function closeMenu(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-owner-menu]")) setShowOwnerMenu(false);
    }
    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, [showOwnerMenu]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.id === pymeId) { setIsOwner(true); setActiveTab("crear"); }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      const owner = session?.user?.id === pymeId;
      setIsOwner(owner);
      if (owner) setActiveTab("crear");
    });
    return () => subscription.unsubscribe();
  }, [pymeId]);

  const initials = nombrePyme.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  const tabs: { id: Tab; label: string }[] = [
    ...(isOwner ? [{ id: "crear" as Tab, label: "Crear envío" }] : []),
    { id: "cotizar",  label: "Cotizar envío"     },
    { id: "rastrear", label: "Rastrear pedido"   },
    { id: "info",     label: "Políticas de envío" },
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
    <ThemeCtx.Provider value={C}>
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Instrument Sans', system-ui, sans-serif" }}>
      <style suppressHydrationWarning>{`
        @keyframes hub-in { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes hub-spin { to { transform: rotate(360deg); } }
        @keyframes card-in { from { opacity:0; transform:translateY(14px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }
        .hub-result-card { animation: card-in 0.28s cubic-bezier(0.16,1,0.3,1) both; }
        .hub-result-card:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,0,0,0.08) !important; transition: transform 0.15s ease, box-shadow 0.15s ease; }
        .hub-result-card:active { transform: scale(0.98); transition: transform 0.1s ease; }
        .hub-content { animation: hub-in 0.22s cubic-bezier(0.16,1,0.3,1) both; }
        .hub-btn-press:active { transform: scale(0.97); opacity: 0.85; }
        .hub-tab-btn { transition: color 0.2s ease; }
        .hub-tab-btn:hover { opacity: 0.75; }
        @media (min-width: 600px) {
          .hub-shell {
            min-height: 100vh;
            display: flex;
            align-items: flex-start;
            justify-content: center;
            padding: 40px 20px 60px;
          }
          .hub-frame {
            width: 100%;
            max-width: 420px;
            background: ${C.bg};
            border-radius: 24px;
            border: 1px solid ${C.border};
            box-shadow: 0 4px 40px rgba(0,0,0,0.12);
            overflow: hidden;
          }
          .hub-header-inner { padding: 0 24px !important; }
          .hub-content-inner { padding: 20px 24px 40px !important; }
        }
        @media (max-width: 599px) {
          .hub-frame { width: 100%; }
        }
      `}</style>

      <div className="hub-shell">
      <div className="hub-frame">

      {/* ── Header ── */}
      <div style={{ background: C.bg, paddingBottom: 0, position: "sticky", top: 0, zIndex: 10 }}>
        <div className="hub-header-inner" style={{ maxWidth: 480, margin: "0 auto", padding: "0 20px" }}>

          {/* Fila superior */}
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, paddingTop: 14, paddingBottom: 14, minHeight: 44, position: "relative" }}>
            {/* Toggle modo oscuro/claro */}
            <button
              onClick={() => setDark((v) => !v)}
              className="hub-btn-press"
              title={dark ? "Modo claro" : "Modo oscuro"}
              style={{
                width: 34, height: 34, borderRadius: "50%",
                background: "transparent", border: `1px solid ${C.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "background 0.15s", flexShrink: 0,
              }}
            >
              {dark ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>

            {!isOwner ? (
              <button onClick={() => setShowLogin(true)} className="hub-btn-press login-btn" style={{
                fontSize: 12, fontWeight: 500, color: C.muted,
                background: "transparent", border: `1px solid ${C.border}`,
                borderRadius: 100, padding: "7px 16px",
                cursor: "pointer", fontFamily: "inherit", transition: "background 0.15s",
              }}>
                Iniciar sesión
              </button>
            ) : (
              <div data-owner-menu style={{ position: "relative" }}>
                <button
                  onClick={() => setShowOwnerMenu((v) => !v)}
                  className="hub-btn-press"
                  style={{
                    width: 34, height: 34, borderRadius: "50%",
                    background: showOwnerMenu ? C.border : "transparent",
                    border: `1px solid ${C.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", transition: "background 0.15s",
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                  </svg>
                </button>

                {showOwnerMenu && (
                  <div style={{
                    position: "absolute", top: 40, right: 0, zIndex: 100,
                    background: C.card, border: `1px solid ${C.border}`,
                    borderRadius: 14, boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                    overflow: "hidden", minWidth: 200,
                  }}>
                    <a
                      href="https://wa.me/56912345678"
                      target="_blank" rel="noreferrer"
                      onClick={() => setShowOwnerMenu(false)}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 16px", textDecoration: "none", borderBottom: `1px solid ${C.border}` }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Soporte LinkDrop</span>
                    </a>
                    <button
                      onClick={async () => { await supabase.auth.signOut(); setShowOwnerMenu(false); }}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 16px", width: "100%", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.red }}>Cerrar sesión</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Logo centrado */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: C.card,
              border: `1px solid ${C.border}`,
              boxShadow: "0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)",
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden", marginBottom: 10,
            }}>
              {logoPyme
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={logoPyme} alt={nombrePyme} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: "-0.03em" }}>{initials}</span>
              }
            </div>

            {/* Nombre */}
            <h1 style={{
              margin: "0 0 4px", textAlign: "center",
              fontSize: 22, fontWeight: 700,
              color: C.text, letterSpacing: "-0.04em", lineHeight: 1.1,
            }}>
              {nombrePyme}
            </h1>

            {/* Subtítulo */}
            <p style={{
              margin: "0 0 16px", textAlign: "center",
              fontSize: 13, color: C.muted, letterSpacing: "0.01em", lineHeight: 1.5,
            }}>
              Envíos simples y rápidos a todo Chile ✨
            </p>

            {/* Tabs iOS-style segmented control */}
            <div style={{
              position: "relative", display: "flex", alignSelf: "stretch",
              background: C.tabBg, borderRadius: 14, padding: 4, marginBottom: 20,
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

      {/* Content — siempre montados, visibilidad por CSS para preservar estado */}
      <div className="hub-content-inner" style={{ maxWidth: 480, margin: "0 auto", padding: "20px 20px 60px" }}>
        <div style={{ display: activeTab === "cotizar"  ? "block" : "none" }}><TabCotizar pymeId={pymeId} couriersHabilitados={couriersHabilitados} defaultDims={defaultDims} deliveryPropio={deliveryPropio} /></div>
        <div style={{ display: activeTab === "rastrear" ? "block" : "none" }}><TabRastrear pymeId={pymeId} /></div>
        <div style={{ display: activeTab === "info"     ? "block" : "none" }}><TabInfo infoEnvios={infoEnvios} nombrePyme={nombrePyme} /></div>
        {isOwner && <div style={{ display: activeTab === "crear" ? "block" : "none" }}><TabCrear pymeId={pymeId} nombrePyme={nombrePyme} slug={slug} defaultDims={defaultDims} /></div>}
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "24px 20px 40px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <p style={{ margin: 0, fontSize: 11, color: C.muted, display: "flex", alignItems: "center", gap: 5 }}>
          Powered by <span style={{ fontWeight: 700, color: C.accent }}>LinkDrop</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#E8553D" stroke="none">
            <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/>
          </svg>
        </p>
      </div>

      </div>{/* hub-frame */}
      </div>{/* hub-shell */}

      {showLogin && <LoginModal pymeId={pymeId} onClose={() => setShowLogin(false)} />}
    </div>
    </ThemeCtx.Provider>
  );
}

// ─── Tab Cotizar ──────────────────────────────────────────────────────────────

const AVATAR_COLORS = ["#C17F3E","#2D8A56","#1A5FB4","#8B5CF6","#C0392B","#D97706"];

type HubStats = { total: number; label: string; initials: string[]; isGlobal: boolean };

function normalizeStr(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

const COMUNAS_SANTIAGO = new Set([
  "santiago","providencia","las condes","vitacura","lo barnechea","la reina","nunoa","macul",
  "penalolen","la florida","san joaquin","san miguel","pedro aguirre cerda","lo espejo",
  "estacion central","pudahuel","cerrillos","maipu","quinta normal","cerro navia","renca",
  "quilicura","huechuraba","conchali","independencia","recoleta","lo prado",
  "padre hurtado","la granja","la pintana","el bosque","san ramon","puente alto","la cisterna",
  "san bernardo","buin","paine","colina","til til","lampa","calera de tango","pirque",
  "talagante","isla de maipo","penaflor","curacavi","melipilla","alhue","san pedro",
  "maria pinto","el monte",
].map(normalizeStr));

function esSantiago(comuna: string): boolean {
  return COMUNAS_SANTIAGO.has(normalizeStr(comuna));
}

function TabCotizar({ pymeId, couriersHabilitados, defaultDims, deliveryPropio }: {
  pymeId: string; couriersHabilitados: string[] | null; defaultDims: HubProps["defaultDims"];
  deliveryPropio: { precio: number } | null;
}) {
  const C = useTheme();
  const [address, setAddress] = useState<AddressResult | null>(null);
  const [cotizando, setCotizando] = useState(false);
  const [resultados, setResultados] = useState<Record<string, CotizacionItem> | null>(null);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<HubStats | null>(null);

  useEffect(() => {
    fetch(`/api/hub-stats?pymeId=${pymeId}`)
      .then((r) => r.json())
      .then((d) => { if (d.total !== undefined) setStats(d); })
      .catch(() => {});
  }, [pymeId]);

  const FALLBACK = { largo: 30, alto: 20, ancho: 10, peso: 1 };
  const dims = (defaultDims.largo && defaultDims.alto && defaultDims.ancho && defaultDims.peso)
    ? { largo: defaultDims.largo, alto: defaultDims.alto, ancho: defaultDims.ancho, peso: defaultDims.peso }
    : FALLBACK;

  async function handleCotizar() {
    if (!address?.comuna) { setError("Selecciona tu dirección para continuar"); return; }
    console.log("[hub] deliveryPropio:", deliveryPropio, "| comuna:", address.comuna, "| esSantiago:", esSantiago(address.comuna));
    setError(""); setCotizando(true); setResultados(null);
    try {
      const res = await fetch("/api/cotizar-publico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pymeId,
          datosDestino: { comuna: address.comuna, calle: address.calle, numero: address.numero },
          ...dims,
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

  // Muestra solo los couriers habilitados por la pyme, ordenados de menor a mayor
  function courierHabilitado(key: string): boolean {
    if (!couriersHabilitados) return true;
    const normalized = key === "99minutos" ? "noventa9Minutos" : key;
    return couriersHabilitados.includes(key) || couriersHabilitados.includes(normalized);
  }

  const resultKeys = resultados
    ? Object.keys(resultados)
        .filter((k) => resultados![k]?.price != null && courierHabilitado(k))
        .sort((a, b) => (resultados![a]!.price ?? 0) - (resultados![b]!.price ?? 0))
    : [];
  const cheapest   = resultKeys.length > 0
    ? resultKeys.reduce((a, b) => (resultados![a]!.price! < resultados![b]!.price! ? a : b))
    : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Título */}
      <div>
        <p style={{ margin: "0 0 2px", fontSize: 17, fontWeight: 700, color: C.text, letterSpacing: "-0.02em" }}>Cotiza el envío a tu dirección</p>
        <p style={{ margin: 0, fontSize: 13, color: C.muted }}>Escribe tu dirección y te mostramos los precios.</p>
      </div>

      {/* Mapbox search bar */}
      <MapboxAddressSearch
        onSelect={(result) => { setAddress(result); setResultados(null); setError(""); }}
        placeholder="Busca tu dirección..."
      />

      {error && (
        <p style={{ margin: 0, fontSize: 13, color: C.red, background: C.errBg, border: `1px solid ${C.errBorder}`, padding: "10px 14px", borderRadius: 10 }}>{error}</p>
      )}

      <button onClick={handleCotizar} disabled={cotizando || !address?.comuna} className="hub-btn-press" style={{
        width: "100%", padding: "15px", borderRadius: 12, border: "none",
        background: cotizando || !address?.comuna ? C.disabled : C.red,
        color: "#fff", fontSize: 14, fontWeight: 700,
        cursor: cotizando || !address?.comuna ? "not-allowed" : "pointer",
        fontFamily: "inherit", transition: "all 0.2s", letterSpacing: "-0.01em",
      }}>
        {cotizando ? "Cotizando…" : "Ver opciones de envío"}
      </button>

      {/* Resultados */}
      {resultados && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

          {resultKeys.length === 0 ? (
            <p style={{ fontSize: 13, color: C.muted, textAlign: "center", padding: "24px 0" }}>
              No hay couriers disponibles para {address?.comuna}.
            </p>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {resultKeys.length} opción{resultKeys.length !== 1 ? "es" : ""} disponible{resultKeys.length !== 1 ? "s" : ""}
                </p>
                <span style={{ fontSize: 11, color: C.muted }}>{address?.comuna}</span>
              </div>

              {resultKeys.map((key, i) => {
                const cot = resultados![key]!;
                const cfg = COURIER_CONFIG[key] ?? { color: C.muted, colorLight: "#F5F5F5", label: key };
                const isCheapest = key === cheapest;
                const tiempo = cot.tiempo ?? cot.raw?.deliveryEstimate ?? cot.tiempo_estimado ?? cot.tiempo_entrega ?? null;
                const tipo   = cot.tipo ?? cot.service ?? null;
                return (
                  <div
                    key={key}
                    className="hub-result-card"
                    style={{
                      background: C.card,
                      borderRadius: 16,
                      border: `1.5px solid ${isCheapest ? C.green : C.border}`,
                      padding: "16px 18px",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      position: "relative", gap: 12, cursor: "pointer",
                      boxShadow: isCheapest ? `0 2px 12px rgba(45,138,86,0.10)` : "0 1px 4px rgba(0,0,0,0.04)",
                      animationDelay: `${i * 80}ms`,
                    }}
                  >
                    {isCheapest && (
                      <span style={{
                        position: "absolute", top: -10, left: 14,
                        fontSize: 10, fontWeight: 700,
                        background: C.green, color: "#fff",
                        borderRadius: 100, padding: "3px 10px",
                        boxShadow: "0 2px 6px rgba(45,138,86,0.25)",
                      }}>
                        ✦ Más económico
                      </span>
                    )}

                    {/* Izquierda: courier + tipo + tiempo */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center",
                        fontSize: 13, fontWeight: 700, color: cfg.color,
                        background: cfg.colorLight, borderRadius: 8,
                        padding: "4px 10px", alignSelf: "flex-start",
                      }}>
                        {cfg.label}
                      </span>
                      {tipo && (
                        <span style={{
                          fontSize: 11, fontWeight: 600, color: "#6B5B45",
                          background: "#F5EDE0", borderRadius: 6,
                          padding: "2px 8px", alignSelf: "flex-start",
                          letterSpacing: "0.01em",
                        }}>
                          {tipo}
                        </span>
                      )}
                      {tiempo && (
                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: C.muted }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                          </svg>
                          {tiempo}
                        </span>
                      )}
                    </div>

                    {/* Derecha: precio + referencial */}
                    <div style={{ textAlign: "right" }}>
                      <p style={{ margin: "0 0 2px", fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "-0.04em" }}>
                        ${(cot.price ?? 0).toLocaleString("es-CL")}
                      </p>
                      <span style={{ fontSize: 10, color: C.muted, fontWeight: 500 }}>valor aprox.</span>
                    </div>
                  </div>
                );
              })}

              {/* Delivery propio — solo si habilitado y destino en Santiago */}
              {deliveryPropio && address?.comuna && esSantiago(address.comuna) && (
                <div
                  className="hub-result-card"
                  style={{
                    background: C.card, borderRadius: 16,
                    border: `1.5px solid ${C.border}`,
                    padding: "16px 18px",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    gap: 12,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      fontSize: 13, fontWeight: 700, color: "#7B2D8B",
                      background: "#F5EDF9", borderRadius: 8,
                      padding: "4px 10px", alignSelf: "flex-start",
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                      </svg>
                      Delivery de la tienda
                    </span>
                    <span style={{ fontSize: 12, color: C.muted }}>Entrega directa por la tienda</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: C.muted }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                      Solo dentro de Santiago
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ margin: "0 0 2px", fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "-0.04em" }}>
                      ${deliveryPropio.precio.toLocaleString("es-CL")}
                    </p>
                    <span style={{ fontSize: 10, color: C.muted, fontWeight: 500 }}>precio fijo</span>
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <div style={{
                background: "linear-gradient(135deg, #FBF5EC 0%, #F5EDE0 100%)",
                border: "1px solid #EAD9C0",
                borderRadius: 14, padding: "14px 16px",
                display: "flex", gap: 10, alignItems: "flex-start",
              }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
                <div>
                  <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 700, color: C.text }}>
                    Estos son valores referenciales
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: C.muted, lineHeight: 1.6 }}>
                    El precio final puede variar según el peso y dimensiones exactas. La tienda te enviará el link de envío con el valor definitivo.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Dudas */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px" }}>
        <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: C.text }}>¿Tienes dudas del envío?</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex" }}>
              {(stats?.initials ?? ["MA","JG","CC","RV","LP","SS"]).map((ini, i, arr) => (
                <div key={i} style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                  border: `2px solid ${C.card}`, marginLeft: i === 0 ? 0 : -8,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, fontWeight: 700, color: "#fff", position: "relative", zIndex: arr.length - i,
                }}>{ini}</div>
              ))}
            </div>
            <p style={{ margin: 0, fontSize: 12, color: C.muted }}>
              {stats ? `+${stats.total.toLocaleString("es-CL")} clientes felices` : "Cargando..."}
            </p>
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
          <p style={{ margin: "0 0 2px", fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "-0.04em" }}>
            {stats ? `+${stats.total.toLocaleString("es-CL")}` : "—"}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: C.muted }}>{stats?.label ?? "envíos realizados"}</p>
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

function TabRastrear({ pymeId }: { pymeId: string }) {
  const C = useTheme();
  const [tracking, setTracking] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [resultado, setResultado] = useState<{ id: number; tracking_url?: string; courier?: string } | null>(null);
  const [error, setError] = useState("");

  async function handleBuscar() {
    if (!tracking.trim()) { setError("Ingresa tu número de seguimiento"); return; }
    setError(""); setBuscando(true); setResultado(null);
    try {
      const res = await fetch(`/api/rastrear?tracking=${encodeURIComponent(tracking.trim())}&pymeId=${encodeURIComponent(pymeId)}`);
      const data = await res.json();

      if (!res.ok || !data.found) { setError("No encontramos un envío con ese número. Verifica que sea correcto."); return; }
      setResultado({ id: data.id, tracking_url: data.tracking_url ?? undefined, courier: data.courier ?? undefined });
    } catch {
      setError("Error al buscar. Intenta de nuevo.");
    } finally {
      setBuscando(false);
    }
  }

  const envioUrl = resultado ? `/final?id=${resultado.id}` : "";

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

      {error && (
        <p style={{ margin: 0, fontSize: 13, color: C.red, background: C.errBg, border: `1px solid ${C.errBorder}`, padding: "10px 14px", borderRadius: 10 }}>
          {error}
        </p>
      )}

      <button onClick={handleBuscar} disabled={buscando || !tracking.trim()} className="hub-btn-press" style={{
        width: "100%", padding: "15px", borderRadius: 12, border: "none",
        background: buscando || !tracking.trim() ? C.disabled : C.red,
        color: "#fff", fontSize: 14, fontWeight: 700,
        cursor: buscando || !tracking.trim() ? "not-allowed" : "pointer",
        fontFamily: "inherit", transition: "all 0.2s",
      }}>
        {buscando ? "Buscando…" : "Buscar pedido"}
      </button>

      {/* Resultado */}
      {resultado && (
        <div className="hub-content" style={{ display: "flex", flexDirection: "column", gap: 10 }}>

          {/* Card principal */}
          <div style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 16, overflow: "hidden",
            boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
          }}>
            {/* Header */}
            <div style={{ padding: "16px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ margin: "0 0 4px", fontSize: 12, color: C.muted, fontWeight: 500 }}>Número de seguimiento</p>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text, fontFamily: "monospace" }}>{tracking}</p>
              </div>
              {resultado.courier && (
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: COURIER_CONFIG[resultado.courier]?.color ?? C.muted,
                  background: COURIER_CONFIG[resultado.courier]?.colorLight ?? C.bg,
                  borderRadius: 8, padding: "4px 10px",
                }}>
                  {COURIER_CONFIG[resultado.courier]?.label ?? resultado.courier}
                </span>
              )}
            </div>

            {/* Botón principal — link de seguimiento LinkDrop */}
            <a href={envioUrl} target="_blank" rel="noopener noreferrer" style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 18px", textDecoration: "none",
              background: C.accent, color: "#fff",
            }}>
              <div>
                <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: "#fff" }}>Ver estado de mi envío</p>
                <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Estado, guía y detalles del pedido</p>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </a>

            {/* Link courier oficial si existe */}
            {resultado.tracking_url && (
              <a href={resultado.tracking_url} target="_blank" rel="noopener noreferrer" style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 18px", textDecoration: "none",
                borderTop: `1px solid ${C.border}`,
              }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.muted }}>Seguimiento oficial del courier</p>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </a>
            )}
          </div>

        </div>
      )}

    </div>
  );
}

// ─── Tab Info (Políticas) ─────────────────────────────────────────────────────

const INFO_CARDS = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
        <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
    titulo: "Despacho",
    texto: "Despachamos en 24 a 48 hrs hábiles una vez confirmado tu pedido.",
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
    texto: "Enviamos a todo Chile con múltiples couriers según tu ubicación.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
    titulo: "Seguimiento",
    texto: "Recibirás tu número de seguimiento apenas tu pedido sea despachado.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    titulo: "Embalaje seguro",
    texto: "Todos los pedidos se embalan con cuidado para que lleguen en perfectas condiciones.",
  },
];

function TabInfo({ infoEnvios, nombrePyme }: { infoEnvios: string | null; nombrePyme: string }) {
  const C = useTheme();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

      {/* Bloque personalizado si la pyme lo llenó */}
      {infoEnvios && infoEnvios.trim() && (
        <div style={{
          background: C.warmCard, border: `1px solid ${C.warmBorder}`, borderRadius: 14,
          padding: "18px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
              background: C.card, border: `1px solid ${C.warmBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center", color: C.accent,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text }}>Política de {nombrePyme}</p>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: C.muted, lineHeight: 1.7, whiteSpace: "pre-line" }}>{infoEnvios}</p>
        </div>
      )}

      {/* Cards genéricas */}
      {INFO_CARDS.map((p, i) => (
        <div key={i} style={{
          background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
          padding: "18px", display: "flex", alignItems: "center", gap: 16,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
            background: C.bg, border: `1px solid ${C.border}`,
            display: "flex", alignItems: "center", justifyContent: "center", color: C.accent,
          }}>
            {p.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: "0 0 3px", fontSize: 14, fontWeight: 600, color: C.text }}>{p.titulo}</p>
            <p style={{ margin: 0, fontSize: 12, color: C.muted, lineHeight: 1.6 }}>{p.texto}</p>
          </div>
        </div>
      ))}

      {/* Trust card */}
      <div style={{
        marginTop: 6,
        background: "linear-gradient(135deg, #FBF5EC 0%, #F5EDE0 100%)",
        border: "1px solid #EAD9C0", borderRadius: 20,
        padding: "24px", textAlign: "center",
      }}>
        <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: "-0.02em" }}>
          Gracias por confiar en {nombrePyme} 🙌
        </p>
        <p style={{ margin: 0, fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
          Cada pedido es preparado con cuidado. Ante cualquier consulta no dudes en contactarnos.
        </p>
      </div>

    </div>
  );
}

// ─── Tab Crear envío ──────────────────────────────────────────────────────────

const PKG_PRESETS = [
  { id: "sobre", label: "Sobre",       desc: "hasta 0.5 kg", largo: 20, alto: 20, ancho: 20, peso: 0.5 },
  { id: "m",     label: "Mediano",     desc: "hasta 2 kg",   largo: 40, alto: 30, ancho: 15, peso: 2   },
  { id: "l",     label: "Grande",      desc: "hasta 4 kg",   largo: 45, alto: 35, ancho: 20, peso: 4   },
  { id: "xl",    label: "Caja grande", desc: "hasta 8 kg",   largo: 55, alto: 45, ancho: 30, peso: 8   },
];

const PRESET_ICONS: Record<string, React.ReactElement> = {
  sobre: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  m:     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"/><polyline points="16.5 9.4 7.55 4.24"/><line x1="3.29" y1="7" x2="12" y2="12"/><line x1="12" y1="12" x2="12" y2="22"/></svg>,
  l:     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>,
  xl:    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
};

function TabCrear({ pymeId, nombrePyme, slug, defaultDims }: {
  pymeId: string; nombrePyme: string; slug: string; defaultDims: HubProps["defaultDims"];
}) {
  const C = useTheme();
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [generando, setGenerando]           = useState(false);
  const [generatedUrl, setGeneratedUrl]     = useState("");
  const [copied, setCopied]                 = useState(false);
  const [error, setError]                   = useState("");
  const [origin, setOrigin]                 = useState("");
  const [custom, setCustom]                 = useState({ largo: "", alto: "", ancho: "", peso: "" });
  const [showLimitModal, setShowLimitModal] = useState(false);

  useEffect(() => { setOrigin(window.location.origin); }, []);

  const isCustom = selectedPreset === "custom";

  async function handleGenerar() {
    let dims: { largo: number; alto: number; ancho: number; peso: number } | null = null;
    if (isCustom) {
      const l = parseFloat(custom.largo), a = parseFloat(custom.alto), an = parseFloat(custom.ancho), p = parseFloat(custom.peso);
      if (!l || !a || !an || !p) { setError("Completa todas las dimensiones"); return; }
      dims = { largo: l, alto: a, ancho: an, peso: p };
    } else {
      const preset = selectedPreset ? PKG_PRESETS.find((p) => p.id === selectedPreset) : null;
      dims = preset ?? (defaultDims.largo ? { largo: defaultDims.largo, alto: defaultDims.alto!, ancho: defaultDims.ancho!, peso: defaultDims.peso! } : null);
    }
    if (!dims) { setError("Selecciona un tamaño de paquete"); return; }
    setError(""); setGenerando(true); setGeneratedUrl("");
    try {
      const res = await fetch("/api/crear-envio-hub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pymeId,
          largo: dims.largo, alto: dims.alto, ancho: dims.ancho, peso: dims.peso,
        }),
      });
      const data = await res.json();
      if (res.status === 403) { setShowLimitModal(true); return; }
      if (!res.ok) throw new Error(data.error ?? "Error al generar");
      // Mismo formato de URL que el dashboard: /{slug}/envio/{base36}
      const pymeSlug = data.slug || slug;
      const base36   = Number(data.id).toString(36);
      const path     = pymeSlug ? `/${pymeSlug}/envio/${base36}` : `/envio?id=${data.id}`;
      setGeneratedUrl(`${origin}${path}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al generar");
    } finally {
      setGenerando(false);
    }
  }

  async function copyUrl() {
    await navigator.clipboard.writeText(generatedUrl).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Modal límite de plan */}
      {showLimitModal && (
        <div onClick={() => setShowLimitModal(false)} style={{
          position: "fixed", inset: 0, zIndex: 300,
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "flex-end", justifyContent: "center",
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: C.card, borderRadius: "20px 20px 0 0",
            width: "100%", maxWidth: 480, padding: "28px 24px 44px",
          }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: C.border, margin: "0 auto 24px" }} />

            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: C.warmCard, border: `1px solid ${C.warmBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px", color: C.accent,
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>

            <p style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800, color: C.text, textAlign: "center", letterSpacing: "-0.02em" }}>
              Límite de tu plan alcanzado
            </p>
            <p style={{ margin: "0 0 24px", fontSize: 13, color: C.muted, textAlign: "center", lineHeight: 1.6 }}>
              Ya usaste todos los links de tu plan actual. Para seguir creando envíos, actualiza tu plan.
            </p>

            <a
              href="https://wa.me/56912345678?text=Hola%2C%20quiero%20actualizar%20mi%20plan%20en%20LinkDrop"
              target="_blank" rel="noreferrer"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                width: "100%", padding: "15px", borderRadius: 12, boxSizing: "border-box",
                background: "#25D366", color: "#fff", fontSize: 14, fontWeight: 700,
                textDecoration: "none", marginBottom: 10,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.554 4.118 1.523 5.848L0 24l6.305-1.502A11.955 11.955 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.89 0-3.663-.518-5.183-1.42l-.371-.22-3.844.916.977-3.741-.242-.386A9.954 9.954 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
              Contáctanos para actualizar
            </a>

            <button onClick={() => setShowLimitModal(false)} style={{
              width: "100%", padding: "13px", borderRadius: 12, border: `1px solid ${C.border}`,
              background: "none", color: C.muted, fontSize: 13, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
            }}>
              Cerrar
            </button>
          </div>
        </div>
      )}


      {/* Header */}
      <div>
        <p style={{ margin: "0 0 2px", fontSize: 17, fontWeight: 700, color: C.text, letterSpacing: "-0.02em" }}>Crear link de envío</p>
        <p style={{ margin: 0, fontSize: 13, color: C.muted }}>Elige el tamaño del paquete y genera el link para tu cliente.</p>
      </div>

      {/* Presets */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Tamaño del paquete</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {PKG_PRESETS.map((p) => {
            const active = selectedPreset === p.id;
            return (
              <button key={p.id} onClick={() => setSelectedPreset(active ? null : p.id)} className="hub-btn-press" style={{
                border: `1.5px solid ${active ? C.accent : C.border}`,
                borderRadius: 14, padding: "14px 16px",
                background: active ? C.accent : C.card,
                cursor: "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", gap: 12,
                transition: "all 0.15s", textAlign: "left",
              }}>
                <span style={{ color: active ? "rgba(255,255,255,0.8)" : C.accent, flexShrink: 0 }}>
                  {PRESET_ICONS[p.id]}
                </span>
                <div>
                  <p style={{ margin: "0 0 1px", fontSize: 13, fontWeight: 700, color: active ? "#fff" : C.text }}>{p.label}</p>
                  <p style={{ margin: 0, fontSize: 11, color: active ? "rgba(255,255,255,0.55)" : C.muted }}>{p.desc}</p>
                </div>
              </button>
            );
          })}

          {/* Opción personalizado */}
          <button
            onClick={() => setSelectedPreset(isCustom ? null : "custom")}
            className="hub-btn-press"
            style={{
              gridColumn: "1 / -1",
              border: `1.5px solid ${isCustom ? C.accent : C.border}`,
              borderRadius: 14, padding: "14px 16px",
              background: isCustom ? C.warmCard : C.card,
              cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 12,
              transition: "all 0.15s", textAlign: "left",
            }}
          >
            <span style={{ color: C.accent, flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </span>
            <div>
              <p style={{ margin: "0 0 1px", fontSize: 13, fontWeight: 700, color: isCustom ? C.accent : C.text }}>Personalizado</p>
              <p style={{ margin: 0, fontSize: 11, color: C.muted }}>Ingresa dimensiones exactas</p>
            </div>
          </button>
        </div>

        {/* Inputs dimensiones personalizadas */}
        {isCustom && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 4 }}>
            {[
              { key: "largo", label: "Largo (cm)" },
              { key: "alto",  label: "Alto (cm)"  },
              { key: "ancho", label: "Ancho (cm)" },
              { key: "peso",  label: "Peso (kg)"  },
            ].map(({ key, label }) => (
              <div key={key}>
                <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 600, color: C.muted }}>{label}</p>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={custom[key as keyof typeof custom]}
                  onChange={(e) => setCustom((prev) => ({ ...prev, [key]: e.target.value }))}
                  placeholder="0"
                  style={{
                    width: "100%", boxSizing: "border-box",
                    border: `1.5px solid ${C.border}`, borderRadius: 10,
                    padding: "11px 14px", fontSize: 15, color: C.text,
                    background: C.card, outline: "none", fontFamily: "inherit",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = C.accent; }}
                  onBlur={(e)  => { e.currentTarget.style.borderColor = C.border; }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p style={{ margin: 0, fontSize: 13, color: C.red, background: C.errBg, border: `1px solid ${C.errBorder}`, padding: "10px 14px", borderRadius: 10 }}>{error}</p>
      )}

      {/* Modal link listo — mismo look que dashboard */}
      {generatedUrl && (
        <div onClick={() => setGeneratedUrl("")} style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "flex-end", justifyContent: "center",
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            width: "100%", maxWidth: 480,
            borderRadius: "20px 20px 0 0", overflow: "hidden",
            boxShadow: "0 -8px 40px rgba(0,0,0,0.4)",
            animation: "hub-in 0.3s cubic-bezier(0.16,1,0.3,1) both",
          }}>
            {/* Hero oscuro */}
            <div style={{ background: "linear-gradient(145deg, #1C1B18 0%, #252420 60%, #1A1916 100%)", padding: "24px 20px 20px", position: "relative" }}>
              <button onClick={() => setGeneratedUrl("")} style={{
                position: "absolute", top: 14, right: 14,
                width: 28, height: 28, borderRadius: "50%",
                background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.5)", fontSize: 14, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit",
              }}>✕</button>

              {/* Badge */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#F5A623", display: "inline-block" }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                  Esperando pago
                </span>
              </div>

              <p style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                Tu link está <span style={{ color: "#E8553D" }}>listo</span>
              </p>
              <p style={{ margin: "0 0 18px", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                Compártelo, tu cliente hace el resto
              </p>

              {/* URL pill */}
              <div style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                <p style={{ margin: 0, flex: 1, fontFamily: "ui-monospace, monospace", fontSize: 10, color: "rgba(255,255,255,0.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {generatedUrl}
                </p>
                <button onClick={copyUrl} style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: copied ? "rgba(76,211,138,0.2)" : "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s" }}>
                  {copied
                    ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4CD38A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  }
                </button>
                <a href={generatedUrl} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Acciones */}
            <div style={{ background: "#201F1C", padding: "14px 16px 28px", display: "flex", flexDirection: "column", gap: 8 }}>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Para coordinar tu pedido necesito que completes este formulario con tus datos: 👉 ${generatedUrl} Es rápido, menos de 1 minuto 🙌 — ${nombrePyme}`)}`}
                target="_blank" rel="noreferrer"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px", borderRadius: 12, background: "#25D366", color: "#fff", fontSize: 14, fontWeight: 700, textDecoration: "none" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.554 4.118 1.523 5.848L0 24l6.305-1.502A11.955 11.955 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.89 0-3.663-.518-5.183-1.42l-.371-.22-3.844.916.977-3.741-.242-.386A9.954 9.954 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                Enviar por WhatsApp
              </a>
              <button onClick={() => { setGeneratedUrl(""); setSelectedPreset(null); }} style={{
                padding: "13px", borderRadius: 12,
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}>
                + Crear otro link
              </button>
            </div>
          </div>
        </div>
      )}

      {!generatedUrl && (
        <button onClick={handleGenerar} disabled={generando || !selectedPreset} className="hub-btn-press" style={{
          width: "100%", padding: "15px", borderRadius: 12, border: "none",
          background: generando || !selectedPreset ? C.disabled : C.accent,
          color: "#fff", fontSize: 14, fontWeight: 700,
          cursor: generando || !selectedPreset ? "not-allowed" : "pointer",
          fontFamily: "inherit", transition: "all 0.2s", letterSpacing: "-0.01em",
        }}>
          {generando ? "Generando link…" : "Generar link de envío →"}
        </button>
      )}

    </div>
  );
}

// ─── Login Modal ──────────────────────────────────────────────────────────────

function LoginModal({ pymeId, onClose }: { pymeId: string; onClose: () => void }) {
  const C = useTheme();
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
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.card, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, padding: "28px 24px 44px" }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: C.border, margin: "0 auto 24px" }} />
        <p style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: C.text }}>¿Eres dueño de este link?</p>
        <p style={{ margin: "0 0 24px", fontSize: 13, color: C.muted }}>Inicia sesión con tu cuenta LinkDrop para gestionar tus envíos.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" style={inputS}
            onFocus={(e) => { e.currentTarget.style.borderColor = C.accent; }} onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }} />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" style={inputS}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            onFocus={(e) => { e.currentTarget.style.borderColor = C.accent; }} onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }} />
          {error && <p style={{ margin: 0, fontSize: 13, color: C.red, background: "#FEF0ED", padding: "10px 14px", borderRadius: 10 }}>{error}</p>}
          <button onClick={handleLogin} disabled={loading} style={{ width: "100%", padding: "15px", borderRadius: 12, border: "none", background: loading ? C.disabled : C.text, color: "#fff", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
            {loading ? "Ingresando…" : "Ingresar →"}
          </button>
        </div>
      </div>
    </div>
  );
}
