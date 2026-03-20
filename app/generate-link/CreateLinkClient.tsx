"use client";

import { useMemo, useState } from "react";
import BrandHeader from "./components/BrandHeader";
import LinkQuotaPill from "./components/LinkQuotaPill";
import FooterHint from "./components/FooterHint";
import PreviewCard from "./components/PreviewCard";

/** Estado mínimo para crear un link de checkout */
type FormState = {
  businessName: string;
  logoDataUrl: string;
  productName: string;
  productPrice: string; // string para permitir escribir cómodo
  productPhotoDataUrl: string;
};

const DEFAULT_STATE: FormState = {
  businessName: "",
  logoDataUrl: "",
  productName: "",
  productPrice: "",
  productPhotoDataUrl: "",
};

function toCLP(raw: string) {
  // deja solo dígitos
  const digits = raw.replace(/[^\d]/g, "");
  return digits;
}

function formatCLP(digits: string) {
  if (!digits) return "";
  // separador de miles simple
  const n = Number(digits);
  if (!Number.isFinite(n) || n <= 0) return "";
  return n.toLocaleString("es-CL");
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read_error"));
    reader.onload = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(file);
  });
}

function hasMinimalRequired(s: FormState) {
  return (
    s.productName.trim().length > 0 &&
    toCLP(s.productPrice).length > 0 &&
    Number(toCLP(s.productPrice)) > 0 &&
    s.businessName.trim().length > 0
    // foto y logo pueden ser opcionales (recomendado, pero no bloqueante)
  );
}

export default function CreateLinkClient() {
  const [linksLeft, setLinksLeft] = useState<number>(7);
  const [state, setState] = useState<FormState>(DEFAULT_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string>("");
  const [error, setError] = useState<string>("");

  const canGenerate = useMemo(() => {
    if (linksLeft <= 0) return false;
    return hasMinimalRequired(state);
  }, [linksLeft, state]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  async function onPickLogo(file?: File | null) {
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataURL(file);
      setField("logoDataUrl", dataUrl);
    } catch {
      setError("No pudimos cargar el logo. Intenta con otra imagen.");
    }
  }

  async function onPickProductPhoto(file?: File | null) {
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataURL(file);
      setField("productPhotoDataUrl", dataUrl);
    } catch {
      setError("No pudimos cargar la foto del producto. Intenta con otra imagen.");
    }
  }

  async function onGenerate() {
    setError("");
    setGeneratedUrl("");

    if (linksLeft <= 0) {
      setError("Ya usaste tus 7 links gratis. Escríbenos a soporte para continuar.");
      return;
    }

    if (!hasMinimalRequired(state)) {
      setError("Completa al menos: nombre del producto, precio y nombre de tu negocio.");
      return;
    }

    setIsSubmitting(true);

    try {
      // ⚠️ Aquí conectas a tu API (Supabase) para crear el checkout real.
      // MVP UX: link mock
      const id = crypto.randomUUID().slice(0, 8);
      const url = `https://mochidrop.link/p/${id}`;

      setGeneratedUrl(url);
      setLinksLeft((n) => Math.max(0, n - 1));
    } catch {
      setError("No pudimos generar el link. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function copyToClipboard() {
    if (!generatedUrl) return;
    try {
      await navigator.clipboard.writeText(generatedUrl);
    } catch {
      // silencioso
    }
  }

  // ✅ Adaptación para reutilizar tu PreviewCard actual:
  // Creamos objetos compatibles con props existentes.
  const previewBusiness = {
    businessName: state.businessName,
    logoDataUrl: state.logoDataUrl,
  };

  // En tu PreviewCard actual muestras datos de envío; aquí lo usamos solo como “preview”.
  // Si tu PreviewCard depende estrictamente de origin/recipient/pack, te recomiendo
  // crear un PreviewCardCheckout nuevo, pero por ahora le pasamos valores vacíos.
  const previewOrigin = { originCommune: "", originAddress: "" };
  const previewRecipient = {
    recipientName: "",
    recipientPhone: "",
    destCommune: "",
    destAddress: "",
  };
  const previewPack = { measuresAndWeight: "" };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:py-14">
      <BrandHeader />

      <div className="mt-6 flex justify-center">
        <LinkQuotaPill linksLeft={linksLeft} />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        {/* LEFT: Simple Creator */}
        <div className="rounded-2xl bg-white/95 shadow-2xl ring-1 ring-black/10">
          <div className="p-6 md:p-8">
            <div>
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
                Crea tu link de pago
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                30 segundos. Tu cliente verá el producto, el total y podrá pagar.
              </p>
            </div>

            <div className="mt-8 space-y-5">
              {/* Negocio */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-900">Nombre de tu negocio</label>
                <input
                  value={state.businessName}
                  onChange={(e) => setField("businessName", e.target.value)}
                  placeholder="Ej: Tienda Luna"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-900">
                  Logo (opcional, recomendado)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => onPickLogo(e.target.files?.[0])}
                    className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-xl file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-gray-900 hover:file:bg-gray-200"
                  />
                  {state.logoDataUrl ? (
                    <button
                      type="button"
                      onClick={() => setField("logoDataUrl", "")}
                      className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-900 hover:bg-gray-50"
                    >
                      Quitar
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="my-2 h-px bg-gray-100" />

              {/* Producto */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-900">Nombre del producto</label>
                <input
                  value={state.productName}
                  onChange={(e) => setField("productName", e.target.value)}
                  placeholder="Ej: Polera Nike Negra (Talla M)"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-900">Precio</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
                      $
                    </span>
                    <input
                      inputMode="numeric"
                      value={formatCLP(toCLP(state.productPrice))}
                      onChange={(e) => setField("productPrice", toCLP(e.target.value))}
                      placeholder="14.990"
                      className="w-full rounded-xl border border-gray-200 bg-white pl-7 pr-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-400"
                    />
                  </div>
                  <p className="text-xs text-gray-500">Precio del producto (sin envío).</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-900">
                    Foto del producto (opcional)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => onPickProductPhoto(e.target.files?.[0])}
                      className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-xl file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-gray-900 hover:file:bg-gray-200"
                    />
                    {state.productPhotoDataUrl ? (
                      <button
                        type="button"
                        onClick={() => setField("productPhotoDataUrl", "")}
                        className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-900 hover:bg-gray-50"
                      >
                        Quitar
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <button
                onClick={onGenerate}
                disabled={!canGenerate || isSubmitting}
                className={[
                  "w-full rounded-xl px-5 py-4 text-base font-semibold text-white transition",
                  "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400",
                  canGenerate && !isSubmitting
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-gray-300 cursor-not-allowed",
                ].join(" ")}
              >
                {isSubmitting ? "Generando…" : "Generar link de pago"}
              </button>

              {generatedUrl ? (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-500">Tu link</p>
                      <p className="truncate text-sm font-semibold text-gray-900">{generatedUrl}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        Pégalo en WhatsApp/Instagram. El cliente completa envío y paga.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={copyToClipboard}
                        className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100"
                      >
                        Copiar
                      </button>
                      <a
                        href={generatedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl bg-[#0B1020] px-4 py-2 text-sm font-semibold text-white hover:bg-black"
                      >
                        Abrir
                      </a>
                    </div>
                  </div>
                </div>
              ) : null}

              <FooterHint />
            </div>
          </div>
        </div>

        {/* RIGHT: Preview */}
        <div className="lg:sticky lg:top-8 h-fit">
          <div className="rounded-2xl bg-white/80 shadow-xl ring-1 ring-black/10 p-4 md:p-6">
            <p className="text-xs font-semibold text-gray-500">Preview (cliente)</p>

            <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-3">
                {state.logoDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={state.logoDataUrl}
                    alt="logo"
                    className="h-10 w-10 rounded-xl object-cover ring-1 ring-black/10"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-xl bg-gray-100 ring-1 ring-black/10" />
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {state.businessName || "Tu negocio"}
                  </p>
                  <p className="text-xs text-gray-500">Pago seguro • Link de compra</p>
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                {state.productPhotoDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={state.productPhotoDataUrl}
                    alt="producto"
                    className="h-20 w-20 rounded-xl object-cover ring-1 ring-black/10"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-xl bg-gray-100 ring-1 ring-black/10" />
                )}

                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {state.productName || "Nombre del producto"}
                  </p>
                  <p className="mt-1 text-lg font-extrabold text-gray-900">
                    {formatCLP(toCLP(state.productPrice))
                      ? `$${formatCLP(toCLP(state.productPrice))}`
                      : "$0"}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    El envío se calcula en el siguiente paso.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="mt-4 w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white"
              >
                Continuar
              </button>
            </div>

            {/* Si quieres mantener tu PreviewCard viejo, lo dejo abajo (opcional): */}
            <div className="mt-6 hidden">
              <PreviewCard
                business={previewBusiness as any}
                recipient={previewRecipient as any}
                origin={previewOrigin as any}
                pack={previewPack as any}
              />
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
