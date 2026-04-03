"""Local-friendly OCR lambda handler backed by S3 and Upstage Document Parse."""

from __future__ import annotations

import json
import mimetypes
import os
import uuid
from pathlib import Path
from typing import Any
from urllib import error as urllib_error
from urllib import request

import boto3

UPSTAGE_DOCUMENT_PARSE_URL = "https://api.upstage.ai/v1/document-digitization"
ENV_PATH = Path(__file__).with_name(".env")


def load_env_file(env_path: Path = ENV_PATH) -> None:
    """Load key/value pairs from a local .env file when present."""
    if not env_path.exists():
        return

    for raw_line in env_path.read_text().splitlines():
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


def fetch_s3_object_bytes(bucket: str, key: str) -> tuple[bytes, str]:
    session = build_boto3_session()
    s3_client = session.client("s3")
    response = s3_client.get_object(Bucket=bucket, Key=key)
    body = response["Body"].read()
    content_type = response.get("ContentType") or mimetypes.guess_type(key)[0] or "application/octet-stream"
    return body, content_type


def encode_multipart_form_data(fields: dict[str, str], file_field: str, filename: str, content_type: str, payload: bytes) -> tuple[bytes, str]:
    boundary = f"----RiskDetectorBoundary{uuid.uuid4().hex}"
    body = bytearray()

    for name, value in fields.items():
        body.extend(f"--{boundary}\r\n".encode("utf-8"))
        body.extend(f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode("utf-8"))
        body.extend(value.encode("utf-8"))
        body.extend(b"\r\n")

    body.extend(f"--{boundary}\r\n".encode("utf-8"))
    body.extend(
        (
            f'Content-Disposition: form-data; name="{file_field}"; '
            f'filename="{Path(filename).name}"\r\n'
        ).encode("utf-8")
    )
    body.extend(f"Content-Type: {content_type}\r\n\r\n".encode("utf-8"))
    body.extend(payload)
    body.extend(b"\r\n")
    body.extend(f"--{boundary}--\r\n".encode("utf-8"))

    return bytes(body), f"multipart/form-data; boundary={boundary}"


def call_upstage_document_parse(file_bytes: bytes, filename: str, content_type: str) -> dict[str, Any]:
    api_key = get_required_env("UPSTAGE_API_KEY")

    fields = {
        "model": "document-parse",
        "ocr": "force",
    }

    body, multipart_content_type = encode_multipart_form_data(
        fields=fields,
        file_field="document",
        filename=filename,
        content_type=content_type,
        payload=file_bytes,
    )

    req = request.Request(
        UPSTAGE_DOCUMENT_PARSE_URL,
        data=body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": multipart_content_type,
            "Content-Length": str(len(body)),
        },
        method="POST",
    )

    try:
        with request.urlopen(req, timeout=120) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib_error.HTTPError as exc:
        details = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Upstage API error ({exc.code}): {details}") from exc


def build_lambda_response(result: dict[str, Any], bucket: str, s3_key: str, page_idx: int | None) -> dict[str, Any]:
    target_page = page_idx + 1 if page_idx is not None else None
    elements = result.get("elements", []) or []

    html_array = [
        element.get("content", {}).get("html", "")
        for element in elements
        if element.get("content", {}).get("html")
        and (target_page is None or element.get("page") == target_page)
    ]

    return {
        "success": True,
        "data": {
            "bucket": bucket,
            "s3_key": s3_key,
            "page_idx": page_idx,
            "html_entire": result.get("content", {}).get("html", ""),
            "html_array": html_array,
            "elements_count": len(elements),
            "usage": result.get("usage", {}),
        },
    }


def lambda_handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    del context

    load_env_file()

    bucket = event.get("bucket") or event.get("s3Bucket") or os.getenv("S3_BUCKET", "").strip()
    s3_key = event.get("s3Key")
    page_idx = event.get("pageIdx")

    if not bucket:
        return {"success": False, "error": "Missing S3 bucket. Set S3_BUCKET or pass bucket in event."}
    if not s3_key:
        return {"success": False, "error": "Missing s3Key in event."}

    try:
        normalized_page_idx = int(page_idx) if page_idx is not None else None
        file_bytes, content_type = fetch_s3_object_bytes(bucket=bucket, key=s3_key)
        result = call_upstage_document_parse(
            file_bytes=file_bytes,
            filename=s3_key,
            content_type=content_type,
        )
        return build_lambda_response(
            result=result,
            bucket=bucket,
            s3_key=s3_key,
            page_idx=normalized_page_idx,
        )
    except Exception as exc:
        return {
            "success": False,
            "error": str(exc),
            "data": {
                "bucket": bucket,
                "s3_key": s3_key,
                "page_idx": page_idx,
            },
        }
