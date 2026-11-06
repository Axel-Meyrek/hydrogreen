import { Icon } from '@/components/ui/Icon';
import { STATUS_LABELS, type Status } from '@/lib/data/status';
import type { SensorDef } from '@/lib/data/sensors';
import { formatTime, formatValue } from './format';
import { Sparkline } from './Sparkline';

const CONDITION_TITLE: Record<Status, string> = {
  optimal: 'En condiciones adecuadas',
  warning: 'Fuera del rango ideal',
  critical: 'Fuera del rango ideal',
};

function Delta({ delta, sensor }: { delta: number | null; sensor: SensorDef }) {
  if (delta === null) return <span className="card__delta">Primera lectura</span>;
  if (delta === 0) return <span className="card__delta">Sin cambio</span>;

  const up = delta > 0;
  return (
    <span className="card__delta" data-direction={up ? 'up' : 'down'}>
      <Icon name={up ? 'arrowUp' : 'arrowDown'} />
      <span>
        {up ? '+' : ''}
        {formatValue(delta, sensor)}
        {sensor.unit} vs. anterior
      </span>
    </span>
  );
}

export function SensorCard({
  sensor,
  value,
  status,
  history,
  delta,
  ts,
}: {
  sensor: SensorDef;
  value: number | undefined;
  status: Status | undefined;
  history: number[];
  delta: number | null;
  ts: number | undefined;
}) {
  return (
    <article className="card" data-sensor={sensor.id} data-status={status}>
      <div className="card__header">
        <span className="icon-chip icon-chip--sm"><Icon name={sensor.icon} /></span>
        <h3 className="card__title">{sensor.label}</h3>
        <span className="card__condition" data-status={status} title={CONDITION_TITLE[status ?? 'optimal']}>
          {status && <Icon name={status === 'optimal' ? 'checkCircle' : 'alertTriangle'} />}
        </span>
      </div>
      <div className="card__value">
        <span className="card__number">{value === undefined ? '—' : formatValue(value, sensor)}</span>
        <span className="card__unit">{sensor.unit}</span>
      </div>
      <div className="card__meta">
        <span className={`chip${status ? ` chip--${status}` : ''}`}>{status ? STATUS_LABELS[status] : '—'}</span>
        <Delta delta={delta} sensor={sensor} />
      </div>
      <p className="card__time">{ts === undefined ? 'Sin lecturas' : `Lectura de las ${formatTime(ts)}`}</p>
      <Sparkline values={history} min={sensor.displayMin} max={sensor.displayMax} status={status} />
    </article>
  );
}
