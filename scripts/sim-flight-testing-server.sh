#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${PORT:-43147}"
DATA_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/sim-flight-testing"
STAMP="$DATA_DIR/built-revision"

mkdir -p "$DATA_DIR"
cd "$ROOT"

if command -v npm >/dev/null 2>&1; then
  :
elif [[ -s "$HOME/.nvm/nvm.sh" ]]; then
  # shellcheck disable=SC1091
  . "$HOME/.nvm/nvm.sh"
elif [[ -s "$HOME/.local/share/fnm/fnm" ]]; then
  eval "$("$HOME/.local/share/fnm/fnm" env)"
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Node.js / npm was not found. Install Node.js 20+." >&2
  exit 1
fi

if [[ ! -d "$ROOT/node_modules" ]]; then
  npm install
fi

rev="$(git -C "$ROOT" rev-parse HEAD 2>/dev/null || echo unknown)"
if [[ ! -f "$ROOT/.next/BUILD_ID" || "$(cat "$STAMP" 2>/dev/null || true)" != "$rev" ]]; then
  npm run build
  echo "$rev" >"$STAMP"
fi

exec npx next start --hostname 0.0.0.0 --port "$PORT"
