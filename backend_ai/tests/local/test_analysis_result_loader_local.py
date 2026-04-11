"""Local runner for analysis_result_loader."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from lambdas.analysis_result_loader.handler import lambda_handler


def main() -> None:
    event = {
        "data": {
            "contractId": "test-contract-001",
            "analysisId": "test-analysis-001",
            "analysisResult": {
                "title": "강남구 소재 102호 임대차 계약서",
                "summary": "원상복구 조항이 임차인에게 과도한 부담이 될 수 있음.",
                "riskLevel": "medium",
                "groundingStatus": "grounded",
                "toxicCount": 1,
                "toxics": [
                    {
                        "clauseText": "제3조 (원상복구) 임차인은 퇴거 시 최초 임대 당시 상태로 원상복구하여야 하며, 이에 필요한 모든 비용은 임차인이 부담한다.",
                        "riskType": "Potentially Unfair Clause",
                        "riskLevel": "medium",
                        "reason": "통상손모까지 임차인에게 전가될 수 있음.",
                        "suggestion": "통상손모 제외 문구와 비용 범위 명시 필요.",
                        "sourceIds": [],
                    }
                ],
            },
            "analysis": {
                "summary": "원상복구 조항 리스크 존재",
                "riskLevel": "medium",
                "groundingStatus": "grounded",
                "clauses": [],
            },
            "retrievalResults": [],
            "provider": "gemini",
            "modelId": "gemini-2.5-flash",
            "knowledgeBaseId": "UXAFF3UKTQ",
        }
    }
    print(json.dumps(lambda_handler(event, None), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
