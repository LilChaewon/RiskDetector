function ReportHeader() {
  return (
    <div className="row between ic-1" style={{ padding: '8px 0 12px' }}>
      <Ico name="back" size={18} color="#191f28"/>
      <div className="fs-13 fw-7">분석 결과</div>
      <Ico name="share" size={16} color="#191f28"/>
    </div>
  );
}

function RiskSummary() {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="row between ic-1">
        <div className="col gap-1">
          <div className="fs-11 fw-6" style={{ color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>문서 개요</div>
          <div className="fs-15 fw-7">원룸 임대차계약서</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="fs-24 fw-8 lh-1" style={{ color: 'var(--risk-hi)' }}>2</div>
          <div className="fs-10 sub">주의 조항</div>
        </div>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: 'var(--line-2)', marginTop: 14, overflow: 'hidden', display: 'flex' }}>
        <div style={{ flex: '2', background: 'var(--risk-hi)' }}/>
        <div style={{ flex: '1', background: 'var(--risk-md)' }}/>
        <div style={{ flex: '9', background: 'var(--risk-lo)' }}/>
      </div>
      <div className="row between mt-2 fs-11 sub">
        <span>주의 2 · 확인 1 · 안전 9</span>
        <span>총 12개 조항</span>
      </div>
    </div>
  );
}

function DocumentBody({ onTapHi }) {
  return (
    <div className="card mt-3" style={{ padding: 18 }}>
      <div className="fs-11 fw-6 sub" style={{ letterSpacing: '0.05em' }}>원문 · 제5조 ~ 제7조</div>
      <div className="doc mt-3">
        <div style={{ fontWeight: 700, marginBottom: 6 }}>제5조 (수선의무)</div>
        <p style={{ margin: '0 0 14px' }}>
          본 건물의 <span className="hl-hi" onClick={onTapHi}>수선비 일체는 임차인이 부담</span>하며, 천재지변 등 불가항력적 사유로 발생한 피해도 임차인의 책임으로 한다.
        </p>

        <div style={{ fontWeight: 700, marginBottom: 6 }}>제6조 (보증금 반환)</div>
        <p style={{ margin: '0 0 14px' }}>
          계약 종료 시 보증금은 원상복구 완료 후 <span className="hl-md">30일 이내에 반환</span>하는 것을 원칙으로 한다.
        </p>

        <div style={{ fontWeight: 700, marginBottom: 6 }}>제7조 (계약 해지)</div>
        <p style={{ margin: '0 0 14px' }}>
          임차인이 차임을 <span className="hl-hi">1회 이상 연체</span>한 경우 임대인은 즉시 본 계약을 해지할 수 있으며, 이에 대해 임차인은 이의를 제기하지 아니한다.
        </p>
      </div>
    </div>
  );
}

function ScreenReport() {
  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <div className="body-scroll" style={{ paddingBottom: 90 }}>
        <ReportHeader/>
        <RiskSummary/>
        {/* Tabs */}
        <div className="row gap-2 mt-3">
          <div className="pill pill-nav">전체 12</div>
          <div className="pill">주의 2</div>
          <div className="pill">확인 1</div>
        </div>
        <DocumentBody/>

        <div className="fs-13 fw-7 mt-5">조항별 분석</div>
        <div className="col gap-2 mt-2">
          <div className="card card-hover col gap-2">
            <div className="row between ic-1">
              <div className="fs-12 sub">제5조 · 수선의무</div>
              <RiskTag level="hi"/>
            </div>
            <div className="fs-14 fw-7 lh-2">수선비 전가 조항 — 민법상 무효 가능성</div>
          </div>
          <div className="card card-hover col gap-2">
            <div className="row between ic-1">
              <div className="fs-12 sub">제7조 · 계약 해지</div>
              <RiskTag level="hi"/>
            </div>
            <div className="fs-14 fw-7 lh-2">1회 연체만으로 해지 — 주임법 위반 소지</div>
          </div>
        </div>
      </div>
      <TabBar active="analyze"/>
    </div>
  );
}

function ScreenReportSheet() {
  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <div className="body-scroll" style={{ paddingBottom: 90, filter: 'blur(1px)', opacity: 0.6 }}>
        <ReportHeader/>
        <RiskSummary/>
        <DocumentBody/>
      </div>
      {/* Bottom sheet */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: '#fff', borderRadius: '24px 24px 0 0', boxShadow: '0 -10px 40px rgba(0,0,0,0.12)', padding: 20, maxHeight: '70%', overflow: 'auto' }}>
        <div style={{ width: 36, height: 4, background: '#e5e8eb', borderRadius: 2, margin: '0 auto 16px' }}/>
        <div className="row between ic-1">
          <div className="fs-12 sub">제5조 · 수선의무</div>
          <RiskTag level="hi"/>
        </div>
        <div className="fs-17 fw-8 tight mt-2" style={{ fontSize: 17 }}>
          "수선비 일체는 임차인이 부담"
        </div>
        <div className="fs-12 fw-6 mt-4" style={{ color: 'var(--navy-2)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>왜 주의해야 하나요</div>
        <div className="fs-13 mt-2 lh-3" style={{ color: 'var(--ink-2)' }}>
          민법 제623조는 임대인의 수선의무를 정하고 있어요. 구조적 하자, 노후화로 인한 수리비까지 세입자에게 떠넘기는 조항은 <b style={{color:'var(--ink)'}}>무효</b>로 볼 수 있어요.
        </div>
        <div className="fs-12 fw-6 mt-4" style={{ color: 'var(--navy-2)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>관련 근거</div>
        <div className="card mt-2" style={{ padding: 12, background: 'var(--line-2)', border: 'none' }}>
          <div className="fs-11 fw-7">민법 제623조 (임대인의 의무)</div>
          <div className="fs-12 mt-1 sub lh-2">임대인은 목적물을 임차인에게 인도하고 계약존속중 그 사용, 수익에 필요한 상태를 유지하게 할 의무를 부담한다.</div>
        </div>
        <div className="row gap-2 mt-4">
          <button className="btn btn-ghost btn-sm grow">전체 보기</button>
          <button className="btn btn-sm grow">수정안 제안받기</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenReport, ScreenReportSheet });
