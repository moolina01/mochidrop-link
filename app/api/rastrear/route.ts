import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const tracking = req.nextUrl.searchParams.get("tracking")?.trim();
  const pymeId   = req.nextUrl.searchParams.get("pymeId")?.trim();

  if (!tracking || !pymeId) {
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
  }

  // Buscar por tracking exacto filtrando por pyme
  const { data, error } = await supabase
    .from("envios")
    .select("id, tracking_url, courier, tracking")
    .eq("pyme_id", pymeId)
    .ilike("tracking", tracking)
    .maybeSingle();

  if (error) {
    console.error("[rastrear] Supabase error:", error.message);
    return NextResponse.json({ error: "Error al buscar" }, { status: 500 });
  }

  // Si no encontró por pyme_id (envíos viejos con pyme_id mal seteado), buscar solo por tracking
  if (!data) {
    const { data: fallback } = await supabase
      .from("envios")
      .select("id, tracking_url, courier, tracking, pyme_id")
      .ilike("tracking", tracking)
      .limit(5);

    // Buscar entre los resultados uno que tenga el mismo slug/pyme
    const match = fallback?.find((e) => e.pyme_id === pymeId) ?? fallback?.[0] ?? null;

    if (!match) {
      return NextResponse.json({ found: false });
    }

    return NextResponse.json({
      found: true,
      id: match.id,
      tracking_url: match.tracking_url ?? null,
      courier: match.courier ?? null,
    });
  }

  return NextResponse.json({
    found: true,
    id: data.id,
    tracking_url: data.tracking_url ?? null,
    courier: data.courier ?? null,
  });
}
