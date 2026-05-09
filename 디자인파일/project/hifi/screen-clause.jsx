function ScreenClause() {
  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <div className="body-scroll" style={{ paddingBottom: 90 }}>
        <div className="row between ic-1" style={{ padding: '8px 0 12px' }}>
          <Ico name="back" size={18} color="#191f28"/>
          <div className="fs-13 fw-7">조항 상세</div>
          <Ico name="share" size={16} color="#191f28"/>
        </div>

        <div className="row between ic-1 mt-2">
          <div className="fs-11 sub">제5조 · 수선의무</div>
          <RiskTag level="hi"/>
        </div>
        <div className="fs-20 fw-8 tight mt-2 lh-1">수선비 전가 조항</div>
        <div className="fs-13 mt-2 sub lh-3">
          이 조항은 임대인이 져야 할 기본적인 수선의무를 세입자에게 넘기고 있어요. 집주인과 조율해서 바꾸는 걸 추천드려요.
        </div>

        {/* Before */}
        <div className="card mt-4" style={{ padding: 14, background: 'var(--risk-hi-bg)', borderColor: 'rgba(217,58,58,0.15)' }}>
          <div className="row between ic-1">
            <div className="fs-11 fw-7" style={{ color: 'var(--risk-hi)', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>BEFORE · 원문</div>
            <Ico name="copy" size={14} color="#d93a3a"/>
          </div>
          <div className="doc mt-2" style={{ fontSize: 13 }}>
            본 건물의 수선비 일체는 임차인이 부담하며, 천재지변 등 불가항력적 사유로 발생한 피해도 임차인의 책임으로 한다.
          </div>
        </div>

        {/* Arrow */}
        <div className="center" style={{ display: 'flex', padding: '10px 0' }}>
          <div style={{ width: 36, height: 36, borderRadius: 18, background: 'var(--navy-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(90deg)' }}>
            <Ico name="chevron" size={16} color="#1b64da"/>
          </div>
        </div>

        {/* After */}
        <div className="card" style={{ padding: 14, background: 'var(--navy-soft)', borderColor: 'rgba(27,100,218,0.15)' }}>
          <div className="row between ic-1">
            <div className="fs-11 fw-7" style={{ color: 'var(--navy-2)', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>AFTER · 제안 문구</div>
            <Ico name="copy" size={14} color="#1b64da"/>
          </div>
          <div className="doc mt-2" style={{ fontSize: 13 }}>
            본 건물의 <b>구조적 하자 및 노후화에 따른 수선비는 임대인이 부담</b>하며, 임차인의 귀책사유로 인한 파손에 한하여 임차인이 부담한다. 천재지변 등 불가항력적 사유는 <b>민법 제537조에 따른다</b>.
          </div>
        </div>

        <div className="fs-12 fw-7 mt-4" style={{ color: 'var(--navy-2)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>근거</div>
        <div className="card mt-2" style={{ padding: 12, background: 'var(--line-2)', border: 'none' }}>
          <div className="fs-11 fw-7">민법 제623조</div>
          <div className="fs-12 mt-1 sub lh-2">임대인은 계약 존속 중 목적물의 사용·수익에 필요한 상태를 유지할 의무를 부담한다.</div>
        </div>

        <div className="fs-13 fw-7 mt-5">비슷한 사례</div>
        <div className="col gap-2 mt-2">
          <div className="card card-hover row between ic-1">
            <div className="col gap-1">
              <div className="fs-13 fw-6">대법원 2011다96086</div>
              <div className="fs-11 sub">임차인 부담 특약의 무효 범위</div>
            </div>
            <Ico name="chevron" size={14} color="#8b95a1"/>
          </div>
        </div>

        <div className="row gap-2 mt-4">
          <button className="btn btn-ghost grow">복사</button>
          <button className="btn grow">집주인에게 공유</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenClause });
