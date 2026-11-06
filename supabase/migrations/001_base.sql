-- 001_base.sql — Esquema base de HydroGreenAI: Lettuce
-- Dueño: Manuel. Fuente: CONTRACTS.md. No cambiar nombres sin aprobación.
-- RLS provisional en 001_rls_temporal.sql (correr justo después); definitivas en 003_auth.sql (Javier).

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  role text not null default 'producer' check (role in ('admin','producer','viewer'))
);

create table devices (
  id text primary key,            -- 'R4-001'
  system_id text not null,        -- 'NFT-001'
  name text,
  status text not null default 'offline' check (status in ('online','offline')),
  last_seen timestamptz,
  rssi int,
  uptime_s int
);

create table readings (
  id bigserial primary key,
  device_id text not null references devices(id),
  sensor_id text not null,
  measurement_type text not null check (measurement_type in ('air_temperature','humidity','light')),
  value double precision not null,
  unit text not null,
  ts timestamptz not null default now()
);
create index readings_device_type_ts on readings (device_id, measurement_type, ts desc);

create table thresholds (
  id bigserial primary key,
  device_id text not null references devices(id),
  measurement_type text not null,
  min_value double precision,
  max_value double precision,
  enabled boolean not null default true,
  updated_by uuid references profiles(id),
  updated_at timestamptz not null default now(),
  unique (device_id, measurement_type)
);

create table alerts (
  id bigserial primary key,
  device_id text not null references devices(id),
  type text not null check (type in ('threshold_low','threshold_high','device_offline','sensor_missing','anomaly')),
  measurement_type text,
  value double precision,
  threshold double precision,
  severity text not null default 'warning' check (severity in ('info','warning','critical')),
  message text not null,
  status text not null default 'active' check (status in ('active','acknowledged','resolved')),
  created_at timestamptz not null default now(),
  acknowledged_by uuid references profiles(id),
  acknowledged_at timestamptz,
  resolved_at timestamptz
);

create table actuator_commands (
  id uuid primary key default gen_random_uuid(),   -- = command_id en MQTT
  device_id text not null references devices(id),
  actuator text not null check (actuator in ('pump','fan')),
  action text not null check (action in ('on','off')),
  source text not null default 'manual' check (source in ('manual','schedule','ai')),
  requested_by uuid references profiles(id),
  status text not null default 'pending' check (status in ('pending','sent','ok','rejected','timeout')),
  created_at timestamptz not null default now(),
  acked_at timestamptz
);

create table actuator_state (
  device_id text references devices(id),
  actuator text check (actuator in ('pump','fan')),
  state text not null check (state in ('on','off')),
  updated_at timestamptz not null default now(),
  primary key (device_id, actuator)
);

create table pump_schedules (
  id bigserial primary key,
  device_id text not null references devices(id),
  on_minutes int not null,
  off_minutes int not null,
  active_from time,
  active_to time,
  enabled boolean not null default false
);

create table ai_config (
  device_id text primary key references devices(id),
  enabled boolean not null default true,
  model text not null default 'claude-sonnet-5-5',
  window_hours int not null default 6,
  zscore_threshold double precision not null default 3,
  run_every_minutes int not null default 15
);

create table ai_recommendations (
  id bigserial primary key,
  device_id text not null references devices(id),
  created_at timestamptz not null default now(),
  window_start timestamptz,
  window_end timestamptz,
  stats jsonb,                -- promedio, mínimo, máximo por variable
  anomalies jsonb,            -- lista de anomalías detectadas
  summary text not null,
  recommendation text not null,
  explanation text not null,
  source text not null check (source in ('llm','rules')),
  model text
);

-- Datos iniciales (umbrales iniciales para lechuga: ajustar con el profesor)
insert into devices (id, system_id, name) values ('R4-001','NFT-001','Prototipo NFT');
insert into thresholds (device_id, measurement_type, min_value, max_value) values
  ('R4-001','air_temperature',15,26),
  ('R4-001','humidity',50,80),
  ('R4-001','light',200,40000);
insert into ai_config (device_id) values ('R4-001');

-- Realtime
alter publication supabase_realtime add table
  readings, devices, alerts, actuator_commands, actuator_state, ai_recommendations;
