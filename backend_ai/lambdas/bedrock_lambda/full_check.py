"""RiskDetector 파이프라인 전체 상태 자동 점검 스크립트"""
import json
import boto3
from pathlib import Path
import datetime

ENV_PATH = Path(".env")

def load_env():
    if not ENV_PATH.exists():
        return {}
    env = {}
    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        if line.strip() and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip()
    return env

env = load_env()
session = boto3.Session(
    aws_access_key_id=env.get("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=env.get("AWS_SECRET_ACCESS_KEY"),
    aws_session_token=env.get("AWS_SESSION_TOKEN"),
    region_name=env.get("AWS_REGION", "ap-northeast-2")
)

BEDROCK_LAMBDA = "detector_bedrock_lambda"
LOADER_LAMBDA  = "analysis_result_loader"
SQS_NAME       = "detector-analysis-result-queue"
ACCOUNT_ID     = "881748974654"
REGION         = "ap-northeast-2"
SQS_URL        = f"https://sqs.{REGION}.amazonaws.com/{ACCOUNT_ID}/{SQS_NAME}"
SQS_ARN        = f"arn:aws:sqs:{REGION}:{ACCOUNT_ID}:{SQS_NAME}"

passed = []
failed = []
warnings = []

def ok(msg):
    print(f"  ✅  {msg}")
    passed.append(msg)

def ng(msg):
    print(f"  ❌  {msg}")
    failed.append(msg)

def warn(msg):
    print(f"  ⚠️   {msg}")
    warnings.append(msg)

# ─────────────────────────────────────────────────────────
print("\n══════════════════════════════════════════════════")
print("  [1] bedrock_lambda 기본 구성 확인")
print("══════════════════════════════════════════════════")

lambda_client = session.client("lambda")
try:
    cfg = lambda_client.get_function_configuration(FunctionName=BEDROCK_LAMBDA)
    print(f"  FunctionName : {cfg['FunctionName']}")
    print(f"  State        : {cfg.get('State')}")
    print(f"  Timeout      : {cfg.get('Timeout')}s")
    print(f"  MemorySize   : {cfg.get('MemorySize')}MB")
    print(f"  Runtime      : {cfg.get('Runtime')}")
    print(f"  Handler      : {cfg.get('Handler')}")

    if cfg.get("State") == "Active":
        ok("Lambda State = Active")
    else:
        ng(f"Lambda State = {cfg.get('State')} (Active 아님)")

    if cfg.get("Timeout", 0) >= 90:
        ok(f"Timeout {cfg['Timeout']}s ≥ 90s")
    else:
        warn(f"Timeout {cfg.get('Timeout')}s < 90s → 분석 중 강제 종료 위험")

    if cfg.get("MemorySize", 0) >= 512:
        ok(f"MemorySize {cfg['MemorySize']}MB ≥ 512MB")
    else:
        warn(f"MemorySize {cfg.get('MemorySize')}MB < 512MB → OOM 위험")

    # Destination 확인
    dst = cfg.get("DestinationConfig", {})
    on_success = dst.get("OnSuccess", {}).get("Destination", "")
    if SQS_ARN in on_success:
        ok(f"Destination → SQS: {on_success}")
    else:
        ng(f"DestinationConfig.OnSuccess 가 SQS ARN과 불일치. 현재값: '{on_success}'")

    # 환경변수 확인
    evars = cfg.get("Environment", {}).get("Variables", {})
    required_vars = ["KNOWLEDGE_BASE_ID", "BEDROCK_MODEL_ID", "LLM_PROVIDER"]
    for v in required_vars:
        if evars.get(v):
            ok(f"환경변수 {v} = {evars[v]}")
        else:
            ng(f"환경변수 {v} 없음 또는 비어 있음")

except Exception as e:
    ng(f"bedrock_lambda 구성 조회 실패: {e}")

# ─────────────────────────────────────────────────────────
print("\n══════════════════════════════════════════════════")
print("  [2] Lambda 실행 역할(IAM) 권한 확인")
print("══════════════════════════════════════════════════")

try:
    cfg = lambda_client.get_function_configuration(FunctionName=BEDROCK_LAMBDA)
    role_arn = cfg.get("Role", "")
    role_name = role_arn.split("/")[-1]
    print(f"  Role ARN: {role_arn}")

    iam = session.client("iam")
    policies = iam.list_attached_role_policies(RoleName=role_name)["AttachedPolicies"]
    inline   = iam.list_role_policies(RoleName=role_name)["PolicyNames"]
    all_policy_names = [p["PolicyName"] for p in policies] + inline
    print(f"  Attached/Inline 정책: {all_policy_names}")

    if any("Basic" in p or "LambdaBasic" in p for p in all_policy_names):
        ok("AWSLambdaBasicExecutionRole (CloudWatch 로그 권한) 확인")
    else:
        warn("AWSLambdaBasicExecutionRole 미확인 → CloudWatch 로그 기록 안 될 수 있음")

    # 인라인 정책 내용 조회
    found_bedrock = False
    found_sqs = False
    for pname in inline:
        doc = iam.get_role_policy(RoleName=role_name, PolicyName=pname)["PolicyDocument"]
        doc_str = json.dumps(doc)
        if "bedrock:InvokeModel" in doc_str or "bedrock:*" in doc_str:
            found_bedrock = True
        if "sqs:SendMessage" in doc_str or "SQS:*" in doc_str:
            found_sqs = True

    if found_bedrock:
        ok("bedrock:InvokeModel 권한 확인 (인라인 정책)")
    else:
        ng("bedrock:InvokeModel 권한 없음 → AI 호출 실패 원인")

    if found_sqs:
        ok("sqs:SendMessage 권한 확인 (인라인 정책)")
    else:
        warn("IAM 역할에 sqs:SendMessage 없음 → SQS 큐 정책에서 허용했다면 무방")

except Exception as e:
    warn(f"IAM 정책 상세 조회 실패 (권한 부족일 수 있음): {e}")

# ─────────────────────────────────────────────────────────
print("\n══════════════════════════════════════════════════")
print("  [3] SQS 큐 설정 확인")
print("══════════════════════════════════════════════════")

try:
    sqs = session.client("sqs")
    attrs = sqs.get_queue_attributes(
        QueueUrl=SQS_URL,
        AttributeNames=["All"]
    )["Attributes"]

    vt = int(attrs.get("VisibilityTimeout", 0))
    retention = int(attrs.get("MessageRetentionPeriod", 0))
    dlq = attrs.get("RedrivePolicy", "")
    policy = json.loads(attrs.get("Policy", "{}"))

    print(f"  VisibilityTimeout      : {vt}s")
    print(f"  MessageRetentionPeriod : {retention}s ({retention//86400}일)")

    if vt >= 60:
        ok(f"VisibilityTimeout {vt}s ≥ 60s")
    else:
        warn(f"VisibilityTimeout {vt}s 가 짧음 → 60s 이상 권장")

    if retention >= 345600:  # 4일
        ok(f"메시지 보존 기간 {retention//86400}일 ≥ 4일")
    else:
        warn(f"메시지 보존 기간 {retention//86400}일 < 4일 → 너무 빨리 삭제될 수 있음")

    if dlq:
        ok(f"DLQ(Dead-Letter Queue) 설정됨: {dlq}")
    else:
        warn("DLQ 미설정 → 처리 실패 시 메시지가 사라질 수 있음")

    # SQS 정책에 Lambda 서비스 허용 여부
    stmts = policy.get("Statement", [])
    lambda_allowed = any(
        stmt.get("Principal", {}) == {"Service": "lambda.amazonaws.com"} or
        "lambda.amazonaws.com" in json.dumps(stmt.get("Principal", {}))
        for stmt in stmts
    )
    if lambda_allowed:
        ok("SQS 정책에 lambda.amazonaws.com 서비스 원칙 허용됨")
    else:
        ng("SQS 정책에 lambda.amazonaws.com 미포함 → Lambda가 SendMessage 불가")

except Exception as e:
    ng(f"SQS 큐 속성 조회 실패: {e}")

# ─────────────────────────────────────────────────────────
print("\n══════════════════════════════════════════════════")
print("  [4] analysis_result_loader Lambda 확인")
print("══════════════════════════════════════════════════")

try:
    loader_cfg = lambda_client.get_function_configuration(FunctionName=LOADER_LAMBDA)
    print(f"  State   : {loader_cfg.get('State')}")
    print(f"  Timeout : {loader_cfg.get('Timeout')}s")

    if loader_cfg.get("State") == "Active":
        ok("analysis_result_loader Lambda State = Active")
    else:
        ng(f"analysis_result_loader State = {loader_cfg.get('State')}")

    # SQS 이벤트 소스 매핑 확인
    mappings = lambda_client.list_event_source_mappings(FunctionName=LOADER_LAMBDA)["EventSourceMappings"]
    sqs_mapping = [m for m in mappings if SQS_ARN in m.get("EventSourceArn", "")]
    if sqs_mapping:
        m = sqs_mapping[0]
        print(f"  SQS 이벤트 소스 매핑: State={m.get('State')}, BatchSize={m.get('BatchSize')}")
        if m.get("State") == "Enabled":
            ok("analysis_result_loader ↔ SQS 이벤트 소스 매핑 활성화됨")
        else:
            ng(f"이벤트 소스 매핑 State = {m.get('State')} (Enabled 아님)")
    else:
        ng(f"analysis_result_loader에 SQS 이벤트 소스 매핑 없음 → SQS 메시지가 와도 트리거 안 됨")

except Exception as e:
    ng(f"analysis_result_loader 확인 실패: {e}")

# ─────────────────────────────────────────────────────────
print("\n══════════════════════════════════════════════════")
print("  [5] CloudWatch 최근 호출 기록 확인")
print("══════════════════════════════════════════════════")

logs_client = session.client("logs")
start_time = int((datetime.datetime.now() - datetime.timedelta(hours=24)).timestamp() * 1000)

for fn_name in [BEDROCK_LAMBDA, LOADER_LAMBDA]:
    log_group = f"/aws/lambda/{fn_name}"
    try:
        events = logs_client.filter_log_events(
            logGroupName=log_group,
            startTime=start_time,
            limit=5
        ).get("events", [])
        if events:
            latest = events[-1]
            t = datetime.datetime.fromtimestamp(latest["timestamp"]/1000).strftime('%Y-%m-%d %H:%M:%S')
            ok(f"{fn_name}: 최근 로그 있음 (마지막: {t})")
        else:
            ng(f"{fn_name}: 최근 24시간 이내 호출 기록 없음")
    except Exception as e:
        warn(f"{fn_name} 로그 조회 실패: {e}")

# ─────────────────────────────────────────────────────────
print("\n══════════════════════════════════════════════════")
print("  [6] bedrock_lambda 실제 호출 테스트 (test_event.json)")
print("══════════════════════════════════════════════════")

try:
    with open("test_event.json", "r") as f:
        payload = f.read()

    print("  Lambda 호출 중... (최대 90초 소요)")
    response = lambda_client.invoke(
        FunctionName=BEDROCK_LAMBDA,
        InvocationType="RequestResponse",
        Payload=payload
    )
    result = json.loads(response["Payload"].read().decode("utf-8"))
    success = result.get("success", False)
    if success:
        analysis = result.get("data", {}).get("analysis", {})
        clauses = analysis.get("clauses", [])
        ok(f"Lambda 호출 성공! 감지된 독소 조항 수: {len(clauses)}개")
        for c in clauses:
            print(f"    🚨 [{c.get('riskLevel','?').upper()}] {c.get('riskType','?')}")
        loader_result = result.get("data", {}).get("resultLoader", {})
        print(f"  ResultLoader: mode={loader_result.get('mode')}, success={loader_result.get('success')}")
        if loader_result.get("success"):
            ok("ResultLoader 전송 성공 (SQS Destination 또는 직접 호출)")
        else:
            warn(f"ResultLoader 이슈: {loader_result.get('message','')}")
    else:
        ng(f"Lambda 호출 실패: {result.get('error','Unknown')}")

except Exception as e:
    ng(f"Lambda 실제 호출 중 예외: {e}")

# ─────────────────────────────────────────────────────────
print("\n══════════════════════════════════════════════════")
print("  📊 최종 점검 결과 요약")
print("══════════════════════════════════════════════════")
print(f"\n  ✅ 통과: {len(passed)}개")
print(f"  ❌ 실패: {len(failed)}개")
print(f"  ⚠️  경고: {len(warnings)}개")

if failed:
    print("\n  🔴 즉시 조치 필요:")
    for f_ in failed:
        print(f"    - {f_}")

if warnings:
    print("\n  🟠 권장 조치:")
    for w in warnings:
        print(f"    - {w}")

if not failed:
    print("\n  🎉 모든 핵심 항목 통과! 파이프라인 정상 동작 가능합니다.")
