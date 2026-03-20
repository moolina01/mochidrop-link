// app/generar-link/page.tsx

import CreateLinkClient from "./CreateLinkClient";

export const metadata = {
  title: "Generar link de envío | MochiDrop",
  description: "Crea links de envío profesionales en segundos",
};

export default function Page() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0B1020] to-[#0F172A]">
      <CreateLinkClient />
    </main>
  );
}
