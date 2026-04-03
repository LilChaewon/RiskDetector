# 작업 요약

## AWS/S3 설정 및 연동함

- S3 버킷 이름을 `risk-detector-myongji`로 설정함.
- `ai_rag/config.py`의 `S3_BUCKET` 값을 버킷 이름에 맞게 연결함.
- `ai_rag`와 `backend_ai`에서 AWS 자격증명을 읽을 수 있게 `.env` 파일을 정리함.
- 로컬에서 AWS 자격증명으로 S3 접근이 되는지 확인함.
- S3 버킷 조회, 파일 업로드, 파일 다운로드로 실제 연동을 검증함.
- Lambda 테스트에 필요한 IAM 권한도 정리하고 적용함.

### 1. OCR 파이프라인 확인함

- `backend_ai`에서 OCR Lambda 로컬 테스트를 끝냄.
- S3에 이미지 올리고 OCR 결과가 정상적으로 나오는 것까지 확인함.
- AWS Lambda 콘솔에서도 테스트 성공함.

### 2. Bedrock 분석 Lambda 확인함

- `backend_ai`에서 Bedrock   Lambda 로컬 테스트를 끝냄.
- 계약서 조항 텍스트를 넣으면 위험도와 사유를 JSON으로 반환하는 것까지 확인함.
- 배포용 ZIP, 배포 스크립트, 테스트 이벤트 파일도 준비함.
- Knowledge Base ID도 환경변수에 연결해둠.

### 3. Easylaw 데이터 수집함

- `ai_rag`에서 Easylaw Q&A 크롤러를 만들고 실행함.
- 로컬에 Q&A 파일이 생성되는 것 확인함.
- 이후 100개의 Q&A txt 파일을 S3에 업로드함.

### 4. 국가법령정보 API 데이터 수집함

- `ai_rag`에서 국가법령정보 공동활용 API 호출 테스트를 끝냄.
- 법령 메타데이터 txt 파일을 저장함.
- 법령 원문 HTML 파일도 같이 저장함.
- 이 파일들도 S3에 업로드함.

### 5. Bedrock Knowledge Base 생성함

- Bedrock에서 Knowledge Base를 생성함.
- S3 데이터 소스를 연결함.
- 동기화까지 완료된 것 확인함.
- 현재 Knowledge Base ID는 `UXAFF3UKTQ`임.

## 왜 이 작업이 필요했는지

- AWS 연동이 먼저 되어야 S3 저장, Lambda 테스트, Bedrock 호출이 가능함.
- S3 버킷 설정이 맞아야 OCR 이미지와 RAG 데이터 파일을 한 곳에서 관리할 수 있음.
- OCR이 먼저 되어야 계약서 이미지를 읽을 수 있음.
- Bedrock 분석이 되어야 어떤 조항이 위험한지 설명할 수 있음.
- RAG 데이터가 있어야 AI가 법률 근거를 더 정확하게 참고할 수 있음.
- Knowledge Base가 있어야 S3에 올린 법률 자료를 Bedrock이 검색해서 활용할 수 있음.

## S3에 올린 데이터

- OCR 테스트 이미지는 `test/` 경로에 올려서 사용함.
- Easylaw Q&A 파일은 `easylaw/` 경로에 업로드함.
- 국가법령정보 메타데이터와 원문 파일은 `law_open_api/` 경로에 업로드함.
- Bedrock Knowledge Base도 같은 버킷을 데이터 소스로 사용함.

## 현재 상태

- AWS 자격증명과 S3 버킷 설정 완료됨.
- `backend_ai`의 OCR 테스트는 완료됨.
- `backend_ai`의 Bedrock 분석 테스트도 완료됨.
- `ai_rag`의 Easylaw 업로드 완료됨.
- `ai_rag`의 법령 API 업로드 완료됨.
- Bedrock Knowledge Base 생성 및 연결 완료됨.
