"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/utils/supabase";
import { useSearchParams } from "next/navigation";
import {
  MapPinIcon,
  LockClosedIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type SucursalType = {
  branch_code: number;
  branch_id?: number;
  reference: string;
  address: string | { street?: string; number?: string; city?: string; state?: string; country?: string };
  city?: string;
  state?: string;
  locality?: string;
  latitude?: number;
  longitude?: number;
  hours?: Record<string, string>;
  admission?: boolean;
  delivery?: boolean;
};

type CotizacionItem = {
  price?: number | null;
  tipo?: string;
  tiempo?: string;
  service?: string;
  carrier?: string;
  sucursales?: SucursalType[];
  raw?: {
    totalPrice?: number | null;
    deliveryEstimate?: string;
  };
};

type EnvioType = {
  nombre_pyme: string;
  logo_pyme: string;
  datos_destino?: {
    nombre: string;
    calle: string;
    numero: string;
    depto?: string;
    comuna: string;
    telefono?: string;
    direccion?: string;
    number?: string;
  };
  cotizaciones?: Record<string, CotizacionItem>;
  estado?: string;
  courier?: string;
  tracking?: string;
  tracking_url?: string;
  ask_instagram?: boolean;
  couriers_habilitados?: string[] | null;
  delivery_propio?: {
    enabled: boolean;
    precio: number;
    telefono: string;
    banco: string;
    cuenta: string;
    titular: string;
    rut: string;
    email: string;
  } | null;
  producto_precio?: number | null;
  producto_nombre?: string | null;
  producto_imagen?: string | null;
};

const COMUNAS_SANTIAGO = new Set([
  "santiago","providencia","ñuñoa","las condes","vitacura","lo barnechea","la reina",
  "peñalolén","macul","san joaquín","la granja","la florida","puente alto","la pintana",
  "san bernardo","el bosque","pedro aguirre cerda","lo espejo","cerrillos","maipú",
  "pudahuel","quinta normal","cerro navia","renca","quilicura","conchalí","huechuraba",
  "recoleta","independencia","estación central","padre hurtado","peñaflor","lampa",
  "colina","buin","paine","pirque","calera de tango","talagante","el monte","isla de maipo",
  "melipilla","curacaví","til til","lo prado","san ramón","la cisterna","san miguel",
  "lo espejo","el monte",
]);

// ─── Helpers de cotización ────────────────────────────────────────────────────

function getPrice(cot: CotizacionItem): number | null {
  return cot.price ?? cot.raw?.totalPrice ?? null;
}

function getTiempo(cot: CotizacionItem): string | undefined {
  return cot.tiempo ?? cot.raw?.deliveryEstimate;
}

// Feriados chilenos (formato YYYY-MM-DD). Actualizar año a año.
// Los que caen en fin de semana son redundantes (ya se saltan) pero se dejan por claridad.
const FERIADOS_CL = new Set<string>([
  // 2026
  "2026-01-01", // Año Nuevo
  "2026-04-03", // Viernes Santo
  "2026-04-04", // Sábado Santo
  "2026-05-01", // Día del Trabajo
  "2026-05-21", // Glorias Navales
  "2026-06-20", // Día Nacional de los Pueblos Indígenas
  "2026-06-29", // San Pedro y San Pablo
  "2026-07-16", // Virgen del Carmen
  "2026-08-15", // Asunción de la Virgen
  "2026-09-18", // Independencia
  "2026-09-19", // Glorias del Ejército
  "2026-10-12", // Encuentro de Dos Mundos
  "2026-10-31", // Iglesias Evangélicas
  "2026-11-01", // Todos los Santos
  "2026-12-08", // Inmaculada Concepción
  "2026-12-25", // Navidad
  // 2027 (los primeros, por si la estimación cruza de año)
  "2027-01-01", // Año Nuevo
]);

function isoLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Suma días hábiles (lun-vie, excluye feriados) a partir de hoy
function addBusinessDays(start: Date, days: number): Date {
  const d = new Date(start);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6 && !FERIADOS_CL.has(isoLocal(d))) added++;
  }
  return d;
}

function fmtDay(d: Date): string {
  return d.toLocaleDateString("es-CL", { weekday: "short", day: "numeric", month: "short" })
    .replace(".", "");
}

// Convierte "2-3 días" / "3 días hábiles" en una fecha aproximada de llegada.
// Si no logra parsear, devuelve null y se usa el texto original como fallback.
function estimateArrival(tiempo?: string): string | null {
  if (!tiempo) return null;
  const m = tiempo.match(/(\d+)\s*(?:a|-|–|hasta)?\s*(\d+)?\s*d[ií]a/i);
  if (!m) return null;
  const min = parseInt(m[1], 10);
  const max = m[2] ? parseInt(m[2], 10) : min;
  if (!Number.isFinite(min) || min <= 0) return null;
  const today = new Date();
  if (max > min) {
    return `Llega entre ${fmtDay(addBusinessDays(today, min))} y ${fmtDay(addBusinessDays(today, max))}`;
  }
  return `Llega aprox. ${fmtDay(addBusinessDays(today, min))}`;
}

// ─── Config couriers ──────────────────────────────────────────────────────────

const COURIER_CONFIG: Record<string, { color: string; colorLight: string; label: string; tag?: string }> = {
  starken: {
    color: "#00A651",
    colorLight: "#E8F8EE",
    label: "Starken",
  },
  starken_domicilio: {
    color: "#00A651",
    colorLight: "#E8F8EE",
    label: "Starken Domicilio",
  },
  starken_sucursal: {
    color: "#00A651",
    colorLight: "#E8F8EE",
    label: "Starken Sucursal",
    tag: "Más económico",
  },
  chilexpress: {
    color: "#FFC600",
    colorLight: "#FFFBE8",
    label: "Chilexpress",
  },
  blueexpress: {
    color: "#0055B8",
    colorLight: "#E8F0FA",
    label: "Blue Express",
  },
  noventa9Minutos: {
    color: "#FF3B30",
    colorLight: "#FFF0EE",
    label: "99 Minutos",
  },
  "99minutos": {
    color: "#FF3B30",
    colorLight: "#FFF0EE",
    label: "99 Minutos",
  },
};

// Orden de visualización
const COURIER_ORDER = [
  "starken_domicilio",
  "starken",
  "starken_sucursal",
  "chilexpress",
  "blueexpress",
  "noventa9Minutos",
  "99minutos",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

// ─── Búsqueda de dirección (Mapbox, mismo patrón que el hub de cotización) ──────

type MapboxFeature = {
  id: string;
  place_name: string;
  text: string;
  address?: string;
  context?: { id: string; text: string }[];
};
type AddressResult = { label: string; calle: string; numero: string; comuna: string };

function MapboxAddressSearch({ onSelect, placeholder = "Busca tu dirección…" }: {
  onSelect: (r: AddressResult) => void;
  placeholder?: string;
}) {
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState<MapboxFeature[]>([]);
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
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
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  }

  function handleSelect(feature: MapboxFeature) {
    const calle  = feature.text ?? "";
    const numero = feature.address ?? "";
    // En Chile la comuna viene como "place" (o locality/district de respaldo)
    const comunaCtx = feature.context?.find((c) => c.id.startsWith("place"))
      ?? feature.context?.find((c) => c.id.startsWith("locality"))
      ?? feature.context?.find((c) => c.id.startsWith("district"));
    const comuna = comunaCtx?.text ?? "";
    setQuery(feature.place_name);
    setSelected(true);
    setOpen(false);
    onSelect({ label: feature.place_name, calle, numero, comuna });
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <svg className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${selected ? "text-[#E8553D]" : "text-[#9C9C95]"}`}
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
        </svg>
        {loading && <div className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 border-2 border-[#E8E8E3] border-t-[#E8553D] rounded-full animate-spin" />}
        <input
          type="text"
          value={query}
          autoComplete="off"
          placeholder={placeholder}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          className={`w-full rounded-xl border pl-10 ${loading ? "pr-10" : "pr-4"} py-3 text-sm text-[#1A1A18] bg-[#FAFAF7] outline-none transition-all focus:border-[#E8553D] focus:ring-2 focus:ring-[#E8553D]/10 placeholder:text-[#9C9C95] ${selected ? "border-[#E8553D]" : "border-[#E8E8E3]"}`}
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 w-full bg-white border border-[#E8E8E3] rounded-xl shadow-lg mt-1.5 overflow-hidden">
          {results.map((f) => {
            const mainText = f.place_name.split(",")[0];
            const subText  = f.place_name.split(",").slice(1).join(",").trim();
            return (
              <button key={f.id} type="button" onMouseDown={() => handleSelect(f)}
                className="flex items-start gap-2.5 w-full text-left px-4 py-3 hover:bg-[#FFF0ED] transition-colors border-b border-[#F5F5F0] last:border-0">
                <svg className="flex-shrink-0 mt-0.5 text-[#9C9C95]" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-[#1A1A18] truncate">{mainText}</p>
                  <p className="text-[11px] text-[#9C9C95] truncate">{subText}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StoreHeader({ envio, enviosPagados }: { envio: EnvioType; enviosPagados?: number | null }) {
  return (
    <div className="bg-white border-b border-[#E8E8E3] px-6 py-8 text-center">
      {envio.logo_pyme ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={envio.logo_pyme}
          alt={envio.nombre_pyme}
          className="w-20 h-20 rounded-full object-cover mx-auto mb-4 border-2 border-[#E8E8E3] shadow-md"
        />
      ) : (
        <div className="w-20 h-20 rounded-full bg-[#E8553D] mx-auto mb-4 flex items-center justify-center shadow-md">
          <span className="text-white text-3xl font-bold">
            {envio.nombre_pyme?.[0]?.toUpperCase() ?? "T"}
          </span>
        </div>
      )}
      <h1 className="text-2xl font-bold text-[#1A1A18]">{envio.nombre_pyme}</h1>
      <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
        {enviosPagados != null && enviosPagados >= 10 ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#2D8A56] bg-[#F0FAF4] border border-[#B8E2C8] rounded-full px-2.5 py-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            +{enviosPagados} envíos realizados
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#5C5C57] bg-[#FAFAF7] border border-[#E8E8E3] rounded-full px-2.5 py-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            Tienda en LinkDrop
          </span>
        )}
      </div>
    </div>
  );
}

function ProductoHero({ envio }: { envio: EnvioType }) {
  if (!envio.producto_precio || envio.producto_precio <= 0) return null;
  return (
    <div className="bg-white rounded-2xl border border-[#E8E8E3] shadow-sm p-3 mb-4 flex items-center gap-3.5">
      {envio.producto_imagen ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={envio.producto_imagen}
          alt={envio.producto_nombre ?? "Producto"}
          className="w-[68px] h-[68px] rounded-xl object-cover flex-shrink-0 border border-[#E8E8E3]"
        />
      ) : (
        <div className="w-[68px] h-[68px] rounded-xl bg-gradient-to-br from-[#FFF0ED] to-[#FAFAF7] border border-[#F5D5CE] flex items-center justify-center text-3xl flex-shrink-0">
          🛍️
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#E8553D] mb-1">Tu compra</p>
        <p className="text-sm font-semibold text-[#1A1A18] leading-snug line-clamp-2">
          {envio.producto_nombre || "Producto"}
        </p>
        <p className="text-lg font-extrabold text-[#1A1A18] mt-1 leading-none">
          ${envio.producto_precio.toLocaleString("es-CL")}
        </p>
      </div>

      <span className="self-start flex-shrink-0 text-[10px] font-semibold text-[#5C5C57] bg-[#FAFAF7] border border-[#E8E8E3] rounded-full px-2.5 py-1">
        + envío
      </span>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="w-full bg-white border border-[#E8E8E3] rounded-2xl p-4 shadow-sm animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-[#E8E8E3]" />
        <div className="flex-1">
          <div className="h-4 bg-[#E8E8E3] rounded-full w-28 mb-2" />
          <div className="h-3 bg-[#E8E8E3] rounded-full w-40" />
        </div>
        <div className="text-right">
          <div className="h-6 bg-[#E8E8E3] rounded-full w-20 mb-1" />
          <div className="h-3 bg-[#E8E8E3] rounded-full w-16 ml-auto" />
        </div>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-[#F0F0EB]">
        <div className="h-3 bg-[#E8E8E3] rounded-full w-24" />
        <div className="h-9 bg-[#E8E8E3] rounded-xl w-28" />
      </div>
    </div>
  );
}

function InstagramField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div>
      <label className="block text-sm font-semibold text-[#1A1A18] mb-1.5 flex items-center gap-1.5">
        Instagram <span className="text-[#E8553D]">*</span>
        <button
          type="button"
          onClick={() => setShowTooltip((s) => !s)}
          className="w-4 h-4 rounded-full bg-[#E8E8E3] text-[#9C9C95] flex items-center justify-center text-[10px] font-bold leading-none hover:bg-[#D1D1CC] transition-colors flex-shrink-0"
        >
          ?
        </button>
      </label>

      {showTooltip && (
        <div className="mb-2 bg-[#1A1A18] text-white text-xs rounded-xl px-4 py-3 leading-relaxed relative">
          <button
            type="button"
            onClick={() => setShowTooltip(false)}
            className="absolute top-2 right-3 text-white/50 hover:text-white text-sm leading-none"
          >
            ✕
          </button>
          La tienda usa tu Instagram para llevar un registro de a qué cliente corresponde cada guía de despacho. No se publica ni comparte.
        </div>
      )}

      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#9C9C95] font-medium pointer-events-none">@</span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/^@/, ""))}
          placeholder="usuario"
          className="w-full border border-[#E8E8E3] rounded-xl pl-8 pr-4 py-3 text-sm text-[#1A1A18] bg-[#FAFAF7] outline-none transition-all focus:border-[#E8553D] focus:ring-2 focus:ring-[#E8553D]/10 placeholder:text-[#9C9C95]"
        />
      </div>
    </div>
  );
}

// ─── Selector de sucursales ───────────────────────────────────────────────────

function SucursalSelector({
  sucursales,
  selected,
  onSelect,
}: {
  sucursales: SucursalType[];
  selected: SucursalType | null;
  onSelect: (s: SucursalType) => void;
}) {
  return (
    <div className="mt-3 bg-[#F5FBF7] border border-[#B8E2C8] rounded-2xl p-4">
      <p className="text-xs font-semibold text-[#2D8A56] uppercase tracking-wider mb-3">
        🏢 Elige la sucursal de retiro
      </p>
      <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
        {sucursales.filter((s) => s.admission !== false).map((s) => {
          const isSelected = selected?.branch_code === s.branch_code;
          return (
            <button
              key={s.branch_code}
              onClick={() => onSelect(s)}
              className="w-full text-left rounded-xl border-2 px-4 py-3 transition-all"
              style={{
                borderColor: isSelected ? "#00A651" : "#E8E8E3",
                backgroundColor: isSelected ? "#E8F8EE" : "#fff",
                color: "#1A1A18",
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p style={{ color: "#1A1A18", fontSize: 14, fontWeight: 600, lineHeight: "1.3" }}>
                    {(() => {
                      if (typeof s.address === "object" && s.address !== null) {
                        const a = s.address as any;
                        const line = `${a.street ?? ""} ${a.number ?? ""}`.trim();
                        return line || s.reference;
                      }
                      return (s.address as string) || s.reference;
                    })()}
                  </p>
                  <p style={{ color: "#5C5C57", fontSize: 12, marginTop: 2 }}>
                    {(() => {
                      const city = typeof s.address === "object" && s.address !== null
                        ? (s.address as any).city ?? s.city
                        : s.city;
                      const loc = s.locality;
                      if (city && loc && loc !== city) return `${city}, ${loc}`;
                      return city ?? loc ?? "";
                    })()}
                  </p>
                </div>
                {isSelected && (
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#00A651] flex items-center justify-center mt-0.5">
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
      {!selected && (
        <p className="text-xs text-[#9C9C95] text-center mt-3">
          Selecciona una sucursal para continuar
        </p>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function EnvioClient({ envioId }: { envioId?: string } = {}) {
  const searchParams = useSearchParams();
  const id = envioId ?? searchParams.get("id");

  const [envio, setEnvio] = useState<EnvioType | null>(null);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [cardsVisible, setCardsVisible] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState<string | null>(null);
  const [selectedSucursal, setSelectedSucursal] = useState<SucursalType | null>(null);

  const [formCliente, setFormCliente] = useState({
    nombre: "", telefono: "", comuna: "", calle: "", numero: "", depto: "", instagram: "",
  });
  const [cotizando, setCotizando] = useState(false);
  const [errorCotizar, setErrorCotizar] = useState("");
  // Dirección confirmada desde la barra de búsqueda (Mapbox)
  const [direccionLabel, setDireccionLabel] = useState("");

  const [enviosPagados, setEnviosPagados] = useState<number | null>(null);

  const [showDeliveryPropioPanel, setShowDeliveryPropioPanel] = useState(false);
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [enviandoComprobante, setEnviandoComprobante] = useState(false);
  const [comprobanteSent, setComprobanteSent] = useState(false);
  const [comprobanteError, setComprobanteError] = useState("");

  const router = useRouter();

  async function enviarComprobante() {
    if (!envio?.delivery_propio) return;
    setEnviandoComprobante(true);
    setComprobanteError("");
    try {
      const form = new FormData();
      form.append("pymeEmail", envio.delivery_propio.email);
      form.append("pymeName", envio.nombre_pyme);
      form.append("clientName", envio.datos_destino?.nombre ?? "");
      form.append("clientPhone", envio.datos_destino?.telefono ?? "");
      form.append("address", `${envio.datos_destino?.calle ?? ""} ${envio.datos_destino?.numero ?? ""}`.trim());
      form.append("comuna", envio.datos_destino?.comuna ?? "");
      form.append("precio", envio.delivery_propio.precio.toString());
      form.append("envioId", id ?? "");
      if (comprobante) form.append("comprobante", comprobante);

      const res = await fetch("/api/delivery-propio", { method: "POST", body: form });
      if (!res.ok) throw new Error("Error al enviar");
      if (id) {
        await supabase.from("envios").update({ estado: "delivery_pendiente" }).eq("id", Number(id));
      }
      setComprobanteSent(true);
    } catch {
      setComprobanteError("No pudimos enviar el comprobante. Inténtalo de nuevo.");
    } finally {
      setEnviandoComprobante(false);
    }
  }

  async function elegir(courier: string) {
    setTransitioning(true);
    // Si es sucursal Starken, guardar la sucursal elegida en Supabase
    if (courier === "starken_sucursal" && selectedSucursal) {
      await supabase
        .from("envios")
        .update({ sucursal_retiro: selectedSucursal })
        .eq("id", Number(id));
    }
    router.push(`/confirmacion?id=${id}&courier=${courier}`);
  }

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    async function fetchEnvio() {
      const { data, error } = await supabase
        .from("envios").select("*").eq("id", Number(id)).single();
      if (error) { setLoading(false); return; }
      if (data.estado === "Creado ") { router.push(`/final?id=${id}`); return; }
      if (data.estado === "delivery_pendiente") { setComprobanteSent(true); }
      setEnvio(data);
      setLoading(false);
      if (data.cotizaciones && Object.keys(data.cotizaciones).length > 0) {
        setCardsVisible(true);
      }
      // Prueba social: cuántos envíos pagados tiene esta tienda
      if (data.pyme_id) {
        const { count } = await supabase
          .from("envios")
          .select("id", { count: "exact", head: true })
          .eq("pyme_id", data.pyme_id)
          .eq("pago_status", "pagado");
        setEnviosPagados(count ?? null);
      }
    }
    fetchEnvio();
  }, [id, router]);

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel("envios-updates")
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "envios", filter: `id=eq.${Number(id)}` },
        (payload) => {
          const newData = payload.new as EnvioType;
          if (newData.estado === "creado") { router.push(`/final?id=${id}`); return; }
          setEnvio(newData);
        }
      ).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [id, router]);

  async function cotizarEnvio() {
    if (!formCliente.nombre.trim() || !formCliente.comuna.trim() || !formCliente.calle.trim() || !formCliente.numero.trim()) {
      setErrorCotizar("Completa los campos obligatorios (*).");
      return;
    }
    if (envio?.ask_instagram && !formCliente.instagram.trim()) {
      setErrorCotizar("Ingresa tu usuario de Instagram para continuar.");
      return;
    }
    setErrorCotizar("");
    setCotizando(true);
    setCardsVisible(false);
    setSelectedCourier(null);
    setSelectedSucursal(null);
    // El input guarda solo los 8 dígitos; anteponemos el prefijo chileno.
    const telefonoFull = formCliente.telefono.trim() ? `+56 9 ${formCliente.telefono.trim()}` : "";
    try {
      const res = await fetch("/api/cotizar-envio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: Number(id),
          datos_destino: {
            nombre: formCliente.nombre.trim(),
            telefono: telefonoFull,
            comuna: formCliente.comuna.trim(),
            calle: formCliente.calle.trim(),
            numero: formCliente.numero.trim(),
            depto: formCliente.depto.trim(),
            instagram: formCliente.instagram.trim(),
          },
        }),
      });
      if (!res.ok) throw new Error("Error al cotizar");

      const { data: updated } = await supabase
        .from("envios")
        .select("cotizaciones")
        .eq("id", Number(id))
        .single();

      if (!updated?.cotizaciones || Object.keys(updated.cotizaciones).length === 0) {
        throw new Error("No se recibieron cotizaciones");
      }

      setEnvio((prev) => prev ? {
        ...prev,
        cotizaciones: updated.cotizaciones,
        datos_destino: {
          nombre: formCliente.nombre.trim(),
          telefono: formCliente.telefono.trim(),
          comuna: formCliente.comuna.trim(),
          calle: formCliente.calle.trim(),
          numero: formCliente.numero.trim(),
          depto: formCliente.depto.trim(),
          instagram: formCliente.instagram.trim(),
        },
      } : prev);

      setTimeout(() => setCardsVisible(true), 50);
    } catch {
      setErrorCotizar("No pudimos cotizar los couriers. Intenta de nuevo.");
    } finally {
      setCotizando(false);
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-[#E8E8E3] border-t-[#E8553D] rounded-full" />
      </div>
    );
  }

  if (!envio) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center p-6">
        <p className="text-[#5C5C57] text-center">Envío no encontrado.</p>
      </div>
    );
  }

  const cotizaciones = envio.cotizaciones ?? {};

  // Construir lista de couriers disponibles en orden definido, respetando los habilitados por la pyme
  const couriersPermitidos: string[] = (envio.couriers_habilitados?.length ?? 0) > 0
    ? envio.couriers_habilitados!
    : COURIER_ORDER;
  const is99Allowed = couriersPermitidos.includes("noventa9Minutos") || couriersPermitidos.includes("99minutos");
  const courierKeys = COURIER_ORDER.filter((k) => {
    const allowed = (k === "noventa9Minutos" || k === "99minutos") ? is99Allowed : couriersPermitidos.includes(k);
    return allowed && cotizaciones[k] && getPrice(cotizaciones[k]!) != null;
  });

  const dp = envio?.delivery_propio;
  const comunaCliente = (envio?.datos_destino?.comuna ?? "").toLowerCase().trim();
  const showDeliveryPropio = !!(dp?.enabled && dp.precio && COMUNAS_SANTIAGO.has(comunaCliente));

  // Si no hay couriers válidos ni delivery propio, mostrar el formulario de nuevo
  const mostrarFormulario = courierKeys.length === 0 && !showDeliveryPropio;

  // El más barato
  const cheapestKey = courierKeys.length > 0
    ? courierKeys.reduce((min, curr) => {
        const currPrice = getPrice(cotizaciones[curr]!) ?? Infinity;
        const minPrice = getPrice(cotizaciones[min]!) ?? Infinity;
        return currPrice < minPrice ? curr : min;
      })
    : null;

  // Puede continuar: tiene courier seleccionado, y si es sucursal también tiene sucursal
  const canContinue =
    selectedCourier !== null &&
    (selectedCourier !== "starken_sucursal" || selectedSucursal !== null);

  const sucursalesDisponibles =
    selectedCourier === "starken_sucursal"
      ? (cotizaciones["starken_sucursal"]?.sucursales ?? [])
      : [];

  // Si ya se envió comprobante, mostrar pantalla de confirmación permanente
  if (comprobanteSent && envio) {
    const dp = envio.delivery_propio;
    return (
      <div className="min-h-screen bg-[#FAFAF7]">
        <StoreHeader envio={envio} />
        <div className="max-w-md mx-auto px-4 py-6 pb-16 flex flex-col gap-4">
          <div className="bg-[#1A1A18] rounded-2xl overflow-hidden">
            <div className="px-6 py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center mx-auto mb-4">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-white font-bold text-xl mb-1">¡Comprobante enviado!</p>
              <p className="text-white/50 text-sm mt-1">
                {envio.nombre_pyme} coordinará contigo la entrega
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E8E8E3] shadow-sm px-5 py-4">
            <p className="text-xs font-bold text-[#9C9C95] uppercase tracking-wider mb-3">Tu pedido</p>
            {[
              { label: "Destinatario", value: envio.datos_destino?.nombre },
              { label: "Dirección", value: `${envio.datos_destino?.calle ?? ""} ${envio.datos_destino?.numero ?? ""}`.trim() },
              { label: "Comuna", value: envio.datos_destino?.comuna },
              { label: "Teléfono", value: envio.datos_destino?.telefono },
              { label: "Monto pagado", value: dp?.precio ? `$${dp.precio.toLocaleString("es-CL")}` : null },
            ].filter(r => r.value).map(({ label, value }) => (
              <div key={label} className="flex justify-between py-2.5 border-b border-[#F5F5F0] last:border-0">
                <span className="text-xs text-[#9C9C95]">{label}</span>
                <span className="text-xs font-semibold text-[#1A1A18] text-right max-w-[55%]">{value}</span>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-[#E8E8E3] shadow-sm px-5 py-4">
            <p className="text-xs font-bold text-[#9C9C95] uppercase tracking-wider mb-3">¿Qué sigue?</p>
            <div className="flex flex-col gap-3">
              {[
                { emoji: "📩", text: `${envio.nombre_pyme} revisará tu comprobante de pago` },
                { emoji: "📞", text: "Te contactarán para coordinar el horario de entrega" },
                { emoji: "📦", text: "Recibirás tu pedido en la dirección indicada" },
              ].map(({ emoji, text }) => (
                <div key={emoji} className="flex gap-3 items-start">
                  <div className="w-7 h-7 rounded-full bg-[#FFF0ED] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm">{emoji}</span>
                  </div>
                  <p className="text-sm text-[#5C5C57] leading-snug">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {dp?.telefono && (
            <div className="bg-[#FFF0ED] rounded-2xl border border-[#F5D5CE] px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#1A1A18]">¿Tienes dudas?</p>
                <p className="text-xs text-[#9C9C95] mt-0.5">Contacta a {envio.nombre_pyme}</p>
              </div>
              <a href={`tel:${dp.telefono}`} className="bg-[#E8553D] text-white text-sm font-bold px-4 py-2 rounded-xl no-underline">
                {dp.telefono}
              </a>
            </div>
          )}

          <p className="text-center text-[11px] text-[#9C9C95]">
            Powered by <span className="font-semibold text-[#5C5C57]">LinkDrop</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <StoreHeader envio={envio} enviosPagados={enviosPagados} />

      <div className="max-w-md mx-auto px-4 py-6 pb-16">

        {/* PRODUCTO — protagonista, visible desde que abre el link */}
        <ProductoHero envio={envio} />

        {/* FORMULARIO */}
        {mostrarFormulario && !cotizando && (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-[#E8E8E3] overflow-hidden">
              <div className="px-6 pt-6 pb-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#E8553D]">Paso 1 de 2</span>
                  <span className="flex-1 h-1 rounded-full bg-[#F0F0EB] overflow-hidden">
                    <span className="block h-full w-1/2 bg-[#E8553D] rounded-full" />
                  </span>
                </div>
                <h2 className="text-lg font-bold text-[#1A1A18]">Completa tus datos de envío</h2>
                <p className="text-sm text-[#9C9C95] mt-1">
                  {envio.nombre_pyme} necesita tu dirección para calcular el costo del envío.
                </p>
              </div>

              <div className="px-6 pb-6 mt-4 flex flex-col gap-4">
                {/* Buscar dirección — autocompletado (única fuente de la dirección) */}
                <div>
                  <label className="block text-sm font-semibold text-[#1A1A18] mb-1.5">
                    Tu dirección <span className="text-[#E8553D]">*</span>
                  </label>

                  {!direccionLabel ? (
                    <>
                      <MapboxAddressSearch
                        onSelect={(r) => {
                          setFormCliente((s) => ({
                            ...s,
                            comuna: r.comuna,
                            calle:  r.calle,
                            numero: r.numero,
                          }));
                          setDireccionLabel(r.label);
                          setErrorCotizar("");
                        }}
                        placeholder="Escribe tu calle y número…"
                      />
                      <p className="text-[11px] text-[#9C9C95] mt-1.5">
                        Empieza a escribir y selecciona tu dirección de la lista.
                      </p>
                    </>
                  ) : (
                    <div className="flex items-start gap-2.5 rounded-xl border-2 border-[#00A651] bg-[#E8F8EE] px-4 py-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#00A651] flex items-center justify-center mt-0.5">
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                          <polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[#1A1A18] leading-snug">{direccionLabel}</p>
                        <button
                          type="button"
                          onClick={() => {
                            setDireccionLabel("");
                            setFormCliente((s) => ({ ...s, comuna: "", calle: "", numero: "" }));
                          }}
                          className="text-xs font-semibold text-[#2D8A56] mt-1 hover:underline"
                        >
                          Cambiar dirección
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Número — solo si la dirección elegida no lo trae */}
                {direccionLabel && !formCliente.numero && (
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
                    <p className="text-[11px] text-[#9C9C95] mt-1.5">
                      No pudimos detectar el número de tu dirección, agrégalo aquí.
                    </p>
                  </div>
                )}

                {/* Comuna — respaldo si la dirección elegida no la trae (imprescindible para cotizar) */}
                {direccionLabel && !formCliente.comuna.trim() && (
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
                    <p className="text-[11px] text-[#9C9C95] mt-1.5">
                      No pudimos detectar tu comuna, escríbela para calcular el envío.
                    </p>
                  </div>
                )}

                {/* Detalle interior — opcional, el mapa no lo entrega (depto, torre, block, etc.) */}
                {direccionLabel && (
                  <div>
                    <label className="block text-sm font-semibold text-[#1A1A18] mb-1.5">
                      Depto, torre u oficina
                      <span className="text-[#9C9C95] font-normal ml-1 text-xs">Opcional</span>
                    </label>
                    <input
                      type="text"
                      value={formCliente.depto}
                      onChange={(e) => setFormCliente((s) => ({ ...s, depto: e.target.value }))}
                      placeholder="Ej: Torre B, depto 1007"
                      className="w-full border border-[#E8E8E3] rounded-xl px-4 py-3 text-sm text-[#1A1A18] bg-[#FAFAF7] outline-none transition-all focus:border-[#E8553D] focus:ring-2 focus:ring-[#E8553D]/10 placeholder:text-[#9C9C95]"
                    />
                    <p className="text-[11px] text-[#9C9C95] mt-1.5">
                      Agrega torre, block, depto o cualquier dato para encontrarte.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-[#1A1A18] mb-1.5">
                    Nombre completo <span className="text-[#E8553D]">*</span>
                  </label>
                  <input
                    type="text"
                    value={formCliente.nombre}
                    onChange={(e) => setFormCliente((s) => ({ ...s, nombre: e.target.value }))}
                    placeholder="Ej: María López"
                    className="w-full border border-[#E8E8E3] rounded-xl px-4 py-3 text-sm text-[#1A1A18] bg-[#FAFAF7] outline-none transition-all focus:border-[#E8553D] focus:ring-2 focus:ring-[#E8553D]/10 placeholder:text-[#9C9C95]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1A1A18] mb-1.5">
                    Teléfono
                    <span className="text-[#9C9C95] font-normal ml-1 text-xs">Para coordinar la entrega</span>
                  </label>
                  <div className="flex items-stretch border border-[#E8E8E3] rounded-xl bg-[#FAFAF7] overflow-hidden transition-all focus-within:border-[#E8553D] focus-within:ring-2 focus-within:ring-[#E8553D]/10">
                    <span className="flex items-center px-3 text-sm font-medium text-[#5C5C57] bg-[#F0F0EB] border-r border-[#E8E8E3] select-none">
                      +56 9
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={formCliente.telefono}
                      onChange={(e) => setFormCliente((s) => ({ ...s, telefono: e.target.value.replace(/\D/g, "").slice(0, 8) }))}
                      placeholder="1234 5678"
                      className="flex-1 min-w-0 px-4 py-3 text-sm text-[#1A1A18] bg-transparent outline-none placeholder:text-[#9C9C95]"
                    />
                  </div>
                </div>

                {envio.ask_instagram && (
                  <InstagramField
                    value={formCliente.instagram}
                    onChange={(v) => setFormCliente((s) => ({ ...s, instagram: v }))}
                  />
                )}

                {errorCotizar && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    {errorCotizar}
                  </p>
                )}

                <button
                  onClick={cotizarEnvio}
                  disabled={cotizando}
                  className="w-full bg-[#E8553D] text-white font-bold py-4 rounded-xl text-[15px] transition-all shadow-[0_4px_16px_rgba(232,85,61,0.3)] hover:shadow-[0_6px_20px_rgba(232,85,61,0.4)] hover:-translate-y-0.5 active:translate-y-0 disabled:bg-[#D1D1CC] disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Ver opciones de envío →
                </button>

                <p className="text-center text-xs text-[#9C9C95]">
                  Completa los campos marcados con <span className="text-[#E8553D]">*</span> para continuar
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-1.5 mt-5 text-[#9C9C95]">
              <LockClosedIcon className="w-3.5 h-3.5" />
              <span className="text-xs">Tus datos están protegidos</span>
            </div>
          </>
        )}

        {/* SKELETONS */}
        {cotizando && (
          <div className="mb-5">
            <p className="text-xs font-semibold text-[#9C9C95] uppercase tracking-wider px-1 mb-1">
              Buscando opciones de envío…
            </p>
            <p className="text-xs text-[#9C9C95] px-1 mb-4">Consultando couriers disponibles</p>
            <div className="flex flex-col gap-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        )}

        {/* CARDS COURIER */}
        {!mostrarFormulario && !cotizando && (
          <>
            {/* Destino confirmado */}
            <div className="bg-white rounded-2xl border border-[#E8E8E3] shadow-sm p-4 mb-5 flex items-start gap-3">
              <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-[#FAFAF7] border border-[#E8E8E3] flex items-center justify-center">
                <MapPinIcon className="w-5 h-5 text-[#E8553D]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#9C9C95] uppercase tracking-wider mb-0.5">Destino</p>
                <p className="font-semibold text-[#1A1A18] text-sm">{envio.datos_destino?.nombre}</p>
                <p className="text-[#5C5C57] text-sm leading-snug">
                  {envio.datos_destino?.calle || envio.datos_destino?.direccion}{" "}
                  {envio.datos_destino?.numero || envio.datos_destino?.number}
                  {envio.datos_destino?.depto ? `, ${envio.datos_destino.depto}` : ""},{" "}
                  {envio.datos_destino?.comuna}
                </p>
              </div>
              <button
                onClick={() => {
                  setEnvio((prev) => prev ? { ...prev, cotizaciones: undefined } : prev);
                  setCardsVisible(false);
                  setSelectedCourier(null);
                  setSelectedSucursal(null);
                }}
                className="flex-shrink-0 text-[#9C9C95] hover:text-[#1A1A18] transition-colors p-1"
                title="Editar dirección"
              >
                <PencilSquareIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Título sección */}
            <div className="px-1 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#E8553D]">Paso 2 de 2</span>
                <span className="flex-1 h-1 rounded-full bg-[#F0F0EB] overflow-hidden">
                  <span className="block h-full w-full bg-[#E8553D] rounded-full" />
                </span>
              </div>
              <h2 className="text-base font-bold text-[#1A1A18]">Elige cómo deseas recibir tu pedido</h2>
              <p className="text-xs text-[#9C9C95] mt-0.5">Opciones verificadas y aseguradas</p>
            </div>

            {/* Panel comprobante delivery propio */}
            {showDeliveryPropioPanel && dp && !comprobanteSent && (
              <div className="bg-white rounded-2xl border border-[#E8E8E3] shadow-sm overflow-hidden mb-4">
                <div className="px-4 py-4 border-b border-[#F0F0EB]">
                  <p className="font-bold text-[15px] text-[#1A1A18] mb-1">Datos para transferencia</p>
                  <p className="text-xs text-[#9C9C95]">Transfiere el monto y sube el comprobante</p>
                </div>
                <div className="px-4 py-4 flex flex-col gap-2">
                  {[
                    { label: "Monto", value: `$${dp.precio.toLocaleString("es-CL")}` },
                    { label: "Banco", value: dp.banco },
                    { label: "Cuenta", value: dp.cuenta },
                    { label: "Titular", value: dp.titular },
                    { label: "RUT", value: dp.rut },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center py-1 border-b border-[#F5F5F0] last:border-0">
                      <span className="text-xs font-semibold text-[#9C9C95] uppercase tracking-wide">{label}</span>
                      <span className="text-sm font-semibold text-[#1A1A18]">{value}</span>
                    </div>
                  ))}
                  {dp.telefono && (
                    <div className="mt-2 bg-[#F5F5F0] rounded-xl px-3 py-2 flex items-center gap-2">
                      <span className="text-xs text-[#5C5C57]">¿Dudas sobre tu pedido?</span>
                      <a href={`tel:${dp.telefono}`} className="text-xs font-bold text-[#E8553D]">{dp.telefono}</a>
                    </div>
                  )}
                </div>
                <div className="px-4 pb-4 flex flex-col gap-3">
                  <label className="block text-sm font-semibold text-[#1A1A18]">
                    Sube tu comprobante de pago
                  </label>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#E8E8E3] rounded-xl py-6 cursor-pointer hover:border-[#E8553D] transition-colors bg-[#FAFAF7]">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => setComprobante(e.target.files?.[0] ?? null)}
                    />
                    {comprobante ? (
                      <p className="text-sm font-semibold text-[#2D8A56]">✓ {comprobante.name}</p>
                    ) : (
                      <>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9C9C95" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                        <p className="text-xs text-[#9C9C95]">Foto o PDF del comprobante</p>
                      </>
                    )}
                  </label>
                  {comprobanteError && <p className="text-xs text-red-500">{comprobanteError}</p>}
                  <button
                    onClick={enviarComprobante}
                    disabled={enviandoComprobante}
                    className="w-full py-4 rounded-xl font-bold text-[15px] text-white transition-all disabled:opacity-50"
                    style={{ background: "#1A1A18" }}
                  >
                    {enviandoComprobante ? "Enviando..." : "Enviar comprobante →"}
                  </button>
                  <button
                    onClick={() => { setShowDeliveryPropioPanel(false); setSelectedCourier(null); }}
                    className="text-xs text-[#9C9C95] text-center"
                  >
                    ← Volver a elegir courier
                  </button>
                </div>
              </div>
            )}

            {/* Lista de couriers */}
            {!showDeliveryPropioPanel && !comprobanteSent && (
            <div className="bg-white rounded-2xl border border-[#E8E8E3] shadow-sm overflow-hidden">
              {courierKeys.map((key, index) => {
                const cot = cotizaciones[key]!;
                const cfg = COURIER_CONFIG[key] ?? { color: "#1A1A18", colorLight: "#F5F5F5", label: key };
                const isCheapest = key === cheapestKey;
                const isSelected = selectedCourier === key;
                const isLast = index === courierKeys.length - 1;
                const isSucursal = key === "starken_sucursal";

                return (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedCourier(key);
                      if (!isSucursal) setSelectedSucursal(null);
                    }}
                    className={`w-full text-left flex items-center gap-3 px-4 py-3.5 transition-all duration-500 ${
                      cardsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                    } ${!isLast ? "border-b border-[#F0F0EB]" : ""}`}
                    style={{
                      backgroundColor: isSelected ? cfg.colorLight : "transparent",
                      transitionDelay: cardsVisible ? `${index * 80}ms` : "0ms",
                    }}
                  >
                    {/* Radio */}
                    <div
                      className="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                      style={{
                        borderColor: isSelected ? cfg.color : "#D1D1CC",
                        backgroundColor: isSelected ? cfg.color : "transparent",
                      }}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>

                    {/* Barra de color */}
                    <div
                      className="flex-shrink-0 w-1 self-stretch rounded-full transition-all"
                      style={{ backgroundColor: cfg.color, opacity: isSelected ? 1 : 0.35 }}
                    />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[15px] text-[#1A1A18]">{cfg.label}</span>
                        {isCheapest && (
                          <span className="text-[10px] font-bold text-[#2D8A56] bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full">
                            Mejor precio
                          </span>
                        )}
                        {isSucursal && (
                          <span className="text-[10px] font-bold text-[#00A651] bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full">
                            Retiro en sucursal
                          </span>
                        )}
                        {(key === "noventa9Minutos" || key === "99minutos") && (
                          <span className="text-[10px] font-bold text-[#FF3B30] bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">
                            ⚡ Más rápido
                          </span>
                        )}
                        {key === "blueexpress" && (
                          <span className="text-[10px] font-bold text-[#0055B8] bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full">
                            {cot.tipo ?? cot.service ?? "Priority"}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#888] mt-0.5">
                        {isSucursal
                          ? "Retiras en la sucursal que elijas"
                          : (estimateArrival(getTiempo(cot)) ?? getTiempo(cot))}
                      </p>
                    </div>

                    {/* Precio */}
                    <div className="flex-shrink-0 text-right">
                      <span
                        className="font-bold text-base transition-all"
                        style={{ color: isSelected ? cfg.color : "#1A1A18" }}
                      >
                        ${(getPrice(cot) ?? 0).toLocaleString("es-CL")}
                      </span>
                    </div>
                  </button>
                );
              })}

              {/* Opción delivery propio al final */}
              {showDeliveryPropio && dp && (
                <button
                  onClick={() => { setSelectedCourier("delivery_propio"); setSelectedSucursal(null); }}
                  className="w-full text-left flex items-center gap-3 px-4 py-3.5 border-t border-[#F0F0EB] transition-all"
                  style={{ backgroundColor: selectedCourier === "delivery_propio" ? "#FFF0ED" : "transparent" }}
                >
                  <div className="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                    style={{ borderColor: selectedCourier === "delivery_propio" ? "#E8553D" : "#D1D1CC", backgroundColor: selectedCourier === "delivery_propio" ? "#E8553D" : "transparent" }}>
                    {selectedCourier === "delivery_propio" && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div className="flex-shrink-0 w-1 self-stretch rounded-full" style={{ backgroundColor: "#E8553D", opacity: selectedCourier === "delivery_propio" ? 1 : 0.35 }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[15px] text-[#1A1A18]">Delivery Propio</span>
                      <span className="text-[10px] font-bold text-[#E8553D] bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">Solo Santiago</span>
                    </div>
                    <p className="text-xs text-[#888] mt-0.5">Pago por transferencia</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className="font-bold text-base" style={{ color: selectedCourier === "delivery_propio" ? "#E8553D" : "#1A1A18" }}>
                      ${dp.precio.toLocaleString("es-CL")}
                    </span>
                  </div>
                </button>
              )}
            </div>
            )}

            {/* Selector de sucursales — aparece si eligió Starken Sucursal */}
            {selectedCourier === "starken_sucursal" && sucursalesDisponibles.length > 0 && (
              <SucursalSelector
                sucursales={sucursalesDisponibles}
                selected={selectedSucursal}
                onSelect={setSelectedSucursal}
              />
            )}

            {/* Espaciador para que la barra sticky no tape el último courier */}
            {selectedCourier && !showDeliveryPropioPanel && !comprobanteSent && (
              <div className="h-32" />
            )}
          </>
        )}

        <p className="text-center text-[11px] text-[#9C9C95] mt-8">
          Powered by <span className="font-semibold text-[#5C5C57]">LinkDrop</span>
        </p>
      </div>

      {/* ── Barra sticky: total producto + envío y continuar ── */}
      {!mostrarFormulario && !cotizando && selectedCourier && !showDeliveryPropioPanel && !comprobanteSent && (() => {
        const precioProducto = envio.producto_precio ?? 0;
        const isDP = selectedCourier === "delivery_propio";
        const hayProducto = precioProducto > 0 && !isDP; // delivery propio no pasa por Flow con el producto
        const precioEnvioSel = isDP
          ? (dp?.precio ?? 0)
          : (getPrice(cotizaciones[selectedCourier]!) ?? 0);
        const totalSel = (hayProducto ? precioProducto : 0) + precioEnvioSel;
        const ready = canContinue || isDP;
        const needsSucursal = selectedCourier === "starken_sucursal" && !selectedSucursal;
        return (
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E8E8E3] shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
            <div className="max-w-md mx-auto px-4 pt-3 pb-4">
              {/* Desglose */}
              <div className="flex items-end justify-between mb-2.5">
                {hayProducto ? (
                  <span className="text-xs text-[#5C5C57]">
                    Producto ${precioProducto.toLocaleString("es-CL")} <span className="text-[#D1D1CC]">·</span> Envío ${precioEnvioSel.toLocaleString("es-CL")}
                  </span>
                ) : (
                  <span className="text-xs text-[#5C5C57]">
                    {isDP ? "Delivery propio" : COURIER_CONFIG[selectedCourier]?.label ?? "Envío"}
                  </span>
                )}
                <div className="text-right">
                  <p className="text-[10px] text-[#9C9C95] leading-none mb-0.5">{hayProducto ? "Total" : "A pagar"}</p>
                  <p className="text-lg font-extrabold text-[#1A1A18] leading-none">${totalSel.toLocaleString("es-CL")}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  if (isDP) { setShowDeliveryPropioPanel(true); }
                  else if (canContinue) { elegir(selectedCourier); }
                }}
                disabled={(!isDP && !canContinue) || transitioning}
                className="w-full font-bold py-3.5 rounded-xl text-[15px] transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: ready ? "#1A1A18" : "#D1D1CC", color: "#fff" }}
              >
                {needsSucursal
                  ? "Selecciona una sucursal para continuar"
                  : isDP
                  ? "Continuar con Delivery Propio →"
                  : "Continuar al pago →"}
              </button>

              <div className="flex items-center justify-center gap-1.5 mt-2.5 text-[#9C9C95]">
                <LockClosedIcon className="w-3 h-3" />
                <span className="text-[11px]">Pago protegido · Procesado por FLOW</span>
              </div>
            </div>
          </div>
        );
      })()}

      {transitioning && (
        <div className="fixed inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="animate-spin h-10 w-10 border-4 border-[#E8E8E3] border-t-[#E8553D] rounded-full" />
        </div>
      )}
    </div>
  );
}
