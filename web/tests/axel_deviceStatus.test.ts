import { describe, expect, it } from 'vitest';
import {
  STALE_AFTER_MS,
  effectiveConnection,
  formatAgo,
  formatUptime,
  signalQuality,
  type DeviceInfo,
} from '@/components/dashboard/deviceStatus';

const NOW = 1_800_000_000_000;

function device(overrides: Partial<DeviceInfo> = {}): DeviceInfo {
  return { status: 'online', lastSeen: NOW - 10_000, rssi: -41, uptimeS: 120, ...overrides };
}

describe('effectiveConnection', () => {
  it('online visto recientemente sigue en línea', () => {
    expect(effectiveConnection(device(), NOW)).toBe('online');
    expect(effectiveConnection(device({ lastSeen: NOW - STALE_AFTER_MS }), NOW)).toBe('online');
  });

  it('online pero sin verse en más de 90 s se muestra desconectado', () => {
    expect(effectiveConnection(device({ lastSeen: NOW - STALE_AFTER_MS - 1 }), NOW)).toBe('offline');
  });

  it('offline o nunca visto es desconectado', () => {
    expect(effectiveConnection(device({ status: 'offline' }), NOW)).toBe('offline');
    expect(effectiveConnection(device({ lastSeen: null }), NOW)).toBe('offline');
  });
});

describe('formatAgo', () => {
  it('usa la unidad adecuada', () => {
    expect(formatAgo(NOW - 12_000, NOW)).toBe('hace 12 s');
    expect(formatAgo(NOW - 3 * 60_000, NOW)).toBe('hace 3 min');
    expect(formatAgo(NOW - 2 * 3_600_000, NOW)).toBe('hace 2 h');
    expect(formatAgo(NOW - 26 * 3_600_000, NOW)).toBe('hace 1 d');
  });

  it('una hora futura (reloj desfasado) se muestra como 0 s', () => {
    expect(formatAgo(NOW + 5_000, NOW)).toBe('hace 0 s');
  });
});

describe('signalQuality', () => {
  it('clasifica el RSSI en dBm', () => {
    expect(signalQuality(-41)).toBe('excellent');
    expect(signalQuality(-50)).toBe('excellent');
    expect(signalQuality(-55)).toBe('good');
    expect(signalQuality(-65)).toBe('fair');
    expect(signalQuality(-80)).toBe('weak');
  });
});

describe('formatUptime', () => {
  it('formatea segundos, minutos, horas y días', () => {
    expect(formatUptime(45)).toBe('45 s');
    expect(formatUptime(12 * 60)).toBe('12 min');
    expect(formatUptime(3 * 3600 + 20 * 60)).toBe('3 h 20 min');
    expect(formatUptime(2 * 86400 + 4 * 3600)).toBe('2 d 4 h');
  });
});
