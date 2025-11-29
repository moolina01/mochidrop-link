import { Suspense } from "react";
import EnvioClient from "./EnvioClient";

function LoadingFallback() {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
      <div className="animate-spin h-10 w-10 border-4 border-gray-300 border-t-black rounded-full"></div>
    </div>
  );
}

export default function EnvioPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <EnvioClient />
    </Suspense>
  );
}
