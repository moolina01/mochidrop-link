"use client";

import { useState } from "react";
import { supabase } from "@/utils/supabase";
import { getRegion } from "@/utils/regiones";

const COURIER_LABELS: Record<string, string> = {
  starken_domicilio: "Starken Domicilio",
  starken: "Starken",
  starken_sucursal: "Starken Sucursal",
  chilexpress: "Chilexpress",
  blueexpress: "Blue Express",
  noventa9Minutos: "99 Minutos",
  "99minutos": "99 Minutos",
};

type CotItem = { price?: number | null; raw?: { totalPrice?: number | null } };
type Destino = { comuna: string; calle: string; numero: string };
type Precio = { courier: string; precio: number };

// Direcciones céntricas representativas (los couriers necesitan calle+número, no solo comuna)
const REF_SANTIAGO: Destino = { comuna: "Santiago", calle: "Ahumada", numero: "11" };
const REF_CONCEPCION: Destino = { comuna: "Concepción", calle: "Barros Arana", numero: "551" };
const REF_PUNTA_ARENAS: Destino = { comuna: "Punta Arenas", calle: "Bories", numero: "801" };

function precio(c: CotItem): number | null {
  return c?.price ?? c?.raw?.totalPrice ?? null;
}

function clp(n: number) {
  return `$${n.toLocaleString("es-CL")}`;
}

// Una cotización a un destino → { items ordenados barato→caro, error? }
async function cotizar(
  pymeId: string,
  destino: Destino,
  pkg: { largo: number; alto: number; ancho: number; peso: number },
): Promise<{ items: Precio[]; error?: string }> {
  try {
    const res = await fetch("/api/cotizar-publico", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pymeId, datosDestino: destino, ...pkg }),
    });
    const json = await res.json();
    if (!res.ok) return { items: [], error: json?.error ?? `Error ${res.status}` };
    if (!json.cotizaciones) return { items: [], error: "Sin cotizaciones" };
    const cot = json.cotizaciones as Record<string, CotItem>;
    const items = Object.entries(cot)
      .map(([courier, item]) => ({ courier, precio: precio(item) }))
      .filter((x): x is Precio => x.precio != null)
      .sort((a, b) => a.precio - b.precio);
    return { items };
  } catch {
    return { items: [], error: "Error de conexión" };
  }
}

export default function EstimadorPrecios({ userId, couriers, onPick }: { userId: string | null; couriers: string[]; onPick: (courier: string) => void }) {
  const [estado, setEstado] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [enRegion, setEnRegion] = useState<Precio[]>([]);
  const [centroLabel, setCentroLabel] = useState("");
  const [centro, setCentro] = useState<Precio[]>([]);
  const [extremo, setExtremo] = useState<Precio[]>([]);

  async function calcular() {
    if (!userId) return;
    setEstado("loading");
    setError("");
    try {
      const { data: pyme } = await supabase
        .from("pymes")
        .select("default_largo, default_alto, default_ancho, default_peso, origen_comuna, origen_calle, origen_numero")
        .eq("auth_id", userId)
        .single();

      if (!pyme?.default_largo || !pyme?.default_alto || !pyme?.default_ancho || !pyme?.default_peso) {
        setError("Primero configura el paquete por defecto de tu tienda.");
        setEstado("error");
        return;
      }
      if (!pyme?.origen_comuna || !pyme?.origen_calle || !pyme?.origen_numero) {
        setError("Primero configura la dirección de origen completa de tu tienda.");
        setEstado("error");
        return;
      }

      const pkg = {
        largo: Number(pyme.default_largo),
        alto: Number(pyme.default_alto),
        ancho: Number(pyme.default_ancho),
        peso: Number(pyme.default_peso),
      };
      const origen = pyme.origen_comuna as string;
      const regionTienda = getRegion(origen);
      // "Dentro de tu región": usamos la dirección real de la tienda como destino (mismo región).
      const destinoRegion: Destino = { comuna: origen, calle: pyme.origen_calle, numero: pyme.origen_numero };
      // Destino "centro": si la tienda ya está en RM, usar Concepción para que no se repita.
      const destinoCentro = regionTienda === "Metropolitana de Santiago" ? REF_CONCEPCION : REF_SANTIAGO;

      const [regionRes, centroRes, extremoRes] = await Promise.all([
        cotizar(userId, destinoRegion, pkg),
        cotizar(userId, destinoCentro, pkg),
        cotizar(userId, REF_PUNTA_ARENAS, pkg),
      ]);

      // Filtrar a los couriers habilitados; si el filtro deja vacío, usar el crudo (por si difieren las claves)
      const filt = (arr: Precio[]) => {
        const f = couriers.length ? arr.filter((x) => couriers.includes(x.courier)) : arr;
        return f.length ? f : arr;
      };

      if (regionRes.items.length === 0) {
        setError(regionRes.error
          ? `No pudimos cotizar para tu región: ${regionRes.error}`
          : "No pudimos cotizar para tu región. Revisa tu dirección de origen e intenta de nuevo.");
        setEstado("error");
        return;
      }

      setEnRegion(filt(regionRes.items));
      setCentroLabel(destinoCentro.comuna);
      setCentro(filt(centroRes.items));
      setExtremo(filt(extremoRes.items));
      setEstado("done");
    } catch {
      setError("No pudimos calcular los precios. Intenta de nuevo.");
      setEstado("error");
    }
  }

  return (
    <div className="border border-[#E8E8E3] rounded-xl p-4 bg-[#FAFAF7]">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-[#1A1A18]">Precios estimados</p>
          <p className="text-[11px] text-[#9C9C95]">Con tu paquete por defecto. Te ayuda a elegir el courier más barato.</p>
        </div>
        {estado !== "loading" && (
          <button
            type="button"
            onClick={calcular}
            className="flex-shrink-0 text-xs font-bold text-white bg-[#1A1A18] rounded-lg px-3 py-2"
          >
            {estado === "done" ? "Recalcular" : "Calcular"}
          </button>
        )}
      </div>

      {estado === "loading" && (
        <div className="flex items-center gap-2 mt-3 text-xs text-[#9C9C95]">
          <span className="h-3.5 w-3.5 border-2 border-[#E8E8E3] border-t-[#E8553D] rounded-full animate-spin" />
          Calculando precios… puede tardar unos segundos.
        </div>
      )}

      {estado === "error" && (
        <p className="text-xs text-[#9A6B00] bg-[#FFF7E6] border border-[#F5D58A] rounded-lg px-3 py-2 mt-3">{error}</p>
      )}

      {estado === "done" && (
        <div className="mt-3 flex flex-col gap-3">
          {/* En tu región */}
          <div>
            <p className="text-[11px] font-bold text-[#9C9C95] uppercase tracking-wide mb-1.5">Dentro de tu región</p>
            <div className="flex flex-col gap-1.5">
              {enRegion.map((c, i) => (
                <div key={c.courier} className="flex items-center justify-between bg-white border border-[#E8E8E3] rounded-lg px-3 py-2">
                  <span className="text-sm text-[#1A1A18] flex items-center gap-1.5">
                    {i === 0 && <span className="text-[9px] font-bold text-[#2D8A56] bg-[#E8F8EE] border border-[#B8E2C8] rounded-full px-1.5 py-0.5">+ barato</span>}
                    {COURIER_LABELS[c.courier] ?? c.courier}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#1A1A18]">{clp(c.precio)}</span>
                    <button type="button" onClick={() => onPick(c.courier)} className="text-[11px] font-semibold text-[#E8553D] hover:underline">
                      Usar
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Fuera de región — cada courier por zona */}
          {(() => {
            const centroMap = new Map(centro.map((c) => [c.courier, c.precio]));
            const extremoMap = new Map(extremo.map((c) => [c.courier, c.precio]));
            // Orden: primero los de tu región, luego cualquiera extra que aparezca
            const orden: string[] = [];
            for (const c of enRegion) orden.push(c.courier);
            for (const c of [...centro, ...extremo]) if (!orden.includes(c.courier)) orden.push(c.courier);
            return (
              <div>
                <p className="text-[11px] font-bold text-[#9C9C95] uppercase tracking-wide mb-1.5">Fuera de tu región (referencia)</p>
                <div className="bg-white border border-[#E8E8E3] rounded-lg overflow-hidden">
                  <div className="flex items-center text-[10px] font-bold text-[#9C9C95] uppercase tracking-wide px-3 py-1.5 border-b border-[#F0F0EB] bg-[#FAFAF7]">
                    <span className="flex-1">Courier</span>
                    <span className="w-20 text-right">{centroLabel}</span>
                    <span className="w-20 text-right">P. Arenas</span>
                  </div>
                  {orden.map((courier) => (
                    <div key={courier} className="flex items-center text-sm px-3 py-2 border-b border-[#F5F5F0] last:border-0">
                      <span className="flex-1 text-[#1A1A18]">{COURIER_LABELS[courier] ?? courier}</span>
                      <span className="w-20 text-right font-semibold text-[#1A1A18]">{centroMap.has(courier) ? clp(centroMap.get(courier)!) : "—"}</span>
                      <span className="w-20 text-right font-semibold text-[#1A1A18]">{extremoMap.has(courier) ? clp(extremoMap.get(courier)!) : "—"}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-[#9C9C95] mt-2 leading-snug">
                  Si ofreces envío gratis fuera de tu región, este es el costo aprox. que absorberías por courier. Considera limitarlo por región o monto mínimo.
                </p>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
