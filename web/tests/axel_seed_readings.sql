-- tests/axel_seed_readings.sql — datos de prueba para el dashboard (Axel)
-- Correr en Supabase → SQL Editor (lo corre Manuel). No crea tablas ni columnas.
-- Inserta 24 h de lecturas cada 30 s para R4-001 (2880 por variable), el estado del
-- dispositivo y de los actuadores, y una recomendación de ejemplo.
-- Para borrar solo lo que inserta este script, ver el bloque LIMPIEZA al final.

begin;

-- Lecturas: ciclo día/noche con algo de ruido
with g as (
  select ts,
         -- hora local de Puebla en decimal (0–24)
         extract(hour from ts at time zone 'America/Mexico_City')
           + extract(minute from ts at time zone 'America/Mexico_City') / 60.0 as h
  from generate_series(now() - interval '24 hours' + interval '30 seconds', now(), interval '30 seconds') as ts
),
t as (
  -- fase del día: 0 a medianoche, 1 a mediodía
  select ts, (1 - cos(2 * pi() * h::double precision / 24)) / 2 as day from g
)
insert into readings (device_id, sensor_id, measurement_type, value, unit, ts)
select 'R4-001', 'TEMP-001', 'air_temperature', round((16 + 9 * day + (random() - 0.5) * 0.6)::numeric, 1), 'C', ts from t
union all
select 'R4-001', 'HUM-001', 'humidity', round((78 - 22 * day + (random() - 0.5) * 2)::numeric, 1), '%', ts from t
union all
select 'R4-001', 'LUX-001', 'light',
       round(greatest(0, case when day > 0.3 then 30000 * (day - 0.3) / 0.7 + (random() - 0.5) * 800 else random() * 5 end)::numeric, 0),
       'lux', ts from t;

-- Estado del dispositivo como si estuviera conectado
update devices
set status = 'online', last_seen = now(), rssi = -52, uptime_s = 86400
where id = 'R4-001';

-- Estado de actuadores
insert into actuator_state (device_id, actuator, state, updated_at) values
  ('R4-001', 'pump', 'on', now() - interval '4 minutes'),
  ('R4-001', 'fan', 'off', now() - interval '40 minutes')
on conflict (device_id, actuator) do update set state = excluded.state, updated_at = excluded.updated_at;

-- Recomendación de ejemplo (tarea 6)
insert into ai_recommendations
  (device_id, window_start, window_end, stats, anomalies, summary, recommendation, explanation, source, model)
values (
  'R4-001',
  now() - interval '6 hours',
  now(),
  '{
    "air_temperature": {"count": 720, "mean": 22.4, "std": 2.1, "min": 18.3, "max": 25.6, "last": 24.9, "slopePerHour": 0.9},
    "humidity":        {"count": 720, "mean": 63.8, "std": 4.7, "min": 57.1, "max": 72.4, "last": 58.0, "slopePerHour": -2.1},
    "light":           {"count": 720, "mean": 18450, "std": 7900, "min": 2100, "max": 29800, "last": 28700, "slopePerHour": 3900}
  }'::jsonb,
  ('[{"measurement_type": "air_temperature", "ts": ' || ((extract(epoch from now() - interval '25 minutes') * 1000)::bigint)
    || ', "value": 25.6, "score": 3.2, "methods": ["zscore", "ewma"]}]')::jsonb,
  'La temperatura sube rápido y se acerca al máximo de 26 °C.',
  'Enciende el ventilador durante las horas de más luz y revisa que la bomba mantenga el flujo de la solución.',
  'En las últimas 6 h la temperatura subió 0.9 °C por hora y una lectura de 25.6 °C salió del comportamiento normal (z = 3.2). La humedad baja al mismo tiempo, lo que indica más evaporación. Ventilar ayuda a bajar la temperatura de las hojas antes de llegar al umbral.',
  'llm',
  'claude-sonnet-5-5'
);

commit;

-- LIMPIEZA (opcional): descomentar para quitar los datos de prueba
-- delete from readings where device_id = 'R4-001' and ts > now() - interval '25 hours';
-- delete from ai_recommendations where device_id = 'R4-001' and model = 'claude-sonnet-5-5'
--   and summary like 'La temperatura sube rápido%';
