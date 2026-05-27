import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function initials(nombre: string): string {
  const parts = nombre.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

export async function GET(req: NextRequest) {
  const pymeId = req.nextUrl.searchParams.get("pymeId");
  if (!pymeId) return NextResponse.json({ error: "Falta pymeId" }, { status: 400 });

  // Stats de la pyme
  const { count: pymeTotal } = await supabase
    .from("envios")
    .select("*", { count: "exact", head: true })
    .eq("pyme_id", pymeId);

  // Stats de la plataforma completa
  const { count: platformTotal } = await supabase
    .from("envios")
    .select("*", { count: "exact", head: true });

  // Iniciales recientes — pyme primero, si no hay suficientes completa con plataforma
  const useGlobal = (pymeTotal ?? 0) < 10;

  let initials6: string[] = [];

  if (!useGlobal) {
    // Últimos 8 clientes de esta pyme
    const { data: pymeEnvios } = await supabase
      .from("envios")
      .select("datos_destino")
      .eq("pyme_id", pymeId)
      .order("created_at", { ascending: false })
      .limit(8);

    initials6 = (pymeEnvios ?? [])
      .map((e) => (e.datos_destino as { nombre?: string } | null)?.nombre ?? "")
      .filter(Boolean)
      .map(initials)
      .slice(0, 6);
  }

  if (initials6.length < 4) {
    // Completa con clientes recientes de la plataforma
    const { data: globalEnvios } = await supabase
      .from("envios")
      .select("datos_destino")
      .order("created_at", { ascending: false })
      .limit(20);

    const globalInits = (globalEnvios ?? [])
      .map((e) => (e.datos_destino as { nombre?: string } | null)?.nombre ?? "")
      .filter(Boolean)
      .map(initials);

    // Mezcla sin duplicar los que ya tenemos
    for (const ini of globalInits) {
      if (!initials6.includes(ini)) initials6.push(ini);
      if (initials6.length >= 6) break;
    }
  }

  // Fallback si la plataforma es muy nueva
  if (initials6.length < 4) {
    const fallback = ["MA", "JG", "CC", "RV", "LP", "SS"];
    while (initials6.length < 6) initials6.push(fallback[initials6.length]);
  }

  const displayTotal = useGlobal ? (platformTotal ?? 0) : (pymeTotal ?? 0);
  const label = useGlobal ? "envíos en LinkDrop" : "envíos de esta tienda";

  return NextResponse.json({
    total: displayTotal,
    label,
    initials: initials6.slice(0, 6),
    isGlobal: useGlobal,
  });
}
