"""Easylaw Q&A crawler for local and S3 RAG dataset testing."""

from __future__ import annotations

import html
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable
from urllib import request


USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) RiskDetector/1.0"
ISSUE_QA_LIST_URL = "https://easylaw.go.kr/CSP/IssueQaLstRetrieve.laf?topMenu=openUl7"
ISSUE_QA_DETAIL_URL = "https://easylaw.go.kr/CSP/IssueQaRetrieve.laf?topMenu=openUl7&issueqaSeq={seq}&targetRow={target_row}"
LIST_PAGE_SIZE = 20


@dataclass(frozen=True)
class QaDocument:
    question: str
    answer: str
    category: str
    source_url: str


def fetch_html(url: str) -> str:
    req = request.Request(url, headers={"User-Agent": USER_AGENT})
    with request.urlopen(req, timeout=30) as response:
        return response.read().decode("utf-8", errors="replace")


def clean_html_text(raw_html: str) -> str:
    normalized = re.sub(r"<br\s*/?>", "\n", raw_html, flags=re.IGNORECASE)
    normalized = re.sub(r"</p>", "\n", normalized, flags=re.IGNORECASE)
    normalized = re.sub(r"</div>", "\n", normalized, flags=re.IGNORECASE)
    normalized = re.sub(r"<[^>]+>", " ", normalized)
    normalized = html.unescape(normalized).replace("\xa0", " ")
    normalized = re.sub(r"[ \t]+", " ", normalized)
    normalized = re.sub(r"\n\s+", "\n", normalized)
    normalized = re.sub(r"\n{3,}", "\n\n", normalized)
    normalized = re.sub(r"\s+([,.:;!?%])", r"\1", normalized)
    normalized = re.sub(r"([“\"'(\[])\s+", r"\1", normalized)
    normalized = re.sub(r"\s+([”\"')\]])", r"\1", normalized)
    normalized = re.sub(r"(\d)\s+([가-힣])", r"\1\2", normalized)
    return normalized.strip()


def guess_category(*values: str) -> str:
    combined = " ".join(values)
    housing_keywords = (
        "임대차",
        "임대인",
        "임차인",
        "전세",
        "월세",
        "보증금",
        "전입신고",
        "확정일자",
        "주택",
        "상가",
        "원상복구",
        "중개보수",
        "권리금",
        "특약",
    )
    labor_keywords = (
        "근로",
        "임금",
        "퇴직금",
        "해고",
        "연차",
        "최저임금",
        "근로시간",
        "주휴",
        "수습",
        "퇴직",
    )

    if any(keyword in combined for keyword in housing_keywords):
        return "부동산/임대차"
    if any(keyword in combined for keyword in labor_keywords):
        return "근로/노동"
    return "기타"


def extract_issue_list_entries(page_html: str) -> list[tuple[str, str]]:
    matches = re.findall(
        r'IssueQaRetrieve\.laf\?topMenu=openUl7&amp;issueqaSeq=(\d+)&amp;targetRow=[^"]*" onclick="goRetrieve\(\'\d+\'\); return false;"[^>]*>\s*(.*?)\s*</a>',
        page_html,
        flags=re.DOTALL,
    )
    entries: list[tuple[str, str]] = []
    for seq, raw_title in matches:
        title = clean_html_text(raw_title)
        entries.append((seq, title))
    return entries


def collect_latest_issue_entries(limit: int, verbose: bool = False) -> list[tuple[str, str, int]]:
    collected: list[tuple[str, str, int]] = []
    seen_sequences: set[str] = set()
    target_row = 1

    while len(collected) < limit:
        page_html = fetch_html(f"{ISSUE_QA_LIST_URL}&targetRow={target_row}")
        entries = extract_issue_list_entries(page_html)
        if not entries:
            break

        for seq, title in entries:
            if seq in seen_sequences:
                continue
            seen_sequences.add(seq)
            collected.append((seq, title, target_row))
            if len(collected) >= limit:
                break

        if verbose:
            print(f"[INFO] Listing targetRow={target_row}: collected {len(collected)} / {limit}")

        target_row += LIST_PAGE_SIZE

    return collected


def parse_issue_qa_document(page_html: str, fallback_category: str, source_url: str) -> QaDocument:
    body_match = re.search(
        r"Q\.\&nbsp;(.*?)A\.\&nbsp;(.*?)(?:※\s*이 내용은|</td>\s*</tr>\s*</tbody>\s*</table>|다운로드 바로보기)",
        page_html,
        flags=re.DOTALL,
    )
    if not body_match:
        raise ValueError(f"Could not find Q/A blocks in Easylaw page: {source_url}")

    question = clean_html_text(body_match.group(1))
    answer = clean_html_text(body_match.group(2))
    if not question or not answer:
        raise ValueError(f"Parsed empty question or answer from Easylaw page: {source_url}")

    return QaDocument(
        question=question,
        answer=answer,
        category=fallback_category,
        source_url=source_url,
    )


def crawl_easylaw(limit: int = 100, verbose: bool = False) -> list[QaDocument]:
    documents: list[QaDocument] = []
    entries = collect_latest_issue_entries(limit=max(limit * 2, limit), verbose=verbose)

    for index, (seq, title, target_row) in enumerate(entries, start=1):
        if len(documents) >= limit:
            break
        if verbose:
            print(f"[INFO] Crawling page {index}...")

        source_url = ISSUE_QA_DETAIL_URL.format(seq=seq, target_row=target_row)
        page_html = fetch_html(source_url)
        try:
            document = parse_issue_qa_document(
                page_html=page_html,
                fallback_category="기타",
                source_url=source_url,
            )
        except ValueError:
            if verbose:
                print(f"[WARN] Skipped unsupported Easylaw detail page: {source_url}")
            continue

        document = QaDocument(
            question=document.question,
            answer=document.answer,
            category=guess_category(title, document.question, document.answer),
            source_url=document.source_url,
        )
        documents.append(document)

        if verbose:
            print(f"[INFO] Page {index}: Extracted 1 Q&A items")

    return documents


def render_qa_document(document: QaDocument) -> str:
    return (
        f"질문: {document.question}\n\n"
        f"답변: {document.answer}\n\n"
        f"카테고리: {document.category}\n"
    )


def save_qa_documents(documents: Iterable[QaDocument], output_dir: Path) -> list[Path]:
    output_dir.mkdir(parents=True, exist_ok=True)
    for old_path in output_dir.glob("qa_*.txt"):
        old_path.unlink()
    saved_paths: list[Path] = []
    for index, document in enumerate(documents, start=1):
        path = output_dir / f"qa_{index}.txt"
        path.write_text(render_qa_document(document), encoding="utf-8")
        saved_paths.append(path)
    return saved_paths
