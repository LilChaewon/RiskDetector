"""Build a Lambda deployment zip for detector_bedrock_lambda."""

from __future__ import annotations

from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile


ROOT_DIR = Path(__file__).resolve().parents[3]
BACKEND_AI_DIR = ROOT_DIR / "backend_ai"
DIST_DIR = BACKEND_AI_DIR / "dist"
ZIP_PATH = DIST_DIR / "detector_bedrock_lambda.zip"

PACKAGE_FILES = [
    (BACKEND_AI_DIR / "lambdas" / "__init__.py", "lambdas/__init__.py"),
    (BACKEND_AI_DIR / "lambdas" / "bedrock_lambda" / "__init__.py", "lambdas/bedrock_lambda/__init__.py"),
    (BACKEND_AI_DIR / "lambdas" / "bedrock_lambda" / "handler.py", "lambdas/bedrock_lambda/handler.py"),
]


def build_package() -> Path:
    DIST_DIR.mkdir(parents=True, exist_ok=True)
    if ZIP_PATH.exists():
        ZIP_PATH.unlink()

    with ZipFile(ZIP_PATH, "w", compression=ZIP_DEFLATED) as zip_file:
        for src_path, archive_name in PACKAGE_FILES:
            zip_file.write(src_path, archive_name)

    return ZIP_PATH


def main() -> int:
    zip_path = build_package()
    print(f"Built Lambda package: {zip_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
