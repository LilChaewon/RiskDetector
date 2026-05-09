// Web version — extends the chosen mobile flow to desktop
// Keeps same visual vocab; left nav + main column + contextual right pane

function WebShell({ active = 'home', children, user = 'free' }) {
  const nav = [
    { id: 'home', t: '홈' },
    { id: 'upload', t: '분석하기' },
    { id: 'docs', t: '내 문서' },
    { id: 'feed', t: '법률 팁' },
    { id: 'me', t: '내 정보' },
  ];
  return (
    <div className="browser" style={{ width: 1160 }}>
      <div className="chrome">
        <div className="dot" /><div className="dot" /><div className="dot" />
        <div className="url mono">rd.app</div>
        <div className="fs-11 muted">👤 지우</div>
      </div>
      <div className="row" style={{ minHeight: 620 }}>
        {/* sidebar */}
        <div style={{ width: 220, borderRight: '1.5px solid var(--ink)', padding: 18, background: '#fff' }}>
          <div className="fs-18 fw-7 mb-4" style={{ letterSpacing: '-0.01em' }}>RD</div>
          <div className="col gap-1">
            {nav.map((n, i) => (
              <div key={i} className="row gap-2 p-2" style={{
                alignItems: 'center', borderRadius: 10, cursor: 'pointer',
                background: n.id === active ? 'var(--ink)' : 'transparent',
                color: n.id === active ? '#fff' : 'var(--ink)',
              }}>
                <div className="box-soft" style={{
                  width: 14, height: 14, borderRadius: 4,
                  borderColor: n.id === active ? '#fff' : 'var(--ink)',
                  background: n.id === active ? 'transparent' : 'transparent',
                }} />
                <div className="fs-13 fw-6">{n.t}</div>
              </div>
            ))}
          </div>
          {user === 'free' ? (
            <div className="box p-3 mt-4 col gap-2" style={{ background: '#1a1a1a', color: '#fff', borderColor: '#1a1a1a' }}>
              <div className="fs-10 mono" style={{ opacity: 0.6 }}>이번 달 잔여</div>
              <div className="fs-20 fw-7">2 / 3 회</div>
              <div className="btn btn-sm w-full" style={{ background: '#fff', color: '#1a1a1a', borderColor: '#fff' }}>⚡ PRO</div>
            </div>
          ) : (
            <div className="box-soft p-3 mt-4 col gap-1">
              <div className="fs-10 mono muted">PRO 연간</div>
              <div className="fs-18 fw-7">∞ 무제한</div>
            </div>
          )}
          <div className="fs-10 muted mt-3 mono">v1.0 · 베타</div>
        </div>

        {/* main */}
        <div style={{ flex: 1, overflow: 'hidden' }}>{children}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// WEB · HOME (expands Home A)
// ─────────────────────────────────────────────
function WebHome() {
  return (
    <WebShell active="home">
      <div style={{ padding: 32 }}>
        <div className="row between">
          <div>
            <div className="fs-11 mono muted">안녕, 지우 👋</div>
            <div className="fs-28 fw-7 mt-1" style={{ lineHeight: 1.2 }}>계약서, 불안하게 사인하지 마세요.</div>
          </div>
          <div className="row gap-2">
            <div className="pill">🔔</div>
            <div className="box-soft" style={{ width: 36, height: 36, borderRadius: 999 }} />
          </div>
        </div>

        {/* Big CTA — full width, matches mobile hero */}
        <div className="box p-5 col gap-3 mt-4" style={{ background: '#1a1a1a', color: '#fff', borderRadius: 22 }}>
          <div className="fs-11 mono" style={{ opacity: 0.6 }}>이번 달 2/3 분석 남음</div>
          <div className="fs-24 fw-7" style={{ lineHeight: 1.3 }}>
            PDF · 이미지 · 사진을 여기로 끌어다 놓기만 하면
          </div>
          <div className="row gap-2 mt-2">
            <div className="btn" style={{ background: '#fff', color: '#1a1a1a', borderColor: '#fff' }}>+ 파일 업로드</div>
            <div className="btn btn-ghost" style={{ background: 'transparent', color: '#fff', borderColor: 'rgba(255,255,255,0.4)' }}>텍스트 붙여넣기</div>
          </div>
        </div>

        <div className="row between mt-4 mb-3">
          <div className="fs-16 fw-7">최근 분석</div>
          <div className="fs-12 muted">전체 문서 ›</div>
        </div>
        <div className="row gap-3">
          {[
            { t: '원룸 임대차계약서', d: '어제', r: 'hi', n: 3, cat: '임대차' },
            { t: '아르바이트 근로계약', d: '3일 전', r: 'md', n: 1, cat: '근로' },
            { t: '프리랜서 용역계약', d: '1주 전', r: 'lo', n: 0, cat: '용역' },
          ].map((it, i) => (
            <div key={i} className="box-soft p-3 col gap-2 grow" style={{ cursor: 'pointer' }}>
              <div className="row between">
                <span className="pill">{it.cat}</span>
                <RiskTag level={it.r} />
              </div>
              <div className="fs-14 fw-7">{it.t}</div>
              <div className="row between">
                <div className="fs-11 muted">{it.d}</div>
                <div className="fs-11 muted">독소 {it.n}건</div>
              </div>
            </div>
          ))}
        </div>

        {/* Today's tip — matches mobile home A */}
        <div className="row between mt-4 mb-3">
          <div className="fs-16 fw-7">오늘의 법률 팁</div>
          <div className="fs-12 muted">전체 팁 ›</div>
        </div>
        <div className="box-soft p-4 row gap-4" style={{ alignItems: 'center' }}>
          <div className="col gap-1 grow">
            <div className="fs-11 mono muted">CARD 1/5</div>
            <div className="fs-16 fw-7" style={{ lineHeight: 1.4 }}>근로계약서 없이 일하면 벌어지는 일</div>
            <div className="fs-12 muted">2분 · 알바·첫 직장 필수</div>
          </div>
          <div className="btn btn-sm btn-ghost">읽어보기 →</div>
        </div>
      </div>
    </WebShell>
  );
}

// ─────────────────────────────────────────────
// WEB · UPLOAD (expands Upload A — 3 tiles become row + drop zone)
// ─────────────────────────────────────────────
function WebUpload() {
  return (
    <WebShell active="upload">
      <div style={{ padding: 32 }}>
        <div className="fs-11 mono muted">새 분석</div>
        <div className="fs-24 fw-7 mt-1">어떤 방식으로 올릴까요?</div>
        <div className="fs-13 muted mt-1">한 번에 여러 페이지도 괜찮아요. 한국어 계약서 · PDF 40MB까지.</div>

        {/* Primary: drag zone */}
        <div className="box-dash mt-4 center col" style={{ minHeight: 260, background: 'var(--paper-2)', borderRadius: 18 }}>
          <div style={{ fontSize: 48, color: 'var(--ink-3)' }}>⬆</div>
          <div className="fs-18 fw-7 mt-2">파일을 여기에 놓기</div>
          <div className="fs-12 muted mt-1">PDF · JPG · PNG · HEIC</div>
          <div className="btn btn-sm mt-3">파일 선택</div>
        </div>

        {/* Secondary: 3 tiles matching mobile A pattern */}
        <div className="row gap-3 mt-4">
          <div className="box p-4 col center gap-2 grow" style={{ minHeight: 130 }}>
            <div style={{ fontSize: 30 }}>📷</div>
            <div className="fs-14 fw-7">QR로 폰에서 촬영</div>
            <div className="fs-11 muted">폰 카메라로 이어 찍기</div>
          </div>
          <div className="box p-4 col center gap-2 grow" style={{ minHeight: 130, background: 'var(--paper-2)' }}>
            <div style={{ fontSize: 30 }}>✎</div>
            <div className="fs-14 fw-7">텍스트 붙여넣기</div>
            <div className="fs-11 muted">메일이나 채팅에서 복사</div>
          </div>
          <div className="box p-4 col center gap-2 grow" style={{ minHeight: 130 }}>
            <div style={{ fontSize: 30 }}>☁</div>
            <div className="fs-14 fw-7">클라우드에서 가져오기</div>
            <div className="fs-11 muted">Drive · Dropbox</div>
          </div>
        </div>
      </div>
    </WebShell>
  );
}

// ─────────────────────────────────────────────
// WEB · REPORT (Report B + Clause A combined into 2-column)
// ─────────────────────────────────────────────
function WebReport() {
  return (
    <WebShell active="docs">
      <div className="row" style={{ height: 620 }}>
        {/* Document column — mobile "B" view full-size */}
        <div style={{ flex: 1.4, padding: 28, borderRight: '1.5px solid var(--ink)', overflow: 'auto', minWidth: 0 }}>
          <div className="row between mb-3">
            <div>
              <div className="fs-11 mono muted">2025.01.18 · 5p · PDF</div>
              <div className="fs-20 fw-7 mt-1">원룸 임대차계약서.pdf</div>
            </div>
            <div className="row gap-2">
              <div className="btn btn-sm btn-ghost">PDF 저장</div>
              <div className="btn btn-sm">공유</div>
            </div>
          </div>

          <div className="row gap-2 mb-3">
            <RiskTag level="hi" /> <span className="fs-12 muted">2건</span>
            <RiskTag level="md" /> <span className="fs-12 muted">1건</span>
            <RiskTag level="lo" /> <span className="fs-12 muted">11건 안전</span>
          </div>

          <div className="box p-5 col gap-4" style={{ fontFamily: 'serif', fontSize: 14, lineHeight: 1.9 }}>
            <div className="fw-7 text-c fs-18">주택 임대차 계약서</div>
            <div>
              <b>제1조 (목적)</b><br/>
              본 계약은 서울특별시 종로구 소재 원룸에 관한 임대차를 정함을 목적으로 한다.
            </div>
            <div>
              <b>제2조 (임대차 기간)</b><br/>
              임대차 기간은 2025년 2월 1일부터 2027년 1월 31일까지 2년으로 한다.
            </div>
            <div>
              <b>제7조 (원상복구)</b><br/>
              임차인은 임대차 종료 시 <span className="hl-hi">발생한 모든 손상에 대하여 100%의 복구 책임을 부담한다</span>. 단, 계약서 작성 시점의 상태를 기준으로 한다.
            </div>
            <div>
              <b>제9조 (보증금)</b><br/>
              보증금은 임대차 종료 후 <span className="hl-md">임대인과 임차인이 협의한 시기에</span> 반환한다.
            </div>
            <div>
              <b>제12조 (계약의 해지)</b><br/>
              <span className="hl-hi">임대인은 사유 없이 30일 전 통지로 계약을 해지할 수 있다.</span>
            </div>
            <div>
              <b>제14조 (기타)</b><br/>
              본 계약에 정하지 아니한 사항은 민법의 규정에 따른다.
            </div>
          </div>
        </div>

        {/* Right panel — acts as mobile bottom sheet + clause detail */}
        <div style={{ width: 380, background: 'var(--paper)', overflow: 'auto', padding: 24, flexShrink: 0 }}>
          <div className="fs-11 mono muted">탭한 조항</div>
          <div className="fs-16 fw-7 mt-1">제7조 · 원상복구</div>
          <div className="mt-2"><RiskTag level="hi" /></div>

          <div className="fs-18 fw-7 mt-3" style={{ lineHeight: 1.3 }}>
            자연 마모까지 떠안으면 안 돼요
          </div>
          <div className="fs-13 sub mt-2" style={{ lineHeight: 1.6 }}>
            통상적 사용에 따른 손모(벽지 변색·미세 흠집 등)는 임차인 책임이 아닙니다. 대법원 판례가 일관돼요.
          </div>

          <div className="col gap-2 mt-4">
            <div className="fs-11 mono" style={{ color: 'var(--risk-hi)' }}>BEFORE · 계약서 원문</div>
            <div className="box p-3" style={{ background: 'var(--risk-hi-bg)', borderColor: 'var(--risk-hi)', fontSize: 13, lineHeight: 1.5 }}>
              임차인은 임대차 종료 시 발생한 <b>모든 손상에 대하여 100%의 복구 책임을 부담한다.</b>
            </div>
          </div>

          <div className="col gap-2 mt-3">
            <div className="row between">
              <div className="fs-11 mono" style={{ color: 'var(--risk-lo)' }}>AFTER · 추천 문구</div>
              <div className="fs-11 muted">📋 복사</div>
            </div>
            <div className="box p-3" style={{ background: 'var(--risk-lo-bg)', borderColor: 'var(--risk-lo)', fontSize: 13, lineHeight: 1.5 }}>
              임차인은 <b>고의·과실로 인한 손상</b>에 한하여 원상복구 책임을 부담한다. <b>자연적 손모는 제외한다.</b>
            </div>
          </div>

          <div className="box-soft p-3 col gap-2 mt-3">
            <div className="fs-11 mono muted">근거</div>
            <div className="fs-12" style={{ lineHeight: 1.6 }}>
              • 대법원 2008다xxxxx: 통상 손모는 임대료에 포함<br/>
              • 주임법상 임차인 보호 취지<br/>
              • 실제 분쟁의 68%가 이 조항에서 발생
            </div>
          </div>

          <div className="row gap-2 mt-3">
            <div className="btn btn-ghost btn-sm grow">← 이전 조항</div>
            <div className="btn btn-sm grow">다음 조항 →</div>
          </div>
          <div className="fs-11 muted text-c mt-2 mono">독소 1 / 3</div>
        </div>
      </div>
    </WebShell>
  );
}

// ─────────────────────────────────────────────
// WEB · FEED (Q&A) — expands mobile C into 2-column
// ─────────────────────────────────────────────
function WebFeed() {
  return (
    <WebShell active="feed">
      <div className="row" style={{ minHeight: 620 }}>
        <div style={{ flex: 1, padding: 32, overflow: 'auto' }}>
          <div className="fs-24 fw-7">자주 묻는 질문</div>
          <div className="fs-13 muted mt-1">사회 초년생이 가장 많이 헷갈리는 것만 모았어요.</div>

          <div className="box-soft p-3 row gap-2 mt-3" style={{ alignItems: 'center' }}>
            <div className="fs-14 muted">🔍</div>
            <div className="fs-13 muted">"보증금 반환", "퇴사 통보" 등 검색</div>
          </div>

          <div className="row gap-2 mt-3" style={{ flexWrap: 'wrap' }}>
            {['전체','#첫 자취','#첫 직장','#알바','#환불','#프리랜서','#온라인'].map((t, i) => (
              <span key={i} className="pill" style={i === 0 ? { background: '#1a1a1a', color: '#fff', borderColor: '#1a1a1a' } : {}}>{t}</span>
            ))}
          </div>

          <div className="col gap-3 mt-4">
            {[
              { q: '월세 계약 중간에 나가면 중개수수료 내야 하나요?', a: '원칙적으로 세입자 부담이지만, 집주인 사정이면 면제될 수 있어요...', cat: '임대차', time: '3분', view: '2.1k' },
              { q: '근로계약서 없이 일했는데 월급이 안 들어와요', a: '근로계약서 미작성은 사업주의 과태료 대상이고, 임금체불은 노동청 진정으로...', cat: '근로', time: '4분', view: '3.8k' },
              { q: '온라인으로 산 옷, 입어보지도 않았는데 환불 안 된대요', a: '전자상거래법상 7일 이내 청약철회가 원칙. 다만 태그 제거·훼손은 예외...', cat: '소비자', time: '2분', view: '1.4k' },
              { q: '알바 중 다쳤는데 치료비 누가 내나요?', a: '업무 중 부상은 산재 적용. 4일 이상 요양 필요 시 근로복지공단에 신청...', cat: '근로', time: '3분', view: '980' },
              { q: '전세 재계약 시 5% 이상 올리자는 집주인, 거절할 수 있나요?', a: '계약갱신요구권을 행사한 경우 증액 상한은 5%. 그 이상은 거절 가능...', cat: '임대차', time: '5분', view: '5.2k' },
            ].map((it, i) => (
              <div key={i} className="box-soft p-4 col gap-2" style={{ cursor: 'pointer' }}>
                <div className="row gap-2">
                  <div className="fs-14 fw-7" style={{ color: 'var(--risk-hi)' }}>Q.</div>
                  <div className="fs-15 fw-6 grow" style={{ lineHeight: 1.4 }}>{it.q}</div>
                </div>
                <div className="row gap-2">
                  <div className="fs-12 muted">A.</div>
                  <div className="fs-12 muted grow" style={{ lineHeight: 1.6 }}>{it.a}</div>
                </div>
                <div className="row between mt-1">
                  <div className="row gap-2">
                    <span className="pill">{it.cat}</span>
                    <span className="fs-11 muted">{it.time} 읽기</span>
                  </div>
                  <div className="fs-11 muted">👁 {it.view}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: trending / newsletter */}
        <div style={{ width: 300, borderLeft: '1.5px solid var(--line)', padding: 24, background: 'var(--paper)' }}>
          <div className="fs-13 fw-7">이번 주 많이 본 글</div>
          <div className="col gap-2 mt-2">
            {[
              '전세 계약서에서 꼭 확인할 5가지',
              '퇴사 통보는 얼마 전에?',
              '보증금 못 받을 때 프로세스',
            ].map((t, i) => (
              <div key={i} className="box-soft p-3 col gap-1">
                <div className="fs-11 mono muted">#{i+1}</div>
                <div className="fs-12 fw-6" style={{ lineHeight: 1.4 }}>{t}</div>
              </div>
            ))}
          </div>
          <div className="box p-4 col gap-2 mt-4" style={{ background: 'var(--paper-2)' }}>
            <div className="fs-11 mono muted">주간 뉴스레터</div>
            <div className="fs-13 fw-6" style={{ lineHeight: 1.4 }}>이번 주 판례 요약을 메일로 받아보세요</div>
            <div className="box-soft p-2 fs-11 muted mono mt-1">jiwoo@example.com</div>
            <div className="btn btn-sm mt-1">구독</div>
          </div>
        </div>
      </div>
    </WebShell>
  );
}

function SectionWebFlow() {
  return (
    <section>
      <SectionHeader num="WEB" title="웹 버전 · 동일 플로우 확장" sub="모바일 선택안을 데스크톱 2~3컬럼으로 재배치. 좌: 네비 / 중: 본문 / 우: 컨텍스트 패널" />
      <div className="col gap-6">
        <Variation tag="W1" title="홈 — 좌우 분할 히어로" note="모바일 홈A의 검은 CTA를 가로로. 오른쪽은 통계+팁 스택.">
          <WebHome />
        </Variation>
        <Variation tag="W2" title="업로드 — 드롭존 우선 + 보조 타일" note="데스크톱 관행대로 드래그앤드롭이 주. 아래에 모바일 A의 3타일 패턴을 유지.">
          <WebUpload />
        </Variation>
        <Variation tag="W3" title="리포트 — 2컬럼 (문서 ↔ 컨텍스트 패널)" note="모바일 리포트B의 인라인 주석 + 바텀시트를 좌우로 펼침. 조항 클릭 → 우측에 Before/After 그대로.">
          <WebReport />
        </Variation>
        <Variation tag="W4" title="법률 Q&A — 답변 프리뷰 확장" note="모바일 C의 카드 형식을 유지하되 답변 첫 문단까지 미리보기. 우측에 트렌딩 + 뉴스레터.">
          <WebFeed />
        </Variation>
      </div>
    </section>
  );
}

window.SectionWebFlow = SectionWebFlow;
