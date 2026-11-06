'use client';

/**
 * Autenticación del prototipo (solo navegador, localStorage). Es temporal:
 * en la fase 5 Javier la reemplaza con Supabase Auth y roles (profiles.role).
 * Mantener la misma API (registerUser, loginUser, logoutUser, getCurrentUser)
 * facilita el cambio para las pantallas que ya la usan.
 */

import { kv } from '@/lib/storage';
import { normalizeEmail, type LoginInput, type RegistrationInput } from './validation';

interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
}

async function hashPassword(password: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function toPublicUser(user: StoredUser): PublicUser {
  return { id: user.id, name: user.name, email: user.email };
}

function getUsers() {
  return kv.get<StoredUser[]>('users', []);
}

export async function registerUser({ name, email, password }: Omit<RegistrationInput, 'confirmPassword'>) {
  const normalizedEmail = normalizeEmail(email);
  const users = getUsers();

  if (users.some((user) => user.email === normalizedEmail)) {
    throw new Error('Ya existe una cuenta con este correo.');
  }

  const user: StoredUser = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  kv.set('users', [...users, user]);
  kv.set('session', { userId: user.id });
  return toPublicUser(user);
}

export async function loginUser({ email, password }: LoginInput) {
  const normalizedEmail = normalizeEmail(email);
  const user = getUsers().find((candidate) => candidate.email === normalizedEmail);
  const passwordHash = await hashPassword(password);

  if (!user || user.passwordHash !== passwordHash) {
    throw new Error('Correo o contraseña incorrectos.');
  }

  kv.set('session', { userId: user.id });
  return toPublicUser(user);
}

export function logoutUser() {
  kv.remove('session');
}

export function getCurrentUser(): PublicUser | null {
  const session = kv.get<{ userId: string } | null>('session', null);
  if (!session) return null;

  const user = getUsers().find((candidate) => candidate.id === session.userId);
  if (!user) {
    kv.remove('session');
    return null;
  }

  return toPublicUser(user);
}
