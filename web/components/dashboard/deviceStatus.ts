/**
 * Estado del dispositivo y de los actuadores para la UI del dashboard.
 * Los tipos siguen las columnas de `devices` y `actuator_state` (CONTRACTS.md §3),
 * con tiempos en ms epoch como el resto de `web/lib/data/`.
 */

export type DeviceConnection = 'online' | 'offline';

export interface DeviceInfo {
  status: DeviceConnection; // devices.status
  lastSeen: number | null; // devices.last_seen
  rssi: number | null; // devices.rssi (dBm)
  uptimeS: number | null; // devices.uptime_s
}

export type ActuatorName = 'pump' | 'fan';
export type ActuatorPower = 'on' | 'off';

export interface ActuatorInfo {
  state: ActuatorPower; // actuator_state.state
  updatedAt: number; // actuator_state.updated_at
}

export type ActuatorStates = Partial<Record<ActuatorName, ActuatorInfo>>;

export const ACTUATOR_LABELS: Record<ActuatorName, string> = {
  pump: 'Bomba',
  fan: 'Ventilador',
};

/**
 * El firmware publica cada 30 s. Si no se ha visto en 3 intervalos se muestra
 * como desconectado aunque `devices.status` siga en online (el Last Will de
 * MQTT puede tardar en llegar).
 */
export const STALE_AFTER_MS = 90_000;

export function effectiveConnection(device: DeviceInfo, now: number): DeviceConnection {
  if (device.status === 'offline') return 'offline';
  if (device.lastSeen === null) return 'offline';
  return now - device.lastSeen > STALE_AFTER_MS ? 'offline' : 'online';
}

/** "hace 12 s", "hace 3 min", "hace 2 h", "hace 1 d". */
export function formatAgo(ts: number, now: number): string {
  const seconds = Math.max(0, Math.floor((now - ts) / 1000));
  if (seconds < 60) return `hace ${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  return `hace ${Math.floor(hours / 24)} d`;
}

export type SignalQuality = 'excellent' | 'good' | 'fair' | 'weak';

export const SIGNAL_LABELS: Record<SignalQuality, string> = {
  excellent: 'Excelente',
  good: 'Buena',
  fair: 'Regular',
  weak: 'Débil',
};

/** Clasificación habitual de RSSI WiFi en dBm. */
export function signalQuality(rssi: number): SignalQuality {
  if (rssi >= -50) return 'excellent';
  if (rssi >= -60) return 'good';
  if (rssi >= -70) return 'fair';
  return 'weak';
}

/** "45 s", "12 min", "3 h 20 min", "2 d 4 h". */
export function formatUptime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  if (s < 60) return `${s} s`;
  const minutes = Math.floor(s / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ${minutes % 60} min`;
  return `${Math.floor(hours / 24)} d ${hours % 24} h`;
}
