const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 8;

export type FieldErrors = Partial<Record<'name' | 'email' | 'password' | 'confirmPassword', string>>;

export interface RegistrationInput {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function validateRegistration({ name, email, password, confirmPassword }: RegistrationInput): FieldErrors {
  const errors: FieldErrors = {};

  if (!name || name.trim().length < 2) {
    errors.name = 'Ingresa un nombre de al menos 2 caracteres.';
  }
  if (!email || !EMAIL_PATTERN.test(email.trim())) {
    errors.email = 'Ingresa un correo electrónico válido.';
  }
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }
  if (password !== confirmPassword) {
    errors.confirmPassword = 'Las contraseñas no coinciden.';
  }

  return errors;
}

export function validateLogin({ email, password }: LoginInput): FieldErrors {
  const errors: FieldErrors = {};

  if (!email || !EMAIL_PATTERN.test(email.trim())) {
    errors.email = 'Ingresa un correo electrónico válido.';
  }
  if (!password) {
    errors.password = 'Ingresa tu contraseña.';
  }

  return errors;
}
