"use client";

import { useRef } from "react";

export type BusinessBrand = {
  businessName: string;
  logoDataUrl: string; // Para preview (MVP). Luego lo cambias por URL subida a storage.
};

export default function BusinessBranding({
  value,
  onChange,
}: {
  value: BusinessBrand;
  onChange: (next: BusinessBrand) => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  function pickFile() {
    fileRef.current?.click();
  }

  function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      onChange({ ...value, logoDataUrl: dataUrl });
    };
    reader.readAsDataURL(file);
  }

  function clearLogo() {
    onChange({ ...value, logoDataUrl: "" });
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <section>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Tu marca</h3>
          <p className="mt-1 text-sm text-gray-600">
            Esto aparece en el link que verá tu cliente.
          </p>
        </div>
        <span className="text-xs font-semibold text-gray-400">Opcional</span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_180px]">
        <div className="space-y-3">
          <input
            value={value.businessName}
            onChange={(e) => onChange({ ...value, businessName: e.target.value })}
            placeholder="Nombre de tu pyme"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm
                       focus:outline-none focus:ring-2 focus:ring-green-400"
          />

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
            Tip: si no tienes logo, puedes subir una imagen simple (tu “M” o icono) y listo.
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500">Logo</p>
            {value.logoDataUrl ? (
              <button
                onClick={clearLogo}
                className="text-xs font-semibold text-gray-500 hover:text-gray-900"
              >
                Quitar
              </button>
            ) : null}
          </div>

          <div className="mt-3 flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 p-3">
            {value.logoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={value.logoDataUrl}
                alt="Logo"
                className="h-16 w-16 rounded-2xl object-cover ring-1 ring-black/10"
              />
            ) : (
              <div className="h-16 w-16 rounded-2xl bg-white ring-1 ring-black/10 flex items-center justify-center text-gray-400">
                ⬆️
              </div>
            )}

            <button
              type="button"
              onClick={pickFile}
              className="mt-3 w-full rounded-xl bg-[#0B1020] px-3 py-2 text-xs font-semibold text-white hover:bg-black"
            >
              {value.logoDataUrl ? "Cambiar logo" : "Subir logo"}
            </button>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFileSelected}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
