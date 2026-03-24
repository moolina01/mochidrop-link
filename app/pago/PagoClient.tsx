"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import {
  MapPinIcon,
  ClockIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  CreditCardIcon,
} from "@heroicons/react/24/solid";

type EnvioType = {
  nombre_pyme: string;
  logo_pyme: string;
  datos_destino: {
    nombre: string;
    direccion: string;
    comuna: string;
    number?: string;
    telefono?: string;
  };
  cotizaciones: {
    starken?: { price: number; tipo: string; tiempo: string };
    chilexpress?: { price: number; tipo: string; tiempo: string };
    blueexpress?: { price: number; tipo: string; tiempo: string };
  };
  estado?: string;
  pago_status?: string;
};

const COURIER_STYLES: Record<string, { color: string; label: string }> = {
  starken:     { color: "text-green-700", label: "Starken"      },
  chilexpress: { color: "text-red-600",   label: "Chilexpress"  },
  blueexpress: { color: "text-blue-700",  label: "Blue Express" },
};

function LoadingFallback() {
  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center">
      <div className="animate-spin h-10 w-10 border-4 border-[#E8E8E3] border-t-[#E8553D] rounded-full" />
    </div>
  );
}

export default function PagoClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const id      = searchParams.get("id");
  const courier = searchParams.get("courier");
  const error   = searchParams.get("error");

  const [envio,   setEnvio]   = useState<EnvioType | null>(null);
  const [loading, setLoading] = useState(true);
  const [email,   setEmail]   = useState("");
  const [paying,  setPaying]  = useState(false);
  const [payError, setPayError] = useState<string | null>(
    error === "rejected" ? "El pago fue rechazado. Intenta de nuevo." : null
  );

  useEffect(() => {
    if (!id) return;
    async function load() {
      const { data } = await supabase
        .from("envios")
        .select("*")
        .eq("id", Number(id))
        .single();

      setEnvio(data as EnvioType);
      setLoading(false);

      if (data?.estado === "Creado " || data?.pago_status === "pagado") {
        router.push(`/final?id=${id}`);
      }
    }
    load();
  }, [id, router]);

  if (loading) return <LoadingFallback />;
  if (!envio)  return <div className="p-10 text-center text-[#5C5C57]">Envío no encontrado.</div>;
  if (!courier) return <div className="p-10 text-center text-[#5C5C57]">No se seleccionó courier.</div>;

  const info  = envio.cotizaciones[courier as "starken" | "chilexpress" | "blueexpress"];
  if (!info) return <div className="p-10 text-center text-[#5C5C57]">Courier no válido.</div>;

  const style = COURIER_STYLES[courier] ?? { color: "text-[#1A1A18]", label: courier };

  async function handlePagar() {
    if (!email.trim()) {
      setPayError("Ingresa tu email para continuar.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setPayError("Ingresa un email válido.");
      return;
    }

    setPaying(true);
    setPayError(null);

    try {
      const res = await fetch("/api/flow/create-order", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          envioId: id,
          amount:  info!.price,
          email:   email.trim(),
          courier,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setPayError(data.error ?? "Error al crear la orden de pago.");
        setPaying(false);
        return;
      }

      // Redirigir al checkout de Flow
      window.location.href = `${data.url}?token=${data.token}`;
    } catch {
      setPayError("Error de conexión. Intenta de nuevo.");
      setPaying(false);
    }
  }

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
        <p className="text-sm text-[#9C9C95] mt-1">Completa tu pago</p>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 pb-16 flex flex-col gap-4">

        {/* Card resumen */}
        <div className="bg-white rounded-2xl border border-[#E8E8E3] shadow-sm overflow-hidden">
          {/* Courier */}
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
            <p className="font-bold text-[#1A1A18] text-2xl">${info.price.toLocaleString("es-CL")}</p>
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

        {/* Email input */}
        <div className="bg-white rounded-2xl border border-[#E8E8E3] shadow-sm px-5 py-4">
          <label className="block text-xs font-semibold text-[#9C9C95] uppercase tracking-wider mb-2">
            Tu email <span className="text-[#E8553D]">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setPayError(null); }}
            placeholder="nombre@ejemplo.com"
            className="w-full rounded-xl border border-[#E8E8E3] px-4 py-3 text-sm text-[#1A1A18] placeholder:text-[#9C9C95] focus:outline-none focus:border-[#E8553D] focus:ring-2 focus:ring-[#E8553D]/10 transition-all"
          />
          <p className="text-[11px] text-[#9C9C95] mt-1.5">Para enviarte el comprobante de pago</p>
        </div>

        {/* Error */}
        {payError && (
          <p className="text-sm text-red-600 text-center font-medium">{payError}</p>
        )}

        {/* Botón de pago */}
        <div className="flex flex-col gap-3 mt-1">
          <button
            onClick={handlePagar}
            disabled={paying}
            className="w-full bg-[#E8553D] text-white font-bold py-4 rounded-xl text-base transition-all shadow-[0_4px_16px_rgba(232,85,61,0.35)] hover:shadow-[0_6px_20px_rgba(232,85,61,0.45)] hover:-translate-y-0.5 active:translate-y-0 disabled:bg-[#D1D1CC] disabled:shadow-none disabled:translate-y-0 flex items-center justify-center gap-2"
          >
            {paying ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                Procesando pago…
              </>
            ) : (
              <>
                <CreditCardIcon className="w-5 h-5" />
                {`Pagar $${info.price.toLocaleString("es-CL")} con tarjeta →`}
              </>
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

        <p className="text-center text-[11px] text-[#9C9C95] mt-2">
          Powered by <span className="font-semibold text-[#5C5C57]">LinkDrop</span>
        </p>
      </div>
    </div>
  );
}
