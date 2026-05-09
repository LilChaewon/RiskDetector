function ScreenUpload() {
  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <div className="body-scroll" style={{ paddingBottom: 20 }}>
        <div className="row between ic-1" style={{ padding: '8px 0 16px' }}>
          <Ico name="back" size={18} color="#191f28"/>
          <div className="fs-13 fw-7">계약서 불러오기</div>
          <div style={{ width: 18 }}/>
        </div>

        <div className="fs-22 fw-8 tight mt-2 lh-1">어떻게 가져오실래요?</div>
        <div className="fs-13 sub mt-2 lh-2">원본이 깨끗할수록 더 정확히 분석해드려요.</div>

        {/* Upload options */}
        <div className="col gap-3 mt-5">
          <div className="card card-hover row gap-3 ic-1" style={{ padding: 18 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--navy-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Ico name="camera" size={22} color="#1b64da"/>
            </div>
            <div className="grow col gap-1">
              <div className="fs-15 fw-7">사진으로 찍기</div>
              <div className="fs-12 sub lh-2">종이 계약서를 찍어서 바로 분석</div>
            </div>
            <Ico name="chevron" size={14} color="#8b95a1"/>
          </div>

          <div className="card card-hover row gap-3 ic-1" style={{ padding: 18 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Ico name="doc" size={22} color="#4e5968"/>
            </div>
            <div className="grow col gap-1">
              <div className="fs-15 fw-7">PDF · 이미지</div>
              <div className="fs-12 sub lh-2">파일에서 불러오기</div>
            </div>
            <Ico name="chevron" size={14} color="#8b95a1"/>
          </div>

          <div className="card card-hover row gap-3 ic-1" style={{ padding: 18 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Ico name="edit" size={22} color="#4e5968"/>
            </div>
            <div className="grow col gap-1">
              <div className="fs-15 fw-7">직접 붙여넣기</div>
              <div className="fs-12 sub lh-2">복사한 텍스트를 그대로</div>
            </div>
            <Ico name="chevron" size={14} color="#8b95a1"/>
          </div>
        </div>

        {/* Tips */}
        <div className="card mt-5" style={{ padding: 16, background: 'var(--line-2)', border: 'none' }}>
          <div className="fs-12 fw-7">좋은 결과를 위한 팁</div>
          <div className="col gap-2 mt-2">
            {['밝은 곳에서 평평하게 펴고 촬영', '페이지가 잘리지 않도록 전체 포함', '글자가 선명하게 보이는 각도로'].map((t, i) => (
              <div key={i} className="row gap-2 ic-1">
                <div style={{ width: 16, height: 16, borderRadius: 8, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 9, fontWeight: 700, color: 'var(--navy-2)' }}>{i+1}</div>
                <div className="fs-12 sub">{t}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy */}
        <div className="row gap-2 mt-4 ic-1" style={{ padding: '0 4px' }}>
          <Ico name="shield" size={12} color="#8b95a1"/>
          <div className="fs-11 sub">업로드한 파일은 분석 후 삭제돼요</div>
        </div>
      </div>
    </div>
  );
}

function ScreenMyPage() {
  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <div className="body-scroll" style={{ paddingBottom: 90 }}>
        <div className="row between ic-1" style={{ padding: '8px 0 16px' }}>
          <div className="fs-20 fw-8 tight">내 정보</div>
          <Ico name="settings" size={18} color="#191f28"/>
        </div>

        {/* Profile */}
        <div className="card" style={{ padding: 18 }}>
          <div className="row gap-3 ic-1">
            <Ico name="avatar" size={18}/>
            <div className="grow col gap-1">
              <div className="fs-15 fw-7">김지훈님</div>
              <div className="fs-12 sub">jihoon@example.com</div>
            </div>
            <Ico name="chevron" size={14} color="#8b95a1"/>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 12 }}>
          <div className="card tc" style={{ padding: 14 }}>
            <div className="fs-20 fw-8" style={{ color: 'var(--navy-2)' }}>12</div>
            <div className="fs-11 sub mt-1">분석한 계약</div>
          </div>
          <div className="card tc" style={{ padding: 14 }}>
            <div className="fs-20 fw-8">28</div>
            <div className="fs-11 sub mt-1">저장한 팁</div>
          </div>
          <div className="card tc" style={{ padding: 14 }}>
            <div className="fs-20 fw-8">5</div>
            <div className="fs-11 sub mt-1">연속 학습</div>
          </div>
        </div>

        {/* Premium card */}
        <div className="card-dark mt-4" style={{ padding: 18, borderRadius: 16 }}>
          <div className="row between ic-1">
            <div className="col gap-1">
              <div className="fs-11 fw-6" style={{ color: '#7ca4ec', letterSpacing: '0.05em' }}>PRO 멤버십</div>
              <div className="fs-15 fw-7" style={{ color: '#fff' }}>무제한 분석 · 전문가 연결</div>
            </div>
            <button className="btn btn-white btn-sm">시작하기</button>
          </div>
        </div>

        {/* Menu */}
        <div className="col gap-1 mt-4">
          {[
            ['내 분석 기록', '12'],
            ['저장한 팁', '28'],
            ['전문가 상담 내역', null],
            ['알림 설정', null],
            ['다크모드', 'OFF'],
            ['고객센터', null],
            ['이용약관 · 개인정보', null],
          ].map(([t, val], i) => (
            <div key={i} className="row between ic-1 card-hover" style={{ padding: '14px 4px', borderBottom: '1px solid var(--line-2)' }}>
              <div className="fs-14 fw-5">{t}</div>
              <div className="row gap-2 ic-1">
                {val && <span className="fs-12 sub">{val}</span>}
                <Ico name="chevron" size={14} color="#8b95a1"/>
              </div>
            </div>
          ))}
        </div>

        <div className="fs-11 sub tc mt-5">RD · v1.0.0</div>
      </div>
      <TabBar active="me"/>
    </div>
  );
}

Object.assign(window, { ScreenUpload, ScreenMyPage });
