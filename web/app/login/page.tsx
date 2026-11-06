import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { AuthForms } from './AuthForms';
import './auth.css';

export const metadata = { title: 'Iniciar sesión — HydroGreenAI' };

export default function LoginPage() {
  return (
    <div className="auth-page">
      <header className="auth-header">
        <Link className="brand" href="/">
          <span className="brand-mark"><Icon name="leaf" /></span>
          <span className="brand__name">HydroGreenAI</span>
        </Link>
      </header>

      <main className="auth-shell">
        <AuthForms />
        <p className="auth-note">Modo demo — las cuentas se guardan solo en este navegador hasta conectar Supabase Auth.</p>
      </main>
    </div>
  );
}
