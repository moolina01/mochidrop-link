"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useState } from "react";
import { supabase } from "@/utils/supabase";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const ID_ENVIO = 3719603; 
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
  
    const form = e.target;
    const nombre = form.nombre.value.trim();
    const email = form.email.value.trim();
    const logoFile = form.logo.files?.[0] || null;
  
    // 🌟 VALIDACIÓN DE CAMPOS
    if (!nombre || !email) {
      alert("Por favor completa todos los campos obligatorios.");
      return;
    }
  
    setLoading(true); // bloquear botón
  
    let logoUrl = "";
  
    try {
      // 1) SUBIR LOGO SI EXISTE
      if (logoFile) {
        const ext = logoFile.name.split(".").pop();
        const fileName = `logos/${Date.now()}.${ext}`;
  
        const { error: uploadErr } = await supabase.storage
          .from("mochidrop")
          .upload(fileName, logoFile);
  
        if (uploadErr) throw uploadErr;
  
        const { data: urlData } = supabase.storage
          .from("mochidrop")
          .getPublicUrl(fileName);
  
        logoUrl = urlData.publicUrl;
      }
  
      // 2) WEBHOOK
      const res = await fetch(
        "https://mochidrop-n8n.utdxt3.easypanel.host/webhook/a58a5ae8-6128-4a3f-94fa-27581654f2bf",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_envio: ID_ENVIO,
            nombre_pyme: nombre,
            email: email,
            logo_url: logoUrl,
          }),
        }
      );
  
      if (!res.ok) {
        throw new Error("Webhook error");
      }
  
      // 3) MOSTRAR MODAL CUANDO REALMENTE TERMINA
      setModalOpen(true);
  
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error generando el link.");
    } finally {
      setLoading(false);
    }
  };
  

  

  return (
    <div className="font-sans text-gray-900 bg-white">

      {/* ---------------- HEADER ---------------- */}
{/* ---------------- HEADER (CON MENÚ HAMBURGUESA) ---------------- */}
<header className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-xl border-b border-gray-200 shadow-sm">
  <style>{`
    html { scroll-behavior: smooth; }
  `}</style>

  <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">

    {/* LOGO + NAME */}
    <div className="flex items-center gap-3">
    <div className="h-9 w-9 rounded-xl bg-black text-white flex items-center justify-center font-bold text-sm shadow-md">
        M
      </div> 
{/* <div className="h-9 w-9 rounded-xl bg-black text-white flex items-center justify-center font-bold text-sm shadow-md">
<Image
    src="/3.png"        // <-- cambia por el nombre real del archivo
    alt="MochiDrop Logo"
    width={32}                // tamaño pequeño, profesional
    height={32}
    className="rounded-xl object-cover"
  />
</div> */}

      <span className="text-xl font-semibold tracking-tight">
        MochiDrop <span className="text-[#0E0F28]">Link</span>
      </span>
    </div>

    {/* DESKTOP NAV */}
    <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
      {[
        { name: "Cómo funciona", id: "funciona" },
        { name: "Beneficios", id: "beneficios" },
        { name: "Generar link", id: "producto" },
        { name: "Contacto", id: "cta" }
      ].map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className="
            relative text-gray-700 hover:text-black transition
            after:absolute after:left-0 after:-bottom-1
            after:w-0 after:h-[2px] after:bg-black
            hover:after:w-full after:transition-all after:duration-300
          "
        >
          {item.name}
        </a>
      ))}
    </nav>

    {/* DESKTOP CTA */}
    <a
      href="https://wa.me/56994284520?text=Hola,%20quiero%20saber%20más%20sobre%20MochiDrop"
      className="hidden md:block bg-black text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-gray-900 transition shadow"
    >
      Quiero saber más
    </a>

    {/* HAMBURGER BUTTON (MOBILE) */}
    <button
      onClick={() => setMenuOpen(!menuOpen)}
      className="md:hidden text-3xl text-gray-700"
    >
      {menuOpen ? "✕" : "☰"}
    </button>
  </div>

  {/* MOBILE MENU */}
  {menuOpen && (
   <div className="md:hidden absolute inset-x-0 top-full bg-white border-b shadow-xl">

      <nav className="flex flex-col px-6 py-6 gap-4 text-lg font-medium">

        <a href="#funciona" onClick={() => setMenuOpen(false)} className="text-gray-800 hover:text-black transition">
          Cómo funciona
        </a>

        <a href="#beneficios" onClick={() => setMenuOpen(false)} className="text-gray-800 hover:text-black transition">
          Beneficios
        </a>

        <a href="#producto" onClick={() => setMenuOpen(false)} className="text-gray-800 hover:text-black transition">
          Generar link
        </a>

        <a href="#cta" onClick={() => setMenuOpen(false)} className="text-gray-800 hover:text-black transition">
          Contacto
        </a>

        <a
          href="https://wa.me/56994284520?text=Hola,%20quiero%20saber%20más%20sobre%20MochiDrop"
          onClick={() => setMenuOpen(false)}
          className="mt-2 bg-black text-white text-center py-3 rounded-xl font-semibold hover:bg-gray-900 transition"
        >
          Quiero saber más
        </a>

      </nav>
      
    </div>
  )}
  
</header>
<TickerBar/>
      {/* ---------------- HERO ---------------- */}
     {/* ---------------- HERO DIVIDIDO (PREMIUM) ---------------- */}
<section className="pt-13 pb-32 bg-gradient-to-b from-white to-gray-50 px-6">
  <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">

    {/* TEXTO */}
    <div className="text-left">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight text-gray-900">
        Profesionaliza tus envíos 
          <br />
          <span className="text-black/80">con un solo link</span>
        </h1>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.7 }}
        className="mt-5 text-gray-600 text-lg max-w-lg"
      >
     Tus clientes eligen courier, pagan el envío y reciben su tracking sin que tengas que explicar nada.
      </motion.p>

      {/* BADGE */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.7 }}
        className="mt-6 inline-flex items-center gap-2 bg-[#0E0F28] text-white px-4 py-2 rounded-full text-sm shadow-md"
      >
        <span className="text-xs font-semibold uppercase tracking-wide opacity-80">
          Nuevo
        </span>
        <span className="font-medium">+10 Links generados este mes</span>
      </motion.div>

      {/* BOTONES */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.7 }}
        className="mt-8 flex gap-4"
      >
        <a
          href="https://wa.me/56994284520?text=Hola,%20quiero%20saber%20más%20sobre%20MochiDrop"
          className="bg-[#0E0F28] text-white px-7 py-3 rounded-xl font-semibold hover:bg-gray-900 transition shadow-lg"
        >
          Quiero saber más
        </a>

        <a
          href="#funciona"
          className="px-7 py-3 rounded-xl font-semibold border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
        >
          Ver cómo funciona
        </a>
      </motion.div>
    </div>

    {/* MOCKUP */}
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.25, duration: 0.7 }}
      className="flex justify-center relative"
    >
      {/* Glow suave detrás */}
      <div className="absolute -top-10 -left-10 w-72 h-72 bg-black/5 rounded-full blur-3xl"></div>

      <Image
        src="/preview.png"
        alt="Vista previa MochiDrop"
        width={320}
        height={320}
        className="rounded-3xl shadow-2xl border border-gray-100"
      />
    </motion.div>

  </div>
</section>


      {/* ---------------- COMO FUNCIONA ---------------- */}
     {/* ---------------- COMO FUNCIONA (NUEVO DISEÑO PREMIUM) ---------------- */}
{/* ---------------- COMO FUNCIONA – TIMELINE PREMIUM ---------------- */}
<section id="funciona" className="bg-gray-100 py-28 px-6">
  <div className="max-w-6xl mx-auto">

    {/* Título */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      viewport={{ once: true }}
      className="text-center"
    >
      <h2 className="text-4xl font-bold tracking-tight text-gray-900">
      El flujo completo en un solo link
      </h2>
      <p className="text-gray-600 mt-4 max-w-xl mx-auto text-lg">
      Un proceso que se siente más ordenado para ti y más claro para tus clientes
      </p>
    </motion.div>

    {/* Timeline */}
    <div className="mt-20 relative">

      {/* Línea central */}
      <div className="hidden md:block absolute top-1/2 left-0 w-full border-t border-gray-300"></div>

      <div className="grid md:grid-cols-3 gap-12 relative z-10">

        {/* Paso 1 */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="flex flex-col items-center text-center"
        >
          <div className="bg-white shadow-xl border border-gray-200 rounded-3xl p-8 max-w-xs">
            <div className="text-5xl mb-4">📤</div>
            <h3 className="font-semibold text-xl text-gray-900">1. Envías los datos</h3>
            <p className="text-gray-600 mt-3 text-sm leading-relaxed">
              Pegas los datos del cliente y MochiDrop los transforma en un link de envio.
            </p>
          </div>

          {/* Flecha hacia el paso 2 */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="hidden md:block mt-4 text-4xl text-gray-400"
          >
            ➝
          </motion.div>
        </motion.div>

        {/* Paso 2 */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          viewport={{ once: true }}
          className="flex flex-col items-center text-center"
        >
          <div className="bg-white shadow-xl border border-gray-200 rounded-3xl p-8 max-w-xs">
            <div className="text-5xl mb-4">🚚</div>
            <h3 className="font-semibold text-xl text-gray-900">2. Cliente elige courier</h3>
            <p className="text-gray-600 mt-3 text-sm leading-relaxed">
              Starken, Chilexpress o BlueExpress. Todo desde el mismo link.
            </p>
          </div>

          {/* Flecha hacia el paso 3 */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="hidden md:block mt-4 text-4xl text-gray-400"
          >
            ➝
          </motion.div>
        </motion.div>

        {/* Paso 3 */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          viewport={{ once: true }}
          className="flex flex-col items-center text-center"
        >
          <div className="bg-white shadow-xl border border-gray-200 rounded-3xl p-8 max-w-xs">
            <div className="text-5xl mb-4">📍</div>
            <h3 className="font-semibold text-xl text-gray-900">3. Seguimiento y guía</h3>
            <p className="text-gray-600 mt-3 text-sm leading-relaxed">
              El cliente recibe tracking automático y tú recibes la guía lista para imprimir.
            </p>
          </div>
        </motion.div>

      </div>
    </div>
  </div>
</section>

      {/* ---------------- BENEFICIOS (NUEVO, COMPLETO) ---------------- */}
      <section id="beneficios" className="py-28 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-4xl font-bold tracking-tight text-gray-900">Potencia tu negocio</h2>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto text-lg">
              Un link de envio diseñado para darte credibilidad, reducir tu carga operativa y transformar tus envíos.
            </p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            transition={{ staggerChildren: 0.15 }}
            className="mt-20 grid md:grid-cols-3 gap-10"
          >

            {
              [
                {
                  icon: "✨",
                  title: "Profesionaliza tu negocio",
                  text: "Tus clientes ven un link claro, ordenado y con tu marca. Se siente como comprarle a una tienda grande.",
                },
                {
                  icon: "📦",
                  title: "Guías y tracking automáticos",
                  text: "No más filas en Starken o Chilexpress. La guía se genera sola y el cliente recibe su seguimiento.",
                },
                {
                  icon: "⚡",
                  title: "Menos mensajes y menos trabajo",
                  text: "El link explica tarifas, opciones y tiempos. Tus clientes dejan de preguntarte lo mismo una y otra vez.",
                },
              ]
              
         .map((b, i) => (
              <motion.div
                key={i}
                variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                whileHover={{ scale: 1.05, y: -4 }}
                className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition cursor-default"
              >
                <div className="text-4xl mb-4">{b.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900">{b.title}</h3>
                <p className="text-gray-600 mt-3 text-sm leading-relaxed">{b.text}</p>
              </motion.div>
              
            ))}

          </motion.div>
        </div>
      </section>

  {/* ---------------- GENERAR TU LINK ---------------- */}
<section id="producto" className="bg-gray-50 py-28 px-6">
  <div className="max-w-5xl mx-auto text-center">

    <motion.h2
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      viewport={{ once: true }}
      className="text-4xl font-bold tracking-tight"
    >
      Genera tu link para tu PyME
    </motion.h2>

    <motion.p
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.7 }}
      viewport={{ once: true }}
      className="text-gray-600 mt-3 max-w-xl mx-auto text-lg"
    >
      Personalízalo con el nombre de tu marca y visualiza cómo lo verán tus clientes.
    </motion.p>

    {/* Card */}
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.7 }}
      viewport={{ once: true }}
      className="mt-14 bg-white p-10 rounded-3xl shadow-xl border mx-auto max-w-2xl"
    >
      <form
        onSubmit={handleSubmit}
       className="space-y-6">

        {/* Nombre de la pyme */}
        <div className="text-left">
          <label className="block font-medium text-gray-800 mb-1">
            Nombre de tu PyME
          </label>
          <input
  name="nombre"
  type="text"
  placeholder="Ej: Moments joyas"
  className="w-full border rounded-xl px-4 py-3 text-gray-700"
/>

        </div>

        {/* Logo */}
        <div className="text-left">
          <label className="block font-medium text-gray-800 mb-1">
            Sube tu logo (opcional)
          </label>
          <input
  name="logo"
  type="file"
  accept="image/*"
  className="w-full border rounded-xl px-4 py-3 text-gray-700"
/>
        </div>

        {/* Email */}
        <div className="text-left">
          <label className="block font-medium text-gray-800 mb-1">
            Tu correo
          </label>
          <input
  name="email"
  type="email"
  placeholder="nombre@empresa.cl"
  className="w-full border rounded-xl px-4 py-3 text-gray-700"
/>
        </div>

        <motion.button
  type="submit"
  disabled={loading}
  whileHover={{ scale: loading ? 1 : 1.03 }}
  whileTap={{ scale: loading ? 1 : 0.98 }}
  className={`w-full py-3 rounded-xl font-semibold transition shadow-md ${
    loading
      ? "bg-gray-400 text-white cursor-not-allowed"
      : "bg-black text-white hover:bg-gray-900"
  }`}
>
  {loading ? "Creando link…" : "Crear mi link de prueba"}
</motion.button>

      </form>
      {modalOpen && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl text-center">

      <h2 className="text-2xl font-bold text-gray-900 mb-3">
        Tu link de prueba está listo 🎉
      </h2>

      <p className="text-gray-600 mb-6">
        Este es un link de demostración para que veas cómo lo verán tus clientes.
      </p>

      <div className="bg-gray-100 rounded-lg p-3 text-sm text-gray-700 break-all mb-6">
        https://www.mochidrop.cl/envio?id={ID_ENVIO}
      </div>

      <a
        href={`https://www.mochidrop.cl/envio?id=${ID_ENVIO}`}
        target="_blank"
        className="inline-block bg-black text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-900 transition shadow-md"
      >
        Abrir link
      </a>

      <button
        onClick={() => setModalOpen(false)}
        className="mt-4 text-gray-500 text-sm underline"
      >
        Cerrar
      </button>
    </div>
  </div>
)}




    </motion.div>

    {/* PREVIEW */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.7 }}
      viewport={{ once: true }}
      className="mt-16 flex justify-center"
    >
      {/* <Image
        src="/preview.png"
        alt="Preview Link"
        width={420}
        height={480}
        className="rounded-2xl shadow-xl border border-gray-100"
      /> */}
    </motion.div>

  </div>
</section>

      {/* ---------------- CTA FINAL ---------------- */}
      <section className="py-24 bg-gradient-to-br from-black to-gray-800 text-white px-6 text-center">
        <h2 className="text-3xl font-bold">
          ¿Quieres potenciar tus envíos con MochiDrop?
        </h2>
        <p className="mt-3 text-gray-300 max-w-lg mx-auto">
          Hablemos y te mostramos cómo funciona para tu PyME.
        </p>

        <a
          href="https://wa.me/56994284520?text=Hola,%20quiero%20saber%20más%20sobre%20MochiDrop"
          className="inline-block mt-8 bg-white text-black py-3 px-8 rounded-xl font-semibold hover:bg-gray-200 transition shadow-lg"
        >
          Quiero saber más
        </a>
      </section>

      {/* ----------- FOOTER ----------- */}
    {/* ---------------- FOOTER PREMIUM ---------------- */}
<footer className="bg-white border-t pt-14 pb-10">
  <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-10">

    {/* Logo + descripción */}
    <div>
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-black text-white flex items-center justify-center font-bold text-sm shadow-md">
          M
        </div>
        <span className="text-lg font-semibold tracking-tight">MochiDrop</span>
      </div>

      <p className="text-gray-600 text-sm mt-4 max-w-xs">
        Moderniza y profesionaliza tus envíos con un link personalizado
        para tus clientes.
      </p>
    </div>

    {/* Navegación */}
    <div className="flex flex-col gap-3 text-sm">
      <span className="font-semibold text-gray-900">Informacion</span>
      <a href="#funciona" className="text-gray-600 hover:text-black transition">Cómo funciona</a>
      <a href="#beneficios" className="text-gray-600 hover:text-black transition">Beneficios</a>
      <a href="#producto" className="text-gray-600 hover:text-black transition">Generar link</a>
      <a href="#cta" className="text-gray-600 hover:text-black transition">Contacto</a>
    </div>

    {/* Contacto */}
    <div className="flex flex-col gap-3 text-sm">
      <span className="font-semibold text-gray-900">Contacto</span>

      <a
        href="https://wa.me/56994284520?text=Hola,%20quiero%20saber%20más%20sobre%20MochiDrop"
        className="text-gray-600 hover:text-black transition"
        target="_blank"
      >
        WhatsApp Comercial
      </a>

      <a
        href="mailto:contacto@mochidrop.cl"
        className="text-gray-600 hover:text-black transition"
      >
        contacto@mochidrop.cl
      </a>

      <span className="text-gray-600">
        Santiago, Chile 🇨🇱
      </span>
    </div>
  </div>

  {/* Línea final */}
  <div className="mt-10 border-t pt-6">
    <p className="text-xs text-gray-400 text-center">
      © {new Date().getFullYear()} MochiDrop — Todos los derechos reservados.
    </p>
  </div>
</footer>

    </div>
  );
}




import {  useScroll, useTransform } from "framer-motion";

export  function TickerBar() {
  const { scrollY } = useScroll();

  // fade out + compress when scrolling
  const opacity = useTransform(scrollY, [0, 120], [1, 0]);
  const y = useTransform(scrollY, [0, 120], [0, -20]);

  return (
    <motion.div
      style={{ opacity, y }}
      className="w-full bg-[#0E0F28]  text-white overflow-hidden whitespace-nowrap py-3 shadow-xl"
    >
      <motion.div
        animate={{ x: ["0%", "-100%"] }}
        transition={{ repeat: Infinity, duration: 22, ease: "linear" }}
        className="flex gap-16 text-sm md:text-base font-medium px-4"
      >
        <span>🔗 Links personalizados para tu PyME</span>
        <span>📦 Guías automáticas listas para imprimir</span>
        <span>⚡ Menos mensajes repetidos</span>
        <span>✨ Experiencia más profesional</span>
      </motion.div>
    </motion.div>
  );
}
