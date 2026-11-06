import { rulesRecommendation } from './rules';
import type { AiInput, Recommendation } from './types';

const API_URL = 'https://api.anthropic.com/v1/messages';
export const CLAUDE_TIMEOUT_MS = 20_000;
export const DEFAULT_MODEL = 'claude-sonnet-5-5';

const SYSTEM_PROMPT = `Eres un asistente agrónomo para un cultivo hidropónico NFT de lechuga.
Recibes estadísticas de la última ventana de lecturas (temperatura del aire, humedad, luz en lux),
los umbrales configurados, el estado de bomba y ventilador, y lecturas atípicas detectadas.
Solo puedes recomendar acciones sobre la bomba, el ventilador, la luz o la revisión de sensores.
Responde ÚNICAMENTE con un objeto JSON, sin texto adicional, con estas claves de tipo string:
"summary" (1-2 frases con el estado), "recommendation" (acción concreta), "explanation" (por qué).
Escribe en español, claro y breve.`;

export function buildUserMessage(input: AiInput): string {
  return JSON.stringify(
    {
      ventana: {
        inicio: new Date(input.windowStart).toISOString(),
        fin: new Date(input.windowEnd).toISOString(),
      },
      estadisticas: input.stats,
      umbrales: input.thresholds,
      actuadores: { bomba: input.pump, ventilador: input.fan },
      anomalias: input.anomalies.map((a) => ({
        variable: a.measurement_type,
        ts: new Date(a.ts).toISOString(),
        valor: a.value,
        puntaje: Number(a.score.toFixed(2)),
        metodos: a.methods,
      })),
    },
    null,
    2,
  );
}

export interface LlmFields {
  summary: string;
  recommendation: string;
  explanation: string;
}

/** Extrae y valida el JSON de la respuesta; devuelve null si no cumple. */
export function parseLlmJson(text: string): LlmFields | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  let data: unknown;
  try {
    data = JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
  if (typeof data !== 'object' || data === null) return null;
  const { summary, recommendation, explanation } = data as Record<string, unknown>;
  for (const field of [summary, recommendation, explanation]) {
    if (typeof field !== 'string' || field.trim() === '') return null;
  }
  return {
    summary: (summary as string).trim(),
    recommendation: (recommendation as string).trim(),
    explanation: (explanation as string).trim(),
  };
}

export interface ClaudeOptions {
  apiKey: string;
  model?: string;
  timeoutMs?: number;
  /** Inyectable para pruebas. */
  fetchImpl?: typeof fetch;
}

/** Llama a Claude; lanza si hay timeout, error HTTP o JSON inválido. */
export async function callClaude(input: AiInput, opts: ClaudeOptions): Promise<Recommendation> {
  const model = opts.model ?? DEFAULT_MODEL;
  const doFetch = opts.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? CLAUDE_TIMEOUT_MS);
  try {
    const res = await doFetch(API_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': opts.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildUserMessage(input) }],
      }),
    });
    if (!res.ok) throw new Error(`Claude API respondió ${res.status}`);
    const body = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = (body.content ?? [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text ?? '')
      .join('');
    const fields = parseLlmJson(text);
    if (!fields) throw new Error('Respuesta de Claude sin el JSON esperado');
    return { ...fields, source: 'llm', model };
  } finally {
    clearTimeout(timer);
  }
}

/** Intenta Claude y, ante cualquier fallo, cae al respaldo por reglas. */
export async function generateRecommendation(
  input: AiInput,
  opts: Partial<ClaudeOptions> = {},
): Promise<Recommendation> {
  if (!opts.apiKey) return rulesRecommendation(input);
  try {
    return await callClaude(input, opts as ClaudeOptions);
  } catch {
    return rulesRecommendation(input);
  }
}
