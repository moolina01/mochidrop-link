-- Ejecutar en Supabase SQL Editor

-- Couriers preferidos de la pyme (configuración)
ALTER TABLE pymes
  ADD COLUMN IF NOT EXISTS couriers_habilitados JSONB;

-- Snapshot de couriers al momento de generar el link
ALTER TABLE envios
  ADD COLUMN IF NOT EXISTS couriers_habilitados JSONB;
