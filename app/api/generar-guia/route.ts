import { NextRequest, NextResponse } from "next/server";

const N8N_URL = "https://mochidrop-n8n.utdxt3.easypanel.host/webhook/generar-guia";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, courier } = body;

    if (!id || !courier) {
      return NextResponse.json({ error: "Faltan parámetros: id y courier son requeridos" }, { status: 400 });
    }

    console.log(`[generar-guia] Llamando N8N para envio id=${id}, courier=${courier}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000); // 30s timeout

    let n8nRes: Response;
    try {
      n8nRes = await fetch(N8N_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, courier }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const text = await n8nRes.text().catch(() => "");
    console.log(`[generar-guia] N8N respondió status=${n8nRes.status}, body=${text}`);

    if (!n8nRes.ok) {
      console.error(`[generar-guia] N8N error: status=${n8nRes.status}, body=${text}`);
      return NextResponse.json(
        { error: `N8N respondió con status ${n8nRes.status}`, detail: text },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, n8nStatus: n8nRes.status });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[generar-guia] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
