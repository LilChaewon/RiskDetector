#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOADER_ENV_PATH="${ROOT_DIR}/backend_ai/lambdas/analysis_result_loader/.env"
COMPOSE_FILE="${ROOT_DIR}/backend_core/docker-compose.yml"

if [[ ! -f "${LOADER_ENV_PATH}" ]]; then
  echo "Missing env file: ${LOADER_ENV_PATH}" >&2
  exit 1
fi

set -a
source "${LOADER_ENV_PATH}"
set +a

export POSTGRES_DB="${DB_NAME:-riskdetector}"

docker compose -f "${COMPOSE_FILE}" up -d db
