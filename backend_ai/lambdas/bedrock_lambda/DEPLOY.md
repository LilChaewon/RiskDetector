# Bedrock Lambda Deploy

Function:
- `detector_bedrock_lambda`

Region:
- `ap-northeast-2`

Handler:
- `lambdas.bedrock_lambda.handler.lambda_handler`

Knowledge Base:
- `UXAFF3UKTQ`

Behavior:
- If `KNOWLEDGE_BASE_ID` is set, the lambda now performs `retrieve -> generate`
- Retrieval uses the Bedrock Knowledge Base first
- Generation currently uses Gemini by default
- If no KB is set, it falls back to general analysis
- Current environment variables
  - `LLM_PROVIDER=gemini`
  - `GEMINI_API_KEY`
  - `GEMINI_MODEL_ID`

Build package:

```bash
python3 backend_ai/lambdas/bedrock_lambda/build_package.py
```

Deploy with AWS CLI:

```bash
python3 backend_ai/lambdas/bedrock_lambda/deploy_lambda.py
```

AWS Console test event:

```json
{
  "contractId": "test-001",
  "analysisId": "analysis-001",
  "contractTexts": [
    "제1조 (목적) 본 계약은 임대차를 목적으로 한다.",
    "제2조 (보증금) 임차인은 보증금 5천만원을 지불한다.",
    "제3조 (원상복구) 임차인은 퇴거 시 모든 비용을 부담한다."
  ],
  "knowledgeBaseId": "UXAFF3UKTQ",
  "retrievalQuery": "임대차 계약 보증금과 원상복구 비용 전가 조항의 법적 위험"
}
```

Console test steps:
1. Lambda console -> `detector_bedrock_lambda`
2. `Test` tab -> create test event
3. Paste `test_event.json`
4. Run test and check the response

Backend team handoff:
- Lambda function name: `detector_bedrock_lambda`
- Region: `ap-northeast-2`
- Handler: `lambdas.bedrock_lambda.handler.lambda_handler`
- Knowledge Base ID: `UXAFF3UKTQ`
- Bedrock retrieve permission is required for the Knowledge Base
- Bedrock Knowledge Base retrieve permission is also required:
  - `bedrock:Retrieve`
  - target Knowledge Base: `UXAFF3UKTQ`
- Gemini API key must be set in Lambda environment variables for generation
