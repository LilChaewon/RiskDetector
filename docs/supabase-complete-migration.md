# RiskDetector Supabase Complete Migration

이 문서는 Render에는 프론트엔드만 두고, 사용자-facing 백엔드 API와 DB를 Supabase로 이전하는 절차입니다. 기존 Render PostgreSQL 데이터는 복구하지 않고 새 Supabase DB에서 시작합니다.

## 1. Supabase 프로젝트 설정

1. Supabase 프로젝트를 생성합니다.
2. Authentication > Providers > Google을 켭니다.
3. Google Cloud OAuth 설정에 Supabase callback URL을 등록합니다.
4. Supabase Auth redirect URL에 Render 프론트 URL과 로컬 URL을 등록합니다.

```text
https://riskdetectorpeuronteuendeu.onrender.com/oauth2/callback
http://localhost:3000/oauth2/callback
```

## 2. DB와 seed 배포

```bash
supabase login
supabase link --project-ref PROJECT_REF
node scripts/supabase/generate_legal_tip_seed.mjs
supabase db push
```

그 다음 Supabase SQL Editor에서 `supabase/seed.sql`을 실행합니다. `psql`을 사용할 수 있으면 아래처럼 실행해도 됩니다.

```bash
psql "$SUPABASE_DATABASE_URL" -f supabase/seed.sql
```

## 3. Edge Function secrets

`supabase/functions/.env.example`을 참고해 비공개 env 파일을 만든 뒤 secrets로 올립니다.

```bash
supabase secrets set --env-file supabase/functions/.env.production
supabase functions deploy rd-api
```

필수 값은 `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`, `AWS_LAMBDA_OCR_FUNCTION`, `AWS_LAMBDA_ANALYSIS_FUNCTION`입니다. Supabase 기본 secret key가 함수 환경에 없으면 `SUPABASE_SERVICE_ROLE_KEY`도 설정합니다.

## 4. AWS result loader

`backend_ai/lambdas/analysis_result_loader/.env.supabase.example` 형식으로 DB 값을 Supabase에 맞춥니다.

```text
DB_HOST=aws-0-REGION.pooler.supabase.com
DB_PORT=5432
DB_NAME=postgres
DB_USERNAME=postgres.PROJECT_REF
DB_PASSWORD=YOUR_SUPABASE_DATABASE_PASSWORD
DB_SSLMODE=require
```

그 다음 `analysis_result_loader`를 재배포하고, Bedrock Lambda의 Destination/SQS 연결이 유지되는지 확인합니다.

## 5. Render 프론트 환경변수

Render에는 `riskdetector-frontend`만 배포합니다.

```text
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY
NEXT_PUBLIC_API_BASE_URL=https://PROJECT_REF.supabase.co/functions/v1/rd-api
NEXT_PUBLIC_MOCK_MODE=false
```

## 6. 확인 순서

1. Render 프론트에서 Google 로그인과 게스트 진입을 확인합니다.
2. `/auth/me`, `/dashboard`, `/tips`가 응답하는지 확인합니다.
3. 계약서 업로드 후 `prod.contracts`, `prod.ocr_content` row를 확인합니다.
4. 분석 시작 후 `prod.contract_analyses.process_status = IN_PROGRESS`가 생성되는지 확인합니다.
5. Bedrock 결과 적재 후 `contract_analyses`, `toxic_clauses`가 완료 상태로 갱신되는지 확인합니다.
6. 다른 guestId 또는 다른 Google 계정으로 같은 계약 조회가 404가 되는지 확인합니다.
