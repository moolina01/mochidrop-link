"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

type EnvioType = {
  nombre_pyme: string;
  logo_pyme: string;
  datos_destino: {
    nombre: string;
    direccion: string;
    comuna: string;
    telefono?: string;
  };
  cotizaciones: {
    starken?: { price: number; tipo: string; tiempo: string };
    chilexpress?: { price: number; tipo: string; tiempo: string };
    blueexpress?: { price: number; tipo: string; tiempo: string };
  };
};

export default function PagoClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const id = searchParams.get("id");
  const courier = searchParams.get("courier");

  const [envio, setEnvio] = useState<EnvioType | null>(null);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);

  // ===========================================================
  // Confirmar pago (mantener lógica)
  // ===========================================================
  async function confirmarEnvio() {
    if (!id || !courier) return;

    setTransitioning(true);

    try {
      const response = await fetch(
        "https://mochidrop-n8n.utdxt3.easypanel.host/webhook-test/confirmar-envio",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, courier }),
        }
      );

      if (!response.ok) {
        setTransitioning(false);
        alert("Error confirmando envío");
        return;
      }

      // Delay profesional
      setTimeout(() => {
        router.push(`/final?id=${id}&courier=${courier}`);
      }, 1200);
    } catch {
      alert("Error conectando");
      setTransitioning(false);
    }
  }

  // ===========================================================
  // Cargar datos
  // ===========================================================
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
      if (data.estado === "Creado ") {
        router.push(`/final?id=${id}`);
        return;
      }
    }

    load();
  }, [id]);

  // ===========================================================
  // Loading inicial
  // ===========================================================
  if (loading) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-gray-300 border-t-black rounded-full"></div>
      </div>
    );
  }

  if (!envio) return <div className="p-10 text-center">Envío no encontrado.</div>;

  const monto =
    envio.cotizaciones[courier as keyof EnvioType["cotizaciones"]]?.price;

  // ===========================================================
  // UI PROFESSIONAL
  // ===========================================================
  return (
    <div className="flex justify-center p-6 bg-gray-100 min-h-screen">
      <div className="bg-white shadow-xl rounded-3xl p-6 w-full max-w-md border border-gray-200">
  
        {/* LOGO PYME */}
        {envio.logo_pyme && (
          <div className="flex justify-center mb-4">
            <img
              src={envio.logo_pyme}
              className="w-16 h-16 object-contain rounded-full border border-gray-200 shadow-sm"
              alt="Logo Pyme"
            />
          </div>
        )}
  
        {/* TÍTULO */}
        <h1 className="text-center text-black text-2xl font-bold">
          Pago pendiente
        </h1>
  
        <p className="text-center text-gray-500 text-sm mt-1 mb-6">
          Para continuar, transfiere el monto exacto.
        </p>
  
        {/* MONTO DESTACADO */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-6 text-center">
          <p className="text-gray-700 text-sm font-medium">Monto a transferir</p>
          <p className="text-4xl font-bold text-blue-700 mt-1">
            ${monto?.toLocaleString("es-CL")}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            (Debe ser exacto para validar el pago)
          </p>
        </div>
  
        {/* DATOS DE TRANSFERENCIA */}
        <h2 className="font-semibold text-gray-900 mb-2">Datos bancarios</h2>
  
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm space-y-1">
          <p className="text-black text-sm">
            <span className="font-semibold">Banco:</span> Bci/ Banco crédito e inversiones
          </p>
          <p className="text-black text-sm">
            <span className="font-semibold">Tipo de cuenta:</span> Cuenta Corriente
          </p>
          <p className="text-black text-sm">
            <span className="font-semibold">Número de cuenta:</span> 777920977566
          </p>
          <p className="text-black text-sm">
            <span className="font-semibold">RUT:</span> 20.977.566-2
          </p>
          <p className="text-black text-sm">
            <span className="font-semibold">Nombre:</span> Mauricio Benjamin Molina Ossandon
          </p>
          <p className="text-black text-sm">
            <span className="font-semibold">Comentario:</span> pago de: {monto}
          </p>
        </div>
  
        {/* BOTÓN */}
        <button
          onClick={confirmarEnvio}
          className="w-full bg-blue-600 text-white text-lg font-semibold py-3 rounded-xl hover:bg-blue-700"
        >
          Ya realicé la transferencia
        </button>
  
        {/* TEXTO INSTRUCTIVO UX */}
        <p className="text-center text-gray-500 text-xs mt-3">
          Una vez que hayas realizado la transferencia, presiona el botón para validar tu pago.
        </p>
  
      </div>
  
      {/* OVERLAY PROFESIONAL */}
      {transitioning && (
        <div className="fixed inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="animate-spin h-10 w-10 border-4 border-gray-300 border-t-blue-600 rounded-full"></div>
        </div>
      )}
    </div>
  );
  
}
