"""Lightweight Easylaw helpers."""

from __future__ import annotations

import html
import re
from urllib.parse import parse_qs, urljoin, urlparse


WHITESPACE_RE = re.compile(r"\s+")


def extract_url_parameters(url: str) -> dict[str, str]:
    parsed = urlparse(html.unescape(url))
    query = parse_qs(parsed.query)
    return {
        "question_id": query.get("onhunqueSeq", [""])[0],
        "category_id": query.get("onhunqnaAstSeq", [""])[0],
    }


def build_full_url(base_url: str, raw_url: str) -> str:
    normalized = html.unescape(raw_url)
    if normalized.startswith("http"):
        return normalized
    if normalized.startswith("/"):
        return urljoin(f"{base_url}/", normalized)
    return urljoin(f"{base_url}/CSP/", normalized)


def clean_text(text: str) -> str:
    if not text:
        return ""
    normalized = html.unescape(text).replace("\xa0", " ")
    return WHITESPACE_RE.sub(" ", normalized).strip()


def normalize_category_name(category_id: str, category_mapping: dict[str, str]) -> str:
    return category_mapping.get(category_id, "기타")


def infer_domain_category(text: str, *, housing_keywords: tuple[str, ...], labor_keywords: tuple[str, ...]) -> str:
    if any(keyword in text for keyword in housing_keywords):
        return "부동산/임대차"
    if any(keyword in text for keyword in labor_keywords):
        return "근로/노동"
    return "기타"


def has_enough_korean_text(text: str) -> bool:
    return len(re.findall(r"[가-힣]", text)) >= 20


def validate_qa_data(
    *,
    question: str,
    answer: str,
    category: str,
    source_url: str,
    min_question_length: int,
    min_answer_length: int,
) -> bool:
    if not question or not answer or not category or not source_url:
        return False
    if category == "기타":
        return False
    if len(question) < min_question_length or len(answer) < min_answer_length:
        return False
    if "�" in question or "�" in answer:
        return False
    if not has_enough_korean_text(answer):
        return False
    return True
