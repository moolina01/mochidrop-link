import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import HubClient from "./HubClientWrapper";

export const dynamic = "force-dynamic";

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function LoadingFallback() {
  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center">
      <div className="animate-spin h-10 w-10 border-4 border-[#E8E8E3] border-t-[#E8553D] rounded-full" />
    </div>
  );
}

export default async function PymeLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Try full query first
  let { data: pyme, error } = await supabaseServer
    .from("pymes")
    .select("auth_id, nombre_tienda, logo_url, couriers_habilitados, default_largo, default_alto, default_ancho, default_peso, info_envios, info_cards, delivery_propio_enabled, delivery_propio_precio")
    .eq("slug", slug)
    .single();

  // If query errored (e.g., missing column in older schema), retry with minimal columns
  if (error && error.code !== "PGRST116") {
    console.error("[hub] full query failed, retrying minimal:", error.message);
    const fallback = await supabaseServer
      .from("pymes")
      .select("auth_id, nombre_tienda, logo_url, couriers_habilitados")
      .eq("slug", slug)
      .single();
    pyme = fallback.data ? {
      ...fallback.data,
      default_largo: null, default_alto: null, default_ancho: null, default_peso: null,
      info_envios: null, info_cards: null, delivery_propio_enabled: false, delivery_propio_precio: null,
    } : null;
    error = fallback.error;
  }

  if (!pyme) {
    console.error("[hub] pyme not found for slug:", slug, error?.message);
    notFound();
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <HubClient
        slug={slug}
        pymeId={pyme.auth_id}
        nombrePyme={pyme.nombre_tienda ?? ""}
        logoPyme={pyme.logo_url ?? null}
        couriersHabilitados={
          Array.isArray(pyme.couriers_habilitados) && pyme.couriers_habilitados.length > 0
            ? pyme.couriers_habilitados
            : null
        }
        defaultDims={{
          largo: pyme.default_largo ?? null,
          alto: pyme.default_alto ?? null,
          ancho: pyme.default_ancho ?? null,
          peso: pyme.default_peso ?? null,
        }}
        infoEnvios={pyme.info_envios ?? null}
        infoCards={Array.isArray(pyme.info_cards) ? pyme.info_cards : null}
        deliveryPropio={pyme.delivery_propio_enabled && pyme.delivery_propio_precio
          ? { precio: pyme.delivery_propio_precio }
          : null}
      />
    </Suspense>
  );
}
