import { NextRequest, NextResponse } from "next/server";
import { buildFlowFormData } from "@/utils/flow";

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const envioId = searchParams.get("envioId");
    const courier  = searchParams.get("courier");

    // Flow envía el token como form data
    const body   = await req.text();
    const params = new URLSearchParams(body);
    const token  = params.get("token");

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;

    if (!token || !envioId) {
      return NextResponse.redirect(`${baseUrl}/pago?id=${envioId}&courier=${courier}&error=missing_token`);
    }

    // Verificar estado con Flow
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
      return NextResponse.redirect(`${baseUrl}/final?id=${envioId}&courier=${courier}`);
    }

    // Rechazado o pendiente → volver a pago con error
    return NextResponse.redirect(
      `${baseUrl}/pago?id=${envioId}&courier=${courier}&error=rejected`
    );
  } catch (err) {
    console.error("return error:", err);
    const { searchParams } = new URL(req.url);
    const envioId = searchParams.get("envioId");
    const courier  = searchParams.get("courier");
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/pago?id=${envioId}&courier=${courier}&error=unknown`
    );
  }
}
