import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import HubClient from "./HubClient";

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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

  const { data: pyme, error } = await supabaseServer
    .from("pymes")
    .select("auth_id, nombre_tienda, logo_url, couriers_habilitados, default_largo, default_alto, default_ancho, default_peso, info_envios")
    .eq("slug", slug)
    .single();

  console.log("[hub] slug:", slug, "| pyme:", pyme, "| error:", error);

  if (!pyme || error) {
    notFound();
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <HubClient
        slug={slug}
        pymeId={pyme.auth_id}
        nombrePyme={pyme.nombre_tienda ?? ""}
        logoPyme={pyme.logo_url ?? null}
        couriersHabilitados={pyme.couriers_habilitados ?? null}
        defaultDims={{
          largo: pyme.default_largo ?? null,
          alto: pyme.default_alto ?? null,
          ancho: pyme.default_ancho ?? null,
          peso: pyme.default_peso ?? null,
        }}
        infoEnvios={pyme.info_envios ?? null}
      />
    </Suspense>
  );
}
