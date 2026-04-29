import json
import boto3
from pathlib import Path
import os

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

client = session.client("lambda")

with open("test_event.json", "r") as f:
    payload = f.read()

print("Invoking detector_bedrock_lambda...")
response = client.invoke(
    FunctionName="detector_bedrock_lambda",
    InvocationType="RequestResponse",
    Payload=payload
)

response_payload = json.loads(response["Payload"].read().decode("utf-8"))
print(json.dumps(response_payload, indent=2, ensure_ascii=False))
