// ───────────────────────────────────────────────
// Section 02 — 업로드 / 입력 방식 (3 variations)
// ───────────────────────────────────────────────
function SectionUpload() {
  return (
    <section>
      <SectionHeader num="02" title="업로드 · 입력" sub="PDF / 이미지 / 사진 촬영 (OCR) 입력 방식 탐색" />
      <div className="variation-row">

        {/* A — 3 big tiles */}
        <Variation tag="A" title="3등분 타일" note="가장 명확. 입력 방식이 나란히 제시됨. 처음 쓰는 사용자에게 좋음.">
          <Phone label="UPLOAD · A">
            <div className="col gap-3">
              <div className="row gap-2" style={{ alignItems: 'center' }}>
                <div className="fs-16">←</div>
                <div className="fs-16 fw-7">계약서 분석</div>
              </div>
              <div className="fs-13 muted mb-2">어떤 방식으로 올릴까요?</div>

              <div className="box p-4 col center gap-2" style={{ minHeight: 140 }}>
                <div style={{ fontSize: 36 }}>📷</div>
                <div className="fs-14 fw-7">사진 촬영</div>
                <div className="fs-11 muted">종이 계약서를 찍어요</div>
              </div>
              <div className="box p-4 col center gap-2" style={{ minHeight: 140 }}>
                <div style={{ fontSize: 36 }}>📁</div>
                <div className="fs-14 fw-7">파일 업로드</div>
                <div className="fs-11 muted">PDF · JPG · PNG</div>
              </div>
              <div className="box p-4 col center gap-2" style={{ minHeight: 140, opacity: 0.65 }}>
                <div style={{ fontSize: 36 }}>✎</div>
                <div className="fs-14 fw-7">직접 입력</div>
                <div className="fs-11 muted">텍스트 붙여넣기 (선택)</div>
              </div>
            </div>
          </Phone>
        </Variation>

        {/* B — camera-primary */}
        <Variation tag="B" title="카메라 우선 · 액션시트" note="카메라가 주, 파일은 보조. 모바일 네이티브 느낌. iOS 액션시트 패턴.">
          <Phone label="UPLOAD · B">
            <div className="col gap-3" style={{ paddingBottom: 70 }}>
              <div className="row between" style={{ alignItems: 'center' }}>
                <div className="fs-16">×</div>
                <div className="fs-14 fw-6">촬영</div>
                <div className="fs-12 muted">가이드</div>
              </div>
              <div className="box-dash center" style={{
                background: '#2a2a2a', color: '#fff',
                height: 380, borderRadius: 16, borderColor: '#555',
                position: 'relative', overflow: 'hidden',
              }}>
                <div className="col center gap-2">
                  <div style={{ fontSize: 48 }}>⌐☐⌐</div>
                  <div className="fs-12 mono" style={{ opacity: 0.7 }}>계약서를 프레임에 맞춰주세요</div>
                </div>
                {/* corners */}
                {['tl','tr','bl','br'].map(pos => (
                  <div key={pos} style={{
                    position: 'absolute', width: 24, height: 24,
                    borderColor: '#fff', borderStyle: 'solid',
                    ...(pos === 'tl' && { top: 20, left: 20, borderWidth: '2px 0 0 2px' }),
                    ...(pos === 'tr' && { top: 20, right: 20, borderWidth: '2px 2px 0 0' }),
                    ...(pos === 'bl' && { bottom: 20, left: 20, borderWidth: '0 0 2px 2px' }),
                    ...(pos === 'br' && { bottom: 20, right: 20, borderWidth: '0 2px 2px 0' }),
                  }} />
                ))}
              </div>
              <div className="row between" style={{ alignItems: 'center', padding: '4px 12px' }}>
                <div className="col center gap-1">
                  <div className="box-soft" style={{ width: 36, height: 36, borderRadius: 8 }} />
                  <div className="fs-10 muted">갤러리</div>
                </div>
                <div style={{
                  width: 62, height: 62, borderRadius: 999,
                  border: '3px solid var(--ink)', background: '#fff',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  <div style={{ width: 46, height: 46, borderRadius: 999, background: 'var(--ink)' }} />
                </div>
                <div className="col center gap-1">
                  <div className="box-soft" style={{ width: 36, height: 36, borderRadius: 8 }} />
                  <div className="fs-10 muted">PDF</div>
                </div>
              </div>
            </div>
          </Phone>
        </Variation>

        {/* C — multi-page capture with list */}
        <Variation tag="C" title="여러 장 모아찍기" note="실제 계약서는 여러 페이지. 이 버전은 페이지별 캡처 → 순서 정리 → 분석 요청 플로우.">
          <Phone label="UPLOAD · C">
            <div className="col gap-3">
              <div className="row between">
                <div className="fs-14">← 뒤로</div>
                <div className="fs-14 fw-6">페이지 4장</div>
                <div className="fs-14 fw-6" style={{ color: 'var(--risk-lo)' }}>완료</div>
              </div>

              <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
                {[1,2,3,4].map(i => (
                  <div key={i} className="box-soft col" style={{ width: 'calc(50% - 4px)', aspectRatio: '0.75' }}>
                    <div className="ph grow" style={{ margin: 4, borderRadius: 6 }}>page {i}</div>
                  </div>
                ))}
                <div className="box-dash center col" style={{ width: 'calc(50% - 4px)', aspectRatio: '0.75' }}>
                  <div style={{ fontSize: 32, color: 'var(--ink-3)' }}>＋</div>
                  <div className="fs-11 muted">페이지 추가</div>
                </div>
              </div>

              <div className="box p-3 col gap-2" style={{ background: 'var(--paper-2)' }}>
                <div className="row between">
                  <div className="fs-12 fw-6">자동 OCR 인식 중</div>
                  <div className="fs-11 muted mono">3/4</div>
                </div>
                <div style={{ height: 4, background: '#fff', borderRadius: 2 }}>
                  <div style={{ width: '75%', height: '100%', background: 'var(--ink)', borderRadius: 2 }} />
                </div>
              </div>

              <div className="btn">분석 시작하기</div>
            </div>
          </Phone>
        </Variation>

      </div>
    </section>
  );
}

window.SectionUpload = SectionUpload;
