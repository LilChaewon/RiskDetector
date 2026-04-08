"""Build a Lambda deployment zip for analysis_result_loader."""

from __future__ import annotations

from pathlib import Path
import site
from zipfile import ZIP_DEFLATED, ZipFile


ROOT_DIR = Path(__file__).resolve().parents[3]
BACKEND_AI_DIR = ROOT_DIR / "backend_ai"
DIST_DIR = BACKEND_AI_DIR / "dist"
ZIP_PATH = DIST_DIR / "analysis_result_loader.zip"

PACKAGE_FILES = [
    (BACKEND_AI_DIR / "lambdas" / "__init__.py", "lambdas/__init__.py"),
    (BACKEND_AI_DIR / "lambdas" / "analysis_result_loader" / "__init__.py", "lambdas/analysis_result_loader/__init__.py"),
    (BACKEND_AI_DIR / "lambdas" / "analysis_result_loader" / "handler.py", "lambdas/analysis_result_loader/handler.py"),
]

SITE_PACKAGES_DIR = Path(site.getsitepackages()[0])
PACKAGE_DIRS = [
    (SITE_PACKAGES_DIR / "pg8000", "pg8000"),
    (SITE_PACKAGES_DIR / "scramp", "scramp"),
    (SITE_PACKAGES_DIR / "asn1crypto", "asn1crypto"),
    (SITE_PACKAGES_DIR / "dateutil", "dateutil"),
    (SITE_PACKAGES_DIR / "six.py", "six.py"),
    (SITE_PACKAGES_DIR / "pg8000-1.31.5.dist-info", "pg8000-1.31.5.dist-info"),
    (SITE_PACKAGES_DIR / "scramp-1.4.8.dist-info", "scramp-1.4.8.dist-info"),
    (SITE_PACKAGES_DIR / "asn1crypto-1.5.1.dist-info", "asn1crypto-1.5.1.dist-info"),
    (SITE_PACKAGES_DIR / "python_dateutil-2.9.0.post0.dist-info", "python_dateutil-2.9.0.post0.dist-info"),
    (SITE_PACKAGES_DIR / "six-1.17.0.dist-info", "six-1.17.0.dist-info"),
]


def add_path(zip_file: ZipFile, src_path: Path, archive_prefix: str) -> None:
    if src_path.is_dir():
        for child in src_path.rglob("*"):
            if child.is_dir():
                continue
            rel = child.relative_to(src_path)
            zip_file.write(child, f"{archive_prefix}/{rel}")
        return

    zip_file.write(src_path, archive_prefix)


def build_package() -> Path:
    DIST_DIR.mkdir(parents=True, exist_ok=True)
    if ZIP_PATH.exists():
        ZIP_PATH.unlink()

    with ZipFile(ZIP_PATH, "w", compression=ZIP_DEFLATED) as zip_file:
        for src_path, archive_name in PACKAGE_FILES:
            add_path(zip_file, src_path, archive_name)
        for src_path, archive_name in PACKAGE_DIRS:
            add_path(zip_file, src_path, archive_name)

    return ZIP_PATH


def main() -> int:
    print(f"Built Lambda package: {build_package()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
