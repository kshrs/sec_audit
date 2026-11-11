#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

if [ -f ".venv/bin/activate" ]; then
    source .venv/bin/activate
fi

echo "=================================================================="
echo "🛡️ Starting SecArch FastAPI Backend on http://localhost:8000"
echo "=================================================================="
exec uvicorn backend.app:app --host 0.0.0.0 --port 8000 --reload
