"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { MapPinIcon, ClockIcon, LockClosedIcon, ShieldCheckIcon } from "@heroicons/react/24/solid";

type EnvioType = {
  nombre_pyme: string;
  logo_pyme: string;
  datos_destino: {
    nombre: string;
    direccion: string;
    comuna: string;
    telefono?: string;
    number: string;
  };
  cotizaciones: {
    starken?: { price: number; tipo: string; tiempo: string };
    chilexpress?: { price: number; tipo: string; tiempo: string };
    blueexpress?: { price: number; tipo: string; tiempo: string };
  };
};

const COURIER_STYLES: Record<string, { color: string; label: string }> = {
  starken:     { color: "text-green-700", label: "Starken"      },
  chilexpress: { color: "text-red-600",   label: "Chilexpress"  },
  blueexpress: { color: "text-blue-700",  label: "Blue Express" },
};

const COURIER_LOGOS: Record<string, string> = {
  starken:     "/unnamed.jpg",
  chilexpress: "/images-3.png",
  blueexpress: "/images-4.png",
};

function LoadingFallback() {
  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center">
      <div className="animate-spin h-10 w-10 border-4 border-[#E8E8E3] border-t-[#E8553D] rounded-full" />
    </div>
  );
}

export default function ConfirmacionClient() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const courier = searchParams.get("courier");

  const [envio, setEnvio] = useState<EnvioType | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const router = useRouter();

  async function confirmarEnvio() {
    setPaying(true);
    router.push(`/pago?id=${id}&courier=${courier}`);
  }

  useEffect(() => {
    if (!id) return;
    async function load() {
      const { data } = await supabase
        .from("envios").select("*").eq("id", Number(id)).single();
      setEnvio(data);
      setLoading(false);
      if (data?.estado === "Creado ") router.push(`/final?id=${id}`);
    }
    load();
  }, [id, router]);

  if (loading) return <LoadingFallback />;
  if (!envio) return <div className="p-10 text-center text-[#5C5C57]">Envío no encontrado.</div>;
  if (!courier) return <div className="p-10 text-center text-[#5C5C57]">No se seleccionó courier.</div>;

  const info = envio.cotizaciones[courier as "starken" | "chilexpress" | "blueexpress"];
  if (!info) return <div className="p-10 text-center text-[#5C5C57]">Courier no válido.</div>;

  const style = COURIER_STYLES[courier] ?? { color: "text-[#1A1A18]", label: courier };

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      {/* Header tienda */}
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
        <p className="text-sm text-[#9C9C95] mt-1">Confirma tu envío</p>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 pb-16 flex flex-col gap-4">

        {/* Título */}
        <div className="text-center pt-2 pb-1">
          <p className="text-xs font-semibold text-[#9C9C95] uppercase tracking-wider">Revisa los datos antes de pagar</p>
        </div>

        {/* Card courier */}
        <div className="bg-white rounded-2xl border border-[#E8E8E3] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E8E8E3] flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-[#9C9C95] uppercase tracking-wider mb-1">Courier seleccionado</p>
              <p className={`font-bold text-xl ${style.color}`}>{style.label}</p>
              <p className="text-[#5C5C57] text-sm mt-0.5">{info.tipo}</p>
              <div className="flex items-center gap-1 text-[#9C9C95] text-sm mt-1.5">
                <ClockIcon className="w-4 h-4" />
                <span>Llega en {info.tiempo}</span>
              </div>
            </div>
            <div className="text-right flex flex-col items-end gap-2">
              <p className="font-bold text-[#1A1A18] text-2xl">${info.price.toLocaleString("es-CL")}</p>
              {COURIER_LOGOS[courier] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={COURIER_LOGOS[courier]} className="w-14 h-auto object-contain opacity-80" alt={style.label} />
              )}
            </div>
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
                  {envio.datos_destino.direccion}
                  {envio.datos_destino.number ? `, ${envio.datos_destino.number}` : ""}
                  {", "}{envio.datos_destino.comuna}
                </p>
                {envio.datos_destino.telefono && (
                  <p className="text-[#9C9C95] text-sm mt-0.5">{envio.datos_destino.telefono}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Botón de pago */}
        <div className="flex flex-col gap-3 mt-2">
          <button
            onClick={confirmarEnvio}
            disabled={paying}
            className="w-full bg-[#E8553D] text-white font-bold py-4 rounded-xl text-base transition-all shadow-[0_4px_16px_rgba(232,85,61,0.35)] hover:shadow-[0_6px_20px_rgba(232,85,61,0.45)] hover:-translate-y-0.5 active:translate-y-0 disabled:bg-[#D1D1CC] disabled:shadow-none flex items-center justify-center gap-2"
          >
            {paying ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                Redirigiendo al pago…
              </>
            ) : (
              `Pagar $${info.price.toLocaleString("es-CL")} →`
            )}
          </button>

          {/* Trust */}
          <div className="flex items-center justify-center gap-3 text-[#9C9C95]">
            <div className="flex items-center gap-1">
              <LockClosedIcon className="w-3.5 h-3.5" />
              <span className="text-xs">Pago seguro</span>
            </div>
            <span className="text-[#E8E8E3]">·</span>
            <div className="flex items-center gap-1">
              <ShieldCheckIcon className="w-3.5 h-3.5" />
              <span className="text-xs">Procesado por FLOW</span>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-[#9C9C95] mt-4">
          Powered by <span className="font-semibold text-[#5C5C57]">LinkDrop</span>
        </p>
      </div>

      {paying && <LoadingFallback />}
    </div>
  );
}
