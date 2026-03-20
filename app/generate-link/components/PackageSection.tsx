"use client";

export type PackageData = {
  measuresAndWeight: string; // Ej: 10x10x10, 1 kg
};

export default function PackageSection({
  value,
  onChange,
}: {
  value: PackageData;
  onChange: (next: PackageData) => void;
}) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-gray-900">Paquete</h3>
      <p className="mt-1 text-sm text-gray-600">
        Solo lo esencial para cotizar.
      </p>

      <div className="mt-4">
        <input
          value={value.measuresAndWeight}
          onChange={(e) => onChange({ measuresAndWeight: e.target.value })}
          placeholder="Medidas y peso · Ej: 10x10x10, 1 kg"
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm
                     focus:outline-none focus:ring-2 focus:ring-green-400"
        />

        <div className="mt-2 text-xs text-gray-500">
          Formato recomendado: <span className="font-semibold">LxAxH, peso</span> (cm y kg).
        </div>
      </div>
    </section>
  );
}
