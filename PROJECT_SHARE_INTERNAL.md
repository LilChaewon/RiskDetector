# RiskDetector 내부 공유 문서

## 한눈에 보는 현재 상태

### 완료된 것

- `ai_rag`
  - Easylaw 로컬 크롤링 성공
  - QA 텍스트 파일 생성 성공
  - S3 업로드 성공
- `backend_ai`
  - OCR Lambda 로컬 테스트 성공
  - Lambda 콘솔 테스트 성공
  - Upstage OCR 연동 성공
  - 배포용 zip 생성 성공

### 아직 남은 것

- 국가법령정보 공동활용 API 연동
- OCR 결과 후처리 품질 개선
- 계약서 조항 단위 분리/정규화
- 독소조항 탐지 로직과 RAG 연결
- Lambda 코드 배포 권한 정리

---

## 1. `ai_rag`에서 한 작업

관련 파일:

- [ai_rag/main.py](/Users/onyu/Desktop/RiskDetector/ai_rag/main.py)
- [ai_rag/easylaw_crawler.py](/Users/onyu/Desktop/RiskDetector/ai_rag/easylaw_crawler.py)
- [ai_rag/config.py](/Users/onyu/Desktop/RiskDetector/ai_rag/config.py)
- [ai_rag/README.md](/Users/onyu/Desktop/RiskDetector/ai_rag/README.md)

확인한 명령:

```bash
cd ai_rag
python3 main.py easylaw local
python3 main.py easylaw s3
```

생성된 파일:

- [qa_1.txt](/Users/onyu/Desktop/RiskDetector/ai_rag/data/easylaw/qa_data/qa_1.txt)
- [qa_2.txt](/Users/onyu/Desktop/RiskDetector/ai_rag/data/easylaw/qa_data/qa_2.txt)
- [qa_3.txt](/Users/onyu/Desktop/RiskDetector/ai_rag/data/easylaw/qa_data/qa_3.txt)

저장 포맷:

```text
질문: ...

답변: ...

카테고리: ...
```

검증 내용:

- 질문이 계약 관련 문맥을 포함하는지 확인
- 답변에 최소한의 법률 설명이 있는지 확인
- `부동산/임대차`, `근로/노동` 카테고리가 정상적으로 붙는지 확인

S3 업로드 검증:

- 버킷: `risk-detector-myongji`
- 경로: `s3://risk-detector-myongji/easylaw/`
- `qa_1.txt`, `qa_2.txt`, `qa_3.txt` 업로드 확인 완료

### 왜 이 작업이 필요한가

독소조항 탐지는 단순 OCR만으로는 불가능하다.  
문서를 읽는 것과 “왜 위험한지 설명하는 것”은 다르기 때문에, 후자에는 법률 지식이 필요하다.

`ai_rag`의 역할은:

- 관련 법률/생활법령 지식 수집
- 검색 가능한 단위로 정리
- 카테고리화
- 추후 벡터DB 또는 검색 인덱스 적재를 위한 준비

즉, `ai_rag`는 “AI가 참고할 근거 저장소를 만드는 단계”다.

---

## 2. `backend_ai`에서 한 작업

관련 파일:

- [backend_ai/lambdas/ocr_lambda/handler.py](/Users/onyu/Desktop/RiskDetector/backend_ai/lambdas/ocr_lambda/handler.py)
- [backend_ai/tests/upload_test_image.py](/Users/onyu/Desktop/RiskDetector/backend_ai/tests/upload_test_image.py)
- [backend_ai/tests/test_ocr_local.py](/Users/onyu/Desktop/RiskDetector/backend_ai/tests/test_ocr_local.py)
- [backend_ai/lambdas/ocr_lambda/build_package.py](/Users/onyu/Desktop/RiskDetector/backend_ai/lambdas/ocr_lambda/build_package.py)
- [backend_ai/lambdas/ocr_lambda/deploy_lambda.py](/Users/onyu/Desktop/RiskDetector/backend_ai/lambdas/ocr_lambda/deploy_lambda.py)
- [backend_ai/lambdas/ocr_lambda/test_event.json](/Users/onyu/Desktop/RiskDetector/backend_ai/lambdas/ocr_lambda/test_event.json)
- [backend_ai/lambdas/ocr_lambda/DEPLOY.md](/Users/onyu/Desktop/RiskDetector/backend_ai/lambdas/ocr_lambda/DEPLOY.md)
- [backend_ai/dist/detector_ocr_lambda.zip](/Users/onyu/Desktop/RiskDetector/backend_ai/dist/detector_ocr_lambda.zip)

검증한 흐름:

- 로컬 이미지 파일을 S3에 업로드
- 로컬에서 `lambda_handler` 직접 호출
- Upstage OCR API 호출
- Lambda 콘솔 테스트 이벤트 실행
- OCR 결과를 `html_entire`, `html_array` 형태로 반환

AWS 콘솔 테스트 기준 정보:

- 함수 이름: `detector_ocr_lambda`
- 리전: `ap-northeast-2`
- Handler: `lambdas.ocr_lambda.handler.lambda_handler`
- 성공 테스트 이벤트:

```json
{
  "s3Key": "test/Ocr_test.JPG",
  "pageIdx": 0
}
```

실제 결과:

- `success: true`
- S3 읽기 성공
- Upstage OCR 호출 성공
- OCR 결과 반환 성공

### 왜 이 작업이 필요한가

실사용자는 계약서 텍스트를 직접 붙여넣지 않는다.  
실제 입력은 사진, 스캔본, PDF가 될 가능성이 높다.

그래서 `backend_ai`의 역할은:

- S3에서 계약서 파일 읽기
- OCR 수행
- 후속 분석 가능 형태로 텍스트 구조 반환

즉, `backend_ai`는 “문서를 AI가 읽을 수 있는 형태로 바꾸는 단계”다.

---

## 3. 왜 로컬 테스트와 AWS 테스트를 둘 다 했는가

세 단계의 의미는 다르다.

- 로컬 테스트
  - 코드가 기본적으로 정상 동작하는지 확인
- S3 테스트
  - 실제 버킷, 경로, 권한이 맞는지 확인
- Lambda 콘솔 테스트
  - 서버리스 환경에서 끝까지 돌아가는지 확인

이 과정을 나눈 이유는:

- 내 컴퓨터에서는 되는데 AWS에서는 안 되는 문제
- 권한은 맞는데 경로가 틀린 문제
- 로컬에선 되는데 Lambda 런타임에서 깨지는 문제

를 분리해서 잡기 위함이다.

---

## 4. 백엔드 팀이 꼭 알아야 하는 개념

### OCR Lambda의 역할

OCR Lambda는 다음 순서로 동작한다.

1. 이벤트에서 `s3Key`, `pageIdx`를 받는다.
2. S3에서 파일을 읽는다.
3. Upstage OCR API를 호출한다.
4. 구조화된 OCR 결과를 반환한다.

즉, “계약서 파일 -> 읽을 수 있는 텍스트 구조”를 만드는 기능이다.

### 배포 권한과 실행 권한은 다르다

- 배포 권한
  - 사람이 Lambda 코드를 올리거나 설정을 바꾸기 위해 필요
- 실행 권한
  - Lambda가 실행 중 S3, CloudWatch 등에 접근하기 위해 필요

실제 경험한 문제:

- `lambda:UpdateFunctionCode` 권한 부족 -> 배포 실패
- `s3:GetObject`, `s3:ListBucket` 권한 부족 -> Lambda 실행 실패

### S3 권한은 버킷과 객체가 다르다

- `s3:ListBucket`
  - 버킷 수준 권한
  - 예: `arn:aws:s3:::risk-detector-myongji`
- `s3:GetObject`
  - 객체 수준 권한
  - 예: `arn:aws:s3:::risk-detector-myongji/*`

즉, “파일 목록/존재 확인”과 “파일 실제 읽기”는 별개 권한이다.

### S3 키는 정확히 일치해야 한다

실제 테스트에서:

- `test/sample_contract.jpeg` -> 실패
- `test/Ocr_test.JPG` -> 성공

즉, S3 키는 경로, 파일명, 확장자, 대소문자까지 정확히 맞아야 한다.

### OCR 성공과 OCR 품질은 별개다

Lambda 테스트는 성공했지만, 이미지 품질이나 회전 상태가 좋지 않으면 OCR 결과는 일부 깨질 수 있다.

정리하면:

- `success: true` -> 기능 성공
- 문장 일부 깨짐 -> 품질 개선 대상

추후 개선 가능 항목:

- 이미지 회전 보정
- 전처리/후처리
- 표 영역 정리
- OCR 결과 정규화

---

## 5. 보안/운영 관점 메모

- `.env`, 실제 AWS 키, Upstage API 키는 절대 외부 공개 금지
- 배포 ZIP은 공개 저장소에 올리지 않는 것이 안전
- 공개 문서와 내부 문서는 분리하는 것이 바람직
- 실제 인프라명, 버킷명, 테스트 키 경로는 내부 문서에서만 관리하는 것이 좋음

공개용 요약 문서는:

- [PROJECT_SHARE.md](/Users/onyu/Desktop/RiskDetector/PROJECT_SHARE.md)

내부 상세 문서는:

- 현재 문서 [PROJECT_SHARE_INTERNAL.md](/Users/onyu/Desktop/RiskDetector/PROJECT_SHARE_INTERNAL.md)

---

## 6. 백엔드 팀 전달용 핵심 정보

- Lambda 함수 이름: `detector_ocr_lambda`
- 리전: `ap-northeast-2`
- Handler: `lambdas.ocr_lambda.handler.lambda_handler`
- 배포 ZIP: `backend_ai/dist/detector_ocr_lambda.zip`
- 테스트 이벤트 파일: `backend_ai/lambdas/ocr_lambda/test_event.json`
- 실제 성공 테스트 키: `test/Ocr_test.JPG`
- 현재 버킷 설정: `risk-detector-myongji`

필요 권한 참고:

- Lambda 실행 역할
  - `s3:GetObject` on `risk-detector-myongji/*`
  - 필요 시 `s3:ListBucket` on `risk-detector-myongji`
- PM 요구사항 참고
  - `s3:GetObject` on `detector-contracts/*`

---

## 7. 다음 추천 작업

우선순위 기준 추천:

1. `ai_rag`에 국가법령정보 공동활용 API 연동 추가
2. OCR 결과를 계약서 조항 단위로 정제하는 후처리 로직 추가
3. 계약서 조항과 법률 근거를 연결하는 RAG 검색 흐름 설계
4. 독소조항 탐지 규칙/프롬프트 설계

이 문서는 현재까지의 작업을 내부 handoff 관점에서 정리한 문서다.
