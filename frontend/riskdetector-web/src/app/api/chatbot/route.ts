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
  contractType?: string;
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

type ChatbotErrorCode =
  | 'CONFIG_MISSING'
  | 'BAD_REQUEST'
  | 'OPENAI_AUTH'
  | 'OPENAI_RATE_LIMIT'
  | 'OPENAI_TIMEOUT'
  | 'OPENAI_UNAVAILABLE'
  | 'STREAM_FAILED'
  | 'UNKNOWN';

const BACKEND_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const RETRIEVE_ENDPOINT = `${BACKEND_URL.replace(/\/$/, '')}/api/chatbot/retrieve`;
const RETRIEVE_TIMEOUT_MS = 4000;
const RETRIEVE_TOP_K = 4;
const OPENAI_MAX_ATTEMPTS = 3;
const SUGGESTION_MARKER = '[RD_SUGGESTION]';
const OUT_OF_SCOPE_MESSAGE =
  '저는 계약서 위험 분석을 도와드리는 아르디예요. 계약 조항에 대해 궁금한 점을 물어봐 주세요!';

const EASY_MODE_PATTERN = /(쉽게|쉬운\s*말|쉬운말|풀어서|풀어\s*서|초딩|초등학생|이해\s*안)/;
const LAW_REF_PATTERN = /(민법|상법|형법|근로기준법|저작권법|주택임대차보호법|상가건물\s*임대차보호법)\s*제\s*(\d+)\s*조(?:\s*제\s*(\d+)\s*항)?/;
const CITATION_REGEX = /(민법|상법|형법|근로기준법|저작권법|주택임대차보호법|상가건물\s*임대차보호법)\s*제\s*\d+\s*조(?:\s*제\s*\d+\s*항)?|\d{4}\s*[다가나허누]\s*\d+/g;

const KNOWN_LAW_CONTEXT: Record<string, string> = {
  '민법 제623조': '임대인은 임차인이 목적물을 사용·수익할 수 있도록 넘겨주고, 계약 기간 동안 필요한 상태를 유지해야 한다는 임대인의 기본 의무 조항입니다.',
  '민법 제398조': '계약에서 손해배상액을 미리 정할 수 있지만, 예정액이 부당하게 과다하면 법원이 감액할 수 있다는 조항입니다.',
  '민법 제103조': '선량한 풍속이나 사회질서에 반하는 법률행위는 무효가 된다는 조항입니다.',
  '민법 제104조': '상대방의 궁박·경솔·무경험을 이용해 현저하게 공정성을 잃은 법률행위는 무효가 될 수 있다는 조항입니다.',
  '근로기준법 제17조': '근로계약을 맺을 때 임금, 소정근로시간, 휴일, 연차 유급휴가 등 중요한 근로조건을 명시하고, 임금 구성·계산·지급방법 등 핵심 조건은 서면으로 교부하도록 하는 조항입니다.',
  '저작권법 제45조': '저작재산권은 전부 또는 일부를 양도할 수 있지만, 권리 범위가 불명확하면 2차적저작물작성권은 양도되지 않은 것으로 추정된다는 조항입니다.',
  '주택임대차보호법 제7조': '차임이나 보증금이 경제 사정 변화 등으로 적절하지 않게 된 경우 당사자가 증감을 청구할 수 있다는 조항입니다.',
};

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

function compactText(value?: string, maxLength = 120): string {
  const text = (value ?? '').replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

function buildDirectEasyAnswer(selectedToxic?: ToxicSlim): string | null {
  if (!selectedToxic) return null;

  const title = compactText(selectedToxic.title, 28) || '이 조항';
  const reason = compactText(selectedToxic.reason, 120);
  const suggestion = compactText(selectedToxic.suggestion, 120);
  const clause = compactText(selectedToxic.clause, 100);

  const lines = [
    `${title}은 계약 한쪽에게 부담이 크게 몰릴 수 있는 조항이에요.`,
    reason
      ? `쉽게 말하면 ${reason}`
      : clause
        ? `쉽게 말하면 "${clause}" 부분 때문에 나중에 불리하게 해석될 수 있어요.`
        : '쉽게 말하면 나중에 불리하게 해석될 수 있는 부분이에요.',
    suggestion
      ? `그래서 ${suggestion}`
      : '그래서 조건과 예외를 더 구체적으로 적는 게 좋아요.',
  ];

  return lines.join('\n');
}

function isOutOfScopeAnswer(answer: string): boolean {
  return answer.trim() === OUT_OF_SCOPE_MESSAGE;
}

function stripOutOfScopeHistory(messages: ChatRequest['messages']): ChatRequest['messages'] {
  return messages.filter((message) => {
    if (message.role !== 'assistant') return true;
    return message.content.trim() !== OUT_OF_SCOPE_MESSAGE;
  });
}

function normalizeLawRef(value: string): string {
  const match = value.match(LAW_REF_PATTERN);
  if (!match) return value.replace(/\s+/g, ' ').trim();
  return `${match[1].replace(/\s+/g, '')} 제${match[2]}조${match[3] ? ` 제${match[3]}항` : ''}`;
}

function splitReasonReference(value?: string) {
  const raw = value ?? '';
  const markerIndex = raw.indexOf(SUGGESTION_MARKER);
  if (markerIndex < 0) {
    return { reference: raw.trim(), suggestion: '' };
  }

  return {
    reference: raw.slice(0, markerIndex).trim(),
    suggestion: raw.slice(markerIndex + SUGGESTION_MARKER.length).trim(),
  };
}

function normalizeToxic(toxic?: ToxicSlim): ToxicSlim | undefined {
  if (!toxic) return undefined;
  const parsed = splitReasonReference(toxic.reasonReference);
  return {
    ...toxic,
    reasonReference: parsed.reference || toxic.reasonReference,
    suggestion: hasField(toxic.suggestion) ? toxic.suggestion : parsed.suggestion || toxic.suggestion,
  };
}

function normalizeRequest(req: ChatRequest): ChatRequest {
  return {
    ...req,
    selectedToxic: normalizeToxic(req.selectedToxic),
    allToxics: (req.allToxics ?? []).map((toxic) => normalizeToxic(toxic) ?? toxic),
  };
}

function extractRequestedLawRef(message: string): string | null {
  const match = message.match(LAW_REF_PATTERN);
  if (!match) return null;
  return normalizeLawRef(match[0]);
}

function collectAllowedCitations(req: ChatRequest, retrieved: RetrievedItem[]): string[] {
  const refs = new Set<string>();
  const add = (s?: string) => {
    if (!s) return;
    const matches = s.match(CITATION_REGEX);
    if (matches) matches.forEach((m) => refs.add(LAW_REF_PATTERN.test(m) ? normalizeLawRef(m) : m.replace(/\s+/g, ' ').trim()));
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

function buildKnownLawContextBlock(citations: string[]): string {
  const lines = citations
    .map((citation) => {
      const context = KNOWN_LAW_CONTEXT[citation];
      return context ? `- ${citation}: ${context}` : null;
    })
    .filter((line): line is string => !!line);

  if (lines.length === 0) return '';

  return `\n\n## 분석 데이터에 포함된 참고 법령 요약\n${lines.join('\n')}`;
}

function inferContractType(req: ChatRequest): string {
  const explicitType = normalizeContractType(req.contractType);
  if (explicitType) return explicitType;

  const haystack = `${req.contractTitle ?? ''} ${req.overallComment ?? ''} ${
    req.selectedToxic?.clause ?? ''
  } ${(req.allToxics ?? []).map((t) => t.clause ?? '').join(' ')}`;
  if (/(전속계약|매니지먼트|엔터테인먼트|대중문화예술인|연예)/.test(haystack)) return 'entertainment';
  if (/(근로계약|연봉계약|취업규칙|임금|해고|퇴직)/.test(haystack)) return 'labor';
  if (/(임대차|전세|월세|보증금|임대인|임차인)/.test(haystack)) return 'lease';
  return 'unknown';
}

function normalizeContractType(raw?: string): string | null {
  const normalized = (raw ?? '').trim().toLowerCase();
  if (!normalized) return null;
  if (['labor', 'employment', 'work'].includes(normalized)) return 'labor';
  if (['lease', 'rental', 'rent'].includes(normalized)) return 'lease';
  if (['entertainment', 'artist', 'management'].includes(normalized)) return 'entertainment';
  return normalized;
}

function buildRetrievalQuery(req: ChatRequest, lastUserMessage: string): string {
  const requestedLawRef = extractRequestedLawRef(lastUserMessage);
  if (requestedLawRef) {
    const knownContext = KNOWN_LAW_CONTEXT[requestedLawRef];
    return [requestedLawRef, knownContext, lastUserMessage].filter(Boolean).join(' ').slice(0, 1400);
  }

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
      body: JSON.stringify({
        query,
        ...(contractType !== 'unknown' ? { contractType } : {}),
        topK: RETRIEVE_TOP_K,
      }),
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

function chatbotErrorResponse(status: number, code: ChatbotErrorCode, message: string, retryable = true) {
  return Response.json({ code, message, retryable }, { status });
}

function classifyOpenAIError(error: unknown): { status: number; code: ChatbotErrorCode; message: string; retryable: boolean } {
  const err = error as { status?: number; code?: string; name?: string; message?: string };
  const status = err.status ?? 500;
  const message = err.message ?? '';

  if (status === 401 || status === 403) {
    return {
      status: 502,
      code: 'OPENAI_AUTH',
      message: 'AI 연결 인증 설정에 문제가 있어요. 서버 환경변수를 확인해야 합니다.',
      retryable: false,
    };
  }
  if (status === 429) {
    return {
      status: 429,
      code: 'OPENAI_RATE_LIMIT',
      message: 'AI 요청이 잠시 몰려 답변이 지연되고 있어요. 조금 뒤 다시 시도해주세요.',
      retryable: true,
    };
  }
  if (status === 408 || err.code === 'ETIMEDOUT' || err.name === 'TimeoutError' || /timeout|timed out/i.test(message)) {
    return {
      status: 504,
      code: 'OPENAI_TIMEOUT',
      message: 'AI 서버 응답이 시간 안에 도착하지 않았어요. 부팅 직후라면 1분 정도 뒤 다시 시도해주세요.',
      retryable: true,
    };
  }
  if (status >= 500) {
    return {
      status: 503,
      code: 'OPENAI_UNAVAILABLE',
      message: 'AI 서버가 잠시 불안정해요. 잠깐 후 다시 물어봐 주세요.',
      retryable: true,
    };
  }

  return {
    status: 500,
    code: 'UNKNOWN',
    message: '아르디 답변 생성 중 알 수 없는 오류가 발생했어요.',
    retryable: true,
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableOpenAIError(error: unknown) {
  const err = error as { status?: number; code?: string; name?: string; message?: string };
  const message = err.message ?? '';
  return (
    err.status === 408 ||
    err.status === 409 ||
    err.status === 429 ||
    (typeof err.status === 'number' && err.status >= 500) ||
    err.code === 'ETIMEDOUT' ||
    err.name === 'TimeoutError' ||
    /timeout|timed out|fetch failed|socket|ECONNRESET/i.test(message)
  );
}

async function createChatCompletionStreamWithRetry(
  openai: OpenAI,
  params: OpenAI.Chat.ChatCompletionCreateParamsStreaming
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= OPENAI_MAX_ATTEMPTS; attempt += 1) {
    try {
      return await openai.chat.completions.create(params);
    } catch (error) {
      lastError = error;
      if (attempt >= OPENAI_MAX_ATTEMPTS || !isRetryableOpenAIError(error)) {
        throw error;
      }
      await sleep(700 * attempt);
    }
  }

  throw lastError;
}

async function createChatCompletionWithRetry(
  openai: OpenAI,
  params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= OPENAI_MAX_ATTEMPTS; attempt += 1) {
    try {
      return await openai.chat.completions.create(params);
    } catch (error) {
      lastError = error;
      if (attempt >= OPENAI_MAX_ATTEMPTS || !isRetryableOpenAIError(error)) {
        throw error;
      }
      await sleep(700 * attempt);
    }
  }

  throw lastError;
}

function buildSystemPrompt(
  req: ChatRequest,
  easyMode: boolean,
  retrieved: RetrievedItem[],
  lastUserMessage: string
): string {
  const { selectedToxic, allToxics = [], contractTitle, overallComment, clauseSwitched } = req;

  const requestedLawRef = extractRequestedLawRef(lastUserMessage);
  const allowedCitations = Array.from(new Set([
    ...collectAllowedCitations(req, retrieved),
    ...(requestedLawRef ? [requestedLawRef] : []),
  ]));
  const retrievedBlock = buildRetrievedContextBlock(retrieved);
  const knownLawBlock = buildKnownLawContextBlock(allowedCitations);
  const citationBlock =
    allowedCitations.length > 0
      ? `\n\n## 인용 가능한 법령·판례 (이 목록 외 인용 금지)\n${allowedCitations.map((c) => `- ${c}`).join('\n')}`
      : '\n\n## 인용 가능한 법령·판례\n(없음) — 이번 답변에서는 법령 조문 번호나 판례 번호를 일절 인용하지 마세요. 일반론으로만 설명하세요.';

  const toxicsList = allToxics
    .map((t, i) =>
      `${i + 1}. [${warnLabel(t.warnLevel)}] ${t.title ?? '조항'}\n   원문: ${t.clause ?? '없음'}\n   이유: ${t.reason ?? '없음'}`
      + `\n   법적 근거: ${hasField(t.reasonReference) ? t.reasonReference : '없음'}`
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
1. **범위 제한**: 다음 셋 중 하나에 해당하는 경우에만 답합니다:
   (a) 현재 선택된 조항 또는 분석 데이터에 포함된 다른 조항·전체 계약에 대한 해석/위험 평가/수정 제안
   (b) 분석 데이터의 reasonReference 필드에 명시된 법령·판례
   (c) **아래 "분석 데이터에 포함된 참고 법령 요약" 또는 "🔎 Knowledge Base 검색 결과" 발췌문에 사용자 질문의 답이 직접 포함되어 있는 경우** — 이때는 명시된 내용만 사용해서 짧게 답하세요. 발췌문 밖의 일반 지식·기억·추측으로 보충하지 마세요. 발췌문이 사용자 질문과 명백히 관련 없거나 비어 있으면 (c)에 해당하지 않습니다.

   **중요**: 현재 선택된 조항이 있고 사용자가 "쉽게 설명", "왜 위험해", "어떻게 바꿔", "이거 뭐야"처럼 짧게 물으면 무조건 (a)에 해당합니다. KB 검색 결과가 비어 있어도 거절하지 말고 현재 선택 조항의 원문·위험 이유·수정 제안만 사용해 답하세요.

   **다음은 모두 정중히 거절**하고 정확히 "${OUT_OF_SCOPE_MESSAGE}"라고만 답하세요 (다른 부연 설명 X):
   - 위 (a)~(c) 어디에도 해당하지 않는 일반 법률·판례 질문 (특히 KB 검색 결과가 비어 있거나 질문과 무관한 경우)
   - 분석 데이터 안에 없고 KB 검색 결과로도 뒷받침되지 않는 외부 판례·법령 검색 ("비슷한 판례 알려줘", "다른 판결은?", "관련 판례 뭐가 있어?")
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
${selectedSection}${knownLawBlock}${retrievedBlock}${citationBlock}${switchNotice}${easyModeBlock}`;
}

export async function POST(req: NextRequest) {
  let body: ChatRequest;
  try {
    body = await req.json();
  } catch {
    return chatbotErrorResponse(400, 'BAD_REQUEST', '질문 형식을 읽지 못했어요. 화면을 새로고침한 뒤 다시 시도해주세요.', false);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return chatbotErrorResponse(500, 'CONFIG_MISSING', 'AI 연결 설정이 아직 준비되지 않았어요. 서버의 OPENAI_API_KEY 설정이 필요합니다.', false);
  }

  const openai = new OpenAI({ apiKey });
  const easyMode = isEasyMode(body.messages);
  const lastUserMessage =
    [...body.messages].reverse().find((m) => m.role === 'user')?.content ?? '';
  const retrievalQuery = buildRetrievalQuery(body, lastUserMessage);
  const requestedLawRef = extractRequestedLawRef(lastUserMessage);
  const contractType = requestedLawRef ? 'unknown' : inferContractType(body);
  const shouldRetrieve = !easyMode || !!requestedLawRef;
  const retrieved = shouldRetrieve
    ? await fetchRetrievedContext(retrievalQuery, contractType)
    : [];
  const systemPrompt = buildSystemPrompt(body, easyMode, retrieved, lastUserMessage);
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...stripOutOfScopeHistory(body.messages).map((m) => ({
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

  if (easyMode && body.selectedToxic) {
    const fallback = buildDirectEasyAnswer(body.selectedToxic);
    try {
      const completion = await createChatCompletionWithRetry(openai, {
        model: 'gpt-4o-mini',
        messages,
        stream: false,
        max_tokens: 400,
        temperature: 0.2,
      });
      const answer = completion.choices[0]?.message?.content?.trim() ?? '';
      return new Response(answer && !isOutOfScopeAnswer(answer) ? answer : fallback, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
      });
    } catch (error) {
      console.error('[chatbot] OpenAI easy-mode request failed:', error);
      if (fallback) {
        return new Response(fallback, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache',
          },
        });
      }
      const classified = classifyOpenAIError(error);
      return chatbotErrorResponse(classified.status, classified.code, classified.message, classified.retryable);
    }
  }

  let stream: AsyncIterable<OpenAI.Chat.ChatCompletionChunk>;
  try {
    stream = await createChatCompletionStreamWithRetry(openai, {
      model: 'gpt-4o-mini',
      messages,
      stream: true,
      max_tokens: easyMode ? 400 : 800,
      temperature: 0.2,
    });
  } catch (error) {
    console.error('[chatbot] OpenAI request failed:', error);
    const classified = classifyOpenAIError(error);
    return chatbotErrorResponse(classified.status, classified.code, classified.message, classified.retryable);
  }

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
        controller.close();
      } catch (error) {
        console.error('[chatbot] OpenAI stream failed:', error);
        controller.error(error);
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
