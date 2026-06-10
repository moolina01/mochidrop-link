-- Ejecutar en Supabase SQL Editor
-- Feature: Link de pago combinado (envío + producto) — solo beta

-- ── Flag beta por pyme ──────────────────────────────────────────────
-- Por defecto desactivado para todos. Se activa manualmente por usuario:
--   UPDATE pymes SET beta_producto_enabled = true WHERE email = 'pyme@ejemplo.com';
ALTER TABLE pymes
  ADD COLUMN IF NOT EXISTS beta_producto_enabled BOOLEAN DEFAULT false;

-- ── Datos del producto en el link de envío ──────────────────────────
ALTER TABLE envios
  ADD COLUMN IF NOT EXISTS producto_precio INT;          -- monto del producto en CLP
ALTER TABLE envios
  ADD COLUMN IF NOT EXISTS producto_nombre TEXT;         -- opcional, máx 60 chars (validado en cliente)
ALTER TABLE envios
  ADD COLUMN IF NOT EXISTS producto_imagen TEXT;         -- URL pública en Storage, opcional

-- ── Estado del pago del envío al courier ────────────────────────────
-- Separado de pago_status (que refleja el pago del COMPRADOR).
-- Valores: 'pendiente' | 'pagado' | 'vencido'
-- Por ahora se gestiona manualmente; la automatización queda fuera de v1.
ALTER TABLE envios
  ADD COLUMN IF NOT EXISTS envio_pago_status TEXT DEFAULT 'pendiente';
