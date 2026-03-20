import type { BusinessBrand } from "./BusinessBranding";
import type { OriginData } from "./OriginSection";
import type { RecipientData } from "./RecipientSection";
import type { PackageData } from "./PackageSection";

export default function PreviewCard({
  business,
  recipient,
  origin,
  pack,
}: {
  business: BusinessBrand;
  recipient: RecipientData;
  origin: OriginData;
  pack: PackageData;
}) {
  const displayBiz = business.businessName?.trim() || "Tu PyME";
  const hasLogo = Boolean(business.logoDataUrl);

  return (
    <div className="rounded-2xl bg-white/10 ring-1 ring-white/10 p-4 md:p-5 text-white">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-white/10 ring-1 ring-white/10 overflow-hidden flex items-center justify-center">
          {hasLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={business.logoDataUrl}
              alt="Logo"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-lg font-bold">M</span>
          )}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{displayBiz}</p>
          <p className="text-xs text-white/60 truncate">
            Vista previa del link para tu cliente
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-white p-4 text-gray-900 shadow-xl">
        <p className="text-xs font-semibold text-gray-500">Envío para</p>
        <p className="mt-1 font-semibold">
          {recipient.recipientName?.trim() || "Nombre del destinatario"}
        </p>

        <p className="mt-2 text-sm text-gray-700">
          {recipient.destAddress?.trim() || "Dirección de destino"}
          {recipient.destCommune?.trim() ? `, ${recipient.destCommune}` : ""}
        </p>

        <div className="mt-4 grid gap-2 text-sm">
          <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
            <span className="text-gray-600">Origen</span>
            <span className="font-semibold text-gray-900 truncate max-w-[55%] text-right">
              {origin.originCommune?.trim() || "Comuna origen"}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
            <span className="text-gray-600">Paquete</span>
            <span className="font-semibold text-gray-900 truncate max-w-[55%] text-right">
              {pack.measuresAndWeight?.trim() || "10x10x10, 1 kg"}
            </span>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-dashed border-gray-200 p-3">
          <p className="text-xs font-semibold text-gray-500">
            Aquí el cliente verá opciones de courier
          </p>
          <div className="mt-2 space-y-2">
            <Row label="starken" price="$4.990" eta="2–3 días" />
            <Row label="chilexpress" price="$5.990" eta="1 día" />
            <Row label="blueexpress" price="$5.490" eta="2–4 días" />
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-white/60">
        Tip: mientras más completos los datos, más precisa la cotización.
      </p>
    </div>
  );
}

function Row({ label, price, eta }: { label: string; price: string; eta: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{label}</p>
        <p className="text-xs text-gray-500">Llega en {eta}</p>
      </div>
      <p className="text-sm font-bold text-gray-900">{price}</p>
    </div>
  );
}
