"""Deploy detector_bedrock_lambda with AWS CLI using local env credentials."""

from __future__ import annotations

import json
import os
import shutil
import subprocess
from pathlib import Path

import boto3

from build_package import build_package


REGION = "ap-northeast-2"
ENV_PATH = Path(__file__).with_name(".env")
DEFAULT_FUNCTION_NAME = "detector_bedrock_lambda"
DEFAULT_REFERENCE_FUNCTION_NAME = "detector_ocr_lambda"


def load_env_file() -> dict[str, str]:
    values: dict[str, str] = {}
    if not ENV_PATH.exists():
        return values

    for raw_line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip()
    return values


def build_aws_env() -> dict[str, str]:
    values = load_env_file()
    env = os.environ.copy()
    for key in ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_SESSION_TOKEN", "AWS_REGION", "AWS_DEFAULT_REGION"]:
        value = values.get(key, "").strip()
        if value:
            env[key] = value

    env.pop("AWS_PROFILE", None)
    env.pop("AWS_DEFAULT_PROFILE", None)
    return env


def run(cmd: list[str], env: dict[str, str]) -> None:
    result = subprocess.run(cmd, text=True, env=env, capture_output=True)
    if result.stdout:
        print(result.stdout)
    if result.stderr:
        print(result.stderr)
    result.check_returncode()


def build_boto3_session(env: dict[str, str]) -> boto3.session.Session:
    return boto3.Session(
        aws_access_key_id=env.get("AWS_ACCESS_KEY_ID") or None,
        aws_secret_access_key=env.get("AWS_SECRET_ACCESS_KEY") or None,
        aws_session_token=env.get("AWS_SESSION_TOKEN") or None,
        region_name=env.get("AWS_REGION") or env.get("AWS_DEFAULT_REGION") or REGION,
    )


def wait_until_function_ready(function_name: str, env: dict[str, str]) -> None:
    session = build_boto3_session(env)
    client = session.client("lambda")
    waiter = client.get_waiter("function_updated_v2")
    waiter.wait(FunctionName=function_name)


def ensure_function_exists(
    function_name: str,
    zip_path: Path,
    env: dict[str, str],
    env_vars: dict[str, object],
) -> None:
    session = build_boto3_session(env)
    client = session.client("lambda")

    try:
        client.get_function(FunctionName=function_name)
        return
    except client.exceptions.ResourceNotFoundException:
        pass

    reference = client.get_function_configuration(FunctionName=DEFAULT_REFERENCE_FUNCTION_NAME)
    role_arn = load_env_file().get("LAMBDA_ROLE_ARN", "").strip() or reference["Role"]
    runtime = load_env_file().get("LAMBDA_RUNTIME", "").strip() or reference.get("Runtime") or "python3.14"
    timeout = int(load_env_file().get("LAMBDA_TIMEOUT", "").strip() or reference.get("Timeout") or 120)
    memory_size = int(load_env_file().get("LAMBDA_MEMORY_SIZE", "").strip() or reference.get("MemorySize") or 512)
    architectures = reference.get("Architectures") or ["x86_64"]

    client.create_function(
        FunctionName=function_name,
        Runtime=runtime,
        Role=role_arn,
        Handler="lambdas.bedrock_lambda.handler.lambda_handler",
        Code={"ZipFile": zip_path.read_bytes()},
        Timeout=timeout,
        MemorySize=memory_size,
        Architectures=architectures,
        Environment=env_vars,
        Publish=True,
    )


def deploy() -> None:
    aws_bin = shutil.which("aws")
    if not aws_bin:
        raise RuntimeError("AWS CLI is required to deploy this Lambda.")

    values = load_env_file()
    function_name = values.get("LAMBDA_FUNCTION_NAME", "").strip() or DEFAULT_FUNCTION_NAME
    zip_path = build_package()
    env = build_aws_env()

    env_vars = {
        "Variables": {
            "LLM_PROVIDER": values.get("LLM_PROVIDER", "bedrock"),
            "BEDROCK_MODEL_ID": values.get("BEDROCK_MODEL_ID", ""),
            "BEDROCK_INFERENCE_PROFILE_ID": values.get("BEDROCK_INFERENCE_PROFILE_ID", ""),
            "BEDROCK_RETRIEVAL_RESULT_COUNT": values.get("BEDROCK_RETRIEVAL_RESULT_COUNT", ""),
            "GEMINI_API_KEY": values.get("GEMINI_API_KEY", ""),
            "GEMINI_MODEL_ID": values.get("GEMINI_MODEL_ID", ""),
            "GEMINI_FALLBACK_MODEL_ID": values.get("GEMINI_FALLBACK_MODEL_ID", ""),
            "KNOWLEDGE_BASE_ID": values.get("KNOWLEDGE_BASE_ID", ""),
            "ANALYSIS_RESULT_LOADER_MODE": values.get("ANALYSIS_RESULT_LOADER_MODE", ""),
            "ANALYSIS_RESULT_LOADER_FUNCTION_NAME": values.get("ANALYSIS_RESULT_LOADER_FUNCTION_NAME", ""),
        }
    }

    ensure_function_exists(function_name=function_name, zip_path=zip_path, env=env, env_vars=env_vars)

    run(
        [
            aws_bin,
            "lambda",
            "update-function-code",
            "--function-name",
            function_name,
            "--zip-file",
            f"fileb://{zip_path}",
            "--region",
            REGION,
        ],
        env=env,
    )
    wait_until_function_ready(function_name=function_name, env=env)

    run(
        [
            aws_bin,
            "lambda",
            "update-function-configuration",
            "--function-name",
            function_name,
            "--region",
            REGION,
            "--handler",
            "lambdas.bedrock_lambda.handler.lambda_handler",
            "--environment",
            json.dumps(env_vars, ensure_ascii=False),
        ],
        env=env,
    )
    wait_until_function_ready(function_name=function_name, env=env)

    print(f"Deployment finished for {function_name} in {REGION}")


def main() -> int:
    deploy()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
