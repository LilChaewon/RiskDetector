"use client";

import { useRouter } from "next/navigation";
import { type ContractType } from "@/api/mock";

export default function SelectTypePage() {
  const router = useRouter();

  const handleSelect = (type: ContractType) => {
    // 업로드 페이지로 이동하면서 파라미터로 계약서 종류 전달
    router.push(`/upload?type=${type}`);
  };

  return (
    <div className="main-content" style={{ margin: "0 auto", maxWidth: "800px" }}>
      <header className="page-header" style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1 className="page-title">분석할 계약서 종류 선택</h1>
        <p className="page-subtitle">어떤 종류의 계약서를 업로드하고 법적 조항 분석을 시작하시겠습니까?</p>
      </header>
      
      <div className="page-body">
        <div className="grid-2">
          {/* 부동산 임대차 계약서 */}
          <div 
            className="card" 
            style={{ cursor: "pointer", transition: "transform 0.2s" }}
            onClick={() => handleSelect("real_estate")}
            onMouseOver={(e) => (e.currentTarget.style.transform = "translateY(-4px)")}
            onMouseOut={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>🏠</div>
            <h3 className="section-title" style={{ fontSize: "18px" }}>부동산 임대차 계약서</h3>
            <p className="text-sm text-muted">
              공인중개사 없이 직거래하거나, 전세사기가 불안하신가요? 
              <br/><br/>전/월세, 매매 계약서의 불리한 조항, 대항력 요소, 불법 조항들을 철저하게 찾아냅니다.
            </p>
          </div>

          {/* 고용 계약서 */}
          <div 
            className="card" 
            style={{ cursor: "pointer", transition: "transform 0.2s" }}
            onClick={() => handleSelect("employment")}
            onMouseOver={(e) => (e.currentTarget.style.transform = "translateY(-4px)")}
            onMouseOut={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>💼</div>
            <h3 className="section-title" style={{ fontSize: "18px" }}>고용·근로 계약서</h3>
            <p className="text-sm text-muted">
              프리랜서, 정규직, 계약직 등 새롭게 고용 계약을 맺으시나요?
              <br/><br/>포괄임금제, 부당한 경업금지 조항, 독소 조항 등 근로자에게 족쇄가 될 수 있는 부분을 체크합니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
