#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AI_RAG_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
LOG_DIR="${AI_RAG_DIR}/logs"

mkdir -p "${LOG_DIR}"
cd "${AI_RAG_DIR}"

PYTHON_BIN="${PYTHON_BIN:-/usr/bin/python3}"

"${PYTHON_BIN}" main.py easylaw s3 only_new >> "${LOG_DIR}/easylaw_cron.log" 2>&1
