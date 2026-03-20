"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type FormState = {
  fullName: string;
  phone: string; // solo números (sin +56)
  email: string;
  rut: string;
  addressLine: string;
  addressExtra: string; // depto/casa
  comuna: string;
  confirmAddress: boolean;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

function onlyDigits(v: string) {
  return v.replace(/\D/g, "");
}

function isValidEmail(email: string) {
  if (!email) return true; // email opcional si quieres
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// RUT opcional: si lo quieres validar después, por ahora solo formato básico
function normalizeRut(rut: string) {
  return rut.replace(/[^0-9kK]/g, "").toUpperCase();
}

const COMUNAS_SCL = [
  "La Florida",
  "Puente Alto",
  "Santiago",
  "Ñuñoa",
  "Providencia",
  "Maipú",
  "Las Condes",
  "La Reina",
  "San Miguel",
  "Macul",
];
1
export default function Getdata() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    fullName: "",
    phone: "",
    email: "",
    rut: "",
    addressLine: "",
    addressExtra: "",
    comuna: "",
    confirmAddress: false,
  });

  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string>("");

  const phonePretty = useMemo(() => {
    const digits = onlyDigits(form.phone).slice(0, 9);
    // Formato simple chileno: 9 dígitos
    return digits;
  }, [form.phone]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setServerError("");
  }

  function validate(): FieldErrors {
    const e: FieldErrors = {};

    if (!form.fullName.trim()) e.fullName = "Ingresa tu nombre y apellido.";
    if (onlyDigits(form.phone).length !== 9)
      e.phone = "El teléfono debe tener 9 dígitos (sin +56).";

    if (!isValidEmail(form.email)) e.email = "Correo inválido.";

    if (!form.addressLine.trim()) e.addressLine = "Ingresa tu dirección.";
    if (!form.comuna.trim()) e.comuna = "Selecciona tu comuna.";
    if (!form.confirmAddress)
      e.confirmAddress = "Confirma que la dirección está bien.";

    // RUT opcional: si viene, exige mínimo 8 chars
    const rutNorm = normalizeRut(form.rut);
    if (rutNorm && rutNorm.length < 8) e.rut = "RUT incompleto.";

    return e;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const e2 = validate();
    if (Object.keys(e2).length) {
      setErrors(e2);
      return;
    }

    setIsSubmitting(true);
    setServerError("");

    // try {
    //   // Ajusta el endpoint a tu API real
    //   const res = await fetch(`/api/checkout/${token}/recipient`, {
    //     method: "PATCH",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({
    //       recipient: {
    //         fullName: form.fullName.trim(),
    //         phone: `+56${onlyDigits(form.phone)}`,
    //         email: form.email.trim() || null,
    //         rut: normalizeRut(form.rut) || null,
    //         addressLine: form.addressLine.trim(),
    //         addressExtra: form.addressExtra.trim() || null,
    //         comuna: form.comuna.trim(),
    //       },
    //     }),
    //   });

    //   if (!res.ok) {
    //     const text = await res.text();
    //     throw new Error(text || "No se pudo guardar tus datos.");
    //   }

    //   // Después rediriges a tu pantalla actual (rates)
    //   router.push(`/l/${token}`);
    // } 
    
    // catch (err: any) {
    //   setServerError(
    //     err?.message?.slice(0, 160) || "Hubo un error. Intenta nuevamente."
    //   );
    // } finally {
    //   setIsSubmitting(false);
    // }
  }

  return (
    <div className="min-h-screen bg-white px-4 py-10">
      {/* Wrapper angosto tipo Linktree */}
      <div className="mx-auto w-full max-w-[380px]">
        {/* Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="h-20 w-20 rounded-full overflow-hidden mb-4">
            <img
              src="/logo.png"
              alt="logo"
              className="h-full w-full object-cover"
            />
          </div>
  
          <h1 className="text-4xl font-bold text-gray-900">prubea</h1>
          <p className="mt-2 text-base text-gray-600">
            Completa tus datos para calcular el envío
          </p>
        </div>
  
        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {/* Nombre */}
          <div className="px-4 py-3">
            <p className="text-sm font-medium text-gray-800">Nombre y apellido</p>
            <input
              className="mt-1 w-full bg-transparent text-base text-gray-900 placeholder-gray-400 outline-none"
              placeholder="Ej: Giselle Parraguez"
            />
          </div>
  
          <Divider />
  
          {/* Teléfono */}
          <div className="grid grid-cols-3">
            <div className="px-4 py-3">
              <p className="text-sm font-medium text-gray-800">Teléfono</p>
            </div>
  
            <div className="col-span-2 flex items-center gap-3 px-4 py-3">
              <div className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700">
                +56
              </div>
              <input
                className="w-full bg-transparent text-base text-gray-900 placeholder-gray-400 outline-none"
                placeholder="9 dígitos"
                inputMode="numeric"
              />
            </div>
          </div>
  
          <Divider />
  
          {/* Email */}
          <div className="px-4 py-3">
            <p className="text-sm font-medium text-gray-800">
              Correo electrónico <span className="text-gray-500">(opcional)</span>
            </p>
            <input
              className="mt-1 w-full bg-transparent text-base text-gray-900 placeholder-gray-400 outline-none"
              placeholder="Ej: nombre@gmail.com"
            />
          </div>
  
          <Divider />
  
          {/* RUT */}
          <div className="px-4 py-3">
            <p className="text-sm font-medium text-gray-800">
              RUT <span className="text-gray-500">(opcional)</span>
            </p>
            <input
              className="mt-1 w-full bg-transparent text-base text-gray-900 placeholder-gray-400 outline-none"
              placeholder="Ej: 12.345.678-K"
            />
          </div>
  
          <Divider />
  
          {/* Dirección */}
          <div className="px-4 py-3">
            <p className="text-sm font-medium text-gray-800">Dirección</p>
            <input
              className="mt-1 w-full bg-transparent text-base text-gray-900 placeholder-gray-400 outline-none"
              placeholder="Ej: Santa Victoria 9421"
            />
          </div>
  
          <Divider />
  
          {/* Depto */}
          <div className="px-4 py-3">
            <p className="text-sm font-medium text-gray-800">
              Depto <span className="text-gray-500">(opcional)</span>
            </p>
            <input
              className="mt-1 w-full bg-transparent text-base text-gray-900 placeholder-gray-400 outline-none"
              placeholder="Ej: 402"
            />
          </div>
  
          <Divider />
  
          {/* Comuna */}
          <div className="px-4 py-3 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-800">Comuna</p>
            <svg
              className="h-5 w-5 text-gray-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                clipRule="evenodd"
              />
            </svg>
          </div>
  
          <Divider />
  
          {/* Checkbox */}
          <div className="px-4 py-4">
            <label className="flex items-center gap-3">
              <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
              <span className="text-sm text-gray-800">
                Confirmo que la dirección está bien
              </span>
            </label>
          </div>
  
          {/* CTA */}
          <div className="px-4 pb-4">
            <button className="h-11 w-full rounded-xl bg-blue-600 text-base font-semibold text-white">
              Ver opciones de envío
            </button>
          </div>
        </div>
  
        <p className="mt-5 text-center text-sm text-gray-500">
          Tus datos se usan solo para este envío.
        </p>
      </div>
    </div>
  );
  
  
}

/* ---------- UI bits ---------- */

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-sm font-semibold text-gray-800">{children}</div>;
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-sm text-red-600">{children}</p>;
}

function Input(props: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  error?: string;
}) {
  const { value, onChange, placeholder, autoComplete, inputMode, error } = props;

  return (
    <>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        className={[
          "mt-2 h-12 w-full rounded-xl border bg-white px-4 text-sm outline-none",
          error ? "border-red-300" : "border-gray-200",
          "focus:border-gray-400",
        ].join(" ")}
      />
      {error ? <ErrorText>{error}</ErrorText> : null}
    </>
  );

}



function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  const { label, value, onChange, placeholder, error, autoComplete, inputMode } =
    props;

  return (
    <div>
      <Label>{label}</Label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        className={[
          "mt-1 h-12 w-full rounded-xl border bg-white px-4 text-sm outline-none",
          error ? "border-red-300" : "border-gray-200",
          "focus:border-gray-400",
        ].join(" ")}
      />
      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
function Divider() {
    return <div className="h-px w-full bg-gray-200" />;
  }
  