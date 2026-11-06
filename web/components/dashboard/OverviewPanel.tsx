import { Icon } from '@/components/ui/Icon';
import { SENSOR_LIST } from '@/lib/data/sensors';
import type { PlantStatus, Status } from '@/lib/data/status';
import { formatTime } from './format';

const OVERALL_LABELS: Record<Status, string> = {
  optimal: 'Óptimo',
  warning: 'Necesita atención',
  critical: 'Estado crítico',
};

function summarize(plantStatus: PlantStatus) {
  if (!plantStatus.overall) return 'Cargando resumen de condiciones…';

  const labelsWith = (status: Status) =>
    SENSOR_LIST.filter((sensor) => plantStatus.variables[sensor.id] === status).map((sensor) => sensor.label);
  const critical = labelsWith('critical');
  const warning = labelsWith('warning');

  if (critical.length === 0 && warning.length === 0) {
    return 'Todas las variables están en rango óptimo para tu lechuga.';
  }

  const parts = [];
  if (critical.length > 0) parts.push(`${critical.join(', ')} en estado crítico`);
  if (warning.length > 0) parts.push(`${warning.join(', ')} requiere atención`);
  return `${parts.join(' · ')}.`;
}

export function OverviewPanel({ plantStatus }: { plantStatus: PlantStatus }) {
  const { overall, updatedAt } = plantStatus;

  return (
    <section className="overview-panel">
      <div className="overview-panel__status">
        <span className="overview-panel__icon" data-status={overall ?? undefined}>
          {overall && <Icon name={overall === 'optimal' ? 'checkCircle' : 'alertTriangle'} />}
        </span>
        <div>
          <p className="overview-panel__label">Estado general de la planta</p>
          <p className="overview-panel__value">{overall ? OVERALL_LABELS[overall] : 'Cargando…'}</p>
        </div>
      </div>
      <div className="overview-panel__summary">
        <p className="overview-panel__summary-text">{summarize(plantStatus)}</p>
        <p className="overview-panel__meta">
          Última actualización: <strong>{updatedAt ? formatTime(updatedAt) : '—'}</strong>
        </p>
      </div>
    </section>
  );
}
