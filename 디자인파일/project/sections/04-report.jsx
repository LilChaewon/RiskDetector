// ───────────────────────────────────────────────
// Section 04 — 분석 결과 리포트 (3 variations) — CORE SCREEN
// ───────────────────────────────────────────────
function SectionReport() {
  return (
    <section>
      <SectionHeader num="04" title="분석 결과 리포트 · 핵심 화면" sub="원문 하이라이트 + 독소조항 리스트 + 조항별 대안 문구" />
      <div className="variation-row">

        {/* A — Summary-first */}
        <Variation tag="A" title="요약 먼저 · 탭 구조" note="첫 화면은 요약 점수. 하단 탭으로 '전체 원문' ↔ '독소조항 리스트' 전환.">
          <Phone label="REPORT · A">
            <div className="col gap-3" style={{ paddingBottom: 60 }}>
              <div className="row between">
                <div className="fs-14">←</div>
                <div className="fs-14 fw-6">원룸 임대차</div>
                <div className="fs-14">⤓</div>
              </div>

              <div className="box p-4 col gap-2" style={{ background: 'var(--risk-hi-bg)', borderColor: 'var(--risk-hi)' }}>
                <div className="row between">
                  <div className="fs-11 mono" style={{ color: 'var(--risk-hi)' }}>OVERALL RISK</div>
                  <RiskTag level="hi" />
                </div>
                <div className="fs-24 fw-7" style={{ color: 'var(--risk-hi)' }}>주의가 필요해요</div>
                <div className="fs-12" style={{ color: 'var(--risk-hi)', lineHeight: 1.5 }}>
                  총 14개 조항 중 <b>3개</b>에서 세입자에게 불리한 부분을 발견했어요.
                </div>
              </div>

              <div className="row gap-2">
                <div className="box p-2 grow col center">
                  <div className="fs-18 fw-7" style={{ color: 'var(--risk-hi)' }}>3</div>
                  <div className="fs-10 muted">높음</div>
                </div>
                <div className="box p-2 grow col center">
                  <div className="fs-18 fw-7" style={{ color: 'var(--risk-md)' }}>2</div>
                  <div className="fs-10 muted">중간</div>
                </div>
                <div className="box p-2 grow col center">
                  <div className="fs-18 fw-7" style={{ color: 'var(--risk-lo)' }}>9</div>
                  <div className="fs-10 muted">안전</div>
                </div>
              </div>

              <div className="row gap-2" style={{ borderBottom: '1.5px solid var(--ink)', marginTop: 4 }}>
                <div className="fs-13 fw-7" style={{ padding: '8px 12px', borderBottom: '2px solid var(--ink)', marginBottom: -1.5 }}>독소조항 5</div>
                <div className="fs-13 muted" style={{ padding: '8px 12px' }}>원문 보기</div>
              </div>

              <div className="col gap-2">
                <div className="box-soft p-3 col gap-2">
                  <div className="row between">
                    <div className="fs-11 mono muted">제7조 · 원상복구</div>
                    <RiskTag level="hi" />
                  </div>
                  <div className="fs-13 fw-6" style={{ lineHeight: 1.4 }}>
                    &ldquo;모든 손상의 <span className="squig">100%를 세입자가</span> 책임진다&rdquo;
                  </div>
                  <div className="fs-11 muted">자연적 마모까지 부담 · 판례와 다름</div>
                </div>
                <div className="box-soft p-3 col gap-2">
                  <div className="row between">
                    <div className="fs-11 mono muted">제12조 · 해지</div>
                    <RiskTag level="hi" />
                  </div>
                  <div className="fs-13 fw-6" style={{ lineHeight: 1.4 }}>
                    &ldquo;임대인은 <span className="squig">사유 없이</span> 해지할 수 있다&rdquo;
                  </div>
                </div>
                <div className="box-soft p-3 col gap-2">
                  <div className="row between">
                    <div className="fs-11 mono muted">제9조 · 보증금</div>
                    <RiskTag level="md" />
                  </div>
                  <div className="fs-13 fw-6" style={{ lineHeight: 1.4 }}>
                    &ldquo;보증금 반환 시기 <span className="squig">협의</span>&rdquo;
                  </div>
                </div>
              </div>
            </div>
          </Phone>
        </Variation>

        {/* B — Inline annotated document */}
        <Variation tag="B" title="원문에 주석 · 문서 보기형" note="계약서 원문을 그대로 보며 하이라이트. 탭하면 아래 시트로 설명. Figma 코멘트 패턴.">
          <Phone label="REPORT · B">
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

              {/* bottom sheet */}
              <div className="box p-3 col gap-2" style={{
                background: 'var(--risk-hi-bg)', borderColor: 'var(--risk-hi)',
                borderRadius: 14,
              }}>
                <div className="row between">
                  <div className="fs-11 mono" style={{ color: 'var(--risk-hi)' }}>탭한 조항 · 제7조</div>
                  <RiskTag level="hi" />
                </div>
                <div className="fs-13 fw-6" style={{ color: 'var(--risk-hi)' }}>
                  자연 마모까지 떠안으면 안 돼요
                </div>
                <div className="fs-12" style={{ lineHeight: 1.5, color: 'var(--risk-hi)' }}>
                  대법원 판례상 통상적 사용에 따른 손모(벽지 변색, 미세 흠집 등)는 임차인 책임이 아닙니다.
                </div>
                <div className="row gap-2 mt-2">
                  <div className="btn btn-sm btn-ghost grow" style={{ borderColor: 'var(--risk-hi)', color: 'var(--risk-hi)' }}>대안 문구</div>
                  <div className="btn btn-sm grow" style={{ background: 'var(--risk-hi)', borderColor: 'var(--risk-hi)' }}>판례 보기</div>
                </div>
              </div>
            </div>
          </Phone>
        </Variation>

        {/* C — Conversational / card stack */}
        <Variation tag="C" title="AI 채팅 리포트" note="AI가 한 건씩 브리핑. 친근하고 쉽게. 한 번에 한 독소조항만 집중.">
          <Phone label="REPORT · C">
            <div className="col gap-3" style={{ paddingBottom: 60 }}>
              <div className="row between">
                <div className="fs-14">←</div>
                <div className="fs-14 fw-6">AI 검토 결과</div>
                <div className="fs-14">⋮</div>
              </div>

              <div className="row gap-2" style={{ alignItems: 'flex-start' }}>
                <div className="box-soft center" style={{ width: 28, height: 28, borderRadius: 999, fontSize: 14, flexShrink: 0 }}>🤖</div>
                <div className="box-soft p-3 col gap-1" style={{ borderRadius: 14, borderBottomLeftRadius: 4 }}>
                  <div className="fs-13" style={{ lineHeight: 1.5 }}>
                    지우님, 이 계약서에서 <b style={{ color: 'var(--risk-hi)' }}>3가지 걱정되는 부분</b>을 발견했어요.
                  </div>
                </div>
              </div>

              <div className="row gap-2" style={{ alignItems: 'flex-start' }}>
                <div className="box-soft center" style={{ width: 28, height: 28, borderRadius: 999, fontSize: 14, flexShrink: 0 }}>🤖</div>
                <div className="box p-3 col gap-2" style={{ borderRadius: 14, borderBottomLeftRadius: 4, background: 'var(--risk-hi-bg)', borderColor: 'var(--risk-hi)' }}>
                  <div className="row between">
                    <div className="fs-11 mono" style={{ color: 'var(--risk-hi)' }}>1/3 · 제7조</div>
                    <RiskTag level="hi" />
                  </div>
                  <div className="fs-14 fw-7">원상복구를 100% 지게 되어있어요</div>
                  <div className="fs-12" style={{ lineHeight: 1.5 }}>
                    "모든 손상의 100% 책임"은 <b>벽지 변색 같은 자연스러운 마모까지 내 돈으로</b> 해야 한다는 뜻이에요. 판례는 이걸 인정 안 해요.
                  </div>
                  <div className="box-soft p-2" style={{ background: '#fff', borderRadius: 8 }}>
                    <div className="fs-10 mono muted mb-2">이렇게 바꿔달라고 해보세요</div>
                    <div className="fs-12" style={{ lineHeight: 1.5 }}>
                      "임차인은 통상적 사용 이외의 <b>고의·과실로 인한 손상</b>에 대해 원상복구 책임을 진다."
                    </div>
                  </div>
                </div>
              </div>

              <div className="row gap-2" style={{ alignSelf: 'flex-end' }}>
                <div className="pill">다음 독소조항 →</div>
                <div className="pill">이 문장 복사</div>
              </div>

              <div className="row gap-2" style={{ alignSelf: 'flex-end' }}>
                <div className="pill">판례가 궁금해</div>
              </div>
            </div>
          </Phone>
        </Variation>

      </div>
    </section>
  );
}

window.SectionReport = SectionReport;
