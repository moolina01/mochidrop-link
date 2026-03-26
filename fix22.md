Bug: el campo courier llega vacío al webhook de n8n. En Supabase, la columna courier del envío queda vacía después del pago.
Revisa /api/flow/create-order/route.ts: después de crear la orden exitosamente en Flow, debe guardar el courier en Supabase:
typescriptawait supabaseAdmin
  .from("envios")
  .update({ 
    courier,
    flow_token: data.token,
    flow_order: String(data.flowOrder),
    pago_status: "procesando",
  })
  .eq("id", Number(envioId));
Y en /api/flow/confirmation/route.ts, no confiar en payment.optional para obtener el courier. Leerlo de Supabase:
typescript// REEMPLAZAR:
const courier = String(payment.optional ?? "");

// POR:
const { data: envioData } = await supabaseAdmin
  .from("envios")
  .select("courier")
  .eq("id", Number(envioId))
  .single();
const courier = envioData?.courier ?? "";
Verificar que SUPABASE_SERVICE_ROLE_KEY esté en las variables de entorno y que el import de createClient de Supabase esté en create-order.