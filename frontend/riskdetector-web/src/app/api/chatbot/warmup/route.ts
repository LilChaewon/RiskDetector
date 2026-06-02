import OpenAI from 'openai';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:54321/functions/v1/rd-api';
const RETRIEVE_ENDPOINT = `${API_BASE.replace(/\/$/, '')}/chatbot/retrieve`;
const WARMUP_TIMEOUT_MS = 3500;

async function withTimeout<T>(task: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout>;
  try {
    return await Promise.race([
      task,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error('WarmupTimeout')), timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timeout!);
  }
}

async function warmRetrieve() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WARMUP_TIMEOUT_MS);
  try {
    const res = await fetch(RETRIEVE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '계약서 위험 조항', contractType: 'unknown', topK: 1 }),
      signal: controller.signal,
    });
    return { ok: res.ok, status: res.status };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.name : 'UNKNOWN' };
  } finally {
    clearTimeout(timeout);
  }
}

async function warmOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { ok: false, error: 'CONFIG_MISSING' };

  try {
    const openai = new OpenAI({ apiKey });
    await withTimeout(
      openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Warm up. Reply with ok.' },
          { role: 'user', content: 'ping' },
        ],
        max_tokens: 2,
        temperature: 0,
      }),
      WARMUP_TIMEOUT_MS
    );
    return { ok: true };
  } catch (error) {
    const err = error as { status?: number; name?: string };
    return { ok: false, status: err.status, error: err.name || 'OPENAI_WARMUP_FAILED' };
  }
}

export async function GET() {
  const [retrieve, openai] = await Promise.allSettled([warmRetrieve(), warmOpenAI()]);

  return Response.json(
    {
      ok: true,
      retrieve: retrieve.status === 'fulfilled' ? retrieve.value : { ok: false, error: 'RETRIEVE_WARMUP_FAILED' },
      openai: openai.status === 'fulfilled' ? openai.value : { ok: false, error: 'OPENAI_WARMUP_FAILED' },
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
