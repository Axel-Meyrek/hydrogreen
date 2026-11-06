import type { Metadata } from 'next';
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google';
import '@/styles/variables.css';
import '@/styles/base.css';
import '@/styles/components.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-fraunces',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'HydroGreenAI: Lettuce — Monitoreo inteligente de lechuga',
  description:
    'HydroGreenAI monitorea temperatura, humedad y luz de tu cultivo hidropónico de lechuga, controla bomba y ventilador, y te da recomendaciones con IA.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${fraunces.variable} ${jakarta.variable}`}>
      <body>{children}</body>
    </html>
  );
}
