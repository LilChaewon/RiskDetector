function ScreenLoading() {
  return (
    <div style={{ height: '100%', position: 'relative', background: '#0d1524' }}>
      <div className="body-scroll" style={{ padding: '12px 4px 20px', color: '#fff' }}>
        <div className="row between ic-1" style={{ padding: '0 4px 0' }}>
          <Ico name="close" size={18} color="#fff"/>
          <div className="fs-13 fw-6" style={{ color: '#aab7c7' }}>분석 중</div>
          <div style={{ width: 18 }}/>
        </div>

        <div style={{ marginTop: 36, textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, margin: '0 auto', borderRadius: 36, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#3b7bf0', animation: 'spin 1s linear infinite', position: 'relative' }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
          <div className="fs-18 fw-7 mt-4 tight">조항을 읽고 있어요</div>
          <div className="fs-13 mt-2" style={{ color: '#aab7c7' }}>원룸 임대차계약서 · 3 / 12 조항</div>
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius: 3,
              background: i < 2 ? '#3b7bf0' : 'rgba(255,255,255,0.2)',
            }}/>
          ))}
        </div>

        {/* Tip during wait */}
        <div style={{ marginTop: 40, padding: '0 16px' }}>
          <div className="fs-11 fw-6" style={{ color: '#7ca4ec', letterSpacing: '0.1em', textTransform: 'uppercase' }}>기다리는 동안</div>
          <div className="fs-16 fw-7 mt-2 lh-2" style={{ color: '#fff' }}>
            임대인이 "수리비는 전부 세입자 부담"이라고 썼다면?
          </div>
          <div className="fs-13 mt-3 lh-3" style={{ color: '#c6d1df' }}>
            민법 제623조상 임대인은 목적물을 사용·수익에 필요한 상태로 유지할 의무가 있어요. 구조적 하자나 노후에 의한 수리비까지 세입자에게 전가하는 조항은 <b style={{color:'#fff'}}>무효로 볼 여지</b>가 있어요.
          </div>
          <div className="row gap-2 mt-4">
            <span className="pill" style={{ background: 'rgba(255,255,255,0.08)', color: '#c6d1df' }}>#임대차</span>
            <span className="pill" style={{ background: 'rgba(255,255,255,0.08)', color: '#c6d1df' }}>#수선의무</span>
          </div>
        </div>

        <div style={{ marginTop: 48, padding: '0 16px' }}>
          <div className="row gap-2 ic-1 fs-11" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <div className="pulse" style={{ width: 6, height: 6, borderRadius: 3, background: '#3b7bf0' }}/>
            <span>평균 12초 · 암호화 전송 중</span>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenLoading });
