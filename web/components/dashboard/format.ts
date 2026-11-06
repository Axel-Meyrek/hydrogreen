import type { SensorDef } from '@/lib/data/sensors';

export function formatValue(value: number, sensor: SensorDef) {
  return value.toLocaleString('es-MX', {
    minimumFractionDigits: sensor.decimals,
    maximumFractionDigits: sensor.decimals,
  });
}

export function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
