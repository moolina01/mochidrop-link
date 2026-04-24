"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { usePostHog } from "posthog-js/react";

const WA_LINK =
  "https://wa.me/56994284520?text=Hola,%20quiero%20probar%20LinkDrop%20gratis";

// ─── Logo Components ──────────────────────────────────────────────────────────
function LinkDropLogo({ dark = false }: { dark?: boolean }) {
  return (
    <svg width="168" height="32" viewBox="0 0 168 32" fill="none">
      <g transform="translate(14, 16) rotate(-42) scale(0.32)">
        <rect x="-30" y="-16" width="48" height="28" rx="14" stroke="#E8553D" strokeWidth="7" />
        <rect x="8" y="-4" width="48" height="28" rx="14" stroke="#E8553D" strokeWidth="7" />
      </g>
      <circle cx="14" cy="15" r="1.4" fill="#E8553D" opacity="0.65" />
      <circle cx="16.5" cy="17" r="0.9" fill="#E8553D" opacity="0.35" />
      <text
        x="44" y="21"
        fontFamily="'Instrument Sans', sans-serif"
        fontSize="15" fontWeight="600"
      >
        <tspan fill={dark ? "#fff" : "#1A1A18"}>link</tspan><tspan fill="#E8553D">drop</tspan>
      </text>
    </svg>
  );
}

function LinkDropIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <g transform="translate(32,32) rotate(-42) scale(0.58)">
        <rect x="-30" y="-16" width="48" height="28" rx="14" stroke="#E8553D" strokeWidth="7" />
        <rect x="8" y="-4" width="48" height="28" rx="14" stroke="#E8553D" strokeWidth="7" />
      </g>
      <circle cx="31" cy="31" r="2.2" fill="#E8553D" opacity="0.65" />
      <circle cx="34.5" cy="33.5" r="1.4" fill="#E8553D" opacity="0.35" />
    </svg>
  );
}

// Decorative pill motif (logo pills as background decoration)
function DecoPill({
  style,
  strokeWidth = 10,
}: {
  style?: React.CSSProperties;
  strokeWidth?: number;
}) {
  return (
    <svg
      width="200"
      height="200"
      viewBox="-120 -120 240 240"
      style={{ position: "absolute", pointerEvents: "none", overflow: "visible", ...style }}
    >
      <g transform="rotate(-42)">
        <rect x="-80" y="-22" width="110" height="55" rx="27" fill="none" stroke="#E8553D" strokeWidth={strokeWidth} />
        <rect x="42" y="-8" width="110" height="55" rx="27" fill="none" stroke="#E8553D" strokeWidth={strokeWidth} />
      </g>
    </svg>
  );
}

// ─── WhatsApp Float Button ────────────────────────────────────────────────────
function WhatsAppFloat() {
  return (
    <motion.a
      href={WA_LINK}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1.5, duration: 0.4, type: "spring", stiffness: 200 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      style={{
        position: "fixed",
        bottom: 28,
        left: 28,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "#25D366",
        color: "#fff",
        borderRadius: 100,
        padding: "12px 20px 12px 14px",
        textDecoration: "none",
        boxShadow: "0 4px 20px rgba(37,211,102,0.4), 0 2px 8px rgba(0,0,0,0.12)",
        fontWeight: 600,
        fontSize: 14,
      }}
    >
      {/* WhatsApp SVG icon */}
      <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
      </svg>
      ¿Tienes dudas? Escríbenos
    </motion.a>
  );
}

// ─── Grain Overlay ────────────────────────────────────────────────────────────
function GrainOverlay() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        pointerEvents: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        opacity: 0.03,
      }}
    />
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
  const posthog = usePostHog();
  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: "rgba(250,250,247,0.8)",
        backdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 64,
        }}
      >
        <LinkDropLogo />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <a
            href="/generate-link?login=1"
            onClick={() => posthog.capture("cta_click", { location: "navbar_login" })}
            style={{
              background: "#1A1A18",
              color: "#fff",
              padding: "10px 22px",
              borderRadius: 100,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
              boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
            }}
          >
            Ingresar →
          </a>
          {/* <motion.a
            href="/generate-link"
            onClick={() => posthog.capture("cta_click", { location: "navbar" })}
            whileHover={{ y: -1 }}
            transition={{ duration: 0.18 }}
            style={{
              background: "#1A1A18",
              color: "#fff",
              padding: "10px 20px",
              borderRadius: 100,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Probar gratis →
          </motion.a> */}
        </div>
      </div>
    </header>
  );
}

// ─── Phone Mockup ─────────────────────────────────────────────────────────────
const COURIERS = [
  { name: "Starken", price: "$3.490", days: "2-3 días" },
  { name: "Chilexpress", price: "$4.190", days: "1-2 días" },
  { name: "Blue Express", price: "$2.890", days: "3-4 días" },
];

type Phase = "initial" | "cotizando" | "selecting" | "processing" | "paid" | "confirmed";

function PhoneMockup() {
  const [phase, setPhase] = useState<Phase>("initial");
  const [selectedCourier, setSelectedCourier] = useState(-1);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  function addTimeout(fn: () => void, delay: number) {
    const t = setTimeout(fn, delay);
    timeoutRef.current.push(t);
    return t;
  }

  function runAnimation() {
    // Clear any stale timeouts
    timeoutRef.current.forEach(clearTimeout);
    timeoutRef.current = [];

    // Phase 1 already set by reset — wait then start selecting
    addTimeout(() => {
      setPhase("selecting");
      setSelectedCourier(0); // Starken
    }, 1500);

    addTimeout(() => {
      setSelectedCourier(1); // Chilexpress
    }, 2500);

    addTimeout(() => {
      setSelectedCourier(2); // Blue Express
    }, 3300);

    addTimeout(() => {
      setPhase("processing");
    }, 4500);

    addTimeout(() => {
      setPhase("paid");
    }, 5700);

    addTimeout(() => {
      setPhase("confirmed");
    }, 6500);

    addTimeout(() => {
      // Reset to initial
      setPhase("initial");
      setSelectedCourier(-1);
      // Schedule next loop
      addTimeout(() => runAnimation(), 300);
    }, 8500);
  }

  useEffect(() => {
    const startDelay = setTimeout(() => runAnimation(), 1000);
    return () => {
      clearTimeout(startDelay);
      timeoutRef.current.forEach(clearTimeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Button state derived from phase
  const btnStyle: { text: string; bg: string } =
    phase === "processing"
      ? { text: "Procesando...", bg: "#B8B8B3" }
      : phase === "paid"
      ? { text: "✓ Pagado", bg: "#2D8A56" }
      : selectedCourier >= 0
      ? { text: "Pagar envío →", bg: "#E8553D" }
      : { text: "Pagar envío →", bg: "#D1D1CC" };

  return (
    <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
      {/* Floating decorative pills */}
      <DecoPill style={{ top: -20, right: -20, width: 120, height: 120, opacity: 0.10 }} strokeWidth={14} />
      <DecoPill style={{ bottom: 30, left: -30, width: 80, height: 80, opacity: 0.12 }} strokeWidth={16} />
      <DecoPill style={{ top: "35%", right: -50, width: 60, height: 60, opacity: 0.08 }} strokeWidth={18} />

      {/* Phone frame */}
      <div
        style={{
          width: 280,
          background: "#fff",
          borderRadius: 32,
          boxShadow: "0 32px 80px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.1)",
          border: "1px solid rgba(0,0,0,0.08)",
          padding: 10,
          overflow: "hidden",
        }}
      >
        {/* Notch */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
          <div style={{ width: 100, height: 24, background: "#1A1A18", borderRadius: "0 0 16px 16px" }} />
        </div>

        {/* Screen */}
        <div style={{ background: "#FAFAF7", borderRadius: 20, padding: "16px 14px", minHeight: 340, position: "relative", overflow: "hidden" }}>
          <AnimatePresence mode="wait">
            {phase === "confirmed" ? (
              <motion.div
                key="confirmed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  minHeight: 308,
                  padding: "40px 20px",
                  textAlign: "center",
                }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: "50%", background: "#2D8A56",
                  display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14,
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#1A1A18", marginBottom: 6, margin: "0 0 6px" }}>
                  Envío confirmado
                </p>
                <p style={{ fontSize: 9, color: "#9C9C95", margin: 0 }}>
                  El tracking llegará a tu correo
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="main"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: "#E8553D", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <LinkDropIcon size={18} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: "#1A1A18" }}>Tu Tienda</p>
                    <p style={{ margin: 0, fontSize: 8, color: "#9C9C95" }}>link de envío</p>
                  </div>
                </div>

                {/* Recipient */}
                <p style={{ margin: "0 0 2px", fontSize: 9, color: "#9C9C95", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Envío para
                </p>
                <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 600, color: "#1A1A18" }}>
                  María López
                </p>

                {/* Address */}
                <div style={{
                  background: "#fff", border: "1px solid #E8E8E3", borderRadius: 8,
                  padding: "7px 10px", marginBottom: 12, display: "flex", alignItems: "center", gap: 5,
                }}>
                  <span style={{ fontSize: 10 }}>📍</span>
                  <span style={{ fontSize: 9, color: "#5C5C57" }}>Av. Providencia 1234, Santiago</span>
                </div>

                {/* Courier label */}
                <p style={{ margin: "0 0 7px", fontSize: 9, color: "#9C9C95", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Elige tu courier
                </p>

                {/* Courier options */}
                {COURIERS.map((c, i) => {
                  const isSelected = selectedCourier === i;
                  return (
                    <motion.div
                      key={i}
                      animate={{
                        borderColor: isSelected ? "#E8553D" : "#E8E8E3",
                        backgroundColor: isSelected ? "#FFF0ED" : "#fff",
                      }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      style={{
                        border: `${isSelected ? "1.5px" : "1px"} solid`,
                        borderRadius: 8,
                        padding: "7px 10px",
                        marginBottom: 5,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <p style={{ margin: 0, fontSize: 9, fontWeight: 600, color: "#1A1A18" }}>{c.name}</p>
                        <p style={{ margin: 0, fontSize: 8, color: "#9C9C95" }}>{c.days}</p>
                      </div>
                      <motion.p
                        animate={{ color: isSelected ? "#E8553D" : "#1A1A18" }}
                        transition={{ duration: 0.2 }}
                        style={{ margin: 0, fontSize: 10, fontWeight: 700 }}
                      >
                        {c.price}
                      </motion.p>
                    </motion.div>
                  );
                })}

                {/* CTA button */}
                <motion.div
                  animate={{ backgroundColor: btnStyle.bg }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  style={{
                    color: "#fff",
                    textAlign: "center",
                    borderRadius: 10,
                    padding: "10px",
                    marginTop: 10,
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                >
                  {btnStyle.text}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  const posthog = usePostHog();
  return (
    <section
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
        background: "#FAFAF7",
        padding: "100px 24px 80px",
      }}
    >
      {/* Diagonal band */}
      <div
        style={{
          position: "absolute",
          top: "-20%",
          right: "-10%",
          width: "70vw",
          height: "140vh",
          background: "#FFF0ED",
          transform: "rotate(-12deg)",
          borderRadius: "0 0 0 80px",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Pill decorative (top-right) */}
      <div style={{ position: "absolute", top: "15%", right: "8%", zIndex: 0, opacity: 0.07 }}>
        <DecoPill style={{ position: "static", width: 200, height: 200 }} />
      </div>

      <div
        className="grid md:grid-cols-[1.1fr_0.9fr] grid-cols-1 gap-16 md:gap-[60px] items-center w-full"
        style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}
      >
        {/* Left column — content */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#fff",
              border: "1px solid #E8E8E3",
              borderRadius: 100,
              padding: "8px 16px",
              marginBottom: 28,
            }}
          >
            <span
              className="pulse-dot"
              style={{
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#E8553D",
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 13, color: "#5C5C57", fontWeight: 500 }}>
              Manda un link y listo.
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.08 }}
            style={{
              fontSize: "clamp(36px, 5vw, 60px)",
              fontWeight: 700,
              letterSpacing: "-0.035em",
              lineHeight: 1.06,
              color: "#1A1A18",
              marginBottom: 20,
            }}
          >
            Crea un link de envío y deja de coordinar
            <br />
            <span style={{ color: "#E8553D" }}>despachos por WhatsApp.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.16 }}
            style={{
              fontSize: "clamp(16px, 1.5vw, 19px)",
              color: "#5C5C57",
              maxWidth: 480,
              marginBottom: 36,
              lineHeight: 1.65,
            }}
          >
            Tu cliente paga el envío, elige courier y recibe tracking automáticamente.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.24 }}
            style={{ display: "flex", gap: 12, flexWrap: "wrap" }}
          >
            <motion.a
              href="/generate-link"
              onClick={() => posthog.capture("cta_click", { location: "hero" })}
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 300 }}
              style={{
                background: "#E8553D",
                color: "#fff",
                padding: "14px 28px",
                borderRadius: 100,
                fontWeight: 600,
                fontSize: 15,
                textDecoration: "none",
                boxShadow: "0 4px 20px rgba(232,85,61,0.3)",
                display: "inline-block",
              }}
            >
              Crear mi primer link de envío →
            </motion.a>
            <motion.a
              href="#como-funciona"
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 300 }}
              style={{
                background: "transparent",
                color: "#1A1A18",
                padding: "14px 28px",
                borderRadius: 100,
                fontWeight: 600,
                fontSize: 15,
                textDecoration: "none",
                border: "1.5px solid #E8E8E3",
                display: "inline-block",
              }}
            >
              Ver cómo funciona ↓
            </motion.a>
          </motion.div>

          {/* Micro-hook */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            style={{ fontSize: 14, color: "#9C9C95", marginTop: 20, lineHeight: 1.6 }}
          >
            ¿Cansado de cotizar envíos, pedir direcciones y coordinar pagos por WhatsApp?
          </motion.p>
        </div>

        {/* Right column — phone mockup */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="order-first md:order-last flex justify-center"
        >
          <PhoneMockup />
        </motion.div>
      </div>
    </section>
  );
}

// ─── Pain Chat ────────────────────────────────────────────────────────────────
function PainChat() {
  const bubbles: {
    type: "client" | "seller" | "narrator";
    text: string;
    time?: string;
  }[] = [
    {
      type: "client",
      text: "Hola! quiero los aritos, como es el envio a Rancagua?",
    },
    {
      type: "seller",
      text: "Holaa! sale $3.490 por Starken. Mandame tu direccion completa porfa",
      time: "11:42",
    },
    {
      type: "client",
      text: "Av Brasil 218, Rancagua",
    },
    {
      type: "seller",
      text: "Me falta la comuna y numero de depto",
      time: "11:48",
    },
    {
      type: "narrator",
      text: "Direccion, datos bancarios, \"ya te transfiero\"... 45 min despues todavia no paga.",
    },
    {
      type: "narrator",
      text: "Y despues: verificar pago, generar guia, imprimir etiqueta, mandar tracking. Todo manual. Todo por 1 envio.",
    },
  ];

  return (
    <section
      style={{
        background: "#FFF0ED",
        padding: "110px 24px 100px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Skew cut at top */}
      <div
        style={{
          position: "absolute",
          top: -32,
          left: 0,
          right: 0,
          height: 64,
          background: "#FAFAF7",
          transform: "skewY(-2deg)",
          transformOrigin: "left",
        }}
      />

      <div
        style={{
          maxWidth: 700,
          margin: "0 auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          style={{ marginBottom: 40 }}
        >
          <p
            style={{
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "#E8553D",
              marginBottom: 12,
            }}
          >
            ¿Te suena familiar?
          </p>
          <h2
            style={{
              fontSize: "clamp(26px, 3.5vw, 36px)",
              fontWeight: 700,
              color: "#1A1A18",
              margin: 0,
            }}
          >
            Tu WhatsApp, todos los días:
          </h2>
        </motion.div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {bubbles.map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12, ease: "easeOut" }}
              style={{
                display: "flex",
                justifyContent:
                  b.type === "client"
                    ? "flex-start"
                    : b.type === "seller"
                    ? "flex-end"
                    : "center",
              }}
            >
              {b.type === "narrator" ? (
                <div
                  style={{
                    background: "rgba(0,0,0,0.06)",
                    borderRadius: 100,
                    padding: "8px 18px",
                    fontSize: 13,
                    color: "#5C5C57",
                    maxWidth: 460,
                    textAlign: "center",
                  }}
                >
                  {b.text}
                </div>
              ) : (
                <div
                  style={{
                    maxWidth: "75%",
                    background: b.type === "client" ? "#fff" : "#E8553D",
                    color: b.type === "client" ? "#1A1A18" : "#fff",
                    borderRadius:
                      b.type === "client"
                        ? "18px 18px 18px 4px"
                        : "18px 18px 4px 18px",
                    padding: "12px 16px",
                    boxShadow:
                      b.type === "client"
                        ? "0 2px 8px rgba(0,0,0,0.07)"
                        : "none",
                  }}
                >
                  <p style={{ margin: "0 0 6px", fontSize: 14, lineHeight: 1.5 }}>
                    {b.text}
                  </p>
                  {b.time && (
                    <p
                      style={{
                        margin: 0,
                        fontSize: 11,
                        opacity: 0.45,
                        textAlign: "right",
                      }}
                    >
                      {b.time}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Bridge block */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3 }}
          style={{
            marginTop: 48,
            textAlign: "center",
            padding: "36px 32px",
            background: "#fff",
            borderRadius: 20,
            border: "1.5px solid rgba(232,85,61,0.15)",
            boxShadow: "0 4px 24px rgba(232,85,61,0.08)",
          }}
        >
          <p
            style={{
              fontSize: 14,
              color: "#9C9C95",
              marginBottom: 12,
              fontStyle: "italic",
              lineHeight: 1.6,
            }}
          >
            ¿Te suena familiar? Cada envío te roba 20 minutos que podrías dedicar a vender.
          </p>
          <p
            style={{
              fontSize: "clamp(20px, 2.5vw, 26px)",
              fontWeight: 700,
              color: "#1A1A18",
              marginBottom: 20,
              lineHeight: 1.3,
            }}
          >
            ¿Y si en vez de todo eso...
            <br />
            <span style={{ color: "#E8553D" }}>solo mandas un link?</span>
          </p>
          <motion.a
            href="#como-funciona"
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 300 }}
            style={{
              display: "inline-block",
              background: "#E8553D",
              color: "#fff",
              padding: "12px 28px",
              borderRadius: 100,
              fontWeight: 600,
              fontSize: 15,
              textDecoration: "none",
              boxShadow: "0 4px 16px rgba(232,85,61,0.3)",
            }}
          >
            Ver cómo funciona →
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      num: "1",
      color: "#E8553D",
      shadow: "rgba(232,85,61,0.28)",
      title: "Creas un link en segundos",
      desc: "Ingresas el nombre y dirección del cliente. LinkDrop genera el link al instante.",
    },
    {
      num: "2",
      color: "#6C5CE7",
      shadow: "rgba(108,92,231,0.28)",
      title: "Se lo mandas a tu cliente por WhatsApp o Instagram",
      desc: "Copia el link y mándalo por el canal que usas. No necesitas explicar nada.",
    },
    {
      num: "3",
      color: "#2D7DD2",
      shadow: "rgba(45,125,210,0.28)",
      title: "Tu cliente paga y elige el courier",
      desc: "Abre el link, ve los precios reales de los couriers, elige y paga con tarjeta. Sin transferencias.",
    },
    {
      num: "4",
      color: "#2D8A56",
      shadow: "rgba(45,138,86,0.28)",
      title: "El envío y tracking se gestionan automáticamente",
      desc: "La guía llega a tu correo. El tracking llega al cliente. Tú no haces nada más.",
    },
  ];

  return (
    <section
      id="como-funciona"
      style={{
        background: "#FAFAF7",
        padding: "110px 24px 100px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Skew cut at top */}
      <div
        style={{
          position: "absolute",
          top: -32,
          left: 0,
          right: 0,
          height: 64,
          background: "#FFF0ED",
          transform: "skewY(-2deg)",
          transformOrigin: "right",
        }}
      />

      <div
        style={{
          maxWidth: 680,
          margin: "0 auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          style={{ textAlign: "center", marginBottom: 64 }}
        >
          <p
            style={{
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "#E8553D",
              marginBottom: 12,
            }}
          >
            Cómo funciona
          </p>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 700,
              color: "#1A1A18",
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            Así funciona LinkDrop
          </h2>
          <p style={{ fontSize: 16, color: "#5C5C57", marginTop: 12, margin: "12px 0 0" }}>
            Manda un link y listo. Lo que antes tomaba 15 minutos ahora pasa en 30 segundos.
          </p>
        </motion.div>

        {/* Vertical timeline */}
        <div style={{ position: "relative" }}>
          {/* Connecting line */}
          <div
            style={{
              position: "absolute",
              left: 31,
              top: 32,
              bottom: 32,
              width: 2,
              background: "linear-gradient(to bottom, #E8553D, #6C5CE7, #2D8A56)",
              borderRadius: 2,
            }}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: i * 0.15, ease: "easeOut" }}
                style={{ display: "flex", gap: 28, alignItems: "flex-start" }}
              >
                {/* Step dot */}
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 20,
                    background: step.color,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 22,
                    flexShrink: 0,
                    zIndex: 1,
                    boxShadow: `0 8px 24px ${step.shadow}`,
                  }}
                >
                  {step.num}
                </div>

                {/* Content */}
                <div style={{ paddingTop: 12 }}>
                  <h3
                    style={{
                      fontWeight: 700,
                      fontSize: 20,
                      color: "#1A1A18",
                      marginBottom: 8,
                      margin: "0 0 8px",
                    }}
                  >
                    {step.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 15,
                      color: "#5C5C57",
                      maxWidth: 440,
                      lineHeight: 1.65,
                      margin: 0,
                    }}
                  >
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Closing line */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{ textAlign: "center", fontSize: 18, fontWeight: 700, color: "#E8553D", marginTop: 52 }}
        >
          Tú no haces nada más.
        </motion.p>
      </div>
    </section>
  );
}

// ─── Benefits ─────────────────────────────────────────────────────────────────
function Benefits() {
  const items = [
    { icon: "⚡", text: "Ahorras tiempo en cada envío" },
    { icon: "💰", text: "Evitas perder ventas por fricción" },
    { icon: "📦", text: "Menos errores en direcciones" },
    { icon: "📲", text: "Funciona directo desde WhatsApp" },
  ];

  return (
    <section style={{ backgroundColor: "#1A1A18", padding: "96px 24px" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: "center", marginBottom: 48 }}
        >
          <h2 style={{
            fontSize: "clamp(26px, 3.5vw, 36px)", fontWeight: 700,
            color: "#fff", letterSpacing: "-0.02em", marginBottom: 12,
          }}>
            Más simple para ti.{" "}
            <span style={{ color: "#E8553D" }}>Más fácil para tu cliente.</span>
          </h2>
        </motion.div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              style={{
                display: "flex", alignItems: "center", gap: 16,
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 14, padding: "18px 22px",
              }}
            >
              <span style={{ fontSize: 22, flexShrink: 0 }}>{item.icon}</span>
              <span style={{ fontSize: 16, fontWeight: 500, color: "rgba(255,255,255,0.85)" }}>
                {item.text}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Comparison ───────────────────────────────────────────────────────────────
function Comparison() {
  const without = [
    "Buscas el precio del envío en la web del courier",
    "Vuelves a WhatsApp a explicar las opciones",
    "Esperas que el cliente transfiera (si es que vuelve)",
    "Generas la guía a mano en la web del courier",
    "Copias y pegas el tracking al cliente",
  ];
  const withItems = [
    "Creas el link con los datos del cliente",
    "Lo mandas por WhatsApp",
    "Tu cliente elige, paga con tarjeta y listo",
    "La guía se genera automáticamente",
    "El tracking llega solo al cliente",
  ];

  return (
    <section
      style={{
        background: "#141413",
        padding: "110px 24px 100px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Skew cut at top */}
      <div
        style={{
          position: "absolute",
          top: -32,
          left: 0,
          right: 0,
          height: 64,
          background: "#FAFAF7",
          transform: "skewY(2deg)",
          transformOrigin: "right",
        }}
      />

      {/* Pill decorative */}
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          left: "5%",
          opacity: 0.06,
          pointerEvents: "none",
        }}
      >
        <DecoPill style={{ position: "static", width: 180, height: 90 }} />
      </div>

      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          style={{ textAlign: "center", marginBottom: 56 }}
        >
          <p
            style={{
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "#FF6B52",
              marginBottom: 12,
            }}
          >
            Antes vs. Después
          </p>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            El mismo envío. Dos realidades.
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          style={{
            borderRadius: 20,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div className="grid md:grid-cols-2 grid-cols-1">
            {/* Without */}
            <div
              style={{
                background: "rgba(232,85,61,0.08)",
                padding: 36,
              }}
              className="border-b md:border-b-0 md:border-r border-white/[0.06]"
            >
              <h3
                style={{
                  fontWeight: 700,
                  fontSize: 18,
                  color: "#FF8A7A",
                  marginBottom: 24,
                }}
              >
                ✗ Sin LinkDrop
              </h3>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                {without.map((item, i) => (
                  <li
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      fontSize: 14,
                      color: "rgba(255,255,255,0.6)",
                    }}
                  >
                    <span style={{ color: "#FF8A7A", flexShrink: 0 }}>✗</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* With */}
            <div
              style={{ background: "rgba(45,138,86,0.08)", padding: 36 }}
            >
              <h3
                style={{
                  fontWeight: 700,
                  fontSize: 18,
                  color: "#6EDB9A",
                  marginBottom: 24,
                }}
              >
                ✓ Con LinkDrop
              </h3>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                {withItems.map((item, i) => (
                  <li
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      fontSize: 14,
                      color: "rgba(255,255,255,0.6)",
                    }}
                  >
                    <span style={{ color: "#6EDB9A", flexShrink: 0 }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.08)",
              padding: "28px 36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 48,
              flexWrap: "wrap",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <p style={{ margin: "0 0 4px", fontSize: 28, fontWeight: 700, color: "#FF8A7A" }}>
                ~15 min
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                por envío manual
              </p>
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ margin: "0 0 4px", fontSize: 28, fontWeight: 700, color: "#6EDB9A" }}>
                ~30 seg
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                por envío con LinkDrop
              </p>
            </div>
            <motion.a
              href={WA_LINK}
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 300 }}
              style={{
                display: "inline-block",
                background: "#E8553D",
                color: "#fff",
                padding: "12px 24px",
                borderRadius: 100,
                fontWeight: 600,
                fontSize: 14,
                textDecoration: "none",
                boxShadow: "0 4px 16px rgba(232,85,61,0.35)",
              }}
            >
              Recuperar mi tiempo →
            </motion.a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Calculator ───────────────────────────────────────────────────────────────
function Calculator() {
  const [shipments, setShipments] = useState(15);

  const manualMin = shipments * 15;
  const mochiMin = Math.round(shipments * 0.5);
  const savedHours = ((manualMin - mochiMin) * 4) / 60;
  const extraSales = Math.round(savedHours * 2);
  const fmt = (min: number) =>
    min >= 60 ? `${(min / 60).toFixed(1)}h` : `${min} min`;

  return (
    <section
      id="calculadora"
      style={{
        background: "#FAFAF7",
        padding: "110px 24px 100px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Skew cut at top */}
      <div
        style={{
          position: "absolute",
          top: -32,
          left: 0,
          right: 0,
          height: 64,
          background: "#141413",
          transform: "skewY(-2deg)",
          transformOrigin: "left",
        }}
      />

      <div
        style={{
          maxWidth: 560,
          margin: "0 auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          style={{ textAlign: "center", marginBottom: 48 }}
        >
          <p
            style={{
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "#E8553D",
              marginBottom: 12,
            }}
          >
            Calculadora de tiempo
          </p>
          <h2
            style={{
              fontSize: "clamp(26px, 3.5vw, 38px)",
              fontWeight: 700,
              color: "#1A1A18",
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            El tiempo que pierdes tiene un precio
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          style={{
            background: "#fff",
            border: "1.5px solid #E8E8E3",
            borderRadius: 24,
            padding: 40,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Left gradient bar */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 5,
              background: "linear-gradient(to bottom, #E8553D, #6C5CE7)",
              borderRadius: "24px 0 0 24px",
            }}
          />

          {/* Label */}
          <p
            style={{
              textAlign: "center",
              fontSize: 14,
              fontWeight: 500,
              color: "#5C5C57",
              marginBottom: 20,
            }}
          >
            ¿Cuántos envíos haces a la semana?
          </p>

          {/* Input row */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "center",
              gap: 12,
              marginBottom: 32,
            }}
          >
            <input
              type="number"
              value={shipments}
              min={1}
              onChange={(e) =>
                setShipments(Math.max(1, parseInt(e.target.value) || 1))
              }
              style={{
                width: 100,
                fontSize: 36,
                fontWeight: 700,
                color: "#E8553D",
                border: "none",
                borderBottom: "3px solid #E8553D",
                textAlign: "center",
                background: "transparent",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            <span style={{ fontSize: 15, color: "#9C9C95" }}>
              envíos / semana
            </span>
          </div>

          {/* Results */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: 10 }}
          >
            {[
              { label: "Tiempo manual por semana", value: fmt(manualMin) },
              { label: "Tiempo con LinkDrop", value: fmt(mochiMin) },
            ].map((row, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "14px 16px",
                  background: "#FAFAF7",
                  borderRadius: 12,
                }}
              >
                <span style={{ fontSize: 14, color: "#5C5C57" }}>
                  {row.label}
                </span>
                <span
                  style={{ fontSize: 15, fontWeight: 600, color: "#1A1A18" }}
                >
                  {row.value}
                </span>
              </div>
            ))}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 16px",
                background: "#FFF0ED",
                border: "1px solid rgba(232,85,61,0.2)",
                borderRadius: 12,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 500, color: "#1A1A18" }}>
                Tiempo que recuperas al mes
              </span>
              <span style={{ fontSize: 20, fontWeight: 700, color: "#E8553D" }}>
                {savedHours.toFixed(1)}h
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 16px",
                background: "#E8F5ED",
                border: "1px solid rgba(45,138,86,0.2)",
                borderRadius: 12,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 500, color: "#1A1A18" }}>
                Ventas extras que podrías cerrar
              </span>
              <span style={{ fontSize: 20, fontWeight: 700, color: "#2D8A56" }}>
                ~{extraSales} ventas
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── For Who ──────────────────────────────────────────────────────────────────
function ForWho() {
  const posthog = usePostHog();
  const checks = [
    "Vendes por Instagram, TikTok o WhatsApp",
    "Cobras el envío por transferencia",
    "Le dices al cliente el precio del courier tú mismo",
    "Generas las guías a mano una por una",
    "El cliente dice \"ya te transfiero\" y desaparece",
  ];

  return (
    <section style={{ background: "#FAFAF7", padding: "96px 24px" }}>
      <div style={{ maxWidth: 620, margin: "0 auto", textAlign: "center" }}>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p style={{
            fontSize: 12, fontWeight: 600, textTransform: "uppercase",
            letterSpacing: "0.12em", color: "#E8553D", marginBottom: 16,
          }}>
            ¿Es para mí?
          </p>
          <h2 style={{
            fontSize: "clamp(26px, 3.5vw, 38px)", fontWeight: 800,
            color: "#1A1A18", letterSpacing: "-0.03em", lineHeight: 1.15,
            marginBottom: 48,
          }}>
            Si alguna de estas te suena,<br />
            <span style={{ color: "#E8553D" }}>LinkDrop es para ti.</span>
          </h2>
        </motion.div>

        {/* Checklist */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 48 }}>
          {checks.map((text, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                background: "#fff", border: "1.5px solid #E8E8E3",
                borderRadius: 14, padding: "16px 20px",
                textAlign: "left",
              }}
            >
              <div style={{
                width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                background: "#E8553D",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span style={{ fontSize: 15, fontWeight: 500, color: "#1A1A18" }}>
                {text}
              </span>
            </motion.div>
          ))}
        </div>

        {/* CTA inline */}
        <motion.a
          href="/generate-link"
          onClick={() => posthog.capture("cta_click", { location: "forwho" })}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          whileHover={{ y: -2 }}
          style={{
            display: "inline-block",
            background: "#E8553D", color: "#fff",
            padding: "14px 32px", borderRadius: 100,
            fontWeight: 700, fontSize: 15, textDecoration: "none",
            boxShadow: "0 4px 20px rgba(232,85,61,0.35)",
          }}
        >
          Crear mi primer link de envío →
        </motion.a>
        <p style={{ marginTop: 12, fontSize: 12, color: "#9C9C95" }}>
          Sin tarjeta · 5 links gratis · Listo en 2 minutos
        </p>

      </div>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────
const WA_UPGRADE_PRICING = "https://wa.me/56994284520?text=Hola,%20quiero%20subir%20mi%20plan%20en%20LinkDrop";

function Pricing() {
  const plans = [
    {
      name: "Gratis",
      price: "$0",
      period: "",
      desc: "Para probar sin compromiso",
      links: "5 links de envío",
      features: ["Todos los couriers", "Pago con tarjeta (FLOW)", "Tracking automático"],
      cta: "Comenzar gratis",
      ctaHref: "/generate-link",
      highlight: false,
    },
    {
      name: "Emprende",
      price: "$4.990",
      period: "/ mes",
      desc: "Para pymes que despachan seguido",
      links: "40 links al mes",
      features: ["Todo lo del plan gratis", "Soporte prioritario", "40 links mensuales"],
      cta: "Subir a Emprende",
      ctaHref: WA_UPGRADE_PRICING,
      highlight: true,
    },
    {
      name: "Pro",
      price: "$12.990",
      period: "/ mes",
      desc: "Para volumen sin límites",
      links: "Links ilimitados",
      features: ["Todo lo de Emprende", "Links ilimitados", "Atención personalizada"],
      cta: "Subir a Pro",
      ctaHref: WA_UPGRADE_PRICING,
      highlight: false,
    },
  ];

  return (
    <section id="precios" style={{ background: "#FAFAF7", padding: "96px 24px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: "center", marginBottom: 52 }}
        >
          <p style={{
            fontSize: 12, fontWeight: 600, textTransform: "uppercase",
            letterSpacing: "0.12em", color: "#E8553D", marginBottom: 12,
          }}>
            Precios
          </p>
          <h2 style={{
            fontSize: "clamp(26px, 3.5vw, 38px)", fontWeight: 700,
            color: "#1A1A18", letterSpacing: "-0.02em", marginBottom: 14,
          }}>
            Empieza gratis, crece cuando quieras
          </h2>
          <p style={{ fontSize: 16, color: "#5C5C57", maxWidth: 400, margin: "0 auto", lineHeight: 1.7 }}>
            Sin contratos, sin permanencia. Cancela o cambia de plan cuando quieras.
          </p>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, alignItems: "start" }}>
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              style={{
                background: plan.highlight ? "#1A1A18" : "#fff",
                border: plan.highlight ? "none" : "1.5px solid #E8E8E3",
                borderRadius: 20,
                padding: "32px 28px",
                position: "relative",
                boxShadow: plan.highlight ? "0 16px 48px rgba(0,0,0,0.18)" : "0 2px 12px rgba(0,0,0,0.04)",
              }}
            >
              {plan.highlight && (
                <div style={{
                  position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                  background: "#E8553D", color: "#fff",
                  fontSize: 11, fontWeight: 700, padding: "4px 14px", borderRadius: 100,
                  whiteSpace: "nowrap", letterSpacing: "0.06em",
                }}>
                  MÁS POPULAR
                </div>
              )}

              <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 600, color: plan.highlight ? "rgba(255,255,255,0.5)" : "#9C9C95" }}>
                {plan.name}
              </p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: plan.highlight ? "#fff" : "#1A1A18", lineHeight: 1 }}>
                  {plan.price}
                </span>
                {plan.period && (
                  <span style={{ fontSize: 13, color: plan.highlight ? "rgba(255,255,255,0.4)" : "#9C9C95" }}>
                    {plan.period}
                  </span>
                )}
              </div>
              <p style={{ margin: "0 0 20px", fontSize: 13, color: plan.highlight ? "rgba(255,255,255,0.5)" : "#9C9C95" }}>
                {plan.desc}
              </p>

              <div style={{
                background: plan.highlight ? "rgba(255,255,255,0.08)" : "#FAFAF7",
                borderRadius: 10, padding: "10px 14px", marginBottom: 20,
              }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: plan.highlight ? "#fff" : "#1A1A18" }}>
                  {plan.links}
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                {plan.features.map((f, j) => (
                  <div key={j} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                      background: plan.highlight ? "rgba(232,85,61,0.3)" : "#F0FBF4",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <polyline points="2,6 5,9 10,3" stroke={plan.highlight ? "#E8553D" : "#2D8A56"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span style={{ fontSize: 13, color: plan.highlight ? "rgba(255,255,255,0.75)" : "#5C5C57" }}>{f}</span>
                  </div>
                ))}
              </div>

              <a
                href={plan.ctaHref}
                target={plan.ctaHref.startsWith("http") ? "_blank" : undefined}
                rel={plan.ctaHref.startsWith("http") ? "noopener noreferrer" : undefined}
                style={{
                  display: "block", textAlign: "center",
                  padding: "13px", borderRadius: 12,
                  fontSize: 14, fontWeight: 700, textDecoration: "none",
                  background: plan.highlight ? "#E8553D" : "#1A1A18",
                  color: "#fff",
                  boxShadow: plan.highlight ? "0 4px 16px rgba(232,85,61,0.4)" : "none",
                }}
              >
                {plan.cta} →
              </a>
            </motion.div>
          ))}
        </div>

        <p style={{ textAlign: "center", fontSize: 12, color: "#9C9C95", marginTop: 24 }}>
          Los planes de pago se activan por WhatsApp en minutos. Sin formularios, sin esperas.
        </p>
      </div>
    </section>
  );
}

// ─── Integrations ─────────────────────────────────────────────────────────────

const PARTNER_LOGOS: { name: string; logo: React.ReactNode }[] = [
  {
    name: "Chilexpress",
    logo: (
      // eslint-disable-next-line @next/next/no-img-element
      <img src="/chilexpress.png" alt="Chilexpress" style={{ height: 36, width: "auto", objectFit: "contain", display: "block" }} />
    ),
  },
  {
    name: "Blue Express",
    logo: (
      // eslint-disable-next-line @next/next/no-img-element
      <img src="/bluexpress.png" alt="Blue Express" style={{ height: 36, width: "auto", objectFit: "contain", display: "block" }} />
    ),
  },
  {
    name: "99 Minutos",
    logo: (
      // eslint-disable-next-line @next/next/no-img-element
      <img src="/99minutos.png" alt="99 Minutos" style={{ height: 36, width: "auto", objectFit: "contain", display: "block" }} />
    ),
  },
  {
    name: "FLOW",
    logo: (
      // eslint-disable-next-line @next/next/no-img-element
      <img src="/flow.png" alt="FLOW" style={{ height: 36, width: "auto", objectFit: "contain", display: "block" }} />
    ),
  },
  {
    name: "Starken",
    logo: (
      // eslint-disable-next-line @next/next/no-img-element
      <img src="/starken_2014.jpg.webp" alt="Starken" style={{ height: 36, width: "auto", objectFit: "contain", display: "block" }} />
    ),
  },
];

function Integrations() {
  // Triplica para que el loop sea siempre suave sin importar el ancho
  const track = [...PARTNER_LOGOS, ...PARTNER_LOGOS, ...PARTNER_LOGOS];

  return (
    <section style={{ backgroundColor: "#FAFAF7", padding: "64px 0 72px" }}>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px" }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          style={{ textAlign: "center", marginBottom: 52 }}
        >
          <p style={{
            fontSize: 12, fontWeight: 600, textTransform: "uppercase",
            letterSpacing: "0.12em", color: "#E8553D", marginBottom: 16,
          }}>
            Sin coordinación manual
          </p>  
          <h2 style={{
            fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 700,
            color: "#1A1A18", letterSpacing: "-0.02em", marginBottom: 12,
          }}>
            El link cotiza, cobra y genera la guía 
          </h2>
          <p style={{
            fontSize: 15, color: "#5C5C57", maxWidth: 480,
            margin: "0 auto", lineHeight: 1.7,
          }}>
            Tu cliente abre el link y ve precios reales de los couriers más usados en Chile, Elige, paga con tarjeta y recibe el tracking, Tú no haces nada.
          </p>
        </motion.div>

      </div>

      {/* Marquee — full width */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.2 }}
        style={{
          overflow: "hidden", marginBottom: 20, position: "relative",
          maskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
        }}
      >
        <div className="ld-marquee-track">
          {track.map((p, i) => (
            <div
              key={i}
              style={{
                display: "inline-flex", alignItems: "center",
                background: "#fff", border: "1px solid #E8E8E3",
                borderRadius: 12, padding: "14px 20px",
                margin: "0 10px", flexShrink: 0,
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                transition: "box-shadow 0.2s",
              }}
            >
              {p.logo}
            </div>
          ))}
        </div>
      </motion.div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px" }}>
        <p style={{ textAlign: "center", fontSize: 13, color: "#9C9C95" }}>
          Precios en tiempo real según el destino · Pago con tarjeta vía FLOW · Tracking automático
        </p>
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: "¿Qué es LinkDrop?",
    a: "LinkDrop es una herramienta para tiendas chilenas que venden por Instagram, WhatsApp o redes sociales. Genera un link personalizado con tu marca donde el cliente elige el courier, paga con tarjeta y recibe el tracking — sin que tengas que instalar nada ni cobrar tú mismo el envío.",
  },
  {
    q: "¿Cómo funciona exactamente?",
    a: "Tú creas un link desde tu panel, lo compartes con tu cliente (por chat o pedido), y el cliente entra, ve las opciones de envío con precios reales, elige y paga. LinkDrop se encarga del resto: genera la guía con el courier elegido y le envía el tracking al cliente.",
  },
  {
    q: "¿Qué couriers están disponibles?",
    a: "Actualmente integramos Starken, Chilexpress, Blue Express y 99 Minutos. Los precios se calculan en tiempo real según el destino del cliente, así que siempre ven la tarifa actual.",
  },
  {
    q: "¿Cuánto cuesta usar LinkDrop?",
    a: "El plan gratuito incluye 5 links de envíos gratis al mes, Para volúmenes mayores tenemos planes de pago, Escríbenos por WhatsApp y te contamos las opciones.",
  },
  
  {
    q: "¿El link lleva mi marca o la de LinkDrop?",
    a: "El link lleva tu marca: tu logo, tu nombre de tienda y los colores que elijas, Para el cliente, es como si fuera tu propio sistema de despacho.",
  },
  {
    q: "¿Cómo empiezo?",
    a: "Haz clic en Probar gratis, crea tu cuenta en segundos y ya puedes generar tus primeros 5 links de envío gratis cada mes",
  },
];
function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" style={{ background: "#FAFAF7", padding: "96px 24px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          style={{ textAlign: "center", marginBottom: 56 }}
        >
          <h2
            style={{
              fontSize: "clamp(26px, 3.5vw, 36px)",
              fontWeight: 700,
              color: "#1A1A18",
              letterSpacing: "-0.02em",
              marginBottom: 12,
            }}
          >
            Preguntas frecuentes
          </h2>
          <p style={{ color: "#5C5C57", fontSize: 16, margin: 0 }}>
            Todo lo que necesitas saber antes de empezar.
          </p>
        </motion.div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {FAQ_ITEMS.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.04 }}
              style={{
                background: "#fff",
                border: "1.5px solid",
                borderColor: open === i ? "#E8553D" : "#E8E8E3",
                borderRadius: 16,
                overflow: "hidden",
                transition: "border-color 0.2s",
              }}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  padding: "20px 24px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "inherit",
                }}
              >
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#1A1A18",
                    lineHeight: 1.4,
                  }}
                >
                  {item.q}
                </span>
                <span
                  style={{
                    flexShrink: 0,
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: open === i ? "#E8553D" : "#F5F5F0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background 0.2s",
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    style={{
                      transform: open === i ? "rotate(45deg)" : "rotate(0deg)",
                      transition: "transform 0.25s",
                    }}
                  >
                    <path
                      d="M7 1v12M1 7h12"
                      stroke={open === i ? "#fff" : "#5C5C57"}
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </button>

              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    key="answer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    style={{ overflow: "hidden" }}
                  >
                    <p
                      style={{
                        margin: 0,
                        padding: "0 24px 20px",
                        fontSize: 14,
                        color: "#5C5C57",
                        lineHeight: 1.7,
                      }}
                    >
                      {item.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{ textAlign: "center", marginTop: 48 }}
        >
          <p style={{ color: "#9C9C95", fontSize: 14, marginBottom: 16 }}>
            ¿Tienes otra pregunta?
          </p>
          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#25D366",
              color: "#fff",
              padding: "12px 24px",
              borderRadius: 100,
              fontWeight: 600,
              fontSize: 14,
              textDecoration: "none",
              boxShadow: "0 4px 16px rgba(37,211,102,0.35)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
            </svg>
            Escríbenos por WhatsApp
          </a>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Final CTA ────────────────────────────────────────────────────────────────
function FinalCTA() {
  const posthog = usePostHog();
  return (
    <section
      style={{
        background: "#FAFAF7",
        padding: "100px 24px 120px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Giant pill decorative (centered) */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          opacity: 0.04,
          pointerEvents: "none",
          width: 500,
          height: 250,
        }}
      >
        <DecoPill style={{ position: "static", width: 500, height: 250 }} strokeWidth={6} />
      </div>

      <div
        style={{
          maxWidth: 700,
          margin: "0 auto",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 42px)",
              fontWeight: 700,
              color: "#1A1A18",
              letterSpacing: "-0.02em",
              marginBottom: 16,
            }}
          >
            Empieza gratis y crea tu primer link en menos de 1 minuto.
          </h2>
          <p
            style={{
              fontSize: 17,
              color: "#5C5C57",
              maxWidth: 500,
              margin: "0 auto 40px",
              lineHeight: 1.65,
            }}
          >
            Manda un link y listo. Sin instalaciones, sin contratos, sin tarjeta.
          </p>
          <motion.a
            href="https://www.linkdrop.cl/generate-link"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => posthog.capture("cta_click", { location: "final_cta" })}
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 300 }}
            style={{
              display: "inline-block",
              background: "#E8553D",
              color: "#fff",
              padding: "18px 40px",
              borderRadius: 100,
              fontWeight: 600,
              fontSize: 18,
              textDecoration: "none",
              boxShadow: "0 4px 24px rgba(232,85,61,0.35)",
              marginBottom: 20,
            }}
          >
            Crear mi link ahora →
          </motion.a>
          <div>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "#E8F5ED",
                borderRadius: 100,
                padding: "8px 16px",
                fontSize: 14,
                fontWeight: 500,
                color: "#2D8A56",
              }}
            >
              ✓ Sin registrarte — abre en segundos
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  const colTitleStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    color: "rgba(255,255,255,0.35)",
    marginBottom: 20,
  };

  const linkStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 14,
    color: "rgba(255,255,255,0.55)",
    textDecoration: "none",
    transition: "color 0.2s",
  };

  const navLinks = [
    { href: "#como-funciona", label: "Cómo funciona" },
    { href: "#calculadora", label: "Calculadora de tiempo" },
    { href: "#generar", label: "Genera tu link" },
  ];

  return (
    <footer style={{ background: "#1A1A18", position: "relative" }}>
      {/* Gradient top border */}
      <div
        style={{
          height: 3,
          background: "linear-gradient(90deg, #E8553D, #6C5CE7)",
        }}
      />

      {/* Main content */}
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "64px 24px 48px",
        }}
      >
        <div className="grid md:grid-cols-[1.2fr_1fr_1fr] grid-cols-1 gap-12 md:gap-8">

          {/* Col 1 — Brand */}
          <div>
            <div style={{ marginBottom: 20 }}>
              <LinkDropLogo dark />
            </div>
            <p
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.45)",
                lineHeight: 1.7,
                maxWidth: 260,
                marginBottom: 24,
              }}
            >
              Links de envío para tiendas chilenas que venden por redes sociales. Tu cliente elige courier, paga con tarjeta y recibe tracking — todo desde un link.
            </p>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 100,
                padding: "6px 14px",
                fontSize: 13,
                color: "rgba(255,255,255,0.5)",
              }}
            >
              🇨🇱 Hecho en Santiago, Chile
            </span>
          </div>

          {/* Col 2 — Producto */}
          <div>
            <p style={colTitleStyle}>Producto</p>
            <nav style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {navLinks.map((link, i) => (
                <a
                  key={i}
                  href={link.href}
                  style={linkStyle}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLAnchorElement).style.color = "#E8553D")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLAnchorElement).style.color =
                      "rgba(255,255,255,0.55)")
                  }
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Col 3 — Contacto */}
          <div>
            <p style={colTitleStyle}>Contacto</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <a
                href="mailto:mbmoolina@gmail.com"
                style={linkStyle}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.color = "#E8553D")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.color =
                    "rgba(255,255,255,0.55)")
                }
              >
                <span style={{ fontSize: 16 }}>✉️</span>
                mbmoolina@gmail.com
              </a>
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                style={linkStyle}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.color = "#E8553D")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.color =
                    "rgba(255,255,255,0.55)")
                }
              >
                <span style={{ fontSize: 16 }}>💬</span>
                WhatsApp
              </a>
              <div style={{ marginTop: 4 }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background: "rgba(45,138,86,0.15)",
                    border: "1px solid rgba(45,138,86,0.25)",
                    borderRadius: 100,
                    padding: "5px 12px",
                    fontSize: 12,
                    fontWeight: 500,
                    color: "#6EDB9A",
                  }}
                >
                  ⚡ Respondemos en menos de 24h
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.07)",
          padding: "20px 24px",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", margin: 0 }}>
            © 2026 LinkDrop. Todos los derechos reservados.
          </p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", margin: 0 }}>
            Hecho con ❤️ en Santiago, Chile 🇨🇱
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div
      style={{
        background: "#FAFAF7",
        color: "#1A1A18",
        minHeight: "100vh",
        fontFamily:
          "var(--font-instrument-sans), -apple-system, sans-serif",
      }}
    >
      <GrainOverlay />
      <WhatsAppFloat />
      <Navbar />
      <main>
        <Hero />
        <Integrations />
        <PainChat />
        <ForWho />
        <HowItWorks />
        <Benefits />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
