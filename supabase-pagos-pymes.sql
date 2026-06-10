-- ─────────────────────────────────────────────────────────────────────────────
-- Pagos a pymes (liquidación del producto)
-- Ejecutar en el SQL editor de Supabase.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. envios: marcar cuándo se pagó y si ya se liquidó a la pyme
alter table public.envios
  add column if not exists pagado_at    timestamptz,
  add column if not exists liquidado    boolean not null default false,
  add column if not exists liquidado_at timestamptz;

-- Backfill: para envíos ya pagados sin pagado_at, usar created_at como referencia
update public.envios
   set pagado_at = created_at
 where pago_status = 'pagado'
   and pagado_at is null;

-- 2. pymes: datos bancarios para recibir el pago del producto
--    JSONB con { banco, tipo_cuenta, cuenta, titular, rut, email }
alter table public.pymes
  add column if not exists datos_bancarios jsonb;

-- Índice para acelerar el panel de pagos pendientes
create index if not exists idx_envios_pendiente_liquidar
  on public.envios (pago_status, liquidado)
  where pago_status = 'pagado' and liquidado = false;
