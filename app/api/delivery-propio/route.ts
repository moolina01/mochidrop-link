import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();

    const pymeEmail   = form.get("pymeEmail") as string;
    const pymeName    = form.get("pymeName") as string;
    const clientName  = form.get("clientName") as string;
    const clientPhone = form.get("clientPhone") as string;
    const address     = form.get("address") as string;
    const comuna      = form.get("comuna") as string;
    const precio      = form.get("precio") as string;
    const comprobante = form.get("comprobante") as File | null;

    let comprobanteUrl = "";

    if (comprobante) {
      const ext = comprobante.name.split(".").pop() ?? "jpg";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const buffer = Buffer.from(await comprobante.arrayBuffer());

      const { error: uploadError } = await supabaseAdmin.storage
        .from("comprobantes")
        .upload(path, buffer, { contentType: comprobante.type });

      if (!uploadError) {
        const { data } = supabaseAdmin.storage.from("comprobantes").getPublicUrl(path);
        comprobanteUrl = data.publicUrl;
      }
    }

    // Marcar envío como comprobante enviado
    const envioId = form.get("envioId") as string | null;
    if (envioId) {
      await supabaseAdmin.from("envios").update({ estado: "delivery_pendiente" }).eq("id", Number(envioId));
    }

    const n8nWebhook = process.env.N8N_DELIVERY_PROPIO_WEBHOOK;
    const resendKey = process.env.RESEND_API_KEY;

    if (n8nWebhook) {
      await fetch(n8nWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pymeEmail, pymeName, clientName, clientPhone, address, comuna, precio, comprobanteUrl }),
      });
    } else if (resendKey) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "LinkDrop <notificaciones@linkdrop.cl>",
          to: pymeEmail,
          subject: `Nuevo pedido delivery propio — ${clientName}`,
          html: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F5F0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F0;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr><td style="background:#1A1A18;padding:32px 40px;text-align:center;">
          <p style="margin:0 0 4px;font-size:13px;color:rgba(255,255,255,0.5);letter-spacing:0.08em;text-transform:uppercase;">LinkDrop</p>
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#fff;">Nuevo pedido de delivery</h1>
          <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.5);">${pymeName}</p>
        </td></tr>

        <!-- Alerta -->
        <tr><td style="background:#FFF0ED;padding:16px 40px;border-bottom:1px solid #F5D5CE;">
          <p style="margin:0;font-size:14px;color:#E8553D;font-weight:600;text-align:center;">
            📦 Un cliente envió su comprobante de pago — coordina la entrega
          </p>
        </td></tr>

        <!-- Datos cliente -->
        <tr><td style="padding:32px 40px 0;">
          <p style="margin:0 0 16px;font-size:11px;font-weight:700;color:#9C9C95;text-transform:uppercase;letter-spacing:0.1em;">Datos del cliente</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${[
              ["Cliente", clientName],
              ["Teléfono", clientPhone || "No indicado"],
              ["Dirección", `${address}, ${comuna}`],
              ["Monto a cobrar", `$${Number(precio).toLocaleString("es-CL")}`],
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

        <!-- Comprobante -->
        <tr><td style="padding:24px 40px;">
          ${comprobanteUrl
            ? `<p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#9C9C95;text-transform:uppercase;letter-spacing:0.1em;">Comprobante de pago</p>
               <a href="${comprobanteUrl}" style="display:inline-block;background:#1A1A18;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:600;">
                 Ver comprobante →
               </a>`
            : `<p style="margin:0;font-size:13px;color:#9C9C95;font-style:italic;">El cliente no adjuntó comprobante.</p>`
          }
        </td></tr>

        <!-- Footer -->
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
    } else {
      console.log("[delivery-propio] Sin webhook/email configurado:", { pymeEmail, clientName, comprobanteUrl });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[delivery-propio]", err);
    return NextResponse.json({ error: "Error al procesar" }, { status: 500 });
  }
}
