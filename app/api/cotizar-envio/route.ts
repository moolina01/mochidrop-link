import { NextRequest, NextResponse } from "next/server";

const N8N_WEBHOOK = "https://mochidrop-n8n.utdxt3.easypanel.host/webhook/cotizar-envio";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetch(N8N_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const text = await res.text();

    if (!res.ok) {
      return NextResponse.json(
        { error: text || `Error ${res.status}` },
        { status: res.status }
      );
    }

    // N8N puede devolver cuerpo vacío en éxito
    if (!text) {
      return NextResponse.json({ ok: true });
    }

    try {
      return NextResponse.json(JSON.parse(text));
    } catch {
      return NextResponse.json({ ok: true, raw: text });
    }
  } catch (err) {
    console.error("cotizar-envio proxy error:", err);
    return NextResponse.json({ error: "Error conectando con el servidor" }, { status: 500 });
  }
}
