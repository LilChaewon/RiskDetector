"""Entry point for local AI RAG data collection tests."""

from __future__ import annotations

import sys
from pathlib import Path

from easylaw_crawler import crawl_easylaw, save_qa_documents


def run_easylaw(mode: str) -> int:
    if mode != "local":
        print(f"Unsupported mode: {mode}. Only 'local' is implemented right now.")
        return 1

    output_dir = Path("data/easylaw/qa_data")
    documents = crawl_easylaw()
    saved_paths = save_qa_documents(documents, output_dir=output_dir)

    print(f"Saved {len(saved_paths)} Easylaw Q&A files to {output_dir}")
    for path in saved_paths:
        print(path)
    return 0


def main(argv: list[str]) -> int:
    if len(argv) != 3:
        print("Usage: python main.py easylaw local")
        return 1

    source = argv[1].strip().lower()
    mode = argv[2].strip().lower()

    if source == "easylaw":
        return run_easylaw(mode)

    print(f"Unsupported source: {source}")
    return 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
