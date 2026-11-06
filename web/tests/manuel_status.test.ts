import { describe, expect, it } from 'vitest';
import { DEFAULT_THRESHOLDS } from '@/lib/data/sensors';
import { buildPlantStatus, getStatus, type Snapshot } from '@/lib/data/status';

describe('getStatus', () => {
  const temp = DEFAULT_THRESHOLDS.air_temperature; // 15–26, margen 1.1

  it('dentro del umbral es óptimo (bordes incluidos)', () => {
    expect(getStatus(20, temp)).toBe('optimal');
    expect(getStatus(15, temp)).toBe('optimal');
    expect(getStatus(26, temp)).toBe('optimal');
  });

  it('fuera pero dentro del margen del 10 % es atención', () => {
    expect(getStatus(14, temp)).toBe('warning');
    expect(getStatus(27, temp)).toBe('warning');
  });

  it('más allá del margen es crítico', () => {
    expect(getStatus(13, temp)).toBe('critical');
    expect(getStatus(28, temp)).toBe('critical');
  });

  it('umbral sin mínimo o sin máximo solo evalúa el lado definido', () => {
    expect(getStatus(-50, { min: null, max: 30 })).toBe('optimal');
    expect(getStatus(32, { min: null, max: 30 })).toBe('warning');
    expect(getStatus(1000, { min: 10, max: null })).toBe('optimal');
    expect(getStatus(5, { min: null, max: null })).toBe('optimal');
  });

  it('la luz a oscuras queda en atención, no en crítico', () => {
    expect(getStatus(0, DEFAULT_THRESHOLDS.light)).toBe('warning');
  });
});

describe('buildPlantStatus', () => {
  it('sin lectura no hay estado', () => {
    expect(buildPlantStatus(undefined, DEFAULT_THRESHOLDS)).toEqual({ overall: null, variables: {}, updatedAt: null });
  });

  it('el estado general es el peor de las variables', () => {
    const reading: Snapshot = { ts: 1, air_temperature: 20, humidity: 82, light: 50000 };
    const status = buildPlantStatus(reading, DEFAULT_THRESHOLDS);
    expect(status.variables).toEqual({ air_temperature: 'optimal', humidity: 'warning', light: 'critical' });
    expect(status.overall).toBe('critical');
    expect(status.updatedAt).toBe(1);
  });
});
