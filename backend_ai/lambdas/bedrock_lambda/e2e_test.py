"""
E2E 통합 테스트 시뮬레이션
─────────────────────────────────────
실제 백엔드(Spring) + 프론트엔드(Next.js) 역할을 파이썬으로 시뮬레이션합니다.

[시나리오]
  STEP 1. [백엔드] OCR 텍스트를 payload로 bedrock_lambda를 비동기(Event) 호출
  STEP 2. [AWS]    Lambda 실행 완료 → Destination → SQS → analysis_result_loader 트리거
  STEP 3. [백엔드] DB에서 analysisId로 process_status 폴링 (최대 90초)
  STEP 4. [프론트] completed 상태 확인 → 최종 결과(독소 조항 목록) 출력
"""

import json
import os
import time
import uuid
from pathlib import Path

import boto3
import pg8000

# ──────────────────────────────────────────
# 환경 변수 로드 (.env 두 곳을 읽음)
# ──────────────────────────────────────────
def load_env(path: Path):
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())

# bedrock_lambda .env (AWS 자격 증명)
load_env(Path(__file__).parent / ".env")
# analysis_result_loader .env (DB 접속 정보)
load_env(Path(__file__).parent.parent / "analysis_result_loader" / ".env")

REGION = "ap-northeast-2"
BEDROCK_LAMBDA = "detector_bedrock_lambda"
SQS_URL = f"https://sqs.{REGION}.amazonaws.com/881748974654/detector-analysis-result-queue"
KNOWLEDGE_BASE_ID = os.getenv("KNOWLEDGE_BASE_ID", "UXAFF3UKTQ")

# AWS 프로파일 충돌 방지 (로컬 ~/.aws/config 프로파일과 충돌 제거)
os.environ.pop("AWS_PROFILE", None)
os.environ.pop("AWS_DEFAULT_PROFILE", None)

session = boto3.Session(
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    aws_session_token=os.getenv("AWS_SESSION_TOKEN"),
    region_name=REGION,
)

lambda_client = session.client("lambda")


# ──────────────────────────────────────────
# DB 연결 (analysis_result_loader 방식과 동일)
# ──────────────────────────────────────────
def connect_db():
    return pg8000.connect(
        user=os.environ["DB_USERNAME"],
        password=os.environ["DB_PASSWORD"],
        host=os.environ["DB_HOST"],
        port=int(os.environ["DB_PORT"]),
        database=os.environ["DB_NAME"],
        ssl_context=None if os.getenv("DB_SSLMODE", "disable") == "disable" else __import__("ssl").create_default_context(),
        timeout=10,
    )


# ──────────────────────────────────────────
# 실제 계약서 OCR 샘플 텍스트 (임대차)
# ──────────────────────────────────────────
SAMPLE_CONTRACT_TEXTS = [
    "제1조 (목적) 임대인 김철수와 임차인 이영희는 서울시 강남구 역삼동 101호(이하 '본 건물')에 관하여 아래와 같이 임대차 계약을 체결한다.",
    "제2조 (보증금 및 임대료) 보증금은 금 삼천만원정(₩30,000,000)이며, 월 임대료는 금 팔십만원정(₩800,000)으로 한다. 보증금은 계약 체결 시 전액 지급한다.",
    "제3조 (원상복구) 임차인은 퇴거 시 최초 임대 당시 상태로 원상복구하여야 하며, 이에 필요한 모든 비용은 임차인이 부담한다. 단순 노후화에 따른 손모도 임차인의 책임으로 한다.",
    "제4조 (계약 해지) 임차인이 2개월분 이상의 임대료를 연체하는 경우 임대인은 즉시 본 계약을 해지할 수 있으며, 임차인은 보증금의 10%를 위약금으로 납부하여야 한다.",
    "제5조 (관리비) 임차인은 매월 관리비 30만원을 별도로 부담한다. 관리비 항목의 세부 내역은 임대인이 임의로 결정한다.",
    "제6조 (특약사항) 임차인은 임대인의 동의 없이 전대, 양도, 담보제공을 할 수 없다. 임차인은 계약 종료 1개월 전까지 퇴거 의사를 서면으로 통보하여야 하며, 미통보 시 보증금에서 1개월분 임대료를 공제한다.",
]


def sep(title: str):
    print(f"\n{'═'*55}")
    print(f"  {title}")
    print(f"{'═'*55}")


# ══════════════════════════════════════════════════════
print("\n🚀 RiskDetector E2E 통합 테스트 시작")
print("   (백엔드 + AI Lambda + DB 전 구간 시뮬레이션)")

contract_id = f"e2e-contract-{uuid.uuid4().hex[:8]}"
analysis_id = f"e2e-analysis-{uuid.uuid4().hex[:8]}"

sep("STEP 1 | [백엔드] bedrock_lambda 비동기 호출 (InvocationType=Event)")
print(f"  contractId  : {contract_id}")
print(f"  analysisId  : {analysis_id}")
print(f"  텍스트 조각 수 : {len(SAMPLE_CONTRACT_TEXTS)}개")

payload = {
    "contractId": contract_id,
    "analysisId": analysis_id,
    "contractTexts": SAMPLE_CONTRACT_TEXTS,
    "knowledgeBaseId": KNOWLEDGE_BASE_ID,
}

try:
    resp = lambda_client.invoke(
        FunctionName=BEDROCK_LAMBDA,
        InvocationType="Event",          # ← 실제 백엔드가 사용하는 비동기 방식
        Payload=json.dumps(payload, ensure_ascii=False).encode(),
    )
    status_code = resp.get("StatusCode")
    if status_code == 202:
        print(f"  ✅ Lambda 비동기 호출 성공 (HTTP 202 Accepted)")
        print(f"  ℹ️  AWS가 백그라운드에서 분석 중... (Destination → SQS 자동 전송 예정)")
    else:
        print(f"  ❌ 비정상 응답 코드: {status_code}")
        exit(1)
except Exception as e:
    print(f"  ❌ Lambda 호출 실패: {e}")
    exit(1)

sep("STEP 2 | [AWS] Lambda 실행 중 → Destination → SQS → analysis_result_loader")
print("  ⏳ AWS 내부 파이프라인 처리 대기 중...")
print("     (Lambda 분석 + SQS 전송 + analysis_result_loader DB 저장)")

sep("STEP 3 | [백엔드 Polling] DB에서 analysisId로 process_status 확인")
print(f"  최대 90초 대기, 3초 간격으로 폴링...")

# DB 연결 시도
try:
    conn = connect_db()
    db_available = True
    print("  ✅ DB 연결 성공")
except Exception as e:
    db_available = False
    print(f"  ⚠️  DB 연결 실패 (SQS 대기): {e}")
    print("  → DB 연결 없이 SQS 메시지 수신으로 결과 확인합니다.")

POLL_INTERVAL = 5
MAX_WAIT = 90
start = time.time()
final_result = None

if db_available:
    while time.time() - start < MAX_WAIT:
        elapsed = int(time.time() - start)
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT process_status, summary FROM prod.contract_analyses WHERE id = %s",
                    (analysis_id,)
                )
                row = cur.fetchone()
                if row:
                    process_status, summary = row
                    print(f"  [{elapsed:>3}s] process_status = {process_status}")
                    if process_status == "COMPLETED":
                        print("  ✅ 분석 완료! DB에 결과 저장됨.")
                        final_result = {"process_status": process_status, "summary": summary}
                        break
                    elif process_status == "FAILED":
                        print("  ❌ 분석 실패 상태로 저장됨.")
                        break
                else:
                    print(f"  [{elapsed:>3}s] DB에 아직 레코드 없음 (AI 분석 중...)")
        except Exception as e:
            print(f"  [{elapsed:>3}s] DB 조회 오류: {e}")
        time.sleep(POLL_INTERVAL)

    if final_result is None:
        print(f"  ⚠️  {MAX_WAIT}초 대기 후에도 COMPLETED 상태 미확인.")
        print("     → analysis_result_loader 배포 상태나 DB .env 확인 필요")
else:
    # DB 없으면 SQS 에서 직접 메시지 수신해서 결과 확인
    sqs_client = session.client("sqs")
    print("  SQS 메시지 직접 수신으로 결과 확인 중...")
    while time.time() - start < MAX_WAIT:
        elapsed = int(time.time() - start)
        msgs = sqs_client.receive_message(
            QueueUrl=SQS_URL,
            MaxNumberOfMessages=1,
            WaitTimeSeconds=5,
        ).get("Messages", [])
        if msgs:
            body_str = msgs[0].get("Body", "{}")
            body = json.loads(body_str)
            # Lambda Destination 메시지 구조 파싱
            inner = body.get("responsePayload") or body
            cid = (inner.get("data") or {}).get("contractId", "")
            aid = (inner.get("data") or {}).get("analysisId", "")
            if aid == analysis_id:
                print(f"  [{elapsed:>3}s] ✅ SQS에서 내 analysisId 메시지 수신!")
                final_result = inner
                # 메시지 삭제
                sqs_client.delete_message(QueueUrl=SQS_URL, ReceiptHandle=msgs[0]["ReceiptHandle"])
                break
            else:
                print(f"  [{elapsed:>3}s] 다른 분석 ID 메시지 수신 (무시): {aid}")
        else:
            print(f"  [{elapsed:>3}s] 대기 중...")

sep("STEP 4 | [프론트엔드] 최종 결과 렌더링")

if final_result:
    data = final_result.get("data", final_result)
    analysis = data.get("analysis", {})
    toxics   = analysis.get("clauses", data.get("toxics", []))
    summary  = analysis.get("summary", data.get("summary", "N/A"))
    risk     = analysis.get("riskLevel", data.get("riskLevel", "N/A"))
    usage    = data.get("usage", {})

    print(f"\n  📄 계약서 요약: {summary}")
    print(f"  🔥 전체 위험도 : {risk.upper() if risk else 'N/A'}")
    print(f"  📊 독소 조항 수: {len(toxics)}개")
    print(f"  🤖 사용 모델   : {data.get('modelId', 'N/A')}")
    print(f"  💰 토큰 사용량 : input={usage.get('inputTokens','?')}, output={usage.get('outputTokens','?')}")

    if toxics:
        print("\n  ─── 독소 조항 목록 ────────────────────────────────")
        RISK_ICON = {"high": "🚨", "medium": "⚠️ ", "low": "📌"}
        for i, t in enumerate(toxics, 1):
            level = (t.get("riskLevel") or "medium").lower()
            icon  = RISK_ICON.get(level, "❓")
            print(f"\n  [{i}] {icon} [{level.upper()}] {t.get('riskType') or t.get('title','?')}")
            print(f"       조항: {(t.get('clauseText') or t.get('clause',''))[:80]}...")
            print(f"       이유: {t.get('reason','')[:100]}")
            src = t.get("sourceIds") or t.get("reasonReference") or []
            if isinstance(src, list): src = ", ".join(src)
            print(f"       근거: {src}")
else:
    print("  ❌ 최종 결과를 가져오지 못했습니다.")

# ══════════════════════════════════════════════════════
sep("📊 E2E 테스트 최종 피드백")
print()
if db_available and final_result:
    print("  🎉 E2E 전 구간 성공! 파이프라인이 완벽하게 동작합니다.")
elif not db_available and final_result:
    print("  ✅ Lambda→SQS 구간 성공, DB 연결만 확인하면 완전체 완성!")
    print("  🔧 피드백: analysis_result_loader의 .env DB 정보가 실제 RDS에 맞게")
    print("            설정되어 있는지 최종 확인 필요합니다.")
elif db_available and not final_result:
    print("  ⚠️  Lambda 호출은 됐지만 DB에 결과가 저장되지 않았습니다.")
    print("  🔧 피드백: analysis_result_loader Lambda의 CloudWatch 로그를 확인하세요.")
else:
    print("  ⚠️  Lambda→SQS 전송은 됐지만 결과 수신 실패.")
    print("  🔧 피드백:")
    print("     1. analysis_result_loader DB .env 설정 확인")
    print("     2. Lambda Destination의 OnSuccess → SQS 설정 확인")
    print("     3. /aws/lambda/analysis_result_loader CloudWatch 로그 확인")
print()
