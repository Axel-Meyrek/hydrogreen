# MASTER_PLAN — HydroGreenAI: Lettuce

**OBJETIVO:** dejar HydroGreenAI funcionando de punta a punta con datos reales del Arduino para el
20 de noviembre de 2026: lecturas en vivo, historial, alertas, control de bomba y ventilador, ciclos
automáticos, recomendaciones de IA explicables, login con roles y administración. Respeta
`CONTRACTS.md`: tablas, tópicos y carpetas son fijos.

## Reglas de trabajo

- Una fase por sesión. Antes de empezar, revisa qué existe ya en el repo y en `entregas/` (zips de
  compañeros descomprimidos). Si un módulo entregado cumple la fase, intégralo y corrígelo en lugar
  de reescribirlo.
- Al terminar cada fase: `npm run build` sin errores, pruebas en verde, actualiza `docs/PROGRESO.md`
  (qué se hizo, cómo probarlo, pendientes) y detente para que Manuel pruebe.
- Nada de secretos en el código. `.env.example` siempre al día.
- Si un contrato no alcanza, propón el cambio en `CONTRACTS.md` y espera aprobación.

## Fases

1. **Base de datos:** `supabase/migrations/001_base.sql` según `CONTRACTS.md`, publicación de Realtime y
   datos iniciales. Cliente de Supabase para navegador y servidor en `web/lib/supabase/`.
2. **Capa de datos:** reemplazar todos los datos simulados del prototipo por consultas reales en
   `web/lib/data/` (últimas lecturas, historial agregado por intervalo, estado del dispositivo, estado de
   actuadores). Mantener un modo demo con datos simulados detrás de `NEXT_PUBLIC_DEMO_MODE=true`.
3. **Servicio puente (`bridge/`):** telemetría y estado a Supabase, comandos con ACK y timeout, detección
   de offline y de sensor sin datos, ciclos de bomba, llamada periódica a la IA.
4. **Alertas:** triggers SQL de umbral alto/bajo y offline con deduplicación y autorresolución; centro de
   alertas con filtros, reconocer, Realtime y AlertBadge.
5. **Autenticación:** Supabase Auth, perfiles con rol (admin, producer, viewer), políticas RLS, middleware
   de rutas y pantalla de administración de usuarios y dispositivos.
6. **Dashboard:** tarjetas en vivo con color por umbral, gráficas 1h/6h/24h/7d con líneas de umbral,
   control de bomba y ventilador con estado del comando, edición de umbrales y de ciclos de bomba.
7. **IA:** `POST /api/ai/run` con estadísticas calculadas en código, detección de anomalías, explicación
   con la API de Claude, respaldo por reglas, guardado en `ai_recommendations`, alertas de anomalía;
   panel de recomendaciones y pantalla de configuración de IA.
8. **Confiabilidad y pruebas:** pruebas unitarias de IA y de la capa de datos; prueba de punta a punta
   (lectura publicada → fila en readings → alerta → visible en el dashboard; botón → comando → ACK);
   prueba de desconexión del Arduino; `docs/PLAN_DE_PRUEBAS.md` con casos, resultado esperado y
   resultado obtenido (un caso por historia US101–US406).
9. **Despliegue y demo:** web en Vercel, puente corriendo 24 h (pm2 o Render/Railway), README general de
   instalación y `docs/GUION_DEMO.md` paso a paso de 10 minutos, indicando quién presenta cada parte.

## Calendario

| Fecha | Hito |
|---|---|
| Lun 2 nov | Base publicada; prueba de bomba y ventilador con la fuente nueva |
| Mié 4 nov | Fases 1 y 2; primera prueba del puente de Tomás con el Arduino real |
| Vie 6 nov | `002_alerts.sql` aplicado en la base real; dashboard con datos reales |
| Vie 13 nov | `/api/ai/run` completo con pruebas; `003_auth.sql` aplicado |
| Mar 17 nov | **Congelamiento de funciones**: solo corrección de errores |
| Mié 18 – Jue 19 nov | Prueba continua de 24 h, plan y reporte de pruebas, guion, ensayo |
| Vie 20 nov | Demo, Sprint Review y retrospectiva |
