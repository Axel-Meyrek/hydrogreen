'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BrandMark } from '@/components/ui/Icon';
import { getCurrentUser, logoutUser, type PublicUser } from '@/lib/auth/demo-auth';
import { SENSOR_LIST } from '@/lib/data/sensors';
import { buildPlantStatus } from '@/lib/data/status';
import { useSensorData } from '@/lib/data/useSensorData';
import { roundTo } from '@/lib/data/simulator';
import { ActuatorPanel } from './ActuatorPanel';
import { DeviceStatusPanel } from './DeviceStatusPanel';
import type { ActuatorStates, DeviceInfo } from './deviceStatus';
import { HistoryCharts } from './HistoryCharts';
import { HistoryTable } from './HistoryTable';
import { OverviewPanel } from './OverviewPanel';
import { SensorCard } from './SensorCard';
import { useNow } from './useNow';
import './dashboard.css';

const MAX_LOG_ENTRIES = 10;

export function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const { history, thresholds, demo, running, setRunning, reset } = useSensorData();
  const now = useNow();

  useEffect(() => {
    const current = getCurrentUser();
    if (!current) {
      router.replace('/login');
      return;
    }
    setUser(current);
  }, [router]);

  if (!user) return null;

  const latest = history[history.length - 1];
  const previous = history.length > 1 ? history[history.length - 2] : undefined;
  const plantStatus = buildPlantStatus(latest, thresholds);

  // TODO(Manuel, lib/data): exponer devices y actuator_state con Realtime en useSensorData.
  // Mientras tanto, en modo demo el dispositivo se considera en línea con la última lectura simulada.
  const device: DeviceInfo | null = demo && latest
    ? { status: 'online', lastSeen: latest.ts, rssi: null, uptimeS: null }
    : null;
  const actuators: ActuatorStates | null = null;

  function onLogout() {
    logoutUser();
    router.push('/login');
  }

  function onReset() {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    reset();
    setConfirmReset(false);
  }

  return (
    <div className="app">
      <header className="app-header">
        <Link className="app-header__brand" href="/" aria-label="Volver al inicio de HydroGreenAI">
          <BrandMark />
          <div>
            <h1>HydroGreenAI</h1>
            <p>Monitor de crecimiento — Lechuga · NFT-001</p>
          </div>
        </Link>
        <div className="app-header__account">
          <span className="user-chip">
            <span className="user-chip__avatar">{user.name.trim().charAt(0).toUpperCase() || '?'}</span>
            <span className="user-chip__name">{user.name}</span>
          </span>
          <button className="btn btn--danger" type="button" onClick={onLogout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <OverviewPanel plantStatus={plantStatus} />

      <div className="status-row">
        <DeviceStatusPanel device={device} now={now} />
        <ActuatorPanel actuators={actuators} now={now} />
      </div>

      {demo && (
        <section className="toolbar">
          <p className="toolbar__label">Modo demo</p>
          <div className="toolbar__actions">
            <button className="btn btn--primary" type="button" onClick={() => setRunning(!running)}>
              {running ? 'Pausar simulación' : 'Reanudar simulación'}
            </button>
            <button className="btn btn--danger" type="button" onClick={onReset} onBlur={() => setConfirmReset(false)}>
              {confirmReset ? '¿Seguro? Confirmar reinicio' : 'Reiniciar datos'}
            </button>
          </div>
        </section>
      )}

      <main className="dashboard">
        {SENSOR_LIST.map((sensor) => (
          <SensorCard
            key={sensor.id}
            sensor={sensor}
            value={latest?.[sensor.id]}
            status={plantStatus.variables[sensor.id]}
            history={history.map((reading) => reading[sensor.id])}
            delta={latest && previous ? roundTo(latest[sensor.id] - previous[sensor.id], sensor.decimals) : null}
            ts={latest?.ts}
          />
        ))}
      </main>

      <HistoryCharts history={history} thresholds={thresholds} now={now} />

      <HistoryTable history={history} maxEntries={MAX_LOG_ENTRIES} />

      <footer className="app-footer">
        <p>
          {demo
            ? 'Modo demo — datos simulados en este navegador. Los datos reales del Arduino llegan en la fase 2.'
            : 'Datos en vivo del Arduino R4-001.'}
        </p>
      </footer>
    </div>
  );
}
