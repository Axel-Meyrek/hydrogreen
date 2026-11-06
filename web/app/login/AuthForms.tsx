'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { getCurrentUser, loginUser, registerUser } from '@/lib/auth/demo-auth';
import { validateLogin, validateRegistration, type FieldErrors } from '@/lib/auth/validation';

type Tab = 'login' | 'register';

function Field({
  name,
  label,
  type,
  autoComplete,
  placeholder,
  error,
  id,
}: {
  name: string;
  label: string;
  type: string;
  autoComplete: string;
  placeholder: string;
  error?: string;
  id: string;
}) {
  return (
    <div className={`field${error ? ' field--error' : ''}`} data-field={name}>
      <label htmlFor={id}>{label}</label>
      <input type={type} id={id} name={name} autoComplete={autoComplete} placeholder={placeholder} />
      <p className="field-error-msg">{error ?? ''}</p>
    </div>
  );
}

export function AuthForms() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('login');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [alert, setAlert] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (getCurrentUser()) router.replace('/dashboard');
  }, [router]);

  function activate(next: Tab) {
    setTab(next);
    setErrors({});
    setAlert('');
  }

  async function onLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = { email: String(form.get('email') ?? ''), password: String(form.get('password') ?? '') };
    const found = validateLogin(input);
    setErrors(found);
    setAlert('');
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await loginUser(input);
      router.push('/dashboard');
    } catch (err) {
      setAlert((err as Error).message);
      setSubmitting(false);
    }
  }

  async function onRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = {
      name: String(form.get('name') ?? ''),
      email: String(form.get('email') ?? ''),
      password: String(form.get('password') ?? ''),
      confirmPassword: String(form.get('confirmPassword') ?? ''),
    };
    const found = validateRegistration(input);
    setErrors(found);
    setAlert('');
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await registerUser(input);
      router.push('/dashboard');
    } catch (err) {
      setAlert((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <div className="card auth-card">
      <div className="auth-tabs" role="tablist">
        <button
          className={`auth-tabs__btn${tab === 'login' ? ' is-active' : ''}`}
          type="button"
          role="tab"
          aria-selected={tab === 'login'}
          aria-controls="loginForm"
          onClick={() => activate('login')}
        >
          Iniciar sesión
        </button>
        <button
          className={`auth-tabs__btn${tab === 'register' ? ' is-active' : ''}`}
          type="button"
          role="tab"
          aria-selected={tab === 'register'}
          aria-controls="registerForm"
          onClick={() => activate('register')}
        >
          Crear cuenta
        </button>
      </div>

      <div className="alert alert--error" role="alert" hidden={!alert}>
        {alert}
      </div>

      {tab === 'login' ? (
        <form id="loginForm" noValidate onSubmit={onLogin}>
          <Field id="loginEmail" name="email" label="Correo electrónico" type="email" autoComplete="email" placeholder="tu@correo.com" error={errors.email} />
          <Field id="loginPassword" name="password" label="Contraseña" type="password" autoComplete="current-password" placeholder="••••••••" error={errors.password} />
          <button className="btn btn--primary btn--lg auth-submit" type="submit" disabled={submitting}>
            Iniciar sesión
          </button>
        </form>
      ) : (
        <form id="registerForm" noValidate onSubmit={onRegister}>
          <Field id="registerName" name="name" label="Nombre" type="text" autoComplete="name" placeholder="Tu nombre" error={errors.name} />
          <Field id="registerEmail" name="email" label="Correo electrónico" type="email" autoComplete="email" placeholder="tu@correo.com" error={errors.email} />
          <Field id="registerPassword" name="password" label="Contraseña" type="password" autoComplete="new-password" placeholder="Mínimo 8 caracteres" error={errors.password} />
          <Field id="registerConfirmPassword" name="confirmPassword" label="Confirmar contraseña" type="password" autoComplete="new-password" placeholder="••••••••" error={errors.confirmPassword} />
          <button className="btn btn--primary btn--lg auth-submit" type="submit" disabled={submitting}>
            Crear cuenta
          </button>
        </form>
      )}
    </div>
  );
}
