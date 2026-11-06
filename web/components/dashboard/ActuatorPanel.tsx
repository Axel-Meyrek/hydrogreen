import { Icon, type IconName } from '@/components/ui/Icon';
import { ACTUATOR_LABELS, formatAgo, type ActuatorName, type ActuatorStates } from './deviceStatus';

const ACTUATORS: { id: ActuatorName; icon: IconName }[] = [
  { id: 'pump', icon: 'droplet' },
  { id: 'fan', icon: 'fan' },
];

export function ActuatorPanel({ actuators, now }: { actuators: ActuatorStates | null; now: number }) {
  return (
    <section className="status-panel" aria-labelledby="actuator-status-title">
      <div className="status-panel__header">
        <span className="icon-chip icon-chip--sm"><Icon name="sprout" /></span>
        <h2 id="actuator-status-title" className="status-panel__title">Actuadores</h2>
      </div>

      <ul className="actuator-list">
        {ACTUATORS.map(({ id, icon }) => {
          const info = actuators?.[id];
          return (
            <li key={id} className="actuator-list__item" data-state={info?.state}>
              <span className="actuator-list__icon"><Icon name={icon} /></span>
              <span className="actuator-list__name">{ACTUATOR_LABELS[id]}</span>
              {info ? (
                <span className="actuator-list__state">
                  <span className={`chip ${info.state === 'on' ? 'chip--optimal' : 'chip--neutral'}`}>
                    {info.state === 'on' ? 'Encendido' : 'Apagado'}
                  </span>
                  <span className="actuator-list__since">{formatAgo(info.updatedAt, now)}</span>
                </span>
              ) : (
                <span className="chip chip--neutral">Sin datos</span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
