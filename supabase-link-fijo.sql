-- Ejecutar este script en el SQL Editor de Supabase antes de activar link fijo

ALTER TABLE pymes
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS link_fijo_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS default_largo NUMERIC,
  ADD COLUMN IF NOT EXISTS default_alto  NUMERIC,
  ADD COLUMN IF NOT EXISTS default_ancho NUMERIC,
  ADD COLUMN IF NOT EXISTS default_peso  NUMERIC;

CREATE INDEX IF NOT EXISTS pymes_slug_idx ON pymes(slug);
