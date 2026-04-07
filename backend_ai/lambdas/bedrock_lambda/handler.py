"""Local-friendly Bedrock lambda for contract risk analysis with optional Knowledge Base retrieval."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any
from urllib import error as urllib_error
from urllib import parse, request

import boto3


ENV_PATH = Path(__file__).with_name(".env")
DEFAULT_MODEL_ID = "amazon.nova-lite-v1:0"
DEFAULT_RETRIEVAL_RESULTS = 5
DEFAULT_GEMINI_MODEL_ID = "gemini-1.5-pro"
DEFAULT_GEMINI_RETRIES = 3


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


def normalize_retrieval_results(response: dict[str, Any]) -> list[dict[str, Any]]:
    normalized: list[dict[str, Any]] = []
    for index, item in enumerate(response.get("retrievalResults", []) or [], start=1):
        content = item.get("content", {}) or {}
        metadata = item.get("metadata", {}) or {}
        location = item.get("location", {}) or {}
        text = (content.get("text") or "").strip()
        if not text:
            continue

        normalized.append(
            {
                "rank": index,
                "score": item.get("score"),
                "text": text,
                "location": format_retrieval_location(location),
                "metadata": metadata,
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
            f"[Source {item['rank']}] {item['text']}"
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
            context_lines.append(
                f"[Source {item['rank']}] location={source}\n"
                f"{item['text']}"
            )
        kb_text = (
            f"Knowledge Base ID: {knowledge_base_id}\n"
            "Use only the retrieved legal context below as the grounding source when possible.\n"
            "If the retrieved context is insufficient, state that explicitly in the JSON reason fields.\n\n"
            "Retrieved legal context:\n"
            f"{chr(10).join(context_lines)}"
        )
    elif knowledge_base_id:
        kb_text = (
            f"Knowledge Base ID is available: {knowledge_base_id}. "
            "No retrieval results were found, so analyze conservatively and say grounding was insufficient."
        )
    else:
        kb_text = "No Knowledge Base is connected. Analyze using general legal/common-sense caution only."
    output_constraints = (
        "Keep the output compact.\n"
        "- summary: one sentence, under 120 characters\n"
        "- clauses: at most 3 items\n"
        "- reason: one sentence, under 180 characters\n"
        "- suggestion: one sentence, under 120 characters\n"
        "- sourceIds: only include the source labels actually used\n"
        "- Do not put line breaks inside JSON string values\n"
        if provider == "gemini"
        else ""
    )
    return (
        "You are a contract risk analyzer for Korean employment and real-estate contracts.\n"
        "Analyze the provided clauses and return strict JSON only.\n"
        "Focus on potentially unfair, one-sided, or risky clauses.\n"
        f"{kb_text}\n\n"
        f"{output_constraints}\n"
        "Return JSON with this shape:\n"
        "{\n"
        '  "summary": "...",\n'
        '  "riskLevel": "low|medium|high",\n'
        '  "groundingStatus": "grounded|insufficient|not_used",\n'
        '  "clauses": [\n'
        "    {\n"
        '      "clauseText": "...",\n'
        '      "riskType": "...",\n'
        '      "riskLevel": "low|medium|high",\n'
        '      "reason": "...",\n'
        '      "suggestion": "...",\n'
        '      "sourceIds": ["Source 1"]\n'
        "    }\n"
        "  ]\n"
        "}\n\n"
        "Contract clauses:\n"
        f"{joined_text}"
    )


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


def build_analysis_result(contract_texts: list[str], parsed: dict[str, Any]) -> dict[str, Any]:
    clauses = parsed.get("clauses", []) or []
    toxics = []

    for clause in clauses:
        risk_level = str(clause.get("riskLevel") or "low").lower()
        if risk_level == "low":
            continue

        toxics.append(
            {
                "clauseText": clause.get("clauseText", ""),
                "riskType": clause.get("riskType", ""),
                "riskLevel": risk_level,
                "reason": clause.get("reason", ""),
                "suggestion": clause.get("suggestion", ""),
                "sourceIds": clause.get("sourceIds", []) or [],
            }
        )

    overall_risk = parsed.get("riskLevel", "low")
    if not toxics and str(overall_risk).lower() in {"medium", "high"}:
        fallback_clause = next(
            (
                text
                for text in contract_texts
                if any(keyword in text for keyword in ["원상복구", "관리비", "보증금", "해지", "위약", "배상"])
            ),
            contract_texts[0] if contract_texts else "",
        )
        toxics.append(
            {
                "clauseText": fallback_clause,
                "riskType": "Potentially Unfair Clause",
                "riskLevel": str(overall_risk).lower(),
                "reason": parsed.get("summary", ""),
                "suggestion": "관련 비용 범위와 책임 한계를 구체적으로 명시하도록 수정 권장.",
                "sourceIds": [],
            }
        )

    return {
        "title": infer_contract_title(contract_texts),
        "summary": parsed.get("summary", ""),
        "riskLevel": overall_risk,
        "groundingStatus": parsed.get("groundingStatus", "not_used"),
        "toxicCount": len(toxics),
        "toxics": toxics,
    }


def invoke_result_loader_async(payload: dict[str, Any]) -> dict[str, Any] | None:
    function_name = get_result_loader_function_name()
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


def call_gemini_generate(prompt: str, response_schema: dict[str, Any] | None = None) -> dict[str, Any]:
    api_key = get_required_env("GEMINI_API_KEY")
    model_id = get_gemini_model_id()
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
        raise RuntimeError(f"Gemini API error ({exc.code}): {details}") from exc


def repair_json_with_gemini(raw_text: str) -> dict[str, Any]:
    response = call_gemini_generate(
        (
            "Convert the following malformed JSON-like text into strict valid JSON. "
            "Return JSON only and preserve the original field names and values as much as possible.\n\n"
            f"{raw_text}"
        ),
        response_schema=build_gemini_response_schema(),
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
        last_error: Exception | None = None
        for _ in range(DEFAULT_GEMINI_RETRIES):
            response = call_gemini_generate(prompt)
            raw_text = extract_text_from_gemini_response(response)
            try:
                parsed = parse_json_response(raw_text)
            except Exception as exc:
                try:
                    parsed = repair_json_with_gemini(raw_text)
                except Exception as repair_exc:
                    last_error = repair_exc
                    continue
            return {
                "rawText": raw_text,
                "parsed": parsed,
                "usage": response.get("usageMetadata", {}),
                "retrieval": retrieval,
                "provider": provider,
                "modelId": get_gemini_model_id(),
            }
        raise RuntimeError(f"Gemini JSON parsing failed after {DEFAULT_GEMINI_RETRIES} attempts: {last_error}")

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
        analysis_result = build_analysis_result(contract_texts, result["parsed"])
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
