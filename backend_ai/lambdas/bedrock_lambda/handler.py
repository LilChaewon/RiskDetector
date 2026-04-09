"""Local-friendly Bedrock lambda for contract risk analysis with optional Knowledge Base retrieval."""

from __future__ import annotations

import json
import os
from pathlib import Path
import re
from typing import Any
from urllib import error as urllib_error
from urllib import parse, request

import boto3


ENV_PATH = Path(__file__).with_name(".env")
DEFAULT_MODEL_ID = "amazon.nova-lite-v1:0"
DEFAULT_RETRIEVAL_RESULTS = 5
DEFAULT_GEMINI_MODEL_ID = "gemini-1.5-pro"
DEFAULT_GEMINI_RETRIES = 3
DEFAULT_GEMINI_RETRY_BASE_SECONDS = 1.0
KOREAN_LEGAL_KEYWORDS = (
    "민법",
    "근로기준법",
    "주택임대차보호법",
    "상가건물 임대차보호법",
    "판례",
    "대법원",
    "법원",
    "사건번호",
)
DEDUCTION_KEYWORDS = ("공제", "보증금에서", "차감", "상계", "자유롭게 공제")


def load_env_file(env_path: Path = ENV_PATH) -> None:
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


def build_boto3_session() -> boto3.session.Session:
    access_key = os.getenv("AWS_ACCESS_KEY_ID", "").strip()
    secret_key = os.getenv("AWS_SECRET_ACCESS_KEY", "").strip()
    session_token = os.getenv("AWS_SESSION_TOKEN", "").strip()
    region = os.getenv("AWS_REGION", "").strip() or "ap-northeast-2"
    profile = os.getenv("AWS_PROFILE", "").strip()

    if access_key and secret_key and "YOUR_" not in access_key and "YOUR_" not in secret_key:
        os.environ.pop("AWS_PROFILE", None)
        os.environ.pop("AWS_DEFAULT_PROFILE", None)
        return boto3.Session(
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            aws_session_token=session_token or None,
            region_name=region,
        )

    if profile:
        return boto3.Session(profile_name=profile, region_name=region)

    return boto3.Session(region_name=region)


def get_required_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise ValueError(f"Missing required environment variable: {name}")
    return value


def get_llm_provider() -> str:
    return os.getenv("LLM_PROVIDER", "").strip().lower() or "gemini"


def get_model_id() -> str:
    inference_profile_id = os.getenv("BEDROCK_INFERENCE_PROFILE_ID", "").strip()
    if inference_profile_id:
        return inference_profile_id
    return os.getenv("BEDROCK_MODEL_ID", "").strip() or DEFAULT_MODEL_ID


def get_gemini_model_id() -> str:
    return os.getenv("GEMINI_MODEL_ID", "").strip() or DEFAULT_GEMINI_MODEL_ID


def get_gemini_fallback_model_id() -> str:
    return os.getenv("GEMINI_FALLBACK_MODEL_ID", "").strip()


def get_retrieval_result_count() -> int:
    raw_value = os.getenv("BEDROCK_RETRIEVAL_RESULT_COUNT", "").strip()
    if not raw_value:
        return DEFAULT_RETRIEVAL_RESULTS
    try:
        return max(1, min(int(raw_value), 20))
    except ValueError:
        return DEFAULT_RETRIEVAL_RESULTS


def get_result_loader_function_name() -> str:
    return os.getenv("ANALYSIS_RESULT_LOADER_FUNCTION_NAME", "").strip()


def get_result_loader_mode() -> str:
    return os.getenv("ANALYSIS_RESULT_LOADER_MODE", "lambda").strip().lower()


def build_retrieval_query(contract_texts: list[str], event_query: str | None = None) -> str:
    explicit_query = (event_query or "").strip()
    if explicit_query:
        return explicit_query

    joined_text = " ".join(text.strip() for text in contract_texts if text.strip())
    return joined_text[:1500]


def format_retrieval_location(location: dict[str, Any]) -> str:
    if not location:
        return ""

    if "s3Location" in location:
        uri = location["s3Location"].get("uri")
        return uri or ""
    if "webLocation" in location:
        url = location["webLocation"].get("url")
        return url or ""
    if "confluenceLocation" in location:
        url = location["confluenceLocation"].get("url")
        return url or ""
    if "salesforceLocation" in location:
        url = location["salesforceLocation"].get("url")
        return url or ""
    if "sharePointLocation" in location:
        url = location["sharePointLocation"].get("url")
        return url or ""
    if "customDocumentLocation" in location:
        return location["customDocumentLocation"].get("id", "")
    if "kendraDocumentLocation" in location:
        return location["kendraDocumentLocation"].get("uri", "")
    if "sqlLocation" in location:
        return location["sqlLocation"].get("query", "")
    return ""


def contains_hangul(text: str) -> bool:
    return any("\uac00" <= char <= "\ud7a3" for char in text)


def extract_case_number(text: str) -> str:
    labeled_match = re.search(r"사건번호[:\s]+([^\s\n]+)", text)
    if labeled_match:
        return labeled_match.group(1).strip()
    match = re.search(r"([0-9]{2,4}[가-힣]{1,6}[0-9]{1,10})", text)
    return match.group(1) if match else ""


def extract_case_name(text: str) -> str:
    patterns = (
        r"사건명[:\s]+(.+?)(?:\s+사건종류[:\s]|\s+선고일자[:\s]|\s+사건번호[:\s]|\n|$)",
        r"사건명은?\s*([^\n]+)",
    )
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(1).strip()
    return ""


def extract_law_name(text: str) -> str:
    patterns = (
        "주택임대차보호법",
        "상가건물 임대차보호법",
        "근로기준법",
        "민법",
    )
    for pattern in patterns:
        if pattern in text:
            return pattern
    return ""


def extract_question_title(text: str) -> str:
    match = re.search(r"질문:\s*(.+)", text)
    if not match:
        return ""
    return match.group(1).strip()


def build_source_label(text: str, location: str, metadata: dict[str, Any]) -> str:
    del metadata
    case_number = extract_case_number(text)
    case_name = extract_case_name(text)
    if case_name and case_number:
        return f"{case_name} ({case_number})"
    if case_number:
        return f"판례 {case_number}"

    law_name = extract_law_name(text)
    if law_name:
        return law_name

    question_title = extract_question_title(text)
    if question_title:
        return f"생활법령: {question_title[:40]}"

    file_name = Path(location).name if location else ""
    stem = Path(file_name).stem if file_name else ""
    if stem.startswith("qa_"):
        return f"생활법령 {stem}"
    if stem.startswith("precedent_"):
        return f"판례 {stem}"
    if stem:
        return stem
    return "법률 근거"


def extract_basis_phrase(text: str, label: str) -> str:
    case_number = extract_case_number(text)
    case_name = extract_case_name(text)
    if case_name and case_number:
        return f"{case_name}({case_number}) 판례"
    if case_number:
        return f"{case_number} 판례"

    law_name = extract_law_name(text)
    if law_name:
        return f"{law_name} 관련 자료"

    if label:
        return label
    return "검색된 법률 자료"


def normalize_retrieval_results(response: dict[str, Any]) -> list[dict[str, Any]]:
    normalized: list[dict[str, Any]] = []
    for index, item in enumerate(response.get("retrievalResults", []) or [], start=1):
        content = item.get("content", {}) or {}
        metadata = item.get("metadata", {}) or {}
        location = item.get("location", {}) or {}
        text = (content.get("text") or "").strip()
        if not text:
            continue

        formatted_location = format_retrieval_location(location)
        normalized.append(
            {
                "rank": index,
                "score": item.get("score"),
                "text": text,
                "location": formatted_location,
                "metadata": metadata,
                "sourceLabel": build_source_label(text, formatted_location, metadata),
                "basisPhrase": extract_basis_phrase(text, build_source_label(text, formatted_location, metadata)),
            }
        )
    return normalized


def retrieve_knowledge_context(
    contract_texts: list[str],
    knowledge_base_id: str,
    event_query: str | None = None,
) -> dict[str, Any]:
    session = build_boto3_session()
    client = session.client("bedrock-agent-runtime")
    query_text = build_retrieval_query(contract_texts=contract_texts, event_query=event_query)

    response = client.retrieve(
        knowledgeBaseId=knowledge_base_id,
        retrievalQuery={
            "text": query_text,
        },
        retrievalConfiguration={
            "vectorSearchConfiguration": {
                "numberOfResults": get_retrieval_result_count(),
            }
        },
    )

    results = normalize_retrieval_results(response)
    return {
        "query": query_text,
        "results": results,
        "nextToken": response.get("nextToken"),
    }


def retrieve_knowledge_base(query: str, model_id: str | None = None) -> dict[str, Any]:
    load_env_file()

    knowledge_base_id = os.getenv("KNOWLEDGE_BASE_ID", "").strip()
    if not knowledge_base_id:
        return {
            "success": False,
            "error": "Missing KNOWLEDGE_BASE_ID environment variable.",
            "results": [],
            "context": "",
        }

    normalized_query = (query or "").strip()
    if not normalized_query:
        return {
            "success": False,
            "error": "Missing query text.",
            "results": [],
            "context": "",
        }

    try:
        retrieval = retrieve_knowledge_context(
            contract_texts=[],
            knowledge_base_id=knowledge_base_id,
            event_query=normalized_query,
        )
        results = retrieval.get("results", [])
        context = "\n\n".join(
            f"[{item['sourceLabel']}] {item['text']}"
            for item in results
        )
        return {
            "success": True,
            "knowledgeBaseId": knowledge_base_id,
            "query": normalized_query,
            "modelId": model_id or get_model_id(),
            "results": results,
            "context": context,
        }
    except Exception as exc:
        return {
            "success": False,
            "error": str(exc),
            "knowledgeBaseId": knowledge_base_id,
            "query": normalized_query,
            "modelId": model_id or get_model_id(),
            "results": [],
            "context": "",
        }


def build_analysis_prompt(
    contract_texts: list[str],
    knowledge_base_id: str | None,
    retrieved_contexts: list[dict[str, Any]] | None = None,
    provider: str = "bedrock",
) -> str:
    joined_text = "\n".join(f"- {text}" for text in contract_texts)
    if knowledge_base_id and retrieved_contexts:
        context_lines = []
        for item in retrieved_contexts:
            source = item.get("location") or item.get("metadata", {}).get("x-amz-bedrock-kb-source-uri") or "unknown"
            source_label = item.get("sourceLabel") or f"Source {item['rank']}"
            context_lines.append(
                f"[{source_label}] location={source}\n"
                f"{item['text']}"
            )
        kb_text = (
            f"Knowledge Base ID: {knowledge_base_id}\n"
            "아래 검색된 법률 컨텍스트를 우선 근거로 사용하세요.\n"
            "검색 결과가 불충분하면 이를 JSON 필드에 명시하세요.\n\n"
            "검색된 법률 컨텍스트:\n"
            f"{chr(10).join(context_lines)}"
        )
    elif knowledge_base_id:
        kb_text = (
            f"Knowledge Base ID: {knowledge_base_id}. "
            "검색 결과가 없으므로 보수적으로 판단하고, 근거 부족을 명시하세요."
        )
    else:
        kb_text = "Knowledge Base가 연결되지 않았습니다. 일반적인 계약법 상식 수준에서만 보수적으로 판단하세요."
    output_constraints = (
        "출력은 간결하게 유지하세요.\n"
        "- 모든 설명은 반드시 한국어로 작성하세요.\n"
        "- summary: 1문장, 120자 이내\n"
        "- clauses: 최대 3개\n"
        "- reason: 1~2문장, 180자 이내\n"
        "- suggestion: 1문장, 120자 이내\n"
        "- sourceIds: 실제로 사용한 근거 문서명 또는 사건번호 기반 라벨만 넣으세요\n"
        "- JSON 문자열 값 안에는 줄바꿈을 넣지 마세요\n"
        if provider == "gemini"
        else ""
    )
    return (
        "당신은 한국어 계약서 독소조항 분석 시스템입니다.\n"
        "입력된 계약 조항을 분석하고, 불공정하거나 일방적으로 불리하거나 과도한 책임을 전가하는 조항을 식별하세요.\n"
        "반드시 JSON만 반환하세요.\n"
        "분석 대상은 근로계약서와 임대차계약서이며, 다음을 특히 중점적으로 보세요:\n"
        "- 보증금 반환 지연 또는 거부\n"
        "- 원상복구 비용의 과도한 전가\n"
        "- 임대인 또는 사용자에게 과도하게 유리한 공제권\n"
        "- 해지권, 손해배상, 위약금, 비용부담의 일방 전가\n"
        "- 통상손모까지 상대방에게 부담시키는 조항\n"
        "- 법률상 보호를 우회하거나 약화하는 문구\n"
        "- 모호해서 분쟁 가능성이 큰 문구\n\n"
        "분석 원칙:\n"
        "- 검색된 법률/판례/생활법령 컨텍스트가 있으면 이를 우선 근거로 사용하세요.\n"
        "- reason에는 왜 문제가 되는지 구체적으로 설명하고, 최소 1개의 법률 근거나 판례 키워드를 포함하세요.\n"
        "- suggestion에는 계약서 수정 방향을 실무적으로 제안하세요.\n"
        "- 근거를 사용했다면 sourceIds에 해당 문서명 또는 사건번호 기반 라벨을 넣으세요.\n"
        "- 근거가 부족하면 groundingStatus를 insufficient로 설정하세요.\n\n"
        f"{kb_text}\n\n"
        f"{output_constraints}\n"
        "반환 JSON 형식:\n"
        "{\n"
        '  "summary": "계약 전체 위험 요약",\n'
        '  "riskLevel": "low|medium|high",\n'
        '  "groundingStatus": "grounded|insufficient|not_used",\n'
        '  "clauses": [\n'
        "    {\n"
        '      "clauseText": "문제 조항 원문",\n'
        '      "riskType": "문제 유형",\n'
        '      "riskLevel": "low|medium|high",\n'
        '      "reason": "문제 이유",\n'
        '      "suggestion": "수정 또는 협의 제안",\n'
        '      "sourceIds": ["전세 보증금 반환등 (2011다9655)"]\n'
        "    }\n"
        "  ]\n"
        "}\n\n"
        "계약 조항:\n"
        f"{joined_text}"
    )


def extract_retry_delay_seconds(error_text: str) -> float | None:
    retry_delay_match = re.search(r'"retryDelay":\s*"([0-9]+(?:\.[0-9]+)?)s"', error_text)
    if retry_delay_match:
        return float(retry_delay_match.group(1))

    please_retry_match = re.search(r"Please retry in ([0-9]+(?:\.[0-9]+)?)s", error_text)
    if please_retry_match:
        return float(please_retry_match.group(1))

    return None


def is_gemini_quota_error(error_text: str) -> bool:
    normalized = error_text.lower()
    return "resource_exhausted" in normalized or "quota exceeded" in normalized


def extract_text_from_converse_response(response: dict[str, Any]) -> str:
    output = response.get("output", {})
    message = output.get("message", {})
    content = message.get("content", []) or []
    texts: list[str] = []
    for item in content:
        text = item.get("text")
        if text:
            texts.append(text)
    return "\n".join(texts).strip()


def parse_json_response(raw_text: str) -> dict[str, Any]:
    try:
        return json.loads(raw_text)
    except json.JSONDecodeError:
        start = raw_text.find("{")
        end = raw_text.rfind("}")
        if start != -1 and end != -1 and end > start:
            return json.loads(raw_text[start : end + 1])
        raise


def infer_contract_title(contract_texts: list[str]) -> str:
    joined = " ".join(text.strip() for text in contract_texts if text.strip())
    if not joined:
        return "계약서 분석 결과"

    if "임대차" in joined:
        import re

        match = re.search(r"([가-힣0-9]+구\s*[가-힣0-9]*동?\s*소재\s*[0-9]+호)", joined)
        if match:
            return f"{match.group(1).strip()} 임대차 계약서"
        return "임대차 계약서"

    if "근로" in joined or "근로계약" in joined:
        return "근로계약서"

    return "계약서 분석 결과"


def needs_korean_localization(parsed: dict[str, Any]) -> bool:
    texts = [str(parsed.get("summary") or "")]
    for clause in parsed.get("clauses", []) or []:
        texts.append(str(clause.get("reason") or ""))
        texts.append(str(clause.get("suggestion") or ""))
        texts.append(str(clause.get("riskType") or ""))
    for text in texts:
        normalized = text.strip()
        if normalized and not contains_hangul(normalized):
            return True
    return False


def localize_analysis_to_korean(parsed: dict[str, Any], model_id_override: str | None = None) -> dict[str, Any]:
    response = call_gemini_generate(
        (
            "다음 JSON의 구조는 그대로 유지하고, summary, riskType, reason, suggestion만 자연스러운 한국어로 바꾸세요. "
            "riskLevel, groundingStatus, sourceIds 값은 유지하세요. JSON만 반환하세요.\n\n"
            f"{json.dumps(parsed, ensure_ascii=False)}"
        ),
        response_schema=build_gemini_response_schema(),
        model_id_override=model_id_override,
    )
    localized_text = extract_text_from_gemini_response(response)
    return parse_json_response(localized_text)


def build_source_lookup(retrieval_results: list[dict[str, Any]] | None) -> dict[str, dict[str, Any]]:
    lookup: dict[str, dict[str, Any]] = {}
    for item in retrieval_results or []:
        rank_key = f"Source {item['rank']}"
        label = str(item.get("sourceLabel") or rank_key)
        lookup[rank_key] = item
        lookup[label] = item
    return lookup


def normalize_clause_source_ids(source_ids: list[Any], source_lookup: dict[str, dict[str, Any]]) -> list[str]:
    normalized: list[str] = []
    for raw_source_id in source_ids or []:
        source_id = str(raw_source_id).strip()
        if not source_id:
            continue
        item = source_lookup.get(source_id)
        label = str((item or {}).get("sourceLabel") or source_id)
        if not item and source_id.lower().startswith("document_section"):
            continue
        if label not in normalized:
            normalized.append(label)
    if normalized:
        return normalized
    first_item = next(iter(source_lookup.values()), None)
    if first_item:
        return [str(first_item.get("sourceLabel") or "법률 근거")]
    return normalized


def reason_has_legal_basis(reason: str) -> bool:
    return any(keyword in reason for keyword in KOREAN_LEGAL_KEYWORDS)


def build_basis_text(source_ids: list[str], source_lookup: dict[str, dict[str, Any]]) -> str:
    for source_id in source_ids:
        item = source_lookup.get(source_id)
        if item:
            return str(item.get("basisPhrase") or item.get("sourceLabel") or "검색된 법률 자료")
    for item in source_lookup.values():
        return str(item.get("basisPhrase") or item.get("sourceLabel") or "검색된 법률 자료")
    return "검색된 법률 자료"


def ensure_reason_with_basis(reason: str, source_ids: list[str], source_lookup: dict[str, dict[str, Any]]) -> str:
    normalized_reason = reason.strip() or "위험 가능성이 있어 검토가 필요합니다."
    if reason_has_legal_basis(normalized_reason):
        return normalized_reason
    basis_text = build_basis_text(source_ids, source_lookup)
    return f"근거: {basis_text}. {normalized_reason}"


def clause_matches_deduction_risk(text: str) -> bool:
    return any(keyword in text for keyword in DEDUCTION_KEYWORDS)


def has_existing_deduction_toxic(toxics: list[dict[str, Any]]) -> bool:
    for toxic in toxics:
        clause_text = str(toxic.get("clauseText") or "")
        risk_type = str(toxic.get("riskType") or "")
        if clause_matches_deduction_risk(clause_text) or "공제" in risk_type or "차감" in risk_type or "상계" in risk_type:
            return True
    return False


def build_deduction_clause_fallback(
    contract_texts: list[str],
    source_lookup: dict[str, dict[str, Any]],
) -> dict[str, Any] | None:
    if not any(clause_matches_deduction_risk(text) for text in contract_texts):
        return None

    clause_text = next((text for text in contract_texts if clause_matches_deduction_risk(text)), "")
    source_ids: list[str] = []
    for item in source_lookup.values():
        source_label = str(item.get("sourceLabel") or "")
        text = str(item.get("text") or "")
        if ("보증금" in text or "공제" in text) and source_label and source_label not in source_ids:
            source_ids.append(source_label)
    source_ids = source_ids[:2]
    reason = ensure_reason_with_basis(
        "보증금에서 임대인이 비용을 자유롭게 공제하도록 하면 반환 범위와 공제 사유가 불명확해 임차인에게 과도하게 불리할 수 있습니다.",
        source_ids,
        source_lookup,
    )
    return {
        "clauseText": clause_text,
        "riskType": "보증금 공제권 과다",
        "riskLevel": "high",
        "reason": reason,
        "suggestion": "공제 가능한 항목과 범위를 구체적으로 한정하고, 임차인과의 정산 절차를 명시하는 방향으로 수정하는 것이 좋습니다.",
        "sourceIds": source_ids,
    }


def build_analysis_result(
    contract_texts: list[str],
    parsed: dict[str, Any],
    retrieval_results: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    source_lookup = build_source_lookup(retrieval_results)
    clauses = parsed.get("clauses", []) or []
    toxics = []

    for clause in clauses:
        risk_level = str(clause.get("riskLevel") or "low").lower()
        if risk_level == "low":
            continue
        source_ids = normalize_clause_source_ids(clause.get("sourceIds", []) or [], source_lookup)
        reason = ensure_reason_with_basis(str(clause.get("reason") or ""), source_ids, source_lookup)

        toxics.append(
            {
                "clauseText": clause.get("clauseText", ""),
                "riskType": clause.get("riskType", ""),
                "riskLevel": risk_level,
                "reason": reason,
                "suggestion": clause.get("suggestion", ""),
                "sourceIds": source_ids,
            }
        )

    overall_risk = parsed.get("riskLevel", "low")
    if not toxics and str(overall_risk).lower() in {"medium", "high"}:
        toxics.append(
            {
                "clauseText": "계약서 전체 내용",
                "riskType": "전반적 위험",
                "riskLevel": str(overall_risk).lower(),
                "reason": ensure_reason_with_basis(
                    parsed.get("summary", "") or "전반적인 내용 검토가 필요합니다.",
                    [],
                    source_lookup,
                ),
                "suggestion": "특정 독소 조항이 명확하게 추출되지 않았으나, 위험도가 높게 측정되어 전체적인 검토를 권장합니다.",
                "sourceIds": [],
            }
        )

    if not has_existing_deduction_toxic(toxics):
        deduction_fallback = build_deduction_clause_fallback(contract_texts, source_lookup)
        if deduction_fallback:
            toxics.append(deduction_fallback)

    return {
        "title": infer_contract_title(contract_texts),
        "summary": parsed.get("summary", ""),
        "riskLevel": overall_risk,
        "groundingStatus": parsed.get("groundingStatus", "not_used"),
        "toxicCount": len(toxics),
        "toxics": toxics,
    }


def invoke_result_loader_async(payload: dict[str, Any]) -> dict[str, Any] | None:
    mode = get_result_loader_mode()
    function_name = get_result_loader_function_name()
    if mode in {"sqs", "destination", "disabled", "none"}:
        return {
            "mode": mode,
            "success": True,
            "message": "analysis_result_loader direct invoke skipped; relying on Lambda Destination / SQS pipeline.",
        }

    if mode == "local":
        from lambdas.analysis_result_loader.handler import lambda_handler as loader_handler

        response = loader_handler(payload, None)
        return {
            "mode": "local",
            "success": bool(response.get("success")),
            "data": response.get("data", {}),
        }

    if not function_name:
        return None

    session = build_boto3_session()
    client = session.client("lambda")
    response = client.invoke(
        FunctionName=function_name,
        InvocationType="Event",
        Payload=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
    )
    return {
        "mode": "lambda",
        "functionName": function_name,
        "statusCode": response.get("StatusCode"),
    }


def extract_text_from_gemini_response(response: dict[str, Any]) -> str:
    candidates = response.get("candidates", []) or []
    texts: list[str] = []
    for candidate in candidates:
        content = candidate.get("content", {}) or {}
        for part in content.get("parts", []) or []:
            text = part.get("text")
            if text:
                texts.append(text)
    return "\n".join(texts).strip()


def build_gemini_response_schema() -> dict[str, Any]:
    return {
        "type": "OBJECT",
        "properties": {
            "summary": {"type": "STRING"},
            "riskLevel": {
                "type": "STRING",
                "enum": ["low", "medium", "high"],
            },
            "groundingStatus": {
                "type": "STRING",
                "enum": ["grounded", "insufficient", "not_used"],
            },
            "clauses": {
                "type": "ARRAY",
                "items": {
                    "type": "OBJECT",
                    "properties": {
                        "clauseText": {"type": "STRING"},
                        "riskType": {"type": "STRING"},
                        "riskLevel": {
                            "type": "STRING",
                            "enum": ["low", "medium", "high"],
                        },
                        "reason": {"type": "STRING"},
                        "suggestion": {"type": "STRING"},
                        "sourceIds": {
                            "type": "ARRAY",
                            "items": {"type": "STRING"},
                        },
                    },
                    "required": [
                        "clauseText",
                        "riskType",
                        "riskLevel",
                        "reason",
                        "suggestion",
                        "sourceIds",
                    ],
                },
            },
        },
        "required": ["summary", "riskLevel", "groundingStatus", "clauses"],
    }


def call_gemini_generate(
    prompt: str,
    response_schema: dict[str, Any] | None = None,
    model_id_override: str | None = None,
) -> dict[str, Any]:
    api_key = get_required_env("GEMINI_API_KEY")
    model_id = model_id_override or get_gemini_model_id()
    endpoint = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{parse.quote(model_id, safe='')}:generateContent?key={parse.quote(api_key, safe='')}"
    )
    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {
                        "text": prompt,
                    }
                ],
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 1500,
            "responseMimeType": "application/json",
            "responseSchema": response_schema or build_gemini_response_schema(),
        },
    }

    req = request.Request(
        endpoint,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with request.urlopen(req, timeout=120) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib_error.HTTPError as exc:
        details = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Gemini API error ({exc.code}) [{model_id}]: {details}") from exc


def repair_json_with_gemini(raw_text: str, model_id_override: str | None = None) -> dict[str, Any]:
    response = call_gemini_generate(
        (
            "Convert the following malformed JSON-like text into strict valid JSON. "
            "Return JSON only and preserve the original field names and values as much as possible.\n\n"
            f"{raw_text}"
        ),
        response_schema=build_gemini_response_schema(),
        model_id_override=model_id_override,
    )
    repaired_text = extract_text_from_gemini_response(response)
    return parse_json_response(repaired_text)


def analyze_contract_with_bedrock(
    contract_texts: list[str],
    knowledge_base_id: str | None,
    retrieval_query: str | None = None,
) -> dict[str, Any]:
    session = build_boto3_session()
    runtime_client = session.client("bedrock-runtime")
    provider = get_llm_provider()

    retrieval = None
    if knowledge_base_id:
        retrieval = retrieve_knowledge_context(
            contract_texts=contract_texts,
            knowledge_base_id=knowledge_base_id,
            event_query=retrieval_query,
        )

    prompt = build_analysis_prompt(
        contract_texts=contract_texts,
        knowledge_base_id=knowledge_base_id,
        retrieved_contexts=(retrieval or {}).get("results"),
        provider=provider,
    )

    if provider == "gemini":
        import time
        configured_model_id = get_gemini_model_id()
        fallback_model_id = get_gemini_fallback_model_id()
        candidate_model_ids = [configured_model_id]
        if fallback_model_id and fallback_model_id not in candidate_model_ids:
            candidate_model_ids.append(fallback_model_id)

        last_error: Exception | None = None
        for model_id in candidate_model_ids:
            for attempt in range(DEFAULT_GEMINI_RETRIES):
                try:
                    response = call_gemini_generate(prompt, model_id_override=model_id)
                    raw_text = extract_text_from_gemini_response(response)
                except Exception as exc:
                    last_error = exc
                    error_text = str(exc)
                    retry_delay = extract_retry_delay_seconds(error_text)
                    if is_gemini_quota_error(error_text) and model_id != candidate_model_ids[-1]:
                        break
                    if attempt < DEFAULT_GEMINI_RETRIES - 1:
                        time.sleep(retry_delay or (DEFAULT_GEMINI_RETRY_BASE_SECONDS * (2 ** attempt)))
                    continue

                try:
                    parsed = parse_json_response(raw_text)
                except Exception:
                    try:
                        parsed = repair_json_with_gemini(raw_text, model_id_override=model_id)
                    except Exception as repair_exc:
                        last_error = repair_exc
                        error_text = str(repair_exc)
                        retry_delay = extract_retry_delay_seconds(error_text)
                        if is_gemini_quota_error(error_text) and model_id != candidate_model_ids[-1]:
                            break
                        if attempt < DEFAULT_GEMINI_RETRIES - 1:
                            time.sleep(retry_delay or (DEFAULT_GEMINI_RETRY_BASE_SECONDS * (2 ** attempt)))
                        continue

                if needs_korean_localization(parsed):
                    try:
                        parsed = localize_analysis_to_korean(parsed, model_id_override=model_id)
                    except Exception:
                        pass
                return {
                    "rawText": raw_text,
                    "parsed": parsed,
                    "usage": response.get("usageMetadata", {}),
                    "retrieval": retrieval,
                    "provider": provider,
                    "modelId": model_id,
                }
        raise RuntimeError(
            f"Gemini analysis failed after trying models {candidate_model_ids}. Last error: {last_error}"
        )

    response = runtime_client.converse(
        modelId=get_model_id(),
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "text": prompt,
                    }
                ],
            }
        ],
        inferenceConfig={
            "temperature": 0.2,
            "maxTokens": 1500,
        },
    )
    raw_text = extract_text_from_converse_response(response)
    parsed = parse_json_response(raw_text)
    return {
        "rawText": raw_text,
        "parsed": parsed,
        "usage": response.get("usage", {}),
        "retrieval": retrieval,
        "provider": provider,
        "modelId": get_model_id(),
    }


def lambda_handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    del context

    load_env_file()

    contract_id = event.get("contractId")
    analysis_id = event.get("analysisId")
    contract_texts = event.get("contractTexts") or []
    retrieval_query = str(event.get("retrievalQuery") or "").strip() or None
    knowledge_base_id = (
        str(event.get("knowledgeBaseId") or "").strip()
        or os.getenv("KNOWLEDGE_BASE_ID", "").strip()
        or None
    )

    if not contract_texts:
        return {
            "success": False,
            "error": "Missing contractTexts in event.",
            "data": {
                "contractId": contract_id,
                "analysisId": analysis_id,
            },
        }

    try:
        result = analyze_contract_with_bedrock(
            contract_texts=contract_texts,
            knowledge_base_id=knowledge_base_id,
            retrieval_query=retrieval_query,
        )
        analysis_result = build_analysis_result(
            contract_texts,
            result["parsed"],
            retrieval_results=(result.get("retrieval") or {}).get("results", []),
        )
        response_payload = {
            "success": True,
            "data": {
                "contractId": contract_id,
                "analysisId": analysis_id,
                "analysisResult": analysis_result,
                "knowledgeBaseId": knowledge_base_id,
                "retrievalQuery": (result.get("retrieval") or {}).get("query"),
                "retrievalResults": (result.get("retrieval") or {}).get("results", []),
                "analysis": result["parsed"],
                "usage": result["usage"],
                "provider": result["provider"],
                "modelId": result["modelId"],
            },
        }
        try:
            loader_result = invoke_result_loader_async(response_payload)
            if loader_result:
                response_payload["data"]["resultLoader"] = loader_result
        except Exception as exc:
            response_payload["data"]["resultLoader"] = {
                "success": False,
                "error": str(exc),
            }
        return response_payload
    except Exception as exc:
        return {
            "success": False,
            "error": str(exc),
            "data": {
                "contractId": contract_id,
                "analysisId": analysis_id,
                "knowledgeBaseId": knowledge_base_id,
                "retrievalQuery": retrieval_query,
                "provider": get_llm_provider(),
                "modelId": get_gemini_model_id() if get_llm_provider() == "gemini" else get_model_id(),
            },
        }
