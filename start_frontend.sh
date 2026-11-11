#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR/frontend"

echo "=================================================================="
echo "🛡️ Starting SecArch Next.js 15 Frontend on http://localhost:3000"
echo "=================================================================="
exec npm run dev
