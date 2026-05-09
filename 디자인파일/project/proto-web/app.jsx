const { useState, useEffect, useRef } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "darkMode": false,
  "compactSidebar": false
}/*EDITMODE-END*/;

// ───────── Icons ─────────
function Ico({ name, size = 16, color = 'currentColor', stroke = 1.6 }) {
  const s = { width: size, height: size };
  const p = { fill: 'none', stroke: color, strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const map = {
    home: <svg {...s} viewBox="0 0 20 20"><path {...p} d="M3 9l7-6 7 6v8a1 1 0 01-1 1h-4v-5H8v5H4a1 1 0 01-1-1V9z"/></svg>,
    doc: <svg {...s} viewBox="0 0 20 20"><path {...p} d="M12 2H5a1 1 0 00-1 1v14a1 1 0 001 1h10a1 1 0 001-1V6l-4-4z"/><path {...p} d="M12 2v4h4M7 10h6M7 14h6"/></svg>,
    bulb: <svg {...s} viewBox="0 0 20 20"><path {...p} d="M10 2a5 5 0 00-3 9c.5.4 1 1 1 2v1h4v-1c0-1 .5-1.6 1-2a5 5 0 00-3-9z"/><path {...p} d="M8 17h4"/></svg>,
    star: <svg {...s} viewBox="0 0 20 20"><path {...p} d="M10 2l2.5 5 5.5.5-4 4 1 5.5L10 14l-5 3 1-5.5-4-4L7.5 7 10 2z"/></svg>,
    user: <svg {...s} viewBox="0 0 20 20"><circle {...p} cx="10" cy="7" r="3"/><path {...p} d="M3 18c0-4 3-7 7-7s7 3 7 7"/></svg>,
    plus: <svg {...s} viewBox="0 0 20 20"><path {...p} d="M10 4v12M4 10h12"/></svg>,
    search: <svg {...s} viewBox="0 0 20 20"><circle {...p} cx="9" cy="9" r="6"/><path {...p} d="M14 14l4 4"/></svg>,
    bell: <svg {...s} viewBox="0 0 20 20"><path {...p} d="M10 3a5 5 0 015 5v4l1.5 2.5h-13L5 12V8a5 5 0 015-5z"/><path {...p} d="M8 16a2 2 0 004 0"/></svg>,
    chevron: <svg {...s} viewBox="0 0 20 20"><path {...p} d="M8 5l5 5-5 5"/></svg>,
    close: <svg {...s} viewBox="0 0 20 20"><path {...p} d="M5 5l10 10M15 5l-10 10"/></svg>,
    share: <svg {...s} viewBox="0 0 20 20"><path {...p} d="M10 3v11M6 7l4-4 4 4M4 13v4a1 1 0 001 1h10a1 1 0 001-1v-4"/></svg>,
    copy: <svg {...s} viewBox="0 0 20 20"><rect {...p} x="7" y="7" width="10" height="10" rx="2"/><path {...p} d="M13 7V5a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2"/></svg>,
    sparkle: <svg {...s} viewBox="0 0 20 20" fill={color}><path d="M10 2l1.8 5.2L17 9l-5.2 1.8L10 16l-1.8-5.2L3 9l5.2-1.8L10 2z"/></svg>,
    camera: <svg {...s} viewBox="0 0 20 20"><path {...p} d="M3 7h3l2-3h4l2 3h3v9H3V7z"/><circle {...p} cx="10" cy="11" r="3"/></svg>,
    upload: <svg {...s} viewBox="0 0 20 20"><path {...p} d="M10 14V4M6 8l4-4 4 4M4 15v2a1 1 0 001 1h10a1 1 0 001-1v-2"/></svg>,
    edit: <svg {...s} viewBox="0 0 20 20"><path {...p} d="M3 17v2h2l11-11-2-2L3 17z M12 6l2 2"/></svg>,
    shield: <svg {...s} viewBox="0 0 20 20"><path {...p} d="M10 2l7 3v5c0 4-3 7-7 8-4-1-7-4-7-8V5l7-3z"/><path {...p} d="M7 10l2 2 4-4"/></svg>,
    eye: <svg {...s} viewBox="0 0 20 20"><path {...p} d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z"/><circle {...p} cx="10" cy="10" r="2.5"/></svg>,
    moon: <svg {...s} viewBox="0 0 20 20"><path {...p} d="M15 11.5A6.5 6.5 0 018.5 5a6.5 6.5 0 108.5 8.5c-.9.2-1.8 0-2-2z"/></svg>,
    sun: <svg {...s} viewBox="0 0 20 20"><circle {...p} cx="10" cy="10" r="3.5"/><path {...p} d="M10 2v2M10 16v2M2 10h2M16 10h2M4.5 4.5l1.5 1.5M14 14l1.5 1.5M15.5 4.5L14 6M6 14l-1.5 1.5"/></svg>,
    bookmark: <svg {...s} viewBox="0 0 20 20"><path {...p} d="M5 3h10v14l-5-3-5 3V3z"/></svg>,
    chat: <svg {...s} viewBox="0 0 20 20"><path {...p} d="M3 5a1 1 0 011-1h12a1 1 0 011 1v9a1 1 0 01-1 1h-7l-4 3v-3H4a1 1 0 01-1-1V5z"/></svg>,
  };
  return map[name] || null;
}

// ───────── Sidebar ─────────
function Sidebar({ screen, nav }) {
  const items = [
    { id: 'home', t: '홈', ic: 'home' },
    { id: 'feed', t: '법률 팁', ic: 'bulb' },
    { id: 'bookmarks', t: '북마크', ic: 'bookmark' },
    { id: 'consult', t: '전문가 상담', ic: 'chat' },
    { id: 'my', t: '내 정보', ic: 'user' },
  ];
  const routeMap = { bookmarks: 'feed', consult: 'feed' };
  const activeNav = screen === 'my' ? 'my' : screen === 'feed' ? 'feed' : 'home';

  const recent = [
    { t: '원룸 임대차계약서', c: 'var(--risk-hi)', route: 'report' },
    { t: '프리랜서 용역계약', c: 'var(--risk-md)', route: 'report' },
    { t: '근로계약서', c: 'var(--risk-lo)', route: 'report' },
  ];

  return (
    <div className="side">
      <div className="logo">
        <span>RD</span>
        <span className="logo-dot"/>
      </div>
      <div className="col gap-1">
        {items.map(it => (
          <div key={it.id} className={`navitem ${activeNav === it.id ? 'on' : ''}`} onClick={() => nav(routeMap[it.id] || it.id)}>
            <Ico name={it.ic} size={16}/>
            <span>{it.t}</span>
          </div>
        ))}
      </div>
      <div className="section-title">최근 분석</div>
      <div className="col gap-1">
        {recent.map((r, i) => (
          <div key={i} className={`recent-item ${i === 0 && screen === 'report' ? 'on' : ''}`} onClick={() => nav(r.route)}>
            <div className="recent-dot" style={{ background: r.c }}/>
            <span>{r.t}</span>
          </div>
        ))}
      </div>
      <button className="btn btn-sm mt-4" style={{ width: '100%' }} onClick={() => nav('upload')}>
        <Ico name="plus" size={12} color="#fff"/>
        새 분석
      </button>
    </div>
  );
}

// ───────── Home ─────────
function HomeScreen({ nav }) {
  return (
    <div className="main page-enter">
      <div className="kicker">대시보드</div>
      <div className="fs-32 fw-8 tight mt-1">안녕하세요, 지훈님</div>
      <div className="fs-14 sub mt-2">오늘도 계약서 똑똑하게 읽어봐요.</div>

      <div className="card-dark mt-5" style={{ padding: 28, display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center' }}>
        <div>
          <div className="fs-11 fw-6" style={{ color: '#7ca4ec', letterSpacing: '0.05em' }}>계약서, 이제 혼자 보지 마세요</div>
          <div className="fs-24 fw-8 lh-1 tight mt-2" style={{ color: '#fff' }}>PDF · 이미지 · 사진을 끌어다 놓기만 하면</div>
          <div className="fs-13 mt-3" style={{ color: '#aab7c7' }}>임대차 · 근로 · 용역 · 위임 — 평균 12초면 끝.</div>
          <div className="row gap-2 mt-4">
            <button className="btn btn-white btn-lg" onClick={() => nav('upload')}>
              <Ico name="upload" size={14} color="#191f28"/>
              파일 업로드
            </button>
            <button className="btn btn-lg" style={{ background: 'rgba(255,255,255,0.08)' }} onClick={() => nav('upload')}>텍스트 붙여넣기</button>
          </div>
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#aab7c7', textAlign: 'right', whiteSpace: 'nowrap' }}>
          이번 달 2/3 분석 남음
        </div>
      </div>

      <div className="row between ic-1 mt-8">
        <div className="fs-18 fw-7 nowrap">최근 분석</div>
        <div className="fs-12 sub nowrap" style={{ cursor: 'pointer' }}>전체 보기 →</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 12 }}>
        {[
          { t: '원룸 임대차계약서', d: '어제', r: 'hi', cat: '임대차', n: 2 },
          { t: '프리랜서 용역계약', d: '3일 전', r: 'md', cat: '용역', n: 1 },
          { t: '근로계약서', d: '1주 전', r: 'lo', cat: '근로', n: 0 },
        ].map((it, i) => (
          <div key={i} className="card card-hover col gap-2" onClick={() => nav('report')}>
            <div className="row between ic-1">
              <span className="pill">{it.cat}</span>
              <span className={`risk-tag risk-${it.r}`}>{it.r === 'hi' ? '주의' : it.r === 'md' ? '확인' : '안전'}</span>
            </div>
            <div className="fs-15 fw-7 mt-1">{it.t}</div>
            <div className="row between">
              <span className="fs-11 sub nowrap">{it.d}</span>
              <span className="fs-11 sub nowrap">독소 {it.n}건</span>
            </div>
          </div>
        ))}
      </div>

      <div className="row between ic-1 mt-8">
        <div className="fs-18 fw-7 nowrap">오늘의 법률 팁</div>
        <div className="fs-12 sub nowrap" style={{ cursor: 'pointer' }} onClick={() => nav('feed')}>전체 팁 →</div>
      </div>
      <div className="card mt-3 card-hover row gap-4 ic-1" onClick={() => nav('feed')}>
        <div className="col gap-1 grow">
          <div className="fs-11 mono sub">APR 18 · 임대차 · CARD 1/5</div>
          <div className="fs-16 fw-7 mt-1">보증금 못 돌려받을 때, 임차권등기명령부터 해보세요</div>
          <div className="fs-12 sub mt-1">이사 가도 대항력이 유지돼요. 5천만원 이하면 소액보증금 최우선변제도 가능.</div>
        </div>
        <button className="btn btn-ghost btn-sm">읽어보기 →</button>
      </div>
    </div>
  );
}

// ───────── Upload ─────────
function UploadScreen({ nav }) {
  const [dragOver, setDragOver] = useState(false);
  return (
    <div className="main narrow page-enter">
      <div className="kicker">새 분석</div>
      <div className="fs-28 fw-8 tight mt-1">어떻게 가져오실래요?</div>
      <div className="fs-14 sub mt-2">한 번에 여러 페이지도 괜찮아요. 한국어 계약서 · PDF 40MB까지.</div>

      <div
        className="center col mt-5"
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); nav('loading'); }}
        onClick={() => nav('loading')}
        style={{
          minHeight: 260, borderRadius: 18, cursor: 'pointer',
          background: dragOver ? 'var(--navy-soft)' : 'var(--paper-2)',
          border: `2px dashed ${dragOver ? 'var(--navy-2)' : 'var(--line)'}`,
          transition: 'background 160ms, border-color 160ms',
        }}
      >
        <Ico name="upload" size={36} color="var(--ink-3)" stroke={1.4}/>
        <div className="fs-18 fw-7 mt-3">파일을 여기에 놓기</div>
        <div className="fs-12 sub mt-1">PDF · JPG · PNG · HEIC</div>
        <button className="btn btn-sm mt-4" onClick={(e) => { e.stopPropagation(); nav('loading'); }}>파일 선택</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
        <div className="card card-hover row gap-3 ic-1" onClick={() => nav('loading')}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Ico name="camera" size={20} color="var(--ink-2)"/>
          </div>
          <div className="grow col gap-1">
            <div className="fs-14 fw-7">사진 촬영</div>
            <div className="fs-12 sub">모바일에서 찍은 사진</div>
          </div>
          <Ico name="chevron" size={14} color="var(--ink-3)"/>
        </div>
        <div className="card card-hover row gap-3 ic-1" onClick={() => nav('loading')}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Ico name="edit" size={20} color="var(--ink-2)"/>
          </div>
          <div className="grow col gap-1">
            <div className="fs-14 fw-7">텍스트 붙여넣기</div>
            <div className="fs-12 sub">복사한 텍스트 그대로</div>
          </div>
          <Ico name="chevron" size={14} color="var(--ink-3)"/>
        </div>
      </div>

      <div className="row gap-2 mt-4 ic-1" style={{ padding: '0 4px' }}>
        <Ico name="shield" size={12} color="var(--ink-3)"/>
        <div className="fs-11 sub">업로드한 파일은 분석 후 자동 삭제돼요</div>
      </div>
    </div>
  );
}

// ───────── Loading ─────────
function LoadingScreen({ nav }) {
  useEffect(() => { const t = setTimeout(() => nav('report'), 3000); return () => clearTimeout(t); }, [nav]);
  return (
    <div style={{ minHeight: '100vh', background: '#0d1524', color: '#fff', padding: '80px 40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: 520, width: '100%' }}>
        <div className="center" style={{ display: 'flex', marginBottom: 32 }}>
          <div style={{ width: 80, height: 80, borderRadius: 40, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#3b7bf0', animation: 'spin 1s linear infinite' }}/>
        </div>
        <div className="fs-22 fw-8 tight tc" style={{ color: '#fff' }}>조항을 읽고 있어요</div>
        <div className="fs-14 mt-2 tc" style={{ color: '#aab7c7' }}>원룸 임대차계약서 · 3 / 12 조항</div>
        <div className="center" style={{ display: 'flex', gap: 8, marginTop: 32 }}>
          {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: 3, background: i < 2 ? '#3b7bf0' : 'rgba(255,255,255,0.2)' }}/>)}
        </div>

        <div className="card-dark mt-8" style={{ background: 'rgba(255,255,255,0.04)', padding: 24 }}>
          <div className="fs-11 fw-6" style={{ color: '#7ca4ec', textTransform: 'uppercase', letterSpacing: '0.1em' }}>기다리는 동안</div>
          <div className="fs-18 fw-7 mt-2 lh-2" style={{ color: '#fff' }}>
            "수리비는 전부 세입자 부담"이라고 썼다면?
          </div>
          <div className="fs-13 mt-3 lh-3" style={{ color: '#c6d1df' }}>
            민법 제623조상 임대인은 목적물을 사용·수익에 필요한 상태로 유지할 의무가 있어요. 구조적 하자나 노후에 의한 수리비까지 세입자에게 전가하는 조항은 <b style={{color:'#fff'}}>무효로 볼 여지</b>가 있어요.
          </div>
        </div>

        <div className="tc mt-5">
          <span className="row gap-2 ic-1 center fs-11" style={{ color: 'rgba(255,255,255,0.5)', display: 'inline-flex' }}>
            <div className="pulse" style={{ width: 6, height: 6, borderRadius: 3, background: '#3b7bf0' }}/>
            평균 12초 · 암호화 전송 중
          </span>
        </div>
      </div>
    </div>
  );
}

// ───────── Report ─────────
function ReportScreen({ nav, setSelected, selected }) {
  const [filter, setFilter] = useState('all');
  return (
    <>
      <div className="main page-enter">
        <div className="kicker">IMO.PDF · 2026-04-17 · 분석 완료</div>
        <div className="row between ic-1 mt-1 gap-4">
          <div className="fs-28 fw-8 tight nowrap">원룸 임대차계약서</div>
          <div className="row gap-2" style={{ flexShrink: 0 }}>
            <button className="btn btn-ghost btn-sm"><Ico name="share" size={12} color="currentColor"/>공유</button>
            <button className="btn btn-sm">수정안 내보내기</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 24 }}>
          {[
            { l: '총 조항', v: '12', c: 'var(--ink)' },
            { l: '주의 필요', v: '2', c: 'var(--risk-hi)' },
            { l: '확인 권장', v: '1', c: 'var(--risk-md)' },
            { l: '안전', v: '9', c: 'var(--risk-lo)' },
          ].map((it, i) => (
            <div key={i} className="card" style={{ padding: 16 }}>
              <div className="fs-11 sub" style={{ whiteSpace: 'nowrap' }}>{it.l}</div>
              <div className="fs-24 fw-8 mt-1" style={{ color: it.c }}>{it.v}</div>
            </div>
          ))}
        </div>

        <div className="row gap-2 mt-4">
          {[['all','전체 12'],['hi','주의 2'],['md','확인 1'],['lo','안전 9']].map(([id, label]) => (
            <span key={id} className={`pill ${filter === id ? 'on' : ''}`} onClick={() => setFilter(id)}>{label}</span>
          ))}
        </div>

        <div className="card mt-4" style={{ padding: 32 }}>
          <div className="doc">
            <h4>제5조 (수선의무)</h4>
            <p>
              본 건물의 <span className={`hl-hi ${selected === 'c5' ? 'hl-active' : ''}`} onClick={() => setSelected('c5')}>수선비 일체는 임차인이 부담</span>하며, 천재지변 등 불가항력적 사유로 발생한 피해도 임차인의 책임으로 한다.
            </p>
            <h4>제6조 (보증금 반환)</h4>
            <p>
              계약 종료 시 보증금은 원상복구 완료 후 <span className="hl-md" onClick={() => setSelected('c6')}>30일 이내에 반환</span>하는 것을 원칙으로 한다.
            </p>
            <h4>제7조 (계약 해지)</h4>
            <p>
              임차인이 차임을 <span className={`hl-hi ${selected === 'c7' ? 'hl-active' : ''}`} onClick={() => setSelected('c7')}>1회 이상 연체</span>한 경우 임대인은 즉시 본 계약을 해지할 수 있으며, 이에 대해 임차인은 이의를 제기하지 아니한다.
            </p>
            <h4>제8조 (원상복구)</h4>
            <p>
              임차인은 계약 종료 시 본 건물을 임차 당시의 상태로 원상복구하여 반환한다. 단, 자연적 노화 및 통상의 손모는 제외한다.
            </p>
          </div>
        </div>

        <div className="fs-16 fw-7 mt-5 nowrap">조항별 분석</div>
        <div className="col gap-2 mt-3" style={{ paddingBottom: 40 }}>
          <div className="card card-hover row between ic-1" onClick={() => { setSelected('c5'); nav('clause'); }}>
            <div className="col gap-1">
              <div className="fs-12 sub">제5조 · 수선의무</div>
              <div className="fs-15 fw-7">수선비 전가 조항 — 민법상 무효 가능성</div>
            </div>
            <span className="risk-tag risk-hi">주의 필요</span>
          </div>
          <div className="card card-hover row between ic-1" onClick={() => { setSelected('c7'); nav('clause'); }}>
            <div className="col gap-1">
              <div className="fs-12 sub">제7조 · 계약 해지</div>
              <div className="fs-15 fw-7">1회 연체만으로 해지 — 주임법 위반 소지</div>
            </div>
            <span className="risk-tag risk-hi">주의 필요</span>
          </div>
          <div className="card card-hover row between ic-1" onClick={() => { setSelected('c6'); }}>
            <div className="col gap-1">
              <div className="fs-12 sub">제6조 · 보증금 반환</div>
              <div className="fs-15 fw-7">반환기한 30일 — 법정 기한 확인 필요</div>
            </div>
            <span className="risk-tag risk-md">확인 권장</span>
          </div>
        </div>
      </div>

      <div className="ctx">
        {selected ? <ContextPanel id={selected} onDetail={() => nav('clause')} onClose={() => setSelected(null)}/> : <EmptyContext/>}
      </div>
    </>
  );
}

function EmptyContext() {
  return (
    <div>
      <div className="kicker">컨텍스트</div>
      <div className="fs-15 fw-7 mt-2">원문의 하이라이트를 클릭해보세요</div>
      <div className="fs-12 sub mt-2 lh-3">빨강은 주의가 필요한 조항, 노랑은 한번 확인해볼 조항이에요.</div>
      <div className="card mt-4" style={{ padding: 14, background: 'var(--line-2)', border: 'none' }}>
        <div className="fs-11 fw-7 sub">💡 팁</div>
        <div className="fs-12 mt-2 lh-3">분석 결과는 법률 자문이 아닌 참고 자료예요. 중요한 계약은 전문가 상담도 같이 받아보세요.</div>
      </div>
    </div>
  );
}

function ContextPanel({ id, onDetail, onClose }) {
  const data = {
    c5: { c: 'hi', n: '제5조 · 수선의무', t: '수선비 전가 조항', why: '민법 제623조상 임대인은 목적물의 사용·수익에 필요한 상태 유지 의무가 있어요. 노후·구조적 하자에 따른 수선비까지 세입자에게 전가하는 것은 무효 가능성이 높아요.', before: '수선비 일체는 임차인이 부담…', after: '구조적 하자 및 노후화에 따른 수선비는 임대인이 부담한다…' },
    c7: { c: 'hi', n: '제7조 · 계약 해지', t: '1회 연체 즉시 해지', why: '주택임대차보호법상 2기 차임 연체가 있어야 해지가 가능해요. 1회만으로 해지한다는 조항은 세입자에게 불리해 효력이 인정되지 않을 수 있어요.', before: '차임을 1회 이상 연체한 경우 임대인은 즉시 해지할 수 있다…', after: '임차인이 차임을 2기 이상 연체한 경우 임대인은 상당한 기간을 정하여 이행을 최고한 후 해지할 수 있다…' },
    c6: { c: 'md', n: '제6조 · 보증금 반환', t: '반환기한 30일', why: '법정 반환 기한은 명문이 없지만, 통상 계약 종료와 동시에 반환이 원칙이에요. 30일 유예는 과도할 수 있어요.', before: '보증금은 원상복구 완료 후 30일 이내에 반환…', after: '보증금은 임대차 종료 및 목적물 인도와 동시에 반환한다. 다만, 정당한 사유로 정산이 필요한 경우 14일 이내에…' },
  }[id];
  return (
    <div>
      <div className="row between ic-1">
        <div className="kicker">선택된 조항</div>
        <div style={{ cursor: 'pointer' }} onClick={onClose}><Ico name="close" size={14} color="var(--ink-3)"/></div>
      </div>
      <div className="row gap-2 ic-1 mt-3">
        <span className={`risk-tag risk-${data.c}`}>{data.c === 'hi' ? '주의 필요' : '확인 권장'}</span>
        <span className="fs-11 sub">{data.n}</span>
      </div>
      <div className="fs-18 fw-8 tight mt-2 lh-1">{data.t}</div>
      <div className="fs-13 mt-3 sub lh-3">{data.why}</div>

      <div className="mt-4" style={{ padding: 12, background: data.c === 'hi' ? 'var(--risk-hi-bg)' : 'var(--risk-md-bg)', borderRadius: 10 }}>
        <div className="fs-10 fw-7" style={{ color: data.c === 'hi' ? 'var(--risk-hi)' : 'var(--risk-md)', letterSpacing: '0.05em' }}>BEFORE</div>
        <div className="fs-12 mt-1 lh-3">{data.before}</div>
      </div>
      <div className="mt-2" style={{ padding: 12, background: 'var(--navy-soft)', borderRadius: 10 }}>
        <div className="fs-10 fw-7" style={{ color: 'var(--navy-2)', letterSpacing: '0.05em' }}>AFTER</div>
        <div className="fs-12 mt-1 lh-3">{data.after}</div>
      </div>

      <div className="kicker mt-5">관련 판례</div>
      <div className="card mt-2" style={{ padding: 12 }}>
        <div className="fs-12 fw-7">대법원 2011다96086</div>
        <div className="fs-11 sub mt-1">임차인 부담 특약의 무효 범위</div>
      </div>

      <button className="btn btn-sm mt-4" style={{ width: '100%' }} onClick={onDetail}>
        <Ico name="sparkle" size={12} color="#fff"/>
        상세 보기 · 전체 근거
      </button>
    </div>
  );
}

// ───────── Clause detail ─────────
function ClauseScreen({ nav, selected }) {
  const data = { c5: { n: '제5조 · 수선의무', t: '수선비 전가 조항' }, c7: { n: '제7조 · 계약 해지', t: '1회 연체 해지' }, c6: { n: '제6조 · 보증금 반환', t: '반환기한 30일' } }[selected || 'c5'];
  return (
    <div className="main narrow page-enter">
      <div className="row gap-2 ic-1 mt-1" style={{ cursor: 'pointer' }} onClick={() => nav('report')}>
        <Ico name="chevron" size={14} color="var(--ink-3)" stroke={2}/>
        <span className="fs-12 sub" style={{ transform: 'rotate(180deg)', display: 'inline-block' }}>← 리포트로</span>
      </div>
      <div className="row gap-2 ic-1 mt-4">
        <span className="risk-tag risk-hi">주의 필요</span>
        <span className="fs-12 sub">{data.n}</span>
      </div>
      <div className="fs-32 fw-8 tight mt-2">{data.t}</div>
      <div className="fs-14 sub mt-3 lh-3">이 조항은 임대인이 져야 할 기본적인 수선의무를 세입자에게 넘기고 있어요. 집주인과 조율해서 바꾸는 걸 추천드려요.</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 32, alignItems: 'stretch' }}>
        <div className="card" style={{ padding: 20, background: 'var(--risk-hi-bg)', borderColor: 'transparent' }}>
          <div className="row between ic-1">
            <div className="fs-11 fw-7" style={{ color: 'var(--risk-hi)', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>BEFORE · 원문</div>
            <Ico name="copy" size={14} color="var(--risk-hi)"/>
          </div>
          <div className="doc mt-3" style={{ fontSize: 14 }}>
            본 건물의 수선비 일체는 임차인이 부담하며, 천재지변 등 불가항력적 사유로 발생한 피해도 임차인의 책임으로 한다.
          </div>
        </div>
        <div className="card" style={{ padding: 20, background: 'var(--navy-soft)', borderColor: 'transparent' }}>
          <div className="row between ic-1">
            <div className="fs-11 fw-7" style={{ color: 'var(--navy-2)', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>AFTER · 제안 문구</div>
            <Ico name="copy" size={14} color="var(--navy-2)"/>
          </div>
          <div className="doc mt-3" style={{ fontSize: 14 }}>
            본 건물의 <b>구조적 하자 및 노후화에 따른 수선비는 임대인이 부담</b>하며, 임차인의 귀책사유로 인한 파손에 한하여 임차인이 부담한다. 천재지변 등 불가항력적 사유는 <b>민법 제537조에 따른다</b>.
          </div>
        </div>
      </div>

      <div className="kicker mt-6">법적 근거</div>
      <div className="card mt-2" style={{ padding: 16, background: 'var(--line-2)', border: 'none' }}>
        <div className="fs-13 fw-7">민법 제623조 (임대인의 의무)</div>
        <div className="fs-13 mt-2 sub lh-3">임대인은 목적물을 임차인에게 인도하고 계약 존속 중 그 사용, 수익에 필요한 상태를 유지하게 할 의무를 부담한다.</div>
      </div>

      <div className="fs-16 fw-7 mt-6 nowrap">비슷한 판례</div>
      <div className="card mt-3 card-hover row between ic-1">
        <div className="col gap-1">
          <div className="fs-13 fw-7">대법원 2011다96086</div>
          <div className="fs-12 sub">임차인 부담 특약의 무효 범위</div>
        </div>
        <Ico name="chevron" size={14} color="var(--ink-3)"/>
      </div>

      <div className="row gap-2 mt-5" style={{ paddingBottom: 40 }}>
        <button className="btn btn-ghost"><Ico name="copy" size={12} color="currentColor"/>제안 문구 복사</button>
        <button className="btn"><Ico name="share" size={12} color="#fff"/>집주인에게 공유</button>
      </div>
    </div>
  );
}

// ───────── Feed ─────────
function FeedScreen({ nav }) {
  const [active, setActive] = useState(0);
  const tags = ['전체', '임대차', '근로', '계약', '금융', '부동산'];
  const qas = [
    { cat: '임대차', title: '월세 밀렸을 때 집주인이 바로 쫓아낼 수 있나요?', sum: '2기 차임 연체 시 해지 가능. 즉시 퇴거는 불법이에요.', views: '12.4k', trend: true },
    { cat: '근로', title: '퇴사 후 경업금지 조항, 꼭 지켜야 하나요?', sum: '지역·기간·직종이 합리적이어야 효력 있어요. 무제한 금지는 무효.', views: '8.1k' },
    { cat: '계약', title: '계약금 10% 걸었는데 계약이 깨졌어요', sum: '누가 계약을 해제했는지에 따라 배액상환 or 포기.', views: '6.7k' },
    { cat: '임대차', title: '전세보증금 돌려받을 때 알아야 할 4가지', sum: '대항력 · 우선변제권 · 임차권등기 · 전세권 차이 정리.', views: '5.2k' },
    { cat: '금융', title: '카드 리볼빙, 왜 위험한가요?', sum: '최소결제액 ≠ 최저 납부. 이자율 20% 수준.', views: '4.8k' },
    { cat: '근로', title: '포괄임금제, 내 야근수당은 어디로?', sum: '실근로시간 기록은 꼭 남기세요.', views: '4.2k' },
  ];
  return (
    <div className="main page-enter">
      <div className="kicker">법률 팁</div>
      <div className="fs-28 fw-8 tight mt-1">사회초년생의 법률 Q&A</div>

      <div className="card mt-4 row gap-3 ic-1" style={{ padding: '14px 18px' }}>
        <Ico name="search" size={16} color="var(--ink-3)"/>
        <span className="fs-14 sub grow">궁금한 상황을 검색해보세요 — 예: "계약금 못 돌려받아요"</span>
        <span className="pill">⌘K</span>
      </div>

      <div className="row gap-2 mt-4">
        {tags.map((t, i) => (
          <span key={t} className={`pill ${i === active ? 'on' : ''}`} onClick={() => setActive(i)}>{t}</span>
        ))}
      </div>

      <div className="card-dark mt-5" style={{ padding: 28, display: 'grid', gridTemplateColumns: '1fr auto', gap: 20, alignItems: 'center' }}>
        <div>
          <div className="fs-11 fw-6" style={{ color: '#7ca4ec' }}>이번 주 추천</div>
          <div className="fs-20 fw-8 mt-2 lh-1 tight" style={{ color: '#fff' }}>사회초년생이 꼭 알아야 할 계약서 5가지</div>
          <div className="fs-13 mt-2" style={{ color: '#aab7c7' }}>근로 · 임대 · 통신 · 보험 · 투자 — 5분 안에 핵심만.</div>
        </div>
        <button className="btn btn-white">읽기 →</button>
      </div>

      <div className="fs-16 fw-7 mt-6 nowrap">많이 본 질문</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginTop: 12, paddingBottom: 40 }}>
        {qas.map((q, i) => (
          <div key={i} className="card card-hover col gap-2">
            <div className="row between ic-1">
              <span className="pill">#{q.cat}</span>
              {q.trend && <span className="fs-11 fw-7 nowrap" style={{ color: 'var(--navy-2)' }}>이주의 인기</span>}
            </div>
            <div className="fs-15 fw-7 lh-2">{q.title}</div>
            <div className="fs-12 sub lh-2">{q.sum}</div>
            <div className="row gap-3 mt-1 ic-1" style={{ color: 'var(--ink-3)' }}>
              <span className="row gap-1 ic-1 fs-11"><Ico name="eye" size={12} color="currentColor"/>{q.views}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ───────── My ─────────
function MyScreen({ nav, dark, setDark }) {
  return (
    <div className="main narrow page-enter">
      <div className="kicker">내 정보</div>
      <div className="fs-28 fw-8 tight mt-1">계정 · 설정</div>

      <div className="card mt-4 row gap-3 ic-1" style={{ padding: 18 }}>
        <div style={{ width: 56, height: 56, borderRadius: 28, background: 'var(--navy-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Ico name="user" size={24} color="var(--navy-2)"/>
        </div>
        <div className="grow col gap-1">
          <div className="fs-16 fw-7">김지훈님</div>
          <div className="fs-12 sub">jihoon@example.com</div>
        </div>
        <button className="btn btn-ghost btn-sm">프로필 편집</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 12 }}>
        <div className="card" style={{ padding: 16 }}>
          <div className="fs-20 fw-8" style={{ color: 'var(--navy-2)' }}>12</div>
          <div className="fs-11 sub mt-1">분석한 계약</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div className="fs-20 fw-8">28</div>
          <div className="fs-11 sub mt-1">저장한 팁</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div className="fs-20 fw-8">5</div>
          <div className="fs-11 sub mt-1">연속 학습</div>
        </div>
      </div>

      <div className="card-dark mt-4 row between ic-1" style={{ padding: 20 }}>
        <div className="col gap-1">
          <div className="fs-11 fw-6" style={{ color: '#7ca4ec' }}>PRO 멤버십</div>
          <div className="fs-16 fw-7" style={{ color: '#fff' }}>무제한 분석 · 전문가 연결</div>
        </div>
        <button className="btn btn-white">시작하기</button>
      </div>

      <div className="fs-16 fw-7 mt-6 nowrap">환경설정</div>
      <div className="card mt-3" style={{ padding: 4 }}>
        <div className="row between ic-1" style={{ padding: '14px 16px', borderBottom: '1px solid var(--line-2)' }}>
          <div className="row gap-3 ic-1">
            <Ico name={dark ? 'moon' : 'sun'} size={16} color="var(--ink)"/>
            <div className="fs-14 fw-6">다크모드</div>
          </div>
          <div className={`toggle ${dark ? 'on' : ''}`} onClick={() => setDark(!dark)}/>
        </div>
        {['내 분석 기록', '저장한 팁', '전문가 상담 내역', '알림 설정', '고객센터', '이용약관 · 개인정보'].map((t, i, arr) => (
          <div key={i} className="row between ic-1" style={{ padding: '14px 16px', borderBottom: i < arr.length - 1 ? '1px solid var(--line-2)' : 'none', cursor: 'pointer' }}>
            <div className="fs-14 fw-6">{t}</div>
            <Ico name="chevron" size={14} color="var(--ink-3)"/>
          </div>
        ))}
      </div>
      <div className="fs-11 sub tc mt-5" style={{ paddingBottom: 40 }}>RD · v1.0.0</div>
    </div>
  );
}

// ───────── App ─────────
function App() {
  const [tweaks, setTweaks] = useState(TWEAK_DEFAULTS);
  const [screen, setScreen] = useState(() => { try { return localStorage.getItem('rd-web-screen') || 'home'; } catch { return 'home'; } });
  const [selected, setSelected] = useState(null);
  const [showTweaks, setShowTweaks] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tweaks.darkMode ? 'dark' : 'light');
  }, [tweaks.darkMode]);

  useEffect(() => { try { localStorage.setItem('rd-web-screen', screen); } catch {} }, [screen]);

  useEffect(() => {
    function onMsg(e) {
      if (e.data?.type === '__activate_edit_mode') setEditMode(true);
      if (e.data?.type === '__deactivate_edit_mode') setEditMode(false);
    }
    window.addEventListener('message', onMsg);
    window.parent.postMessage({type: '__edit_mode_available'}, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const nav = (next) => { setScreen(next); if (next !== 'report' && next !== 'clause') setSelected(null); };
  const updateTweak = (key, value) => {
    const next = { ...tweaks, [key]: value };
    setTweaks(next);
    window.parent.postMessage({type: '__edit_mode_set_keys', edits: { [key]: value }}, '*');
  };

  if (screen === 'loading') return <LoadingScreen nav={nav}/>;

  const withCtx = screen === 'report';

  return (
    <>
      <div className={`app ${withCtx ? 'with-ctx' : ''}`}>
        <Sidebar screen={screen} nav={nav}/>
        {screen === 'home' && <HomeScreen nav={nav}/>}
        {screen === 'upload' && <UploadScreen nav={nav}/>}
        {screen === 'report' && <ReportScreen nav={nav} selected={selected} setSelected={setSelected}/>}
        {screen === 'clause' && <ClauseScreen nav={nav} selected={selected}/>}
        {screen === 'feed' && <FeedScreen nav={nav}/>}
        {screen === 'my' && <MyScreen nav={nav} dark={tweaks.darkMode} setDark={(v) => updateTweak('darkMode', v)}/>}
      </div>

      {editMode && (
        <>
          <button className="tweaks-btn" onClick={() => setShowTweaks(!showTweaks)}>
            Tweaks {showTweaks ? '▾' : '▴'}
          </button>
          {showTweaks && (
            <div className="tweaks-panel">
              <h3>Tweaks</h3>
              <div className="tweaks-row">
                <span>다크모드</span>
                <div className={`toggle ${tweaks.darkMode ? 'on' : ''}`} onClick={() => updateTweak('darkMode', !tweaks.darkMode)}/>
              </div>
              <div className="tweaks-row">
                <span>홈으로 리셋</span>
                <button className="btn btn-ghost btn-sm" onClick={() => nav('home')}>↺</button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
