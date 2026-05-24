import OpenAI from 'openai';
import { NextRequest } from 'next/server';

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
  clauseSwitched?: boolean;
}

interface RetrievedItem {
  rank?: number;
  score?: number;
  text?: string;
  sourceLabel?: string;
  basisPhrase?: string;
  location?: string;
}

interface ChatbotRetrieveResponse {
  success?: boolean;
  error?: string;
  results?: RetrievedItem[];
}

const BACKEND_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const RETRIEVE_ENDPOINT = `${BACKEND_URL.replace(/\/$/, '')}/api/chatbot/retrieve`;
const RETRIEVE_TIMEOUT_MS = 4000;
const RETRIEVE_TOP_K = 4;

const EASY_MODE_PATTERN = /(쉽게|쉬운\s*말|쉬운말|풀어서|풀어\s*서|초딩|초등학생|이해\s*안)/;

function isEasyMode(messages: { role: string; content: string }[]): boolean {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  return !!lastUser && EASY_MODE_PATTERN.test(lastUser.content);
}

function hasField(v?: string): boolean {
  return !!v && v.trim().length > 0 && v.trim() !== '없음';
}

function warnLabel(level?: number) {
  if ((level ?? 0) >= 3) return '주의 필요';
  if ((level ?? 0) === 2) return '확인 권장';
  return '안전';
}

const CITATION_REGEX = /(민법|상법|형법|근로기준법|저작권법|주택임대차보호법|상가건물\s*임대차보호법)\s*제\s*\d+\s*조(?:\s*제\s*\d+\s*항)?|\d{4}\s*[다가나허누]\s*\d+/g;

function collectAllowedCitations(req: ChatRequest, retrieved: RetrievedItem[]): string[] {
  const refs = new Set<string>();
  const add = (s?: string) => {
    if (!s) return;
    const matches = s.match(CITATION_REGEX);
    if (matches) matches.forEach((m) => refs.add(m.replace(/\s+/g, ' ').trim()));
  };
  add(req.selectedToxic?.reasonReference);
  add(req.selectedToxic?.reason);
  (req.allToxics ?? []).forEach((t) => {
    add(t.reasonReference);
    add(t.reason);
  });
  retrieved.forEach((item) => {
    add(item.sourceLabel);
    add(item.basisPhrase);
    add(item.text);
  });
  return Array.from(refs);
}

function inferContractType(req: ChatRequest): string {
  const haystack = `${req.contractTitle ?? ''} ${req.overallComment ?? ''} ${
    req.selectedToxic?.clause ?? ''
  } ${(req.allToxics ?? []).map((t) => t.clause ?? '').join(' ')}`;
  if (/(전속계약|매니지먼트|엔터테인먼트|대중문화예술인|연예)/.test(haystack)) return 'entertainment';
  if (/(근로계약|연봉계약|취업규칙|임금|해고|퇴직)/.test(haystack)) return 'labor';
  if (/(임대차|전세|월세|보증금|임대인|임차인)/.test(haystack)) return 'lease';
  return 'unknown';
}

function buildRetrievalQuery(req: ChatRequest, lastUserMessage: string): string {
  const parts: string[] = [];
  if (req.selectedToxic?.clause) parts.push(req.selectedToxic.clause);
  if (req.selectedToxic?.title) parts.push(req.selectedToxic.title);
  if (req.selectedToxic?.reason) parts.push(req.selectedToxic.reason);
  if (lastUserMessage) parts.push(lastUserMessage);
  parts.push('관련 판례 및 법률 조항');
  return parts.join(' ').slice(0, 1400);
}

async function fetchRetrievedContext(
  query: string,
  contractType: string
): Promise<RetrievedItem[]> {
  if (!query.trim()) return [];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RETRIEVE_TIMEOUT_MS);
  try {
    const res = await fetch(RETRIEVE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, contractType, topK: RETRIEVE_TOP_K }),
      signal: controller.signal,
    });
    if (!res.ok) return [];
    const data: ChatbotRetrieveResponse = await res.json();
    if (!data.success || !Array.isArray(data.results)) return [];
    return data.results.filter((r) => r && (r.text ?? '').trim().length > 0);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

function buildRetrievedContextBlock(retrieved: RetrievedItem[]): string {
  if (retrieved.length === 0) return '';
  const lines = retrieved.slice(0, RETRIEVE_TOP_K).map((item, i) => {
    const label = item.sourceLabel?.trim() || `Source ${i + 1}`;
    const text = (item.text ?? '').replace(/\s+/g, ' ').slice(0, 600);
    return `[${label}]\n${text}`;
  });
  return `\n\n## 🔎 Knowledge Base 검색 결과 (이 발췌문을 우선 근거로 사용)\n사용자의 질문과 관련해 법령·판례·생활법령 DB에서 자동 검색한 결과입니다. 답변에 인용하거나 근거로 사용할 때 반드시 이 발췌문에 명시된 내용만 사용하세요. 발췌문에 없는 사실은 추측하지 마세요.\n\n${lines.join('\n\n')}`;
}

function buildSystemPrompt(req: ChatRequest, easyMode: boolean, retrieved: RetrievedItem[]): string {
  const { selectedToxic, allToxics = [], contractTitle, overallComment, clauseSwitched } = req;

  const allowedCitations = collectAllowedCitations(req, retrieved);
  const retrievedBlock = buildRetrievedContextBlock(retrieved);
  const citationBlock =
    allowedCitations.length > 0
      ? `\n\n## 인용 가능한 법령·판례 (이 목록 외 인용 금지)\n${allowedCitations.map((c) => `- ${c}`).join('\n')}`
      : '\n\n## 인용 가능한 법령·판례\n(없음) — 이번 답변에서는 법령 조문 번호나 판례 번호를 일절 인용하지 마세요. 일반론으로만 설명하세요.';

  const toxicsList = allToxics
    .map((t, i) =>
      `${i + 1}. [${warnLabel(t.warnLevel)}] ${t.title ?? '조항'}\n   원문: ${t.clause ?? '없음'}\n   이유: ${t.reason ?? '없음'}`
    )
    .join('\n');

  const selectedSection = selectedToxic
    ? `
## 현재 사용자가 보고 있는 조항 (★ 모든 질문의 기본 대상)
- 제목: ${selectedToxic.title ?? '없음'}
- 위험도: ${warnLabel(selectedToxic.warnLevel)}
- 원문: ${selectedToxic.clause ?? '없음'}
- 위험 이유: ${selectedToxic.reason ?? '없음'}
- 수정 제안: ${hasField(selectedToxic.suggestion) ? selectedToxic.suggestion : '(데이터 없음 — 추측하지 말 것)'}
- 법적 근거: ${hasField(selectedToxic.reasonReference) ? selectedToxic.reasonReference : '(데이터 없음 — 추측하지 말 것)'}`
    : '\n## 현재 선택된 조항 없음 — 사용자에게 좌측에서 조항을 먼저 선택하라고 안내하세요.';

  const switchNotice = clauseSwitched
    ? '\n\n## ⚠️ 조항 전환 알림\n사용자가 방금 다른 조항으로 전환했습니다. 이전 대화 내용은 참고만 하고, **반드시 위의 "현재 사용자가 보고 있는 조항" 정보를 기준으로** 답하세요. 사용자의 짧은 질문("쉽게 설명해줘", "수정안 만들어줘" 등)은 모두 새 조항에 대한 것입니다.'
    : '';

  const easyModeBlock = easyMode
    ? `

## 🟢 쉬운 모드 활성화 (사용자가 "쉽게 설명해줘" 요청)
이번 답변은 **반드시 다음 규칙을 모두 지키세요**:
1. 모든 법률 용어를 일상어로 바꿉니다. (예: "복제권" → "복사해서 쓸 권리", "2차적 저작물 작성권" → "원작을 바꿔서 새 작품 만들 권리")
2. 한 문장은 40자 이내, 전체 답변은 4문장 이내로 유지합니다.
3. 비유 또는 일상 예시를 1개 포함합니다.
4. 판례 번호("2002다65401" 등) 나열 금지. 꼭 필요하면 "옛날 비슷한 판결에서는…" 식으로 풀어서 설명.
5. 마크다운 굵게/번호 목록 사용 금지. 평문으로 자연스럽게.

### 좋은 예시
질문: "이 조항 왜 위험해? 쉽게 설명해줘"
답변: "이 조항은 회사가 손해를 입었다고 주장하면 너무 많은 돈을 물게 만들어요. 마치 카페에서 컵 하나 깼는데 가게 전체를 사라고 하는 셈이죠. 실제 손해보다 훨씬 큰 금액이라 법원에서도 줄여주는 경우가 많아요."

### 나쁜 예시 (피할 것)
"본 조항은 손해배상 예정액의 과다성으로 인해 민법 제398조 제2항에 따른 감액 가능성이 존재하며…"`
    : '';

  return `당신은 RiskDetector의 AI 어시스턴트 "아르디"입니다.
계약서의 독소조항을 분석하고 사용자가 법적 위험을 이해하도록 돕습니다.

## 🔒 절대 규칙
1. **범위 제한**: 다음 두 종류만 답합니다:
   (a) 현재 선택된 조항 또는 분석 데이터에 포함된 다른 조항·전체 계약에 대한 해석/위험 평가/수정 제안
   (b) 분석 데이터의 reasonReference 필드에 명시된 법령·판례 (그 외 외부 판례·법령 검색은 불가)

   **다음은 모두 정중히 거절**하고 정확히 "저는 계약서 위험 분석을 도와드리는 아르디예요. 계약 조항에 대해 궁금한 점을 물어봐 주세요!"라고만 답하세요 (다른 부연 설명 X):
   - 분석 데이터 밖의 외부 판례 검색 ("비슷한 판례 알려줘", "다른 판결은?", "유사 사건 찾아줘", "관련 판례 뭐가 있어?")
   - 일반 법률 상담 (분석된 조항과 무관한 법률 조언)
   - 요리법, 일반 상식, 코딩, 잡담, 다른 사이트 이용법 등 비계약 주제

2. **선택 조항 우선 (히스토리 무시 규칙)**: 사용자의 모든 질문은 아래 "현재 사용자가 보고 있는 조항"에 대한 것입니다. 짧고 지시대명사가 없는 질문("쉽게 설명해줘", "이거 뭐야", "왜 위험해?", "어떻게 바꿔?")은 **이전 대화에서 다룬 조항이 아니라 반드시 현재 선택된 조항을 가리키는 것**으로 해석하세요. 대화 흐름과 "현재 사용자가 보고 있는 조항"이 충돌하면 **항상 현재 조항이 우선**입니다.
3. **환각 금지**: 아래 분석 데이터에 명시되지 않은 사실(법 조문 번호, 판례 번호, 손해배상 배수·금액·기간 등 구체적 수치)을 **절대 만들어내지 마세요**. 데이터가 "(데이터 없음)"이면 "해당 항목은 분석 데이터에 포함되지 않았어요"라고 솔직히 답하세요.
4. **수치 보수성**: 손해배상 상한, 계약 기간, 위약금 배수 등을 답할 때는 입력 데이터에 명시된 값만 사용합니다. 추정·예시·관행 수치 생성 금지.
5. 항상 한국어, 친근한 톤. 답변은 간결하게.

## 계약서 정보
- 제목: ${contractTitle ?? '업로드된 계약서'}
- 종합 의견: ${overallComment ?? '없음'}

## 발견된 독소조항 전체 목록
${toxicsList || '없음'}
${selectedSection}${retrievedBlock}${citationBlock}${switchNotice}${easyModeBlock}`;
}

export async function POST(req: NextRequest) {
  const body: ChatRequest = await req.json();

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response('OPENAI_API_KEY가 설정되지 않았습니다.', { status: 500 });
  }

  const openai = new OpenAI({ apiKey });
  const easyMode = isEasyMode(body.messages);
  const lastUserMessage =
    [...body.messages].reverse().find((m) => m.role === 'user')?.content ?? '';
  const retrievalQuery = buildRetrievalQuery(body, lastUserMessage);
  const contractType = inferContractType(body);
  const retrieved = await fetchRetrievedContext(retrievalQuery, contractType);
  const systemPrompt = buildSystemPrompt(body, easyMode, retrieved);
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...body.messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ];

  // 조항이 방금 바뀐 경우, 마지막 user 메시지에 명시적 마커 prepend
  // (모델만 보는 input-only 변형, 클라이언트 messages state에는 영향 없음)
  if (body.clauseSwitched && body.selectedToxic?.title) {
    const lastIdx = messages.length - 1;
    const last = messages[lastIdx];
    if (last?.role === 'user' && typeof last.content === 'string') {
      last.content = `[참고: 사용자가 방금 "${body.selectedToxic.title}" 조항으로 전환했습니다. 이 질문은 이전 대화 주제가 아니라 위 조항에 대한 것입니다.]\n${last.content}`;
    }
  }

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    stream: true,
    max_tokens: easyMode ? 400 : 800,
    temperature: 0.2,
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
