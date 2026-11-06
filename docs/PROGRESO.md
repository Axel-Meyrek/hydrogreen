# PROGRESO

Bitácora de integración y avance por fase. Una entrada por día; una línea por persona.

## Estado por fase

| Fase | Estado | Notas |
|---|---|---|
| 0. Arranque | Listo (código) | Prototipo migrado a Next.js en `web/`; firmware en `firmware/`. Faltan pasos manuales de Manuel (ver abajo). |
| 1. Base de datos | SQL aplicado | `001_base.sql` y `001_rls_temporal.sql` corridos en Supabase (31 oct); falta `web/lib/supabase/`. |
| 2. Capa de datos | Iniciada | `web/lib/data/` ya tiene sensores del contrato, estado por umbral, simulador y `useSensorData` (solo modo demo). |
| 3. Puente | Pendiente | Tomás |
| 4. Alertas | Pendiente | Javier (SQL) y Jesús (UI) |
| 5. Autenticación | Pendiente | Javier. Hoy hay login demo en localStorage (`web/lib/auth/demo-auth.ts`). |
| 6. Dashboard | Pendiente | Axel. Base: tarjetas, sparkline e historial del prototipo. |
| 7. IA | Pendiente | Manuel. No existe código previo: se construye desde cero (estadísticas, z-score/EWMA, cliente de Claude, respaldo por reglas, pruebas). Fecha límite: vie 13 nov. |
| 8. Pruebas | Pendiente | |
| 9. Despliegue y demo | Pendiente | |

## Siguiente sesión — empezar aquí

Estado al cerrar el 2026-10-31: todo commiteado; base `bases/hydrogreen-base-2026-10-31.zip` (72 KB, incluye
`001_rls_temporal.sql` y `bridge/.env.example`).

Hecho por Manuel (fuera del código), verificado el 2026-10-31:
- Supabase `hydrogreen`: `001_base.sql` y `001_rls_temporal.sql` aplicados. Comprobado con la API: la anon key
  sin sesión no ve filas (RLS) y la service role lee `devices` (R4-001, offline).
- Usuarios en Auth (confirmados) con perfil: Manuel `admin`, Axel `producer`.
- `web/.env.local`: URL, anon y service role del mismo proyecto; `AI_RUN_SECRET` generado (mismo valor va en
  `bridge/.env` de Tomás). `ANTHROPIC_API_KEY` vacía hasta la fase 7. `NEXT_PUBLIC_DEMO_MODE=true`.
- EMQX: usuario `bridge-service` creado; host responde MQTT/TLS en 8883 (`MQTT_URL=mqtts://<host>:8883`, no la
  URL de la API REST en 8443).
- Drive `HydroGreen-Entregas/` creado. Axel ya tiene su usuario de prueba.

Pendientes de Manuel (antes del lunes 2 nov):
1. Mandar a Tomás por privado su `bridge/.env` (MQTT, URL, service role, `AI_RUN_SECRET`); a Axel la URL y la
   anon key.
2. Subir la base a `HydroGreen-Entregas/base/` (si falta), compartir guías y mensaje de arranque con hora de la daily.
3. Avisar a Javier: borrar las políticas `tmp_*` al inicio de `003_auth.sql` (lista al final de
   `001_rls_temporal.sql`); `lib/auth/validation.ts` y `tests/javier_validation.test.ts` ya existen.
4. Avisar al equipo: pruebas en `web/tests/<nombre>_*.test.ts`; dashboard en `web/app/(dashboard)/`;
   `CONTRACTS.md` v2 manda; con RLS temporal hay que iniciar sesión para ver datos.
5. Lunes: prueba de bomba y ventilador con la fuente nueva.
6. Antes del 13 nov: API key de Anthropic con límite de gasto. Confirmar con el profesor que pH, temperatura
   del agua y nivel quedan fuera de alcance.

Pendientes de código (en este orden):
1. ~~RLS temporal~~ — hecho: `supabase/migrations/001_rls_temporal.sql` (aprobado por Manuel).
2. ~~IA parte pura~~ — hecho el 2026-11-01 en `web/lib/ai/` (ver bitácora). Falta `web/app/api/ai/run/route.ts`
   (necesita los clientes de Supabase de la fase 1).
3. Fase 1: `web/lib/supabase/` (clientes navegador/servidor). Las llaves ya están en `web/.env.local`.
4. Fase 2: rama real de `useSensorData` con Supabase + Realtime; demo solo con `NEXT_PUBLIC_DEMO_MODE=true`.

Decisiones tomadas:
- Prototipo migrado a Next.js 16.4.2 (no se conserva el HTML estático); original en `prototipo/` (fuera de la base).
- Variables alineadas al contrato (sin pH, luz en lux, umbrales de 001). Estado visual con margen del 10 %.
- Versiones de dependencias fijadas con ≥ 2 semanas de antigüedad.
- Git solo local: no hacer push al remoto de GitHub. El PDF de la guía no se versiona.

## Bitácora

### 2026-11-01
- IA, parte pura, en `web/lib/ai/`: `stats.ts` (media, σ, pendiente/h), `anomalies.ts` (z-score y EWMA por
  residuos, mínimo 8 puntos), `rules.ts` (respaldo por reglas), `claude.ts` (fetch directo a la API, timeout
  20 s, validación del JSON, cae a reglas ante cualquier fallo o sin API key), `types.ts`.
- `web/tests/manuel_ai.test.ts`: 18 pruebas nuevas. `npm test` 32/32, `npm run build` sin errores.
- Sin dependencias nuevas (no se usa el SDK de Anthropic).
- Pendiente de la fase 7: ruta `POST /api/ai/run`, lectura de `ai_config`/lecturas, guardado en
  `ai_recommendations` y alertas `anomaly`.

### 2026-10-31 (Día 0)
- Estructura de carpetas, `.gitignore`, `CONTRACTS.md`, `docs/MASTER_PLAN.md`,
  `supabase/migrations/001_base.sql`, `scripts/make-base.ps1`, `CLAUDE.md`.
- Auditoría del prototipo `smartgarden-main` (ahora `prototipo/`): HTML/CSS/JS estático sin build,
  3 páginas (landing, login, dashboard), datos simulados y login falso en localStorage, sparklines en
  canvas, sin librerías. Variables pH/temperatura/luz %/humedad.
- Decisión (Manuel): migrar a Next.js para respetar contratos y guías del equipo, y alinear variables
  al contrato. Hecho en `web/`: Next.js 16.4.2, React 19.3.1, TypeScript, vitest; CSS original reutilizado.
  - Se quitó pH (fuera de alcance), la luz pasó a lux, los umbrales son los de `001_base.sql`,
    marca HydroGreenAI: Lettuce. La landing muestra bomba y ventilador en lugar de pH.
  - Estado visual: dentro del umbral = óptimo; fuera hasta 10 % del rango = atención; más = crítico.
  - Se descartaron los modelos `plants` y `notifications` del prototipo (los sustituyen `devices` y
    `alerts`). La confirmación de "Reiniciar datos" ya no usa `confirm()`.
- Verificado: `npm test` 14/14, `npm run build` sin errores; en navegador: landing, registro → dashboard,
  la simulación avanza cada 5 s, sin errores de consola.
- Pendiente: `firmware/`; correr `001_base.sql`; RLS temporal (decidir).
- No hay código de IA previo: la carpeta `ai/` no se usará; la fase 7 lo construye directo en `web/lib/ai/`.
- RLS temporal en `supabase/migrations/001_rls_temporal.sql` (se llamó 001_ y no 000_ para que ordene después
  de `001_base.sql`). `anon` no ve nada; `authenticated` lee todo, inserta comandos y ciclos, edita umbrales,
  ciclos, `ai_config` y `alerts`. Fila nueva en la tabla de migraciones de `CONTRACTS.md`.
- `bridge/.env.example` creado (MQTT, Supabase, AI_RUN_*); `AI_RUN_URL` agregado a `web/.env.example`.
