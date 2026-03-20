"use client";

export type RecipientData = {
  recipientName: string;
  recipientPhone: string;
  destCommune: string;
  destAddress: string;
};

export default function RecipientSection({
  value,
  onChange,
}: {
  value: RecipientData;
  onChange: (next: RecipientData) => void;
}) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-gray-900">Destinatario</h3>
      <p className="mt-1 text-sm text-gray-600">
        Datos para entregar el paquete.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <input
          value={value.recipientName}
          onChange={(e) => onChange({ ...value, recipientName: e.target.value })}
          placeholder="Nombre del destinatario"
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm
                     focus:outline-none focus:ring-2 focus:ring-green-400 md:col-span-2"
        />

        <input
          value={value.recipientPhone}
          onChange={(e) => onChange({ ...value, recipientPhone: e.target.value })}
          placeholder="Teléfono (Ej: +56912345678)"
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm
                     focus:outline-none focus:ring-2 focus:ring-green-400"
        />

        <input
          value={value.destCommune}
          onChange={(e) => onChange({ ...value, destCommune: e.target.value })}
          placeholder="Comuna de destino"
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm
                     focus:outline-none focus:ring-2 focus:ring-green-400"
        />

        <input
          value={value.destAddress}
          onChange={(e) => onChange({ ...value, destAddress: e.target.value })}
          placeholder="Dirección de destino"
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm
                     focus:outline-none focus:ring-2 focus:ring-green-400 md:col-span-2"
        />
      </div>
    </section>
  );
}
