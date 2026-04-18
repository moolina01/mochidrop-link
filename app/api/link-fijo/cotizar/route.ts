import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const N8N_WEBHOOK = "https://mochidrop-n8n.utdxt3.easypanel.host/webhook/crear-envio-fijo";

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

    // Obtener datos de la pyme desde Supabase
    const { data: pyme, error: pymeErr } = await supabaseServer
      .from("pymes")
      .select("nombre_tienda, logo_url, email, ask_instagram, origen_comuna, origen_calle, origen_numero, origen_depto, default_largo, default_alto, default_ancho, default_peso")
      .eq("auth_id", pymeId)
      .single();

    if (pymeErr || !pyme) {
      return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
    }

    const payload = {
      nombre_pyme: pyme.nombre_tienda,
      logo_pyme: pyme.logo_url ?? "",
      pyme_id: pymeId,
      email: pyme.email ?? "",
      origen: {
        comuna: pyme.origen_comuna,
        calle: pyme.origen_calle,
        numero: pyme.origen_numero,
        depto: pyme.origen_depto ?? "",
      },
      paquete: {
        largo: Number(pyme.default_largo),
        alto: Number(pyme.default_alto),
        ancho: Number(pyme.default_ancho),
        peso: Number(pyme.default_peso),
      },
      ask_instagram: pyme.ask_instagram ?? false,
      datos_destino,
    };

    const res = await fetch(N8N_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();

    if (!res.ok) {
      const msg = (() => { try { return JSON.parse(text)?.message ?? text; } catch { return text; } })();
      return NextResponse.json({ error: msg || `Error ${res.status}` }, { status: res.status });
    }

    if (!text) {
      return NextResponse.json({ error: "N8N no devolvió datos" }, { status: 502 });
    }

    try {
      return NextResponse.json(JSON.parse(text));
    } catch {
      return NextResponse.json({ error: `Respuesta inesperada: ${text}` }, { status: 502 });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: `Error de conexión: ${msg}` }, { status: 503 });
  }
}
