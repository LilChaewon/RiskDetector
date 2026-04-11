"""Local runner for backend_ai Bedrock lambda."""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from lambdas.bedrock_lambda.handler import lambda_handler, load_env_file


def main() -> None:
    load_env_file()

    event = {
        "contractId": "test-001",
        "analysisId": "analysis-001",
        "contractTexts": [
            "제1조 (목적) 본 계약은 임대차를 목적으로 한다.",
            "제2조 (보증금) 임차인은 보증금 5천만원을 지불한다.",
            "제3조 (원상복구) 임차인은 퇴거 시 모든 비용을 부담한다.",
        ],
    }

    if os.getenv("KNOWLEDGE_BASE_ID", "").strip():
        event["knowledgeBaseId"] = os.getenv("KNOWLEDGE_BASE_ID", "").strip()

    result = lambda_handler(event, None)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
