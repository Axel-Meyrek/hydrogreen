import { SENSORS, type MeasurementType } from '@/lib/data/sensors';
import type { AiInput, Recommendation } from './types';

type Side = 'low' | 'high';

/** Acción sugerida por variable fuera de umbral (solo ventilador/bomba/luz; sin pH ni nivel). */
const ACTIONS: Record<MeasurementType, Record<Side, string>> = {
  air_temperature: {
    high: 'Encender el ventilador y revisar que el cultivo no reciba sol directo.',
    low: 'Mantener el ventilador apagado y proteger el cultivo del frío.',
  },
  humidity: {
    high: 'Encender el ventilador para renovar el aire y bajar la humedad.',
    low: 'Mantener el ventilador apagado y verificar que la bomba circule la solución.',
  },
  light: {
    high: 'Reducir la exposición con una malla de sombra.',
    low: 'Aumentar la luz disponible (acercar lámpara o retirar obstáculos).',
  },
};

/** Respaldo determinista cuando Claude no responde o devuelve algo inválido. */
export function rulesRecommendation(input: AiInput): Recommendation {
  const issues: string[] = [];
  const actions: string[] = [];

  for (const [key, stats] of Object.entries(input.stats)) {
    const type = key as MeasurementType;
    const t = input.thresholds[type];
    const sensor = SENSORS[type];
    const fmt = (v: number) => `${v.toFixed(sensor.decimals)}${sensor.unit}`;
    if (t.min !== null && stats.last < t.min) {
      issues.push(`${sensor.label} bajo (${fmt(stats.last)}, mínimo ${fmt(t.min)})`);
      actions.push(ACTIONS[type].low);
    } else if (t.max !== null && stats.last > t.max) {
      issues.push(`${sensor.label} alto (${fmt(stats.last)}, máximo ${fmt(t.max)})`);
      actions.push(ACTIONS[type].high);
    }
  }

  const anomalyNote = input.anomalies.length
    ? ` Se detectaron ${input.anomalies.length} lecturas atípicas en la ventana; conviene revisar los sensores.`
    : '';

  if (Object.keys(input.stats).length === 0) {
    return {
      summary: 'Sin lecturas en la ventana analizada.',
      recommendation: 'Verificar que el dispositivo esté en línea y enviando datos.',
      explanation: 'No hay datos suficientes para evaluar el cultivo.',
      source: 'rules',
      model: null,
    };
  }

  if (issues.length === 0) {
    return {
      summary: 'Todas las variables están dentro de sus umbrales.',
      recommendation: 'Sin cambios: mantener la configuración actual.',
      explanation: `Último valor de cada variable dentro del rango configurado.${anomalyNote}`,
      source: 'rules',
      model: null,
    };
  }

  return {
    summary: `${issues.join('; ')}.`,
    recommendation: [...new Set(actions)].join(' '),
    explanation: `Reglas fijas sobre el último valor frente a los umbrales.${anomalyNote}`,
    source: 'rules',
    model: null,
  };
}
