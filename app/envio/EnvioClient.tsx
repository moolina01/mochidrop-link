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
    // Retrocompatibilidad
    direccion?: string;
    number?: string;
  };
  cotizaciones?: {
    starken?: { price: number; tipo: string; tiempo: string };
    chilexpress?: { price: number; tipo: string; tiempo: string };
    blueexpress?: { price: number; tipo: string; tiempo: string };
  };
  estado?: string;
  courier?: string;
  tracking?: string;
  tracking_url?: string;
};

const COURIER_CONFIG: Record<
  string,
  {
    color: string;
    colorLight: string;
    label: string;
  }
> = {
  starken: {
    color: "#00A651",
    colorLight: "#E8F8EE",
    label: "Starken",
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
};

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

export default function EnvioClient() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [envio, setEnvio] = useState<EnvioType | null>(null);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [cardsVisible, setCardsVisible] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState<string | null>(null);

  const [formCliente, setFormCliente] = useState({
    nombre: "", telefono: "", comuna: "", calle: "", numero: "", depto: "",
  });
  const [cotizando, setCotizando] = useState(false);
  const [errorCotizar, setErrorCotizar] = useState("");

  const router = useRouter();

  async function elegir(courier: string) {
    setTransitioning(true);
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
    setErrorCotizar("");
    setCotizando(true);
    setCardsVisible(false);
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
        },
      } : prev);

      setTimeout(() => setCardsVisible(true), 50);
    } catch {
      setErrorCotizar("No pudimos cotizar los couriers. Intenta de nuevo.");
    } finally {
      setCotizando(false);
    }
  }

  const mostrarFormulario = !envio?.cotizaciones || Object.keys(envio.cotizaciones).length === 0;

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
  const entries = (Object.entries(cotizaciones) as [string, { price: number; tipo: string; tiempo: string }][]).filter(([, v]) => v);
  const cheapestKey = entries.length > 0
    ? entries.reduce((min, curr) => curr[1].price < min[1].price ? curr : min)[0]
    : null;

  const courierKeys = (["starken", "chilexpress", "blueexpress"] as const).filter(k => cotizaciones[k]);

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

        {/* SKELETONS — mientras cotiza */}
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
                  {envio.datos_destino?.calle || envio.datos_destino?.direccion} {envio.datos_destino?.numero || envio.datos_destino?.number}{envio.datos_destino?.depto ? `, Depto ${envio.datos_destino.depto}` : ""}, {envio.datos_destino?.comuna}
                </p>
              </div>
              <button
                onClick={() => {
                  setEnvio((prev) => prev ? { ...prev, cotizaciones: undefined } : prev);
                  setCardsVisible(false);
                  setSelectedCourier(null);
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

            {/* Lista unificada de couriers */}
            <div className="bg-white rounded-2xl border border-[#E8E8E3] shadow-sm overflow-hidden">
              {courierKeys.map((key, index) => {
                const cot = cotizaciones[key]!;
                const cfg = COURIER_CONFIG[key];
                const isCheapest = key === cheapestKey;
                const isSelected = selectedCourier === key;
                const isLast = index === courierKeys.length - 1;

                return (
                  <button
                    key={key}
                    onClick={() => setSelectedCourier(key)}
                    className={`w-full text-left flex items-center gap-3 px-4 py-3.5 transition-all duration-500 ${
                      cardsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                    } ${!isLast ? "border-b border-[#F0F0EB]" : ""}`}
                    style={{
                      backgroundColor: isSelected ? cfg.colorLight : "transparent",
                      transitionDelay: cardsVisible ? `${index * 80}ms` : "0ms",
                    }}
                  >
                    {/* Radio button */}
                    <div
                      className="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                      style={{
                        borderColor: isSelected ? cfg.color : "#D1D1CC",
                        backgroundColor: isSelected ? cfg.color : "transparent",
                      }}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>

                    {/* Barra vertical de color */}
                    <div
                      className="flex-shrink-0 w-1 self-stretch rounded-full transition-all"
                      style={{
                        backgroundColor: cfg.color,
                        opacity: isSelected ? 1 : 0.35,
                      }}
                    />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[15px] text-[#1A1A18]">{cfg.label}</span>
                        {isCheapest && (
                          <span className="text-[10px] font-bold text-[#2D8A56] bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full">
                            Mejor precio
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#888] mt-0.5">{cot.tiempo}</p>
                    </div>

                    {/* Precio */}
                    <div className="flex-shrink-0 text-right">
                      <span
                        className="font-bold text-base transition-all"
                        style={{ color: isSelected ? cfg.color : "#1A1A18" }}
                      >
                        ${cot.price.toLocaleString("es-CL")}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Botón continuar — aparece solo cuando hay selección */}
            {selectedCourier && (
              <button
                onClick={() => elegir(selectedCourier)}
                disabled={transitioning}
                className="w-full bg-[#1A1A18] text-white font-bold py-4 rounded-xl text-[15px] mt-4 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
              >
                Continuar con {COURIER_CONFIG[selectedCourier].label} →
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
