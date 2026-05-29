"""Bedrock Knowledge Base 데이터 소스의 청킹 전략을 변경하고 재수집(ingestion)을 트리거합니다.

사용 전제:
- ai_rag/.env 또는 환경변수에 AWS_REGION, KNOWLEDGE_BASE_ID, DATA_SOURCE_ID가 설정되어 있어야 함.
- 청킹 전략을 바꾸면 전체 문서가 다시 임베딩되므로 비용/시간 소요가 있음.
- semantic 또는 hierarchical 청킹은 Bedrock KB가 자체적으로 임베딩 모델을 호출해 의미 경계를 잡음.

사용:
    python ai_rag/scripts/update_chunking.py --strategy semantic
    python ai_rag/scripts/update_chunking.py --strategy hierarchical
    python ai_rag/scripts/update_chunking.py --strategy fixed --max-tokens 400 --overlap 60
    python ai_rag/scripts/update_chunking.py --strategy semantic --dry-run

기본값:
- semantic: maxTokens=400, bufferSize=1, breakpoint=95th percentile
- hierarchical: parent=1200, child=400, overlap=60
- fixed: maxTokens=400, overlapPercentage=15
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

import boto3


ENV_PATH = Path(__file__).resolve().parents[1] / ".env"


def load_env(path: Path = ENV_PATH) -> None:
    if not path.exists():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


def build_chunking_config(strategy: str, max_tokens: int, overlap: int) -> dict:
    """Bedrock KB DataSource용 chunkingConfiguration 블록을 생성합니다."""
    if strategy == "none":
        return {"chunkingStrategy": "NONE"}

    if strategy == "fixed":
        return {
            "chunkingStrategy": "FIXED_SIZE",
            "fixedSizeChunkingConfiguration": {
                "maxTokens": max_tokens,
                "overlapPercentage": overlap,
            },
        }

    if strategy == "semantic":
        return {
            "chunkingStrategy": "SEMANTIC",
            "semanticChunkingConfiguration": {
                "maxTokens": max_tokens,
                "bufferSize": 1,
                "breakpointPercentileThreshold": 95,
            },
        }

    if strategy == "hierarchical":
        return {
            "chunkingStrategy": "HIERARCHICAL",
            "hierarchicalChunkingConfiguration": {
                "levelConfigurations": [
                    {"maxTokens": max(max_tokens * 3, 1200)},
                    {"maxTokens": max_tokens},
                ],
                "overlapTokens": overlap,
            },
        }

    raise ValueError(f"Unknown strategy: {strategy}")


def get_required(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        print(f"❌ 환경변수 {name} 가 비어 있습니다.")
        sys.exit(1)
    return value


def main() -> None:
    parser = argparse.ArgumentParser(description="Bedrock KB 청킹 전략 업데이트")
    parser.add_argument(
        "--strategy",
        choices=("semantic", "hierarchical", "fixed", "none"),
        default="semantic",
        help="청킹 전략 (기본: semantic)",
    )
    parser.add_argument("--max-tokens", type=int, default=400, help="청크 최대 토큰 (기본 400)")
    parser.add_argument(
        "--overlap",
        type=int,
        default=15,
        help="fixed는 percentage(%%), hierarchical은 tokens로 해석",
    )
    parser.add_argument("--skip-ingestion", action="store_true", help="설정만 바꾸고 재수집 트리거 안 함")
    parser.add_argument("--dry-run", action="store_true", help="실제 호출 없이 변경 내역만 출력")
    args = parser.parse_args()

    load_env()
    region = os.getenv("AWS_REGION", "").strip() or "ap-northeast-2"
    knowledge_base_id = get_required("KNOWLEDGE_BASE_ID")
    data_source_id = get_required("DATA_SOURCE_ID")

    session = boto3.Session(region_name=region)
    client = session.client("bedrock-agent")

    print(f"📡 KB={knowledge_base_id} DS={data_source_id} region={region}")
    current = client.get_data_source(
        knowledgeBaseId=knowledge_base_id,
        dataSourceId=data_source_id,
    )["dataSource"]

    existing_vector_config = current.get("vectorIngestionConfiguration", {}) or {}
    existing_chunking = existing_vector_config.get("chunkingConfiguration", {})
    print("➡️  기존 chunkingConfiguration:")
    print(json.dumps(existing_chunking, ensure_ascii=False, indent=2))

    new_chunking = build_chunking_config(args.strategy, args.max_tokens, args.overlap)
    new_vector_config = dict(existing_vector_config)
    new_vector_config["chunkingConfiguration"] = new_chunking

    print("\n✅ 새 chunkingConfiguration:")
    print(json.dumps(new_chunking, ensure_ascii=False, indent=2))

    if args.dry_run:
        print("\n(dry-run) 변경하지 않고 종료합니다.")
        return

    update_kwargs = {
        "knowledgeBaseId": knowledge_base_id,
        "dataSourceId": data_source_id,
        "name": current["name"],
        "dataSourceConfiguration": current["dataSourceConfiguration"],
        "vectorIngestionConfiguration": new_vector_config,
    }
    if "description" in current:
        update_kwargs["description"] = current["description"]
    if "dataDeletionPolicy" in current:
        update_kwargs["dataDeletionPolicy"] = current["dataDeletionPolicy"]
    if "serverSideEncryptionConfiguration" in current:
        update_kwargs["serverSideEncryptionConfiguration"] = current["serverSideEncryptionConfiguration"]

    print("\n🚧 update_data_source 호출 중...")
    client.update_data_source(**update_kwargs)
    print("   완료.")

    if args.skip_ingestion:
        print("⏭️  --skip-ingestion 옵션이라 재수집 호출은 생략합니다.")
        print("   콘솔의 [Sync] 또는 start_ingestion_job 으로 직접 트리거하세요.")
        return

    print("\n🔄 start_ingestion_job 호출 중... (전체 문서 재임베딩)")
    ingestion = client.start_ingestion_job(
        knowledgeBaseId=knowledge_base_id,
        dataSourceId=data_source_id,
        description=f"chunking={args.strategy} maxTokens={args.max_tokens}",
    )
    job = ingestion["ingestionJob"]
    print(f"   jobId={job['ingestionJobId']} status={job['status']}")
    print("   상태는 Bedrock 콘솔이나 list_ingestion_jobs API로 확인하세요.")


if __name__ == "__main__":
    main()
