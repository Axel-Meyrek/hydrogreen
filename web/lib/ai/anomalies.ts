import { SENSOR_LIST, type MeasurementType } from '@/lib/data/sensors';
import { mean, std } from './stats';
import type { Anomaly, AnomalyMethod, Point, Series } from './types';

export interface DetectOptions {
  /** Umbral de z-score (ai_config.zscore_threshold). */
  zThreshold?: number;
  /** Suavizado del EWMA, 0 < alpha ≤ 1. */
  alpha?: number;
  /** Mínimo de puntos para evaluar; con menos no se reporta nada. */
  minPoints?: number;
}

/** Índices con |z| > umbral respecto a la media y σ de toda la ventana. */
export function zscoreFlags(values: number[], threshold: number): Map<number, number> {
  const flags = new Map<number, number>();
  const sd = std(values);
  if (sd === 0) return flags;
  const m = mean(values);
  values.forEach((v, i) => {
    const z = Math.abs(v - m) / sd;
    if (z > threshold) flags.set(i, z);
  });
  return flags;
}

/**
 * Índices cuyo residuo contra el EWMA previo supera `threshold` desviaciones
 * estándar de los residuos. Detecta saltos respecto a la tendencia reciente.
 */
export function ewmaFlags(values: number[], threshold: number, alpha: number): Map<number, number> {
  const flags = new Map<number, number>();
  if (values.length < 3) return flags;
  const residuals: number[] = [];
  let ewma = values[0];
  for (let i = 1; i < values.length; i++) {
    residuals.push(values[i] - ewma);
    ewma = alpha * values[i] + (1 - alpha) * ewma;
  }
  const sd = std(residuals);
  if (sd === 0) return flags;
  residuals.forEach((r, i) => {
    const score = Math.abs(r) / sd;
    if (score > threshold) flags.set(i + 1, score);
  });
  return flags;
}

export function detectAnomaliesForVariable(
  type: MeasurementType,
  points: Point[],
  { zThreshold = 3, alpha = 0.3, minPoints = 8 }: DetectOptions = {},
): Anomaly[] {
  if (points.length < minPoints) return [];
  const sorted = [...points].sort((a, b) => a.ts - b.ts);
  const values = sorted.map((p) => p.value);
  const z = zscoreFlags(values, zThreshold);
  const e = ewmaFlags(values, zThreshold, alpha);

  const indices = new Set([...z.keys(), ...e.keys()]);
  return [...indices]
    .sort((a, b) => a - b)
    .map((i) => {
      const methods: AnomalyMethod[] = [];
      if (z.has(i)) methods.push('zscore');
      if (e.has(i)) methods.push('ewma');
      return {
        measurement_type: type,
        ts: sorted[i].ts,
        value: sorted[i].value,
        score: z.get(i) ?? e.get(i) ?? 0,
        methods,
      };
    });
}

export function detectAnomalies(series: Series, options?: DetectOptions): Anomaly[] {
  return SENSOR_LIST.flatMap((s) => detectAnomaliesForVariable(s.id, series[s.id] ?? [], options));
}
