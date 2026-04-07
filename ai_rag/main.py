"""Entry point for AI RAG data collection tests."""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
from pathlib import Path
from urllib.error import URLError

from config import S3_BUCKET
from easylaw_crawler import crawl_easylaw, save_qa_documents
from law_open_api_crawler import (
    crawl_law_open_api,
    crawl_precedent_open_api,
    save_law_search_results,
    save_precedent_results,
)


ENV_PATH = Path(".env")
BACKEND_AI_ENV_PATH = Path("../backend_ai/lambdas/ocr_lambda/.env")


def load_env_file(env_path: Path = ENV_PATH) -> None:
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


def load_backend_ai_fallback_env(env_path: Path = BACKEND_AI_ENV_PATH) -> None:
    if not env_path.exists():
        return

    allowed_keys = {
        "AWS_ACCESS_KEY_ID",
        "AWS_SECRET_ACCESS_KEY",
        "AWS_SESSION_TOKEN",
        "AWS_REGION",
        "S3_BUCKET",
    }
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        if key in allowed_keys:
            os.environ.setdefault(key, value.strip())


def get_aws_profile() -> str | None:
    if os.getenv("AWS_ACCESS_KEY_ID", "").strip() and os.getenv("AWS_SECRET_ACCESS_KEY", "").strip():
        return None
    profile = os.getenv("AWS_PROFILE", "").strip()
    return profile or None


def get_s3_bucket() -> str:
    return os.getenv("S3_BUCKET", "").strip() or S3_BUCKET


def get_existing_saved_paths(output_dir: Path) -> list[Path]:
    return sorted(output_dir.glob("qa_*.txt"))


def run_aws_command(args: list[str]) -> subprocess.CompletedProcess[str]:
    aws_bin = shutil.which("aws")
    if not aws_bin:
        raise RuntimeError("AWS CLI is not installed.")
    return subprocess.run(
        [aws_bin, *args],
        check=True,
        text=True,
        capture_output=True,
    )


def upload_files_to_s3(saved_paths: list[Path], bucket: str, prefix: str) -> None:
    profile = get_aws_profile()
    uploaded_count = 0
    for path in saved_paths:
        key = f"{prefix}/{path.name}"
        command = ["s3", "cp", str(path), f"s3://{bucket}/{key}"]
        if profile:
            command.extend(["--profile", profile])
        run_aws_command(command)
        uploaded_count += 1
    print(f"[INFO] Uploaded {uploaded_count} individual txt files to S3")


def run_easylaw(mode: str) -> int:
    load_env_file()
    load_backend_ai_fallback_env()
    output_dir = Path("data/easylaw/qa_data")
    limit = int(os.getenv("EASYLAW_LIMIT", "600").strip() or "600")
    try:
        documents = crawl_easylaw(limit=limit, verbose=True)
        saved_paths = save_qa_documents(documents, output_dir=output_dir)

        print(f"Saved {len(saved_paths)} Easylaw Q&A files to {output_dir}")
        for path in saved_paths:
            print(path)
    except URLError as exc:
        saved_paths = get_existing_saved_paths(output_dir)
        if mode == "s3" and saved_paths:
            print(f"[WARN] Crawling failed, using existing local QA files instead: {exc}")
        else:
            raise

    if mode == "local":
        return 0

    if mode == "s3":
        upload_files_to_s3(saved_paths=saved_paths, bucket=get_s3_bucket(), prefix="easylaw")
        return 0

    print(f"Unsupported mode: {mode}. Supported modes: local, s3")
    return 1


def run_law_open_api(mode: str) -> int:
    load_env_file()
    load_backend_ai_fallback_env()
    query = os.getenv("LAW_OPEN_API_QUERY", "").strip() or "근로계약"
    output_dir = Path("data/law_open_api")

    payload, items = crawl_law_open_api(query=query, verbose=True)
    saved_paths = save_law_search_results(payload=payload, items=items, output_dir=output_dir)

    print(f"Saved {len(saved_paths)} law_open_api files to {output_dir}")
    for path in saved_paths:
        print(path)

    if mode == "local":
        return 0

    if mode == "s3":
        upload_files_to_s3(saved_paths=saved_paths, bucket=get_s3_bucket(), prefix="law_open_api")
        return 0

    print(f"Unsupported mode: {mode}. Supported modes: local, s3")
    return 1


def run_law_open_api_precedent(mode: str) -> int:
    load_env_file()
    load_backend_ai_fallback_env()
    raw_keywords = os.getenv("LAW_OPEN_API_PRECEDENT_KEYWORDS", "").strip()
    keywords = [item.strip() for item in raw_keywords.split(",") if item.strip()] if raw_keywords else None
    output_dir = Path("data/law_open_api/precedent")

    payloads, precedents = crawl_precedent_open_api(keywords=keywords, verbose=True)
    saved_paths = save_precedent_results(payloads, precedents, output_dir=output_dir)

    print(f"Saved {len(saved_paths)} law_open_api precedent files to {output_dir}")
    for path in saved_paths:
        print(path)

    if mode == "local":
        return 0

    if mode == "s3":
        upload_files_to_s3(saved_paths=saved_paths, bucket=get_s3_bucket(), prefix="law_open_api/precedent")
        return 0

    print(f"Unsupported mode: {mode}. Supported modes: local, s3")
    return 1


def main(argv: list[str]) -> int:
    if len(argv) != 3:
        print("Usage: python main.py [easylaw|law_open_api|las_open_api|law_open_api_precedent] [local|s3]")
        return 1

    source = argv[1].strip().lower()
    mode = argv[2].strip().lower()

    if source == "easylaw":
        return run_easylaw(mode)
    if source in {"law_open_api", "las_open_api"}:
        return run_law_open_api(mode)
    if source in {"law_open_api_precedent", "las_open_api_precedent"}:
        return run_law_open_api_precedent(mode)

    print(f"Unsupported source: {source}")
    return 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
