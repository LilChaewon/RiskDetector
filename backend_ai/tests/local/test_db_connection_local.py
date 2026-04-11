"""Local DB connectivity check for analysis_result_loader."""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import pg8000


ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from lambdas.analysis_result_loader.handler import get_required_env, load_env_file


def main() -> None:
    load_env_file(ROOT_DIR / "lambdas" / "analysis_result_loader" / ".env")

    sslmode = os.getenv("DB_SSLMODE", "disable").strip() or "disable"
    ssl_context = None
    if sslmode != "disable":
        import ssl

        ssl_context = ssl.create_default_context()

    conn = pg8000.connect(
        user=get_required_env("DB_USERNAME"),
        password=get_required_env("DB_PASSWORD"),
        host=get_required_env("DB_HOST"),
        port=int(get_required_env("DB_PORT")),
        database=get_required_env("DB_NAME"),
        ssl_context=ssl_context,
        timeout=10,
    )
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT current_database(), current_user, version()")
            row = cur.fetchone()

        print(
            json.dumps(
                {
                    "success": True,
                    "database": row[0],
                    "user": row[1],
                    "version": row[2],
                    "host": get_required_env("DB_HOST"),
                    "port": int(get_required_env("DB_PORT")),
                },
                ensure_ascii=False,
                indent=2,
            )
        )
    finally:
        conn.close()


if __name__ == "__main__":
    main()
