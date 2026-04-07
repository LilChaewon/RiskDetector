"""국가법령정보 공동활용 API 설정."""

from __future__ import annotations

import os


DEFAULT_PRECEDENT_KEYWORDS = ["근로", "노동", "계약", "임대차", "전세", "월세"]
DEFAULT_PRECEDENT_RELEVANCE_KEYWORDS = [
    "근로",
    "노동",
    "근로계약",
    "해고",
    "임금",
    "퇴직",
    "연차",
    "보상",
    "임대차",
    "전세",
    "월세",
    "보증금",
    "원상복구",
    "계약",
    "특약",
    "갱신",
    "상가건물",
    "주택임대차",
]


LAW_OPEN_API_CONFIG = {
    "api_key": os.getenv("LAW_OPEN_API_OC", ""),
    "base_url": "https://www.law.go.kr/DRF",
    "law_search_url": "https://www.law.go.kr/DRF/lawSearch.do",
    "law_service_url": "https://www.law.go.kr/DRF/lawService.do",
    "public_law_url": "https://www.law.go.kr/lsInfoP.do",
    "law_search_params": {
        "OC": os.getenv("LAW_OPEN_API_OC", ""),
        "target": "eflaw",
        "type": "JSON",
        "display": "10",
    },
    "precedent_search_params": {
        "OC": os.getenv("LAW_OPEN_API_OC", ""),
        "target": "prec",
        "type": "HTML",
        "search": "1",
        "display": "20",
        "page": "1",
        "sort": "ddes",
    },
    "precedent_detail_params": {
        "OC": os.getenv("LAW_OPEN_API_OC", ""),
        "target": "prec",
        "type": "HTML",
    },
    "json_precedent_search_params": {
        "OC": os.getenv("LAW_OPEN_API_OC", ""),
        "target": "prec",
        "type": "JSON",
        "search": "1",
        "display": "20",
        "page": "1",
        "sort": "ddes",
    },
    "json_precedent_detail_params": {
        "OC": os.getenv("LAW_OPEN_API_OC", ""),
        "target": "prec",
        "type": "JSON",
    },
    "search_keywords": DEFAULT_PRECEDENT_KEYWORDS,
    "headers": {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"
        )
    },
    "timeout": 30,
    "request_delay": 0.2,
    "max_pages": 10,
    "fetch_detail": True,
    "public_law_view_cls": "lsRvsDocInfoR",
    "precedent_relevance_keywords": DEFAULT_PRECEDENT_RELEVANCE_KEYWORDS,
}


DATA_STRUCTURE = {
    "precedent": {
        "prec_id": "판례일련번호",
        "case_number": "사건번호",
        "case_name": "사건명",
        "court_name": "법원명",
        "court_type_code": "법원종류코드",
        "judgment_date": "선고일자",
        "case_type_name": "사건종류명",
        "case_type_code": "사건종류코드",
        "judgment_type": "판결유형",
        "judgment": "선고",
        "judgment_summary": "판결요지",
        "judgment_point": "판시사항",
        "reference_law": "참조조문",
        "reference_case": "참조판례",
        "case_content": "판례내용",
        "data_source": "데이터출처명",
        "detail_link": "판례상세링크",
        "keywords": "검색키워드",
        "crawl_date": "크롤링일시",
    }
}


def get_precedent_keywords_from_env() -> list[str]:
    raw = os.getenv("LAW_OPEN_API_PRECEDENT_KEYWORDS", "").strip()
    if not raw:
        return DEFAULT_PRECEDENT_KEYWORDS.copy()
    return [item.strip() for item in raw.split(",") if item.strip()]
