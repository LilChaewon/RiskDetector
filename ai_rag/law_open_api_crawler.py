"""국가법령정보 공동활용 API local test crawler."""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib import parse, request


LAW_SEARCH_URL = "https://www.law.go.kr/DRF/lawSearch.do"
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) RiskDetector/1.0"


@dataclass(frozen=True)
class LawSearchItem:
    law_name: str
    law_id: str
    ministry: str
    promulgation_no: str
    effective_date: str
    source_url: str


def get_required_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise ValueError(f"Missing required environment variable: {name}")
    return value


def fetch_law_search_results(query: str, display: int = 10) -> dict[str, Any]:
    oc = get_required_env("LAW_OPEN_API_OC")
    params = {
        "OC": oc,
        "target": "eflaw",
        "type": "JSON",
        "query": query,
        "display": str(display),
    }
    url = f"{LAW_SEARCH_URL}?{parse.urlencode(params)}"
    req = request.Request(url, headers={"User-Agent": USER_AGENT})
    with request.urlopen(req, timeout=30) as response:
        return json.loads(response.read().decode("utf-8", errors="replace"))


def normalize_law_items(payload: dict[str, Any]) -> list[LawSearchItem]:
    root = payload.get("LawSearch") or payload
    raw_items = root.get("law") or root.get("laws") or []
    if isinstance(raw_items, dict):
        raw_items = [raw_items]

    items: list[LawSearchItem] = []
    for item in raw_items:
        if not isinstance(item, dict):
            continue
        law_id = str(item.get("법령ID") or item.get("법령일련번호") or item.get("ID") or "")
        law_name = str(item.get("법령명한글") or item.get("법령명") or item.get("lawNm") or "")
        ministry = str(item.get("소관부처명") or item.get("소관부처") or item.get("deptNm") or "")
        promulgation_no = str(item.get("공포번호") or item.get("공포일자") or item.get("pnNo") or "")
        effective_date = str(item.get("시행일자") or item.get("efYd") or "")
        source_url = str(item.get("법령상세링크") or item.get("link") or "")

        if not law_name:
            continue

        items.append(
            LawSearchItem(
                law_name=law_name,
                law_id=law_id,
                ministry=ministry,
                promulgation_no=promulgation_no,
                effective_date=effective_date,
                source_url=source_url,
            )
        )
    return items


def save_law_search_results(payload: dict[str, Any], items: list[LawSearchItem], output_dir: Path) -> list[Path]:
    output_dir.mkdir(parents=True, exist_ok=True)
    saved_paths: list[Path] = []

    raw_path = output_dir / "search_results.json"
    raw_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    saved_paths.append(raw_path)

    for index, item in enumerate(items, start=1):
        path = output_dir / f"law_{index}.txt"
        path.write_text(
            (
                f"법령명: {item.law_name}\n\n"
                f"법령ID: {item.law_id}\n\n"
                f"소관부처: {item.ministry}\n\n"
                f"공포번호: {item.promulgation_no}\n\n"
                f"시행일자: {item.effective_date}\n\n"
                f"원문링크: {item.source_url}\n"
            ),
            encoding="utf-8",
        )
        saved_paths.append(path)

    return saved_paths


def crawl_law_open_api(query: str, verbose: bool = False) -> tuple[dict[str, Any], list[LawSearchItem]]:
    if verbose:
        print(f"[INFO] Calling law_open_api with query={query}")
    payload = fetch_law_search_results(query=query)
    items = normalize_law_items(payload)
    if verbose:
        print(f"[INFO] law_open_api returned {len(items)} normalized items")
    return payload, items
