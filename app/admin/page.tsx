import { Suspense } from "react";
import AdminClient from "./AdminClient";

function LoadingFallback() {
  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center">
      <div className="animate-spin h-10 w-10 border-4 border-[#E8E8E3] border-t-[#E8553D] rounded-full" />
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AdminClient />
    </Suspense>
  );
}
