"""Local-friendly Bedrock lambda for contract risk analysis without Knowledge Base."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

import boto3


ENV_PATH = Path(__file__).with_name(".env")
DEFAULT_MODEL_ID = "amazon.nova-lite-v1:0"


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


def get_model_id() -> str:
    inference_profile_id = os.getenv("BEDROCK_INFERENCE_PROFILE_ID", "").strip()
    if inference_profile_id:
        return inference_profile_id
    return os.getenv("BEDROCK_MODEL_ID", "").strip() or DEFAULT_MODEL_ID


def build_analysis_prompt(contract_texts: list[str], knowledge_base_id: str | None) -> str:
    joined_text = "\n".join(f"- {text}" for text in contract_texts)
    kb_text = (
        f"Knowledge Base ID is available: {knowledge_base_id}. "
        "If a knowledge base is connected in the future, grounded retrieval can be added."
        if knowledge_base_id
        else "No Knowledge Base is connected. Analyze using general legal/common-sense caution only."
    )
    return (
        "You are a contract risk analyzer for Korean employment and real-estate contracts.\n"
        "Analyze the provided clauses and return strict JSON only.\n"
        "Focus on potentially unfair, one-sided, or risky clauses.\n"
        f"{kb_text}\n\n"
        "Return JSON with this shape:\n"
        "{\n"
        '  "summary": "...",\n'
        '  "riskLevel": "low|medium|high",\n'
        '  "clauses": [\n'
        "    {\n"
        '      "clauseText": "...",\n'
        '      "riskType": "...",\n'
        '      "riskLevel": "low|medium|high",\n'
        '      "reason": "...",\n'
        '      "suggestion": "..."\n'
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


def analyze_contract_with_bedrock(contract_texts: list[str], knowledge_base_id: str | None) -> dict[str, Any]:
    session = build_boto3_session()
    client = session.client("bedrock-runtime")

    prompt = build_analysis_prompt(contract_texts=contract_texts, knowledge_base_id=knowledge_base_id)
    response = client.converse(
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
    }


def lambda_handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    del context

    load_env_file()

    contract_id = event.get("contractId")
    analysis_id = event.get("analysisId")
    contract_texts = event.get("contractTexts") or []
    knowledge_base_id = os.getenv("KNOWLEDGE_BASE_ID", "").strip() or None

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
        )
        return {
            "success": True,
            "data": {
                "contractId": contract_id,
                "analysisId": analysis_id,
                "knowledgeBaseId": knowledge_base_id,
                "analysis": result["parsed"],
                "usage": result["usage"],
                "modelId": get_model_id(),
            },
        }
    except Exception as exc:
        return {
            "success": False,
            "error": str(exc),
            "data": {
                "contractId": contract_id,
                "analysisId": analysis_id,
                "knowledgeBaseId": knowledge_base_id,
                "modelId": get_model_id(),
            },
        }
