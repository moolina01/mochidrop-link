import { NextRequest, NextResponse } from "next/server";
import { buildFlowFormData } from "@/utils/flow";
import { createClient } from "@supabase/supabase-js";

// Se ejecuta DESPUÉS de responder 200 a Flow
async function procesarPago(token: string, baseUrl: string) {
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

    console.log(`[confirmation] payment status=${payment.status}, order=${payment.commerceOrder}`);

    if (payment.status !== 2) {
      console.log(`[confirmation] Pago no completado, ignorando.`);
      return;
    }

    const envioId = String(payment.commerceOrder).replace("LINKDROP-", "");
    const courier = payment.optional ?? "";

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
      console.error(`[confirmation] Supabase error:`, dbError);
    } else {
      console.log(`[confirmation] Supabase actualizado OK, envioId=${envioId}`);
    }

    // 3. Llamar N8N para generar guía
    console.log(`[confirmation] Llamando generar-guia para envioId=${envioId}, courier=${courier}`);
    const guiaRes = await fetch(`${baseUrl}/api/generar-guia`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ id: envioId, courier }),
    });
    const guiaData = await guiaRes.json().catch(() => ({}));

    if (!guiaRes.ok) {
      console.error(`[confirmation] generar-guia falló:`, guiaData);
    } else {
      console.log(`[confirmation] generar-guia OK`);
    }
  } catch (err) {
    console.error("[confirmation] Error en procesarPago:", err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const params = new URLSearchParams(body);
    const token = params.get("token");

    if (!token) {
      // Flow aún necesita 200
      console.error("[confirmation] Token faltante en el body");
      return new NextResponse("OK", { status: 200 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;

    // Disparar procesamiento en background — NO bloqueamos la respuesta
    void procesarPago(token, baseUrl);

    // Responder 200 a Flow INMEDIATAMENTE
    return new NextResponse("OK", { status: 200 });
  } catch (err) {
    console.error("[confirmation] Error:", err);
    return new NextResponse("OK", { status: 200 });
  }
}
