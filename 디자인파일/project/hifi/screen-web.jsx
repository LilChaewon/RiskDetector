function ScreenWeb() {
  return (
    <div className="browser" style={{ maxWidth: 1280 }}>
      <div className="chrome">
        <div className="dot" style={{ background: '#ff5f57' }}/>
        <div className="dot" style={{ background: '#febc2e' }}/>
        <div className="dot" style={{ background: '#28c840' }}/>
        <div className="url">rd.app / report / 원룸 임대차계약서</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ width: 20, height: 20, borderRadius: 4, background: '#f2f4f6' }}/>
          <div style={{ width: 20, height: 20, borderRadius: 4, background: '#f2f4f6' }}/>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 340px', minHeight: 720 }}>
        {/* Left nav */}
        <div style={{ borderRight: '1px solid var(--line)', padding: '20px 14px', background: '#fbfbfc' }}>
          <div className="fs-18 fw-8 tight" style={{ padding: '0 8px 20px' }}>RD</div>
          <div className="col gap-1">
            {[
              ['홈', false],
              ['분석 기록', true],
              ['법률 팁', false],
              ['북마크', false],
              ['전문가 상담', false],
            ].map(([t, on]) => (
              <div key={t} className="fs-13 fw-6" style={{
                padding: '10px 12px', borderRadius: 8,
                background: on ? 'var(--navy-soft)' : 'transparent',
                color: on ? 'var(--navy)' : 'var(--ink-2)',
              }}>{t}</div>
            ))}
          </div>
          <div className="fs-11 fw-6 mt-6" style={{ color: 'var(--ink-3)', padding: '0 12px 8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>최근 분석</div>
          <div className="col gap-1">
            {['원룸 임대차계약서', '프리랜서 용역계약', '근로계약서'].map((t, i) => (
              <div key={t} className="fs-12" style={{ padding: '8px 12px', borderRadius: 8, color: i === 0 ? 'var(--ink)' : 'var(--ink-2)', fontWeight: i === 0 ? 700 : 500 }}>{t}</div>
            ))}
          </div>
          <button className="btn btn-sm mt-4" style={{ width: '100%' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Ico name="plus" size={12} color="#fff"/>새 분석
            </span>
          </button>
        </div>

        {/* Main */}
        <div style={{ padding: '28px 36px', overflow: 'auto' }}>
          <div className="fs-11 sub" style={{ letterSpacing: '0.05em', textTransform: 'uppercase' }}>IMO.PDF · 2026-04-17</div>
          <div className="row between ic-1 mt-2">
            <div className="fs-24 fw-8 tight">원룸 임대차계약서</div>
            <div className="row gap-2">
              <button className="btn btn-ghost btn-sm"><Ico name="share" size={12} color="#191f28"/>&nbsp;공유</button>
              <button className="btn btn-sm">수정안 내보내기</button>
            </div>
          </div>

          {/* Summary strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 20 }}>
            <div className="card" style={{ padding: 14 }}>
              <div className="fs-11 sub" style={{ whiteSpace: 'nowrap' }}>총 조항</div>
              <div className="fs-20 fw-8 mt-1">12</div>
            </div>
            <div className="card" style={{ padding: 14 }}>
              <div className="fs-11 sub" style={{ whiteSpace: 'nowrap' }}>주의 필요</div>
              <div className="fs-20 fw-8 mt-1" style={{ color: 'var(--risk-hi)' }}>2</div>
            </div>
            <div className="card" style={{ padding: 14 }}>
              <div className="fs-11 sub" style={{ whiteSpace: 'nowrap' }}>확인 권장</div>
              <div className="fs-20 fw-8 mt-1" style={{ color: 'var(--risk-md)' }}>1</div>
            </div>
            <div className="card" style={{ padding: 14 }}>
              <div className="fs-11 sub" style={{ whiteSpace: 'nowrap' }}>안전</div>
              <div className="fs-20 fw-8 mt-1" style={{ color: 'var(--risk-lo)' }}>9</div>
            </div>
          </div>

          {/* Document */}
          <div className="card mt-4" style={{ padding: 28 }}>
            <div className="doc" style={{ fontSize: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>제5조 (수선의무)</div>
              <p style={{ margin: '0 0 20px' }}>
                본 건물의 <span className="hl-hi">수선비 일체는 임차인이 부담</span>하며, 천재지변 등 불가항력적 사유로 발생한 피해도 임차인의 책임으로 한다.
              </p>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>제6조 (보증금 반환)</div>
              <p style={{ margin: '0 0 20px' }}>
                계약 종료 시 보증금은 원상복구 완료 후 <span className="hl-md">30일 이내에 반환</span>하는 것을 원칙으로 한다.
              </p>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>제7조 (계약 해지)</div>
              <p style={{ margin: '0 0 20px' }}>
                임차인이 차임을 <span className="hl-hi">1회 이상 연체</span>한 경우 임대인은 즉시 본 계약을 해지할 수 있으며, 이에 대해 임차인은 이의를 제기하지 아니한다.
              </p>
            </div>
          </div>
        </div>

        {/* Right context panel */}
        <div style={{ borderLeft: '1px solid var(--line)', padding: '28px 24px', background: '#fbfbfc', overflow: 'auto' }}>
          <div className="row between ic-1">
            <div className="fs-11 sub" style={{ letterSpacing: '0.05em', textTransform: 'uppercase' }}>선택된 조항</div>
            <Ico name="close" size={14} color="#8b95a1"/>
          </div>
          <div className="row gap-2 ic-1 mt-3">
            <RiskTag level="hi"/>
            <span className="fs-11 sub">제5조</span>
          </div>
          <div className="fs-16 fw-8 tight mt-2 lh-1">수선비 전가 조항</div>
          <div className="fs-12 mt-3 sub lh-3">
            민법 제623조상 임대인은 목적물의 사용·수익에 필요한 상태 유지 의무가 있어요. 노후·구조적 하자에 따른 수선비까지 세입자에게 전가하는 것은 무효 가능성이 높아요.
          </div>

          {/* Before/After inline */}
          <div className="mt-4" style={{ padding: 12, background: 'var(--risk-hi-bg)', borderRadius: 10 }}>
            <div className="fs-10 fw-7" style={{ color: 'var(--risk-hi)', letterSpacing: '0.05em' }}>BEFORE</div>
            <div className="fs-12 mt-1 lh-3">수선비 일체는 임차인이 부담…</div>
          </div>
          <div className="mt-2" style={{ padding: 12, background: 'var(--navy-soft)', borderRadius: 10 }}>
            <div className="fs-10 fw-7" style={{ color: 'var(--navy-2)', letterSpacing: '0.05em' }}>AFTER</div>
            <div className="fs-12 mt-1 lh-3">구조적 하자 및 노후화에 따른 수선비는 임대인이 부담한다…</div>
          </div>

          <div className="fs-11 fw-7 mt-5" style={{ color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>관련 판례</div>
          <div className="card mt-2" style={{ padding: 12, background: '#fff' }}>
            <div className="fs-12 fw-7">대법원 2011다96086</div>
            <div className="fs-11 sub mt-1 lh-2">임차인 부담 특약의 무효 범위</div>
          </div>

          <button className="btn btn-sm mt-4" style={{ width: '100%' }}>
            <Ico name="sparkle" size={12} color="#fff"/>&nbsp;&nbsp;집주인 보낼 메시지 만들기
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenWeb });
