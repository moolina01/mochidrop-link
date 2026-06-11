"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";

// Día de la transferencia semanal (0=domingo, 1=lunes...). Cambiar aquí si se define otro.
const DIA_TRANSFERENCIA = 1; // lunes

type Fila = {
  producto_precio: number | null;
  envio_gratis_aplicado: boolean | null;
  flete_absorbido: number | null;
  liquidado: boolean | null;
};

function netoFila(f: Fila): number {
  const producto = f.producto_precio ?? 0;
  const flete = f.envio_gratis_aplicado ? (f.flete_absorbido ?? 0) : 0;
  return Math.max(0, producto - flete);
}

function clp(n: number) {
  return `$${n.toLocaleString("es-CL")}`;
}

// Próxima fecha de transferencia (siguiente DIA_TRANSFERENCIA)
function proximaTransferencia(): Date {
  const now = new Date();
  const d = new Date(now);
  const diff = ((DIA_TRANSFERENCIA - now.getDay() + 7) % 7) || 7;
  d.setDate(now.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function SaldoCard({ userId }: { userId: string | null }) {
  const [filas, setFilas] = useState<Fila[]>([]);
  const [loading, setLoading] = useState(true);
  const [transferInfo, setTransferInfo] = useState<{ proxTxt: string; faltanDias: number }>({ proxTxt: "", faltanDias: 0 });

  useEffect(() => {
    if (!userId) return;
    let active = true;
    async function cargar() {
      const { data } = await supabase
        .from("envios")
        .select("producto_precio, envio_gratis_aplicado, flete_absorbido, liquidado")
        .eq("pyme_id", userId)
        .eq("pago_status", "pagado")
        .gt("producto_precio", 0);
      if (!active) return;
      setFilas((data as Fila[]) ?? []);
      // Fecha de la próxima transferencia (depende del reloj → fuera del render)
      const prox = proximaTransferencia();
      setTransferInfo({
        proxTxt: prox.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "short" }),
        faltanDias: Math.max(0, Math.ceil((prox.getTime() - Date.now()) / 86400_000)),
      });
      setLoading(false);
    }
    cargar();
    return () => { active = false; };
  }, [userId]);

  if (!userId) return null;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-[#E8E8E3] shadow-sm p-5 animate-pulse">
        <div className="h-4 w-32 bg-[#E8E8E3] rounded-full mb-3" />
        <div className="h-8 w-40 bg-[#F0F0EB] rounded-xl" />
      </div>
    );
  }

  const pendientes = filas.filter((f) => !f.liquidado);
  const transferidas = filas.filter((f) => f.liquidado);
  const saldoPendiente = pendientes.reduce((s, f) => s + netoFila(f), 0);
  const yaTransferido = transferidas.reduce((s, f) => s + netoFila(f), 0);
  const totalVendido = saldoPendiente + yaTransferido;
  const { proxTxt, faltanDias } = transferInfo;

  return (
    <div className="bg-[#1A1A18] rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">💰</span>
          <p className="font-bold text-[15px] text-white">Tu saldo</p>
          <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#E3C8EE] bg-[rgba(123,45,139,0.35)] border border-[rgba(227,200,238,0.4)] rounded-full px-2 py-0.5">Beta</span>
        </div>

        <p className="text-[11px] text-white/50 uppercase tracking-wider">Saldo por transferir</p>
        <p className="text-3xl font-extrabold text-white leading-none mt-1">{clp(saldoPendiente)}</p>

        {/* Próxima transferencia */}
        <div className="mt-4 bg-white/[0.07] border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-lg">📅</span>
          <div>
            <p className="text-[13px] font-semibold text-white capitalize">Próxima transferencia: {proxTxt}</p>
            <p className="text-[11px] text-white/50">
              {saldoPendiente > 0
                ? (faltanDias === 0 ? "Es hoy" : `Faltan ${faltanDias} día${faltanDias !== 1 ? "s" : ""}`)
                : "Sin saldo pendiente por ahora"}
            </p>
          </div>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 border-t border-white/10 divide-x divide-white/10">
        {[
          { label: "Vendido", value: clp(totalVendido) },
          { label: "Transferido", value: clp(yaTransferido) },
          { label: "Ventas", value: String(filas.length) },
        ].map((s) => (
          <div key={s.label} className="px-3 py-3 text-center">
            <p className="text-[10px] text-white/45 uppercase tracking-wider">{s.label}</p>
            <p className="text-sm font-bold text-white mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-white/40 text-center px-4 py-2.5 border-t border-white/10">
        Las transferencias se realizan una vez por semana. Los envíos que cubre tu tienda ya vienen descontados.
      </p>
    </div>
  );
}
