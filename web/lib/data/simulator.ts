import { SENSOR_LIST, type SensorDef, type Thresholds } from './sensors';
import type { Snapshot } from './status';

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function randomInRange(low: number, high: number) {
  return low + Math.random() * (high - low);
}

export function roundTo(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function nextValue(sensor: SensorDef, previous: number) {
  const stepRange = (sensor.displayMax - sensor.displayMin) * 0.04;
  const value = previous + randomInRange(-stepRange, stepRange);
  return roundTo(clamp(value, sensor.displayMin, sensor.displayMax), sensor.decimals);
}

export function createInitialReading(thresholds: Thresholds, ts = Date.now()): Snapshot {
  const reading = { ts } as Snapshot;
  SENSOR_LIST.forEach((sensor) => {
    const { min, max } = thresholds[sensor.id];
    const low = min ?? sensor.displayMin;
    const high = max ?? sensor.displayMax;
    reading[sensor.id] = roundTo(randomInRange(low, high), sensor.decimals);
  });
  return reading;
}

export function createNextReading(previous: Snapshot, ts = Date.now()): Snapshot {
  const reading = { ts } as Snapshot;
  SENSOR_LIST.forEach((sensor) => {
    reading[sensor.id] = nextValue(sensor, previous[sensor.id]);
  });
  return reading;
}

/** Historial inicial de `count` lecturas espaciadas `intervalMs`, terminando ahora. */
export function seedHistory(thresholds: Thresholds, count: number, intervalMs: number, now = Date.now()): Snapshot[] {
  const history = [createInitialReading(thresholds, now - (count - 1) * intervalMs)];
  for (let i = 1; i < count; i += 1) {
    history.push(createNextReading(history[i - 1], now - (count - 1 - i) * intervalMs));
  }
  return history;
}
