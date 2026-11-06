# CLAUDE.md — HydroGreenAI: Lettuce

Proyecto universitario (UPAEP, Administración Ágil, Sprint 4) de monitoreo hidropónico de lechuga con
IoT e IA. Arduino R4 → EMQX (MQTT/TLS) → servicio puente Node → Supabase → dashboard Next.js, con
recomendaciones de IA vía Claude API. Demo final: **viernes 20 de noviembre de 2026**.

Manuel es Scrum Master e integrador: es el único con el proyecto completo. Los compañeros (Tomás, Axel,
Javier, Jesús) **no usan Git**: mandan un zip diario con sus carpetas y un `CAMBIOS.md`, y Claude los integra.

## Documentos clave

- `CONTRACTS.md` — tópicos MQTT, esquema SQL, variables de entorno, carpetas y dueños. **Fijo.**
- `docs/MASTER_PLAN.md` — 9 fases y calendario.
- `docs/PROGRESO.md` — bitácora; actualizar al terminar cada fase o integración.

## Estructura

```
web/                   App Next.js 16 (migrada del prototipo, mismo diseño)
prototipo/             Prototipo original HTML/JS (solo referencia; no va en la base)
bridge/                Servicio puente MQTT ↔ Supabase (Tomás)
supabase/migrations/   001_base (Manuel), 002_alerts y 003_auth (Javier)
firmware/              Sketch del Arduino R4 (sin arduino_secrets.h)
ai/                    Código de IA original; se mueve a web/lib/ai/ en la fase 7
docs/                  Plan, progreso, pruebas, guion de demo
scripts/make-base.ps1  Genera bases/hydrogreen-base-AAAA-MM-DD.zip
entregas/AAAA-MM-DD/<persona>/   Zips descomprimidos de compañeros (no versionado)
```

## Comandos

```
cd web && npm install && npm run dev      # dashboard en http://localhost:3000
cd web && npm run build                   # debe pasar sin errores antes de cada commit
cd web && npm test                        # pruebas (vitest)
cd bridge && npm install && npm start     # puente (requiere bridge/.env)
powershell -ExecutionPolicy Bypass -File scripts\make-base.ps1   # base diaria
```

Sin `web/.env.local` la app corre en modo demo (simulador). Ver convenciones de `web/` en `CONTRACTS.md` §6.

## Reglas

- Respetar `CONTRACTS.md`. Si un contrato no alcanza, proponer el cambio y esperar aprobación de Manuel.
- Nunca hardcodear secretos. Llaves solo en `web/.env.local` y `bridge/.env`; mantener `.env.example`.
- `ANTHROPIC_API_KEY` y `SUPABASE_SERVICE_ROLE_KEY` nunca llegan al navegador.
- Una fase del MASTER_PLAN por sesión; al terminar: build, pruebas, `docs/PROGRESO.md`, commit, y detenerse.
- Git es solo respaldo local: commits con mensajes claros; **no hacer push**.
- Desde el 17 de noviembre: solo corrección de errores, sin funciones nuevas.

## Procedimiento de integración diaria

Entrada: `entregas/AAAA-MM-DD/<persona>/` ya descomprimido.

1. Leer su `CAMBIOS.md`.
2. Verificar que solo trae archivos de las carpetas de su dueño (tabla en `CONTRACTS.md` §6). Lo que esté
   fuera **no se copia**: se reporta.
3. Copiar los archivos a su lugar e instalar dependencias nuevas que pida.
4. Revisar que respete los contratos (tablas, columnas, tópicos, variables de entorno); corregir lo mínimo.
5. Aplicar los cambios solicitados que tengan sentido; anotar los demás en `docs/PROGRESO.md`.
6. `npm run build` y pruebas; arreglar lo que se rompa.
7. `docs/PROGRESO.md`: una línea por persona (qué entró, qué se corrigió, qué falta).
8. Commit `Integración AAAA-MM-DD` y generar la base con `scripts/make-base.ps1`.
9. Entregar a Manuel: mensaje corto por persona (2–3 líneas: qué quedó bien, qué corregir mañana) y la
   lista de SQL que debe correr en Supabase.

SQL de compañeros: nunca se aplica automáticamente; Manuel lo corre en el SQL Editor de Supabase.
