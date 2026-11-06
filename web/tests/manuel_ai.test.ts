import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_THRESHOLDS } from '@/lib/data/sensors';
import { computeStats, mean, slopePerHour, std } from '@/lib/ai/stats';
import { detectAnomaliesForVariable } from '@/lib/ai/anomalies';
import { rulesRecommendation } from '@/lib/ai/rules';
import { callClaude, generateRecommendation, parseLlmJson } from '@/lib/ai/claude';
import type { AiInput, Point } from '@/lib/ai/types';

const HOUR = 3_600_000;
const flat = (n: number, v: number): Point[] =>
  Array.from({ length: n }, (_, i) => ({ ts: i * 60_000, value: v + (i % 2 ? 0.1 : -0.1) }));

function input(overrides: Partial<AiInput> = {}): AiInput {
  return {
    windowStart: 0,
    windowEnd: HOUR,
    stats: {},
    anomalies: [],
    thresholds: DEFAULT_THRESHOLDS,
    pump: 'off',
    fan: 'off',
    ...overrides,
  };
}

const statsWith = (type: 'air_temperature' | 'humidity' | 'light', last: number) => ({
  [type]: { count: 10, mean: last, std: 0.1, min: last, max: last, last, slopePerHour: 0 },
});

describe('stats', () => {
  it('calcula media y desviación', () => {
    expect(mean([1, 2, 3])).toBe(2);
    expect(std([2, 4, 4, 4, 5, 5, 7, 9])).toBe(2);
  });

  it('pendiente por hora', () => {
    const pts = [0, 1, 2].map((h) => ({ ts: h * HOUR, value: 20 + h * 2 }));
    expect(slopePerHour(pts)).toBeCloseTo(2);
  });

  it('computeStats vacío → null, y toma el último por tiempo', () => {
    expect(computeStats([])).toBeNull();
    const s = computeStats([
      { ts: 2, value: 30 },
      { ts: 1, value: 10 },
    ]);
    expect(s?.last).toBe(30);
    expect(s?.min).toBe(10);
  });
});

describe('anomalías', () => {
  it('detecta un pico aislado', () => {
    const pts = flat(30, 24);
    pts[20] = { ts: pts[20].ts, value: 35 };
    const found = detectAnomaliesForVariable('air_temperature', pts);
    expect(found.map((a) => a.value)).toContain(35);
    expect(found.find((a) => a.value === 35)?.methods).toContain('zscore');
  });

  it('serie estable no genera anomalías', () => {
    expect(detectAnomaliesForVariable('humidity', flat(30, 65))).toEqual([]);
  });

  it('serie constante (σ=0) no falla', () => {
    const pts = Array.from({ length: 20 }, (_, i) => ({ ts: i, value: 5 }));
    expect(detectAnomaliesForVariable('light', pts)).toEqual([]);
  });

  it('con pocos puntos no reporta', () => {
    expect(detectAnomaliesForVariable('light', flat(3, 100))).toEqual([]);
  });
});

describe('respaldo por reglas', () => {
  it('todo en rango', () => {
    const r = rulesRecommendation(input({ stats: statsWith('air_temperature', 22) }));
    expect(r.source).toBe('rules');
    expect(r.model).toBeNull();
    expect(r.recommendation).toMatch(/Sin cambios/);
  });

  it('temperatura alta sugiere ventilador', () => {
    const r = rulesRecommendation(input({ stats: statsWith('air_temperature', 30) }));
    expect(r.summary).toMatch(/alto/);
    expect(r.recommendation).toMatch(/ventilador/i);
  });

  it('luz baja', () => {
    const r = rulesRecommendation(input({ stats: statsWith('light', 50) }));
    expect(r.summary).toMatch(/bajo/);
  });

  it('sin datos', () => {
    expect(rulesRecommendation(input()).summary).toMatch(/Sin lecturas/);
  });
});

describe('cliente de Claude', () => {
  const good = { summary: 'Todo bien.', recommendation: 'Nada.', explanation: 'En rango.' };
  const okFetch = (text: string) =>
    vi.fn(async () =>
      new Response(JSON.stringify({ content: [{ type: 'text', text }] }), { status: 200 }),
    ) as unknown as typeof fetch;

  it('parseLlmJson acepta JSON con texto alrededor', () => {
    expect(parseLlmJson('Claro:\n```json\n' + JSON.stringify(good) + '\n```')).toEqual(good);
  });

  it('parseLlmJson rechaza campos faltantes o vacíos', () => {
    expect(parseLlmJson('{"summary":"a","recommendation":"b"}')).toBeNull();
    expect(parseLlmJson('{"summary":"a","recommendation":"b","explanation":" "}')).toBeNull();
    expect(parseLlmJson('sin json')).toBeNull();
  });

  it('callClaude devuelve source llm y manda cabeceras correctas', async () => {
    const f = okFetch(JSON.stringify(good));
    const r = await callClaude(input(), { apiKey: 'k', fetchImpl: f });
    expect(r).toMatchObject({ ...good, source: 'llm', model: 'claude-sonnet-5-5' });
    const init = (f as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>)['x-api-key']).toBe('k');
  });

  it('cae a reglas si el JSON es inválido', async () => {
    const r = await generateRecommendation(input(), { apiKey: 'k', fetchImpl: okFetch('hola') });
    expect(r.source).toBe('rules');
  });

  it('cae a reglas si la API responde error', async () => {
    const f = vi.fn(async () => new Response('x', { status: 500 })) as unknown as typeof fetch;
    const r = await generateRecommendation(input(), { apiKey: 'k', fetchImpl: f });
    expect(r.source).toBe('rules');
  });

  it('cae a reglas por timeout', async () => {
    const f = vi.fn(
      (_url: unknown, init?: RequestInit) =>
        new Promise((_res, rej) => {
          init?.signal?.addEventListener('abort', () => rej(new Error('abort')));
        }),
    ) as unknown as typeof fetch;
    const r = await generateRecommendation(input(), { apiKey: 'k', fetchImpl: f, timeoutMs: 20 });
    expect(r.source).toBe('rules');
  });

  it('sin API key usa reglas sin llamar a la red', async () => {
    const f = vi.fn() as unknown as typeof fetch;
    const r = await generateRecommendation(input(), { fetchImpl: f });
    expect(r.source).toBe('rules');
    expect(f).not.toHaveBeenCalled();
  });
});
