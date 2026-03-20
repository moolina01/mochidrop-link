"use client";

export type OriginData = {
  originCommune: string;
  originAddress: string;
};

export default function OriginSection({
  value,
  onChange,
}: {
  value: OriginData;
  onChange: (next: OriginData) => void;
}) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-gray-900">Origen</h3>
      <p className="mt-1 text-sm text-gray-600">Desde dónde se envía.</p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <input
          value={value.originCommune}
          onChange={(e) => onChange({ ...value, originCommune: e.target.value })}
          placeholder="Comuna de origen"
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm
                     focus:outline-none focus:ring-2 focus:ring-green-400"
        />
        <input
          value={value.originAddress}
          onChange={(e) => onChange({ ...value, originAddress: e.target.value })}
          placeholder="Dirección de origen"
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm
                     focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      </div>
    </section>
  );
}
