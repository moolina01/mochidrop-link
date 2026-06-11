"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/utils/supabase";

const ADMIN_EMAIL = "mb212@gmail.com";

type DatosBancarios = {
  banco?: string;
  tipo_cuenta?: string;
  cuenta?: string;
  titular?: string;
  rut?: string;
  email?: string;
} | null;

type Venta = {
  id: number;
  cliente: string;
  producto: string;
  precio: number;
  envio_gratis?: boolean;
  flete_descontado?: number;
  pagado_at: string;
};

type Grupo = {
  pyme_id: string;
  nombre: string;
  datos_bancarios: DatosBancarios;
  total: number;
  cantidad: number;
  desde: string | null;
  ventas: Venta[];
};

const PLAZO_HORAS = 48;

function clp(n: number) {
  return `$${n.toLocaleString("es-CL")}`;
}

// Estado de urgencia según la venta más antigua sin liquidar
function urgencia(desde: string | null): { label: string; color: string; bg: string; border: string } {
  if (!desde) return { label: "Sin fecha", color: "#5C5C57", bg: "#FAFAF7", border: "#E8E8E3" };
  const limite = new Date(desde).getTime() + PLAZO_HORAS * 3600_000;
  const restanteH = (limite - Date.now()) / 3600_000;
  if (restanteH < 0) return { label: `Vencido hace ${Math.abs(Math.round(restanteH))}h`, color: "#C0341D", bg: "#FFF0EE", border: "#F5C6BD" };
  if (restanteH < 24) return { label: `Vence en ${Math.round(restanteH)}h`, color: "#B25E00", bg: "#FFF8E8", border: "#F5DFA8" };
  return { label: `${Math.round(restanteH)}h restantes`, color: "#2D8A56", bg: "#F0FAF4", border: "#B8E2C8" };
}

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-CL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function AdminClient() {
  const [authState, setAuthState] = useState<"checking" | "denied" | "ok">("checking");
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [marcando, setMarcando] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setAuthState("denied"); setLoading(false); return; }
    try {
      const res = await fetch("/api/admin/payouts", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.status === 403 || res.status === 401) { setAuthState("denied"); setLoading(false); return; }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error");
      setAuthState("ok");
      setGrupos(json.grupos ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if ((data.user?.email ?? "").toLowerCase() !== ADMIN_EMAIL) {
        setAuthState("denied");
        setLoading(false);
        return;
      }
      cargar();
    });
  }, [cargar]);

  async function marcarPagada(grupo: Grupo) {
    if (!confirm(`¿Marcar como pagada la transferencia a ${grupo.nombre} por ${clp(grupo.total)}?`)) return;
    setMarcando(grupo.pyme_id);
    const { data: { session } } = await supabase.auth.getSession();
    try {
      const res = await fetch("/api/admin/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ envio_ids: grupo.ventas.map((v) => v.id) }),
      });
      if (!res.ok) throw new Error("Error al marcar");
      setGrupos((prev) => prev.filter((g) => g.pyme_id !== grupo.pyme_id));
    } catch {
      setError("No se pudo marcar como pagada.");
    } finally {
      setMarcando(null);
    }
  }

  function copiar(texto: string, key: string) {
    navigator.clipboard.writeText(texto);
    setCopiado(key);
    setTimeout(() => setCopiado((c) => (c === key ? null : c)), 1500);
  }

  if (authState === "checking" || (loading && authState !== "denied")) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-[#E8E8E3] border-t-[#E8553D] rounded-full" />
      </div>
    );
  }

  if (authState === "denied") {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-2xl mb-2">🔒</p>
          <p className="text-[#1A1A18] font-bold">Acceso restringido</p>
          <p className="text-[#9C9C95] text-sm mt-1">Este panel es solo para administración.</p>
        </div>
      </div>
    );
  }

  const totalGlobal = grupos.reduce((s, g) => s + g.total, 0);

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <div className="bg-white border-b border-[#E8E8E3] px-6 py-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#E8553D]">Admin · LinkDrop</p>
          <h1 className="text-2xl font-bold text-[#1A1A18] mt-1">Pagos pendientes a pymes</h1>
          <p className="text-sm text-[#9C9C95] mt-1">
            Producto cobrado que debes transferir. Plazo {PLAZO_HORAS}h desde el pago del cliente.
          </p>
          {grupos.length > 0 && (
            <div className="mt-4 flex items-center gap-4">
              <div className="bg-[#1A1A18] rounded-xl px-4 py-2.5">
                <p className="text-[10px] text-white/50 uppercase tracking-wider">Total a transferir</p>
                <p className="text-white font-extrabold text-lg leading-none mt-0.5">{clp(totalGlobal)}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#9C9C95] uppercase tracking-wider">Pymes</p>
                <p className="text-[#1A1A18] font-bold text-lg leading-none mt-0.5">{grupos.length}</p>
              </div>
              <button onClick={cargar} className="ml-auto text-xs font-semibold text-[#E8553D] hover:underline">
                ↻ Actualizar
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4 pb-16">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
        )}

        {grupos.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E8E8E3] shadow-sm p-10 text-center">
            <p className="text-3xl mb-2">✅</p>
            <p className="font-bold text-[#1A1A18]">No hay pagos pendientes</p>
            <p className="text-sm text-[#9C9C95] mt-1">Todas las pymes están al día.</p>
          </div>
        ) : (
          grupos.map((g) => {
            const u = urgencia(g.desde);
            const db = g.datos_bancarios;
            const sinDatos = !db || (!db.cuenta && !db.email);
            return (
              <div key={g.pyme_id} className="bg-white rounded-2xl border border-[#E8E8E3] shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-[#F0F0EB] flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-[#1A1A18] text-[15px] truncate">{g.nombre}</p>
                    <p className="text-xs text-[#9C9C95] mt-0.5">{g.cantidad} venta{g.cantidad !== 1 ? "s" : ""} · desde {g.desde ? fmtFecha(g.desde) : "—"}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-extrabold text-lg text-[#1A1A18] leading-none">{clp(g.total)}</p>
                    <span className="inline-block mt-1.5 text-[10px] font-bold rounded-full px-2 py-0.5"
                      style={{ color: u.color, backgroundColor: u.bg, border: `1px solid ${u.border}` }}>
                      {u.label}
                    </span>
                  </div>
                </div>

                {/* Datos bancarios */}
                <div className="px-5 py-4 bg-[#FAFAF7] border-b border-[#F0F0EB]">
                  <p className="text-[10px] font-bold text-[#9C9C95] uppercase tracking-wider mb-2">Transferir a</p>
                  {sinDatos ? (
                    <p className="text-sm text-[#C0341D] bg-[#FFF0EE] border border-[#F5C6BD] rounded-xl px-3 py-2">
                      ⚠ Esta pyme aún no cargó sus datos bancarios.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                      {[
                        ["Titular", db?.titular],
                        ["RUT", db?.rut],
                        ["Banco", db?.banco],
                        ["Tipo", db?.tipo_cuenta],
                        ["Cuenta", db?.cuenta],
                        ["Email", db?.email],
                      ].filter(([, v]) => v).map(([label, v]) => (
                        <button key={label} type="button" onClick={() => copiar(String(v), `${g.pyme_id}-${label}`)}
                          className="text-left group">
                          <span className="block text-[10px] text-[#9C9C95] uppercase tracking-wide">{label}</span>
                          <span className="text-[#1A1A18] font-semibold group-hover:text-[#E8553D] transition-colors break-all">
                            {v} {copiado === `${g.pyme_id}-${label}` ? "✓" : <span className="text-[#C7C7C2] text-xs">· copiar</span>}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Detalle de ventas */}
                <div className="px-5 py-3">
                  {g.ventas.map((v) => (
                    <div key={v.id} className="flex items-center justify-between py-1.5 text-sm border-b border-[#F5F5F0] last:border-0">
                      <span className="text-[#5C5C57] truncate mr-3">
                        {v.cliente} · <span className="text-[#9C9C95]">{v.producto}</span>
                        {v.envio_gratis && (
                          <span className="ml-1.5 text-[10px] font-semibold text-[#2D8A56]">envío gratis −{clp(v.flete_descontado ?? 0)}</span>
                        )}
                      </span>
                      <span className="font-semibold text-[#1A1A18] flex-shrink-0">{clp(v.precio)}</span>
                    </div>
                  ))}
                </div>

                <div className="px-5 pb-4">
                  <button
                    onClick={() => marcarPagada(g)}
                    disabled={marcando === g.pyme_id}
                    className="w-full bg-[#1A1A18] text-white font-bold py-3 rounded-xl text-sm transition-all active:scale-[0.99] disabled:opacity-50"
                  >
                    {marcando === g.pyme_id ? "Marcando..." : "Marcar como pagada ✓"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
