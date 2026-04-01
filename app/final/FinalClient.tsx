"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { useSearchParams } from "next/navigation";
import {
  CheckCircleIcon,
  MapPinIcon,
  ClockIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentCheckIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/solid";

type EnvioType = {
  nombre_pyme: string;
  logo_pyme: string;
  datos_destino: {
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
  cotizaciones: {
    starken?: { price: number; tipo: string; tiempo: string };
    chilexpress?: { price: number; tipo: string; tiempo: string };
    blueexpress?: { price: number; tipo: string; tiempo: string };
    noventa9Minutos?: { price: number; tipo: string; tiempo: string };
  };
  estado?: string;
  courier?: string;
  tracking?: string;
  tracking_url?: string;
  link_publico?: string;
};

const COURIER_STYLES: Record<string, { color: string; label: string }> = {
  starken:          { color: "text-green-700", label: "Starken"      },
  chilexpress:      { color: "text-red-600",   label: "Chilexpress"  },
  blueexpress:      { color: "text-blue-700",  label: "Blue Express" },
  noventa9Minutos:  { color: "text-red-500",   label: "99 Minutos"   },
};

function LoadingFallback() {
  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center">
      <div className="animate-spin h-10 w-10 border-4 border-[#E8E8E3] border-t-[#E8553D] rounded-full" />
    </div>
  );
}

function StoreHeader({ nombre, logo }: { nombre: string; logo: string }) {
  return (
    <div className="bg-white border-b border-[#E8E8E3] px-6 py-8 text-center">
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo}
          alt={nombre}
          className="w-20 h-20 rounded-full object-cover mx-auto mb-4 border-2 border-[#E8E8E3] shadow-md"
        />
      ) : (
        <div className="w-20 h-20 rounded-full bg-[#E8553D] mx-auto mb-4 flex items-center justify-center shadow-md">
          <span className="text-white text-3xl font-bold">
            {nombre?.[0]?.toUpperCase() ?? "T"}
          </span>
        </div>
      )}
      <h1 className="text-2xl font-bold text-[#1A1A18]">{nombre}</h1>
      <p className="text-sm text-[#9C9C95] mt-1">Envío confirmado</p>
    </div>
  );
}

export default function FinalClient() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const courierParam = searchParams.get("courier");

  const [envio, setEnvio] = useState<EnvioType | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(true);
  const [copied, setCopied] = useState(false);

  // ===========================================================
  // CARGA INICIAL + POLLING
  // ===========================================================
  useEffect(() => {
    if (!id) return;

    let pollInterval: NodeJS.Timeout | null = null;
    let mounted = true;

    async function fetchEnvio() {
      const { data } = await supabase
        .from("envios")
        .select("*")
        .eq("id", Number(id))
        .single();

      if (!mounted) return;

      if (data) {
        setEnvio(data);

        const key = (data.courier || courierParam || "").toLowerCase() as "starken" | "chilexpress" | "blueexpress" | "noventa9Minutos";
        const cotizacion = key ? data.cotizaciones?.[key] : null;

        if (cotizacion) {
          // Datos suficientes para mostrar la UI principal
          setGenerating(false);
        }

        // Solo dejar de hacer polling cuando tracking_url esté disponible
        if (data.tracking_url) {
          if (pollInterval) clearInterval(pollInterval);
        }
      }

      setLoading(false);
    }

    // Primera carga
    fetchEnvio();

    // Polling cada 2 segundos hasta que los datos estén completos
    pollInterval = setInterval(fetchEnvio, 2000);

    // Timeout máximo de 30 segundos
    const maxTimeout = setTimeout(() => {
      if (mounted) {
        setGenerating(false);
        setLoading(false);
        if (pollInterval) clearInterval(pollInterval);
      }
    }, 30000);

    return () => {
      mounted = false;
      if (pollInterval) clearInterval(pollInterval);
      clearTimeout(maxTimeout);
    };
  }, [id, courierParam]);

  // ===========================================================
  // REALTIME
  // ===========================================================
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel("envios-final-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "envios",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          const newData = payload.new as EnvioType;
          setEnvio(newData);

          const key = (newData.courier || courierParam || "").toLowerCase() as "starken" | "chilexpress" | "blueexpress" | "noventa9Minutos";
          const cotizacion = key ? newData.cotizaciones?.[key] : null;
          if (cotizacion) {
            setGenerating(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, courierParam]);

  // ===========================================================
  // LOADING
  // ===========================================================
  if (loading) return <LoadingFallback />;

  // ===========================================================
  // ANIMACIÓN PROCESANDO
  // ===========================================================
  if (generating) {
    return (
      <div className="fixed inset-0 bg-[#FAFAF7] flex items-center justify-center">
        <div className="w-full max-w-sm text-center px-6">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-[#2D8A56]/10 flex items-center justify-center animate-pulse">
              <CheckCircleIcon className="w-12 h-12 text-[#2D8A56]" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-[#1A1A18]">Procesando tu envío…</h2>
          <p className="text-[#9C9C95] text-sm mt-2">Esto puede tardar unos segundos</p>
          <div className="w-full bg-[#E8E8E3] rounded-full h-1.5 mt-8 overflow-hidden">
            <div
              className="bg-[#E8553D] h-1.5 rounded-full"
              style={{ animation: "loadingbar 1.2s infinite" }}
            />
          </div>
          <style>{`
            @keyframes loadingbar {
              0%   { transform: translateX(-100%); width: 60%; }
              100% { transform: translateX(200%);  width: 60%; }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // ===========================================================
  // VALIDACIONES
  // ===========================================================
  if (!envio) {
    return <div className="p-10 text-center text-[#5C5C57]">No se pudo cargar la información del envío.</div>;
  }

  const courierKey = (envio.courier || courierParam || "").toLowerCase() as "starken" | "chilexpress" | "blueexpress" | "noventa9Minutos";
  const info = courierKey ? envio.cotizaciones[courierKey] : null;

  if (!info) {
    return (
      <div className="min-h-screen bg-[#FAFAF7]">
        <StoreHeader nombre={envio.nombre_pyme} logo={envio.logo_pyme} />
        <div className="max-w-md mx-auto px-4 py-10 text-center">
          <div className="w-16 h-16 rounded-full bg-[#E8553D]/10 flex items-center justify-center mx-auto mb-4">
            <div className="animate-spin h-8 w-8 border-4 border-[#E8E8E3] border-t-[#E8553D] rounded-full" />
          </div>
          <p className="text-[#1A1A18] font-bold text-lg">Procesando tu envío…</p>
          <p className="text-[#9C9C95] text-sm mt-2">Estamos generando tu guía de despacho. Esto puede tomar unos segundos.</p>
          <p className="text-[#9C9C95] text-xs mt-6">
            Si la página no se actualiza,{" "}
            <button onClick={() => window.location.reload()} className="text-[#E8553D] underline">
              recarga aquí
            </button>.
          </p>
        </div>
      </div>
    );
  }

  const style = COURIER_STYLES[courierKey] ?? { color: "text-[#1A1A18]", label: envio.courier ?? "" };

  // ===========================================================
  // COPIAR LINK (SAFARI SAFE)
  // ===========================================================
  function copyLink() {
    const text = envio!.tracking ?? envio!.tracking_url ?? "";

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); })
        .catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text: string) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      alert("No se pudo copiar. Copia el link manualmente.");
    }
    textarea.remove();
  }

  // ===========================================================
  // UI FINAL
  // ===========================================================
  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <StoreHeader nombre={envio.nombre_pyme} logo={envio.logo_pyme} />

      <div className="max-w-md mx-auto px-4 py-6 pb-16 flex flex-col gap-4">

        {/* Success banner */}
        <div className="bg-[#2D8A56]/10 border border-[#2D8A56]/20 rounded-2xl px-5 py-4 flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#2D8A56]/15 flex items-center justify-center mt-0.5">
            <CheckCircleIcon className="w-6 h-6 text-[#2D8A56]" />
          </div>
          <div>
            <p className="font-bold text-[#1A1A18] text-base">¡Tu envío está en camino!</p>
            <p className="text-[#5C5C57] text-sm mt-0.5">La guía fue generada correctamente.</p>
          </div>
        </div>

        {/* Card courier + tracking */}
        <div className="bg-white rounded-2xl border border-[#E8E8E3] shadow-sm overflow-hidden">
          {/* Courier info */}
          <div className="px-5 py-4 border-b border-[#E8E8E3] flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-[#9C9C95] uppercase tracking-wider mb-1">Courier</p>
              <p className={`font-bold text-xl ${style.color}`}>{style.label}</p>
              <p className="text-[#5C5C57] text-sm mt-0.5">{info.tipo}</p>
              <div className="flex items-center gap-1 text-[#9C9C95] text-sm mt-1.5">
                <ClockIcon className="w-4 h-4" />
                <span>Llega en {info.tiempo}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-[#1A1A18] text-2xl">${info.price.toLocaleString("es-CL")}</p>
            </div>
          </div>

          {/* Tracking */}
          <div className="px-5 py-4 border-b border-[#E8E8E3]">
            <p className="text-xs font-semibold text-[#9C9C95] uppercase tracking-wider mb-3">
              Seguimiento de tu envío
            </p>

            {envio.tracking_url ? (
              <div className="flex flex-col gap-3">
                {envio.tracking && (
                  <div className="flex items-center justify-between bg-[#FAFAF7] rounded-xl px-4 py-2.5 border border-[#E8E8E3]">
                    <div>
                      <p className="text-[10px] text-[#9C9C95] font-semibold uppercase tracking-wide mb-0.5">N° de guía</p>
                      <p className="font-mono font-bold text-[#1A1A18] text-sm">{envio.tracking}</p>
                    </div>
                    <button
                      onClick={copyLink}
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                        copied
                          ? "bg-[#2D8A56]/10 text-[#2D8A56] border-[#2D8A56]/30"
                          : "bg-white text-[#5C5C57] border-[#E8E8E3] hover:border-[#9C9C95]"
                      }`}
                    >
                      {copied ? (
                        <><ClipboardDocumentCheckIcon className="w-3.5 h-3.5" />Copiado</>
                      ) : (
                        <><ClipboardDocumentIcon className="w-3.5 h-3.5" />Copiar</>
                      )}
                    </button>
                  </div>
                )}
                <a
                  href={envio.tracking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-[#1A1A18] text-white font-bold py-4 rounded-xl text-[15px] hover:bg-[#2a2a26] active:scale-[0.99] transition-all shadow-[0_4px_14px_rgba(26,26,24,0.18)]"
                >
                  <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                  Ver estado de mi envío
                </a>
              </div>
            ) : (
              <div className="animate-pulse flex flex-col gap-3">
                <div className="flex items-center gap-3 bg-[#FAFAF7] rounded-xl px-4 py-3 border border-[#E8E8E3]">
                  <div className="w-4 h-4 rounded-full bg-[#E8E8E3]" />
                  <div className="flex-1">
                    <div className="h-3 bg-[#E8E8E3] rounded-full w-28 mb-1.5" />
                    <div className="h-2.5 bg-[#E8E8E3] rounded-full w-40" />
                  </div>
                </div>
                <div className="w-full h-12 bg-[#E8E8E3] rounded-xl" />
                <p className="text-center text-xs text-[#9C9C95]">Generando guía de despacho…</p>
              </div>
            )}
          </div>

          {/* Destinatario */}
          <div className="px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#FAFAF7] border border-[#E8E8E3] flex items-center justify-center mt-0.5">
                <MapPinIcon className="w-4 h-4 text-[#E8553D]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#9C9C95] uppercase tracking-wider mb-1">Destinatario</p>
                <p className="font-semibold text-[#1A1A18] text-sm">{envio.datos_destino.nombre}</p>
                <p className="text-[#5C5C57] text-sm leading-snug">
                  {envio.datos_destino.calle || envio.datos_destino.direccion} {envio.datos_destino.numero || envio.datos_destino.number}{envio.datos_destino.depto ? `, Depto ${envio.datos_destino.depto}` : ""}, {envio.datos_destino.comuna}
                </p>
                {envio.datos_destino.telefono && (
                  <p className="text-[#9C9C95] text-sm mt-0.5">{envio.datos_destino.telefono}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-[#9C9C95] mt-2">
          Powered by <span className="font-semibold text-[#5C5C57]">LinkDrop</span>
        </p>
      </div>
    </div>
  );
}
