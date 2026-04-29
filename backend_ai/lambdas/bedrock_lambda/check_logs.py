import boto3
from pathlib import Path
import datetime

ENV_PATH = Path(".env")
def load_env():
    if not ENV_PATH.exists(): return {}
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

client = session.client("logs")
log_group = "/aws/lambda/detector_bedrock_lambda"

print(f"[{log_group}] 최근 1시간 이내의 로그를 검색합니다...\n")

try:
    # 1시간 전 시간 계산 (밀리초)
    start_time = int((datetime.datetime.now() - datetime.timedelta(hours=1)).timestamp() * 1000)
    
    response = client.filter_log_events(
        logGroupName=log_group,
        startTime=start_time,
        limit=50 # 최신 50개만
    )
    
    events = response.get("events", [])
    if not events:
        print("최근 1시간 내에 람다가 호출된 기록이 없습니다! (백엔드에서 호출하지 않았거나 에러가 났을 수 있습니다.)")
    else:
        for event in events:
            # 타임스탬프 변환
            time_str = datetime.datetime.fromtimestamp(event["timestamp"] / 1000.0).strftime('%Y-%m-%d %H:%M:%S')
            message = event["message"].strip()
            print(f"[{time_str}] {message}")

except Exception as e:
    print(f"로그를 불러오는 중 에러가 발생했습니다: {e}")
