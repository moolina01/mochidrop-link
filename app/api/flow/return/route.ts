import { NextRequest, NextResponse } from "next/server";
import { buildFlowFormData } from "@/utils/flow";

function clientRedirect(url: string) {
  return new NextResponse(
    `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=${url}"><script>window.location.href="${url}"</script></head><body></body></html>`,
    {
      status: 200,
      headers: { "Content-Type": "text/html" },
    }
  );
}

async function handleReturn(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const envioId = searchParams.get("envioId");
  const courier = searchParams.get("courier");
  const origin  = req.headers.get("origin") ?? req.headers.get("x-forwarded-host");
  const proto   = req.headers.get("x-forwarded-proto") ?? "https";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    ?? (origin?.startsWith("http") ? origin : `${proto}://${origin}`);

  try {
    // Flow puede enviar el token como query param (GET) o form data (POST)
    let token = searchParams.get("token");

    if (!token && req.method === "POST") {
      const body = await req.text();
      const params = new URLSearchParams(body);
      token = params.get("token");
    }

    if (!token || !envioId) {
      return clientRedirect(`${baseUrl}/pago?id=${envioId}&courier=${courier}&error=missing_token`);
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
      return clientRedirect(`${baseUrl}/final?id=${envioId}&courier=${courier}`);
    }

    return clientRedirect(`${baseUrl}/pago?id=${envioId}&courier=${courier}&error=rejected`);
  } catch (err) {
    console.error("return error:", err);
    return clientRedirect(`${baseUrl}/pago?id=${envioId}&courier=${courier}&error=unknown`);
  }
}

export async function GET(req: NextRequest) {
  return handleReturn(req);
}

export async function POST(req: NextRequest) {
  return handleReturn(req);
}
