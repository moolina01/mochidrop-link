"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { useSearchParams } from "next/navigation";
import { CheckCircleIcon, LinkIcon } from "@heroicons/react/24/solid";

type EnvioType = {
  nombre_pyme: string;
  logo_pyme: string;
  datos_destino: {
    nombre: string;
    direccion: string;
    comuna: string;
    number: string;
    telefono?: string;
  };
  cotizaciones: {
    starken?: { price: number; tipo: string; tiempo: string };
    chilexpress?: { price: number; tipo: string; tiempo: string };
    blueexpress?: { price: number; tipo: string; tiempo: string };
  };
  estado?: string;
  courier?: string;
  tracking?: string;
  tracking_url?: string;
  link_publico?: string;
};

export default function FinalClient() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [envio, setEnvio] = useState<EnvioType | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(true);
  const [copied, setCopied] = useState(false);

  // ===========================================================
  // CARGA INICIAL
  // ===========================================================
  useEffect(() => {
    if (!id) return;

    async function load() {
      const { data } = await supabase
        .from("envios")
        .select("*")
        .eq("id", Number(id))
        .single();

      setEnvio(data ?? null);
      setLoading(false);

      // Delay de animación profesional
      setTimeout(() => setGenerating(false), 1500);
    }

    load();
  }, [id]);

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
          setEnvio(payload.new as EnvioType);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  // ===========================================================
  // LOADING
  // ===========================================================
  if (loading) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-gray-300 border-t-black rounded-full"></div>
      </div>
    );
  }

  // ===========================================================
  // ANIMACIÓN PROFESIONAL
  // ===========================================================
  if (generating) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="w-full max-w-sm text-center px-6">

          <div className="flex justify-center mb-4">
            <div className="p-4 bg-blue-600 rounded-full animate-pulse">
              <CheckCircleIcon className="w-10 h-10 text-white" />
            </div>
          </div>

          <h2 className="text-xl font-bold text-gray-800">Espere un momento…</h2>
          <p className="text-gray-500 text-sm mt-1">Esto puede tardar unos segundos</p>

          <div className="w-full bg-gray-200 rounded-full h-2 mt-6 overflow-hidden">
            <div className="bg-blue-600 h-2 w-1/2 animate-[loadingbar_1.2s_infinite]"></div>
          </div>

          <style>
            {`
              @keyframes loadingbar {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(200%); }
              }
            `}
          </style>
        </div>
      </div>
    );
  }

  // ===========================================================
  // VALIDACIONES
  // ===========================================================
  if (!envio) {
    return (
      <div className="p-10 text-center text-gray-600">
        No se pudo cargar la información del envío.
      </div>
    );
  }

  const courierKey = envio.courier?.toLowerCase() as
    | "starken"
    | "chilexpress"
    | "blueexpress";

  const info = courierKey ? envio.cotizaciones[courierKey] : null;

  // Aún no está lista la info → evitar crasheo
  if (!info) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-gray-300 border-t-black rounded-full"></div>
      </div>
    );
  }

  // ===========================================================
  // COPIAR LINK (SAFARI SAFE)
  // ===========================================================
  function copyLink() {
    const text = envio!.tracking_url ?? "";

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        })
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

  function volver() {
    window.history.back();
  }

  // ===========================================================
  // UI FINAL
  // ===========================================================
  return (
    <div className="flex justify-center p-6 bg-gray-100 min-h-screen">
      <div className="bg-white shadow-xl rounded-3xl p-6 w-full max-w-md border border-gray-200">

        <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-xl mb-4 flex items-center gap-2">
          <CheckCircleIcon className="w-5 h-5" />
          <span className="text-sm font-medium">La guía fue generada correctamente</span>
        </div>

        <div className="flex justify-center mb-3">
          <div className="bg-green-600 p-2 rounded-full">
            <CheckCircleIcon className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="text-center text-2xl font-bold text-black">¡Tu guía está lista!</h1>
        <p className="text-center mt-1 text-gray-600 text-sm">Todo se generó correctamente.</p>

        {/* COURIER INFO */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 mt-6 mb-4 flex justify-between items-start shadow-sm">
          <div>
            <p className="font-semibold text-black">{envio.courier} — {info.tipo}</p>
            <p className="text-gray-700 text-sm mt-1">Llega en {info.tiempo}</p>
            <p className="text-gray-700 text-sm">Paquete estándar</p>
          </div>
          <p className="font-bold text-black">${info.price}</p>
        </div>

        {/* TRACKING */}
        <div className="mt-3 mb-4">
          <p className="font-semibold text-black text-sm">Tracking: {envio.tracking}</p>
          <a href={envio.tracking_url!} target="_blank" className="text-blue-600 text-sm underline">
            Seguir tu envío
          </a>
        </div>

        {/* LINK DE ENVÍO */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <LinkIcon className="w-5 h-5 text-black" />
            <p className="font-semibold text-black">Tu link de envío</p>
          </div>

          <button
            onClick={copyLink}
            className={`border px-3 py-1 rounded-lg text-sm transition-all ${
              copied
                ? "bg-green-100 text-green-700 border-green-300"
                : "bg-gray-100 text-black border-gray-300 hover:bg-gray-200"
            }`}
          >
            {copied ? "Copiado ✓" : "Copiar link"}
          </button>
        </div>

        {/* DESTINATARIO */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6 shadow-sm">
          <p className="font-semibold text-black">{envio.datos_destino.nombre}</p>
          <p className="text-gray-700 text-sm">
            {envio.datos_destino.direccion} {envio.datos_destino.number}, {envio.datos_destino.comuna}
          </p>
          <p className="text-gray-700 text-sm">{envio.datos_destino.telefono}</p>
        </div>

        <button onClick={volver} className="w-full bg-black text-white font-semibold py-3 rounded-xl">
          Recargar
        </button>
      </div>
    </div>
  );
}
