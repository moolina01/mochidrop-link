import { NextRequest, NextResponse } from "next/server";
import { buildFlowFormData } from "@/utils/flow";

export async function POST(req: NextRequest) {
  try {
    const { envioId, amount, email, courier } = await req.json();

    if (!envioId || !amount || !email || !courier) {
      return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;

    const params: Record<string, string | number> = {
      apiKey:          process.env.FLOW_API_KEY!,
      commerceOrder:   `LINKDROP-${envioId}`,
      subject:         `Envío courier - LinkDrop`,
      amount:          Math.round(Number(amount)),
      email:           email,
      urlConfirmation: `${baseUrl}/api/flow/confirmation`,
      urlReturn:       `${baseUrl}/api/flow/return?envioId=${envioId}&courier=${courier}`,
      paymentMethod:   9,
      optional:        courier,  // se devuelve en getStatus para usarlo en confirmation
    };

    const formData = buildFlowFormData(params);

    const res = await fetch(`${process.env.FLOW_API_URL}/payment/create`, {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    formData.toString(),
    });

    const data = await res.json();

    if (!res.ok || data.code) {
      console.error("Flow error:", data);
      return NextResponse.json(
        { error: data.message ?? "Error creando orden en Flow" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: data.url, token: data.token, flowOrder: data.flowOrder });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("create-order error:", msg);
    // Detectar variables faltantes
    if (!process.env.FLOW_API_KEY)    console.error("MISSING ENV: FLOW_API_KEY");
    if (!process.env.FLOW_SECRET_KEY) console.error("MISSING ENV: FLOW_SECRET_KEY");
    if (!process.env.FLOW_API_URL)    console.error("MISSING ENV: FLOW_API_URL");
    if (!process.env.NEXT_PUBLIC_BASE_URL) console.error("MISSING ENV: NEXT_PUBLIC_BASE_URL");
    return NextResponse.json({ error: msg || "Error interno" }, { status: 500 });
  }
}
