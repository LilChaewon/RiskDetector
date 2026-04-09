"""Entry point for AI RAG data collection tests."""

from __future__ import annotations

import os
import json
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
EASYLAW_STATE_PATH = Path("data/easylaw/.crawl_state.json")


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


def extract_source_url_from_file(path: Path) -> str | None:
    try:
        for line in path.read_text(encoding="utf-8").splitlines():
            if line.startswith("원문URL:"):
                value = line.split(":", 1)[1].strip()
                return value or None
    except OSError:
        return None
    return None


def load_easylaw_known_urls(output_dir: Path, state_path: Path = EASYLAW_STATE_PATH) -> set[str]:
    known_urls: set[str] = set()
    if state_path.exists():
        try:
            payload = json.loads(state_path.read_text(encoding="utf-8"))
            urls = payload.get("source_urls", [])
            if isinstance(urls, list):
                known_urls.update(str(item).strip() for item in urls if str(item).strip())
        except (OSError, json.JSONDecodeError):
            pass

    for path in get_existing_saved_paths(output_dir):
        source_url = extract_source_url_from_file(path)
        if source_url:
            known_urls.add(source_url)
    return known_urls


def save_easylaw_state(known_urls: set[str], state_path: Path = EASYLAW_STATE_PATH) -> None:
    state_path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "source_urls": sorted(known_urls),
    }
    state_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def get_next_qa_index(output_dir: Path) -> int:
    indices: list[int] = []
    for path in get_existing_saved_paths(output_dir):
        try:
            indices.append(int(path.stem.split("_", 1)[1]))
        except (IndexError, ValueError):
            continue
    return (max(indices) + 1) if indices else 1


def upload_files_to_s3(saved_paths: list[Path], bucket: str, prefix: str) -> None:
    import boto3
    from concurrent.futures import ThreadPoolExecutor

    profile = get_aws_profile()
    session_kwargs = {}
    if profile:
        session_kwargs["profile_name"] = profile
    
    session = boto3.Session(**session_kwargs)
    s3_client = session.client("s3")
    
    def upload_single_file(path: Path) -> None:
        key = f"{prefix}/{path.name}"
        s3_client.upload_file(str(path), bucket, key)

    with ThreadPoolExecutor(max_workers=10) as executor:
        list(executor.map(upload_single_file, saved_paths))

    print(f"[INFO] Uploaded {len(saved_paths)} individual txt files to S3 via boto3")


def run_easylaw(mode: str, only_new: bool = False) -> int:
    load_env_file()
    load_backend_ai_fallback_env()
    output_dir = Path("data/easylaw/qa_data")
    limit = int(os.getenv("EASYLAW_LIMIT", "600").strip() or "600")
    known_urls = load_easylaw_known_urls(output_dir) if only_new else set()

    try:
        documents = crawl_easylaw(limit=limit, verbose=True)
        if only_new:
            new_documents = [document for document in documents if document.source_url not in known_urls]
            if new_documents:
                saved_paths = save_qa_documents(
                    new_documents,
                    output_dir=output_dir,
                    clear_existing=False,
                    start_index=get_next_qa_index(output_dir),
                )
                known_urls.update(document.source_url for document in new_documents)
                save_easylaw_state(known_urls)
            else:
                saved_paths = []
                print("[INFO] No new Easylaw documents found since the last crawl.")
        else:
            saved_paths = save_qa_documents(documents, output_dir=output_dir)
            save_easylaw_state({document.source_url for document in documents})

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
        if only_new and not saved_paths:
            print("[INFO] Skipping S3 upload because no new Easylaw files were created.")
            return 0
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
    if len(argv) < 3:
        print("Usage: python main.py [easylaw|law_open_api|las_open_api|law_open_api_precedent] [local|s3] [optional flags]")
        return 1

    source = argv[1].strip().lower()
    mode = argv[2].strip().lower()
    option_tokens = {token.strip().lower() for token in argv[3:]}
    only_new = "only_new" in option_tokens

    if source == "easylaw":
        return run_easylaw(mode, only_new=only_new)
    if source in {"law_open_api", "las_open_api"}:
        return run_law_open_api(mode)
    if source in {"law_open_api_precedent", "las_open_api_precedent"}:
        return run_law_open_api_precedent(mode)

    print(f"Unsupported source: {source}")
    return 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
