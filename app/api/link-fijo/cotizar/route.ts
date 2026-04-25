import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const N8N_CREAR   = "https://mochidrop-n8n.utdxt3.easypanel.host/webhook/crear-envio";
const N8N_COTIZAR = "https://mochidrop-n8n.utdxt3.easypanel.host/webhook/cotizar-envio";

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function parseId(raw: unknown): number | null {
  if (Array.isArray(raw)) raw = raw[0];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const id = obj.id ?? obj.envio_id ?? obj.envioId;
    const num = Number(id);
    return Number.isFinite(num) && num > 0 ? num : null;
  }
  return null;
}

async function pollCotizaciones(envioId: number, attempts = 6, delayMs = 1200) {
  for (let i = 0; i < attempts; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, delayMs));
    const { data } = await supabaseServer
      .from("envios")
      .select("cotizaciones")
      .eq("id", envioId)
      .single();
    if (data?.cotizaciones && Object.keys(data.cotizaciones).length > 0) {
      return data.cotizaciones as Record<string, unknown>;
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { pymeId, datos_destino } = await req.json();

    if (!pymeId || !datos_destino) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    // 1. Obtener datos de la pyme
    const { data: pyme, error: pymeErr } = await supabaseServer
      .from("pymes")
      .select("nombre_tienda, logo_url, email, ask_instagram, origen_comuna, origen_calle, origen_numero, origen_depto, default_largo, default_alto, default_ancho, default_peso")
      .eq("auth_id", pymeId)
      .single();

    if (pymeErr || !pyme) {
      return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
    }

    if (!pyme.origen_comuna || !pyme.origen_calle || !pyme.origen_numero) {
      return NextResponse.json({ error: "La tienda no tiene dirección de origen configurada." }, { status: 400 });
    }

    // 2. Crear el envío en N8N
    const crearRes = await fetch(N8N_CREAR, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre_pyme:   pyme.nombre_tienda,
        logo_pyme:     pyme.logo_url ?? "",
        pyme_id:       pymeId,
        email:         pyme.email ?? "",
        origen: {
          comuna: pyme.origen_comuna,
          calle:  pyme.origen_calle,
          numero: pyme.origen_numero,
          depto:  pyme.origen_depto ?? "",
        },
        paquete: {
          largo: Number(pyme.default_largo) || 20,
          alto:  Number(pyme.default_alto)  || 20,
          ancho: Number(pyme.default_ancho) || 20,
          peso:  Number(pyme.default_peso)  || 1,
        },
        ask_instagram: pyme.ask_instagram ?? false,
      }),
    });

    const crearText = await crearRes.text();
    console.log("[link-fijo/cotizar] crear status:", crearRes.status, crearText?.slice(0, 200));

    if (!crearRes.ok || !crearText) {
      const msg = (() => { try { return JSON.parse(crearText)?.message ?? crearText; } catch { return crearText; } })();
      return NextResponse.json({ error: msg || "Error al crear el envío" }, { status: crearRes.status || 502 });
    }

    let parsed: unknown;
    try { parsed = JSON.parse(crearText); } catch {
      return NextResponse.json({ error: `Respuesta inesperada de N8N: ${crearText?.slice(0, 80)}` }, { status: 502 });
    }

    const envioId = parseId(parsed);
    if (!envioId) {
      console.error("[link-fijo/cotizar] Sin ID. N8N respondió:", crearText?.slice(0, 200));
      return NextResponse.json({ error: `N8N no devolvió el ID del envío. Respuesta: ${crearText?.slice(0, 80)}` }, { status: 502 });
    }

    // 3. Cotizar couriers
    const cotizarRes = await fetch(N8N_COTIZAR, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: envioId, datos_destino }),
    });

    console.log("[link-fijo/cotizar] cotizar status:", cotizarRes.status);

    if (!cotizarRes.ok) {
      return NextResponse.json({ error: "Error al cotizar couriers" }, { status: cotizarRes.status });
    }

    // 4. Obtener cotizaciones desde Supabase (N8N las guarda ahí)
    const cotizaciones = await pollCotizaciones(envioId);
    if (!cotizaciones) {
      return NextResponse.json({ error: "No se recibieron cotizaciones. Intenta de nuevo." }, { status: 502 });
    }

    // Retornar id + cotizaciones juntos, cliente no necesita consultar Supabase
    return NextResponse.json({ id: envioId, cotizaciones });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    console.error("[link-fijo/cotizar] Error:", msg);
    return NextResponse.json({ error: `Error de conexión: ${msg}` }, { status: 503 });
  }
}
