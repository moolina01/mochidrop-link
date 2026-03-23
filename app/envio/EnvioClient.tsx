"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { useSearchParams } from "next/navigation";
import {
  MapPinIcon,
  ClockIcon,
  LockClosedIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";

type EnvioType = {
  nombre_pyme: string;
  logo_pyme: string;
  datos_destino?: {
    nombre: string;
    direccion: string;
    comuna: string;
    telefono?: string;
    number: string;
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

const COURIER_STYLES: Record<string, { color: string; border: string; label: string }> = {
  starken:     { color: "text-green-700",  border: "border-l-green-500",  label: "Starken"      },
  chilexpress: { color: "text-red-600",    border: "border-l-red-500",    label: "Chilexpress"  },
  blueexpress: { color: "text-blue-700",   border: "border-l-blue-500",   label: "Blue Express" },
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

export default function EnvioClient() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [envio, setEnvio] = useState<EnvioType | null>(null);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);

  const [formCliente, setFormCliente] = useState({
    nombre: "", telefono: "", comuna: "", direccion: "", numero: "",
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
    if (!formCliente.nombre.trim() || !formCliente.comuna.trim() || !formCliente.direccion.trim()) {
      setErrorCotizar("Completa los campos obligatorios (*).");
      return;
    }
    setErrorCotizar("");
    setCotizando(true);
    try {
      const res = await fetch("https://mochidrop-n8n.utdxt3.easypanel.host/webhook/cotizar-envio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: Number(id),
          datos_destino: {
            nombre: formCliente.nombre.trim(),
            telefono: formCliente.telefono.trim(),
            comuna: formCliente.comuna.trim(),
            direccion: formCliente.direccion.trim(),
            number: formCliente.numero.trim(),
          },
        }),
      });
      if (!res.ok) throw new Error("Error al cotizar");
      const data = await res.json();
      setEnvio((prev) => prev ? {
        ...prev,
        cotizaciones: data.cotizaciones,
        datos_destino: {
          nombre: formCliente.nombre.trim(),
          telefono: formCliente.telefono.trim(),
          comuna: formCliente.comuna.trim(),
          direccion: formCliente.direccion.trim(),
          number: formCliente.numero.trim(),
        },
      } : prev);
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

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <StoreHeader envio={envio} />

      <div className="max-w-md mx-auto px-4 py-6 pb-16">

        {mostrarFormulario ? (
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
                    <label className="block text-sm font-semibold text-[#1A1A18] mb-1.5">Número / Depto</label>
                    <input
                      type="text"
                      value={formCliente.numero}
                      onChange={(e) => setFormCliente((s) => ({ ...s, numero: e.target.value }))}
                      placeholder="Ej: 1234"
                      className="w-full border border-[#E8E8E3] rounded-xl px-4 py-3 text-sm text-[#1A1A18] bg-[#FAFAF7] outline-none transition-all focus:border-[#E8553D] focus:ring-2 focus:ring-[#E8553D]/10 placeholder:text-[#9C9C95]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1A1A18] mb-1.5">
                    Dirección <span className="text-[#E8553D]">*</span>
                  </label>
                  <input
                    type="text"
                    value={formCliente.direccion}
                    onChange={(e) => setFormCliente((s) => ({ ...s, direccion: e.target.value }))}
                    placeholder="Ej: Av. Providencia 1234"
                    className="w-full border border-[#E8E8E3] rounded-xl px-4 py-3 text-sm text-[#1A1A18] bg-[#FAFAF7] outline-none transition-all focus:border-[#E8553D] focus:ring-2 focus:ring-[#E8553D]/10 placeholder:text-[#9C9C95]"
                  />
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
                  {cotizando ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                      Cotizando mejores precios…
                    </>
                  ) : (
                    "Ver opciones de envío →"
                  )}
                </button>

                {!cotizando && (
                  <p className="text-center text-xs text-[#9C9C95]">
                    Completa los campos marcados con <span className="text-[#E8553D]">*</span> para continuar
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center gap-1.5 mt-5 text-[#9C9C95]">
              <LockClosedIcon className="w-3.5 h-3.5" />
              <span className="text-xs">Tus datos están protegidos</span>
            </div>
          </>
        ) : (
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
                  {envio.datos_destino?.direccion}{envio.datos_destino?.number ? ` ${envio.datos_destino.number}` : ""}, {envio.datos_destino?.comuna}
                </p>
              </div>
              <button
                onClick={() => setEnvio((prev) => prev ? { ...prev, cotizaciones: undefined } : prev)}
                className="flex-shrink-0 text-[#9C9C95] hover:text-[#1A1A18] transition-colors p-1"
                title="Editar dirección"
              >
                <PencilSquareIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Cards courier */}
            <div>
              <p className="text-xs font-semibold text-[#9C9C95] uppercase tracking-wider px-1 mb-3">
                Elige tu courier
              </p>
              <div className="flex flex-col gap-3">
                {(["starken", "chilexpress", "blueexpress"] as const).map((key) => {
                  const cot = cotizaciones[key];
                  if (!cot) return null;
                  const style = COURIER_STYLES[key];
                  const isCheapest = key === cheapestKey;
                  return (
                    <button
                      key={key}
                      onClick={() => elegir(key)}
                      className={`w-full bg-white border border-[#E8E8E3] border-l-4 ${style.border} rounded-2xl p-4 flex justify-between items-center shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all text-left`}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`font-bold text-lg ${style.color}`}>{style.label}</span>
                          {isCheapest && (
                            <span className="text-[10px] font-bold text-[#2D8A56] bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                              Mejor precio
                            </span>
                          )}
                        </div>
                        <p className="text-[#5C5C57] text-sm">{cot.tipo}</p>
                      </div>
                      <div className="text-right ml-4 flex-shrink-0">
                        <p className="font-bold text-[#1A1A18] text-xl">
                          ${cot.price.toLocaleString("es-CL")}
                        </p>
                        <div className="flex items-center gap-1 text-[#9C9C95] text-xs justify-end mt-0.5">
                          <ClockIcon className="w-3.5 h-3.5" />
                          <span>{cot.tiempo}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

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
