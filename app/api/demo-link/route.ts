import { NextRequest, NextResponse } from "next/server";

const N8N_WEBHOOK =
  "https://mochidrop-n8n.utdxt3.easypanel.host/webhook/a58a5ae8-6128-4a3f-94fa-27581654f2bf";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const res = await fetch(N8N_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json(
      { error: err?.message ?? `HTTP ${res.status}` },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}
