// ───────────────────────────────────────────────
// Section 06 — 법률 상식 피드 (3 variations)
// ───────────────────────────────────────────────
function SectionFeed() {
  return (
    <section>
      <SectionHeader num="06" title="법률 상식 피드" sub="카드뉴스 피드 + Q&A — 비분석 시기에도 재방문 유도" />
      <div className="variation-row">

        {/* A — Instagram-y card feed */}
        <Variation tag="A" title="카드뉴스 피드" note="세로 스크롤. 썸네일 + 제목 + 소요시간. 탭별 필터링.">
          <Phone label="FEED · A">
            <div className="col gap-3" style={{ paddingBottom: 60 }}>
              <div className="fs-20 fw-7">알면 든든한 법률</div>
              <div className="row gap-2" style={{ overflowX: 'auto' }}>
                {['전체', '임대차', '근로', '계약', '소비자', 'Q&A'].map((t, i) => (
                  <span key={i} className="pill" style={i === 0 ? { background: '#1a1a1a', color: '#fff', borderColor: '#1a1a1a' } : {}}>{t}</span>
                ))}
              </div>

              <div className="box-soft col gap-2" style={{ padding: 10 }}>
                <Ph h={140} text="cover image · 1:1" />
                <div className="row gap-2">
                  <span className="pill">임대차</span>
                  <span className="pill">NEW</span>
                </div>
                <div className="fs-14 fw-7" style={{ lineHeight: 1.4 }}>
                  보증금 돌려받는 법,<br/>3단계 프로세스
                </div>
                <div className="row between">
                  <div className="fs-11 muted">카드뉴스 8장</div>
                  <div className="fs-11 muted">2분</div>
                </div>
              </div>

              <div className="box-soft col gap-2" style={{ padding: 10 }}>
                <Ph h={120} text="cover image" />
                <div className="row gap-2">
                  <span className="pill">근로</span>
                </div>
                <div className="fs-14 fw-7" style={{ lineHeight: 1.4 }}>
                  야근수당 안 주는 회사, 이렇게 대응
                </div>
                <div className="row between">
                  <div className="fs-11 muted">카드뉴스 6장</div>
                  <div className="fs-11 muted">3분</div>
                </div>
              </div>
            </div>
            <TabBar active="feed" />
          </Phone>
        </Variation>

        {/* B — Card viewer (inside one piece) */}
        <Variation tag="B" title="카드뉴스 뷰어" note="한 건 안으로 들어간 상태. 좌우 스와이프. 진도 표시.">
          <Phone label="FEED · B — VIEWER">
            <div className="col gap-3" style={{ height: '100%' }}>
              <div className="row between">
                <div className="fs-14">×</div>
                <div className="fs-11 mono muted">3 / 8</div>
                <div className="fs-14">↗</div>
              </div>
              <div style={{ display: 'flex', gap: 3 }}>
                {[0,1,2,3,4,5,6,7].map(i => (
                  <div key={i} style={{
                    flex: 1, height: 2, borderRadius: 2,
                    background: i <= 2 ? 'var(--ink)' : 'var(--line-2)',
                  }} />
                ))}
              </div>

              <div className="box p-4 col gap-3 grow" style={{ background: 'var(--paper-2)', borderRadius: 16, justifyContent: 'space-between' }}>
                <div>
                  <div className="fs-11 mono muted">STEP 1</div>
                  <div className="fs-28 fw-7 mt-2" style={{ lineHeight: 1.2 }}>
                    계약 종료<br/>1개월 전,<br/>구두로 통보
                  </div>
                </div>
                <div className="fs-13 sub" style={{ lineHeight: 1.6 }}>
                  &ldquo;저 이번 계약 끝나면 이사 갑니다&rdquo;<br/>
                  간단한 대화로 시작. 문자로 남겨두면 더 안전해요.
                </div>
              </div>

              <div className="row between">
                <div className="fs-13 muted">← 이전</div>
                <div className="row gap-3">
                  <div className="fs-14">♡</div>
                  <div className="fs-14">🔖</div>
                  <div className="fs-14">💬</div>
                </div>
                <div className="fs-13 fw-6">다음 →</div>
              </div>
            </div>
          </Phone>
        </Variation>

        {/* C — Q&A list */}
        <Variation tag="C" title="Q&A 아카이브" note="실제 질문-답변 형식. 검색 + 태그. 사회 초년생의 실제 질문 톤.">
          <Phone label="FEED · C — Q&A">
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
                <div className="box-soft p-3 col gap-1">
                  <div className="row gap-2">
                    <div className="fs-13 fw-7" style={{ color: 'var(--risk-hi)' }}>Q.</div>
                    <div className="fs-13 fw-6" style={{ lineHeight: 1.4 }}>월세 계약 중간에 나가면 중개수수료 내야 하나요?</div>
                  </div>
                  <div className="row between mt-1">
                    <div className="fs-11 muted">임대차 · 3분 읽기</div>
                    <div className="fs-11 muted">👁 2.1k</div>
                  </div>
                </div>

                <div className="box-soft p-3 col gap-1">
                  <div className="row gap-2">
                    <div className="fs-13 fw-7" style={{ color: 'var(--risk-hi)' }}>Q.</div>
                    <div className="fs-13 fw-6" style={{ lineHeight: 1.4 }}>근로계약서 없이 일했는데 월급이 안 들어와요</div>
                  </div>
                  <div className="row between mt-1">
                    <div className="fs-11 muted">근로 · 4분 읽기</div>
                    <div className="fs-11 muted">👁 3.8k</div>
                  </div>
                </div>

                <div className="box-soft p-3 col gap-1">
                  <div className="row gap-2">
                    <div className="fs-13 fw-7" style={{ color: 'var(--risk-hi)' }}>Q.</div>
                    <div className="fs-13 fw-6" style={{ lineHeight: 1.4 }}>온라인으로 산 옷, 입어보지도 않았는데 환불 안 된대요</div>
                  </div>
                  <div className="row between mt-1">
                    <div className="fs-11 muted">소비자 · 2분 읽기</div>
                    <div className="fs-11 muted">👁 1.4k</div>
                  </div>
                </div>
              </div>
            </div>
            <TabBar active="feed" />
          </Phone>
        </Variation>

      </div>
    </section>
  );
}

window.SectionFeed = SectionFeed;
