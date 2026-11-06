import { SENSOR_LIST } from '@/lib/data/sensors';
import type { Snapshot } from '@/lib/data/status';
import { formatTime, formatValue } from './format';

export function HistoryTable({ history, maxEntries }: { history: Snapshot[]; maxEntries: number }) {
  const recent = history.slice(-maxEntries).reverse();

  return (
    <section className="history-panel">
      <h2>Historial de lecturas</h2>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Hora</th>
              {SENSOR_LIST.map((sensor) => (
                <th key={sensor.id}>{sensor.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recent.map((reading) => (
              <tr key={reading.ts}>
                <td>{formatTime(reading.ts)}</td>
                {SENSOR_LIST.map((sensor) => (
                  <td key={sensor.id}>
                    {formatValue(reading[sensor.id], sensor)}
                    {sensor.unit}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
