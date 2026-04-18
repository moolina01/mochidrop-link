import { Suspense } from "react";
import EnvioClient from "@/app/envio/EnvioClient";

function LoadingFallback() {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
      <div className="animate-spin h-10 w-10 border-4 border-gray-300 border-t-black rounded-full"></div>
    </div>
  );
}

export default async function EnvioCodePage({
  params,
}: {
  params: Promise<{ slug: string; code: string }>;
}) {
  const { code } = await params;
  const numericId = String(parseInt(code, 36));

  return (
    <Suspense fallback={<LoadingFallback />}>
      <EnvioClient envioId={numericId} />
    </Suspense>
  );
}
