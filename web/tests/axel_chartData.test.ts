import { describe, expect, it } from 'vitest';
import {
  RANGES,
  averageByInterval,
  seriesInRange,
  summarize,
  yDomain,
  type Point,
} from '@/components/dashboard/chartData';
import type { Snapshot } from '@/lib/data/status';

const NOW = 1_800_000_000_000;
const HOUR = 3_600_000;

function snap(ts: number, air_temperature: number): Snapshot {
  return { ts, air_temperature, humidity: 60, light: 1000 };
}

describe('RANGES', () => {
  it('tiene 1 h, 6 h, 24 h y 7 d en orden', () => {
    expect(RANGES.map((r) => r.id)).toEqual(['1h', '6h', '24h', '7d']);
    expect(RANGES[3].ms).toBe(7 * 24 * HOUR);
  });
});

describe('seriesInRange', () => {
  it('deja solo la ventana pedida, ordenada por hora', () => {
    const history = [snap(NOW - 10_000, 21), snap(NOW - 2 * HOUR, 18), snap(NOW - 30_000, 20)];
    expect(seriesInRange(history, 'air_temperature', HOUR, NOW)).toEqual([
      { ts: NOW - 30_000, value: 20 },
      { ts: NOW - 10_000, value: 21 },
    ]);
  });

  it('descarta valores no numéricos', () => {
    const history = [snap(NOW - 1000, Number.NaN), snap(NOW - 500, 22)];
    expect(seriesInRange(history, 'air_temperature', HOUR, NOW)).toHaveLength(1);
  });
});

describe('averageByInterval', () => {
  it('no cambia nada si hay pocos puntos', () => {
    const points: Point[] = [{ ts: NOW - 1000, value: 1 }];
    expect(averageByInterval(points, HOUR, NOW, 10)).toBe(points);
  });

  it('promedia por intervalo cuando hay demasiados puntos', () => {
    // 24 h cada 30 s = 2880 lecturas → como máximo 120 puntos
    const points: Point[] = [];
    for (let ts = NOW - 24 * HOUR + 30_000; ts <= NOW; ts += 30_000) points.push({ ts, value: 20 });
    const result = averageByInterval(points, 24 * HOUR, NOW, 120);
    expect(result.length).toBeLessThanOrEqual(120);
    expect(result.length).toBeGreaterThan(100);
    expect(result.every((p) => p.value === 20)).toBe(true);
  });

  it('el promedio de un intervalo es correcto y usa su centro como hora', () => {
    // ventana de 4 h, 2 intervalos de 2 h
    const points: Point[] = [
      { ts: NOW - 3.5 * HOUR, value: 10 },
      { ts: NOW - 3 * HOUR, value: 20 },
      { ts: NOW - 2.5 * HOUR, value: 30 },
      { ts: NOW - 1 * HOUR, value: 40 },
    ];
    expect(averageByInterval(points, 4 * HOUR, NOW, 2)).toEqual([
      { ts: NOW - 3 * HOUR, value: 20 },
      { ts: NOW - 1 * HOUR, value: 40 },
    ]);
  });
});

describe('yDomain', () => {
  it('incluye las líneas de umbral aunque los datos estén dentro', () => {
    const d = yDomain([20, 21], { min: 15, max: 26 });
    expect(d.min).toBeLessThan(15);
    expect(d.max).toBeGreaterThan(26);
  });

  it('no baja de 0 si ningún valor es negativo', () => {
    expect(yDomain([1000, 8000], { min: 200, max: 40000 }).min).toBe(0);
    expect(yDomain([-5, 3], { min: null, max: null }).min).toBeLessThan(-5);
  });

  it('funciona sin umbral y con un solo valor', () => {
    const d = yDomain([5], { min: null, max: null });
    expect(d.min).toBeLessThan(5);
    expect(d.max).toBeGreaterThan(5);
    expect(yDomain([], { min: null, max: null })).toEqual({ min: 0, max: 1 });
  });
});

describe('summarize', () => {
  it('calcula promedio, mínimo y máximo', () => {
    expect(summarize([{ ts: 1, value: 10 }, { ts: 2, value: 20 }, { ts: 3, value: 30 }])).toEqual({
      avg: 20,
      min: 10,
      max: 30,
    });
    expect(summarize([])).toBeNull();
  });
});
