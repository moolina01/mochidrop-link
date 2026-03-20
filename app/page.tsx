"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { supabase } from "@/utils/supabase";

const WA_LINK =
  "https://wa.me/56994284520?text=Hola,%20quiero%20probar%20MochiDrop%20gratis";
const ID_ENVIO = 3719603;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fadeInUpView: any = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.8 },
};

// ─── Navbar ──────────────────────────────────────────────────────────────────
function Navbar() {
  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: "rgba(250,250,247,0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid #E8E8E3",
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
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "#E8553D",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            M
          </div>
          <span
            style={{ fontWeight: 700, fontSize: 17, color: "#1A1A18" }}
          >
            MochiDrop
          </span>
        </div>

        <motion.a
          href={WA_LINK}
          whileHover={{ y: -2 }}
          style={{
            background: "#1A1A18",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: 100,
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          Probar gratis →
        </motion.a>
      </div>
    </header>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section
      style={{
        background: "#FAFAF7",
        paddingTop: 128,
        paddingBottom: 96,
        textAlign: "center",
        paddingLeft: 24,
        paddingRight: 24,
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "#FFF0ED",
            borderRadius: 100,
            padding: "8px 16px",
            marginBottom: 32,
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
          <span style={{ fontSize: 13, color: "#E8553D", fontWeight: 500 }}>
            Para PYMEs que venden por Instagram y WhatsApp
          </span>
        </motion.div>

        {/* H1 */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          style={{
            fontSize: "clamp(38px, 6vw, 64px)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.08,
            color: "#1A1A18",
            marginBottom: 24,
          }}
        >
          Deja de cotizar envíos
          <br />
          <span style={{ color: "#E8553D", position: "relative" }}>
            uno por uno.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{
            fontSize: "clamp(17px, 2vw, 20px)",
            color: "#5C5C57",
            maxWidth: 600,
            margin: "0 auto 40px",
            lineHeight: 1.6,
          }}
        >
          Manda un link, tu cliente elige courier, paga el envío y recibe su
          tracking. Sin explicar tarifas, sin hacer filas, sin perder ventas.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          style={{
            display: "flex",
            gap: 16,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <motion.a
            href={WA_LINK}
            whileHover={{ y: -2 }}
            style={{
              background: "#E8553D",
              color: "#fff",
              padding: "14px 28px",
              borderRadius: 100,
              fontWeight: 600,
              fontSize: 16,
              textDecoration: "none",
              boxShadow: "0 4px 20px rgba(232,85,61,0.3)",
              display: "inline-block",
            }}
          >
            Quiero probarlo gratis
          </motion.a>
          <motion.a
            href="#como-funciona"
            whileHover={{ y: -2 }}
            style={{
              background: "#fff",
              color: "#1A1A18",
              padding: "14px 28px",
              borderRadius: 100,
              fontWeight: 600,
              fontSize: 16,
              textDecoration: "none",
              border: "1.5px solid #E8E8E3",
              display: "inline-block",
            }}
          >
            Ver cómo funciona ↓
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Pain Section ─────────────────────────────────────────────────────────────
function PainSection() {
  const pains = [
    {
      emoji: "😩",
      bold: '"¿Cuánto sale el envío a Temuco?"',
      desc: "y tienes que abrir Starken, Chilexpress, cotizar, sacar captura y mandarlo por WhatsApp. Por cada cliente.",
    },
    {
      emoji: "🔄",
      bold: '"¿Y a La Serena? ¿Y a Concepción?"',
      desc: "las mismas preguntas todo el día. Mientras tanto, pierdes tiempo que podrías usar para vender.",
    },
    {
      emoji: "💸",
      bold: '"Ya, déjalo, mejor no compro"',
      desc: "el cliente se aburre de esperar la cotización o no quiere transferir el envío aparte. Venta perdida.",
    },
    {
      emoji: "🏃",
      bold: "Ir a dejar el paquete, hacer la guía a mano, mandar el tracking...",
      desc: "tiempo muerto que se repite con cada pedido.",
    },
  ];

  return (
    <section style={{ padding: "96px 24px", background: "#FAFAF7" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <motion.div {...fadeInUpView}>
          {/* Card wrapper with gradient top border */}
          <div style={{ borderRadius: 16, overflow: "hidden" }}>
            <div
              style={{
                height: 4,
                background: "linear-gradient(90deg, #E8553D, #F0B429)",
              }}
            />
            <div
              style={{
                background: "#fff",
                border: "1.5px solid #E8E8E3",
                borderTop: "none",
                borderRadius: "0 0 16px 16px",
                padding: "48px",
                boxShadow:
                  "0 4px 20px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "#E8553D",
                  marginBottom: 16,
                }}
              >
                ¿Te suena familiar?
              </p>
              <h2
                style={{
                  fontSize: "clamp(24px, 3vw, 32px)",
                  fontWeight: 700,
                  color: "#1A1A18",
                  marginBottom: 32,
                }}
              >
                Cada envío te cuesta 15 minutos de tu vida
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {pains.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 16,
                      background: "#FDF6F5",
                      borderLeft: "3px solid #E8553D",
                      borderRadius: 10,
                      padding: 16,
                    }}
                  >
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{p.emoji}</span>
                    <p style={{ margin: 0, lineHeight: 1.6 }}>
                      <strong style={{ color: "#1A1A18" }}>{p.bold}</strong>{" "}
                      <span style={{ color: "#5C5C57" }}>{p.desc}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
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
      title: "Pegas los datos",
      desc: "Nombre y dirección del cliente. MochiDrop genera un link personalizado con tu marca.",
    },
    {
      num: "2",
      color: "#6C5CE7",
      title: "Tu cliente elige y paga",
      desc: "Ve las opciones de courier con precios reales. Elige, paga el envío y listo. Todo en el link.",
    },
    {
      num: "3",
      color: "#2D8A56",
      title: "Guía + tracking automático",
      desc: "Recibes la guía lista para imprimir. Tu cliente recibe el seguimiento automáticamente.",
    },
  ];

  return (
    <section id="como-funciona" style={{ padding: "96px 24px", background: "#fff" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <motion.div {...fadeInUpView} style={{ textAlign: "center", marginBottom: 64 }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
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
            }}
          >
            De 15 minutos a 30 segundos
          </h2>
        </motion.div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 24,
            alignItems: "center",
          }}
        >
          {steps.map((step, i) => (
            <div
              key={i}
              style={{ display: "flex", alignItems: "center", gap: 16 }}
            >
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                style={{
                  flex: 1,
                  background: "#fff",
                  border: "1.5px solid #E8E8E3",
                  borderRadius: 16,
                  padding: 32,
                  boxShadow:
                    "0 4px 20px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)",
                  cursor: "default",
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: step.color,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 18,
                    marginBottom: 20,
                  }}
                >
                  {step.num}
                </div>
                <h3
                  style={{
                    fontWeight: 600,
                    fontSize: 18,
                    color: "#1A1A18",
                    marginBottom: 12,
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    fontSize: 14,
                    color: "#5C5C57",
                    lineHeight: 1.65,
                    margin: 0,
                  }}
                >
                  {step.desc}
                </p>
              </motion.div>

              {i < 2 && (
                <span
                  className="hidden md:block"
                  style={{ color: "#9C9C95", fontSize: 24, flexShrink: 0 }}
                >
                  →
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Comparison ───────────────────────────────────────────────────────────────
function Comparison() {
  const without = [
    "Cotizas envío manualmente en cada courier",
    "Mandas capturas de precio por WhatsApp",
    "Esperas que el cliente te transfiera",
    "Generas la guía a mano en la web del courier",
    "Copias y pegas el tracking por WhatsApp",
    "~15 minutos por cada envío",
  ];
  const with_ = [
    "Pegas los datos del cliente → se genera el link",
    "Mandas el link por WhatsApp",
    "El cliente elige courier y paga solo",
    "La guía se genera automáticamente",
    "El tracking llega solo al cliente",
    "~30 segundos por cada envío",
  ];

  return (
    <section style={{ padding: "96px 24px", background: "#FAFAF7" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <motion.div {...fadeInUpView} style={{ textAlign: "center", marginBottom: 64 }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#E8553D",
              marginBottom: 12,
            }}
          >
            Antes vs. Después
          </p>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 700,
              color: "#1A1A18",
              letterSpacing: "-0.02em",
            }}
          >
            Tu día con y sin MochiDrop
          </h2>
        </motion.div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 24,
          }}
        >
          {/* Sin MochiDrop */}
          <motion.div
            {...fadeInUpView}
            style={{
              background: "#FDF6F5",
              border: "1.5px solid #F0D0CA",
              borderRadius: 16,
              padding: 32,
            }}
          >
            <h3
              style={{
                fontWeight: 700,
                fontSize: 20,
                color: "#E8553D",
                marginBottom: 24,
              }}
            >
              ❌ Sin MochiDrop
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              {without.map((item, i) => (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    fontSize: 14,
                    color: "#5C5C57",
                  }}
                >
                  <span style={{ color: "#E8553D", marginTop: 1, flexShrink: 0 }}>✗</span>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Con MochiDrop */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            style={{
              background: "#E8F5ED",
              border: "1.5px solid #B8DCCA",
              borderRadius: 16,
              padding: 32,
            }}
          >
            <h3
              style={{
                fontWeight: 700,
                fontSize: 20,
                color: "#2D8A56",
                marginBottom: 24,
              }}
            >
              ✅ Con MochiDrop
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              {with_.map((item, i) => (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    fontSize: 14,
                    color: "#5C5C57",
                  }}
                >
                  <span style={{ color: "#2D8A56", marginTop: 1, flexShrink: 0 }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Calculator ───────────────────────────────────────────────────────────────
function Calculator() {
  const [shipments, setShipments] = useState(15);

  const manualMin = shipments * 15;
  const mochiMin = Math.round(shipments * 0.5);
  const savedPerMonth = (((manualMin - mochiMin) * 4) / 60).toFixed(1);

  return (
    <section style={{ padding: "96px 24px", background: "#fff" }}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <motion.div
          {...fadeInUpView}
          style={{
            background: "#1A1A18",
            borderRadius: 16,
            padding: "48px",
            position: "relative",
            overflow: "hidden",
            color: "#fff",
          }}
        >
          {/* Glow decorativo */}
          <div
            style={{
              position: "absolute",
              top: -60,
              right: -60,
              width: 220,
              height: 220,
              background: "radial-gradient(circle, rgba(232,85,61,0.15), transparent)",
              borderRadius: "50%",
              pointerEvents: "none",
            }}
          />

          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#FF6B52",
              marginBottom: 12,
            }}
          >
            Calculadora de tiempo
          </p>
          <h2
            style={{
              fontSize: "clamp(24px, 3vw, 32px)",
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            ¿Cuánto tiempo estás perdiendo?
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.6)",
              marginBottom: 32,
              fontSize: 16,
            }}
          >
            Ingresa cuántos envíos haces a la semana
          </p>

          {/* Input */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
            <input
              type="number"
              value={shipments}
              min={1}
              onChange={(e) =>
                setShipments(Math.max(1, parseInt(e.target.value) || 1))
              }
              style={{
                width: 120,
                fontSize: 28,
                fontWeight: 700,
                textAlign: "center",
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 12,
                padding: "12px",
                color: "#fff",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Results */}
          <div
            style={{
              background: "rgba(255,255,255,0.08)",
              borderRadius: 10,
              padding: 24,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: 14,
                color: "rgba(255,255,255,0.7)",
              }}
            >
              <span>Tiempo manual por semana</span>
              <span style={{ fontWeight: 600, color: "#fff" }}>{manualMin} min</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: 14,
                color: "rgba(255,255,255,0.7)",
              }}
            >
              <span>Tiempo con MochiDrop</span>
              <span style={{ fontWeight: 600, color: "#fff" }}>{mochiMin} min</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: 16,
                borderTop: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              <span style={{ fontWeight: 500, color: "#fff" }}>
                Tiempo que recuperas al mes
              </span>
              <span
                style={{ fontWeight: 700, fontSize: 26, color: "#FF6B52" }}
              >
                {savedPerMonth}h
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Stats ────────────────────────────────────────────────────────────────────
function Stats() {
  const stats = [
    { num: "30s", desc: "Tiempo promedio por envío" },
    { num: "3", desc: "Couriers para elegir" },
    { num: "$0", desc: "Para empezar a usar" },
  ];

  return (
    <section style={{ padding: "96px 24px", background: "#FAFAF7" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <motion.div {...fadeInUpView} style={{ textAlign: "center", marginBottom: 64 }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#E8553D",
              marginBottom: 12,
            }}
          >
            En números
          </p>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 700,
              color: "#1A1A18",
              letterSpacing: "-0.02em",
            }}
          >
            Hecho para vendedoras reales
          </h2>
        </motion.div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 24,
          }}
        >
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              style={{
                background: "#fff",
                border: "1.5px solid #E8E8E3",
                borderRadius: 16,
                padding: 32,
                textAlign: "center",
                boxShadow:
                  "0 4px 20px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)",
                cursor: "default",
              }}
            >
              <p
                style={{
                  fontSize: 36,
                  fontWeight: 700,
                  color: "#E8553D",
                  marginBottom: 8,
                }}
              >
                {s.num}
              </p>
              <p style={{ fontSize: 14, color: "#5C5C57", margin: 0 }}>
                {s.desc}
              </p>
            </motion.div>
          ))}
        </div>
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
    <section id="generar" style={{ padding: "96px 24px", background: "#fff" }}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <motion.div
          {...fadeInUpView}
          style={{ textAlign: "center", marginBottom: 48 }}
        >
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 700,
              color: "#1A1A18",
              letterSpacing: "-0.02em",
              marginBottom: 12,
            }}
          >
            Genera tu link de envío
          </h2>
          <p style={{ color: "#5C5C57", fontSize: 16, margin: 0 }}>
            Personalízalo con el nombre de tu marca y pruébalo ahora mismo.
          </p>
        </motion.div>

        <motion.div
          {...fadeInUpView}
          style={{
            background: "#fff",
            border: "1.5px solid #E8E8E3",
            borderRadius: 16,
            padding: 40,
            boxShadow:
              "0 12px 40px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)",
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
                transition: "background 0.2s",
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
            <p style={{ color: "#5C5C57", fontSize: 14, marginBottom: 24 }}>
              Este es un link de demostración para que veas cómo lo verán tus
              clientes.
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
    <section style={{ padding: "96px 24px", background: "#FAFAF7" }}>
      <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
        <motion.div {...fadeInUpView}>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 700,
              color: "#1A1A18",
              letterSpacing: "-0.02em",
              marginBottom: 16,
            }}
          >
            ¿Lista para dejar de cotizar envíos a mano?
          </h2>
          <p
            style={{
              color: "#5C5C57",
              fontSize: 18,
              marginBottom: 40,
              lineHeight: 1.6,
            }}
          >
            Crea tu primer link de envío en menos de un minuto. Sin tarjeta,
            sin compromiso, sin letra chica.
          </p>
          <motion.a
            href={WA_LINK}
            whileHover={{ y: -2 }}
            style={{
              display: "inline-block",
              background: "#E8553D",
              color: "#fff",
              padding: "16px 32px",
              borderRadius: 100,
              fontWeight: 600,
              fontSize: 16,
              textDecoration: "none",
              boxShadow: "0 4px 20px rgba(232,85,61,0.3)",
            }}
          >
            Empezar gratis por WhatsApp →
          </motion.a>
          <div style={{ marginTop: 24 }}>
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
              ✓ 20 envíos gratis cada mes, para siempre
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid #E8E8E3",
        background: "#FAFAF7",
        padding: "40px 24px",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <p style={{ fontSize: 14, color: "#9C9C95", margin: 0 }}>
          © 2025 MochiDrop — Santiago, Chile 🇨🇱
        </p>
        <div style={{ display: "flex", gap: 24 }}>
          <a
            href="mailto:contacto@mochidrop.cl"
            style={{
              fontSize: 14,
              color: "#9C9C95",
              textDecoration: "none",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.color = "#E8553D")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.color = "#9C9C95")
            }
          >
            contacto@mochidrop.cl
          </a>
          <a
            href={WA_LINK}
            style={{
              fontSize: 14,
              color: "#9C9C95",
              textDecoration: "none",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.color = "#E8553D")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.color = "#9C9C95")
            }
          >
            WhatsApp
          </a>
        </div>
      </div>
    </footer>
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
      <Navbar />
      <main>
        <Hero />
        <PainSection />
        <HowItWorks />
        <Comparison />
        <Calculator />
        <Stats />
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
