"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { useSearchParams } from "next/navigation";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";

type EnvioType = {
  nombre_pyme: string;
  logo_pyme: string;
  datos_destino: {
    nombre: string;
    direccion: string;
    comuna: string;
    telefono?: string;
    number:string
  };
  cotizaciones: {
    starken?: { price: number; tipo: string; tiempo: string };
    chilexpress?: { price: number; tipo: string; tiempo: string };
    blueexpress?: { price: number; tipo: string; tiempo: string };
  };
};

export default function ConfirmacionPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const courier = searchParams.get("courier");

  const [envio, setEnvio] = useState<EnvioType | null>(null);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);

  const router = useRouter();

  // ==========================================
  // CONFIRMAR ENVÍO
  // ==========================================
  async function confirmarEnvio() {
 
    //   router.push(`/pago?id=${id}`);
    router.push(`/pago?id=${id}&courier=${courier}`);

  }

  // ==========================================
  // CARGAR DATOS
  // ==========================================
  useEffect(() => {
    if (!id) return;

    async function load() {
      const { data } = await supabase
        .from("envios")
        .select("*")
        .eq("id", Number(id))
        .single();

      setEnvio(data);
      setLoading(false);

      if (data.estado === "Creado ") {
        router.push(`/final?id=${id}`);
        return;
      }
    }

    

    load();
  }, [id]);

  // ==========================================
  // LOADING INICIAL PROFESIONAL
  // ==========================================
  if (loading) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-gray-300 border-t-black rounded-full"></div>
      </div>
    );
  }

  if (!envio) return <div className="p-10 text-center"></div>
  if (!courier) return <div className="p-10 text-center">No se seleccionó courier.</div>;

  const info =
    envio.cotizaciones[
      courier as "starken" | "chilexpress" | "blueexpress"
    ];

  if (!info) return <div className="p-10 text-center">Courier no válido.</div>;

  return (
    <div className="flex justify-center p-6 bg-gray-100 min-h-screen">
      <div className="bg-white shadow-xl rounded-3xl p-6 w-full max-w-md border border-gray-200">
  
        {/* LOGO PYME */}
        {envio.logo_pyme && (
          <div className="flex justify-center mb-5">
            <img
              src={envio.logo_pyme}
              className="w-16 h-16 object-contain rounded-full border border-gray-200 shadow-sm"
              alt="Logo Pyme"
            />
          </div>
        )}
  
        {/* TÍTULO */}
        <h1 className="text-center text-black text-2xl font-bold mb-1">
          Envío seleccionado
        </h1>
  
        {/* Subtexto */}
        <p className="text-center text-gray-500 text-sm mb-6">
          Revisa los datos antes de continuar
        </p>
  
        {/* Monto + Courier */}
        <div className="text-center text-lg font-semibold flex justify-center gap-2">
          <span className="text-black">
            {courier.charAt(0).toUpperCase() + courier.slice(1)}
          </span>
          <span className="font-normal text-black">{info.tipo}</span>
          <span className="font-bold text-black">${info.price}</span>
        </div>
  
        <p className="text-center mt-1 text-gray-500 text-sm mb-6">
          Llega en {info.tiempo}
        </p>
  
        {/* =============================== */}
        {/* SECCIÓN: DATOS DEL DESTINATARIO */}
        {/* =============================== */}
        <h2 className="text-sm font-semibold text-gray-700 mb-2">
          Datos del destinatario
        </h2>
  
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm">
          <p className="font-semibold text-gray-900">
            {envio.datos_destino.nombre}
          </p>
          <p className="text-black text-sm">
            {envio.datos_destino.direccion}, {envio.datos_destino.number}, {envio.datos_destino.comuna}
          </p>
          <p className="text-gray-600 text-sm">
            {envio.datos_destino.telefono}
          </p>
        </div>
  
        {/* =============================== */}
        {/* SECCIÓN: DETALLES DEL ENVÍO */}
        {/* =============================== */}
        <h2 className="text-sm font-semibold text-gray-700 mb-2">
          Detalles del envío
        </h2>
  
        <div className="p-4 rounded-xl border border-gray-200 mb-6 flex justify-between items-start bg-white shadow-sm">
  
          {/* Info izquierda */}
          <div>
            <p className="font-semibold text-black">
              {courier} — {info.tipo}
            </p>
  
            <p className="font-bold text-black mt-1">${info.price}</p>
  
            <p className="text-black text-sm mt-1">
              Entrega estimada: {info.tiempo}
            </p>
  
            <p className="text-gray-600 text-sm">Paquete estándar</p>
          </div>
  
          {/* Logo courier */}
          <div className="flex items-start">
            {courier === "starken" && (
              <img src="/unnamed.jpg" className="w-16 h-auto object-contain" />
            )}
            {courier === "chilexpress" && (
              <img src="/images-3.png" className="w-16 h-auto object-contain" />
            )}
            {courier === "blueexpress" && (
              <img src="/images-4.png" className="w-16 h-auto object-contain" />
            )}
          </div>
        </div>
  
        {/* BOTÓN */}
        <button
          onClick={() => confirmarEnvio()}
          className="w-full bg-blue-600 text-white text-lg font-semibold py-3 rounded-xl hover:bg-blue-700"
        >
         Continuar al pago
        </button>
      </div>

      
  
      {/* OVERLAY DE TRANSICIÓN */}
      {transitioning && (
        <div className="fixed inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="animate-spin h-10 w-10 border-4 border-gray-300 border-t-black rounded-full"></div>
        </div>
      )}
    </div>
  );
      }  