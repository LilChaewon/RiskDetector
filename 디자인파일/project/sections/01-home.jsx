// ───────────────────────────────────────────────
// Section 01 — 홈 / 대시보드 (3 variations)
// ───────────────────────────────────────────────
function SectionHome() {
  return (
    <section>
      <SectionHeader num="01" title="홈 · 업로드 CTA 중심" sub="사회 초년생이 첫 진입에서 무엇을 해야 할지 3초 안에 알게" />
      <div className="variation-row">

        {/* A — Hero CTA */}
        <Variation tag="A" title="Big CTA · 미니멀" note="토스 스타일. 업로드 버튼 하나에 모든 걸 집중. 아래 최근 이력 짧게.">
          <Phone label="HOME · A">
            <div className="col gap-3" style={{ paddingBottom: 70 }}>
              <div className="row between" style={{ alignItems: 'center', padding: '4px 2px' }}>
                <div className="fs-18 fw-7">안녕, 지우 👋</div>
                <div className="box-soft" style={{ width: 32, height: 32, borderRadius: 999 }} />
              </div>
              <div className="box p-4" style={{ background: '#1a1a1a', color: '#fff', borderRadius: 20 }}>
                <div className="fs-11 mono" style={{ opacity: 0.6 }}>이번 달 2/3 분석 남음</div>
                <div className="fs-20 fw-7 mt-2" style={{ lineHeight: 1.3 }}>
                  계약서,<br/>불안하게 사인하지<br/>마세요.
                </div>
                <div className="btn btn-ghost mt-3 w-full" style={{ background: '#fff', color: '#1a1a1a' }}>
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
        </Variation>

        {/* B — Dashboard style */}
        <Variation tag="B" title="대시보드 · 통계형" note="내 이력이 많을수록 풍성해지는 대시보드. 게이미피케이션 요소.">
          <Phone label="HOME · B">
            <div className="col gap-3" style={{ paddingBottom: 70 }}>
              <div className="fs-20 fw-7">나의 계약 기록</div>
              <div className="row gap-2">
                <div className="box p-3 grow col" style={{ gap: 2 }}>
                  <div className="fs-11 muted mono">TOTAL</div>
                  <div className="fs-24 fw-7">12</div>
                  <div className="fs-11 muted">건 분석 완료</div>
                </div>
                <div className="box p-3 grow col" style={{ gap: 2, background: 'var(--risk-hi-bg)', borderColor: 'var(--risk-hi)' }}>
                  <div className="fs-11 mono" style={{ color: 'var(--risk-hi)' }}>RISK</div>
                  <div className="fs-24 fw-7" style={{ color: 'var(--risk-hi)' }}>7</div>
                  <div className="fs-11" style={{ color: 'var(--risk-hi)' }}>개 독소조항</div>
                </div>
              </div>
              <div className="box-dash p-4 text-c">
                <div style={{ fontSize: 28 }}>＋</div>
                <div className="fs-14 fw-6 mt-1">새 계약서 분석</div>
                <div className="fs-11 muted mt-1">PDF · 이미지 · 촬영</div>
              </div>
              <div className="col gap-2">
                <div className="row between">
                  <div className="fs-13 fw-6">카테고리별</div>
                  <div className="fs-11 muted">전체 &gt;</div>
                </div>
                <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
                  <span className="chip">🏠 임대차 · 5</span>
                  <span className="chip">💼 근로 · 4</span>
                  <span className="chip">🤝 용역 · 2</span>
                  <span className="chip">📦 기타 · 1</span>
                </div>
              </div>
              <div className="box-soft p-3 col" style={{ gap: 6 }}>
                <div className="fs-11 muted mono">TODAY'S TIP</div>
                <div className="fs-13 fw-6">근로계약서 없이 일하면 벌어지는 일</div>
                <div className="fs-11 muted">2분 읽기 · 새 카드뉴스</div>
              </div>
            </div>
            <TabBar active="home" />
          </Phone>
        </Variation>

        {/* C — Content-forward */}
        <Variation tag="C" title="콘텐츠 피드형" note="당근마켓 홈 느낌. 상단 진입 배너 + 법률 팁 피드가 주가 됨. 사용 빈도 낮은 앱 재방문 유도.">
          <Phone label="HOME · C">
            <div className="col gap-3" style={{ paddingBottom: 70 }}>
              <div className="row between">
                <div className="fs-18 fw-7">RD</div>
                <div className="row gap-2">
                  <div className="box-soft" style={{ width: 28, height: 28, borderRadius: 8 }} />
                  <div className="box-soft" style={{ width: 28, height: 28, borderRadius: 8 }} />
                </div>
              </div>
              <div className="box p-3 row gap-3" style={{ alignItems: 'center', background: 'var(--paper-2)' }}>
                <div className="box-soft center" style={{ width: 44, height: 44, borderRadius: 12, background: '#fff' }}>📄</div>
                <div className="col grow" style={{ gap: 2 }}>
                  <div className="fs-13 fw-6">계약서 분석하기</div>
                  <div className="fs-11 muted">독소조항을 AI가 찾아드려요</div>
                </div>
                <div className="fs-14 fw-7">＞</div>
              </div>
              <div className="row gap-2" style={{ overflowX: 'auto' }}>
                {['전체', '임대차', '근로', '용역', 'FAQ'].map((t, i) => (
                  <span key={i} className="pill" style={i === 0 ? { background: '#1a1a1a', color: '#fff', borderColor: '#1a1a1a' } : {}}>{t}</span>
                ))}
              </div>
              <div className="col gap-3">
                <div className="box-soft p-3 col gap-2">
                  <Ph h={110} text="thumbnail" />
                  <div className="fs-13 fw-6">전세 계약에서 절대 빠지면 안 되는 특약 5가지</div>
                  <div className="fs-11 muted">카드뉴스 · 6장 · 2분</div>
                </div>
                <div className="box-soft p-3 col gap-2">
                  <div className="row between">
                    <span className="pill">Q&A</span>
                    <span className="fs-11 muted">답변 12</span>
                  </div>
                  <div className="fs-13 fw-6">월세 보증금 못 돌려받을 땐?</div>
                  <div className="fs-11 muted" style={{ lineHeight: 1.5 }}>내용증명 → 지급명령 → 소액재판 순으로...</div>
                </div>
              </div>
            </div>
            <TabBar active="home" />
          </Phone>
        </Variation>

      </div>
    </section>
  );
}

window.SectionHome = SectionHome;
