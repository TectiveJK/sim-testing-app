#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT=43147
LOCAL_URL="http://127.0.0.1:${PORT}"
WEB_URL="https://tectivejk.github.io/sim-testing-app/"

open_url() {
  local url="$1"
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$url" >/dev/null 2>&1 || true
  elif command -v gio >/dev/null 2>&1; then
    gio open "$url" >/dev/null 2>&1 || true
  fi
}

# Always open the public checklist first so the tester never lands on a
# refused 127.0.0.1 page. Then try to start a local copy in the background.
open_url "$WEB_URL"

if [[ -x "$ROOT/scripts/ensure-sim-flight-testing.sh" ]]; then
  bash "$ROOT/scripts/ensure-sim-flight-testing.sh" >/dev/null 2>&1 || true
fi
