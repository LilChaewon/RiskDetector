import OpenAI from 'openai';
import { NextRequest } from 'next/server';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type WarnLevel = number;

interface ToxicSlim {
  title?: string;
  clause?: string;
  reason?: string;
  suggestion?: string;
  reasonReference?: string;
  warnLevel?: WarnLevel;
}

interface ChatRequest {
  messages: { role: 'user' | 'assistant'; content: string }[];
  selectedToxic?: ToxicSlim;
  allToxics?: ToxicSlim[];
  contractTitle?: string;
  overallComment?: string;
}

function warnLabel(level?: number) {
  if ((level ?? 0) >= 3) return '주의 필요';
  if ((level ?? 0) === 2) return '확인 권장';
  return '안전';
}

function buildSystemPrompt(req: ChatRequest): string {
  const { selectedToxic, allToxics = [], contractTitle, overallComment } = req;

  const toxicsList = allToxics
    .map((t, i) =>
      `${i + 1}. [${warnLabel(t.warnLevel)}] ${t.title ?? '조항'}\n   원문: ${t.clause ?? '없음'}\n   이유: ${t.reason ?? '없음'}`
    )
    .join('\n');

  const selectedSection = selectedToxic
    ? `
## 현재 사용자가 보고 있는 조항
- 제목: ${selectedToxic.title ?? '없음'}
- 위험도: ${warnLabel(selectedToxic.warnLevel)}
- 원문: ${selectedToxic.clause ?? '없음'}
- 위험 이유: ${selectedToxic.reason ?? '없음'}
- 수정 제안: ${selectedToxic.suggestion ?? '없음'}
- 법적 근거: ${selectedToxic.reasonReference ?? '없음'}`
    : '';

  return `당신은 RiskDetector의 AI 어시스턴트 "아르디"입니다.
계약서의 독소조항을 분석하고 사용자가 법적 위험을 이해하도록 돕습니다.

## 규칙
- 항상 한국어로 답변하세요.
- 친근하고 명확하게, 법률 용어는 쉽게 풀어서 설명하세요.
- 아래 분석 데이터에 없는 내용은 절대 추측하지 마세요.
- 수정안을 제시할 때는 구체적인 문구를 제안하세요.
- 답변은 간결하게, 필요할 때만 상세히 설명하세요.

## 계약서 정보
- 제목: ${contractTitle ?? '업로드된 계약서'}
- 종합 의견: ${overallComment ?? '없음'}

## 발견된 독소조항 전체 목록
${toxicsList || '없음'}
${selectedSection}`;
}

export async function POST(req: NextRequest) {
  const body: ChatRequest = await req.json();

  if (!process.env.OPENAI_API_KEY) {
    return new Response('OPENAI_API_KEY가 설정되지 않았습니다.', { status: 500 });
  }

  const systemPrompt = buildSystemPrompt(body);
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...body.messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ];

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    stream: true,
    max_tokens: 800,
    temperature: 0.4,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) {
            controller.enqueue(encoder.encode(delta));
          }
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
}
