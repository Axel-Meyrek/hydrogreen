'use client';

import { useEffect, useRef } from 'react';
import type { Status } from '@/lib/data/status';

const STATUS_COLORS: Record<Status, string> = {
  optimal: '#2f9e44',
  warning: '#e8a33d',
  critical: '#d64545',
};

export function Sparkline({
  values,
  min,
  max,
  status,
}: {
  values: number[];
  min: number;
  max: number;
  status: Status | undefined;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    if (values.length < 2) return;

    const range = max - min || 1;
    const stepX = width / (values.length - 1);
    const points = values.map((value, index) => {
      const normalized = (value - min) / range;
      return [index * stepX, height - 4 - normalized * (height - 8)] as const;
    });

    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    points.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));
    ctx.strokeStyle = (status && STATUS_COLORS[status]) ?? '#3f7d20';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();

    const [lastX, lastY] = points[points.length - 1];
    ctx.beginPath();
    ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
  }, [values, min, max, status]);

  return <canvas ref={ref} className="card__sparkline" width={240} height={56} />;
}
