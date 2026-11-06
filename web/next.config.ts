import type { NextConfig } from 'next';
import path from 'node:path';

// Para GitHub Pages: sitio estático servido en https://<usuario>.github.io/<repo>/.
// Solo se activa con PAGES_BASE_PATH (lo define el workflow de .github/workflows/pages.yml);
// en local (npm run dev / build) la app se comporta igual que antes.
const pagesBasePath = process.env.PAGES_BASE_PATH;

const nextConfig: NextConfig = {
  // La raíz del repo no es un proyecto Node: fija la raíz de Turbopack en web/.
  turbopack: { root: path.resolve(__dirname) },
  ...(pagesBasePath
    ? {
        output: 'export',
        basePath: pagesBasePath,
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
