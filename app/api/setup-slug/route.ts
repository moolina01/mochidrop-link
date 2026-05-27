import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export async function POST(req: NextRequest) {
  try {
    const { userId, force } = await req.json();
    if (!userId) return NextResponse.json({ error: "Falta userId" }, { status: 400 });

    // Buscar la pyme del usuario
    const { data: pyme, error: pymeErr } = await supabaseAdmin
      .from("pymes")
      .select("slug, nombre_tienda")
      .eq("auth_id", userId)
      .single();

    if (pymeErr || !pyme) {
      return NextResponse.json({ error: "Pyme no encontrada" }, { status: 404 });
    }

    // Ya tiene slug y no se fuerza regeneración — devolver tal cual
    if (pyme.slug && !force) {
      return NextResponse.json({ slug: pyme.slug });
    }

    // Generar slug desde el nombre
    const base = slugify(pyme.nombre_tienda ?? "");
    if (!base) {
      return NextResponse.json({ slug: "" });
    }

    // Intentar con sufijos si el slug ya está tomado
    let savedSlug = "";
    for (let i = 0; i < 20; i++) {
      const candidate = i === 0 ? base : `${base}-${i + 1}`;
      const { data: updated, error: updateErr } = await supabaseAdmin
        .from("pymes")
        .update({ slug: candidate })
        .eq("auth_id", userId)
        .select("slug")
        .single();

      if (!updateErr && updated?.slug) {
        savedSlug = updated.slug;
        break;
      }
    }

    return NextResponse.json({ slug: savedSlug });
  } catch (err) {
    console.error("[setup-slug]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
