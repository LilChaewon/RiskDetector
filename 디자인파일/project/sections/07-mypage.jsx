// ───────────────────────────────────────────────
// Section 07 — 마이페이지 + 프리미엄 페이월 (3 variations)
// ───────────────────────────────────────────────
function SectionMyPage() {
  return (
    <section>
      <SectionHeader num="07" title="마이페이지 · 이력 · 프리미엄" sub="분석 횟수 제한이 있는 프리미엄 결제 플로우" />
      <div className="variation-row">

        {/* A — My history + counter */}
        <Variation tag="A" title="이력 · 횟수 중심" note="이번 달 분석 잔여 횟수를 명확히. 프리미엄 유도는 은은하게.">
          <Phone label="ME · A">
            <div className="col gap-3" style={{ paddingBottom: 60 }}>
              <div className="fs-20 fw-7">내 정보</div>

              <div className="box p-3 row between" style={{ alignItems: 'center' }}>
                <div className="row gap-3" style={{ alignItems: 'center' }}>
                  <div className="box-soft" style={{ width: 48, height: 48, borderRadius: 999 }} />
                  <div className="col" style={{ gap: 2 }}>
                    <div className="fs-14 fw-7">김지우</div>
                    <div className="fs-11 muted">jiwoo@example.com</div>
                  </div>
                </div>
                <div className="pill">무료</div>
              </div>

              <div className="box p-3 col gap-2" style={{ background: 'var(--paper-2)' }}>
                <div className="row between">
                  <div className="fs-11 mono muted">이번 달 분석</div>
                  <div className="fs-11 muted">1월 21일 리셋</div>
                </div>
                <div className="row between" style={{ alignItems: 'baseline' }}>
                  <div className="fs-24 fw-7">1 <span className="fs-14 muted">/ 3 회</span></div>
                  <div className="fs-13" style={{ color: 'var(--risk-md)' }}>2회 남음</div>
                </div>
                <div style={{ height: 6, background: '#fff', borderRadius: 3 }}>
                  <div style={{ width: '33%', height: '100%', background: 'var(--ink)', borderRadius: 3 }} />
                </div>
                <div className="btn btn-sm mt-1">⚡ 무제한으로 업그레이드</div>
              </div>

              <div className="col gap-2">
                <div className="fs-13 fw-6">분석 이력</div>
                {[
                  { t: '원룸 임대차계약서', d: '2025.01.18', r: 'hi' },
                  { t: '아르바이트 근로계약', d: '2025.01.15', r: 'md' },
                  { t: '프리랜서 용역계약', d: '2025.01.10', r: 'lo' },
                ].map((it, i) => (
                  <div key={i} className="box-soft p-3 row between" style={{ alignItems: 'center' }}>
                    <div className="col" style={{ gap: 2 }}>
                      <div className="fs-13 fw-6">{it.t}</div>
                      <div className="fs-11 muted">{it.d}</div>
                    </div>
                    <RiskTag level={it.r} />
                  </div>
                ))}
              </div>
            </div>
            <TabBar active="me" />
          </Phone>
        </Variation>

        {/* B — Paywall */}
        <Variation tag="B" title="프리미엄 페이월" note="무료 한도 소진 시 표시. '전문가 상담'은 과감히 넣거나 뺄 수 있음.">
          <Phone label="PAYWALL · B">
            <div className="col gap-3" style={{ paddingBottom: 16 }}>
              <div className="row between">
                <div className="fs-14">×</div>
                <div className="fs-12 muted">복원</div>
              </div>
              <div className="col gap-1 mt-2">
                <div className="fs-11 mono muted">RD PREMIUM</div>
                <div className="fs-24 fw-7" style={{ lineHeight: 1.2 }}>
                  계약서 앞에서<br/>당당해지기
                </div>
              </div>

              <div className="col gap-2 mt-2">
                {[
                  '무제한 계약서 분석',
                  '상세 판례 · 근거 열람',
                  '협상 스크립트 저장',
                  'PDF 리포트 내려받기',
                  '전문가 1:1 질문 월 2회',
                ].map((t, i) => (
                  <div key={i} className="row gap-2" style={{ alignItems: 'center' }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: 999, background: 'var(--ink)',
                      color: '#fff', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>✓</div>
                    <div className="fs-13">{t}</div>
                  </div>
                ))}
              </div>

              <div className="col gap-2 mt-3">
                <div className="box p-3 row between" style={{ alignItems: 'center', borderWidth: 2 }}>
                  <div className="col" style={{ gap: 2 }}>
                    <div className="row gap-2" style={{ alignItems: 'center' }}>
                      <div className="fs-13 fw-7">연간</div>
                      <div className="pill" style={{ background: 'var(--ink)', color: '#fff', borderColor: 'var(--ink)' }}>40% 할인</div>
                    </div>
                    <div className="fs-11 muted">월 5,900원 · 연 70,800원</div>
                  </div>
                  <div className="box-soft" style={{ width: 22, height: 22, borderRadius: 999, background: 'var(--ink)' }} />
                </div>
                <div className="box-soft p-3 row between" style={{ alignItems: 'center' }}>
                  <div className="col" style={{ gap: 2 }}>
                    <div className="fs-13 fw-7">월간</div>
                    <div className="fs-11 muted">월 9,900원</div>
                  </div>
                  <div className="box-soft" style={{ width: 22, height: 22, borderRadius: 999 }} />
                </div>
              </div>

              <div className="btn mt-2">7일 무료로 시작하기</div>
              <div className="fs-10 muted text-c">언제든 해지 가능 · 갱신 전 알림</div>
            </div>
          </Phone>
        </Variation>

        {/* C — Settings-list */}
        <Variation tag="C" title="설정 · 리스트형" note="iOS 설정 스타일. 구독 · 알림 · 약관. 재방문 시 익숙함.">
          <Phone label="ME · C">
            <div className="col gap-3" style={{ paddingBottom: 60 }}>
              <div className="fs-20 fw-7">설정</div>

              <div className="box col" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="row gap-3 p-3" style={{ alignItems: 'center', borderBottom: '1px solid var(--line-2)' }}>
                  <div className="box-soft" style={{ width: 44, height: 44, borderRadius: 999 }} />
                  <div className="col grow" style={{ gap: 2 }}>
                    <div className="fs-14 fw-7">김지우 <span className="pill" style={{ background: '#ffe9a8', borderColor: '#ffe9a8', fontSize: 10 }}>PRO</span></div>
                    <div className="fs-11 muted">jiwoo@example.com</div>
                  </div>
                  <div className="fs-14 muted">›</div>
                </div>
                <div className="row between p-3" style={{ alignItems: 'center', borderBottom: '1px solid var(--line-2)' }}>
                  <div className="fs-13">구독 관리</div>
                  <div className="fs-11 muted">연간 · 남은 287일 ›</div>
                </div>
                <div className="row between p-3" style={{ alignItems: 'center' }}>
                  <div className="fs-13">결제 수단</div>
                  <div className="fs-11 muted">카드 ****1234 ›</div>
                </div>
              </div>

              <div className="box col" style={{ padding: 0, overflow: 'hidden' }}>
                {[
                  { t: '알림 설정', r: 'ON' },
                  { t: '잠금 (Face ID)', r: 'ON' },
                  { t: '데이터 · 저장공간', r: '›' },
                  { t: '언어', r: '한국어 ›' },
                ].map((it, i, arr) => (
                  <div key={i} className="row between p-3" style={{
                    alignItems: 'center',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--line-2)' : 'none',
                  }}>
                    <div className="fs-13">{it.t}</div>
                    <div className="fs-11 muted">{it.r}</div>
                  </div>
                ))}
              </div>

              <div className="box col" style={{ padding: 0, overflow: 'hidden' }}>
                {[
                  '공지사항',
                  '이용약관 · 개인정보',
                  '문의하기',
                  '로그아웃',
                ].map((t, i, arr) => (
                  <div key={i} className="row between p-3" style={{
                    alignItems: 'center',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--line-2)' : 'none',
                  }}>
                    <div className="fs-13" style={{ color: t === '로그아웃' ? 'var(--risk-hi)' : 'var(--ink)' }}>{t}</div>
                    <div className="fs-11 muted">›</div>
                  </div>
                ))}
              </div>

              <div className="fs-10 muted text-c mono">v 1.0.0</div>
            </div>
            <TabBar active="me" />
          </Phone>
        </Variation>

      </div>
    </section>
  );
}

window.SectionMyPage = SectionMyPage;
