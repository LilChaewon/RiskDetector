"""Persist analysis results into the backend_core-compatible PostgreSQL schema."""

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
                ddobak_overall_comment TEXT,
                ddobak_warning_comment TEXT,
                ddobak_advice TEXT,
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


def normalize_event(event: dict[str, Any]) -> dict[str, Any]:
    data = event.get("data", event) or {}
    analysis_result = data.get("analysisResult", {}) or {}
    toxics = analysis_result.get("toxics", []) or []
    return {
        "success": bool(event.get("success", True)),
        "contract_id": data.get("contractId") or event.get("contractId"),
        "analysis_id": data.get("analysisId") or event.get("analysisId"),
        "title": analysis_result.get("title", ""),
        "summary": analysis_result.get("summary", "") or (data.get("analysis", {}) or {}).get("summary", ""),
        "risk_level": str(analysis_result.get("riskLevel", "") or "").lower(),
        "grounding_status": analysis_result.get("groundingStatus", ""),
        "toxics": toxics,
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


def upsert_contract_analysis(conn: Any, payload: dict[str, Any]) -> dict[str, Any]:
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
                ddobak_overall_comment,
                ddobak_warning_comment,
                ddobak_advice
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
                contract_id = EXCLUDED.contract_id,
                summary = EXCLUDED.summary,
                status = EXCLUDED.status,
                process_status = EXCLUDED.process_status,
                ddobak_overall_comment = EXCLUDED.ddobak_overall_comment,
                ddobak_warning_comment = EXCLUDED.ddobak_warning_comment,
                ddobak_advice = EXCLUDED.ddobak_advice,
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
                    ", ".join(str(source_id) for source_id in (item.get("sourceIds", []) or [])),
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
    del context
    load_env_file()

    try:
        payload = normalize_event(event)
        validate_payload(payload)

        with connect_db() as conn:
            ensure_backend_core_tables(conn)
            saved_analysis = upsert_contract_analysis(conn, payload)
            toxic_result = replace_toxic_clauses(conn, payload)
            conn.commit()

        return {
            "success": True,
            "data": {
                "schema": SCHEMA_NAME,
                "analysis": saved_analysis,
                "toxics": toxic_result,
            },
        }
    except Exception as exc:
        raise RuntimeError(f"Failed to upsert analysis result: {exc}") from exc
