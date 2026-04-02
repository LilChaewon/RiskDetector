# OCR Lambda Deploy

Function:
- `detector_ocr_lambda`

Region:
- `ap-northeast-2`

Handler:
- `lambdas.ocr_lambda.handler.lambda_handler`

Build package:

```bash
python3 backend_ai/lambdas/ocr_lambda/build_package.py
```

Deploy with AWS CLI:

```bash
python3 backend_ai/lambdas/ocr_lambda/deploy_lambda.py
```

AWS Console test event:

```json
{
  "s3Key": "test/sample_contract.jpeg",
  "pageIdx": 0
}
```

Console test steps:
1. Lambda console -> `detector_ocr_lambda`
2. `Test` tab -> create test event
3. Paste `test_event.json`
4. Run test and check the response

Backend team handoff:
- Lambda function name: `detector_ocr_lambda`
- Region: `ap-northeast-2`
- IAM execution permission: Lambda needs S3 read access
- Required permission note: `s3:GetObject` on `detector-contracts/*`
