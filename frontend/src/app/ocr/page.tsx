"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getContract, getRisksByContract } from "@/api/contracts";
import type { Contract, RiskItem } from "@/api/mock";
import Link from "next/link";

export default function OcrResultPage() {
  const searchParams = useSearchParams();
  const idStr = searchParams.get("id");
  const contractId = idStr ? parseInt(idStr, 10) : null;

  const [contract, setContract] = useState<Contract | null>(null);
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contractId) {
      setLoading(false);
      return;
    }

    // Mock API 호출
    Promise.all([
      getContract(contractId),
      getRisksByContract(contractId)
    ])
    .then(([contractData, risksData]) => {
      setContract(contractData);
      setRisks(risksData);
    })
    .catch((err) => {
      console.error(err);
    })
    .finally(() => {
      // 업로드 후 체감 딜레이를 위해 인위적 시간 지연
      setTimeout(() => setLoading(false), 1500);
    });
  }, [contractId]);

  if (loading) {
    return (
      <div className="main-content" style={{ margin: "0 auto", maxWidth: "800px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div className="analyzing-dot" style={{ fontSize: "40px", color: "var(--accent)" }}>🔍</div>
        <h2 style={{ marginTop: "24px", fontWeight: "700" }}>AI가 계약서를 분석 중입니다...</h2>
        <p className="text-muted" style={{ marginTop: "8px" }}>독소 조항, 불리한 조건, 불법 내용을 딥러닝 모델이 탐지하고 있습니다.</p>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="empty-state" style={{ margin: "0 auto", maxWidth: "800px" }}>
        <p>계약서 정보를 불러올 수 없습니다.</p>
        <Link href="/select-type" className="btn btn-primary mt-6">다시 시도하기</Link>
      </div>
    );
  }

  return (
    <div className="main-content" style={{ margin: "0 auto", maxWidth: "800px", paddingBottom: "60px" }}>
      <header className="page-header" style={{ marginBottom: "32px" }}>
        <div style={{ display: "inline-block", background: "var(--bg-elevated)", padding: "4px 12px", borderRadius: "99px", fontSize: "12px", color: "var(--risk-low)", marginBottom: "16px", border: "1px solid var(--border)" }}>
          ✅ 분석 완료
        </div>
        <h1 className="page-title">{contract.fileName} 분석 결과</h1>
        <p className="page-subtitle">이 계약서에서 <strong>{risks.length}건</strong>의 잠재적 위험 요소가 발견되었습니다.</p>
      </header>

      {/* 요약 카드 */}
      <div className="card" style={{ marginBottom: "32px", display: "flex", gap: "32px", alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <h3 className="section-title">위험도 요약</h3>
          <div style={{ display: "flex", gap: "24px", marginTop: "16px" }}>
            <div style={{ textAlign: "center" }}>
              <div className="stat-value critical">{contract.riskCount.critical}</div>
              <div className="stat-label">치명적</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div className="stat-value high">{contract.riskCount.high}</div>
              <div className="stat-label">높음</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div className="stat-value medium">{contract.riskCount.medium}</div>
              <div className="stat-label">주의</div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <Link href={`/upload?type=${contract.contractType}`} className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", marginBottom: "12px" }}>
            다른 문서 업로드
          </Link>
          <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
            분석 보고서 PDF 다운로드
          </button>
        </div>
      </div>

      {/* 발견된 위험 항목 내역 */}
      <div>
        <h3 className="section-title">탐지된 위험 요소 상세</h3>
        <div className="risk-list" style={{ marginTop: "16px" }}>
          {risks.length === 0 && (
            <div className="empty-state card">
              <div className="empty-state-icon">🛡️</div>
              <div className="empty-state-text">안전합니다!</div>
              <div className="empty-state-sub">표준 및 적법한 범위 내로 작성된 계약서입니다.</div>
            </div>
          )}

          {risks.map((risk) => (
            <div key={risk.id} className={`risk-item-card ${risk.level}`}>
              <div className="risk-item-header">
                <span className={`risk-badge ${risk.level}`}>
                  {risk.level.toUpperCase()}
                </span>
                <span className="risk-item-category">{risk.category}</span>
              </div>
              
              <div className="risk-item-clause">
                "{risk.clause}"
              </div>
              
              <p className="risk-item-desc">{risk.description}</p>
              
              <div className="risk-item-suggest">
                {risk.suggestion}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
