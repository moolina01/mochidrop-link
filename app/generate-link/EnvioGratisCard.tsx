"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { EnvioGratisConfig, EnvioGratisModo, ENVIO_GRATIS_DEFAULT } from "@/utils/envioGratis";

const COURIER_LABELS: Record<string, string> = {
  starken_domicilio: "Starken Domicilio",
  starken_sucursal: "Starken Sucursal",
  chilexpress: "Chilexpress",
  blueexpress: "Blue Express",
  noventa9Minutos: "99 Minutos",
};

// Si la pyme nunca eligió couriers, la columna está null y se usan todos (como en el dashboard)
const DEFAULT_COURIERS = Object.keys(COURIER_LABELS);

const MODOS: { id: EnvioGratisModo; label: string; desc: string }[] = [
  { id: "off",         label: "Desactivado",       desc: "El cliente paga el envío (normal)" },
  { id: "siempre",     label: "Siempre gratis",     desc: "Envío gratis en todas tus ventas" },
  { id: "sobre_monto", label: "Gratis sobre un monto", desc: "Gratis si la compra supera $X" },
];

const inputCls =
  "w-full border border-[#E8E8E3] rounded-xl px-4 py-3 text-sm text-[#1A1A18] bg-[#FAFAF7] outline-none transition-all focus:border-[#E8553D] focus:ring-2 focus:ring-[#E8553D]/10 placeholder:text-[#9C9C95]";

export default function EnvioGratisCard({ userId }: { userId: string | null }) {
  const [cfg, setCfg] = useState<EnvioGratisConfig>(ENVIO_GRATIS_DEFAULT);
  const [couriers, setCouriers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) return;
    let active = true;
    async function cargar() {
      const { data } = await supabase
        .from("pymes")
        .select("envio_gratis, couriers_habilitados")
        .eq("auth_id", userId)
        .single();
      if (!active) return;
      const habilitados: string[] = data?.couriers_habilitados?.length
        ? data.couriers_habilitados
        : DEFAULT_COURIERS;
      setCouriers(habilitados);
      const guardada = data?.envio_gratis as EnvioGratisConfig | null;
      setCfg({
        ...ENVIO_GRATIS_DEFAULT,
        ...(guardada ?? {}),
        // si no hay courier elegido, default al primer habilitado
        courier: guardada?.courier || habilitados[0] || "",
      });
      setEditing(!guardada); // si ya hay config guardada → resumen; si no → formulario
      setLoading(false);
    }
    cargar();
    return () => { active = false; };
  }, [userId]);

  function set<K extends keyof EnvioGratisConfig>(k: K, v: EnvioGratisConfig[K]) {
    setCfg((s) => ({ ...s, [k]: v }));
  }

  const necesitaCourier = cfg.modo !== "off";
  const montoInvalido = cfg.modo === "sobre_monto" && (!cfg.monto || cfg.monto <= 0);
  const courierInvalido = necesitaCourier && !cfg.courier;
  const puedeGuardar = !montoInvalido && !courierInvalido;

  async function guardar() {
    if (!userId || !puedeGuardar) return;
    setSaving(true);
    setError("");
    // Normaliza: si está off, limpia condiciones
    const aGuardar: EnvioGratisConfig = cfg.modo === "off"
      ? { ...ENVIO_GRATIS_DEFAULT }
      : cfg;
    const { error: err } = await supabase
      .from("pymes")
      .update({ envio_gratis: aGuardar })
      .eq("auth_id", userId);
    setSaving(false);
    if (err) { setError("No se pudo guardar. Intenta de nuevo."); return; }
    setCfg(aGuardar);
    setEditing(false); // colapsar a resumen
  }

  // Texto legible del estado actual (para el resumen)
  function resumenTexto(c: EnvioGratisConfig): { titulo: string; detalle: string } {
    if (c.modo === "off") return { titulo: "Desactivado", detalle: "El cliente paga el envío" };
    const alcance = c.solo_region ? "en tu región" : "a todo Chile";
    const courier = COURIER_LABELS[c.courier] ?? c.courier;
    if (c.modo === "siempre") {
      return { titulo: "Envío gratis siempre", detalle: `${alcance} · vía ${courier}` };
    }
    return {
      titulo: `Envío gratis sobre $${(c.monto || 0).toLocaleString("es-CL")}`,
      detalle: `${alcance} · vía ${courier}`,
    };
  }

  if (!userId) return null;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-[#E8E8E3] shadow-sm p-5 animate-pulse">
        <div className="h-4 w-40 bg-[#E8E8E3] rounded-full mb-4" />
        <div className="h-10 bg-[#F0F0EB] rounded-xl" />
      </div>
    );
  }

  const muestraAdvertencia = cfg.modo === "siempre" && !cfg.solo_region;

  // ── Vista resumen (config ya guardada) ──
  if (!editing) {
    const r = resumenTexto(cfg);
    const activo = cfg.modo !== "off";
    return (
      <div className="bg-white rounded-2xl border border-[#E8E8E3] shadow-sm overflow-hidden">
        <div className="px-5 py-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <span className="text-lg leading-none mt-0.5">🚚</span>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-[15px] text-[#1A1A18]">Configuración de envío</p>
                <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#7B2D8B] bg-[#F5EAF9] border border-[#E3C8EE] rounded-full px-2 py-0.5">Beta</span>
              </div>
              <p className={`text-sm font-semibold mt-1 ${activo ? "text-[#2D8A56]" : "text-[#5C5C57]"}`}>{r.titulo}</p>
              <p className="text-xs text-[#9C9C95] mt-0.5">{r.detalle}</p>
            </div>
          </div>
          <button onClick={() => setEditing(true)} className="flex-shrink-0 text-xs font-semibold text-[#E8553D] hover:underline">
            Editar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E8E8E3] shadow-sm overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🚚</span>
          <p className="font-bold text-[15px] text-[#1A1A18]">Configuración de envío</p>
          <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#7B2D8B] bg-[#F5EAF9] border border-[#E3C8EE] rounded-full px-2 py-0.5">Beta</span>
        </div>
        <p className="text-xs text-[#9C9C95] mt-1 leading-snug">
          Tú absorbes el envío: el cliente paga solo el producto y a ti se te descuenta el envío del monto a recibir.
        </p>
      </div>

      <div className="px-5 pb-5 flex flex-col gap-3">
        {/* Modo */}
        <div className="flex flex-col gap-2">
          {MODOS.map((m) => {
            const active = cfg.modo === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => set("modo", m.id)}
                className="w-full text-left rounded-xl border-2 px-4 py-3 transition-all flex items-start gap-3"
                style={{ borderColor: active ? "#E8553D" : "#E8E8E3", backgroundColor: active ? "#FFF0ED" : "#fff" }}
              >
                <span className="flex-shrink-0 w-4 h-4 rounded-full border-2 mt-0.5 flex items-center justify-center"
                  style={{ borderColor: active ? "#E8553D" : "#D1D1CC", backgroundColor: active ? "#E8553D" : "transparent" }}>
                  {active && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-[#1A1A18]">{m.label}</span>
                  <span className="block text-[11px] text-[#9C9C95]">{m.desc}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Monto (si sobre_monto) */}
        {cfg.modo === "sobre_monto" && (
          <div>
            <label className="block text-xs font-semibold text-[#1A1A18] mb-1">Monto mínimo de compra (CLP) *</label>
            <input
              className={inputCls}
              value={cfg.monto || ""}
              onChange={(e) => set("monto", Number(e.target.value.replace(/[^\d]/g, "")))}
              placeholder="Ej: 30000"
              inputMode="numeric"
            />
          </div>
        )}

        {/* Solo región + courier (si hay modo activo) */}
        {cfg.modo !== "off" && (
          <>
            <button
              type="button"
              onClick={() => set("solo_region", !cfg.solo_region)}
              className="w-full text-left rounded-xl border border-[#E8E8E3] px-4 py-3 flex items-center gap-3 bg-[#FAFAF7]"
            >
              <span className="flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center"
                style={{ borderColor: cfg.solo_region ? "#E8553D" : "#D1D1CC", backgroundColor: cfg.solo_region ? "#E8553D" : "transparent" }}>
                {cfg.solo_region && (
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                )}
              </span>
              <span>
                <span className="block text-sm font-semibold text-[#1A1A18]">Solo en mi región</span>
                <span className="block text-[11px] text-[#9C9C95]">Fuera de tu región, el cliente paga el envío normal</span>
              </span>
            </button>

            <div>
              <label className="block text-xs font-semibold text-[#1A1A18] mb-1">Courier para envíos gratis *</label>
              {couriers.length === 0 ? (
                <p className="text-xs text-[#9A6B00] bg-[#FFF7E6] border border-[#F5D58A] rounded-xl px-3 py-2">
                  Primero habilita al menos un courier en la configuración de tu tienda.
                </p>
              ) : (
                <select className={inputCls} value={cfg.courier} onChange={(e) => set("courier", e.target.value)}>
                  {couriers.map((k) => <option key={k} value={k}>{COURIER_LABELS[k] ?? k}</option>)}
                </select>
              )}
            </div>
          </>
        )}

        {muestraAdvertencia && (
          <p className="text-xs text-[#9A6B00] bg-[#FFF7E6] border border-[#F5D58A] rounded-xl px-3 py-2 leading-snug">
            ⚠️ Envío gratis a <b>todo Chile</b>. Un pedido a una región lejana puede tener un envío alto que tú absorbes. Considera limitar por región o monto mínimo.
          </p>
        )}

        {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}

        <button
          onClick={guardar}
          disabled={!puedeGuardar || saving}
          className="w-full bg-[#1A1A18] text-white font-bold py-3 rounded-xl text-sm transition-all active:scale-[0.99] disabled:bg-[#D1D1CC] disabled:cursor-not-allowed"
        >
          {saving ? "Guardando..." : "Guardar configuración"}
        </button>
      </div>
    </div>
  );
}
