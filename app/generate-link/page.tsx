import CreateLinkClient from "./CreateLinkClient";

export const metadata = {
  title: "Crear link de envío | MochiDrop Link",
  description: "Crea un link de envío personalizado en 30 segundos.",
};

export default function Page() {
  return (
    <main style={{ minHeight: "100vh", background: "#FAFAF7" }}>
      <CreateLinkClient />
    </main>
  );
}
