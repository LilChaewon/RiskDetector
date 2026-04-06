"""Upload a local image or document to S3 for OCR lambda testing."""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from lambdas.ocr_lambda.handler import build_boto3_session, load_env_file


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Upload a local file to the OCR test S3 bucket.")
    parser.add_argument("file_path", help="Local file path to upload.")
    parser.add_argument(
        "--s3-key",
        default="test/sample_contract.jpeg",
        help="Destination key in S3. Default: test/sample_contract.jpeg",
    )
    parser.add_argument(
        "--bucket",
        default=None,
        help="Override S3 bucket. Defaults to S3_BUCKET from backend_ai/lambdas/ocr_lambda/.env.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    load_env_file()

    file_path = Path(args.file_path).expanduser().resolve()
    if not file_path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    session = build_boto3_session()
    s3_client = session.client("s3")
    bucket = args.bucket or os.getenv("S3_BUCKET", "").strip()
    if not bucket:
        raise ValueError("Missing S3 bucket. Pass --bucket or set S3_BUCKET in backend_ai/lambdas/ocr_lambda/.env.")

    s3_client.upload_file(str(file_path), bucket, args.s3_key)
    print(f"Uploaded {file_path} to s3://{bucket}/{args.s3_key}")


if __name__ == "__main__":
    main()
