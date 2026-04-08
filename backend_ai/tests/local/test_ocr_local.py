"""Local runner for backend_ai OCR lambda."""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from lambdas.ocr_lambda.handler import lambda_handler, load_env_file


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the OCR lambda locally against an S3 object.")
    parser.add_argument("--s3-key", default="test/sample_contract.jpeg", help="S3 object key to parse.")
    parser.add_argument("--page-idx", type=int, default=0, help="Zero-based page index to parse.")
    parser.add_argument("--bucket", default=None, help="Override S3 bucket.")
    parser.add_argument("--api-key", default=None, help="Override UPSTAGE_API_KEY for this run.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    load_env_file()

    if args.api_key:
        os.environ["UPSTAGE_API_KEY"] = args.api_key

    event = {
        "s3Key": args.s3_key,
        "pageIdx": args.page_idx,
    }
    if args.bucket:
        event["bucket"] = args.bucket

    result = lambda_handler(event, None)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
