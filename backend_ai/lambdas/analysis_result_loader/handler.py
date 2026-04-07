"""Persist contract analysis results into PostgreSQL."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

import psycopg
from psycopg.rows import dict_row


ENV_PATH = Path(__file__).with_name(".env")
DEFAULT_TABLE_NAME = "analysis_results"


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


def get_table_name() -> str:
    return os.getenv("DB_TABLE_NAME", "").strip() or DEFAULT_TABLE_NAME


def build_connection_string() -> str:
    host = get_required_env("DB_HOST")
    port = get_required_env("DB_PORT")
    dbname = get_required_env("DB_NAME")
    user = get_required_env("DB_USERNAME")
    password = get_required_env("DB_PASSWORD")
    sslmode = os.getenv("DB_SSLMODE", "").strip() or "disable"

    return (
        f"host={host} port={port} dbname={dbname} "
        f"user={user} password={password} sslmode={sslmode}"
    )


def ensure_table(conn: psycopg.Connection[Any]) -> None:
    table_name = get_table_name()
    with conn.cursor() as cur:
        cur.execute(
            f"""
            CREATE TABLE IF NOT EXISTS {table_name} (
                id BIGSERIAL PRIMARY KEY,
                contract_id TEXT NOT NULL,
                analysis_id TEXT NOT NULL UNIQUE,
                title TEXT,
                summary TEXT,
                risk_level TEXT,
                grounding_status TEXT,
                toxic_count INTEGER NOT NULL DEFAULT 0,
                toxics_json JSONB NOT NULL DEFAULT '[]'::jsonb,
                analysis_json JSONB NOT NULL DEFAULT '{{}}'::jsonb,
                retrieval_json JSONB NOT NULL DEFAULT '[]'::jsonb,
                provider TEXT,
                model_id TEXT,
                knowledge_base_id TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """
        )


def normalize_event(event: dict[str, Any]) -> dict[str, Any]:
    data = event.get("data", event) or {}
    analysis_result = data.get("analysisResult", {}) or {}
    return {
        "contract_id": data.get("contractId") or event.get("contractId"),
        "analysis_id": data.get("analysisId") or event.get("analysisId"),
        "title": analysis_result.get("title", ""),
        "summary": analysis_result.get("summary", ""),
        "risk_level": analysis_result.get("riskLevel", ""),
        "grounding_status": analysis_result.get("groundingStatus", ""),
        "toxic_count": int(analysis_result.get("toxicCount") or 0),
        "toxics_json": analysis_result.get("toxics", []) or [],
        "analysis_json": data.get("analysis", {}) or {},
        "retrieval_json": data.get("retrievalResults", []) or [],
        "provider": data.get("provider", ""),
        "model_id": data.get("modelId", ""),
        "knowledge_base_id": data.get("knowledgeBaseId", ""),
    }


def validate_payload(payload: dict[str, Any]) -> None:
    if not payload.get("contract_id"):
        raise ValueError("Missing contract_id")
    if not payload.get("analysis_id"):
        raise ValueError("Missing analysis_id")


def upsert_analysis_result(conn: psycopg.Connection[Any], payload: dict[str, Any]) -> dict[str, Any]:
    table_name = get_table_name()
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            f"""
            INSERT INTO {table_name} (
                contract_id,
                analysis_id,
                title,
                summary,
                risk_level,
                grounding_status,
                toxic_count,
                toxics_json,
                analysis_json,
                retrieval_json,
                provider,
                model_id,
                knowledge_base_id
            ) VALUES (
                %(contract_id)s,
                %(analysis_id)s,
                %(title)s,
                %(summary)s,
                %(risk_level)s,
                %(grounding_status)s,
                %(toxic_count)s,
                %(toxics_json)s::jsonb,
                %(analysis_json)s::jsonb,
                %(retrieval_json)s::jsonb,
                %(provider)s,
                %(model_id)s,
                %(knowledge_base_id)s
            )
            ON CONFLICT (analysis_id) DO UPDATE SET
                contract_id = EXCLUDED.contract_id,
                title = EXCLUDED.title,
                summary = EXCLUDED.summary,
                risk_level = EXCLUDED.risk_level,
                grounding_status = EXCLUDED.grounding_status,
                toxic_count = EXCLUDED.toxic_count,
                toxics_json = EXCLUDED.toxics_json,
                analysis_json = EXCLUDED.analysis_json,
                retrieval_json = EXCLUDED.retrieval_json,
                provider = EXCLUDED.provider,
                model_id = EXCLUDED.model_id,
                knowledge_base_id = EXCLUDED.knowledge_base_id,
                updated_at = NOW()
            RETURNING id, contract_id, analysis_id, updated_at
            """,
            {
                **payload,
                "toxics_json": json.dumps(payload["toxics_json"], ensure_ascii=False),
                "analysis_json": json.dumps(payload["analysis_json"], ensure_ascii=False),
                "retrieval_json": json.dumps(payload["retrieval_json"], ensure_ascii=False),
            },
        )
        row = cur.fetchone()
        if not row:
            raise RuntimeError("Failed to save analysis result")
        return dict(row)


def lambda_handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    del context
    load_env_file()

    try:
        payload = normalize_event(event)
        validate_payload(payload)

        with psycopg.connect(build_connection_string(), autocommit=False) as conn:
            ensure_table(conn)
            saved = upsert_analysis_result(conn, payload)
            conn.commit()

        return {
            "success": True,
            "data": {
                "table": get_table_name(),
                "saved": saved,
            },
        }
    except Exception as exc:
        return {
            "success": False,
            "error": str(exc),
        }
