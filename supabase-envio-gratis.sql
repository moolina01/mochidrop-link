-- ─────────────────────────────────────────────────────────────────────────────
-- Envío gratis (regla de precio de la tienda, sobre cobro de producto beta)
-- Ejecutar en el SQL editor de Supabase.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. pymes: configuración de envío gratis
--    JSONB con { modo: "off" | "siempre" | "sobre_monto",
--                monto: number,        -- umbral si modo = sobre_monto
--                solo_region: boolean, -- limitar a la región de la tienda
--                courier: string }     -- courier por defecto para envíos gratis
alter table public.pymes
  add column if not exists envio_gratis jsonb;

-- 2. envios: snapshot de si se aplicó envío gratis y cuánto flete absorbe la tienda
alter table public.envios
  add column if not exists envio_gratis_aplicado boolean not null default false,
  add column if not exists flete_absorbido        integer;
