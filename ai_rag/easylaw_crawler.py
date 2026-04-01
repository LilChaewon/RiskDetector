"""Easylaw Q&A crawler for local and S3 RAG dataset testing."""

from __future__ import annotations

import html
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable
from urllib import request


USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) RiskDetector/1.0"


@dataclass(frozen=True)
class EasylawSeed:
    url: str
    category: str


@dataclass(frozen=True)
class QaDocument:
    question: str
    answer: str
    category: str
    source_url: str


SEEDS: tuple[EasylawSeed, ...] = (
    EasylawSeed(
        url="https://easylaw.go.kr/CSP/IssueQaRetrieve.laf?issueqaSeq=244&targetRow=81&topMenu=openUl7",
        category="부동산/임대차",
    ),
    EasylawSeed(
        url="https://www.easylaw.go.kr/CSP/IssueQaRetrieve.laf?issueqaSeq=237&search_put=&targetRow=&topMenu=openUl7",
        category="근로/노동",
    ),
    EasylawSeed(
        url="https://www.easylaw.go.kr/CSP/IssueQaRetrieve.laf?issueqaSeq=206&search_put=&targetRow=&topMenu=openUl7",
        category="근로/노동",
    ),
)


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


def crawl_easylaw(verbose: bool = False) -> list[QaDocument]:
    documents: list[QaDocument] = []
    for index, seed in enumerate(SEEDS, start=1):
        if verbose:
            print(f"[INFO] Crawling page {index}...")
        page_html = fetch_html(seed.url)
        document = parse_issue_qa_document(
            page_html=page_html,
            fallback_category=seed.category,
            source_url=seed.url,
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
    saved_paths: list[Path] = []
    for index, document in enumerate(documents, start=1):
        path = output_dir / f"qa_{index}.txt"
        path.write_text(render_qa_document(document), encoding="utf-8")
        saved_paths.append(path)
    return saved_paths
