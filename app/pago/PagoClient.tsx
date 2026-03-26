"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { supabase } from "@/utils/supabase";

function LoadingFallback() {
  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center">
      <div className="animate-spin h-10 w-10 border-4 border-[#E8E8E3] border-t-[#E8553D] rounded-full" />
    </div>
  );
}

export default function PagoClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const id      = searchParams.get("id");
  const courier = searchParams.get("courier");
  const error   = searchParams.get("error");

  useEffect(() => {
    if (!id) return;

    async function check() {
      const { data } = await supabase
        .from("envios")
        .select("estado, pago_status")
        .eq("id", Number(id))
        .single();

      if (data?.estado === "Creado " || data?.pago_status === "pagado") {
        router.push(`/final?id=${id}`);
        return;
      }

      // Si hay error de pago rechazado, volver a confirmación con el error
      if (error === "rejected") {
        router.push(`/confirmacion?id=${id}&courier=${courier}&error=rejected`);
        return;
      }

      // Acceso directo sin contexto — volver a confirmación
      router.push(`/confirmacion?id=${id}&courier=${courier}`);
    }

    check();
  }, [id, courier, error, router]);

  // Esta página solo redirige, siempre muestra loading
  return <LoadingFallback />;
}
