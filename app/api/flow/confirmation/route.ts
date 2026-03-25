import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { buildFlowFormData } from "@/utils/flow";
import { createClient } from "@supabase/supabase-js";

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
      console.log(`[confirmation] Pago no completado (status=${payment.status}), ignorando.`);
      return;
    }

    const envioId = String(payment.commerceOrder).replace("LINKDROP-", "");
    const courier = String(payment.optional ?? "");

    console.log(`[confirmation] Pago OK — envioId=${envioId}, courier=${courier}`);

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
      console.log(`[confirmation] Supabase actualizado OK`);
    }

    // 3. Llamar N8N para generar guía
    console.log(`[confirmation] Llamando generar-guia — envioId=${envioId}, courier=${courier}`);
    const guiaRes = await fetch(`${baseUrl}/api/generar-guia`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ id: envioId, courier }),
    });
    const guiaData = await guiaRes.json().catch(() => ({}));

    if (!guiaRes.ok) {
      console.error(`[confirmation] generar-guia falló status=${guiaRes.status}:`, guiaData);
    } else {
      console.log(`[confirmation] generar-guia OK:`, guiaData);
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
      console.error("[confirmation] Token faltante en el body");
      return new NextResponse("OK", { status: 200 });
    }

    const origin  = req.headers.get("origin") ?? req.headers.get("x-forwarded-host");
    const proto   = req.headers.get("x-forwarded-proto") ?? "https";
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
      ?? (origin?.startsWith("http") ? origin : `${proto}://${origin}`);

    console.log(`[confirmation] Token recibido, baseUrl=${baseUrl}`);

    // waitUntil mantiene la función viva en Vercel hasta que procesarPago termine
    waitUntil(procesarPago(token, baseUrl));

    // Responder 200 a Flow INMEDIATAMENTE
    return new NextResponse("OK", { status: 200 });
  } catch (err) {
    console.error("[confirmation] Error:", err);
    return new NextResponse("OK", { status: 200 });
  }
}
