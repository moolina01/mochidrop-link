import { NextRequest, NextResponse } from "next/server";
import { buildFlowFormData } from "@/utils/flow";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // Flow envía application/x-www-form-urlencoded
    const body = await req.text();
    const params = new URLSearchParams(body);
    const token = params.get("token");

    if (!token) {
      return new NextResponse("token missing", { status: 400 });
    }

    // Verificar estado del pago con Flow
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

    // status 2 = pagado
    if (payment.status === 2) {
      // commerceOrder = "LINKDROP-{envioId}"
      const envioId = String(payment.commerceOrder).replace("LINKDROP-", "");
      const courier = payment.optional ?? "";

      // Guardar token y flowOrder, marcar como pagado
      await supabaseAdmin
        .from("envios")
        .update({
          pago_status: "pagado",
          flow_token:  token,
          flow_order:  String(payment.flowOrder),
        })
        .eq("id", Number(envioId));

      // Llamar al webhook de n8n para generar la guía
      await fetch(
        "https://mochidrop-n8n.utdxt3.easypanel.host/webhook/confirmar-envio",
        {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ id: envioId, courier }),
        }
      ).catch((e) => console.error("n8n webhook error:", e));
    }

    // Flow REQUIERE respuesta 200
    return new NextResponse("OK", { status: 200 });
  } catch (err) {
    console.error("confirmation error:", err);
    // Siempre 200 para Flow
    return new NextResponse("OK", { status: 200 });
  }
}
