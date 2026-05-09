// ───────────────────────────────────────────────
// Section 05 — 조항 상세 · 대안 문구 (3 variations)
// ───────────────────────────────────────────────
function SectionClauseDetail() {
  return (
    <section>
      <SectionHeader num="05" title="조항 상세 · 대안 문구" sub="사용자가 '그래서 뭐라고 말해야 해?'를 바로 얻음" />
      <div className="variation-row">

        {/* A — Before / After */}
        <Variation tag="A" title="Before → After 비교" note="가장 직관적. 원문 vs. 추천 문구를 나란히. 복사 버튼.">
          <Phone label="DETAIL · A">
            <div className="col gap-3">
              <div className="row between">
                <div className="fs-14">←</div>
                <div className="fs-12 muted">조항 1/3</div>
                <div className="fs-14">↗</div>
              </div>
              <div className="col gap-1">
                <div className="fs-11 mono muted">제7조 · 원상복구</div>
                <div className="fs-20 fw-7" style={{ lineHeight: 1.3 }}>자연 마모까지 세입자가 부담해요</div>
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
                  임차인은 임대차 종료 시 <b>고의·과실로 인한 손상</b>에 한하여 원상복구 책임을 부담한다. <b>통상적 사용에 따른 자연적 손모는 제외한다.</b>
                </div>
              </div>

              <div className="box-soft p-3 col gap-2">
                <div className="fs-11 mono muted">왜 이렇게 바꿔야 하나요?</div>
                <div className="fs-12" style={{ lineHeight: 1.5 }}>
                  • 대법원 2008다00000: 통상 손모는 임대료에 포함<br/>
                  • 주임법상 임차인 보호 취지<br/>
                  • 실제 분쟁의 68%가 이 조항에서 발생
                </div>
              </div>

              <div className="row gap-2">
                <div className="btn btn-ghost grow">이전</div>
                <div className="btn grow">다음 조항</div>
              </div>
            </div>
          </Phone>
        </Variation>

        {/* B — Conversation-guide */}
        <Variation tag="B" title="협상 대화 스크립트" note="임대인에게 어떻게 말할지 실제 멘트를 제공. 사회 초년생의 '말 꺼내기 어려움' 해결.">
          <Phone label="DETAIL · B">
            <div className="col gap-3">
              <div className="row between">
                <div className="fs-14">←</div>
                <div className="fs-14 fw-6">임대인에게 이렇게</div>
              </div>
              <div className="col gap-1">
                <div className="fs-11 mono muted">제12조 · 해지</div>
                <div className="fs-18 fw-7">집주인이 일방적으로 내보낼 수 있어요</div>
                <div><RiskTag level="hi" /></div>
              </div>

              <div className="box-soft p-3 col gap-3" style={{ background: 'var(--paper-2)' }}>
                <div>
                  <div className="fs-11 mono muted mb-2">STEP 1 · 말 꺼내기</div>
                  <div className="box p-3" style={{ background: '#fff', fontSize: 13, lineHeight: 1.6 }}>
                    "선생님, 제12조 해지 조항 보니까 사유 없이도 30일 안에 나가야 한다고 되어 있던데요, 이 부분 조금 걱정돼서요."
                  </div>
                </div>
                <div>
                  <div className="fs-11 mono muted mb-2">STEP 2 · 근거 대기</div>
                  <div className="box p-3" style={{ background: '#fff', fontSize: 13, lineHeight: 1.6 }}>
                    "주택임대차보호법상 임차인은 2년 거주가 보장되는데, 이 조항이 그걸 무력화할 수 있다고 해서요."
                  </div>
                </div>
                <div>
                  <div className="fs-11 mono muted mb-2">STEP 3 · 제안</div>
                  <div className="box p-3" style={{ background: '#fff', fontSize: 13, lineHeight: 1.6 }}>
                    "법에서 정한 해지 사유로만 제한해주실 수 있을까요? 문구는 제가 가져왔어요."
                  </div>
                </div>
              </div>

              <div className="btn">📋 3단계 모두 복사</div>
              <div className="row gap-2">
                <div className="pill">💬 말투 부드럽게</div>
                <div className="pill">💬 더 단호하게</div>
              </div>
            </div>
          </Phone>
        </Variation>

        {/* C — Evidence-heavy */}
        <Variation tag="C" title="판례 · 근거 중심" note="법적 자신감이 필요한 사용자용. 판례 ID, 관련 법조항, 실 사례까지.">
          <Phone label="DETAIL · C">
            <div className="col gap-3">
              <div className="row between">
                <div className="fs-14">←</div>
                <div className="fs-14 fw-6">근거 살펴보기</div>
                <div className="fs-14">⭐</div>
              </div>

              <div className="col gap-1">
                <div className="fs-11 mono muted">제9조 · 보증금 반환</div>
                <div className="fs-18 fw-7" style={{ lineHeight: 1.3 }}>"협의한 시기"는 위험한 표현</div>
                <div><RiskTag level="md" /></div>
              </div>

              <div className="box-soft p-3 col gap-2">
                <div className="fs-11 mono muted">📖 관련 법</div>
                <div className="fs-13 fw-6">주택임대차보호법 제3조의2</div>
                <div className="fs-12 muted" style={{ lineHeight: 1.5 }}>임대차 종료 후 보증금 반환 의무는 임대인에게 있으며 지연이자가 발생할 수 있음</div>
              </div>

              <div className="box-soft p-3 col gap-2">
                <div className="fs-11 mono muted">⚖ 관련 판례 2건</div>
                <div className="col gap-2">
                  <div className="row between" style={{ padding: '6px 0', borderBottom: '1px solid var(--line-2)' }}>
                    <div className="col" style={{ gap: 2 }}>
                      <div className="fs-12 fw-6">대법원 2019다00000</div>
                      <div className="fs-11 muted">보증금 반환 지연 · 지연이자 인정</div>
                    </div>
                    <div className="fs-14">›</div>
                  </div>
                  <div className="row between" style={{ padding: '6px 0' }}>
                    <div className="col" style={{ gap: 2 }}>
                      <div className="fs-12 fw-6">서울중앙 2021가단0000</div>
                      <div className="fs-11 muted">"협의" 문구 무효 판단</div>
                    </div>
                    <div className="fs-14">›</div>
                  </div>
                </div>
              </div>

              <div className="box-soft p-3 col gap-2">
                <div className="fs-11 mono muted">🗣 비슷한 분쟁 사례</div>
                <div className="fs-12" style={{ lineHeight: 1.5 }}>
                  "저도 같은 문구 때문에 4개월 묶였어요. 내용증명 한 번에 풀렸습니다."
                </div>
                <div className="fs-11 muted">— 커뮤니티 · 조회 1,204</div>
              </div>

              <div className="btn">이 근거로 수정 요청하기</div>
            </div>
          </Phone>
        </Variation>

      </div>
    </section>
  );
}

window.SectionClauseDetail = SectionClauseDetail;
