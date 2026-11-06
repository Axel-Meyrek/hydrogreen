import { describe, expect, it } from 'vitest';
import { DEFAULT_THRESHOLDS, SENSOR_LIST } from '@/lib/data/sensors';
import { createNextReading, seedHistory } from '@/lib/data/simulator';

describe('simulador (modo demo)', () => {
  it('la lectura inicial cae dentro de los umbrales', () => {
    const [first] = seedHistory(DEFAULT_THRESHOLDS, 1, 5000, 0);
    SENSOR_LIST.forEach((sensor) => {
      const { min, max } = DEFAULT_THRESHOLDS[sensor.id];
      expect(first[sensor.id]).toBeGreaterThanOrEqual(min!);
      expect(first[sensor.id]).toBeLessThanOrEqual(max!);
    });
  });

  it('el historial sembrado está ordenado y termina en "ahora"', () => {
    const history = seedHistory(DEFAULT_THRESHOLDS, 6, 5000, 100_000);
    expect(history).toHaveLength(6);
    expect(history.map((r) => r.ts)).toEqual([75_000, 80_000, 85_000, 90_000, 95_000, 100_000]);
  });

  it('las lecturas siguientes se quedan dentro del rango físico', () => {
    let reading = seedHistory(DEFAULT_THRESHOLDS, 1, 5000)[0];
    for (let i = 0; i < 500; i += 1) {
      reading = createNextReading(reading);
      SENSOR_LIST.forEach((sensor) => {
        expect(reading[sensor.id]).toBeGreaterThanOrEqual(sensor.displayMin);
        expect(reading[sensor.id]).toBeLessThanOrEqual(sensor.displayMax);
      });
    }
  });
});
