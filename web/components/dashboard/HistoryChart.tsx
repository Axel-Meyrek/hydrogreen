'use client';

import { useEffect, useRef, useState } from 'react';
import type { SensorDef, Threshold } from '@/lib/data/sensors';
import type { Domain, Point, RangeId } from './chartData';
import { formatValue } from './format';

// Mismos tonos que styles/variables.css (el canvas no lee variables CSS).
const COLORS = {
  line: '#587347', // sage-600
  threshold: '#a5761d', // honey-600
  grid: '#e7eede', // sage-100
  text: '#6c7862', // ink-500
};

const HEIGHT = 220;
const PAD = { top: 12, right: 16, bottom: 26, left: 56 };
const Y_TICKS = 4;


function formatAxisTime(ts: number, range: RangeId) {
  const date = new Date(ts);
  if (range === '7d') {
    return date.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' });
  }
  return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function HistoryChart({
  sensor,
  points,
  threshold,
  domain,
  range,
  rangeMs,
  now,
}: {
  sensor: SensorDef;
  points: Point[];
  threshold: Threshold;
  domain: Domain;
  range: RangeId;
  rangeMs: number;
  now: number;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(0);

  // Ajusta el ancho del canvas al contenedor (celular y escritorio).
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || width === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = HEIGHT * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, HEIGHT);

    const plotW = width - PAD.left - PAD.right;
    const plotH = HEIGHT - PAD.top - PAD.bottom;
    const from = now - rangeMs;
    const x = (ts: number) => PAD.left + ((ts - from) / rangeMs) * plotW;
    const y = (value: number) => PAD.top + (1 - (value - domain.min) / (domain.max - domain.min)) * plotH;

    ctx.font = '11px system-ui, sans-serif';
    ctx.lineWidth = 1;

    // Cuadrícula y etiquetas del eje Y
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= Y_TICKS; i += 1) {
      const value = domain.min + ((domain.max - domain.min) * i) / Y_TICKS;
      const py = y(value);
      ctx.strokeStyle = COLORS.grid;
      ctx.beginPath();
      ctx.moveTo(PAD.left, py);
      ctx.lineTo(width - PAD.right, py);
      ctx.stroke();
      ctx.fillStyle = COLORS.text;
      ctx.fillText(formatValue(value, sensor), PAD.left - 8, py);
    }

    // Etiquetas del eje X (menos en pantallas angostas para que no se encimen)
    const xTicks = plotW < 360 ? 2 : 4;
    ctx.textBaseline = 'top';
    for (let i = 0; i <= xTicks; i += 1) {
      const ts = from + (rangeMs * i) / xTicks;
      ctx.textAlign = i === 0 ? 'left' : i === xTicks ? 'right' : 'center';
      ctx.fillText(formatAxisTime(ts, range), x(ts), HEIGHT - PAD.bottom + 8);
    }

    // Líneas de umbral (mínimo y máximo)
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = COLORS.threshold;
    ctx.fillStyle = COLORS.threshold;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    for (const [label, value] of [['mín', threshold.min], ['máx', threshold.max]] as const) {
      if (value === null) continue;
      const py = y(value);
      ctx.beginPath();
      ctx.moveTo(PAD.left, py);
      ctx.lineTo(width - PAD.right, py);
      ctx.stroke();
      ctx.fillText(`${label} ${formatValue(value, sensor)}`, width - PAD.right - 2, py - 2);
    }
    ctx.setLineDash([]);

    // Serie
    if (points.length === 0) return;
    ctx.strokeStyle = COLORS.line;
    ctx.fillStyle = COLORS.line;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    if (points.length === 1) {
      ctx.beginPath();
      ctx.arc(x(points[0].ts), y(points[0].value), 3, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    ctx.beginPath();
    points.forEach((p, i) => (i === 0 ? ctx.moveTo(x(p.ts), y(p.value)) : ctx.lineTo(x(p.ts), y(p.value))));
    ctx.stroke();
  }, [width, points, threshold, domain, range, rangeMs, now, sensor]);

  const last = points[points.length - 1];
  const label = last
    ? `Gráfica de ${sensor.label}: ${points.length} puntos, último ${formatValue(last.value, sensor)}${sensor.unit}`
    : `Gráfica de ${sensor.label}: sin lecturas en este rango`;

  return (
    <div ref={wrapperRef} className="history-chart">
      <canvas ref={canvasRef} role="img" aria-label={label} style={{ width: '100%', height: HEIGHT }} />
      {points.length === 0 && <p className="history-chart__empty">Sin lecturas en este rango</p>}
    </div>
  );
}
