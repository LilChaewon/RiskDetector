#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOADER_ENV_PATH="${ROOT_DIR}/backend_ai/lambdas/analysis_result_loader/.env"

if [[ ! -f "${LOADER_ENV_PATH}" ]]; then
  echo "Missing env file: ${LOADER_ENV_PATH}" >&2
  exit 1
fi

set -a
source "${LOADER_ENV_PATH}"
set +a

psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USERNAME}" -d "${DB_NAME}" <<'SQL'
CREATE SCHEMA IF NOT EXISTS prod;

CREATE TABLE IF NOT EXISTS prod.contracts (
    id VARCHAR(50) PRIMARY KEY,
    user_id BIGINT,
    title VARCHAR(500),
    contract_type VARCHAR(50),
    s3_key_prefix VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO prod.contracts (id, title, contract_type)
VALUES ('test-contract-001', '로컬 테스트 계약서', 'RENTAL')
ON CONFLICT (id) DO NOTHING;
SQL
