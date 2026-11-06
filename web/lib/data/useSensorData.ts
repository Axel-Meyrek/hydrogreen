'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { kv } from '@/lib/storage';
import { DEFAULT_THRESHOLDS, type Thresholds } from './sensors';
import { createNextReading, seedHistory } from './simulator';
import type { Snapshot } from './status';

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE !== 'false';

export const SIMULATION = {
  intervalMs: 5000,
  maxHistoryPoints: 50,
  seedCount: 6,
};

export interface SensorData {
  history: Snapshot[];
  thresholds: Thresholds;
  demo: boolean;
  running: boolean;
  setRunning: (running: boolean) => void;
  reset: () => void;
}

/**
 * Fuente de datos del dashboard. Hoy solo existe el modo demo (simulador);
 * en la fase 2 se agrega la rama real con Supabase (lecturas, umbrales y
 * Realtime) y el simulador queda detrás de NEXT_PUBLIC_DEMO_MODE=true.
 */
export function useSensorData(): SensorData {
  const thresholds = DEFAULT_THRESHOLDS;
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [running, setRunningState] = useState(true);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setHistory(seedHistory(thresholds, SIMULATION.seedCount, SIMULATION.intervalMs));
    setRunningState(kv.get('settings', { simulationRunning: true }).simulationRunning !== false);
  }, [thresholds]);

  useEffect(() => {
    if (!running) return;
    timer.current = setInterval(() => {
      setHistory((prev) => {
        if (prev.length === 0) return prev;
        const next = [...prev, createNextReading(prev[prev.length - 1])];
        return next.slice(-SIMULATION.maxHistoryPoints);
      });
    }, SIMULATION.intervalMs);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [running]);

  const setRunning = useCallback((value: boolean) => {
    kv.set('settings', { simulationRunning: value });
    setRunningState(value);
  }, []);

  const reset = useCallback(() => {
    setHistory(seedHistory(thresholds, SIMULATION.seedCount, SIMULATION.intervalMs));
  }, [thresholds]);

  return { history, thresholds, demo: DEMO_MODE, running, setRunning, reset };
}
