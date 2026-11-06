import { Icon } from '@/components/ui/Icon';
import { DEVICE_ID } from '@/lib/data/sensors';
import {
  SIGNAL_LABELS,
  effectiveConnection,
  formatAgo,
  formatUptime,
  signalQuality,
  type DeviceInfo,
  type SignalQuality,
} from './deviceStatus';

const SIGNAL_CHIP: Record<SignalQuality, string> = {
  excellent: 'chip--optimal',
  good: 'chip--optimal',
  fair: 'chip--warning',
  weak: 'chip--critical',
};

export function DeviceStatusPanel({ device, now }: { device: DeviceInfo | null; now: number }) {
  const connection = device ? effectiveConnection(device, now) : null;

  return (
    <section className="status-panel" aria-labelledby="device-status-title">
      <div className="status-panel__header">
        <span className="icon-chip icon-chip--sm"><Icon name="gauge" /></span>
        <h2 id="device-status-title" className="status-panel__title">Dispositivo {DEVICE_ID}</h2>
        {connection && (
          <span className={`chip ${connection === 'online' ? 'chip--optimal' : 'chip--critical'}`}>
            {connection === 'online' ? 'En línea' : 'Desconectado'}
          </span>
        )}
      </div>

      {!device ? (
        <p className="status-panel__empty">Sin datos del dispositivo todavía.</p>
      ) : (
        <dl className="status-panel__list">
          <div>
            <dt>Última conexión</dt>
            <dd>{device.lastSeen === null ? 'Nunca' : formatAgo(device.lastSeen, now)}</dd>
          </div>
          <div>
            <dt>Señal WiFi</dt>
            <dd>
              {device.rssi === null ? (
                '—'
              ) : (
                <>
                  {device.rssi} dBm{' '}
                  <span className={`chip ${SIGNAL_CHIP[signalQuality(device.rssi)]}`}>
                    {SIGNAL_LABELS[signalQuality(device.rssi)]}
                  </span>
                </>
              )}
            </dd>
          </div>
          <div>
            <dt>Tiempo encendido</dt>
            <dd>{device.uptimeS === null ? '—' : formatUptime(device.uptimeS)}</dd>
          </div>
        </dl>
      )}
    </section>
  );
}
