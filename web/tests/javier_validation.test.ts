import { describe, expect, it } from 'vitest';
import { normalizeEmail, validateLogin, validateRegistration } from '@/lib/auth/validation';

describe('validación de formularios de acceso', () => {
  it('registro válido no tiene errores', () => {
    expect(
      validateRegistration({ name: 'Ana', email: 'ana@upaep.mx', password: '12345678', confirmPassword: '12345678' })
    ).toEqual({});
  });

  it('registro detecta cada campo inválido', () => {
    const errors = validateRegistration({ name: 'A', email: 'no-es-correo', password: '123', confirmPassword: '321' });
    expect(Object.keys(errors).sort()).toEqual(['confirmPassword', 'email', 'name', 'password']);
  });

  it('login exige correo válido y contraseña', () => {
    expect(validateLogin({ email: 'ana@upaep.mx', password: 'x' })).toEqual({});
    expect(Object.keys(validateLogin({ email: '', password: '' })).sort()).toEqual(['email', 'password']);
  });

  it('normaliza el correo', () => {
    expect(normalizeEmail('  Ana@UPAEP.mx ')).toBe('ana@upaep.mx');
  });
});
