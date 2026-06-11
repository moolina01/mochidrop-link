import { mismaRegion } from "./regiones";

export type EnvioGratisModo = "off" | "siempre" | "sobre_monto";

export type EnvioGratisConfig = {
  modo: EnvioGratisModo;
  monto: number;       // umbral de compra si modo = "sobre_monto"
  solo_region: boolean; // limitar a la región de la tienda
  courier: string;     // courier por defecto para envíos gratis
};

export const ENVIO_GRATIS_DEFAULT: EnvioGratisConfig = {
  modo: "off",
  monto: 0,
  solo_region: false,
  courier: "",
};

// Evalúa si un pedido califica para envío gratis según la config de la tienda.
//  - comunaTienda: comuna de origen (región de la tienda)
//  - comunaDestino: comuna del comprador
//  - montoProducto: precio del producto cobrado (la base del umbral)
export function evaluarEnvioGratis(
  config: EnvioGratisConfig | null | undefined,
  comunaTienda: string | null | undefined,
  comunaDestino: string | null | undefined,
  montoProducto: number,
): boolean {
  if (!config || config.modo === "off") return false;
  if (config.modo === "sobre_monto" && montoProducto < (config.monto || 0)) return false;
  if (config.solo_region && !mismaRegion(comunaTienda, comunaDestino)) return false;
  return true;
}
