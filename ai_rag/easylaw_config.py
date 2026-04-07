"""Configuration for the Easylaw Q&A crawler."""

from __future__ import annotations

from dataclasses import dataclass, field


BASE_URL = "https://www.easylaw.go.kr"


@dataclass(frozen=True)
class EasylawConfig:
    base_url: str = BASE_URL
    list_url: str = f"{BASE_URL}/CSP/OnhunqueansLstRetrieve.laf"
    detail_url: str = f"{BASE_URL}/CSP/OnhunqueansInfoRetrieve.laf"
    user_agent: str = (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"
    )
    request_timeout: int = 30
    max_retries: int = 3
    retry_backoff_seconds: float = 1.0
    page_size: int = 20
    start_page: int = 1
    max_pages: int = 200
    max_consecutive_empty_pages: int = 3
    default_limit: int = 600
    detail_workers: int = 8
    min_question_length: int = 8
    min_answer_length: int = 60
    housing_keywords: tuple[str, ...] = (
        "임대차",
        "임대인",
        "임차인",
        "전세",
        "월세",
        "보증금",
        "주택",
        "상가건물",
        "원상복구",
        "확정일자",
        "전입신고",
        "임대료",
        "임대차계약",
        "임대차계약서",
        "전세계약",
        "월세계약",
        "특약",
        "부동산",
        "권리금",
    )
    labor_keywords: tuple[str, ...] = (
        "근로",
        "노동",
        "근로계약",
        "취업규칙",
        "해고",
        "임금",
        "퇴직금",
        "연차",
        "근로시간",
        "최저임금",
        "주휴",
        "수습",
        "휴업",
        "휴직",
        "실업급여",
    )
    target_category_mapping: dict[str, str] = field(
        default_factory=lambda: {
            "84": "부동산/임대차",
            "82": "근로/노동",
        }
    )
    category_mapping: dict[str, str] = field(
        default_factory=lambda: {
            "25": "가정법률",
            "89": "아동/청소년/교육",
            "84": "부동산/임대차",
            "92": "금융/보험",
            "83": "사업",
            "91": "창업",
            "100": "무역/출입국",
            "88": "소비자",
            "87": "문화/여가생활",
            "85": "민형사/소송",
            "90": "교통/운전",
            "82": "근로/노동",
            "97": "복지",
            "81": "국방/보훈",
            "94": "정보통신/기술",
            "96": "환경/에너지",
            "86": "사회안전/범죄",
            "95": "국가/지자체",
        }
    )
    base_headers: dict[str, str] = field(
        default_factory=lambda: {
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"
            ),
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
            "Origin": BASE_URL,
            "Referer": f"{BASE_URL}/CSP/OnhunqueansLstRetrieve.laf?search_put=",
        }
    )


EASYLAW_CONFIG = EasylawConfig()
