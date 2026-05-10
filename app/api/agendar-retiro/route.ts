import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const N8N_AGENDAR_RETIRO = process.env.N8N_AGENDAR_RETIRO_WEBHOOK ?? "";

// Mapea comuna → { city, state } según región chilena
const COMUNA_REGION: Record<string, { city: string; state: string }> = (() => {
  const reg = (city: string, state: string, comunas: string[]) =>
    Object.fromEntries(comunas.map((c) => [c, { city, state }]));

  return {
    ...reg("Santiago", "RM", [
      "alhué","buin","calera de tango","cerrillos","cerro navia","colina","conchalí",
      "el bosque","el monte","estación central","huechuraba","independencia","isla de maipo",
      "la cisterna","la florida","la granja","la pintana","la reina","lampa","las condes",
      "lo barnechea","lo espejo","lo prado","macul","maipú","maría pinto","melipilla",
      "padre hurtado","paine","pedro aguirre cerda","peñaflor","peñalolén","pirque",
      "providencia","pudahuel","puente alto","quilicura","quinta normal","recoleta","renca",
      "san bernardo","san joaquín","san josé de maipo","san miguel","san ramón","santiago",
      "talagante","til til","vitacura","ñuñoa","curacaví","paine","peñaflor","padre hurtado",
    ]),
    ...reg("Arica", "XV", ["arica","camarones","putre","general lagos"]),
    ...reg("Iquique", "I", ["iquique","alto hospicio","pozo almonte","pica","huara","colchane","camiña"]),
    ...reg("Antofagasta", "II", ["antofagasta","mejillones","sierra gorda","taltal","calama","san pedro de atacama","tocopilla","maría elena"]),
    ...reg("Copiapó", "III", ["copiapó","caldera","chañaral","diego de almagro","vallenar","alto del carmen","freirina","huasco","tierra amarilla"]),
    ...reg("La Serena", "IV", ["la serena","coquimbo","andacollo","la higuera","ovalle","illapel","los vilos","salamanca","vicuña","paihuano","monte patria","combarbalá","punitaqui","río hurtado","canela"]),
    ...reg("Valparaíso", "V", ["valparaíso","viña del mar","quilpué","villa alemana","quillota","la calera","la cruz","limache","olmué","san antonio","cartagena","el quisco","el tabo","santo domingo","los andes","san esteban","calle larga","rinconada","san felipe","putaendo","santa maría","panquehue","llaillay","catemu","casablanca","juan fernández","isla de pascua","petorca","la ligua","papudo","zapallar","cabildo","hijuelas","nogales","puchuncaví","quintero"]),
    ...reg("Rancagua", "VI", ["rancagua","machalí","graneros","mostazal","codegua","coinco","coltauco","doñihue","requínoa","rengo","san fernando","san vicente","peumo","pichidegua","las cabras","pichilemu","santa cruz","chépica","chimbarongo","la estrella","lolol","malloa","marchihue","nancagua","navidad","olivar","palmilla","paredones","peralillo","placilla","quinta de tilcoco","rauco"]),
    ...reg("Talca", "VII", ["talca","constitución","curicó","linares","cauquenes","parral","san javier","molina","maule","longaví","colbún","curepto","empedrado","hualañé","licantén","pelarco","pelluhue","retiro","río claro","romeral","sagrada familia","san clemente","san rafael","teno","villa alegre","yerbas buenas","quillón"]),
    ...reg("Chillán", "XVI", ["chillán","chillán viejo","san carlos","quirihue","bulnes","coihueco","yungay","cobquecura","coelemu","el carmen","ninhue","ñiquén","pemuco","portezuelo","ránquil","san ignacio","san nicolás","trehuaco"]),
    ...reg("Concepción", "VIII", ["concepción","talcahuano","hualpén","coronel","lota","tomé","penco","hualqui","santa juana","florida","chiguayante","san pedro de la paz","los ángeles","nacimiento","mulchén","yumbel","lebu","cañete","los álamos","arauco","curanilahue","alto biobío","antuco","cabrero","negrete","quilaco","quilleco","san rosendo","santa bárbara","san gregorio","san pedro","tucapel"]),
    ...reg("Temuco", "IX", ["temuco","padre las casas","lautaro","villarrica","pucón","angol","victoria","nueva imperial","carahue","freire","pitrufquén","cunco","melipeuco","cholchol","collipulli","curacautín","curarrehue","ercilla","galvarino","loncoche","lonquimay","los sauces","lumaco","perquenco","purén","renaico","toltén","traiguén","tirúa","contulmo"]),
    ...reg("Valdivia", "XIV", ["valdivia","la unión","río bueno","futrono","lago ranco","los lagos","máfil","mariquina","lanco","panguipulli","corral"]),
    ...reg("Puerto Montt", "X", ["puerto montt","osorno","puerto varas","llanquihue","frutillar","los muermos","maullín","calbuco","ancud","castro","quellón","chonchi","río negro","purranque","fresia","chaitén","cochamó","futaleufú","hualaihué","palena","puerto octay","puqueldón","queilén","quemchi","quinchao","san juan de la costa","san pablo"]),
    ...reg("Coyhaique", "XI", ["coyhaique","aysén","chile chico","cochrane","cisnes","guaitecas","lago verde","río ibáñez"]),
    ...reg("Punta Arenas", "XII", ["punta arenas","puerto natales","puerto williams","laguna blanca","primavera","río verde","timaukel","torres del paine"]),
  };
})();

function getCityAndState(comuna: string): { city: string; state: string } {
  const key = comuna.toLowerCase().trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "").trim();

  for (const [k, v] of Object.entries(COMUNA_REGION)) {
    const kNorm = k.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (kNorm === key) return v;
  }
  // Fallback: usar la misma comuna como ciudad y estado vacío
  return { city: comuna, state: "" };
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function normalizeCarrier(courier: string) {
  const value = courier.toLowerCase().trim();

  if (value.startsWith("starken")) return "starken";
  if (value.startsWith("chilexpress")) return "chilexpress";
  if (value.startsWith("blue")) return "blueexpress";
  if (value.startsWith("99") || value.startsWith("noventa")) return "noventa9minutos";

  return value;
}


export async function POST(req: NextRequest) {
  try {
    const { pyme_id, envio_ids, courier, time_from, time_to, pickup_date, reagendar, current_attempts } = await req.json();

    if (!pyme_id || !envio_ids?.length || !courier || time_from == null || time_to == null) {
      return NextResponse.json({ error: "Faltan parámetros requeridos" }, { status: 400 });
    }

    // Verificar que los envíos pertenecen a esta pyme y tienen guía generada
    let query = supabaseAdmin
      .from("envios")
      .select("id, tracking, datos_paquetes, datos_destino, codigo_postal_origen, pickup_attempts")
      .in("id", envio_ids)
      .eq("pyme_id", pyme_id)
      .not("tracking_url", "is", null);

    // Al reagendar no filtramos por pickup_agendado: false
    if (!reagendar) query = query.eq("pickup_agendado", false);

    const { data: envios, error: fetchErr } = await query;

    console.log("[agendar-retiro] fetchErr:", fetchErr, "envios:", envios);
    if (fetchErr || !envios?.length) {
      return NextResponse.json({ error: "Envíos no válidos" }, { status: 400 });
    }

    if (!N8N_AGENDAR_RETIRO) {
      console.warn("[agendar-retiro] N8N_AGENDAR_RETIRO_WEBHOOK no configurado");
      return NextResponse.json({ error: "Webhook de agendamiento no configurado" }, { status: 503 });
    }

    // Obtener datos de la pyme
    const { data: pyme, error: pymeErr } = await supabaseAdmin
      .from("pymes")
      .select("nombre_tienda, email, origen_calle, origen_numero, origen_comuna")
      .eq("auth_id", pyme_id)
      .single();

    console.log("[agendar-retiro] pymeErr:", pymeErr, "pyme:", pyme, "pyme_id:", pyme_id);
    if (pymeErr || !pyme) {
      return NextResponse.json({ error: "Pyme no encontrada" }, { status: 404 });
    }

    const { city, state } = getCityAndState(pyme.origen_comuna ?? "");
    const tracking_numbers = envios.map((e) => e.tracking).filter(Boolean);
    const total_packages   = envios.length;
    const total_weight     = envios.reduce((sum, e) => {
      const peso = (e.datos_paquetes as { peso?: number } | null)?.peso ?? 0;
      return sum + peso;
    }, 0);

    const body = {
      nombre_pyme:     pyme.nombre_tienda,
      carrier: normalizeCarrier(courier),
      envio_ids:       envios.map((e) => e.id),
      tracking_numbers,
      total_packages,
      total_weight,
      pickup_date:   pickup_date ?? null,
      time_from,
      time_to,
      origin: {
        name:       pyme.nombre_tienda,
        phone:      "",
        email:      pyme.email ?? "",
        street:     pyme.origen_calle ?? "",
        number:     pyme.origen_numero ?? "",
        city,
        state,
        country:    "CL",
        postalCode: (envios[0] as { codigo_postal_origen?: string }).codigo_postal_origen ?? "",
      },
    };

    console.log("[agendar-retiro] Enviando a N8N:", JSON.stringify(body));

    const n8nRes = await fetch(N8N_AGENDAR_RETIRO, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const n8nRaw = await n8nRes.text().catch(() => "");
    console.log("[agendar-retiro] N8N raw:", n8nRes.status, n8nRaw);

    let n8nData: Record<string, unknown> = {};
    try { n8nData = JSON.parse(n8nRaw); } catch { n8nData = {}; }
    if (Array.isArray(n8nData)) n8nData = (n8nData as Record<string, unknown>[])[0] ?? {};

    console.log("[agendar-retiro] n8nData parsed:", n8nData);

    if (!n8nRes.ok || n8nData.success === false) {
      console.log("[agendar-retiro] Fallo — ok:", n8nRes.ok, "success:", n8nData.success);
      return NextResponse.json({
        error: (n8nData.error as string) ?? "Error al agendar pickup con Envia",
        detail: n8nData.detail ?? null,
      }, { status: 502 });
    }

    // Buscar el pickup recién creado por tracking del primer envío
    const firstTracking = tracking_numbers[0];
    let pickupUuid: string | null = null;
    if (firstTracking) {
      const { data: pickupRow } = await supabaseAdmin
        .from("pickups")
        .select("id")
        .filter("tracking_numbers", "cs", JSON.stringify([firstTracking]))
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!pickupRow) {
        // Fallback: buscar como número
        const { data: pickupRowNum } = await supabaseAdmin
          .from("pickups")
          .select("id")
          .filter("tracking_numbers", "cs", JSON.stringify([Number(firstTracking)]))
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        pickupUuid = (pickupRowNum as { id?: string } | null)?.id ?? null;
      } else {
        pickupUuid = (pickupRow as { id?: string } | null)?.id ?? null;
      }
    }

    console.log("[agendar-retiro] pickup UUID encontrado:", pickupUuid);

    const newAttempts = reagendar ? (Number(current_attempts ?? 0) + 1) : 0;
    const updatePayload: Record<string, unknown> = {
      pickup_agendado:   true,
      pickup_date:       pickup_date ?? null,
      pickup_time_from:  time_from,
      pickup_time_to:    time_to,
      pickup_status:     "scheduled",
      pickup_attempts:   newAttempts,
    };
    if (pickupUuid) updatePayload.pickup_id = pickupUuid;

    const { error: updateErr } = await supabaseAdmin
      .from("envios")
      .update(updatePayload)
      .in("id", envio_ids);
    console.log("[agendar-retiro] update:", updateErr ?? "OK", "ids:", envio_ids);

    return NextResponse.json({ ok: true, pickup_id: pickupUuid });
  } catch (err) {
    console.error("[agendar-retiro]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
