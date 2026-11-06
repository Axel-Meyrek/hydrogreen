/**
 * Único punto de acceso a localStorage (preferencias y sesión del modo demo).
 * Los datos reales viven en Supabase; aquí solo hay valores del navegador.
 */

const NAMESPACE = 'hydrogreen';

function storageKey(name: string) {
  return `${NAMESPACE}_${name}`;
}

export const kv = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(storageKey(key));
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch (err) {
      console.error(`No se pudo leer "${key}" de localStorage`, err);
      return fallback;
    }
  },
  set(key: string, value: unknown) {
    try {
      localStorage.setItem(storageKey(key), JSON.stringify(value));
    } catch (err) {
      console.error(`No se pudo guardar "${key}" en localStorage`, err);
    }
  },
  remove(key: string) {
    try {
      localStorage.removeItem(storageKey(key));
    } catch {
      // sin almacenamiento disponible: nada que borrar
    }
  },
};
