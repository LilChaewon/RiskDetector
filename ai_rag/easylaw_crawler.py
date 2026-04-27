"""Easylaw Q&A crawler for local and S3 RAG dataset testing.
로컬 및 S3 RAG 데이터셋 구성을 위한 생활법령정보 Q&A 크롤러."""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, as_completed
import re
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import requests
from bs4 import BeautifulSoup

from easylaw_config import EASYLAW_CONFIG
from utils import (
    build_full_url,
    clean_text,
    extract_url_parameters,
    infer_domain_category,
    normalize_category_name,
    validate_qa_data,
)


QUESTION_ANSWER_RE = re.compile(
    r"Q\.\s*&nbsp;?(.*?)A\.\s*&nbsp;?(.*?)(?:※\s*이 내용은|다운로드 바로보기|</body>)",
    flags=re.DOTALL | re.IGNORECASE,
)
DETAIL_STOP_MARKERS = (
    "저장",
    "목록",
    "이 정보는 ",
    "생활법령정보는 법적 효력을",
    "구체적인 법령에 대한 질의는",
    "위 내용에 대한 홈페이지 개선의견은",
)


@dataclass(frozen=True)
class QaDocument:
    question: str
    answer: str
    category: str
    source_url: str


@dataclass(frozen=True)
class QaSeed:
    question_id: str
    category_id: str
    category: str
    is_direct_target: bool
    question_preview: str
    answer_preview: str
    source_url: str


class EasylawPageFetcher:
    """Class for fetching list and detail page HTML from the Easylaw website.
    생활법령 웹사이트에서 목록 및 상세 페이지 HTML을 가져오는 클래스입니다."""
    def __init__(self) -> None:
        self.session = requests.Session()
        self.session.headers.update(EASYLAW_CONFIG.base_headers)

    def fetch_list_page(self, page_num: int, search_query: str = "") -> str:
        payload = {
            "curPage": str(page_num),
            "sch": search_query,
            "pageTpe": str(EASYLAW_CONFIG.page_size),
        }
        for attempt in range(1, EASYLAW_CONFIG.max_retries + 1):
            try:
                response = self.session.post(
                    EASYLAW_CONFIG.list_url,
                    data=payload,
                    timeout=EASYLAW_CONFIG.request_timeout,
                )
                response.raise_for_status()
                return response.text
            except requests.RequestException:
                if attempt == EASYLAW_CONFIG.max_retries:
                    raise
                time.sleep(EASYLAW_CONFIG.retry_backoff_seconds * attempt)
        raise RuntimeError("Unreachable list-page retry loop")

    def fetch_detail_page(self, source_url: str) -> str:
        for attempt in range(1, EASYLAW_CONFIG.max_retries + 1):
            try:
                response = self.session.get(
                    source_url,
                    timeout=EASYLAW_CONFIG.request_timeout,
                )
                response.raise_for_status()
                return response.text
            except requests.RequestException:
                if attempt == EASYLAW_CONFIG.max_retries:
                    raise
                time.sleep(EASYLAW_CONFIG.retry_backoff_seconds * attempt)
        raise RuntimeError("Unreachable detail-page retry loop")


def clean_html_text(raw_html: str) -> str:
    soup = BeautifulSoup(raw_html, "html.parser")
    for tag in soup.find_all(["br", "p", "div", "li"]):
        tag.append("\n")
    return clean_text(soup.get_text("\n"))


def extract_detail_from_page_text(page_html: str, seed: QaSeed) -> tuple[str, str]:
    """Extract question and answer text from the detail page using BeautifulSoup.
    BeautifulSoup을 사용하여 상세 페이지에서 질문과 답변 텍스트를 추출합니다."""
    soup = BeautifulSoup(page_html, "html.parser")
    lines = [clean_text(line) for line in soup.get_text("\n").splitlines()]
    lines = [line for line in lines if line]
    if not lines:
        return seed.question_preview, ""

    try:
        question_index = next(
            index for index, line in enumerate(lines) if seed.question_preview and seed.question_preview in line
        )
    except StopIteration:
        return seed.question_preview, ""

    question = lines[question_index]
    answer_lines: list[str] = []
    for line in lines[question_index + 1 :]:
        if any(marker in line for marker in DETAIL_STOP_MARKERS):
            break
        answer_lines.append(line)

    return question, " ".join(answer_lines).strip()


def extract_qa_seeds(page_html: str) -> list[QaSeed]:
    """Extract seed data from the list page pointing to individual Q&A detail pages.
    목록 페이지에서 각 Q&A 항목의 상세 페이지로 연결되는 씨앗(Seed) 데이터를 추출합니다."""
    soup = BeautifulSoup(page_html, "html.parser")
    question_ul = soup.find("ul", class_="question")
    if not question_ul:
        return []

    seeds: list[QaSeed] = []
    for qa_item in question_ul.find_all("li", class_="qa"):
        question_div = qa_item.find("div", class_="ttl")
        answer_div = qa_item.find("div", class_="ans")
        if not question_div or not answer_div:
            continue

        question_link = question_div.find("a")
        answer_preview_node = answer_div.find("p", class_="line4-text")
        if not question_link or not answer_preview_node:
            continue

        question_preview = clean_text(question_link.get_text(" ", strip=True))
        answer_preview = clean_text(answer_preview_node.get_text(" ", strip=True))
        raw_url = question_link.get("href", "")
        params = extract_url_parameters(raw_url)
        question_id = params.get("question_id", "")
        category_id = params.get("category_id", "")
        if not question_id:
            continue
        category = normalize_category_name(category_id, EASYLAW_CONFIG.category_mapping)
        is_direct_target = category_id in EASYLAW_CONFIG.target_category_mapping
        if not is_direct_target:
            category = infer_domain_category(
                f"{question_preview} {answer_preview}",
                housing_keywords=EASYLAW_CONFIG.housing_keywords,
                labor_keywords=EASYLAW_CONFIG.labor_keywords,
            )
            if category == "기타":
                continue

        seeds.append(
            QaSeed(
                question_id=question_id,
                category_id=category_id,
                category=category,
                is_direct_target=is_direct_target,
                question_preview=question_preview,
                answer_preview=answer_preview,
                source_url=build_full_url(EASYLAW_CONFIG.base_url, raw_url),
            )
        )
    return seeds


def parse_detail_document(page_html: str, seed: QaSeed) -> QaDocument | None:
    body_match = QUESTION_ANSWER_RE.search(page_html)
    question = ""
    answer = ""
    if body_match:
        question = clean_html_text(body_match.group(1))
        answer = clean_html_text(body_match.group(2))

    if not question or not answer:
        text_question, text_answer = extract_detail_from_page_text(page_html, seed)
        question = question or text_question
        answer = answer or text_answer

    if not question:
        question = seed.question_preview
    if not answer:
        answer = seed.answer_preview

    category = seed.category
    if not seed.is_direct_target:
        category = infer_domain_category(
            f"{question} {answer}",
            housing_keywords=EASYLAW_CONFIG.housing_keywords,
            labor_keywords=EASYLAW_CONFIG.labor_keywords,
        )

    if not validate_qa_data(
        question=question,
        answer=answer,
        category=category,
        source_url=seed.source_url,
        min_question_length=EASYLAW_CONFIG.min_question_length,
        min_answer_length=EASYLAW_CONFIG.min_answer_length,
    ):
        return None

    return QaDocument(
        question=question,
        answer=answer,
        category=category,
        source_url=seed.source_url,
    )


def fetch_and_parse_detail(seed: QaSeed) -> QaDocument | None:
    for attempt in range(1, EASYLAW_CONFIG.max_retries + 1):
        try:
            response = requests.get(
                seed.source_url,
                headers=EASYLAW_CONFIG.base_headers,
                timeout=EASYLAW_CONFIG.request_timeout,
            )
            response.raise_for_status()
            return parse_detail_document(response.text, seed)
        except requests.RequestException:
            if attempt == EASYLAW_CONFIG.max_retries:
                return None
            time.sleep(EASYLAW_CONFIG.retry_backoff_seconds * attempt)
    return None


def crawl_easylaw(limit: int = EASYLAW_CONFIG.default_limit, verbose: bool = False) -> list[QaDocument]:
    """Main crawling function to collect Easylaw information up to a specified limit. Supports parallel processing.
    지정된 개수만큼 생활법령 정보를 수집하는 메인 크롤링 함수입니다. 병렬 처리를 지원합니다."""
    documents: list[QaDocument] = []
    fetcher = EasylawPageFetcher()
    seen_question_ids: set[str] = set()
    consecutive_empty_pages = 0

    for page_num in range(EASYLAW_CONFIG.start_page, EASYLAW_CONFIG.max_pages + 1):
        if len(documents) >= limit:
            break

        list_html = fetcher.fetch_list_page(page_num)
        seeds = extract_qa_seeds(list_html)

        if not seeds:
            consecutive_empty_pages += 1
            if consecutive_empty_pages >= EASYLAW_CONFIG.max_consecutive_empty_pages:
                break
            continue

        consecutive_empty_pages = 0
        page_valid_count = 0
        page_seeds: list[QaSeed] = []
        for seed in seeds:
            if len(documents) + len(page_seeds) >= limit:
                break
            if seed.question_id in seen_question_ids:
                continue
            seen_question_ids.add(seed.question_id)
            page_seeds.append(seed)

        with ThreadPoolExecutor(max_workers=EASYLAW_CONFIG.detail_workers) as executor:
            futures = {executor.submit(fetch_and_parse_detail, seed): seed for seed in page_seeds}
            for future in as_completed(futures):
                seed = futures[future]
                document = future.result()
                if not document:
                    if verbose:
                        print(f"[WARN] Skipped low-quality Easylaw item: {seed.source_url}")
                    continue
                documents.append(document)
                page_valid_count += 1
                if len(documents) >= limit:
                    break

        if verbose:
            print(
                f"[INFO] Page {page_num}: extracted {page_valid_count} valid Q&A items "
                f"({len(documents)} / {limit})"
            )

    return documents


def render_qa_document(document: QaDocument) -> str:
    return (
        f"질문: {document.question}\n\n"
        f"답변: {document.answer}\n\n"
        f"카테고리: {document.category}\n\n"
        f"원문URL: {document.source_url}\n"
    )


def save_qa_documents(
    documents: Iterable[QaDocument],
    output_dir: Path,
    *,
    clear_existing: bool = True,
    start_index: int = 1,
) -> list[Path]:
    output_dir.mkdir(parents=True, exist_ok=True)
    if clear_existing:
        for old_path in output_dir.glob("qa_*.txt"):
            old_path.unlink()
    saved_paths: list[Path] = []
    for index, document in enumerate(documents, start=start_index):
        path = output_dir / f"qa_{index}.txt"
        path.write_text(render_qa_document(document), encoding="utf-8")
        saved_paths.append(path)
    return saved_paths
