# backend_ai

## 구조

- `lambdas/`
  - `ocr_lambda/`: OCR 처리 Lambda
  - `bedrock_lambda/`: KB 검색 + 생성 모델 분석 Lambda
  - `analysis_result_loader/`: 분석 결과 DB 적재 Lambda
- `tests/local/`
  - 로컬 실행용 테스트 스크립트
- `dist/`
  - Lambda 배포 zip 산출물
- `.venv/`
  - 로컬 Python 가상환경

## 로컬 테스트 예시

```bash
backend_ai/.venv/bin/python backend_ai/tests/local/test_ocr_local.py
backend_ai/.venv/bin/python backend_ai/tests/local/test_bedrock_local.py
backend_ai/.venv/bin/python backend_ai/tests/local/test_analysis_result_loader_local.py
```
