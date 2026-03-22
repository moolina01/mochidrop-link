"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/utils/supabase";

const WA_LINK =
  "https://wa.me/56994284520?text=Hola,%20quiero%20probar%20LinkDrop%20gratis";
const ID_ENVIO = 3719603;

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
        <motion.a
          href="/generate-link"
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
        </motion.a>
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

type Phase = "initial" | "selecting" | "processing" | "paid" | "confirmed";

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
              Para tiendas que venden por Instagram y WhatsApp
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
            Tú vendes.
            <br />
            <span style={{ color: "#E8553D" }}>El envío que se resuelva solo.</span>
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
            LinkDrop genera un link que le mandas a tu cliente por WhatsApp. Ahí elige courier, paga con tarjeta y recibe su tracking. Tú no tocas nada.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.24 }}
            style={{ display: "flex", gap: 12, flexWrap: "wrap" }}
          >
            <motion.a
              href="/generate-link"
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
              Crear mi primer link gratis →
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
      title: "Creas el link en segundos",
      desc: "Nombre del cliente y dirección. LinkDrop arma un link personalizado con tu marca al instante.",
    },
    {
      num: "2",
      color: "#6C5CE7",
      shadow: "rgba(108,92,231,0.28)",
      title: "Tu cliente hace todo solo",
      desc: "Abre el link, ve precios reales de distintos couriers, elige el que prefiere y paga con su tarjeta. Sin que tú intervengas.",
    },
    {
      num: "3",
      color: "#2D8A56",
      shadow: "rgba(45,138,86,0.28)",
      title: "Listo. No tocas nada más.",
      desc: "La guía llega a tu correo lista para imprimir. Tu cliente recibe el tracking automático. Tú te dedicas a vender.",
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
            Un link. Todo resuelto.
          </h2>
          <p style={{ fontSize: 16, color: "#5C5C57", marginTop: 12, margin: "12px 0 0" }}>
            Lo que antes te tomaba 15 minutos ahora pasa en 30 segundos.
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

// ─── Integrations ─────────────────────────────────────────────────────────────
function Integrations() {
  const couriers = [
    { name: "Starken", color: "#E8553D", bg: "#FFF0ED", border: "#F5C4BB" },
    { name: "Chilexpress", color: "#C8372D", bg: "#FDF3F2", border: "#F0CECA" },
    { name: "Blue Express", color: "#1A6BC4", bg: "#EFF5FF", border: "#C2D9F5" },
  ];

  return (
    <section style={{ background: "#FAFAF7", padding: "96px 24px" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>

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
            letterSpacing: "0.12em", color: "#E8553D", marginBottom: 12,
          }}>
            Integraciones
          </p>
          <h2 style={{
            fontSize: "clamp(26px, 3.5vw, 38px)", fontWeight: 700,
            color: "#1A1A18", letterSpacing: "-0.02em", marginBottom: 14,
          }}>
            Un link, cuatro servicios trabajando por ti
          </h2>
          <p style={{
            fontSize: 16, color: "#5C5C57", maxWidth: 460,
            margin: "0 auto", lineHeight: 1.7,
          }}>
            LinkDrop conecta couriers y pagos para que tu cliente haga todo solo desde un link.
          </p>
        </motion.div>

        {/* FLOW — hero card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          style={{
            background: "#1A1A18",
            borderRadius: 20,
            padding: "36px 40px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 28,
            flexWrap: "wrap",
          }}
        >
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: "#6C5CE7",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, flexShrink: 0,
          }}>
            💳
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <p style={{ fontWeight: 700, fontSize: 20, color: "#fff", margin: 0 }}>
                Pago con FLOW
              </p>
              <span style={{
                background: "#6C5CE7", color: "#fff",
                fontSize: 11, fontWeight: 600,
                padding: "3px 10px", borderRadius: 100,
              }}>
                Recomendado
              </span>
            </div>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", margin: 0, lineHeight: 1.6 }}>
              Tu cliente paga con tarjeta de crédito o débito — sin transferencias, sin mensajes de "ya te mandé el comprobante". El cobro es seguro, instantáneo y confirmado.
            </p>
          </div>
          <div style={{
            display: "flex", flexDirection: "column", gap: 8, flexShrink: 0,
          }}>
            {["Webpay Plus", "Tarjeta de crédito", "Tarjeta de débito"].map((m, i) => (
              <span key={i} style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "rgba(108,92,231,0.2)",
                border: "1px solid rgba(108,92,231,0.35)",
                borderRadius: 100, padding: "5px 12px",
                fontSize: 12, fontWeight: 500, color: "#C4BCFF",
              }}>
                ✓ {m}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Couriers — 3 simple pills */}
        <div className="grid md:grid-cols-3 grid-cols-1 gap-3">
          {couriers.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.07 }}
              style={{
                background: "#fff",
                border: "1.5px solid #E8E8E3",
                borderRadius: 14,
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div style={{
                width: 10, height: 10, borderRadius: "50%",
                background: c.color, flexShrink: 0,
              }} />
              <p style={{ fontWeight: 600, fontSize: 15, color: "#1A1A18", margin: 0 }}>
                {c.name}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.4 }}
          style={{
            textAlign: "center", fontSize: 13,
            color: "#9C9C95", marginTop: 20,
          }}
        >
          Los couriers se muestran con precios reales al momento de la compra — tu cliente elige el que prefiere.
        </motion.p>
      </div>
    </section>
  );
}

// ─── Generate Form ────────────────────────────────────────────────────────────
interface GenerateFormProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  loading: boolean;
  modalOpen: boolean;
  onCloseModal: () => void;
  idEnvio: number;
}

function GenerateForm({
  onSubmit,
  loading,
  modalOpen,
  onCloseModal,
  idEnvio,
}: GenerateFormProps) {
  const inputStyle: React.CSSProperties = {
    width: "100%",
    border: "1.5px solid #E8E8E3",
    borderRadius: 10,
    padding: "12px 16px",
    fontSize: 14,
    color: "#1A1A18",
    background: "#FAFAF7",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    display: "block",
    fontWeight: 500,
    fontSize: 14,
    color: "#1A1A18",
    marginBottom: 8,
  };

  return (
    <section
      id="generar"
      style={{ background: "#fff", padding: "96px 24px" }}
    >
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          style={{ textAlign: "center", marginBottom: 40 }}
        >
          <h2
            style={{
              fontSize: "clamp(26px, 3.5vw, 36px)",
              fontWeight: 700,
              color: "#1A1A18",
              marginBottom: 12,
            }}
          >
            Pruébalo ahora con tu propia marca
          </h2>
          <p style={{ color: "#5C5C57", fontSize: 15, margin: 0 }}>
            En 30 segundos vas a ver exactamente lo que verá tu próximo cliente.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          style={{
            background: "#fff",
            border: "1.5px solid #E8E8E3",
            borderRadius: 20,
            padding: 40,
            boxShadow: "0 12px 40px rgba(0,0,0,0.08)",
          }}
        >
          <form
            onSubmit={onSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 20 }}
          >
            <div>
              <label style={labelStyle}>Nombre de tu PyME</label>
              <input
                name="nombre"
                type="text"
                placeholder="Ej: Moments joyas"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Sube tu logo</label>
              <input
                name="logo"
                type="file"
                accept="image/*"
                style={{ ...inputStyle, cursor: "pointer" }}
              />
            </div>
            <div>
              <label style={labelStyle}>Tu correo</label>
              <input
                name="email"
                type="email"
                placeholder="nombre@empresa.cl"
                style={inputStyle}
              />
            </div>
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={loading ? {} : { y: -2 }}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: 100,
                fontWeight: 600,
                fontSize: 15,
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                background: loading ? "#9C9C95" : "#E8553D",
                color: "#fff",
                boxShadow: loading
                  ? "none"
                  : "0 4px 20px rgba(232,85,61,0.3)",
                fontFamily: "inherit",
              }}
            >
              {loading ? "Creando link…" : "Crear mi link de prueba"}
            </motion.button>
          </form>
        </motion.div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: 24,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            style={{
              background: "#fff",
              borderRadius: 20,
              padding: 40,
              maxWidth: 440,
              width: "100%",
              textAlign: "center",
              boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
            }}
          >
            <h2
              style={{
                fontWeight: 700,
                fontSize: 24,
                color: "#1A1A18",
                marginBottom: 12,
              }}
            >
              Tu link de prueba está listo 🎉
            </h2>
            <p
              style={{ color: "#5C5C57", fontSize: 14, marginBottom: 24 }}
            >
              Este es un link de demostración para que veas la experiencia que tendrán tus clientes.
            </p>
            <div
              style={{
                background: "#FAFAF7",
                border: "1.5px solid #E8E8E3",
                borderRadius: 10,
                padding: "12px 16px",
                fontSize: 13,
                color: "#5C5C57",
                wordBreak: "break-all",
                marginBottom: 24,
              }}
            >
              https://www.mochidrop.cl/envio?id={idEnvio}
            </div>
            <a
              href={`https://www.mochidrop.cl/envio?id=${idEnvio}`}
              target="_blank"
              style={{
                display: "inline-block",
                background: "#E8553D",
                color: "#fff",
                padding: "12px 28px",
                borderRadius: 100,
                fontWeight: 600,
                fontSize: 15,
                textDecoration: "none",
                boxShadow: "0 4px 20px rgba(232,85,61,0.3)",
              }}
            >
              Abrir link
            </a>
            <br />
            <button
              onClick={onCloseModal}
              style={{
                marginTop: 16,
                fontSize: 13,
                color: "#9C9C95",
                background: "none",
                border: "none",
                cursor: "pointer",
                textDecoration: "underline",
                fontFamily: "inherit",
              }}
            >
              Cerrar
            </button>
          </motion.div>
        </div>
      )}
    </section>
  );
}

// ─── Final CTA ────────────────────────────────────────────────────────────────
function FinalCTA() {
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
            Tu próximo envío puede tomar 30 segundos.
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
            Crea tu primer link ahora. Sin tarjeta, sin compromiso, sin letra chica.
          </p>
          <motion.a
            href={WA_LINK}
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
            Empezar gratis por WhatsApp →
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
              ✓ 20 envíos gratis al mes — para siempre
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
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const nombre = (
      form.elements.namedItem("nombre") as HTMLInputElement
    ).value.trim();
    const email = (
      form.elements.namedItem("email") as HTMLInputElement
    ).value.trim();
    const logoInput = form.elements.namedItem("logo") as HTMLInputElement;
    const logoFile = logoInput.files?.[0] || null;

    if (!nombre || !email) {
      alert("Por favor completa todos los campos obligatorios.");
      return;
    }

    setLoading(true);
    let logoUrl = "";

    try {
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

      const res = await fetch(
        "https://mochidrop-n8n.utdxt3.easypanel.host/webhook/a58a5ae8-6128-4a3f-94fa-27581654f2bf",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_envio: ID_ENVIO,
            nombre_pyme: nombre,
            email,
            logo_url: logoUrl,
          }),
        }
      );
      if (!res.ok) throw new Error("Webhook error");
      setModalOpen(true);
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error generando el link.");
    } finally {
      setLoading(false);
    }
  };

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
        <PainChat />
        <HowItWorks />
        <Comparison />
        <Calculator />
        <Integrations />
        <GenerateForm
          onSubmit={handleSubmit}
          loading={loading}
          modalOpen={modalOpen}
          onCloseModal={() => setModalOpen(false)}
          idEnvio={ID_ENVIO}
        />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
