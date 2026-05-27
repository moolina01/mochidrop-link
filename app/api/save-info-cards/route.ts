import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { pymeId, infoCards } = await req.json();
    if (!pymeId || !Array.isArray(infoCards)) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("pymes")
      .update({ info_cards: infoCards })
      .eq("auth_id", pymeId);

    if (error) {
      console.error("[save-info-cards]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[save-info-cards]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
