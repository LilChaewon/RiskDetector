'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { X, Send, Mic, Pin, BookOpen, ChevronRight, Sparkles } from 'lucide-react';
import RiskTag from './RiskTag';

type Toxic = {
  title?: string;
  clause?: string;
  reason?: string;
  suggestion?: string;
  reasonReference?: string;
  warnLevel?: number;
};

type ArdiVariant =
  | 'friendly' | 'searching' | 'alert' | 'thumbsup'
  | 'happy' | 'analyzing' | 'waving' | 'hero';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  variant?: ArdiVariant;
  streaming?: boolean;
}

interface AnalysisData {
  title?: string;
  toxics: Toxic[];
  overallComment?: string;
}

interface ArdiChatbotProps {
  selectedToxic?: Toxic;
  warningCount?: number;
  analysisData?: AnalysisData;
}

const SUGGESTED_QUESTIONS = [
  { q: '이 조항 무효인가요?', sub: '법적 효력부터 확인해드려요' },
  { q: '수정안 만들어줘', sub: '집주인에게 보낼 새 문구' },
  { q: '비슷한 판례 알려줘', sub: '관련 대법원 판결 모음' },
];

function variantFromQuestion(q: string): ArdiVariant {
  const lower = q.toLowerCase();
  if (lower.includes('무효') || lower.includes('위험')) return 'alert';
  if (lower.includes('수정') || lower.includes('바꿔') || lower.includes('만들어')) return 'thumbsup';
  if (lower.includes('판례') || lower.includes('찾아') || lower.includes('법원')) return 'searching';
  return 'friendly';
}

function toxicKey(t?: Toxic): string {
  if (!t) return '';
  return `${t.title ?? ''}::${(t.clause ?? '').slice(0, 30)}`;
}

export default function ArdiChatbot({ selectedToxic, warningCount = 0, analysisData }: ArdiChatbotProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastSentToxicKeyRef = useRef<string>('');

  // SSR 이후 클라이언트에서만 portal 마운트
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 챗 닫을 때 진행 중인 스트림 중단
  function handleClose() {
    abortRef.current?.abort();
    setOpen(false);
  }

  async function sendMessage(text: string) {
    if (!text.trim() || streaming) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    const aiId = (Date.now() + 1).toString();
    const variant = variantFromQuestion(text);

    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: aiId, role: 'assistant', content: '', variant, streaming: true },
    ]);
    setInput('');
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const currentKey = toxicKey(selectedToxic);
      const clauseSwitched =
        !!selectedToxic &&
        lastSentToxicKeyRef.current !== '' &&
        lastSentToxicKeyRef.current !== currentKey;

      const history = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: text },
      ];

      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          messages: history,
          selectedToxic,
          allToxics: analysisData?.toxics ?? [],
          contractTitle: analysisData?.title,
          overallComment: analysisData?.overallComment,
          clauseSwitched,
        }),
      });

      lastSentToxicKeyRef.current = currentKey;

      if (!res.ok || !res.body) {
        throw new Error(`API error ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiId ? { ...m, content: accumulated, streaming: true } : m
          )
        );
      }

      setMessages((prev) =>
        prev.map((m) => (m.id === aiId ? { ...m, content: accumulated, streaming: false } : m))
      );
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiId
            ? { ...m, content: '잠시 후 다시 시도해주세요.', streaming: false }
            : m
        )
      );
    } finally {
      setStreaming(false);
    }
  }

  const hasMessages = messages.length > 0;

  // SSR에서는 렌더링하지 않음 (portal은 document.body 필요)
  if (!mounted) return null;

  const fab = !open && (
    <div style={{
      position: 'fixed', right: 16, bottom: `calc(24px + env(safe-area-inset-bottom))`, zIndex: 9999,
      display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
    }}>
      <div style={{ position: 'relative', marginRight: 6, marginBottom: -10, zIndex: 1 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/ardi/ardi-waving.png" alt="아르디" width={48} height={48} style={{ objectFit: 'contain', display: 'block' }} />
        {warningCount > 0 && (
          <div style={{
            position: 'absolute', top: 2, right: -2,
            width: 16, height: 16, borderRadius: 999,
            background: '#d93a3a', color: '#fff',
            fontSize: 10, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 0 2px #fff',
          }}>{warningCount}</div>
        )}
      </div>
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: '10px 16px 10px 14px', borderRadius: 999,
          background: '#0d1524', color: '#fff',
          border: 'none', fontSize: 12.5, fontWeight: 700,
          letterSpacing: '-0.01em', whiteSpace: 'nowrap', cursor: 'pointer',
          boxShadow: '0 8px 20px rgba(13,21,36,0.32), 0 1px 2px rgba(0,0,0,0.12)',
          fontFamily: 'inherit',
        }}
      >
        아르디에게 물어보기
      </button>
    </div>
  );

  const overlay = open && (
    <div className="ardi-overlay" style={{ zIndex: 9999 }}>
      {/* Header */}
      <div className="ardi-header">
        <div className="ardi-header-row">
          <button className="ardi-icon-btn" onClick={handleClose} aria-label="닫기">
            <X size={18} />
          </button>
          <div className="ardi-header-name">
            <div className="ardi-avatar-sm">
              <Image src="/ardi/ardi-friendly.png" alt="아르디" width={36} height={36} style={{ objectFit: 'contain' }} unoptimized />
            </div>
            <span>아르디</span>
            <span className="ardi-online" />
          </div>
          <div style={{ width: 34 }} />
        </div>

        {selectedToxic && (
          <div className="ardi-pinned">
            <Pin size={11} className="ardi-pin-icon" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="ardi-pinned-label">{selectedToxic.title ?? '선택된 조항'}</div>
              {selectedToxic.clause && (
                <div className="ardi-pinned-clause">
                  &ldquo;{selectedToxic.clause.slice(0, 45)}{selectedToxic.clause.length > 45 ? '…' : ''}&rdquo;
                </div>
              )}
            </div>
            <RiskTag level={selectedToxic.warnLevel} />
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="ardi-messages">
        {!hasMessages ? (
          <EmptyState pinnedToxic={selectedToxic} onSelect={sendMessage} />
        ) : (
          <>
            {messages.map((msg) =>
              msg.role === 'user' ? (
                <div key={msg.id} className="ardi-me">
                  <div className="ardi-me-bubble">{msg.content}</div>
                </div>
              ) : (
                <div key={msg.id} className="ardi-ai">
                  <div className="ardi-avatar-sm">
                    <Image
                      src={`/ardi/ardi-${msg.variant ?? 'friendly'}.png`}
                      alt="아르디"
                      width={36}
                      height={36}
                      style={{ objectFit: 'contain' }}
                      unoptimized
                    />
                  </div>
                  {msg.streaming && !msg.content ? (
                    <div className="ardi-ai-bubble ardi-typing">
                      <span /><span /><span />
                    </div>
                  ) : (
                    <div className="ardi-ai-bubble">
                      <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
                      {!msg.streaming && (() => {
                        const cite = extractCitation(msg.content, selectedToxic?.reasonReference);
                        return cite ? (
                          <div className="ardi-citation">
                            <BookOpen size={11} className="ardi-citation-icon" />
                            <div style={{ flex: 1 }}>
                              <div className="ardi-citation-title">{cite.title}</div>
                              {cite.sub && <div className="ardi-citation-sub">{cite.sub}</div>}
                            </div>
                            <ChevronRight size={10} className="ardi-citation-icon" />
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>
              )
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Composer */}
      <div className="ardi-composer-wrap">
        {hasMessages && (
          <div className="ardi-chips">
            {['복사하기', '집주인에게 메시지', '비슷한 판례'].map((chip) => (
              <button key={chip} className="ardi-chip" onClick={() => sendMessage(chip)} disabled={streaming}>
                <Sparkles size={10} style={{ color: 'var(--rd-blue)' }} />
                {chip}
              </button>
            ))}
          </div>
        )}
        <div className="ardi-composer">
          <input
            className="ardi-composer-input"
            placeholder="아르디에게 물어보세요"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
            }}
            disabled={streaming}
          />
          <Mic size={15} style={{ color: 'var(--rd-ink-3)' }} />
          <button
            className="ardi-send"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || streaming}
            aria-label="전송"
          >
            <Send size={13} color="#fff" />
          </button>
        </div>
      </div>
    </div>
  );

  // createPortal로 document.body에 직접 마운트 → 부모 stacking context 완전 우회
  return createPortal(
    <>
      {fab}
      {overlay}
    </>,
    document.body
  );
}

function EmptyState({ pinnedToxic, onSelect }: { pinnedToxic?: Toxic; onSelect: (q: string) => void }) {
  const greeting = pinnedToxic
    ? `${pinnedToxic.title ?? '선택된 조항'} 같이 살펴볼까요?`
    : '무엇이든 물어보세요!';
  return (
    <div className="ardi-empty">
      <div className="ardi-empty-hero">
        <Image src="/ardi/ardi-hero.png" alt="아르디" width={160} height={160} style={{ objectFit: 'contain' }} unoptimized />
      </div>
      <p className="ardi-empty-title">안녕하세요!<br />{greeting}</p>
      <p className="ardi-empty-sub">
        {pinnedToxic
          ? '이 조항이 왜 위험한지, 어떻게 바꿔야 할지 — 무엇이든 편하게 물어보세요.'
          : '궁금한 점을 편하게 물어보세요.'}
      </p>
      <div className="ardi-suggestions">
        {SUGGESTED_QUESTIONS.map(({ q, sub }) => (
          <button key={q} className="ardi-suggestion" onClick={() => onSelect(q)}>
            <Sparkles size={13} style={{ color: 'var(--rd-blue)', flexShrink: 0 }} />
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div className="ardi-suggestion-q">{q}</div>
              <div className="ardi-suggestion-sub">{sub}</div>
            </div>
            <ChevronRight size={11} style={{ color: 'var(--rd-ink-3)' }} />
          </button>
        ))}
      </div>
    </div>
  );
}

const LAW_TITLE_MAP: Record<string, string> = {
  '민법 제623조': '임대인의 의무',
  '민법 제398조': '손해배상액의 예정',
  '민법 제103조': '반사회질서의 법률행위',
  '민법 제104조': '불공정한 법률행위',
  '근로기준법 제17조': '근로조건의 명시',
  '저작권법 제45조': '저작재산권의 양도',
  '주택임대차보호법 제7조': '차임 등의 증감청구권',
};

function extractCitation(text: string, fallbackRef?: string): { title: string; sub?: string } | null {
  // 1) 응답 본문에서 법령 조문 패턴 추출
  const lawMatch = text.match(/(민법|상법|형법|근로기준법|저작권법|주택임대차보호법|상가건물\s*임대차보호법)\s*제\s*(\d+)\s*조(?:\s*제\s*(\d+)\s*항)?/);
  if (lawMatch) {
    const title = `${lawMatch[1].replace(/\s+/g, '')} 제${lawMatch[2]}조${lawMatch[3] ? ` 제${lawMatch[3]}항` : ''}`;
    return { title, sub: LAW_TITLE_MAP[title.replace(/\s제\d+항$/, '')] };
  }
  // 2) 본문에 없으면 선택 조항의 reasonReference 사용
  if (fallbackRef) {
    const refMatch = fallbackRef.match(/(민법|상법|형법|근로기준법|저작권법|주택임대차보호법|상가건물\s*임대차보호법)\s*제\s*(\d+)\s*조(?:\s*제\s*(\d+)\s*항)?/);
    if (refMatch) {
      const title = `${refMatch[1].replace(/\s+/g, '')} 제${refMatch[2]}조${refMatch[3] ? ` 제${refMatch[3]}항` : ''}`;
      return { title, sub: LAW_TITLE_MAP[title.replace(/\s제\d+항$/, '')] };
    }
  }
  return null;
}
