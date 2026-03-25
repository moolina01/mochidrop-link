import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { buildFlowFormData } from "@/utils/flow";
import { createClient } from "@supabase/supabase-js";

const N8N_GENERAR_GUIA = "https://mochidrop-n8n.utdxt3.easypanel.host/webhook/generar-guia";

async function procesarPago(token: string) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
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

    console.log(`[confirmation] status=${payment.status} order=${payment.commerceOrder} optional=${payment.optional}`);

    if (payment.status !== 2) {
      console.log(`[confirmation] Pago no completado, ignorando.`);
      return;
    }

    const envioId = String(payment.commerceOrder).replace("LINKDROP-", "");
    const courier = String(payment.optional ?? "");

    // 2. Guardar en Supabase
    const { error: dbError } = await supabaseAdmin
      .from("envios")
      .update({
        pago_status: "pagado",
        flow_token:  token,
        flow_order:  String(payment.flowOrder),
        courier,
      })
      .eq("id", Number(envioId));

    if (dbError) {
      console.error(`[confirmation] Supabase error:`, dbError.message);
    } else {
      console.log(`[confirmation] Supabase OK — envioId=${envioId} courier=${courier}`);
    }

    // 3. Llamar N8N directamente
    console.log(`[confirmation] Llamando N8N: ${N8N_GENERAR_GUIA}`);
    const n8nRes = await fetch(N8N_GENERAR_GUIA, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ id: envioId, courier }),
    });
    const n8nBody = await n8nRes.text().catch(() => "");
    console.log(`[confirmation] N8N status=${n8nRes.status} body=${n8nBody}`);

  } catch (err) {
    console.error("[confirmation] Error:", err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const params = new URLSearchParams(body);
    const token = params.get("token");

    if (!token) {
      console.error("[confirmation] Token faltante");
      return new NextResponse("OK", { status: 200 });
    }

    console.log(`[confirmation] Token recibido OK`);
    waitUntil(procesarPago(token));

    return new NextResponse("OK", { status: 200 });
  } catch (err) {
    console.error("[confirmation] Error:", err);
    return new NextResponse("OK", { status: 200 });
  }
}
