"""국가법령정보 공동활용 API 크롤러."""

from __future__ import annotations

import json
import os
import re
import time
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any

import requests
from bs4 import BeautifulSoup

try:
    from .law_open_api_config import DATA_STRUCTURE, LAW_OPEN_API_CONFIG, get_precedent_keywords_from_env
except ImportError:
    from law_open_api_config import DATA_STRUCTURE, LAW_OPEN_API_CONFIG, get_precedent_keywords_from_env


@dataclass(frozen=True)
class LawSearchItem:
    law_name: str
    law_id: str
    law_serial_number: str
    ministry: str
    promulgation_no: str
    effective_date: str
    source_url: str


@dataclass(frozen=True)
class PrecedentSearchItem:
    precedent_id: str
    case_number: str
    case_name: str
    court_name: str
    case_type_name: str
    judgment_date: str
    judgment_type: str
    data_source_name: str
    detail_link: str
    keyword: str


def get_required_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise ValueError(f"Missing required environment variable: {name}")
    return value


class LawOpenApiCrawler:
    """Crawler class for collecting law and precedent data using the National Law Information Public API.
    국가법령정보 공동활용 API를 사용하여 법령 및 판례 데이터를 수집하는 크롤러 클래스입니다."""

    def __init__(self) -> None:
        self.config = self._sync_config_with_env()
        self.session = requests.Session()
        self.session.headers.update(self.config["headers"])

    def _sync_config_with_env(self) -> dict[str, Any]:
        config = dict(LAW_OPEN_API_CONFIG)
        api_key = get_required_env("LAW_OPEN_API_OC")
        for key in (
            "law_search_params",
            "precedent_search_params",
            "precedent_detail_params",
            "json_precedent_search_params",
            "json_precedent_detail_params",
        ):
            params = dict(config[key])
            params["OC"] = api_key
            config[key] = params
        return config

    def _request_text(self, url: str, params: dict[str, str]) -> str:
        response = self.session.get(url, params=params, timeout=self.config["timeout"])
        response.raise_for_status()
        return response.text

    def _request_json(self, url: str, params: dict[str, str]) -> dict[str, Any]:
        text = self._request_text(url, params)
        return json.loads(text)

    def crawl_law(self, query: str) -> tuple[dict[str, Any], list[LawSearchItem]]:
        """Search for laws using a specific keyword and return normalized results.
        특정 키워드로 법령을 검색하고 결과를 정규화하여 반환합니다."""
        params["query"] = query
        payload = self._request_json(self.config["law_search_url"], params)
        items = self._normalize_law_items(payload)
        return payload, items

    def _normalize_law_items(self, payload: dict[str, Any]) -> list[LawSearchItem]:
        root = payload.get("LawSearch") or payload
        raw_items = root.get("law") or root.get("laws") or []
        if isinstance(raw_items, dict):
            raw_items = [raw_items]

        items: list[LawSearchItem] = []
        for item in raw_items:
            if not isinstance(item, dict):
                continue
            law_id = str(item.get("법령ID") or item.get("법령일련번호") or item.get("ID") or "")
            law_serial_number = str(item.get("법령일련번호") or item.get("MST") or "")
            law_name = str(item.get("법령명한글") or item.get("법령명") or item.get("lawNm") or "")
            ministry = str(item.get("소관부처명") or item.get("소관부처") or item.get("deptNm") or "")
            promulgation_no = str(item.get("공포번호") or item.get("공포일자") or item.get("pnNo") or "")
            effective_date = str(item.get("시행일자") or item.get("efYd") or "")
            source_url = str(item.get("법령상세링크") or item.get("link") or "")
            if not law_name or not law_serial_number:
                continue
            items.append(
                LawSearchItem(
                    law_name=law_name,
                    law_id=law_id,
                    law_serial_number=law_serial_number,
                    ministry=ministry,
                    promulgation_no=promulgation_no,
                    effective_date=effective_date,
                    source_url=source_url,
                )
            )
        return items

    def fetch_public_law_html(self, law_serial_number: str) -> str:
        params = {
            "lsiSeq": law_serial_number,
            "viewCls": self.config["public_law_view_cls"],
        }
        return self._request_text(self.config["public_law_url"], params)

    def crawl_precedent(
        self,
        keywords: list[str] | None = None,
        max_pages: int | None = None,
        display: int | None = None,
        verbose: bool = False,
    ) -> tuple[dict[str, dict[str, Any]], list[dict[str, Any]]]:
        """Search for a list of precedents for specified keywords and collect detailed information.
        지정된 키워드들에 대해 판례 목록을 검색하고 상세 내용을 수집합니다."""
        if keywords is None:
            keywords = get_precedent_keywords_from_env()
        max_pages = max_pages or self.config["max_pages"]
        display = display or int(self.config["precedent_search_params"]["display"])

        payloads: dict[str, dict[str, Any]] = {}
        detailed_precedents: list[dict[str, Any]] = []
        seen_precedent_ids: set[str] = set()

        for keyword in keywords:
            merged_payload: dict[str, Any] = {"pages": []}
            if verbose:
                print(f"[INFO] Searching precedent data for keyword={keyword}")

            for page in range(1, max_pages + 1):
                search_payload, items = self._search_precedent_list(keyword=keyword, page=page, display=display)
                merged_payload["pages"].append(search_payload)
                if verbose:
                    print(f"[INFO] precedent keyword={keyword} page={page} returned {len(items)} items")
                if not items:
                    break

                for item in items:
                    prec_id = item.get("prec_id", "")
                    if not prec_id or prec_id in seen_precedent_ids:
                        continue
                    seen_precedent_ids.add(prec_id)
                    detail_data = self._fetch_precedent_detail(item)
                    merged_data = {**item, **detail_data}
                    if self._is_relevant_precedent(merged_data):
                        detailed_precedents.append(self._optimize_for_rag(merged_data))

                time.sleep(self.config["request_delay"])

            payloads[keyword] = merged_payload

        return payloads, detailed_precedents

    def _is_relevant_precedent(self, precedent: dict[str, Any]) -> bool:
        haystack = " ".join(
            str(precedent.get(field, ""))
            for field in (
                "keyword",
                "case_name",
                "case_type_name",
                "judgment_summary",
                "judgment_point",
                "reference_law",
                "case_content",
            )
        )
        haystack = self._clean_html_text(haystack)
        relevance_keywords = self.config.get("precedent_relevance_keywords", []) or []
        return any(keyword in haystack for keyword in relevance_keywords)

    def _search_precedent_list(self, keyword: str, page: int, display: int) -> tuple[dict[str, Any], list[dict[str, Any]]]:
        html_params = dict(self.config["precedent_search_params"])
        html_params.update({"query": keyword, "page": str(page), "display": str(display)})

        try:
            html_content = self._request_text(self.config["law_search_url"], html_params)
            items = self._parse_precedent_list_html(html_content, keyword)
            if items:
                return {"source": "html", "raw": html_content}, items
        except requests.RequestException:
            pass

        json_params = dict(self.config["json_precedent_search_params"])
        json_params.update({"query": keyword, "page": str(page), "display": str(display)})
        payload = self._request_json(self.config["law_search_url"], json_params)
        items = self._normalize_precedent_items_from_json(payload, keyword)
        return payload, items

    def _parse_precedent_list_html(self, html_content: str, keyword: str) -> list[dict[str, Any]]:
        soup = BeautifulSoup(html_content, "html.parser")
        table = soup.find("table", class_="tbl8")
        if not table:
            return []
        tbody = table.find("tbody")
        if not tbody:
            return []

        parsed_data: list[dict[str, Any]] = []
        for row in tbody.find_all("tr"):
            cells = row.find_all("td")
            if len(cells) < 6:
                continue
            link = cells[1].find("a")
            if not link:
                continue
            href = link.get("href", "")
            prec_id = self._extract_prec_id_from_url(href)
            if not prec_id:
                continue
            parsed_data.append(
                {
                    "prec_id": prec_id,
                    "case_name": self._clean_text(cells[1].get_text(strip=True)),
                    "court_name": self._clean_text(cells[2].get_text(strip=True)),
                    "case_type_name": self._clean_text(cells[3].get_text(strip=True)),
                    "judgment_type": self._clean_text(cells[4].get_text(strip=True)),
                    "judgment_date": self._clean_text(cells[5].get_text(strip=True)),
                    "detail_link": href,
                    "keyword": keyword,
                    "crawl_date": datetime.now().isoformat(),
                }
            )
        return parsed_data

    def _normalize_precedent_items_from_json(self, payload: dict[str, Any], keyword: str) -> list[dict[str, Any]]:
        root = payload.get("PrecSearch") or payload
        raw_items = root.get("prec") or []
        if isinstance(raw_items, dict):
            raw_items = [raw_items]

        items: list[dict[str, Any]] = []
        for item in raw_items:
            if not isinstance(item, dict):
                continue
            prec_id = str(item.get("판례일련번호") or item.get("precSeq") or "")
            case_name = str(item.get("사건명") or "")
            if not prec_id or not case_name:
                continue
            items.append(
                {
                    "prec_id": prec_id,
                    "case_number": str(item.get("사건번호") or ""),
                    "case_name": case_name,
                    "court_name": str(item.get("법원명") or ""),
                    "case_type_name": str(item.get("사건종류명") or ""),
                    "judgment_date": str(item.get("선고일자") or ""),
                    "judgment_type": str(item.get("판결유형") or ""),
                    "data_source_name": str(item.get("데이터출처명") or ""),
                    "detail_link": str(item.get("판례상세링크") or ""),
                    "keyword": keyword,
                    "crawl_date": datetime.now().isoformat(),
                }
            )
        return items

    def _fetch_precedent_detail(self, precedent: dict[str, Any]) -> dict[str, Any]:
        if not self.config["fetch_detail"]:
            return {}

        prec_id = precedent.get("prec_id", "")
        if not prec_id:
            return {}

        html_params = dict(self.config["precedent_detail_params"])
        html_params.update({"ID": prec_id, "LM": precedent.get("case_name", "")})
        try:
            html_content = self._request_text(self.config["law_service_url"], html_params)
            detail_data = self._parse_precedent_detail_html(html_content)
            if any(detail_data.values()):
                return detail_data
        except requests.RequestException:
            pass

        json_params = dict(self.config["json_precedent_detail_params"])
        json_params["ID"] = prec_id
        payload = self._request_json(self.config["law_service_url"], json_params)
        detail = payload.get("PrecService", {})
        return {
            "judgment_summary": self._clean_html_text(str(detail.get("판결요지", ""))),
            "judgment_point": self._clean_html_text(str(detail.get("판시사항", ""))),
            "reference_law": self._clean_html_text(str(detail.get("참조조문", ""))),
            "reference_case": self._clean_html_text(str(detail.get("참조판례", ""))),
            "case_content": self._clean_html_text(str(detail.get("판례내용", ""))),
        }

    def _parse_precedent_detail_html(self, html_content: str) -> dict[str, Any]:
        soup = BeautifulSoup(html_content, "html.parser")
        text = soup.get_text("\n")
        return {
            "judgment_summary": self._extract_section(text, ("판결요지",)),
            "judgment_point": self._extract_section(text, ("판시사항",)),
            "reference_law": self._extract_section(text, ("참조조문",)),
            "reference_case": self._extract_section(text, ("참조판례",)),
            "case_content": self._extract_section(text, ("판례내용", "주문", "이유")),
        }

    def _extract_section(self, text: str, titles: tuple[str, ...]) -> str:
        for title in titles:
            pattern = rf"{re.escape(title)}\s*(.+?)(?=\n[A-Z가-힣0-9][^\n]{{0,40}}(?:판시사항|판결요지|참조조문|참조판례|판례내용|주문|이유)|\Z)"
            match = re.search(pattern, text, flags=re.DOTALL)
            if match:
                return self._clean_html_text(match.group(1))
        return ""

    def _optimize_for_rag(self, precedent: dict[str, Any]) -> dict[str, Any]:
        optimized = precedent.copy()
        rag_text_parts = []
        for field in (
            "case_name",
            "judgment_point",
            "judgment_summary",
            "reference_law",
            "reference_case",
            "case_content",
        ):
            value = self._clean_html_text(str(optimized.get(field, "")))
            if value:
                rag_text_parts.append(f"{field}: {value}")
        optimized["text_content"] = "\n\n".join(rag_text_parts)
        optimized["metadata"] = {
            "keyword": optimized.get("keyword", ""),
            "prec_id": optimized.get("prec_id", ""),
            "case_number": optimized.get("case_number", ""),
            "judgment_date": optimized.get("judgment_date", ""),
            "data_source": optimized.get("data_source_name", ""),
            "crawl_date": optimized.get("crawl_date", datetime.now().isoformat()),
            "schema": DATA_STRUCTURE["precedent"],
        }
        return optimized

    def _extract_prec_id_from_url(self, url: str) -> str:
        match = re.search(r"ID=(\d+)", url)
        return match.group(1) if match else ""

    def _clean_text(self, text: str) -> str:
        if not text:
            return ""
        text = re.sub(r"\s+", " ", text)
        return text.strip().rstrip(".")

    def _clean_html_text(self, value: str) -> str:
        normalized = re.sub(r"<br\s*/?>", "\n", value, flags=re.IGNORECASE)
        normalized = re.sub(r"<[^>]+>", " ", normalized)
        normalized = normalized.replace("&nbsp;", " ")
        normalized = re.sub(r"[ \t]+", " ", normalized)
        normalized = re.sub(r"\n\s+", "\n", normalized)
        normalized = re.sub(r"\n{3,}", "\n\n", normalized)
        return normalized.strip()


def save_law_search_results(payload: dict[str, Any], items: list[LawSearchItem], output_dir: Path) -> list[Path]:
    """Save collected law search results to local text files and HTML files.
    수집된 법령 검색 결과를 로컬 텍스트 파일과 HTML로 저장합니다."""
    crawler = LawOpenApiCrawler()
    output_dir.mkdir(parents=True, exist_ok=True)
    for pattern in ("law_*.txt", "law_original_*.html", "search_results.json"):
        for old_path in output_dir.glob(pattern):
            old_path.unlink()

    saved_paths: list[Path] = []
    raw_path = output_dir / "search_results.json"
    raw_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    saved_paths.append(raw_path)

    for index, item in enumerate(items, start=1):
        metadata_path = output_dir / f"law_{index}.txt"
        metadata_path.write_text(
            (
                f"법령명: {item.law_name}\n\n"
                f"법령ID: {item.law_id}\n\n"
                f"법령일련번호: {item.law_serial_number}\n\n"
                f"소관부처: {item.ministry}\n\n"
                f"공포번호: {item.promulgation_no}\n\n"
                f"시행일자: {item.effective_date}\n\n"
                f"원문링크: {item.source_url}\n"
            ),
            encoding="utf-8",
        )
        saved_paths.append(metadata_path)

        original_html_path = output_dir / f"law_original_{index}.html"
        original_html_path.write_text(crawler.fetch_public_law_html(item.law_serial_number), encoding="utf-8")
        saved_paths.append(original_html_path)

    return saved_paths


def save_precedent_results(
    keyword_payloads: dict[str, dict[str, Any]],
    precedents: list[dict[str, Any]],
    output_dir: Path,
) -> list[Path]:
    """Save collected precedent data as keyword-specific JSON files and individual text files.
    수집된 판례 데이터를 키워드별 JSON 및 개별 텍스트 파일로 저장합니다."""
    output_dir.mkdir(parents=True, exist_ok=True)
    curated_output_dir = output_dir / "curated"
    curated_output_dir.mkdir(parents=True, exist_ok=True)
    for pattern in ("search_*.json", "precedent_*.txt"):
        for old_path in output_dir.glob(pattern):
            old_path.unlink()
    for old_path in curated_output_dir.glob("precedent_*.txt"):
        old_path.unlink()

    saved_paths: list[Path] = []
    for keyword, payload in keyword_payloads.items():
        raw_path = output_dir / f"search_{keyword}.json"
        raw_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        saved_paths.append(raw_path)

    for index, item in enumerate(precedents, start=1):
        path = output_dir / f"precedent_{index}.txt"
        basic_info = (
            f"사건번호: {item.get('case_number', '')}, "
            f"선고일자: {item.get('judgment_date', '')}, "
            f"사건종류: {item.get('case_type_name', '')}, "
            f"법원명: {item.get('court_name', '')}, "
            f"판결유형: {item.get('judgment_type', '')}"
        )
        path.write_text(
            (
                f"사건명: {item.get('case_name', '')}\n\n"
                f"사건종류: {item.get('case_type_name', '')}\n\n"
                f"선고일자: {item.get('judgment_date', '')}\n\n"
                f"사건번호: {item.get('case_number', '')}\n\n"
                f"키워드: {item.get('keyword', '')}\n\n"
                f"판례일련번호: {item.get('prec_id', '')}\n\n"
                f"법원명: {item.get('court_name', '')}\n\n"
                f"판결유형: {item.get('judgment_type', '')}\n\n"
                f"데이터출처: {item.get('data_source_name', '')}\n\n"
                f"기본정보: {basic_info}\n\n"
                f"판결요지: {item.get('judgment_summary', '')}\n\n"
                f"판시사항: {item.get('judgment_point', '')}\n\n"
                f"참조조문: {item.get('reference_law', '')}\n\n"
                f"참조판례: {item.get('reference_case', '')}\n\n"
                f"판례내용: {item.get('case_content', '')}\n\n"
                f"상세링크: {item.get('detail_link', '')}\n"
            ),
            encoding="utf-8",
        )
        saved_paths.append(path)

    curated_index = 1
    for item in precedents:
        lead_content = (
            item.get("case_content", "")
            or item.get("judgment_point", "")
            or item.get("judgment_summary", "")
        ).strip()
        if len(lead_content) < 120:
            continue

        basic_info = (
            f"사건번호: {item.get('case_number', '')}, "
            f"선고일자: {item.get('judgment_date', '')}, "
            f"사건종류: {item.get('case_type_name', '')}, "
            f"법원명: {item.get('court_name', '')}, "
            f"판결유형: {item.get('judgment_type', '')}"
        )
        curated_path = curated_output_dir / f"precedent_{curated_index}.txt"
        curated_path.write_text(
            (
                f"사건명: {item.get('case_name', '')}\n\n"
                f"사건종류: {item.get('case_type_name', '')}\n\n"
                f"선고일자: {item.get('judgment_date', '')}\n\n"
                f"사건번호: {item.get('case_number', '')}\n\n"
                f"판례내용: {lead_content}\n\n"
                f"기본정보: {basic_info}\n\n"
                f"키워드: {item.get('keyword', '')}\n\n"
                f"판례일련번호: {item.get('prec_id', '')}\n\n"
                f"법원명: {item.get('court_name', '')}\n\n"
                f"판결유형: {item.get('judgment_type', '')}\n\n"
                f"데이터출처: {item.get('data_source_name', '')}\n\n"
                f"판결요지: {item.get('judgment_summary', '')}\n\n"
                f"판시사항: {item.get('judgment_point', '')}\n\n"
                f"참조조문: {item.get('reference_law', '')}\n\n"
                f"참조판례: {item.get('reference_case', '')}\n\n"
                f"상세링크: {item.get('detail_link', '')}\n"
            ),
            encoding="utf-8",
        )
        saved_paths.append(curated_path)
        curated_index += 1

    return saved_paths


def crawl_law_open_api(query: str, verbose: bool = False) -> tuple[dict[str, Any], list[LawSearchItem]]:
    crawler = LawOpenApiCrawler()
    if verbose:
        print(f"[INFO] Calling law_open_api with query={query}")
    payload, items = crawler.crawl_law(query=query)
    if verbose:
        print(f"[INFO] law_open_api returned {len(items)} normalized items")
    return payload, items


def crawl_precedent_open_api(
    keywords: list[str] | None = None,
    max_pages: int = 5,
    display: int = 20,
    verbose: bool = False,
) -> tuple[dict[str, dict[str, Any]], list[dict[str, Any]]]:
    crawler = LawOpenApiCrawler()
    return crawler.crawl_precedent(
        keywords=keywords,
        max_pages=max_pages,
        display=display,
        verbose=verbose,
    )


def fetch_law_search_results(query: str, display: int = 10) -> dict[str, Any]:
    crawler = LawOpenApiCrawler()
    params = dict(crawler.config["law_search_params"])
    params["query"] = query
    params["display"] = str(display)
    return crawler._request_json(crawler.config["law_search_url"], params)


def normalize_law_items(payload: dict[str, Any]) -> list[LawSearchItem]:
    crawler = LawOpenApiCrawler()
    return crawler._normalize_law_items(payload)


def fetch_public_law_html(law_serial_number: str) -> str:
    crawler = LawOpenApiCrawler()
    return crawler.fetch_public_law_html(law_serial_number)


def fetch_precedent_search_results(keyword: str, page: int = 1, display: int = 20, search: str = "1") -> dict[str, Any]:
    crawler = LawOpenApiCrawler()
    params = dict(crawler.config["json_precedent_search_params"])
    params.update({"query": keyword, "page": str(page), "display": str(display), "search": search})
    return crawler._request_json(crawler.config["law_search_url"], params)


def normalize_precedent_items(payload: dict[str, Any], keyword: str) -> list[PrecedentSearchItem]:
    crawler = LawOpenApiCrawler()
    raw_items = crawler._normalize_precedent_items_from_json(payload, keyword)
    return [
        PrecedentSearchItem(
            precedent_id=item.get("prec_id", ""),
            case_number=item.get("case_number", ""),
            case_name=item.get("case_name", ""),
            court_name=item.get("court_name", ""),
            case_type_name=item.get("case_type_name", ""),
            judgment_date=item.get("judgment_date", ""),
            judgment_type=item.get("judgment_type", ""),
            data_source_name=item.get("data_source_name", ""),
            detail_link=item.get("detail_link", ""),
            keyword=item.get("keyword", ""),
        )
        for item in raw_items
    ]


def fetch_precedent_detail(precedent_id: str) -> dict[str, Any]:
    crawler = LawOpenApiCrawler()
    params = dict(crawler.config["json_precedent_detail_params"])
    params["ID"] = precedent_id
    return crawler._request_json(crawler.config["law_service_url"], params)
