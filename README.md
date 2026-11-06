# HydroAI_lettuce

**HydroGreenAI: Lettuce** — monitoreo IoT de un cultivo hidropónico NFT de lechuga con recomendaciones de IA.
Proyecto universitario (UPAEP, Administración Ágil, otoño 2026).

**Demo en vivo:** https://axel-meyrek.github.io/hydrogreen/ (modo demo: datos simulados en el navegador;
crea una cuenta en *Iniciar sesión → Crear cuenta*).

Arduino UNO R4 WiFi → EMQX (MQTT/TLS) → servicio puente Node → Supabase → dashboard Next.js.
Ver `CONTRACTS.md` (contratos del sistema) y `docs/MASTER_PLAN.md`.

## Correr el dashboard en local

```bash
cd web
cp .env.example .env.local   # opcional: sin llaves corre en modo demo
npm install
npm run dev                  # http://localhost:3000
npm test                     # pruebas (vitest)
```

El sitio de GitHub Pages se publica automáticamente con `.github/workflows/pages.yml` en cada push a `main`.
