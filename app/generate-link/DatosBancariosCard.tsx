"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";

type DatosBancarios = {
  banco: string;
  tipo_cuenta: string;
  cuenta: string;
  titular: string;
  rut: string;
  email: string;
};

const EMPTY: DatosBancarios = { banco: "", tipo_cuenta: "Cuenta Corriente", cuenta: "", titular: "", rut: "", email: "" };

const TIPOS = ["Cuenta Corriente", "Cuenta Vista", "Cuenta RUT", "Cuenta de Ahorro"];

const inputCls =
  "w-full border border-[#E8E8E3] rounded-xl px-4 py-3 text-sm text-[#1A1A18] bg-[#FAFAF7] outline-none transition-all focus:border-[#E8553D] focus:ring-2 focus:ring-[#E8553D]/10 placeholder:text-[#9C9C95]";

function esCompleto(d: DatosBancarios) {
  return Boolean(d.cuenta.trim() && d.titular.trim() && d.rut.trim() && d.banco.trim());
}

export default function DatosBancariosCard({ userId }: { userId: string | null }) {
  const [datos, setDatos] = useState<DatosBancarios>(EMPTY);
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
        .select("datos_bancarios")
        .eq("auth_id", userId)
        .single();
      if (!active) return;
      const cargado = data?.datos_bancarios ? { ...EMPTY, ...data.datos_bancarios } : EMPTY;
      setDatos(cargado);
      setEditing(!esCompleto(cargado)); // si está completo → resumen; si no → formulario
      setLoading(false);
    }
    cargar();
    return () => { active = false; };
  }, [userId]);

  function set<K extends keyof DatosBancarios>(k: K, v: string) {
    setDatos((s) => ({ ...s, [k]: v }));
  }

  const completo = esCompleto(datos);

  async function guardar() {
    if (!userId || !completo) return;
    setSaving(true);
    setError("");
    const { error: err } = await supabase
      .from("pymes")
      .update({ datos_bancarios: datos })
      .eq("auth_id", userId);
    setSaving(false);
    if (err) { setError("No se pudo guardar. Intenta de nuevo."); return; }
    setEditing(false);
  }

  if (!userId) return null;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-[#E8E8E3] shadow-sm p-5 animate-pulse">
        <div className="h-4 w-48 bg-[#E8E8E3] rounded-full mb-4" />
        <div className="h-10 bg-[#F0F0EB] rounded-xl" />
      </div>
    );
  }

  // ── Vista resumen (datos ya guardados) ──
  if (!editing) {
    const filas: [string, string][] = [
      ["Titular", datos.titular],
      ["RUT", datos.rut],
      ["Banco", datos.banco],
      ["Tipo de cuenta", datos.tipo_cuenta],
      ["N° de cuenta", datos.cuenta],
      ...(datos.email ? [["Email", datos.email] as [string, string]] : []),
    ];
    return (
      <div className="bg-white rounded-2xl border border-[#E8E8E3] shadow-sm overflow-hidden">
        <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏦</span>
            <div>
              <p className="font-bold text-[15px] text-[#1A1A18]">Datos para recibir tus pagos</p>
              <p className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2D8A56] mt-0.5">
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="#2D8A56" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Listo para recibir transferencias
              </p>
            </div>
          </div>
          <button onClick={() => setEditing(true)} className="flex-shrink-0 text-xs font-semibold text-[#E8553D] hover:underline">
            Editar
          </button>
        </div>
        <div className="px-5 pb-5">
          <div className="bg-[#FAFAF7] border border-[#F0F0EB] rounded-xl px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-2">
            {filas.map(([label, v]) => (
              <div key={label}>
                <p className="text-[10px] text-[#9C9C95] uppercase tracking-wide">{label}</p>
                <p className="text-sm font-semibold text-[#1A1A18] break-all">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Vista formulario ──
  return (
    <div className="bg-white rounded-2xl border border-[#E8E8E3] shadow-sm overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🏦</span>
          <p className="font-bold text-[15px] text-[#1A1A18]">Datos para recibir tus pagos</p>
        </div>
        <p className="text-xs text-[#9C9C95] mt-1 leading-snug">
          Cuando un cliente paga el producto, te transferimos a esta cuenta dentro de 24-48h. Manténla al día.
        </p>
      </div>

      <div className="px-5 pb-5 flex flex-col gap-3">
        <div>
          <label className="block text-xs font-semibold text-[#1A1A18] mb-1">Titular de la cuenta *</label>
          <input className={inputCls} value={datos.titular} onChange={(e) => set("titular", e.target.value)} placeholder="Ej: María López" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#1A1A18] mb-1">RUT *</label>
            <input className={inputCls} value={datos.rut} onChange={(e) => set("rut", e.target.value)} placeholder="12.345.678-9" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1A1A18] mb-1">Banco *</label>
            <input className={inputCls} value={datos.banco} onChange={(e) => set("banco", e.target.value)} placeholder="Ej: Banco Estado" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#1A1A18] mb-1">Tipo de cuenta</label>
            <select className={inputCls} value={datos.tipo_cuenta} onChange={(e) => set("tipo_cuenta", e.target.value)}>
              {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1A1A18] mb-1">N° de cuenta *</label>
            <input className={inputCls} value={datos.cuenta} onChange={(e) => set("cuenta", e.target.value.replace(/\s/g, ""))} placeholder="00012345678" inputMode="numeric" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#1A1A18] mb-1">Email de confirmación</label>
          <input className={inputCls} value={datos.email} onChange={(e) => set("email", e.target.value)} placeholder="tucorreo@email.com" type="email" />
        </div>

        {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}

        <button
          onClick={guardar}
          disabled={!completo || saving}
          className="w-full bg-[#1A1A18] text-white font-bold py-3 rounded-xl text-sm transition-all active:scale-[0.99] disabled:bg-[#D1D1CC] disabled:cursor-not-allowed"
        >
          {saving ? "Guardando..." : "Guardar datos bancarios"}
        </button>
        {!completo && (
          <p className="text-center text-[11px] text-[#9C9C95]">Completa titular, RUT, banco y N° de cuenta.</p>
        )}
      </div>
    </div>
  );
}
