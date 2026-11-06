import type { MeasurementType, Thresholds } from '@/lib/data/sensors';

/** Una lectura de una variable; ts en ms epoch. */
export interface Point {
  ts: number;
  value: number;
}

export type Series = Record<MeasurementType, Point[]>;

export interface VariableStats {
  count: number;
  mean: number;
  std: number;
  min: number;
  max: number;
  last: number;
  /** Cambio por hora (regresión lineal sobre la ventana). */
  slopePerHour: number;
}

export type StatsByVariable = Partial<Record<MeasurementType, VariableStats>>;

export type AnomalyMethod = 'zscore' | 'ewma';

export interface Anomaly {
  measurement_type: MeasurementType;
  ts: number;
  value: number;
  /** Puntaje del método principal (|z| o residuo/σ). */
  score: number;
  methods: AnomalyMethod[];
}

export interface AiInput {
  windowStart: number;
  windowEnd: number;
  stats: StatsByVariable;
  anomalies: Anomaly[];
  thresholds: Thresholds;
  pump: 'on' | 'off' | null;
  fan: 'on' | 'off' | null;
}

/** Forma que se guarda en ai_recommendations (CONTRACTS.md §3). */
export interface Recommendation {
  summary: string;
  recommendation: string;
  explanation: string;
  source: 'llm' | 'rules';
  model: string | null;
}
