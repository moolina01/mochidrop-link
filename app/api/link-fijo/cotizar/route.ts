import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const N8N_CREAR  = "https://mochidrop-n8n.utdxt3.easypanel.host/webhook/crear-envio";
const N8N_COTIZAR = "https://mochidrop-n8n.utdxt3.easypanel.host/webhook/cotizar-envio";

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { pymeId, datos_destino } = await req.json();

    if (!pymeId || !datos_destino) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    // 1. Obtener datos de la pyme desde Supabase
    const { data: pyme, error: pymeErr } = await supabaseServer
      .from("pymes")
      .select("nombre_tienda, logo_url, email, ask_instagram, origen_comuna, origen_calle, origen_numero, origen_depto, default_largo, default_alto, default_ancho, default_peso")
      .eq("auth_id", pymeId)
      .single();

    if (pymeErr || !pyme) {
      return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
    }

    // 2. Crear el envío en N8N (igual que el flujo manual)
    const crearRes = await fetch(N8N_CREAR, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre_pyme: pyme.nombre_tienda,
        logo_pyme:   pyme.logo_url ?? "",
        pyme_id:     pymeId,
        email:       pyme.email ?? "",
        origen: {
          comuna: pyme.origen_comuna,
          calle:  pyme.origen_calle,
          numero: pyme.origen_numero,
          depto:  pyme.origen_depto ?? "",
        },
        paquete: {
          largo: Number(pyme.default_largo),
          alto:  Number(pyme.default_alto),
          ancho: Number(pyme.default_ancho),
          peso:  Number(pyme.default_peso),
        },
        ask_instagram: pyme.ask_instagram ?? false,
      }),
    });

    const crearText = await crearRes.text();
    if (!crearRes.ok || !crearText) {
      const msg = (() => { try { return JSON.parse(crearText)?.message ?? crearText; } catch { return crearText; } })();
      return NextResponse.json({ error: msg || "Error al crear el envío" }, { status: crearRes.status || 502 });
    }

    let envioId: number;
    try {
      envioId = JSON.parse(crearText)?.id;
    } catch {
      return NextResponse.json({ error: "No se recibió el ID del envío" }, { status: 502 });
    }

    if (!envioId) {
      return NextResponse.json({ error: "N8N no devolvió el ID del envío" }, { status: 502 });
    }

    // 3. Cotizar usando el flujo existente (igual que cuando el cliente llena el formulario)
    const cotizarRes = await fetch(N8N_COTIZAR, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: envioId, datos_destino }),
    });

    if (!cotizarRes.ok) {
      return NextResponse.json({ error: "Error al cotizar couriers" }, { status: cotizarRes.status });
    }

    return NextResponse.json({ id: envioId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: `Error de conexión: ${msg}` }, { status: 503 });
  }
}
