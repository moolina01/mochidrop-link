import { NextRequest, NextResponse } from "next/server";
import { buildFlowFormData } from "@/utils/flow";

async function handleReturn(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const envioId = searchParams.get("envioId");
  const courier = searchParams.get("courier");
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;

  try {
    // Flow puede enviar el token como query param (GET) o form data (POST)
    let token = searchParams.get("token");

    if (!token && req.method === "POST") {
      const body = await req.text();
      const params = new URLSearchParams(body);
      token = params.get("token");
    }

    if (!token || !envioId) {
      return NextResponse.redirect(
        `${baseUrl}/pago?id=${envioId}&courier=${courier}&error=missing_token`
      );
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

    return NextResponse.redirect(
      `${baseUrl}/pago?id=${envioId}&courier=${courier}&error=rejected`
    );
  } catch (err) {
    console.error("return error:", err);
    return NextResponse.redirect(
      `${baseUrl}/pago?id=${envioId}&courier=${courier}&error=unknown`
    );
  }
}

export async function GET(req: NextRequest) {
  return handleReturn(req);
}

export async function POST(req: NextRequest) {
  return handleReturn(req);
}
