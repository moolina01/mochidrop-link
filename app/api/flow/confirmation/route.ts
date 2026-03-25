import { NextRequest, NextResponse } from "next/server";
import { buildFlowFormData } from "@/utils/flow";
import { createClient } from "@supabase/supabase-js";

const N8N_GENERAR_GUIA = "https://mochidrop-n8n.utdxt3.easypanel.host/webhook/generar-guia";

export async function POST(req: NextRequest) {
  // Flow SIEMPRE debe recibir 200 — capturamos todo
  try {
    const body = await req.text();
    const params = new URLSearchParams(body);
    const token = params.get("token");

    console.log(`[confirmation] body recibido: ${body}`);

    if (!token) {
      console.error("[confirmation] Token faltante en body");
      return new NextResponse("OK", { status: 200 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Verificar estado con Flow
    const statusParams: Record<string, string | number> = {
      apiKey: process.env.FLOW_API_KEY!,
      token,
    };
    const statusForm = buildFlowFormData(statusParams);
    const statusRes = await fetch(
      `${process.env.FLOW_API_URL}/payment/getStatus?${statusForm.toString()}`,
      { method: "GET" }
    );
    const payment = await statusRes.json();

    console.log(`[confirmation] payment completo:`, JSON.stringify(payment));

    if (payment.status !== 2) {
      console.log(`[confirmation] status=${payment.status} — no es pago completado, saliendo.`);
      return new NextResponse("OK", { status: 200 });
    }

    const envioId = String(payment.commerceOrder ?? "").replace("LINKDROP-", "");

    // Leer courier desde Supabase (más confiable que payment.optional)
    const { data: envioData } = await supabaseAdmin
      .from("envios")
      .select("courier")
      .eq("id", Number(envioId))
      .single();
    const courier = envioData?.courier ?? String(payment.optional ?? "");

    console.log(`[confirmation] Pago OK — envioId=${envioId} courier=${courier}`);

    // 2. Guardar en Supabase
    const { error: dbError } = await supabaseAdmin
      .from("envios")
      .update({
        pago_status: "pagado",
        flow_token:  token,
        flow_order:  String(payment.flowOrder ?? ""),
        courier,
      })
      .eq("id", Number(envioId));

    if (dbError) {
      console.error(`[confirmation] Supabase error: ${dbError.message}`);
    } else {
      console.log(`[confirmation] Supabase OK`);
    }

    // 3. Llamar N8N para generar guía
    console.log(`[confirmation] Llamando N8N con id=${envioId} courier=${courier}`);
    try {
      const n8nRes = await fetch(N8N_GENERAR_GUIA, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id: envioId, courier }),
      });
      const n8nBody = await n8nRes.text().catch(() => "");
      console.log(`[confirmation] N8N respondió status=${n8nRes.status} body=${n8nBody}`);
    } catch (n8nErr) {
      console.error(`[confirmation] N8N fetch error:`, n8nErr);
    }

  } catch (err) {
    console.error("[confirmation] Error general:", err);
  }

  return new NextResponse("OK", { status: 200 });
}
