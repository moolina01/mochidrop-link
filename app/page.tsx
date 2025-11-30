import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full bg-white shadow-xl border border-gray-200 rounded-3xl p-8 text-center">

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="https://firebasestorage.googleapis.com/v0/b/scorelive-28a31.appspot.com/o/3.PNG?alt=media&token=2c03b09d-f445-435f-a068-dce10c8dc7b9" 
            alt="MochiDrop Logo"
            width={70}
            height={70}
            className="rounded-full"
          />
        </div>

        {/* Título */}
        <h1 className="text-3xl font-bold text-black mb-3">
          MochiDrop Link
        </h1>

        {/* Subtexto */}
        <p className="text-gray-600 text-sm leading-relaxed mb-8">
          La forma más simple y profesional para que tus clientes elijan
          su método de envío, paguen y reciban seguimiento — todo desde un
          link sin necesidad de tener página web.
        </p>

        {/* Imagen o mockup */}
        <div className="flex justify-center mb-8">
          <Image
            src="/preview.png"
            alt="Vista previa MochiDrop"
            width={300}
            height={400}
            className="rounded-2xl shadow-sm border"
          />
        </div>

        {/* Características */}
        <div className="text-left space-y-4 text-gray-700 text-sm mb-8">
          <p>✨ Tus clientes eligen Starken, Chilexpress o BlueExpress desde un link.</p>
          <p>📄 La guía se genera automáticamente y le llega a tu correo.</p>
          <p>📍 Seguimiento automático sin complicaciones.</p>
          <p>⚡ Funciona perfecto para ventas en Instagram o WhatsApp.</p>
        </div>

        {/* Botón CTA */}
        <a
          href="https://wa.me/56994284520?text=Hola,%20quiero%20activar%20MochiDrop%20Link"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full block bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition"
        >
          Activar MochiDrop Link
        </a>

        {/* Pie */}
        <p className="mt-6 text-xs text-gray-400">
          © {new Date().getFullYear()} MochiDrop — Envíos más simples para PyMEs
        </p>
      </div>
    </div>
  );
}
