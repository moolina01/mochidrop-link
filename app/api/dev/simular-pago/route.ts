import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const N8N_GENERAR_GUIA = "https://mochidrop-n8n.utdxt3.easypanel.host/webhook/generar-guia";

// Solo disponible en sandbox
const isSandbox = (process.env.FLOW_API_URL ?? "").includes("sandbox");

export async function GET(req: NextRequest) {
  if (!isSandbox) {
    return NextResponse.json({ error: "Solo disponible en modo sandbox" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const envioId = searchParams.get("envioId");
  const courier = searchParams.get("courier");

  if (!envioId || !courier) {
    return NextResponse.json({ error: "Faltan envioId y courier" }, { status: 400 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Marcar como pagado
  const { error } = await supabaseAdmin
    .from("envios")
    .update({
      pago_status: "pagado",
      courier,
      flow_token: "SIMULADO",
      flow_order: "SIMULADO",
    })
    .eq("id", Number(envioId));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log(`[dev/simular-pago] Pago simulado — envioId=${envioId} courier=${courier}`);

  // Llamar N8N para generar guía
  try {
    const n8nRes = await fetch(N8N_GENERAR_GUIA, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: envioId, courier }),
    });
    const n8nBody = await n8nRes.text().catch(() => "");
    console.log(`[dev/simular-pago] N8N respondió status=${n8nRes.status} body=${n8nBody}`);
  } catch (err) {
    console.error("[dev/simular-pago] N8N error:", err);
  }

  // Redirigir al return igual que Flow
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  return NextResponse.redirect(`${base}/api/flow/return?envioId=${envioId}&courier=${courier}`);
}
