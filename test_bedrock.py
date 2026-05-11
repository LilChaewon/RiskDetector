import sys
import os
import json
sys.path.append(os.path.join(os.getcwd(), 'backend_ai'))
from lambdas.bedrock_lambda.handler import lambda_handler

test_event = {
    "contractId": "test-123",
    "analysisId": "test-456",
    "contractTexts": [
        "본 계약기간은 최초 계약일부터 시작하여, '을'의 연예활동의 데뷔일로부터 13년째 되는 날 종료하기로 한다",
        "'을'은 저작물에 대한 복제권, 음반권, 배포권, 2차적 저작물 작성권 등 모든 권리를 '갑'에게 영구히 양도한다",
        "손해배상액은 총 투자액의 3배와 잔여 계약기간 동안의 일실이익의 2배를 합산한 금액으로 한다"
    ]
}

result = lambda_handler(test_event, None)
print(json.dumps(result, indent=2, ensure_ascii=False))
