/**
 * Variables medidas por el Arduino (CONTRACTS.md §2). Las claves son los
 * measurement_type del contrato; no agregar variables sin cambiar el contrato.
 */

export type MeasurementType = 'air_temperature' | 'humidity' | 'light';

export type IconName = 'thermometer' | 'cloud' | 'sun';

export interface SensorDef {
  id: MeasurementType;
  sensorId: string; // sensor_id que publica el firmware
  label: string;
  unit: string; // unidad para mostrar
  icon: IconName;
  decimals: number;
  // Rango físico que se dibuja en las gráficas (no son umbrales).
  displayMin: number;
  displayMax: number;
}

export const SENSORS: Record<MeasurementType, SensorDef> = {
  air_temperature: {
    id: 'air_temperature',
    sensorId: 'TEMP-001',
    label: 'Temperatura',
    unit: '°C',
    icon: 'thermometer',
    decimals: 1,
    displayMin: 0,
    displayMax: 45,
  },
  humidity: {
    id: 'humidity',
    sensorId: 'HUM-001',
    label: 'Humedad ambiental',
    unit: '%',
    icon: 'cloud',
    decimals: 1,
    displayMin: 0,
    displayMax: 100,
  },
  light: {
    id: 'light',
    sensorId: 'LUX-001',
    label: 'Luz',
    unit: ' lux',
    icon: 'sun',
    decimals: 0,
    displayMin: 0,
    displayMax: 65535, // máximo del BH1750
  },
};

export const SENSOR_LIST: SensorDef[] = Object.values(SENSORS);

export interface Threshold {
  min: number | null;
  max: number | null;
}

export type Thresholds = Record<MeasurementType, Threshold>;

/** Umbrales iniciales de 001_base.sql. En la fase 2 se leen de la tabla thresholds. */
export const DEFAULT_THRESHOLDS: Thresholds = {
  air_temperature: { min: 15, max: 26 },
  humidity: { min: 50, max: 80 },
  light: { min: 200, max: 40000 },
};

export const DEVICE_ID = 'R4-001';
export const SYSTEM_ID = 'NFT-001';
