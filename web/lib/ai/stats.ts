import { SENSOR_LIST } from '@/lib/data/sensors';
import type { Point, Series, StatsByVariable, VariableStats } from './types';

const HOUR_MS = 3_600_000;

export function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Desviación estándar poblacional. */
export function std(values: number[]): number {
  const m = mean(values);
  return Math.sqrt(mean(values.map((v) => (v - m) ** 2)));
}

/** Pendiente de la regresión lineal valor ~ tiempo, en unidades por hora. */
export function slopePerHour(points: Point[]): number {
  if (points.length < 2) return 0;
  const t0 = points[0].ts;
  const xs = points.map((p) => (p.ts - t0) / HOUR_MS);
  const ys = points.map((p) => p.value);
  const mx = mean(xs);
  const my = mean(ys);
  let num = 0;
  let den = 0;
  for (let i = 0; i < xs.length; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

export function computeStats(points: Point[]): VariableStats | null {
  if (points.length === 0) return null;
  const sorted = [...points].sort((a, b) => a.ts - b.ts);
  const values = sorted.map((p) => p.value);
  return {
    count: values.length,
    mean: mean(values),
    std: std(values),
    min: Math.min(...values),
    max: Math.max(...values),
    last: values[values.length - 1],
    slopePerHour: slopePerHour(sorted),
  };
}

export function computeAllStats(series: Series): StatsByVariable {
  const out: StatsByVariable = {};
  for (const sensor of SENSOR_LIST) {
    const s = computeStats(series[sensor.id] ?? []);
    if (s) out[sensor.id] = s;
  }
  return out;
}
