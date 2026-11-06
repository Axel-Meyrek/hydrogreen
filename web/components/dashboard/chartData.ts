/**
 * Preparación de datos para las gráficas de historial (funciones puras).
 * Recibe los Snapshot de `web/lib/data/` y no consulta nada por su cuenta.
 */

import type { MeasurementType, Threshold } from '@/lib/data/sensors';
import type { Snapshot } from '@/lib/data/status';

export type RangeId = '1h' | '6h' | '24h' | '7d';

export interface RangeDef {
  id: RangeId;
  label: string;
  ms: number;
}

const HOUR = 3_600_000;

export const RANGES: RangeDef[] = [
  { id: '1h', label: '1 h', ms: HOUR },
  { id: '6h', label: '6 h', ms: 6 * HOUR },
  { id: '24h', label: '24 h', ms: 24 * HOUR },
  { id: '7d', label: '7 d', ms: 7 * 24 * HOUR },
];

/** Máximo de puntos que se dibujan; con más se promedia por intervalo. */
export const MAX_CHART_POINTS = 120;

export interface Point {
  ts: number;
  value: number;
}

/** Serie de una variable dentro de la ventana [now - rangeMs, now], ordenada por hora. */
export function seriesInRange(history: Snapshot[], type: MeasurementType, rangeMs: number, now: number): Point[] {
  const from = now - rangeMs;
  return history
    .filter((s) => s.ts >= from && s.ts <= now && Number.isFinite(s[type]))
    .map((s) => ({ ts: s.ts, value: s[type] }))
    .sort((a, b) => a.ts - b.ts);
}

/**
 * Si hay más de `maxPoints`, divide la ventana en `maxPoints` intervalos iguales y
 * devuelve el promedio de cada intervalo con lecturas (hora = centro del intervalo).
 */
export function averageByInterval(
  points: Point[],
  rangeMs: number,
  now: number,
  maxPoints = MAX_CHART_POINTS,
): Point[] {
  if (points.length <= maxPoints) return points;

  const from = now - rangeMs;
  const bucketMs = rangeMs / maxPoints;
  const sums = new Map<number, { total: number; count: number }>();

  for (const p of points) {
    const index = Math.min(maxPoints - 1, Math.floor((p.ts - from) / bucketMs));
    const bucket = sums.get(index) ?? { total: 0, count: 0 };
    bucket.total += p.value;
    bucket.count += 1;
    sums.set(index, bucket);
  }

  return [...sums.entries()]
    .sort(([a], [b]) => a - b)
    .map(([index, { total, count }]) => ({ ts: from + (index + 0.5) * bucketMs, value: total / count }));
}

export interface Domain {
  min: number;
  max: number;
}

/**
 * Rango del eje Y: incluye los datos y las líneas de umbral, con 8 % de margen.
 * Si nada es negativo (temperatura, humedad y luz del invernadero) no baja de 0.
 */
export function yDomain(values: number[], threshold: Threshold): Domain {
  const all = [...values];
  if (threshold.min !== null) all.push(threshold.min);
  if (threshold.max !== null) all.push(threshold.max);
  if (all.length === 0) return { min: 0, max: 1 };

  const min = Math.min(...all);
  const max = Math.max(...all);
  const floor = min >= 0 ? 0 : -Infinity;
  if (min === max) {
    const pad = Math.abs(min) * 0.1 || 1;
    return { min: Math.max(floor, min - pad), max: max + pad };
  }
  const pad = (max - min) * 0.08;
  return { min: Math.max(floor, min - pad), max: max + pad };
}

export interface SeriesSummary {
  avg: number;
  min: number;
  max: number;
}

export function summarize(points: Point[]): SeriesSummary | null {
  if (points.length === 0) return null;
  let total = 0;
  let min = Infinity;
  let max = -Infinity;
  for (const { value } of points) {
    total += value;
    if (value < min) min = value;
    if (value > max) max = value;
  }
  return { avg: total / points.length, min, max };
}
