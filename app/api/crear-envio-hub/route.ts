import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const N8N_CREAR = "https://mochidrop-n8n.utdxt3.easypanel.host/webhook/crear-envio";

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { pymeId, largo, alto, ancho, peso } = await req.json();

    if (!pymeId || !largo || !alto || !ancho || !peso) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    // Obtener datos completos de la pyme (igual que el dashboard)
    const { data: pyme, error: pymeErr } = await supabaseServer
      .from("pymes")
      .select("nombre_tienda, logo_url, email, ask_instagram, origen_comuna, origen_calle, origen_numero, origen_depto, couriers_habilitados, slug, links_creados, limite_links, delivery_propio_enabled, delivery_propio_precio, delivery_propio_telefono, delivery_propio_banco, delivery_propio_cuenta, delivery_propio_titular, delivery_propio_rut, delivery_propio_email")
      .eq("auth_id", pymeId)
      .single();

    if (pymeErr || !pyme) {
      return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
    }

    if (!pyme.origen_comuna || !pyme.origen_calle || !pyme.origen_numero) {
      return NextResponse.json({ error: "Configura tu dirección de origen en el dashboard antes de crear envíos." }, { status: 400 });
    }

    // Verificar límite de links igual que el dashboard
    if ((pyme.links_creados ?? 0) >= (pyme.limite_links ?? 5)) {
      return NextResponse.json({ error: "Alcanzaste el límite de links de tu plan." }, { status: 403 });
    }

    // Mismo payload que el dashboard
    const payload = {
      nombre_pyme:   pyme.nombre_tienda,
      logo_pyme:     pyme.logo_url ?? "",
      pyme_id:       pymeId,
      email:         pyme.email ?? "",
      origen: {
        comuna: pyme.origen_comuna,
        calle:  pyme.origen_calle,
        numero: pyme.origen_numero,
        depto:  pyme.origen_depto ?? "",
      },
      paquete: { largo: Number(largo), alto: Number(alto), ancho: Number(ancho), peso: Number(peso) },
      ask_instagram: pyme.ask_instagram ?? false,
      delivery_propio: pyme.delivery_propio_enabled && pyme.delivery_propio_precio ? {
        enabled:  true,
        precio:   pyme.delivery_propio_precio,
        telefono: pyme.delivery_propio_telefono ?? "",
        banco:    pyme.delivery_propio_banco    ?? "",
        cuenta:   pyme.delivery_propio_cuenta   ?? "",
        titular:  pyme.delivery_propio_titular  ?? "",
        rut:      pyme.delivery_propio_rut      ?? "",
        email:    pyme.delivery_propio_email     ?? "",
      } : null,
    };

    const res  = await fetch(N8N_CREAR, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });

    const text = await res.text();
    console.log("[crear-envio-hub] N8N status:", res.status, "body:", text?.slice(0, 200));

    if (!res.ok) {
      const msg = (() => { try { return JSON.parse(text)?.message ?? text; } catch { return text; } })();
      return NextResponse.json({ error: msg || "Error al crear envío" }, { status: res.status || 502 });
    }

    if (!text) {
      return NextResponse.json({ error: "N8N no devolvió datos. Verifica que el workflow esté activo." }, { status: 502 });
    }

    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch {
      return NextResponse.json({ error: `Respuesta inesperada: ${text.slice(0, 80)}` }, { status: 502 });
    }

    const raw = Array.isArray(parsed) ? parsed[0] : parsed;
    const id  = (raw as Record<string, unknown>)?.id ?? (raw as Record<string, unknown>)?.envio_id;

    if (!id) {
      return NextResponse.json({ error: "N8N no devolvió el ID del envío." }, { status: 502 });
    }

    // Actualizar el envío con pyme_id, couriers_habilitados y delivery_propio — igual que el dashboard
    await supabaseServer
      .from("envios")
      .update({
        pyme_id: pymeId,
        couriers_habilitados: pyme.couriers_habilitados ?? [],
        delivery_propio: pyme.delivery_propio_enabled && pyme.delivery_propio_precio ? {
          enabled:  true,
          precio:   pyme.delivery_propio_precio,
          telefono: pyme.delivery_propio_telefono ?? "",
          banco:    pyme.delivery_propio_banco    ?? "",
          cuenta:   pyme.delivery_propio_cuenta   ?? "",
          titular:  pyme.delivery_propio_titular  ?? "",
          rut:      pyme.delivery_propio_rut      ?? "",
          email:    pyme.delivery_propio_email    ?? "",
        } : null,
      })
      .eq("id", Number(id));

    // Descontar del plan — igual que el dashboard
    await supabaseServer
      .from("pymes")
      .update({ links_creados: (pyme.links_creados ?? 0) + 1 })
      .eq("auth_id", pymeId);

    return NextResponse.json({ id, slug: pyme.slug ?? "" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    console.error("[crear-envio-hub] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}
