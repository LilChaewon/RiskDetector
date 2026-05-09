// ───────────────────────────────────────────────
// Section 03 — 분석 진행 중 로딩 (3 variations)
// ───────────────────────────────────────────────
function SectionLoading() {
  return (
    <section>
      <SectionHeader num="03" title="분석 진행 중" sub="AI가 뭘 하는지 기다림이 불안하지 않도록 — 투명한 로딩" />
      <div className="variation-row">

        {/* A — step-by-step */}
        <Variation tag="A" title="단계별 체크리스트" note="AI가 지금 어느 단계인지 보여줌. 가장 안심됨.">
          <Phone label="LOADING · A">
            <div className="col gap-4 center" style={{ height: '100%', justifyContent: 'center' }}>
              <div className="box-soft center" style={{ width: 120, height: 120, borderRadius: 20 }}>
                <div className="mono fs-12 muted">scan...</div>
              </div>
              <div className="col gap-2" style={{ width: '100%' }}>
                <div className="fs-16 fw-7 text-c">계약서를 꼼꼼히 읽는 중</div>
                <div className="fs-11 muted text-c mono">약 20초 정도 걸려요</div>
              </div>
              <div className="col gap-3 w-full">
                {[
                  { s: 'done', t: '텍스트 인식' },
                  { s: 'done', t: '조항 분리' },
                  { s: 'now',  t: '독소조항 탐색' },
                  { s: 'wait', t: '대안 문구 생성' },
                  { s: 'wait', t: '리포트 정리' },
                ].map((it, i) => (
                  <div key={i} className="row gap-3" style={{ alignItems: 'center' }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: 999,
                      border: '1.5px solid var(--ink)',
                      background: it.s === 'done' ? 'var(--ink)' : '#fff',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      color: '#fff', fontSize: 11,
                    }}>
                      {it.s === 'done' ? '✓' : it.s === 'now' ? '•' : ''}
                    </div>
                    <div className="fs-13" style={{
                      fontWeight: it.s === 'now' ? 700 : 400,
                      color: it.s === 'wait' ? 'var(--ink-3)' : 'var(--ink)',
                    }}>{it.t}</div>
                    {it.s === 'now' && <span className="fs-11 mono muted">...</span>}
                  </div>
                ))}
              </div>
            </div>
          </Phone>
        </Variation>

        {/* B — reading document animation */}
        <Variation tag="B" title="문서 위 스캔 애니메이션" note="문서 이미지를 보여주며 스캔 라인이 내려감. 시각적으로 강력. 대기시간 체감 ↓">
          <Phone label="LOADING · B">
            <div className="col gap-3 center" style={{ height: '100%', justifyContent: 'center' }}>
              <div style={{ position: 'relative', width: 180, height: 240 }}>
                <div className="box" style={{ width: '100%', height: '100%', borderRadius: 8, padding: 14, background: '#fff' }}>
                  <div style={{ height: 8, background: 'var(--line)', borderRadius: 2, width: '60%', marginBottom: 10 }} />
                  {[...Array(8)].map((_, i) => (
                    <div key={i} style={{
                      height: 4, background: 'var(--line-2)', borderRadius: 2,
                      marginBottom: 8, width: `${70 + (i*7) % 25}%`,
                    }} />
                  ))}
                </div>
                <div style={{
                  position: 'absolute', left: -4, right: -4, top: '45%',
                  height: 3, background: 'var(--risk-hi)', boxShadow: '0 0 8px var(--risk-hi)',
                  borderRadius: 2,
                }} />
                <div style={{
                  position: 'absolute', left: -4, right: -4, top: 0, bottom: '55%',
                  background: 'rgba(255,255,255,0.55)', borderRadius: 8,
                }} />
              </div>
              <div className="fs-16 fw-7 mt-3">조항 14개 중 7번째 확인 중</div>
              <div className="fs-12 muted text-c" style={{ maxWidth: 220, lineHeight: 1.5 }}>
                &ldquo;갑의 일방적 해지&rdquo; 부분을<br/>주의 깊게 보고 있어요
              </div>
              <div style={{ width: '70%', height: 3, background: 'var(--line-2)', borderRadius: 2 }}>
                <div style={{ width: '48%', height: '100%', background: 'var(--ink)', borderRadius: 2 }} />
              </div>
            </div>
          </Phone>
        </Variation>

        {/* C — tip-while-waiting */}
        <Variation tag="C" title="팁 카드 넘기며 대기" note="대기 시간을 학습 시간으로. 사회 초년생에게는 대기 자체가 교육 기회.">
          <Phone label="LOADING · C">
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
                    원상복구 조항,<br/>세입자 100%는 <br/>잘못된 문구예요.
                  </div>
                  <div className="fs-13 sub mt-3" style={{ lineHeight: 1.6 }}>
                    자연적 노화·마모(벽지 변색 등)는
                    세입자 책임이 아닙니다. 판례도 일관돼요.
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
        </Variation>

      </div>
    </section>
  );
}

window.SectionLoading = SectionLoading;
