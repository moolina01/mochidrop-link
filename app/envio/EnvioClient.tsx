"use client";

import { useEffect, useState } from "react";
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
};

// ─── Helpers de cotización ────────────────────────────────────────────────────

function getPrice(cot: CotizacionItem): number | null {
  return cot.price ?? cot.raw?.totalPrice ?? null;
}

function getTiempo(cot: CotizacionItem): string | undefined {
  return cot.tiempo ?? cot.raw?.deliveryEstimate;
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

function StoreHeader({ envio }: { envio: EnvioType }) {
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

export default function EnvioClient() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

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

  const router = useRouter();

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
      setEnvio(data);
      setLoading(false);
      if (data.cotizaciones && Object.keys(data.cotizaciones).length > 0) {
        setCardsVisible(true);
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
    try {
      const res = await fetch("/api/cotizar-envio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: Number(id),
          datos_destino: {
            nombre: formCliente.nombre.trim(),
            telefono: formCliente.telefono.trim(),
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

  // Construir lista de couriers disponibles en orden definido
  const courierKeys = COURIER_ORDER.filter((k) => cotizaciones[k] && getPrice(cotizaciones[k]!) != null);

  // Si no hay couriers válidos, mostrar el formulario de nuevo
  const mostrarFormulario = courierKeys.length === 0;

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

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <StoreHeader envio={envio} />

      <div className="max-w-md mx-auto px-4 py-6 pb-16">

        {/* FORMULARIO */}
        {mostrarFormulario && !cotizando && (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-[#E8E8E3] overflow-hidden">
              <div className="px-6 pt-6 pb-2">
                <h2 className="text-lg font-bold text-[#1A1A18]">Completa tus datos de envío</h2>
                <p className="text-sm text-[#9C9C95] mt-1">
                  {envio.nombre_pyme} necesita tu dirección para calcular el costo del envío.
                </p>
              </div>

              <div className="px-6 pb-6 mt-4 flex flex-col gap-4">
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
                  <input
                    type="tel"
                    value={formCliente.telefono}
                    onChange={(e) => setFormCliente((s) => ({ ...s, telefono: e.target.value }))}
                    placeholder="+56 9 1234 5678"
                    className="w-full border border-[#E8E8E3] rounded-xl px-4 py-3 text-sm text-[#1A1A18] bg-[#FAFAF7] outline-none transition-all focus:border-[#E8553D] focus:ring-2 focus:ring-[#E8553D]/10 placeholder:text-[#9C9C95]"
                  />
                </div>

                {envio.ask_instagram && (
                  <InstagramField
                    value={formCliente.instagram}
                    onChange={(v) => setFormCliente((s) => ({ ...s, instagram: v }))}
                  />
                )}

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
                    <label className="block text-sm font-semibold text-[#1A1A18] mb-1.5">Depto / Oficina</label>
                    <input
                      type="text"
                      value={formCliente.depto}
                      onChange={(e) => setFormCliente((s) => ({ ...s, depto: e.target.value }))}
                      placeholder="Ej: 1007"
                      className="w-full border border-[#E8E8E3] rounded-xl px-4 py-3 text-sm text-[#1A1A18] bg-[#FAFAF7] outline-none transition-all focus:border-[#E8553D] focus:ring-2 focus:ring-[#E8553D]/10 placeholder:text-[#9C9C95]"
                    />
                  </div>
                </div>

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
                  {envio.datos_destino?.depto ? `, Depto ${envio.datos_destino.depto}` : ""},{" "}
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
              <h2 className="text-base font-bold text-[#1A1A18]">Elige cómo deseas recibir tu pedido</h2>
              <p className="text-xs text-[#9C9C95] mt-0.5">Opciones verificadas y aseguradas</p>
            </div>

            {/* Lista de couriers */}
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
                        {isSucursal ? "Retiras en la sucursal que elijas" : getTiempo(cot)}
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
            </div>

            {/* Selector de sucursales — aparece si eligió Starken Sucursal */}
            {selectedCourier === "starken_sucursal" && sucursalesDisponibles.length > 0 && (
              <SucursalSelector
                sucursales={sucursalesDisponibles}
                selected={selectedSucursal}
                onSelect={setSelectedSucursal}
              />
            )}

            {/* Botón continuar */}
            {selectedCourier && (
              <button
                onClick={() => canContinue && elegir(selectedCourier)}
                disabled={!canContinue || transitioning}
                className="w-full font-bold py-4 rounded-xl text-[15px] mt-4 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
                style={{
                  background: canContinue ? "#1A1A18" : "#D1D1CC",
                  color: "#fff",
                }}
              >
                {selectedCourier === "starken_sucursal" && !selectedSucursal
                  ? "Selecciona una sucursal para continuar"
                  : `Continuar con ${COURIER_CONFIG[selectedCourier]?.label ?? selectedCourier} →`}
              </button>
            )}

            <div className="flex items-center justify-center gap-1.5 mt-6 text-[#9C9C95]">
              <LockClosedIcon className="w-3.5 h-3.5" />
              <span className="text-xs">Pago seguro con FLOW</span>
            </div>
          </>
        )}

        <p className="text-center text-[11px] text-[#9C9C95] mt-8">
          Powered by <span className="font-semibold text-[#5C5C57]">LinkDrop</span>
        </p>
      </div>

      {transitioning && (
        <div className="fixed inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="animate-spin h-10 w-10 border-4 border-[#E8E8E3] border-t-[#E8553D] rounded-full" />
        </div>
      )}
    </div>
  );
}
