"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { MapPinIcon, LockClosedIcon, ShieldCheckIcon, CreditCardIcon } from "@heroicons/react/24/solid";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type SucursalType = {
  branch_code: number;
  reference: string;
  address: string;
  city: string;
  locality?: string;
};

type CotizacionItem = {
  price?: number | null;
  tipo?: string;
  tiempo?: string;
  service?: string;
  carrier?: string;
  raw?: {
    totalPrice?: number | null;
    deliveryEstimate?: string;
  };
};

function getPrice(cot: CotizacionItem): number {
  return cot.price ?? cot.raw?.totalPrice ?? 0;
}

function getTiempo(cot: CotizacionItem): string | undefined {
  return cot.tiempo ?? cot.raw?.deliveryEstimate;
}

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
    direccion?: string;
    number?: string;
  };
  cotizaciones: Record<string, CotizacionItem>;
  sucursal_retiro?: SucursalType | null;
};

// ─── Config couriers ──────────────────────────────────────────────────────────

const COURIER_CONFIG: Record<string, { color: string; colorLight: string; label: string }> = {
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
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function TruckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9 1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"
        fill="white"
      />
    </svg>
  );
}

function LoadingFallback() {
  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center">
      <div className="animate-spin h-10 w-10 border-4 border-[#E8E8E3] border-t-[#E8553D] rounded-full" />
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ConfirmacionClient() {
  const searchParams = useSearchParams();
  const id      = searchParams.get("id");
  const courier = searchParams.get("courier");
  const error   = searchParams.get("error");

  const [envio,    setEnvio]    = useState<EnvioType | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [email,    setEmail]    = useState("");
  const [paying,   setPaying]   = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const router = useRouter();

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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          envioId: id,
          amount:  getPrice(info),
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

      window.location.href = `${data.url}?token=${data.token}`;
    } catch {
      setPayError("Error de conexión. Intenta de nuevo.");
      setPaying(false);
    }
  }

  useEffect(() => {
    if (!id) return;
    async function load() {
      const { data } = await supabase
        .from("envios").select("*").eq("id", Number(id)).single();
      setEnvio(data);
      setLoading(false);
      if (data?.estado === "Creado ") router.push(`/final?id=${id}`);
      if (error === "rejected") {
        setPayError("El pago fue rechazado. Intenta de nuevo.");
      }
    }
    load();
  }, [id, error, router]);

  if (loading) return <LoadingFallback />;
  if (!envio)  return <div className="p-10 text-center text-[#5C5C57]">Envío no encontrado.</div>;
  if (!courier) return <div className="p-10 text-center text-[#5C5C57]">No se seleccionó courier.</div>;

  const info = envio.cotizaciones[courier];
  if (!info) return <div className="p-10 text-center text-[#5C5C57]">Courier no válido.</div>;

  const cfg = COURIER_CONFIG[courier] ?? { color: "#1A1A18", colorLight: "#F5F5F5", label: courier };
  const isSucursal = courier === "starken_sucursal";
  const sucursal = isSucursal ? envio.sucursal_retiro : null;

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
        <p className="text-sm text-[#9C9C95] mt-1">Confirma y paga tu envío</p>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 pb-16 flex flex-col gap-4">

        {/* Card de confirmación */}
        <div className="bg-white rounded-2xl border border-[#E8E8E3] shadow-sm overflow-hidden">

          {/* Sección 1 — Courier */}
          <div className="px-5 py-5 border-b border-[#E8E8E3]">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9C9C95] mb-3">
              Resumen de envío
            </p>
            <div className="flex items-center gap-3">
              <div
                className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: cfg.color }}
              >
                <TruckIcon />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base text-[#1A1A18]">{cfg.label}</p>
                <p className="text-sm text-[#5C5C57]">
                  {isSucursal ? "Retiro en sucursal" : `Llega en ${getTiempo(info)}`}
                </p>
              </div>
              <p className="font-bold text-2xl text-[#1A1A18] flex-shrink-0">
                ${getPrice(info).toLocaleString("es-CL")}
              </p>
            </div>
          </div>

          {/* Sección 2 — Destino o Sucursal */}
          <div className="px-5 py-4 border-b border-[#E8E8E3]">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9C9C95] mb-3">
              {isSucursal ? "Sucursal de retiro" : "Destinatario"}
            </p>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#FAFAF7] border border-[#E8E8E3] flex items-center justify-center mt-0.5">
                <MapPinIcon className="w-4 h-4 text-[#E8553D]" />
              </div>
              {isSucursal && sucursal ? (
                <div>
                  <p className="font-semibold text-sm text-[#1A1A18]">Starken — {sucursal.address}</p>
                  <p className="text-sm text-[#5C5C57] leading-snug">
                    {sucursal.city}{sucursal.locality && sucursal.locality !== sucursal.city ? `, ${sucursal.locality}` : ""}
                  </p>
                  <p className="text-xs text-[#9C9C95] mt-1">
                    Para ti: {envio.datos_destino.nombre}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-semibold text-sm text-[#1A1A18]">{envio.datos_destino.nombre}</p>
                  <p className="text-sm text-[#5C5C57] leading-snug">
                    {envio.datos_destino.calle || envio.datos_destino.direccion}{" "}
                    {envio.datos_destino.numero || envio.datos_destino.number}
                    {envio.datos_destino.depto ? `, Depto ${envio.datos_destino.depto}` : ""},{" "}
                    {envio.datos_destino.comuna}
                  </p>
                  {envio.datos_destino.telefono && (
                    <p className="text-sm text-[#9C9C95] mt-0.5">{envio.datos_destino.telefono}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sección 3 — Total */}
          <div className="px-5 py-4 bg-[#FAFAF7] flex items-center justify-between">
            <p className="text-sm text-[#5C5C57]">Total a pagar</p>
            <p className="font-bold text-xl text-[#1A1A18]">${getPrice(info).toLocaleString("es-CL")}</p>
          </div>
        </div>

        {/* Email para comprobante */}
        <div className="bg-white rounded-2xl border border-[#E8E8E3] shadow-sm px-5 py-4">
          <label className="block text-xs font-semibold text-[#9C9C95] uppercase tracking-wider mb-2">
            Tu email <span className="text-[#E8553D]">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setPayError(null); }}
            placeholder="nombre@ejemplo.com"
            className="w-full rounded-xl border border-[#E8E8E3] px-4 py-3 text-sm text-[#1A1A18] bg-[#FAFAF7] placeholder:text-[#9C9C95] focus:outline-none focus:border-[#E8553D] focus:ring-2 focus:ring-[#E8553D]/10 transition-all"
          />
          <p className="text-[11px] text-[#9C9C95] mt-1.5">Para enviarte el comprobante de pago</p>
        </div>

        {/* Error de pago */}
        {payError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center font-medium">
            {payError}
          </p>
        )}

        {/* Botón de pago */}
        <div className="flex flex-col gap-3 mt-2">
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
                {`Pagar $${getPrice(info).toLocaleString("es-CL")} con tarjeta →`}
              </>
            )}
          </button>

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
