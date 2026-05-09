// Interactive prototype app — drives all screens with React state

const { useState, useEffect, useRef } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "darkMode": false,
  "showHints": true
}/*EDITMODE-END*/;

// -- Home
function HomeScreen({ nav }) {
  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <div className="body-scroll" style={{ paddingBottom: 90 }}>
        <div className="row between ic-1" style={{ padding: '8px 0 16px' }}>
          <div className="fs-20 fw-8 tight">RD</div>
          <div className="row gap-3 ic-1">
            <Ico name="search" size={18} color="var(--ink)"/>
            <Ico name="bell" size={18} color="var(--ink)"/>
          </div>
        </div>

        <div className="card-dark">
          <div className="fs-11 fw-6" style={{ color: '#7ca4ec', letterSpacing: '0.05em' }}>계약서, 이제 혼자 보지 마세요</div>
          <div className="fs-22 fw-8 lh-1 tight mt-2" style={{ color: '#fff' }}>사진 한 장이면<br/>독소조항을 찾아드려요</div>
          <div className="fs-12 mt-3" style={{ color: '#aab7c7', lineHeight: 1.6 }}>임대차 · 근로 · 용역 · 위임<br/>평균 12초면 분석이 끝나요</div>
          <button className="btn btn-white btn-lg mt-4" style={{ width: '100%' }} onClick={() => nav('upload')}>
            계약서 불러오기
          </button>
          <div className="row gap-2 mt-3 ic-1 center fs-11" style={{ color: '#aab7c7' }}>
            <Ico name="sparkle" size={12} color="#7ca4ec"/>
            <span>누적 184,203건 분석됨</span>
          </div>
        </div>

        <div className="row between ic-1 mt-5">
          <div className="fs-15 fw-7">최근 분석</div>
          <div className="fs-12 sub row ic-1 gap-1">전체 <Ico name="chevron" size={12} color="var(--ink-3)"/></div>
        </div>
        <div className="col gap-2 mt-3">
          <div className="card card-hover row gap-3 ic-1" onClick={() => nav('report')}>
            <div style={{ width: 42, height: 52, background: 'var(--line-2)', borderRadius: 6, flexShrink: 0, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Ico name="doc" size={20} color="var(--ink-3)"/>
            </div>
            <div className="grow col gap-1">
              <div className="fs-14 fw-7">원룸 임대차계약서</div>
              <div className="fs-11 sub">어제 · 12개 조항 · 2개 주의</div>
            </div>
            <RiskTag level="hi"/>
          </div>
          <div className="card card-hover row gap-3 ic-1">
            <div style={{ width: 42, height: 52, background: 'var(--line-2)', borderRadius: 6, flexShrink: 0, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Ico name="doc" size={20} color="var(--ink-3)"/>
            </div>
            <div className="grow col gap-1">
              <div className="fs-14 fw-7">프리랜서 용역계약</div>
              <div className="fs-11 sub">3일 전 · 8개 조항 · 1개 확인</div>
            </div>
            <RiskTag level="md"/>
          </div>
        </div>

        <div className="row between ic-1 mt-5">
          <div className="fs-15 fw-7">오늘의 법률 팁</div>
          <div className="pill">매일 새로고침</div>
        </div>
        <div className="card card-hover mt-3" style={{ padding: 18 }} onClick={() => nav('feed')}>
          <div className="fs-11 fw-6" style={{ color: 'var(--navy-2)', letterSpacing: '0.04em' }}>APR 18 · 임대차</div>
          <div className="fs-15 fw-7 mt-2 lh-2">보증금 못 돌려받을 때,<br/>임차권등기명령부터 해보세요</div>
          <div className="fs-12 sub mt-2 lh-3">이사 가도 대항력이 유지돼요. 보증금 5천만원 이하면 소액보증금 최우선변제도 가능.</div>
          <div className="row gap-2 mt-3">
            <span className="pill">#보증금</span><span className="pill">#임대차</span>
          </div>
        </div>
      </div>
      <TabBarNav active="home" nav={nav}/>
    </div>
  );
}

// -- Upload
function UploadScreen({ nav }) {
  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <div className="body-scroll">
        <div className="row between ic-1" style={{ padding: '8px 0 16px' }}>
          <button onClick={() => nav('home')} style={{ background:'none', border:'none', padding:0, cursor:'pointer' }}>
            <Ico name="back" size={18} color="var(--ink)"/>
          </button>
          <div className="fs-13 fw-7">계약서 불러오기</div>
          <div style={{ width: 18 }}/>
        </div>
        <div className="fs-22 fw-8 tight mt-2 lh-1">어떻게 가져오실래요?</div>
        <div className="fs-13 sub mt-2 lh-2">원본이 깨끗할수록 더 정확히 분석해드려요.</div>

        <div className="col gap-3 mt-5">
          <div className="card card-hover row gap-3 ic-1" style={{ padding: 18 }} onClick={() => nav('loading')}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--navy-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Ico name="camera" size={22} color="var(--navy-2)"/>
            </div>
            <div className="grow col gap-1">
              <div className="fs-15 fw-7">사진으로 찍기</div>
              <div className="fs-12 sub lh-2">종이 계약서를 찍어서 바로 분석</div>
            </div>
            <Ico name="chevron" size={14} color="var(--ink-3)"/>
          </div>
          <div className="card card-hover row gap-3 ic-1" style={{ padding: 18 }} onClick={() => nav('loading')}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Ico name="doc" size={22} color="var(--ink-2)"/>
            </div>
            <div className="grow col gap-1">
              <div className="fs-15 fw-7">PDF · 이미지</div>
              <div className="fs-12 sub lh-2">파일에서 불러오기</div>
            </div>
            <Ico name="chevron" size={14} color="var(--ink-3)"/>
          </div>
          <div className="card card-hover row gap-3 ic-1" style={{ padding: 18 }} onClick={() => nav('loading')}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Ico name="edit" size={22} color="var(--ink-2)"/>
            </div>
            <div className="grow col gap-1">
              <div className="fs-15 fw-7">직접 붙여넣기</div>
              <div className="fs-12 sub lh-2">복사한 텍스트를 그대로</div>
            </div>
            <Ico name="chevron" size={14} color="var(--ink-3)"/>
          </div>
        </div>

        <div className="card mt-5" style={{ padding: 16, background: 'var(--line-2)', border: 'none' }}>
          <div className="fs-12 fw-7">좋은 결과를 위한 팁</div>
          <div className="col gap-2 mt-2">
            {['밝은 곳에서 평평하게 펴고 촬영', '페이지가 잘리지 않도록 전체 포함', '글자가 선명하게 보이는 각도로'].map((t, i) => (
              <div key={i} className="row gap-2 ic-1">
                <div style={{ width: 16, height: 16, borderRadius: 8, background: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 9, fontWeight: 700, color: 'var(--navy-2)' }}>{i+1}</div>
                <div className="fs-12 sub">{t}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="row gap-2 mt-4 ic-1" style={{ padding: '0 4px' }}>
          <Ico name="shield" size={12} color="var(--ink-3)"/>
          <div className="fs-11 sub">업로드한 파일은 분석 후 삭제돼요</div>
        </div>
      </div>
    </div>
  );
}

// -- Loading (auto-advances)
function LoadingScreen({ nav }) {
  useEffect(() => {
    const t = setTimeout(() => nav('report'), 3200);
    return () => clearTimeout(t);
  }, [nav]);
  return (
    <div style={{ height: '100%', position: 'relative', background: '#0d1524' }}>
      <div className="body-scroll" style={{ padding: '0 4px', color: '#fff' }}>
        <div className="row between ic-1" style={{ padding: '8px 4px 0' }}>
          <button onClick={() => nav('upload')} style={{ background:'none', border:'none', padding:0, cursor:'pointer' }}>
            <Ico name="close" size={18} color="#fff"/>
          </button>
          <div className="fs-13 fw-6" style={{ color: '#aab7c7' }}>분석 중</div>
          <div style={{ width: 18 }}/>
        </div>
        <div style={{ marginTop: 36, textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, margin: '0 auto', borderRadius: 36, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#3b7bf0', animation: 'spin 1s linear infinite' }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
          <div className="fs-18 fw-7 mt-4 tight">조항을 읽고 있어요</div>
          <div className="fs-13 mt-2" style={{ color: '#aab7c7' }}>원룸 임대차계약서 · 3 / 12 조항</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32 }}>
          {[0, 1, 2].map(i => (<div key={i} style={{ width: 6, height: 6, borderRadius: 3, background: i < 2 ? '#3b7bf0' : 'rgba(255,255,255,0.2)' }}/>))}
        </div>
        <div style={{ marginTop: 40, padding: '0 16px' }}>
          <div className="fs-11 fw-6" style={{ color: '#7ca4ec', letterSpacing: '0.1em', textTransform: 'uppercase' }}>기다리는 동안</div>
          <div className="fs-16 fw-7 mt-2 lh-2" style={{ color: '#fff' }}>
            임대인이 "수리비는 전부 세입자 부담"이라고 썼다면?
          </div>
          <div className="fs-13 mt-3 lh-3" style={{ color: '#c6d1df' }}>
            민법 제623조상 임대인은 목적물을 사용·수익에 필요한 상태로 유지할 의무가 있어요. 구조적 하자나 노후에 의한 수리비까지 세입자에게 전가하는 조항은 <b style={{color:'#fff'}}>무효로 볼 여지</b>가 있어요.
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

// -- Report with tappable highlights
function ReportScreen({ nav }) {
  const [sheet, setSheet] = useState(null);
  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <div className="body-scroll" style={{ paddingBottom: 90 }}>
        <div className="row between ic-1" style={{ padding: '8px 0 12px' }}>
          <button onClick={() => nav('home')} style={{ background:'none', border:'none', padding:0, cursor:'pointer' }}>
            <Ico name="back" size={18} color="var(--ink)"/>
          </button>
          <div className="fs-13 fw-7">분석 결과</div>
          <Ico name="share" size={16} color="var(--ink)"/>
        </div>

        <div className="card">
          <div className="row between ic-1">
            <div className="col gap-1">
              <div className="fs-11 fw-6 sub" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>문서 개요</div>
              <div className="fs-15 fw-7">원룸 임대차계약서</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="fs-20 fw-8 lh-1" style={{ color: 'var(--risk-hi)', fontSize: 24 }}>2</div>
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
            <span>총 12개</span>
          </div>
        </div>

        <div className="row gap-2 mt-3">
          <div className="pill pill-nav">전체 12</div>
          <div className="pill">주의 2</div>
          <div className="pill">확인 1</div>
        </div>

        <div className="card mt-3" style={{ padding: 18 }}>
          <div className="fs-11 fw-6 sub" style={{ letterSpacing: '0.05em' }}>원문 · 제5조 ~ 제7조</div>
          <div className="doc mt-3">
            <div style={{ fontWeight: 700, marginBottom: 6 }}>제5조 (수선의무)</div>
            <p style={{ margin: '0 0 14px' }}>
              본 건물의 <span className="hl-hi" onClick={() => setSheet('c5')}>수선비 일체는 임차인이 부담</span>하며, 천재지변 등 불가항력적 사유로 발생한 피해도 임차인의 책임으로 한다.
            </p>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>제6조 (보증금 반환)</div>
            <p style={{ margin: '0 0 14px' }}>
              계약 종료 시 보증금은 원상복구 완료 후 <span className="hl-md">30일 이내에 반환</span>하는 것을 원칙으로 한다.
            </p>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>제7조 (계약 해지)</div>
            <p style={{ margin: '0 0 14px' }}>
              임차인이 차임을 <span className="hl-hi" onClick={() => setSheet('c7')}>1회 이상 연체</span>한 경우 임대인은 즉시 본 계약을 해지할 수 있으며, 이에 대해 임차인은 이의를 제기하지 아니한다.
            </p>
          </div>
        </div>

        <div className="fs-13 fw-7 mt-5">조항별 분석</div>
        <div className="col gap-2 mt-2">
          <div className="card card-hover col gap-2" onClick={() => nav('clause')}>
            <div className="row between ic-1">
              <div className="fs-12 sub">제5조 · 수선의무</div>
              <RiskTag level="hi"/>
            </div>
            <div className="fs-14 fw-7 lh-2">수선비 전가 조항 — 민법상 무효 가능성</div>
          </div>
          <div className="card card-hover col gap-2" onClick={() => nav('clause')}>
            <div className="row between ic-1">
              <div className="fs-12 sub">제7조 · 계약 해지</div>
              <RiskTag level="hi"/>
            </div>
            <div className="fs-14 fw-7 lh-2">1회 연체만으로 해지 — 주임법 위반 소지</div>
          </div>
        </div>
      </div>
      <TabBarNav active="analyze" nav={nav}/>

      {sheet && <ClauseSheet id={sheet} onClose={() => setSheet(null)} onDetail={() => { setSheet(null); nav('clause'); }}/>}
    </div>
  );
}

function ClauseSheet({ id, onClose, onDetail }) {
  return (
    <div className="overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 20 }} onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: 'var(--paper)', borderRadius: '24px 24px 0 0', padding: 20, maxHeight: '72%', overflow: 'auto' }}>
        <div style={{ width: 36, height: 4, background: 'var(--line)', borderRadius: 2, margin: '0 auto 16px' }}/>
        <div className="row between ic-1">
          <div className="fs-12 sub">{id === 'c5' ? '제5조 · 수선의무' : '제7조 · 계약 해지'}</div>
          <RiskTag level="hi"/>
        </div>
        <div className="fs-18 fw-8 tight mt-2" style={{ color: 'var(--ink)' }}>
          {id === 'c5' ? '"수선비 일체는 임차인이 부담"' : '"1회 이상 연체 시 즉시 해지"'}
        </div>
        <div className="fs-12 fw-6 mt-4" style={{ color: 'var(--navy-2)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>왜 주의해야 하나요</div>
        <div className="fs-13 mt-2 lh-3 sub">
          {id === 'c5'
            ? <>민법 제623조는 임대인의 수선의무를 정하고 있어요. 구조적 하자, 노후화로 인한 수리비까지 세입자에게 떠넘기는 조항은 <b style={{color:'var(--ink)'}}>무효</b>로 볼 수 있어요.</>
            : <>주택임대차보호법상 <b style={{color:'var(--ink)'}}>2기 차임 연체</b>가 있어야 해지 가능해요. 1회만으로 해지한다는 조항은 세입자에게 불리해 효력이 인정되지 않을 수 있어요.</>}
        </div>
        <div className="row gap-2 mt-4">
          <button className="btn btn-ghost btn-sm grow" onClick={onClose}>닫기</button>
          <button className="btn btn-sm grow" onClick={onDetail}>수정안 보기</button>
        </div>
      </div>
    </div>
  );
}

// -- Clause detail
function ClauseScreen({ nav }) {
  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <div className="body-scroll">
        <div className="row between ic-1" style={{ padding: '8px 0 12px' }}>
          <button onClick={() => nav('report')} style={{ background:'none', border:'none', padding:0, cursor:'pointer' }}>
            <Ico name="back" size={18} color="var(--ink)"/>
          </button>
          <div className="fs-13 fw-7">조항 상세</div>
          <Ico name="share" size={16} color="var(--ink)"/>
        </div>
        <div className="row between ic-1 mt-2">
          <div className="fs-11 sub">제5조 · 수선의무</div>
          <RiskTag level="hi"/>
        </div>
        <div className="fs-20 fw-8 tight mt-2 lh-1">수선비 전가 조항</div>
        <div className="fs-13 mt-2 sub lh-3">
          이 조항은 임대인이 져야 할 기본적인 수선의무를 세입자에게 넘기고 있어요. 집주인과 조율해서 바꾸는 걸 추천드려요.
        </div>

        <div className="card mt-4" style={{ padding: 14, background: 'var(--risk-hi-bg)', borderColor: 'transparent' }}>
          <div className="row between ic-1">
            <div className="fs-11 fw-7" style={{ color: 'var(--risk-hi)', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>BEFORE · 원문</div>
            <Ico name="copy" size={14} color="var(--risk-hi)"/>
          </div>
          <div className="doc mt-2" style={{ fontSize: 13 }}>
            본 건물의 수선비 일체는 임차인이 부담하며, 천재지변 등 불가항력적 사유로 발생한 피해도 임차인의 책임으로 한다.
          </div>
        </div>

        <div className="center" style={{ display: 'flex', padding: '10px 0' }}>
          <div style={{ width: 36, height: 36, borderRadius: 18, background: 'var(--navy-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(90deg)' }}>
            <Ico name="chevron" size={16} color="var(--navy-2)"/>
          </div>
        </div>

        <div className="card" style={{ padding: 14, background: 'var(--navy-soft)', borderColor: 'transparent' }}>
          <div className="row between ic-1">
            <div className="fs-11 fw-7" style={{ color: 'var(--navy-2)', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>AFTER · 제안 문구</div>
            <Ico name="copy" size={14} color="var(--navy-2)"/>
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

        <div className="row gap-2 mt-4" style={{ paddingBottom: 20 }}>
          <button className="btn btn-ghost grow">복사</button>
          <button className="btn grow">집주인에게 공유</button>
        </div>
      </div>
    </div>
  );
}

// -- Feed
function FeedScreen({ nav }) {
  const tags = ['전체', '임대차', '근로', '계약', '금융', '부동산'];
  const [active, setActive] = useState(0);
  const qas = [
    { cat: '임대차', title: '월세 밀렸을 때 집주인이 바로 쫓아낼 수 있나요?', sum: '2기 차임 연체 시 해지 가능. 즉시 퇴거는 불법이에요.', views: '12.4k', trend: true },
    { cat: '근로', title: '퇴사 후 경업금지 조항, 꼭 지켜야 하나요?', sum: '지역·기간·직종이 합리적이어야 효력 있어요.', views: '8.1k' },
    { cat: '계약', title: '계약금 10% 걸었는데 계약이 깨졌어요', sum: '누가 계약을 해제했는지에 따라 배액상환 or 포기.', views: '6.7k' },
    { cat: '임대차', title: '전세보증금 돌려받을 때 알아야 할 4가지', sum: '대항력 · 우선변제권 · 임차권등기 · 전세권 정리.', views: '5.2k' },
  ];
  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <div className="body-scroll" style={{ paddingBottom: 90 }}>
        <div className="row between ic-1" style={{ padding: '8px 0 16px' }}>
          <div className="fs-20 fw-8 tight">법률 팁</div>
          <Ico name="search" size={18} color="var(--ink)"/>
        </div>
        <div style={{ background: 'var(--line-2)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Ico name="search" size={14} color="var(--ink-3)"/>
          <span className="fs-13 sub">궁금한 상황을 검색해보세요</span>
        </div>
        <div className="row gap-2 mt-4" style={{ overflowX: 'auto', paddingBottom: 4 }}>
          {tags.map((t, i) => (
            <span key={t} className={`pill ${i === active ? 'pill-nav' : ''}`} style={{ flexShrink: 0 }} onClick={() => setActive(i)}>{t}</span>
          ))}
        </div>
        <div className="card-dark mt-4" style={{ padding: 18, borderRadius: 16 }}>
          <div className="fs-11 fw-6" style={{ color: '#7ca4ec', letterSpacing: '0.05em' }}>이번 주 추천</div>
          <div className="fs-16 fw-8 mt-2 lh-1 tight" style={{ color: '#fff' }}>
            사회초년생이 꼭 알아야 할<br/>계약서 5가지
          </div>
          <div className="fs-12 mt-2" style={{ color: '#aab7c7' }}>근로 · 임대 · 통신 · 보험 · 투자</div>
        </div>
        <div className="fs-13 fw-7 mt-5">많이 본 질문</div>
        <div className="col gap-2 mt-3">
          {qas.map((q, i) => (
            <div key={i} className="card card-hover col gap-2">
              <div className="row between ic-1">
                <span className="pill">#{q.cat}</span>
                {q.trend && <span className="fs-11 fw-7" style={{ color: 'var(--navy-2)' }}>이주의 인기</span>}
              </div>
              <div className="fs-14 fw-7 lh-2">{q.title}</div>
              <div className="fs-12 sub lh-2">{q.sum}</div>
              <div className="row gap-3 mt-1 ic-1" style={{ color: 'var(--ink-3)' }}>
                <span className="row gap-1 ic-1 fs-11"><Ico name="eye" size={12} color="var(--ink-3)"/>{q.views}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <TabBarNav active="feed" nav={nav}/>
    </div>
  );
}

// -- My
function MyScreen({ nav, dark, setDark }) {
  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <div className="body-scroll" style={{ paddingBottom: 90 }}>
        <div className="row between ic-1" style={{ padding: '8px 0 16px' }}>
          <div className="fs-20 fw-8 tight">내 정보</div>
          <Ico name="settings" size={18} color="var(--ink)"/>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <div className="row gap-3 ic-1">
            <Ico name="avatar" size={18}/>
            <div className="grow col gap-1">
              <div className="fs-15 fw-7">김지훈님</div>
              <div className="fs-12 sub">jihoon@example.com</div>
            </div>
            <Ico name="chevron" size={14} color="var(--ink-3)"/>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 12 }}>
          <div className="card tc" style={{ padding: 14 }}><div className="fs-20 fw-8" style={{ color: 'var(--navy-2)' }}>12</div><div className="fs-11 sub mt-1">분석한 계약</div></div>
          <div className="card tc" style={{ padding: 14 }}><div className="fs-20 fw-8">28</div><div className="fs-11 sub mt-1">저장한 팁</div></div>
          <div className="card tc" style={{ padding: 14 }}><div className="fs-20 fw-8">5</div><div className="fs-11 sub mt-1">연속 학습</div></div>
        </div>
        <div className="card-dark mt-4" style={{ padding: 18, borderRadius: 16 }}>
          <div className="row between ic-1">
            <div className="col gap-1">
              <div className="fs-11 fw-6" style={{ color: '#7ca4ec', letterSpacing: '0.05em' }}>PRO 멤버십</div>
              <div className="fs-15 fw-7" style={{ color: '#fff' }}>무제한 분석 · 전문가 연결</div>
            </div>
            <button className="btn btn-white btn-sm">시작하기</button>
          </div>
        </div>
        <div className="col gap-1 mt-4">
          <div className="row between ic-1" style={{ padding: '14px 4px', borderBottom: '1px solid var(--line-2)' }}>
            <div className="row gap-3 ic-1"><Ico name={dark ? 'moon' : 'sun'} size={14} color="var(--ink)"/><div className="fs-14 fw-5">다크모드</div></div>
            <div className={`toggle ${dark ? 'on' : ''}`} onClick={() => setDark(!dark)}/>
          </div>
          {['내 분석 기록', '저장한 팁', '전문가 상담 내역', '알림 설정', '고객센터', '이용약관 · 개인정보'].map((t, i) => (
            <div key={i} className="row between ic-1 card-hover" style={{ padding: '14px 4px', borderBottom: '1px solid var(--line-2)' }}>
              <div className="fs-14 fw-5">{t}</div>
              <Ico name="chevron" size={14} color="var(--ink-3)"/>
            </div>
          ))}
        </div>
        <div className="fs-11 sub tc mt-5">RD · v1.0.0</div>
      </div>
      <TabBarNav active="me" nav={nav}/>
    </div>
  );
}

// -- Shared nav tab bar
function TabBarNav({ active, nav }) {
  const items = [
    { id: 'home', t: '홈', route: 'home' },
    { id: 'analyze', t: '분석', route: 'report' },
    { id: 'feed', t: '법률팁', route: 'feed' },
    { id: 'me', t: '내 정보', route: 'my' },
  ];
  return (
    <div className="tab-bar">
      {items.map(it => (
        <button key={it.id} className={`t ${it.id === active ? 'on' : ''}`} onClick={() => nav(it.route)}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: 'currentColor', opacity: 0.9 }}/>
          <div>{it.t}</div>
        </button>
      ))}
    </div>
  );
}

// -- App
function App() {
  const [tweaks, setTweaks] = useState(TWEAK_DEFAULTS);
  const [screen, setScreen] = useState(() => {
    try { return localStorage.getItem('rd-screen') || 'home'; } catch { return 'home'; }
  });
  const [showTweaks, setShowTweaks] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const prevScreen = useRef(screen);
  const dir = useRef('fwd');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tweaks.darkMode ? 'dark' : 'light');
  }, [tweaks.darkMode]);

  useEffect(() => {
    try { localStorage.setItem('rd-screen', screen); } catch {}
  }, [screen]);

  useEffect(() => {
    function onMsg(e) {
      if (e.data?.type === '__activate_edit_mode') setEditMode(true);
      if (e.data?.type === '__deactivate_edit_mode') setEditMode(false);
    }
    window.addEventListener('message', onMsg);
    window.parent.postMessage({type: '__edit_mode_available'}, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const order = ['home', 'upload', 'loading', 'report', 'clause', 'feed', 'my'];
  const nav = (next) => {
    dir.current = order.indexOf(next) >= order.indexOf(screen) ? 'fwd' : 'back';
    prevScreen.current = screen;
    setScreen(next);
  };

  const updateTweak = (key, value) => {
    const next = { ...tweaks, [key]: value };
    setTweaks(next);
    window.parent.postMessage({type: '__edit_mode_set_keys', edits: { [key]: value }}, '*');
  };

  const key = screen + '|' + dir.current;

  const renderScreen = () => {
    switch (screen) {
      case 'home': return <HomeScreen nav={nav}/>;
      case 'upload': return <UploadScreen nav={nav}/>;
      case 'loading': return <LoadingScreen nav={nav}/>;
      case 'report': return <ReportScreen nav={nav}/>;
      case 'clause': return <ClauseScreen nav={nav}/>;
      case 'feed': return <FeedScreen nav={nav}/>;
      case 'my': return <MyScreen nav={nav} dark={tweaks.darkMode} setDark={(v) => updateTweak('darkMode', v)}/>;
      default: return <HomeScreen nav={nav}/>;
    }
  };

  return (
    <>
      {tweaks.showHints && (
        <div className="hint">
          <b>RD 프로토타입</b><br/>
          홈 → 업로드 → 로딩 → 리포트 → 조항. 원문 하이라이트 탭하면 바텀시트, 탭바로 이동 가능. 우하단에서 다크모드 전환.
        </div>
      )}

      <div className="phone">
        <div className="notch"/>
        <div className="status">
          <span>9:41</span>
          <span className="row gap-1 ic-1"><Ico name="signal" size={12} color="var(--ink)"/><Ico name="wifi" size={12} color="var(--ink)"/><Ico name="battery" size={12} color="var(--ink)"/></span>
        </div>
        <div className="body">
          <div key={key} className={dir.current === 'fwd' ? 'page-enter' : 'page-enter-rev'} style={{ height: '100%' }}>
            {renderScreen()}
          </div>
        </div>
        <div className="home-ind"/>
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
                <span>힌트 표시</span>
                <div className={`toggle ${tweaks.showHints ? 'on' : ''}`} onClick={() => updateTweak('showHints', !tweaks.showHints)}/>
              </div>
              <div className="tweaks-row">
                <span>홈으로</span>
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
// Hide static hint once React mounts
document.getElementById('hint')?.remove();
