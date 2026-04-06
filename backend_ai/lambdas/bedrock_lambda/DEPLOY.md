# Bedrock Lambda Deploy

Function:
- `detector_bedrock_lambda`

Region:
- `ap-northeast-2`

Handler:
- `lambdas.bedrock_lambda.handler.lambda_handler`

Knowledge Base:
- `UXAFF3UKTQ`

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
  "knowledgeBaseId": "UXAFF3UKTQ"
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
- Bedrock invoke permission is required for the configured model or inference profile
