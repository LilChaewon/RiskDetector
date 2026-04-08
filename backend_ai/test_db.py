import sys
import os

sys.path.append("/Users/onyu/Desktop/RiskDetector/backend_ai/lambdas/analysis_result_loader")

from handler import lambda_handler

test_event = {
    "contractId": "test-contract-002",
    "analysisId": "test-analysis-002",
    "success": True,
    "data": {
        "analysisResult": {
            "title": "테스트",
            "summary": "안전",
            "riskLevel": "low",
            "toxics": []
        }
    }
}

if __name__ == "__main__":
    try:
        res = lambda_handler(test_event, None)
        print("SUCCESS:", res)
    except Exception as e:
        print("ERROR:", e)
