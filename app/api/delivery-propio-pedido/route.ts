import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { pymeId, clientName, clientPhone, clientCalle, clientNumero, clientComuna, precio } = await req.json();

    if (!pymeId || !clientName || !clientPhone || !clientComuna) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    const { data: pyme, error: pymeErr } = await supabaseAdmin
      .from("pymes")
      .select("nombre_tienda, email")
      .eq("auth_id", pymeId)
      .single();

    if (pymeErr || !pyme) {
      return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
    }

    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from("envios")
      .insert({
        pyme_id: pymeId,
        courier: "delivery_propio",
        pago_status: "delivery_pendiente",
        datos_destino: {
          nombre: clientName,
          telefono: clientPhone,
          calle: clientCalle ?? "",
          numero: clientNumero ?? "",
          comuna: clientComuna,
          precio: Number(precio) || 0,
        },
      })
      .select("id")
      .single();

    if (insertErr || !inserted) {
      console.error("[delivery-propio-pedido] insert error:", insertErr);
      return NextResponse.json({ error: "Error al guardar pedido" }, { status: 500 });
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey && pyme.email) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "LinkDrop <notificaciones@linkdrop.cl>",
          to: pyme.email,
          subject: `Nuevo pedido delivery — ${clientName}`,
          html: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F5F0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F0;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="background:#1A1A18;padding:32px 40px;text-align:center;">
          <p style="margin:0 0 4px;font-size:13px;color:rgba(255,255,255,0.5);letter-spacing:0.08em;text-transform:uppercase;">LinkDrop</p>
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#fff;">Nuevo pedido de delivery</h1>
          <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.5);">${pyme.nombre_tienda}</p>
        </td></tr>
        <tr><td style="background:#F0EEFF;padding:16px 40px;border-bottom:1px solid #D8CCFF;">
          <p style="margin:0;font-size:14px;color:#7B2D8B;font-weight:600;text-align:center;">
            🏠 Un cliente solicitó delivery propio — coordina la entrega
          </p>
        </td></tr>
        <tr><td style="padding:32px 40px 0;">
          <p style="margin:0 0 16px;font-size:11px;font-weight:700;color:#9C9C95;text-transform:uppercase;letter-spacing:0.1em;">Datos del cliente</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${[
              ["Cliente", clientName],
              ["Teléfono", clientPhone],
              ["Dirección", `${clientCalle ?? ""}${clientNumero ? ` ${clientNumero}` : ""}, ${clientComuna}`],
              ["Monto delivery", `$${Number(precio).toLocaleString("es-CL")}`],
            ].map(([label, value]) => `
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #F5F5F0;width:40%;">
                <p style="margin:0;font-size:12px;color:#9C9C95;">${label}</p>
              </td>
              <td style="padding:10px 0;border-bottom:1px solid #F5F5F0;">
                <p style="margin:0;font-size:14px;font-weight:600;color:#1A1A18;">${value}</p>
              </td>
            </tr>`).join("")}
          </table>
        </td></tr>
        <tr><td style="padding:24px 40px;">
          <a href="https://linkdrop.cl/generate-link" style="display:inline-block;background:#7B2D8B;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:600;">
            Ver en LinkDrop →
          </a>
        </td></tr>
        <tr><td style="background:#F5F5F0;padding:20px 40px;text-align:center;border-top:1px solid #E8E8E3;">
          <p style="margin:0;font-size:12px;color:#9C9C95;">Enviado por <strong style="color:#5C5C57;">LinkDrop</strong></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
        }),
      });
    }

    return NextResponse.json({ id: inserted.id });
  } catch (err) {
    console.error("[delivery-propio-pedido]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
