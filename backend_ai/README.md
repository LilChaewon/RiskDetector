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

## 로컬 DB 실행 방식

`analysis_result_loader`의 로컬 DB는 직접 설치한 PostgreSQL이 아니라 `backend_core/docker-compose.yml`의 PostgreSQL 컨테이너를 기준으로 사용하면 됨.

### 1. Docker DB 기동

```bash
/bin/bash backend_ai/scripts/start_local_db.sh
```

이 스크립트는 [backend_ai/lambdas/analysis_result_loader/.env](/Users/onyu/Desktop/RiskDetector/backend_ai/lambdas/analysis_result_loader/.env)의
`DB_NAME`, `DB_USERNAME`, `DB_PASSWORD` 값을 읽어 `backend_core/docker-compose.yml`에 넘김.

### 2. 테스트용 스키마/계약 row 준비

```bash
PGPASSWORD=password /bin/bash backend_ai/scripts/bootstrap_local_db.sh
```

### 3. DB 연결 확인

```bash
backend_ai/.venv/bin/python backend_ai/tests/local/test_db_connection_local.py
```

### 4. loader 저장 테스트

```bash
backend_ai/.venv/bin/python backend_ai/tests/local/test_analysis_result_loader_local.py
```

### 5. Docker DB 종료

```bash
/bin/bash backend_ai/scripts/stop_local_db.sh
```
