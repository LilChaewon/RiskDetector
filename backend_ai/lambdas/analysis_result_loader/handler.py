"""Persist analysis results into the backend_core-compatible PostgreSQL schema.
분석 결과를 backend_core 스키마와 호환되는 PostgreSQL 데이터베이스에 저장합니다."""

from __future__ import annotations

import json
import os
from pathlib import Path
import ssl
from typing import Any
from uuid import uuid4

import pg8000


ENV_PATH = Path(__file__).with_name(".env")
SCHEMA_NAME = "prod"
ANALYSES_TABLE = f"{SCHEMA_NAME}.contract_analyses"
TOXICS_TABLE = f"{SCHEMA_NAME}.toxic_clauses"
SUGGESTION_MARKER = "[RD_SUGGESTION]"


def load_env_file(env_path: Path = ENV_PATH) -> None:
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


def get_required_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise ValueError(f"Missing required environment variable: {name}")
    return value


def build_ssl_context() -> ssl.SSLContext | None:
    sslmode = os.getenv("DB_SSLMODE", "").strip() or "disable"
    if sslmode == "disable":
        return None
    return ssl.create_default_context()


def connect_db() -> Any:
    """Connect to the PostgreSQL database using settings from environment variables.
    환경 변수에 설정된 정보를 바탕으로 PostgreSQL 데이터 데이터베이스에 연결합니다."""
    return pg8000.connect(
        user=get_required_env("DB_USERNAME"),
        password=get_required_env("DB_PASSWORD"),
        host=get_required_env("DB_HOST"),
        port=int(get_required_env("DB_PORT")),
        database=get_required_env("DB_NAME"),
        ssl_context=build_ssl_context(),
        timeout=30,
    )


def ensure_backend_core_tables(conn: Any) -> None:
    """Ensure that the necessary database schema and tables exist, creating them if they do not.
    필요한 데이터베이스 스키마와 테이블이 없으면 생성합니다."""
    with conn.cursor() as cur:
        cur.execute(f"CREATE SCHEMA IF NOT EXISTS {SCHEMA_NAME}")
        cur.execute(
            f"""
            CREATE TABLE IF NOT EXISTS {ANALYSES_TABLE} (
                id VARCHAR(50) PRIMARY KEY,
                contract_id VARCHAR(50),
                summary TEXT,
                status VARCHAR(50),
                process_status VARCHAR(50),
                riskdetector_overall_comment TEXT,
                riskdetector_warning_comment TEXT,
                riskdetector_advice TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
            """
        )
        cur.execute(
            f"""
            CREATE TABLE IF NOT EXISTS {TOXICS_TABLE} (
                id VARCHAR(50) PRIMARY KEY,
                analysis_id VARCHAR(50),
                title VARCHAR(500),
                clause TEXT,
                reason TEXT,
                reason_reference TEXT,
                source_contract_tag_idx INTEGER,
                warn_level INTEGER,
                created_at TIMESTAMP DEFAULT NOW()
            )
            """
        )


def parse_sqs_body(body: str) -> dict[str, Any]:
    parsed = json.loads(body)
    if isinstance(parsed, dict) and "responsePayload" in parsed:
        response_payload = parsed.get("responsePayload")
        if isinstance(response_payload, str):
            return json.loads(response_payload)
        if isinstance(response_payload, dict):
            return response_payload
    return parsed


def extract_events(event: dict[str, Any]) -> list[dict[str, Any]]:
    records = event.get("Records")
    if not isinstance(records, list) or not records:
        return [event]

    extracted: list[dict[str, Any]] = []
    for record in records:
        body = record.get("body")
        if not body:
            continue
        if isinstance(body, str):
            extracted.append(parse_sqs_body(body))
        elif isinstance(body, dict):
            extracted.append(body)
    return extracted or [event]


def is_success_event(event: dict[str, Any]) -> bool:
    status = str(event.get("status", "") or "").strip().lower()
    if status:
        return status in {"success", "succeeded", "completed", "complete", "ok"}
    return bool(event.get("success", True))


def pick_analysis_result(event: dict[str, Any], data: dict[str, Any]) -> dict[str, Any]:
    candidates = (
        data.get("analysisResult"),
        data.get("result"),
        event.get("analysisResult"),
        event.get("result"),
        data.get("analysis"),
        event.get("analysis"),
    )
    for candidate in candidates:
        if isinstance(candidate, dict):
            return candidate
    return {}


def normalize_event(event: dict[str, Any]) -> dict[str, Any]:
    """Normalize the lambda event into a standard format suitable for database persistence.
    람다 이벤트를 DB 저장에 적합한 표준 형식으로 변환합니다."""
    data = event.get("data")
    if not isinstance(data, dict):
        data = event

    analysis_result = pick_analysis_result(event, data)
    toxics = analysis_result.get("toxics", []) or []
    if not isinstance(toxics, list):
        toxics = []

    return {
        "success": is_success_event(event),
        "contract_id": data.get("contractId") or event.get("contractId"),
        "analysis_id": data.get("analysisId") or event.get("analysisId"),
        "title": analysis_result.get("title", ""),
        "summary": analysis_result.get("summary", "") or (data.get("analysis", {}) or {}).get("summary", ""),
        "risk_level": str(analysis_result.get("riskLevel", "") or "").lower(),
        "grounding_status": analysis_result.get("groundingStatus", ""),
        "toxics": toxics,
        "raw_output_present": bool(event.get("rawOutput") or data.get("rawOutput")),
    }


def validate_payload(payload: dict[str, Any]) -> None:
    if not payload.get("contract_id"):
        raise ValueError("Missing contract_id")
    if not payload.get("analysis_id"):
        raise ValueError("Missing analysis_id")


def map_process_status(success: bool) -> tuple[str, str]:
    if success:
        return ("success", "COMPLETED")
    return ("error", "FAILED")


def map_warn_level(risk_level: str) -> int:
    normalized = (risk_level or "").strip().lower()
    if normalized == "high":
        return 3
    if normalized == "medium":
        return 2
    return 1


def build_warning_comment(toxics: list[dict[str, Any]]) -> str:
    if not toxics:
        return ""
    return " / ".join(
        str(item.get("reason", "")).strip()
        for item in toxics[:3]
        if str(item.get("reason", "")).strip()
    )


def build_advice(toxics: list[dict[str, Any]]) -> str:
    if not toxics:
        return ""
    return " / ".join(
        str(item.get("suggestion", "")).strip()
        for item in toxics[:3]
        if str(item.get("suggestion", "")).strip()
    )


def normalize_source_ids(source_ids: Any) -> str:
    if isinstance(source_ids, str):
        return source_ids.strip()
    if isinstance(source_ids, list):
        return ", ".join(str(source_id).strip() for source_id in source_ids if str(source_id).strip())
    return ""


def build_reason_reference(item: dict[str, Any]) -> str:
    source_text = normalize_source_ids(item.get("sourceIds") or item.get("source_ids") or item.get("sources"))
    suggestion = str(item.get("suggestion", "") or item.get("after", "") or "").strip()
    if not suggestion:
        return source_text
    if not source_text:
        return f"{SUGGESTION_MARKER}{suggestion}"
    return f"{source_text}\n{SUGGESTION_MARKER}{suggestion}"


def log_payload_diagnostics(payload: dict[str, Any]) -> None:
    toxics = payload.get("toxics", [])
    diagnostics = {
        "level": "info",
        "message": "analysis_result_loader_payload",
        "contractId": payload.get("contract_id"),
        "analysisId": payload.get("analysis_id"),
        "success": payload.get("success"),
        "summaryPresent": bool(payload.get("summary")),
        "riskLevel": payload.get("risk_level"),
        "toxicCount": len(toxics),
        "suggestionCount": sum(1 for item in toxics if str(item.get("suggestion", "")).strip()),
        "sourceIdsCount": sum(1 for item in toxics if normalize_source_ids(item.get("sourceIds") or item.get("source_ids") or item.get("sources"))),
        "rawOutputPresent": payload.get("raw_output_present"),
    }
    print(json.dumps(diagnostics, ensure_ascii=False))


def upsert_contract_analysis(conn: Any, payload: dict[str, Any]) -> dict[str, Any]:
    """Insert or update (Upsert) the overall contract analysis summary in the database.
    계약서 전체 분석 요약 정보를 DB에 추가하거나 업데이트(Upsert)합니다."""
    status, process_status = map_process_status(payload["success"])
    with conn.cursor() as cur:
        cur.execute(
            f"""
            INSERT INTO {ANALYSES_TABLE} (
                id,
                contract_id,
                summary,
                status,
                process_status,
                riskdetector_overall_comment,
                riskdetector_warning_comment,
                riskdetector_advice
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
                contract_id = EXCLUDED.contract_id,
                summary = EXCLUDED.summary,
                status = EXCLUDED.status,
                process_status = EXCLUDED.process_status,
                riskdetector_overall_comment = EXCLUDED.riskdetector_overall_comment,
                riskdetector_warning_comment = EXCLUDED.riskdetector_warning_comment,
                riskdetector_advice = EXCLUDED.riskdetector_advice,
                updated_at = NOW()
            RETURNING id, contract_id, status, process_status, updated_at
            """,
            (
                payload["analysis_id"],
                payload["contract_id"],
                payload["summary"],
                status,
                process_status,
                payload["summary"],
                build_warning_comment(payload["toxics"]),
                build_advice(payload["toxics"]),
            ),
        )
        row = cur.fetchone()
        if not row:
            raise RuntimeError("Failed to save contract analysis")
        return {
            "id": row[0],
            "contract_id": row[1],
            "status": row[2],
            "process_status": row[3],
            "updated_at": str(row[4]),
        }


def replace_toxic_clauses(conn: Any, payload: dict[str, Any]) -> dict[str, Any]:
    """Delete existing toxic clauses and replace them with new ones for the given analysis.
    기존의 독소 조항들을 삭제하고 새 조항들로 교체하여 저장합니다."""
    analysis_id = payload["analysis_id"]
    toxics = payload["toxics"]
    inserted = 0
    with conn.cursor() as cur:
        cur.execute(f"DELETE FROM {TOXICS_TABLE} WHERE analysis_id = %s", (analysis_id,))

        for item in toxics:
            cur.execute(
                f"""
                INSERT INTO {TOXICS_TABLE} (
                    id,
                    analysis_id,
                    title,
                    clause,
                    reason,
                    reason_reference,
                    source_contract_tag_idx,
                    warn_level
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    str(uuid4()),
                    analysis_id,
                    str(item.get("riskType", "") or item.get("title", "") or "독소 조항"),
                    str(item.get("clauseText", "") or item.get("clause", "")),
                    str(item.get("reason", "")),
                    build_reason_reference(item),
                    item.get("sourceContractTagIdx"),
                    map_warn_level(str(item.get("riskLevel", "") or payload["risk_level"])),
                ),
            )
            inserted += 1

    return {
        "analysis_id": analysis_id,
        "deleted_and_reinserted": inserted,
    }


def lambda_handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    """Main entry point for the Lambda, which extracts events and persists them to the DB sequentially.
    람다의 메인 엔트리 포인트입니다. 이벤트를 추출하여 DB에 순차적으로 저장합니다."""
    del context
    load_env_file()

    try:
        raw_events = extract_events(event)
        processed_items: list[dict[str, Any]] = []

        with connect_db() as conn:
            ensure_backend_core_tables(conn)

            for raw_event in raw_events:
                payload = normalize_event(raw_event)
                log_payload_diagnostics(payload)
                validate_payload(payload)
                saved_analysis = upsert_contract_analysis(conn, payload)
                toxic_result = replace_toxic_clauses(conn, payload)
                processed_items.append(
                    {
                        "analysis": saved_analysis,
                        "toxics": toxic_result,
                    }
                )

            conn.commit()

        return {
            "success": True,
            "data": {
                "schema": SCHEMA_NAME,
                "processedCount": len(processed_items),
                "analysis": processed_items[0]["analysis"] if processed_items else None,
                "toxics": processed_items[0]["toxics"] if processed_items else None,
                "items": processed_items,
            },
        }
    except Exception as exc:
        error_report = {
            "level": "error",
            "message": "analysis_result_loader_failed",
            "errorType": type(exc).__name__,
            "error": str(exc),
            "eventKeys": list(event.keys()) if isinstance(event, dict) else [],
            "recordCount": len(event.get("Records", [])) if isinstance(event, dict) and isinstance(event.get("Records"), list) else 0,
        }
        print(json.dumps(error_report, ensure_ascii=False))
        raise RuntimeError(f"Failed to upsert analysis result: {exc}") from exc
