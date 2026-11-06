'use client';

import { useMemo, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { SENSOR_LIST, type Thresholds } from '@/lib/data/sensors';
import type { Snapshot } from '@/lib/data/status';
import { RANGES, averageByInterval, seriesInRange, summarize, yDomain, type RangeId } from './chartData';
import { formatValue } from './format';
import { HistoryChart } from './HistoryChart';

export function HistoryCharts({
  history,
  thresholds,
  now,
}: {
  history: Snapshot[];
  thresholds: Thresholds;
  now: number;
}) {
  const [rangeId, setRangeId] = useState<RangeId>('1h');
  const range = RANGES.find((r) => r.id === rangeId) ?? RANGES[0];

  // Se recalcula con cada lectura nueva (history) o al cambiar de rango; `now` solo
  // mueve la ventana, así que se redondea al minuto para no redibujar cada segundo.
  const minute = Math.floor(now / 60_000) * 60_000;
  const windowEnd = Math.max(minute + 60_000, history[history.length - 1]?.ts ?? 0);

  const series = useMemo(
    () =>
      SENSOR_LIST.map((sensor) => {
        const raw = seriesInRange(history, sensor.id, range.ms, windowEnd);
        const points = averageByInterval(raw, range.ms, windowEnd);
        const threshold = thresholds[sensor.id];
        return {
          sensor,
          points,
          threshold,
          averaged: points !== raw,
          summary: summarize(raw),
          domain: yDomain(points.map((p) => p.value), threshold),
        };
      }),
    [history, thresholds, range.ms, windowEnd],
  );

  return (
    <section className="charts-panel" aria-labelledby="charts-title">
      <div className="charts-panel__header">
        <h2 id="charts-title">Historial</h2>
        <div className="segmented" role="group" aria-label="Rango de tiempo">
          {RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`segmented__btn${r.id === rangeId ? ' is-active' : ''}`}
              aria-pressed={r.id === rangeId}
              onClick={() => setRangeId(r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="charts-panel__grid">
        {series.map(({ sensor, points, threshold, averaged, summary, domain }) => (
          <article key={sensor.id} className="chart-card">
            <div className="chart-card__header">
              <span className="icon-chip icon-chip--sm"><Icon name={sensor.icon} /></span>
              <h3 className="chart-card__title">{sensor.label}</h3>
              {averaged && <span className="chip chip--neutral">Promediado</span>}
            </div>
            <HistoryChart
              sensor={sensor}
              points={points}
              threshold={threshold}
              domain={domain}
              range={rangeId}
              rangeMs={range.ms}
              now={windowEnd}
            />
            <p className="chart-card__summary">
              {summary ? (
                <>
                  Promedio <strong>{formatValue(summary.avg, sensor)}{sensor.unit}</strong> · Mín{' '}
                  <strong>{formatValue(summary.min, sensor)}{sensor.unit}</strong> · Máx{' '}
                  <strong>{formatValue(summary.max, sensor)}{sensor.unit}</strong>
                </>
              ) : (
                'Sin lecturas en este rango.'
              )}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
