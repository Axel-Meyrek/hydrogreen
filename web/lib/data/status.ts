import { SENSOR_LIST, type MeasurementType, type Threshold, type Thresholds } from './sensors';

export type Status = 'optimal' | 'warning' | 'critical';

export const STATUS_PRIORITY: Record<Status, number> = { optimal: 1, warning: 2, critical: 3 };

export const STATUS_LABELS: Record<Status, string> = {
  optimal: 'Óptimo',
  warning: 'Atención',
  critical: 'Crítico',
};

/** Fracción del rango [min, max] que se tolera fuera del umbral antes de pasar a crítico. */
export const WARNING_MARGIN = 0.1;

/**
 * Estado visual de un valor contra su umbral (solo para la UI; las alertas
 * las generan los triggers de 002_alerts.sql usando min/max directamente):
 * dentro de [min, max] → óptimo; fuera pero a menos del 10 % del rango → atención;
 * más lejos → crítico. Un umbral vacío o deshabilitado se considera óptimo.
 */
export function getStatus(value: number, threshold: Threshold): Status {
  const { min, max } = threshold;
  if ((min === null || value >= min) && (max === null || value <= max)) return 'optimal';

  const span = min !== null && max !== null ? max - min : Math.abs(min ?? max ?? 0);
  const margin = span * WARNING_MARGIN;
  if (min !== null && value < min) return value >= min - margin ? 'warning' : 'critical';
  return value <= (max as number) + margin ? 'warning' : 'critical';
}

/** Lectura agregada: un valor por variable en un mismo instante (ms epoch). */
export type Snapshot = { ts: number } & Record<MeasurementType, number>;

export interface PlantStatus {
  overall: Status | null;
  variables: Partial<Record<MeasurementType, Status>>;
  updatedAt: number | null;
}

export function buildPlantStatus(reading: Snapshot | undefined, thresholds: Thresholds): PlantStatus {
  if (!reading) return { overall: null, variables: {}, updatedAt: null };

  let overall: Status = 'optimal';
  const variables: PlantStatus['variables'] = {};
  SENSOR_LIST.forEach((sensor) => {
    const status = getStatus(reading[sensor.id], thresholds[sensor.id]);
    variables[sensor.id] = status;
    if (STATUS_PRIORITY[status] > STATUS_PRIORITY[overall]) overall = status;
  });

  return { overall, variables, updatedAt: reading.ts };
}
