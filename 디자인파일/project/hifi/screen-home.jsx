function ScreenHome() {
  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <div className="body-scroll" style={{ paddingBottom: 90 }}>
        {/* Top */}
        <div className="row between ic-1" style={{ padding: '8px 0 16px' }}>
          <div className="fs-20 fw-8 tight">RD</div>
          <div className="row gap-3 ic-1">
            <Ico name="search" size={18} color="#191f28" />
            <Ico name="bell" size={18} color="#191f28" />
          </div>
        </div>

        {/* Dark hero */}
        <div className="card-dark" style={{ padding: 22 }}>
          <div className="fs-11 fw-6" style={{ color: '#7ca4ec', letterSpacing: '0.05em' }}>계약서, 이제 혼자 보지 마세요</div>
          <div className="fs-22 fw-8 lh-1 tight mt-2" style={{ color: '#fff' }}>
            사진 한 장이면<br/>독소조항을 찾아드려요
          </div>
          <div className="fs-12 mt-3" style={{ color: '#aab7c7', lineHeight: 1.6 }}>
            임대차 · 근로 · 용역 · 위임<br/>평균 12초면 분석이 끝나요
          </div>
          <button className="btn btn-white btn-lg mt-4" style={{ width: '100%' }}>
            계약서 불러오기
          </button>
          <div className="row gap-2 mt-3 ic-1 center fs-11" style={{ color: '#aab7c7' }}>
            <Ico name="sparkle" size={12} color="#7ca4ec"/>
            <span>누적 184,203건 분석됨</span>
          </div>
        </div>

        {/* Recent */}
        <div className="row between ic-1 mt-5">
          <div className="fs-15 fw-7">최근 분석</div>
          <div className="fs-12 sub row ic-1 gap-1">전체 <Ico name="chevron" size={12} color="#8b95a1"/></div>
        </div>
        <div className="col gap-2 mt-3">
          <div className="card card-hover row gap-3 ic-1">
            <div style={{ width: 42, height: 52, background: '#f2f4f6', borderRadius: 6, flexShrink: 0, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Ico name="doc" size={20} color="#8b95a1" />
            </div>
            <div className="grow col gap-1">
              <div className="fs-14 fw-7">원룸 임대차계약서</div>
              <div className="fs-11 sub">어제 · 12개 조항 · 2개 주의</div>
            </div>
            <RiskTag level="hi"/>
          </div>
          <div className="card card-hover row gap-3 ic-1">
            <div style={{ width: 42, height: 52, background: '#f2f4f6', borderRadius: 6, flexShrink: 0, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Ico name="doc" size={20} color="#8b95a1" />
            </div>
            <div className="grow col gap-1">
              <div className="fs-14 fw-7">프리랜서 용역계약</div>
              <div className="fs-11 sub">3일 전 · 8개 조항 · 1개 확인</div>
            </div>
            <RiskTag level="md"/>
          </div>
        </div>

        {/* Tip of the day */}
        <div className="row between ic-1 mt-5">
          <div className="fs-15 fw-7">오늘의 법률 팁</div>
          <div className="pill">매일 새로고침</div>
        </div>
        <div className="card mt-3" style={{ padding: 18 }}>
          <div className="fs-11 fw-6" style={{ color: 'var(--navy-2)', letterSpacing: '0.04em' }}>APR 18 · 임대차</div>
          <div className="fs-15 fw-7 mt-2 lh-2">보증금 못 돌려받을 때,<br/>임차권등기명령부터 해보세요</div>
          <div className="fs-12 sub mt-2 lh-3">이사 가도 대항력이 유지돼요. 보증금 5천만원 이하면 소액보증금 최우선변제도 가능.</div>
          <div className="row gap-2 mt-3">
            <span className="pill">#보증금</span>
            <span className="pill">#임대차</span>
          </div>
        </div>
      </div>
      <TabBar active="home"/>
    </div>
  );
}

function ScreenHomeScrolled() {
  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <div className="body-scroll" style={{ paddingBottom: 90 }}>
        <div className="fs-15 fw-7 mt-3">자주 묻는 질문</div>
        <div className="col gap-2 mt-3">
          {[
            ['월세 밀렸을 때 집주인이 바로 쫓아낼 수 있나요?', '임대차', '이달의 인기'],
            ['퇴사 후 경업금지 조항, 꼭 지켜야 하나요?', '근로', null],
            ['계약금만 걸었는데 계약이 깨졌어요', '계약일반', null],
            ['중개수수료 법정 한도는 얼마인가요?', '부동산', null],
          ].map(([q, tag, meta], i) => (
            <div key={i} className="card card-hover col gap-2">
              <div className="row between ic-1">
                <span className="pill">#{tag}</span>
                {meta && <span className="fs-11" style={{ color: 'var(--navy-2)', fontWeight: 600 }}>{meta}</span>}
              </div>
              <div className="fs-14 fw-6 lh-2">{q}</div>
            </div>
          ))}
        </div>

        <div className="fs-15 fw-7 mt-5">카테고리별 둘러보기</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
          {[
            ['임대차', '2,104'],
            ['근로·노동', '1,832'],
            ['계약·거래', '1,205'],
            ['금융·대출', '684'],
          ].map(([t, n]) => (
            <div key={t} className="card card-hover col gap-1" style={{ padding: 14 }}>
              <div className="fs-14 fw-7">{t}</div>
              <div className="fs-11 sub">{n}개 팁</div>
            </div>
          ))}
        </div>
      </div>
      <TabBar active="home"/>
    </div>
  );
}

Object.assign(window, { ScreenHome, ScreenHomeScrolled });
