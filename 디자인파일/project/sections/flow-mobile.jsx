// Chosen mobile flow — 7 screens as picked by user
// A / A / C / B / A / C / A — connected as product flow

function Arrow() {
  return (
    <div className="col center" style={{ alignSelf: 'center', gap: 6, margin: '0 4px' }}>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--ink-3)' }}>TAP</div>
      <div style={{ fontSize: 24, color: 'var(--ink-2)' }}>→</div>
    </div>
  );
}

function FlowMobile() {
  return (
    <section>
      <SectionHeader num="MOBILE" title="모바일 플로우 · 선택된 방향" sub="홈A → 업로드A → 로딩C → 리포트B → 조항A → 피드C → 마이A" />

      <div style={{ overflowX: 'auto', paddingBottom: 20 }}>
        <div className="row gap-2" style={{ alignItems: 'flex-start', minWidth: 'max-content' }}>

          {/* 1. HOME — A */}
          <Phone label="01 · HOME">
            <div className="col gap-3" style={{ paddingBottom: 70 }}>
              <div className="row between" style={{ alignItems: 'center', padding: '4px 2px' }}>
                <div className="fs-18 fw-7">안녕, 지우 👋</div>
                <div className="box-soft" style={{ width: 32, height: 32, borderRadius: 999 }} />
              </div>
              <div className="box p-4 col gap-2" style={{ background: '#1a1a1a', color: '#fff', borderRadius: 20 }}>
                <div className="fs-11 mono" style={{ opacity: 0.6 }}>이번 달 2/3 분석 남음</div>
                <div className="fs-20 fw-7 mt-2" style={{ lineHeight: 1.3 }}>
                  계약서,<br/>불안하게 사인하지<br/>마세요.
                </div>
                <div className="btn mt-3 w-full" style={{ background: '#fff', color: '#1a1a1a', borderColor: '#fff' }}>
                  + 계약서 올리기
                </div>
              </div>
              <div className="col gap-2">
                <div className="fs-13 fw-6">최근 분석</div>
                <div className="box-soft p-3 row between" style={{ alignItems: 'center' }}>
                  <div className="col" style={{ gap: 2 }}>
                    <div className="fs-13 fw-6">원룸 임대차계약서</div>
                    <div className="fs-11 muted">어제 · 독소 3건</div>
                  </div>
                  <RiskTag level="hi" />
                </div>
                <div className="box-soft p-3 row between" style={{ alignItems: 'center' }}>
                  <div className="col" style={{ gap: 2 }}>
                    <div className="fs-13 fw-6">아르바이트 근로계약</div>
                    <div className="fs-11 muted">3일 전 · 독소 1건</div>
                  </div>
                  <RiskTag level="md" />
                </div>
              </div>
              <div className="col gap-2 mt-2">
                <div className="fs-13 fw-6">오늘의 법률 팁</div>
                <div className="box-soft p-3">
                  <div className="fs-12 muted mono">CARD 1/5</div>
                  <div className="fs-14 fw-6 mt-1">보증금 돌려받는 법, 3줄 요약</div>
                </div>
              </div>
            </div>
            <TabBar active="home" />
          </Phone>

          <Arrow />

          {/* 2. UPLOAD — A */}
          <Phone label="02 · UPLOAD">
            <div className="col gap-3">
              <div className="row gap-2" style={{ alignItems: 'center' }}>
                <div className="fs-16">←</div>
                <div className="fs-16 fw-7">계약서 분석</div>
              </div>
              <div className="fs-13 muted mb-2">어떤 방식으로 올릴까요?</div>
              <div className="box p-4 col center gap-2" style={{ minHeight: 130 }}>
                <div style={{ fontSize: 32 }}>📷</div>
                <div className="fs-14 fw-7">사진 촬영</div>
                <div className="fs-11 muted">종이 계약서를 찍어요</div>
              </div>
              <div className="box p-4 col center gap-2" style={{ minHeight: 130, background: 'var(--paper-2)' }}>
                <div style={{ fontSize: 32 }}>📁</div>
                <div className="fs-14 fw-7">파일 업로드</div>
                <div className="fs-11 muted">PDF · JPG · PNG</div>
              </div>
              <div className="box p-4 col center gap-2" style={{ minHeight: 130, opacity: 0.6 }}>
                <div style={{ fontSize: 32 }}>✎</div>
                <div className="fs-14 fw-7">직접 입력</div>
                <div className="fs-11 muted">텍스트 붙여넣기</div>
              </div>
            </div>
          </Phone>

          <Arrow />

          {/* 3. LOADING — C */}
          <Phone label="03 · LOADING">
            <div className="col gap-3" style={{ height: '100%', padding: '20px 0' }}>
              <div className="row gap-2" style={{ alignItems: 'center' }}>
                <div className="box-soft" style={{
                  width: 24, height: 24, borderRadius: 999,
                  border: '1.5px solid var(--ink)', borderTopColor: 'transparent',
                  animation: 'spin 1s linear infinite',
                }} />
                <div className="fs-13 fw-6">분석 중 · 15초 남음</div>
              </div>
              <div className="fs-11 muted mono">TIP 2/5 · 기다리는 동안 읽어보세요</div>
              <div className="box p-4 col gap-3 grow" style={{ justifyContent: 'space-between', background: 'var(--paper-2)' }}>
                <div>
                  <div className="fs-11 mono muted">알고 계셨나요?</div>
                  <div className="fs-18 fw-7 mt-2" style={{ lineHeight: 1.4 }}>
                    원상복구 조항,<br/>세입자 100%는<br/>잘못된 문구예요.
                  </div>
                  <div className="fs-13 sub mt-3" style={{ lineHeight: 1.6 }}>
                    자연적 노화·마모(벽지 변색 등)는 세입자 책임이 아닙니다. 판례도 일관돼요.
                  </div>
                </div>
                <div className="row between">
                  <div className="row gap-1">
                    {[0,1,2,3,4].map(i => (
                      <div key={i} style={{
                        width: 16, height: 3, borderRadius: 2,
                        background: i <= 1 ? 'var(--ink)' : 'var(--line)',
                      }} />
                    ))}
                  </div>
                  <div className="fs-12 muted">다음 →</div>
                </div>
              </div>
              <div style={{ height: 4, background: 'var(--line-2)', borderRadius: 2 }}>
                <div style={{ width: '72%', height: '100%', background: 'var(--ink)', borderRadius: 2 }} />
              </div>
            </div>
          </Phone>

          <Arrow />

          {/* 4. REPORT — B (inline annotated) */}
          <Phone label="04 · REPORT">
            <div className="col gap-3" style={{ paddingBottom: 60 }}>
              <div className="row between">
                <div className="fs-14">←</div>
                <div className="row gap-2">
                  <div className="chip">⚠ 3</div>
                  <div className="chip">✎</div>
                </div>
              </div>
              <div className="fs-11 muted mono">임대차계약서 · 5p</div>

              <div className="box p-3 col gap-3" style={{ fontSize: 12, lineHeight: 1.7, fontFamily: 'serif' }}>
                <div className="fw-7 text-c">주택 임대차 계약서</div>
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
              </div>

              <div className="box p-3 col gap-2" style={{
                background: 'var(--risk-hi-bg)', borderColor: 'var(--risk-hi)', borderRadius: 14,
              }}>
                <div className="row between">
                  <div className="fs-11 mono" style={{ color: 'var(--risk-hi)' }}>탭한 조항 · 제7조</div>
                  <RiskTag level="hi" />
                </div>
                <div className="fs-13 fw-6" style={{ color: 'var(--risk-hi)' }}>
                  자연 마모까지 떠안으면 안 돼요
                </div>
                <div className="fs-12" style={{ lineHeight: 1.5, color: 'var(--risk-hi)' }}>
                  통상적 사용에 따른 손모는 임차인 책임이 아닙니다.
                </div>
                <div className="row gap-2 mt-2">
                  <div className="btn btn-sm btn-ghost grow" style={{ borderColor: 'var(--risk-hi)', color: 'var(--risk-hi)' }}>대안 문구</div>
                  <div className="btn btn-sm grow" style={{ background: 'var(--risk-hi)', borderColor: 'var(--risk-hi)' }}>판례 보기</div>
                </div>
              </div>
            </div>
          </Phone>

          <Arrow />

          {/* 5. CLAUSE DETAIL — A (Before/After) */}
          <Phone label="05 · CLAUSE">
            <div className="col gap-3">
              <div className="row between">
                <div className="fs-14">←</div>
                <div className="fs-12 muted">조항 1/3</div>
                <div className="fs-14">↗</div>
              </div>
              <div className="col gap-1">
                <div className="fs-11 mono muted">제7조 · 원상복구</div>
                <div className="fs-18 fw-7" style={{ lineHeight: 1.3 }}>자연 마모까지 세입자 부담</div>
                <div><RiskTag level="hi" /></div>
              </div>

              <div className="col gap-2">
                <div className="fs-11 mono muted">BEFORE · 계약서 원문</div>
                <div className="box p-3" style={{ background: 'var(--risk-hi-bg)', borderColor: 'var(--risk-hi)', fontSize: 13, lineHeight: 1.5 }}>
                  임차인은 임대차 종료 시 발생한 <b>모든 손상에 대하여 100%의 복구 책임을 부담한다.</b>
                </div>
              </div>

              <div className="col gap-2">
                <div className="row between">
                  <div className="fs-11 mono" style={{ color: 'var(--risk-lo)' }}>AFTER · 추천 문구</div>
                  <div className="fs-11 muted">📋 복사</div>
                </div>
                <div className="box p-3" style={{ background: 'var(--risk-lo-bg)', borderColor: 'var(--risk-lo)', fontSize: 13, lineHeight: 1.5 }}>
                  임차인은 <b>고의·과실로 인한 손상</b>에 한하여 원상복구 책임을 부담한다. <b>자연적 손모는 제외.</b>
                </div>
              </div>

              <div className="box-soft p-3 col gap-2">
                <div className="fs-11 mono muted">왜 이렇게 바꿔야 하나요?</div>
                <div className="fs-12" style={{ lineHeight: 1.5 }}>
                  • 대법원 판례: 통상 손모는 임대료에 포함<br/>
                  • 실제 분쟁의 68%가 이 조항
                </div>
              </div>

              <div className="row gap-2">
                <div className="btn btn-ghost grow">이전</div>
                <div className="btn grow">다음 조항</div>
              </div>
            </div>
          </Phone>

          <Arrow />

          {/* 6. FEED — C (Q&A) */}
          <Phone label="06 · FEED">
            <div className="col gap-3" style={{ paddingBottom: 60 }}>
              <div className="fs-20 fw-7">자주 묻는 질문</div>
              <div className="box-soft p-3 row gap-2" style={{ alignItems: 'center' }}>
                <div className="fs-13 muted">🔍</div>
                <div className="fs-12 muted">"보증금", "퇴사" 등 검색</div>
              </div>
              <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
                <span className="chip">#첫 자취</span>
                <span className="chip">#첫 직장</span>
                <span className="chip">#알바</span>
                <span className="chip">#환불</span>
              </div>
              <div className="col gap-2">
                {[
                  { q: '월세 계약 중간에 나가면 중개수수료 내야 하나요?', cat: '임대차', time: '3분', view: '2.1k' },
                  { q: '근로계약서 없이 일했는데 월급이 안 들어와요', cat: '근로', time: '4분', view: '3.8k' },
                  { q: '온라인으로 산 옷, 환불 안 된대요', cat: '소비자', time: '2분', view: '1.4k' },
                  { q: '알바 중 다쳤는데 치료비 누가 내나요?', cat: '근로', time: '3분', view: '980' },
                ].map((it, i) => (
                  <div key={i} className="box-soft p-3 col gap-1">
                    <div className="row gap-2">
                      <div className="fs-13 fw-7" style={{ color: 'var(--risk-hi)' }}>Q.</div>
                      <div className="fs-13 fw-6" style={{ lineHeight: 1.4 }}>{it.q}</div>
                    </div>
                    <div className="row between mt-1">
                      <div className="fs-11 muted">{it.cat} · {it.time} 읽기</div>
                      <div className="fs-11 muted">👁 {it.view}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <TabBar active="feed" />
          </Phone>

          <Arrow />

          {/* 7. MYPAGE — A */}
          <Phone label="07 · ME">
            <div className="col gap-3" style={{ paddingBottom: 60 }}>
              <div className="fs-20 fw-7">내 정보</div>
              <div className="box p-3 row between" style={{ alignItems: 'center' }}>
                <div className="row gap-3" style={{ alignItems: 'center' }}>
                  <div className="box-soft" style={{ width: 48, height: 48, borderRadius: 999 }} />
                  <div className="col" style={{ gap: 2 }}>
                    <div className="fs-14 fw-7">김지우</div>
                    <div className="fs-11 muted">jiwoo@example.com</div>
                  </div>
                </div>
                <div className="pill">무료</div>
              </div>

              <div className="box p-3 col gap-2" style={{ background: 'var(--paper-2)' }}>
                <div className="row between">
                  <div className="fs-11 mono muted">이번 달 분석</div>
                  <div className="fs-11 muted">1월 21일 리셋</div>
                </div>
                <div className="row between" style={{ alignItems: 'baseline' }}>
                  <div className="fs-24 fw-7">1 <span className="fs-14 muted">/ 3 회</span></div>
                  <div className="fs-13" style={{ color: 'var(--risk-md)' }}>2회 남음</div>
                </div>
                <div style={{ height: 6, background: '#fff', borderRadius: 3 }}>
                  <div style={{ width: '33%', height: '100%', background: 'var(--ink)', borderRadius: 3 }} />
                </div>
                <div className="btn btn-sm mt-1">⚡ 무제한으로 업그레이드</div>
              </div>

              <div className="col gap-2">
                <div className="fs-13 fw-6">분석 이력</div>
                {[
                  { t: '원룸 임대차계약서', d: '2025.01.18', r: 'hi' },
                  { t: '아르바이트 근로계약', d: '2025.01.15', r: 'md' },
                  { t: '프리랜서 용역계약', d: '2025.01.10', r: 'lo' },
                ].map((it, i) => (
                  <div key={i} className="box-soft p-3 row between" style={{ alignItems: 'center' }}>
                    <div className="col" style={{ gap: 2 }}>
                      <div className="fs-13 fw-6">{it.t}</div>
                      <div className="fs-11 muted">{it.d}</div>
                    </div>
                    <RiskTag level={it.r} />
                  </div>
                ))}
              </div>
            </div>
            <TabBar active="me" />
          </Phone>

        </div>
      </div>
    </section>
  );
}

window.FlowMobile = FlowMobile;
