"""Deploy detector_ocr_lambda with AWS CLI using local env credentials."""

from __future__ import annotations

import json
import os
import shutil
import subprocess
from pathlib import Path

from build_package import build_package


FUNCTION_NAME = "detector_ocr_lambda"
REGION = "ap-northeast-2"
ENV_PATH = Path(__file__).with_name(".env")


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
    for key in ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_SESSION_TOKEN", "AWS_REGION"]:
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


def deploy() -> None:
    aws_bin = shutil.which("aws")
    if not aws_bin:
        raise RuntimeError("AWS CLI is required to deploy this Lambda.")

    values = load_env_file()
    zip_path = build_package()
    env = build_aws_env()

    env_vars = {
        "Variables": {
            "S3_BUCKET": values.get("S3_BUCKET", ""),
            "UPSTAGE_API_KEY": values.get("UPSTAGE_API_KEY", ""),
            "AWS_REGION": values.get("AWS_REGION", REGION),
        }
    }

    run(
        [
            aws_bin,
            "lambda",
            "update-function-code",
            "--function-name",
            FUNCTION_NAME,
            "--zip-file",
            f"fileb://{zip_path}",
            "--region",
            REGION,
        ],
        env=env,
    )

    run(
        [
            aws_bin,
            "lambda",
            "update-function-configuration",
            "--function-name",
            FUNCTION_NAME,
            "--region",
            REGION,
            "--handler",
            "lambdas.ocr_lambda.handler.lambda_handler",
            "--environment",
            json.dumps(env_vars, ensure_ascii=False),
        ],
        env=env,
    )

    print(f"Deployment finished for {FUNCTION_NAME} in {REGION}")


def main() -> int:
    deploy()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
