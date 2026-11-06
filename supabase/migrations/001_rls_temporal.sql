-- 001_rls_temporal.sql — RLS provisional mientras llega 003_auth.sql (Javier, vie 13 nov).
-- Dueño: Manuel. Correr DESPUÉS de 001_base.sql en el SQL Editor de Supabase.
--
-- Motivo: la anon key es pública (va al navegador). Sin RLS, cualquiera con ella puede leer y
-- escribir todas las tablas. Con esto, `anon` no ve nada y solo los usuarios con sesión
-- (`authenticated`) pueden leer y hacer las escrituras mínimas del dashboard.
-- El puente y /api/ai/run usan la service role key y saltan RLS: no les afecta.
--
-- Javier: al inicio de 003_auth.sql borra todas las políticas tmp_* (ver lista al final).
-- Es idempotente: se puede correr más de una vez.

begin;

-- 1. Activar RLS en las 10 tablas
alter table profiles           enable row level security;
alter table devices            enable row level security;
alter table readings           enable row level security;
alter table thresholds         enable row level security;
alter table alerts             enable row level security;
alter table actuator_commands  enable row level security;
alter table actuator_state     enable row level security;
alter table pump_schedules     enable row level security;
alter table ai_config          enable row level security;
alter table ai_recommendations enable row level security;

-- 2. Lectura: cualquier usuario autenticado lee todo
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','devices','readings','thresholds','alerts','actuator_commands',
    'actuator_state','pump_schedules','ai_config','ai_recommendations'
  ] loop
    execute format('drop policy if exists tmp_read on %I', t);
    execute format('create policy tmp_read on %I for select to authenticated using (true)', t);
  end loop;
end $$;

-- 3. Escrituras mínimas del dashboard (sin distinguir rol todavía)
drop policy if exists tmp_insert on actuator_commands;
create policy tmp_insert on actuator_commands
  for insert to authenticated with check (true);

drop policy if exists tmp_update on thresholds;
create policy tmp_update on thresholds
  for update to authenticated using (true) with check (true);

drop policy if exists tmp_insert on pump_schedules;
create policy tmp_insert on pump_schedules
  for insert to authenticated with check (true);
drop policy if exists tmp_update on pump_schedules;
create policy tmp_update on pump_schedules
  for update to authenticated using (true) with check (true);

drop policy if exists tmp_update on ai_config;
create policy tmp_update on ai_config
  for update to authenticated using (true) with check (true);

drop policy if exists tmp_update on alerts;
create policy tmp_update on alerts
  for update to authenticated using (true) with check (true);

commit;

-- Para 003_auth.sql (Javier), copiar al inicio:
--   do $$ declare t text; begin
--     foreach t in array array['profiles','devices','readings','thresholds','alerts',
--       'actuator_commands','actuator_state','pump_schedules','ai_config','ai_recommendations']
--     loop execute format('drop policy if exists tmp_read on %I', t); end loop; end $$;
--   drop policy if exists tmp_insert on actuator_commands;
--   drop policy if exists tmp_update on thresholds;
--   drop policy if exists tmp_insert on pump_schedules;
--   drop policy if exists tmp_update on pump_schedules;
--   drop policy if exists tmp_update on ai_config;
--   drop policy if exists tmp_update on alerts;
-- RLS queda activado; 003 solo agrega las políticas definitivas por rol.
