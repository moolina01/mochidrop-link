"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { useSearchParams } from "next/navigation";
import { MapPinIcon, ClockIcon } from "@heroicons/react/24/solid";
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

export default function EnvioClient() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [envio, setEnvio] = useState<EnvioType | null>(null);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [formCliente, setFormCliente] = useState({
    nombre: "",
    telefono: "",
    comuna: "",
    direccion: "",
    numero: "",
  });
  const [cotizando, setCotizando] = useState(false);
  const [errorCotizar, setErrorCotizar] = useState("");

  const router = useRouter();

  async function elegir(courier: string) {
    setTransitioning(true);
    router.push(`/confirmacion?id=${id}&courier=${courier}`);
  }

  async function cotizarEnvio() {
    if (!formCliente.nombre.trim() || !formCliente.comuna.trim() || !formCliente.direccion.trim()) {
      setErrorCotizar("Por favor completa los campos obligatorios.");
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
      setEnvio((prev) => prev ? { ...prev, cotizaciones: data.cotizaciones, datos_destino: { nombre: formCliente.nombre.trim(), telefono: formCliente.telefono.trim(), comuna: formCliente.comuna.trim(), direccion: formCliente.direccion.trim(), number: formCliente.numero.trim() } } : prev);
    } catch {
      setErrorCotizar("No pudimos cotizar los couriers. Intenta de nuevo.");
    } finally {
      setCotizando(false);
    }
  }

  // === 1) Cargar datos ===
  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    async function fetchEnvio() {
      const numericId = Number(id);

      const { data, error } = await supabase
        .from("envios")
        .select("*")
        .eq("id", numericId)
        .single();

      if (error) {
        console.error("Error:", error);
        setLoading(false);
        return;
      }

      if (data.estado === "Creado ") {
        router.push(`/final?id=${id}`);
        return;
      }

      setEnvio(data);
      setLoading(false);
    }

    fetchEnvio();
  }, [id, router]);

  // === 2) TIEMPO REAL ===
  useEffect(() => {
    if (!id) return;

    const numericId = Number(id);

    const channel = supabase
      .channel("envios-updates")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "envios", filter: `id=eq.${numericId}` },
        (payload) => {
          const newData = payload.new as EnvioType;

          if (newData.estado === "creado") {
            router.push(`/final?id=${id}`);
            return;
          }

          setEnvio(newData);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [id, router]);


  // === 3) LOADING PROFESIONAL ===
  if (loading) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-gray-300 border-t-black rounded-full"></div>
      </div>
    );
  }

// === 4) SI NO EXISTE ENVÍO ===
// === 4) SI NO EXISTE ENVÍO ===
if (!envio) return <div className="p-10 text-center">Envío no encontrado.</div>;

const mostrarFormulario = !envio?.cotizaciones || Object.keys(envio.cotizaciones).length === 0;

return (
  <div className="flex justify-center p-4 bg-gray-100 min-h-screen">
    <div className="bg-white shadow-xl rounded-3xl p-5 w-full max-w-md border border-gray-200 flex flex-col">

      {/* === BLOQUE EXPLICATIVO (Bonito + compacto) === */}
      <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl mb-5 text-sm text-blue-800">
        <p>
          Selecciona el método de envío que <strong>{envio.nombre_pyme}</strong> habilitó para tu compra.
        </p>
      </div>

      {/* === LOGO + TITULO === */}
      <div className="text-center mb-5">
        {envio.logo_pyme && (
          <img
            src={envio.logo_pyme}
            className="w-26 h-26 rounded-full mx-auto border border-gray-300 shadow-sm"
          />
        )}

        <h1 className="text-2xl text-black font-bold mt-3">{envio.nombre_pyme}</h1>
        <p className="text-gray-600 text-sm mt-1">Elige tu método de envío</p>
      </div>

      {mostrarFormulario ? (
        /* FASE 1: El cliente llena sus datos */
        <div>
          <p className="text-xs text-gray-500 mb-3 font-medium">Completa tus datos para ver las opciones de envío</p>
          <div className="flex flex-col gap-3 mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Nombre completo *</p>
              <input
                type="text"
                value={formCliente.nombre}
                onChange={(e) => setFormCliente((s) => ({ ...s, nombre: e.target.value }))}
                placeholder="Ej: María López"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-black"
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Teléfono</p>
              <input
                type="tel"
                value={formCliente.telefono}
                onChange={(e) => setFormCliente((s) => ({ ...s, telefono: e.target.value }))}
                placeholder="+56 9 1234 5678"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-black"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Comuna *</p>
                <input
                  type="text"
                  value={formCliente.comuna}
                  onChange={(e) => setFormCliente((s) => ({ ...s, comuna: e.target.value }))}
                  placeholder="Ej: Providencia"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-black"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Número / Depto</p>
                <input
                  type="text"
                  value={formCliente.numero}
                  onChange={(e) => setFormCliente((s) => ({ ...s, numero: e.target.value }))}
                  placeholder="Ej: 1234"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-black"
                />
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Dirección *</p>
              <input
                type="text"
                value={formCliente.direccion}
                onChange={(e) => setFormCliente((s) => ({ ...s, direccion: e.target.value }))}
                placeholder="Ej: Av. Providencia 1234"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-black"
              />
            </div>
          </div>
          {errorCotizar && (
            <p className="text-red-500 text-sm mb-3">{errorCotizar}</p>
          )}
          <button
            onClick={cotizarEnvio}
            disabled={cotizando}
            className="w-full bg-black text-white font-bold py-4 rounded-xl text-sm disabled:opacity-50"
          >
            {cotizando ? "Cotizando couriers…" : "Ver opciones de envío →"}
          </button>
        </div>
      ) : (
        /* FASE 2: Mostrar couriers */
        <div>
          {/* DESTINATARIO */}
          <p className="text-xs text-gray-500 mb-1 font-medium">Datos del destinatario</p>
          <div className="bg-gray-50 p-4 rounded-xl mb-6 border flex gap-3 items-start">
            <MapPinIcon className="w-6 h-6 text-gray-500 mt-0.5" />
            <div>
              <p className="font-semibold text-black">{envio!.datos_destino?.nombre}</p>
              <p className="text-black text-sm leading-tight">
                {envio!.datos_destino?.direccion} {envio!.datos_destino?.number}, {envio!.datos_destino?.comuna}
              </p>
            </div>
          </div>

          {/* OPCIONES DE COURIER */}
          <p className="text-xs text-gray-500 mb-2 font-medium">Opciones disponibles</p>
          <div className="space-y-4 flex-1">
            {envio!.cotizaciones?.starken && (
              <button onClick={() => elegir("starken")} className="flex justify-between items-start w-full p-4 border rounded-xl hover:bg-gray-50 transition shadow-sm">
                <div>
                  <p className="text-green-700 font-bold text-xl leading-none">Starken</p>
                  <p className="text-gray-600 text-sm mt-1">{envio!.cotizaciones!.starken!.tipo}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-black text-xl">${envio!.cotizaciones!.starken!.price.toLocaleString("es-CL")}</p>
                  <div className="flex items-center gap-1 text-gray-500 text-xs justify-end">
                    <ClockIcon className="w-4 h-4" />
                    <span>Llega en {envio!.cotizaciones!.starken!.tiempo}</span>
                  </div>
                </div>
              </button>
            )}
            {envio!.cotizaciones?.chilexpress && (
              <button onClick={() => elegir("chilexpress")} className="flex justify-between items-start w-full p-4 border rounded-xl hover:bg-gray-50 transition shadow-sm">
                <div>
                  <p className="text-black font-bold text-xl leading-none">Chilexpress</p>
                  <p className="text-gray-600 text-sm mt-1">{envio!.cotizaciones!.chilexpress!.tipo}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-black text-xl">${envio!.cotizaciones!.chilexpress!.price.toLocaleString("es-CL")}</p>
                  <div className="flex items-center gap-1 text-gray-500 text-xs justify-end">
                    <ClockIcon className="w-4 h-4" />
                    <span>Llega en {envio!.cotizaciones!.chilexpress!.tiempo}</span>
                  </div>
                </div>
              </button>
            )}
            {envio!.cotizaciones?.blueexpress && (
              <button onClick={() => elegir("blueexpress")} className="flex justify-between items-start w-full p-4 border rounded-xl hover:bg-gray-50 transition shadow-sm">
                <div>
                  <p className="text-blue-700 font-bold text-xl leading-none">Bluexpress</p>
                  <p className="text-gray-600 text-sm mt-1">{envio!.cotizaciones!.blueexpress!.tipo}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-black text-xl">${envio!.cotizaciones!.blueexpress!.price.toLocaleString("es-CL")}</p>
                  <div className="flex items-center gap-1 text-gray-500 text-xs justify-end">
                    <ClockIcon className="w-4 h-4" />
                    <span>Llega en {envio!.cotizaciones!.blueexpress!.tiempo}</span>
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>
      )}

      {/* === FOOTER === */}
      <div className="mt-6 text-center border-t pt-4">
        <p className="text-xs text-gray-500 mb-2">
          © {new Date().getFullYear()} {envio.nombre_pyme}
        </p>
{/* 
        <div className="flex justify-center gap-4 mb-1">
          <img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" className="w-5 h-5" />
          <img src="https://cdn-icons-png.flaticon.com/512/733/733585.png" className="w-5 h-5" />
        
        </div> */}

        <p className="text-[11px] text-gray-400">
          Powered by <span className="font-semibold">LinkDrop</span>
        </p>
      </div>

    </div>

    {/* === OVERLAY DE TRANSICIÓN === */}
    {transitioning && (
      <div className="fixed inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="animate-spin h-10 w-10 border-4 border-gray-300 border-t-black rounded-full"></div>
      </div>
    )}
  </div>
);


}
