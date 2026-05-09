function ScreenFeed() {
  const tags = ['전체', '임대차', '근로', '계약', '금융', '부동산'];
  const qas = [
    { cat: '임대차', title: '월세 밀렸을 때 집주인이 바로 쫓아낼 수 있나요?', sum: '2기 차임 연체 시 해지 가능. 즉시 퇴거는 불법이에요.', views: '12.4k', trend: true },
    { cat: '근로', title: '퇴사 후 경업금지 조항, 꼭 지켜야 하나요?', sum: '지역·기간·직종이 합리적이어야 효력 있어요. 무제한 금지는 무효.', views: '8.1k' },
    { cat: '계약', title: '계약금 10% 걸었는데 계약이 깨졌어요', sum: '누가 계약을 해제했는지에 따라 배액상환 or 포기.', views: '6.7k' },
    { cat: '임대차', title: '전세보증금 돌려받을 때 알아야 할 4가지', sum: '대항력 · 우선변제권 · 임차권등기 · 전세권 차이 정리.', views: '5.2k' },
  ];
  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <div className="body-scroll" style={{ paddingBottom: 90 }}>
        <div className="row between ic-1" style={{ padding: '8px 0 16px' }}>
          <div className="fs-20 fw-8 tight">법률 팁</div>
          <Ico name="search" size={18} color="#191f28"/>
        </div>

        {/* Search */}
        <div style={{ background: 'var(--line-2)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Ico name="search" size={14} color="#8b95a1"/>
          <span className="fs-13 sub">궁금한 상황을 검색해보세요</span>
        </div>

        {/* Tags */}
        <div className="row gap-2 mt-4" style={{ overflowX: 'auto', paddingBottom: 4 }}>
          {tags.map((t, i) => (
            <span key={t} className={`pill ${i === 0 ? 'pill-nav' : ''}`} style={{ flexShrink: 0 }}>{t}</span>
          ))}
        </div>

        {/* Featured */}
        <div className="card-dark mt-4" style={{ padding: 18, borderRadius: 16 }}>
          <div className="fs-11 fw-6" style={{ color: '#7ca4ec', letterSpacing: '0.05em' }}>이번 주 추천</div>
          <div className="fs-17 fw-8 mt-2 lh-1 tight" style={{ fontSize: 17, color: '#fff' }}>
            사회초년생이 꼭 알아야 할<br/>계약서 5가지
          </div>
          <div className="fs-12 mt-2" style={{ color: '#aab7c7' }}>근로 · 임대 · 통신 · 보험 · 투자</div>
          <div className="row gap-2 mt-3 ic-1">
            <div style={{ width: 24, height: 24, borderRadius: 12, background: 'linear-gradient(135deg,#3b7bf0,#7ca4ec)' }}/>
            <span className="fs-11" style={{ color: '#aab7c7' }}>RD 편집팀 · 5분 읽기</span>
          </div>
        </div>

        {/* Q&A cards */}
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
                <span className="row gap-1 ic-1 fs-11"><Ico name="eye" size={12} color="#8b95a1"/>{q.views}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <TabBar active="feed"/>
    </div>
  );
}

Object.assign(window, { ScreenFeed });
