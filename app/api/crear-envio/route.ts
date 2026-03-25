import { NextRequest, NextResponse } from "next/server";

const N8N_WEBHOOK = "https://mochidrop-n8n.utdxt3.easypanel.host/webhook/crear-envio";

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
      const msg = (() => {
        try { return JSON.parse(text)?.message ?? text; } catch { return text; }
      })();
      return NextResponse.json(
        { error: msg || `N8N respondió con error ${res.status}` },
        { status: res.status }
      );
    }

    if (!text) {
      return NextResponse.json({ error: "N8N no devolvió datos. Verifica que el workflow esté activo." }, { status: 502 });
    }

    try {
      return NextResponse.json(JSON.parse(text));
    } catch {
      return NextResponse.json({ error: `Respuesta inesperada de N8N: ${text}` }, { status: 502 });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json(
      { error: `No se pudo conectar con N8N: ${msg}` },
      { status: 503 }
    );
  }
}
