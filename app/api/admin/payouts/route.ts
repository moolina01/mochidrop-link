import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Solo este correo puede ver/operar el panel de pagos a pymes.
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "mb212@gmail.com").toLowerCase();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// Cliente con service role: ignora RLS para poder leer todas las pymes.
const admin = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Verifica el token del llamador y confirma que es el admin autorizado.
async function assertAdmin(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return "Falta token de sesión.";

  const authClient = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await authClient.auth.getUser();
  if (error || !data.user) return "Sesión inválida.";
  if ((data.user.email ?? "").toLowerCase() !== ADMIN_EMAIL) return "No autorizado.";
  return null;
}

type PendingEnvio = {
  id: number;
  pyme_id: string;
  producto_precio: number | null;
  producto_nombre: string | null;
  datos_destino: { nombre?: string } | null;
  pagado_at: string | null;
  created_at: string;
  envio_gratis_aplicado: boolean | null;
  flete_absorbido: number | null;
};

// Monto neto a transferir por venta: producto menos el flete que absorbe la
// tienda cuando se aplicó envío gratis.
function netoPyme(e: PendingEnvio): number {
  const producto = e.producto_precio ?? 0;
  const flete = e.envio_gratis_aplicado ? (e.flete_absorbido ?? 0) : 0;
  return Math.max(0, producto - flete);
}

// GET: lista de pagos pendientes a pymes, agrupados por pyme.
export async function GET(req: NextRequest) {
  const err = await assertAdmin(req);
  if (err) return NextResponse.json({ error: err }, { status: err === "No autorizado." ? 403 : 401 });

  const { data: envios, error: enviosErr } = await admin
    .from("envios")
    .select("id, pyme_id, producto_precio, producto_nombre, datos_destino, pagado_at, created_at, envio_gratis_aplicado, flete_absorbido")
    .eq("pago_status", "pagado")
    .eq("liquidado", false)
    .gt("producto_precio", 0)
    .order("pagado_at", { ascending: true });

  if (enviosErr) return NextResponse.json({ error: enviosErr.message }, { status: 500 });

  const lista = (envios ?? []) as PendingEnvio[];
  const pymeIds = [...new Set(lista.map((e) => e.pyme_id))];

  // Datos de cada pyme (nombre + datos bancarios)
  const pymeMap: Record<string, { nombre: string; datos_bancarios: unknown }> = {};
  if (pymeIds.length > 0) {
    const { data: pymes } = await admin
      .from("pymes")
      .select("auth_id, nombre_tienda, datos_bancarios")
      .in("auth_id", pymeIds);
    for (const p of pymes ?? []) {
      pymeMap[p.auth_id] = { nombre: p.nombre_tienda ?? "Sin nombre", datos_bancarios: p.datos_bancarios ?? null };
    }
  }

  // Agrupar por pyme
  const grupos = pymeIds.map((pid) => {
    const enviosPyme = lista.filter((e) => e.pyme_id === pid);
    const total = enviosPyme.reduce((sum, e) => sum + netoPyme(e), 0);
    // La venta más antigua sin liquidar define la urgencia
    const fechas = enviosPyme
      .map((e) => e.pagado_at ?? e.created_at)
      .filter(Boolean)
      .sort();
    return {
      pyme_id: pid,
      nombre: pymeMap[pid]?.nombre ?? "Sin nombre",
      datos_bancarios: pymeMap[pid]?.datos_bancarios ?? null,
      total,
      cantidad: enviosPyme.length,
      desde: fechas[0] ?? null,
      ventas: enviosPyme.map((e) => ({
        id: e.id,
        cliente: e.datos_destino?.nombre ?? "—",
        producto: e.producto_nombre ?? "Producto",
        precio: netoPyme(e),
        envio_gratis: !!e.envio_gratis_aplicado,
        flete_descontado: e.envio_gratis_aplicado ? (e.flete_absorbido ?? 0) : 0,
        pagado_at: e.pagado_at ?? e.created_at,
      })),
    };
  });

  // Más urgente (venta más antigua) primero
  grupos.sort((a, b) => (a.desde ?? "").localeCompare(b.desde ?? ""));

  return NextResponse.json({ grupos });
}

// POST: marca ventas como liquidadas (ya transferidas a la pyme).
export async function POST(req: NextRequest) {
  const err = await assertAdmin(req);
  if (err) return NextResponse.json({ error: err }, { status: err === "No autorizado." ? 403 : 401 });

  const body = await req.json().catch(() => ({}));
  const ids: number[] = Array.isArray(body.envio_ids) ? body.envio_ids.map(Number).filter(Boolean) : [];
  if (ids.length === 0) return NextResponse.json({ error: "Sin ventas para marcar." }, { status: 400 });

  const { error: updErr } = await admin
    .from("envios")
    .update({ liquidado: true, liquidado_at: new Date().toISOString() })
    .in("id", ids);

  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
  return NextResponse.json({ ok: true, marcadas: ids.length });
}
