# CONTRACTS.md — HydroGreenAI: Lettuce

Contratos fijos del proyecto. Son lo que permite que piezas hechas por separado encajen.
**Solo Manuel los cambia**, y avisa a todos. La versión válida es siempre la de este archivo en la base del día.

> Estado: v2 (2026-10-31). El prototipo original (HTML/JS estático, en `prototipo/`) se migró a
> Next.js 16 + TypeScript en `web/`, conservando su diseño. Las rutas de §6 son las reales.

## 1. Arquitectura

Solo el servicio puente habla MQTT; el dashboard nunca se conecta al broker. Todo lo demás pasa por Supabase.

```
Arduino R4 ──MQTT/TLS──► EMQX Cloud ◄──MQTT/TLS── Servicio puente (bridge/, Node)
                                                    │ guarda lecturas y estado
                                                    │ envía comandos pendientes
                                                    │ ejecuta ciclos de bomba
                                                    ▼
                                   Supabase (Postgres + Auth + Realtime)
                                                    │ triggers de alertas
                                                    ▼
                                   Dashboard Next.js (web/)
                                     ├─ lee lecturas, alertas, recomendaciones
                                     ├─ inserta comandos y configuración
                                     └─ /api/ai/run ──► Claude API
```

## 2. MQTT (ya implementado en el firmware)

| Tópico | Dirección | Contenido |
|---|---|---|
| `hg/NFT-001/R4-001/telemetry` | Arduino → nube, cada 30 s | `{"readings":[{"sensor_id":"TEMP-001","measurement_type":"air_temperature","value":24.1,"unit":"C","timestamp":1793392653}, …],"pump":"off","fan":"off"}` |
| `hg/NFT-001/R4-001/status` | Arduino → nube, retenido | `{"status":"online","uptime_s":120,"rssi":-41}` o `{"status":"offline"}` (Last Will) |
| `hg/NFT-001/R4-001/command` | Nube → Arduino | `{"command_id":"<uuid>","actuator":"pump","action":"on"}`; actuator `pump` o `fan`, action `on` u `off` |
| `hg/NFT-001/R4-001/command/ack` | Arduino → nube | `{"command_id":"<uuid>","actuator":"pump","state":"on","result":"ok"}`; result `ok` o `rejected` |

Sensores: `TEMP-001` (`air_temperature`, C), `HUM-001` (`humidity`, %), `LUX-001` (`light`, lux).
`timestamp` es en segundos epoch y **puede faltar** (usar la hora de recepción).

## 3. Base de datos (Supabase)

El esquema exacto está en [`supabase/migrations/001_base.sql`](supabase/migrations/001_base.sql). Resumen:

| Tabla | Columnas clave | Escribe |
|---|---|---|
| `profiles` | `id` (= auth.users), `full_name`, `role` ∈ admin/producer/viewer | trigger de Javier, admin |
| `devices` | `id` ('R4-001'), `system_id` ('NFT-001'), `status` online/offline, `last_seen`, `rssi`, `uptime_s` | puente |
| `readings` | `device_id`, `sensor_id`, `measurement_type` ∈ air_temperature/humidity/light, `value`, `unit`, `ts` | puente |
| `thresholds` | `device_id`, `measurement_type`, `min_value`, `max_value`, `enabled` — único por (device, type) | producer/admin |
| `alerts` | `type` ∈ threshold_low/threshold_high/device_offline/sensor_missing/anomaly, `severity` ∈ info/warning/critical, `status` ∈ active/acknowledged/resolved | triggers, puente, /api/ai/run; `status` producer/admin |
| `actuator_commands` | `id` uuid (= `command_id` MQTT), `actuator` pump/fan, `action` on/off, `source` manual/schedule/ai, `status` pending/sent/ok/rejected/timeout, `acked_at` | dashboard inserta; puente actualiza |
| `actuator_state` | PK (`device_id`, `actuator`), `state` on/off | puente |
| `pump_schedules` | `on_minutes`, `off_minutes`, `active_from`, `active_to`, `enabled` | producer/admin; puente ejecuta |
| `ai_config` | PK `device_id`, `enabled`, `model` (def. `claude-sonnet-5-5`), `window_hours` (6), `zscore_threshold` (3), `run_every_minutes` (15) | producer/admin |
| `ai_recommendations` | `window_start/end`, `stats` jsonb, `anomalies` jsonb, `summary`, `recommendation`, `explanation`, `source` llm/rules, `model` | /api/ai/run |

Realtime activado en: `readings`, `devices`, `alerts`, `actuator_commands`, `actuator_state`, `ai_recommendations`.

Datos iniciales: dispositivo `R4-001` / `NFT-001`; umbrales temp 15–26 °C, humedad 50–80 %, luz 200–40000 lux; `ai_config` por defecto.

### Migraciones y dueños

| Archivo | Dueño | Contenido |
|---|---|---|
| `001_base.sql` | Manuel | Esquema, datos iniciales, Realtime |
| `001_rls_temporal.sql` | Manuel | RLS provisional: solo `authenticated` lee y hace escrituras mínimas; políticas `tmp_*` que `003_auth.sql` borra |
| `002_alerts.sql` | Javier | Triggers de umbral alto/bajo y offline, deduplicación, autorresolución |
| `003_auth.sql` | Javier | Trigger de `profiles`, políticas RLS |

### Permisos (RLS, en `003_auth.sql`)

- Usuarios autenticados **leen todo**.
- `producer` y `admin` insertan en `actuator_commands` y editan `thresholds`, `pump_schedules`, `ai_config` y `alerts.status`.
- Solo `admin` edita `profiles`.
- El puente y `/api/ai/run` usan la **service role key** (saltan RLS).

## 4. API interna

`POST /api/ai/run` — body `{"device_id":"R4-001"}`. Autoriza con header `x-ai-secret: <AI_RUN_SECRET>`
o con sesión de usuario `producer`/`admin`. Respuestas: `200` con la recomendación guardada, `401/403`
sin autorización, `409` si `ai_config.enabled = false`.

## 5. Variables de entorno (nunca dentro de los zips ni en el grupo)

| Variable | Dónde | Para qué |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | web | Cliente del navegador |
| `SUPABASE_SERVICE_ROLE_KEY` | web (solo servidor) y puente | Escrituras del servidor |
| `ANTHROPIC_API_KEY` | web (solo servidor) | Recomendaciones de IA |
| `MQTT_URL` (`mqtts://<host>:8883`), `MQTT_USER`, `MQTT_PASS` | puente | Conexión a EMQX con el usuario `bridge-service` |
| `AI_RUN_URL`, `AI_RUN_SECRET` | puente y web | El puente llama a `/api/ai/run` cada 15 min |
| `NEXT_PUBLIC_DEMO_MODE` | web | `true` = datos simulados, solo respaldo en la demo |

Cada carpeta con código mantiene su `.env.example` sin valores reales.

## 6. Carpetas y dueños

Cada quien entrega **solo** sus carpetas. Lo que venga fuera de ellas no se integra.

| Carpeta | Dueño | Contenido |
|---|---|---|
| `web/` (resto: `app/layout.tsx`, `app/page.tsx` landing, `styles/`, `components/ui/`, `lib/storage.ts`, configuración) | Manuel | Integración, layout, estilos compartidos |
| `web/lib/data/`, `web/lib/supabase/`, `web/tests/manuel_*` | Manuel | Capa de datos (sensores, estado, simulador demo, `useSensorData`) y clientes de Supabase |
| `web/app/(dashboard)/`, `web/components/dashboard/`, `web/tests/axel_*` | Axel | Dashboard, gráficas, control de actuadores, umbrales, ciclos, panel y configuración de IA |
| `web/app/alerts/`, `web/components/alerts/`, `web/tests/jesus_*` | Jesús | Centro de alertas e insignia (AlertBadge) |
| `web/app/admin/`, `web/app/login/`, `web/lib/auth/`, `web/tests/javier_*` | Javier | Login, roles, administración (hoy `lib/auth/demo-auth.ts` es temporal: se reemplaza con Supabase Auth) |
| `web/lib/ai/`, `web/app/api/ai/`, `web/tests/manuel_ai*` | Manuel | Anomalías, cliente de Claude, respaldo por reglas |
| `bridge/` | Tomás | Servicio puente Node |
| `supabase/migrations/` | 001 Manuel; 002_alerts y 003_auth Javier | SQL |
| `firmware/` | Manuel | Arduino (sin `arduino_secrets.h`) |
| `docs/`, `scripts/`, `CONTRACTS.md`, `CLAUDE.md` | Manuel | Documentación y herramientas |

### Convenciones de `web/`

- Next.js 16 (App Router, Turbopack) + React 19 + TypeScript. Estilos en CSS plano (sin Tailwind):
  variables y componentes compartidos en `web/styles/`; cada pantalla importa su propio `.css`.
- Importar con el alias `@/` (p. ej. `@/lib/data/sensors`). Las variables son los `measurement_type`
  del contrato, definidas en `web/lib/data/sensors.ts`.
- Las pantallas obtienen datos solo a través de `web/lib/data/` (nunca consultan Supabase directo
  desde un componente sin pasar por ahí), para que el modo demo siga funcionando.
- Pruebas con vitest en `web/tests/<dueño>_*.test.ts`; `npm test` y `npm run build` deben pasar.

## 7. Entregas diarias

- Zip diario en `HydroGreen-Entregas/<Nombre>/` **antes de las 21:00**, aunque no esté terminado.
- El zip contiene solo las carpetas del dueño (con su ruta completa desde la raíz, p. ej. `web/app/alerts/...`) y un `CAMBIOS.md` con: qué hice, cómo probarlo, dependencias nuevas, SQL a correr, cambios que pido fuera de mis carpetas.
- Sin `node_modules`, `.next`, `.env*` ni llaves.
- Cada mañana se publica `base/hydrogreen-base-AAAA-MM-DD.zip`: es el punto de partida de todos ese día.
