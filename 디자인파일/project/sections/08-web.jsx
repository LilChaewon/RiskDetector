// ───────────────────────────────────────────────
// Section 08 — 웹 대시보드 (2 variations — 모바일과 병행)
// ───────────────────────────────────────────────
function SectionWeb() {
  return (
    <section>
      <SectionHeader num="08" title="웹 대시보드" sub="데스크톱에서 긴 문서를 꼼꼼히 보기 — 모바일 리포트의 확장판" />
      <div className="col gap-6">

        {/* A — Split view */}
        <Variation tag="A" title="좌: 원문 / 우: 독소조항 · 2컬럼" note="변호사/실무자 느낌. 긴 문서도 스크롤로 훑음. 조항 클릭 → 우측 패널 포커스.">
          <div className="browser">
            <div className="chrome">
              <div className="dot" /><div className="dot" /><div className="dot" />
              <div className="url mono">rd.app / report / 1029</div>
              <div className="fs-11 muted">👤</div>
            </div>
            <div className="row" style={{ minHeight: 520 }}>
              {/* sidebar */}
              <div style={{ width: 200, borderRight: '1.5px solid var(--ink)', padding: 14 }}>
                <div className="fs-16 fw-7 mb-3">RD</div>
                <div className="col gap-1">
                  {['홈', '분석', '내 문서', '법률 팁', '설정'].map((t, i) => (
                    <div key={i} className="row gap-2 p-2" style={{
                      alignItems: 'center', borderRadius: 8,
                      background: i === 2 ? 'var(--ink)' : 'transparent',
                      color: i === 2 ? '#fff' : 'var(--ink)',
                    }}>
                      <div className="box-soft" style={{ width: 14, height: 14, borderRadius: 4 }} />
                      <div className="fs-13">{t}</div>
                    </div>
                  ))}
                </div>
                <div className="box-soft p-3 mt-4 col gap-1">
                  <div className="fs-10 mono muted">잔여 분석</div>
                  <div className="fs-18 fw-7">∞</div>
                  <div className="fs-10 muted">PRO 연간</div>
                </div>
              </div>

              {/* document column */}
              <div style={{ flex: 1, padding: 20, borderRight: '1.5px solid var(--ink)', overflow: 'auto' }}>
                <div className="row between mb-3">
                  <div className="col" style={{ gap: 2 }}>
                    <div className="fs-11 mono muted">2025.01.18 업로드 · 5p</div>
                    <div className="fs-18 fw-7">원룸 임대차계약서.pdf</div>
                  </div>
                  <div className="row gap-2">
                    <div className="btn btn-sm btn-ghost">PDF 저장</div>
                    <div className="btn btn-sm">공유</div>
                  </div>
                </div>
                <div className="box p-4 col gap-3" style={{ fontFamily: 'serif', fontSize: 13, lineHeight: 1.8 }}>
                  <div className="fw-7 text-c fs-16">주택 임대차 계약서</div>
                  <div><b>제1조 (목적)</b> 본 계약은 서울시 종로구 소재 원룸에 관한 임대차를 정함을 목적으로 한다.</div>
                  <div><b>제7조 (원상복구)</b> 임차인은 임대차 종료 시 <span className="hl-hi">발생한 모든 손상에 대하여 100%의 복구 책임을 부담한다</span>.</div>
                  <div><b>제9조 (보증금)</b> 보증금은 임대차 종료 후 <span className="hl-md">임대인과 임차인이 협의한 시기에</span> 반환한다.</div>
                  <div><b>제12조 (계약의 해지)</b> <span className="hl-hi">임대인은 사유 없이 30일 전 통지로 계약을 해지할 수 있다.</span></div>
                  <div><b>제14조 (기타)</b> 본 계약에 정하지 아니한 사항은 민법의 규정에 따른다.</div>
                </div>
              </div>

              {/* findings column */}
              <div style={{ width: 320, padding: 20, background: 'var(--paper)', overflow: 'auto' }}>
                <div className="row between mb-3">
                  <div className="fs-13 fw-7">독소조항 3</div>
                  <div className="row gap-1">
                    <span className="pill fs-10" style={{ background: 'var(--risk-hi-bg)', color: 'var(--risk-hi)', borderColor: 'var(--risk-hi)' }}>2</span>
                    <span className="pill fs-10" style={{ background: 'var(--risk-md-bg)', color: 'var(--risk-md)', borderColor: 'var(--risk-md)' }}>1</span>
                  </div>
                </div>

                <div className="box p-3 col gap-2 mb-3" style={{ background: 'var(--risk-hi-bg)', borderColor: 'var(--risk-hi)' }}>
                  <div className="row between">
                    <div className="fs-11 mono" style={{ color: 'var(--risk-hi)' }}>제7조 · 원상복구</div>
                    <RiskTag level="hi" />
                  </div>
                  <div className="fs-13 fw-7">자연 마모까지 100% 부담</div>
                  <div className="fs-11" style={{ lineHeight: 1.5 }}>
                    판례상 통상적 사용에 따른 손모는 임차인 책임이 아닙니다.
                  </div>
                  <div className="row gap-1 mt-1">
                    <div className="pill fs-10">대안 문구 보기</div>
                  </div>
                </div>

                <div className="box-soft p-3 col gap-2 mb-2">
                  <div className="row between">
                    <div className="fs-11 mono muted">제12조 · 해지</div>
                    <RiskTag level="hi" />
                  </div>
                  <div className="fs-13 fw-6">사유 없는 일방 해지</div>
                </div>

                <div className="box-soft p-3 col gap-2">
                  <div className="row between">
                    <div className="fs-11 mono muted">제9조 · 보증금</div>
                    <RiskTag level="md" />
                  </div>
                  <div className="fs-13 fw-6">"협의" 반환 시기</div>
                </div>
              </div>
            </div>
          </div>
        </Variation>

        {/* B — Upload landing */}
        <Variation tag="B" title="웹 업로드 랜딩" note="드래그앤드롭 + 최근 분석. 첫 방문 유저용.">
          <div className="browser">
            <div className="chrome">
              <div className="dot" /><div className="dot" /><div className="dot" />
              <div className="url mono">rd.app</div>
              <div className="fs-11 muted">👤 지우</div>
            </div>
            <div style={{ padding: 32, minHeight: 480 }}>
              <div className="row between mb-4">
                <div className="fs-24 fw-7">계약서,<br/>끌어다 놓기만 하면 돼요.</div>
                <div className="row gap-2" style={{ alignItems: 'center' }}>
                  <div className="pill">무료 2/3</div>
                  <div className="btn btn-sm btn-ghost">PRO</div>
                </div>
              </div>

              <div className="box-dash center col" style={{ minHeight: 240, background: 'var(--paper-2)', borderRadius: 18 }}>
                <div style={{ fontSize: 44, color: 'var(--ink-3)' }}>⬆</div>
                <div className="fs-16 fw-7 mt-2">PDF · 이미지를 여기에 놓아보세요</div>
                <div className="fs-12 muted mt-1">또는 파일 선택 · 텍스트 붙여넣기</div>
                <div className="row gap-2 mt-3">
                  <div className="btn btn-sm">파일 선택</div>
                  <div className="btn btn-sm btn-ghost">텍스트 붙여넣기</div>
                </div>
              </div>

              <div className="row between mt-4 mb-2">
                <div className="fs-14 fw-7">최근 분석</div>
                <div className="fs-12 muted">전체 보기 ›</div>
              </div>
              <div className="row gap-3">
                {[
                  { t: '원룸 임대차', d: '어제', r: 'hi', n: 3 },
                  { t: '알바 근로계약', d: '3일 전', r: 'md', n: 1 },
                  { t: '프리랜서 용역', d: '1주 전', r: 'lo', n: 0 },
                ].map((it, i) => (
                  <div key={i} className="box-soft p-3 col gap-2 grow">
                    <div className="row between">
                      <div className="fs-11 mono muted">{it.d}</div>
                      <RiskTag level={it.r} />
                    </div>
                    <div className="fs-14 fw-7">{it.t}</div>
                    <div className="fs-11 muted">독소 {it.n}건</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Variation>

      </div>
    </section>
  );
}

window.SectionWeb = SectionWeb;
