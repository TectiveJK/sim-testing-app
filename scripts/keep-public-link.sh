#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT=43147
LOCAL_URL="http://127.0.0.1:${PORT}"

if ! curl -sf -o /dev/null "$LOCAL_URL"; then
  bash "$ROOT/scripts/ensure-sim-flight-testing.sh"
fi

printf '%s\n' "Open the checklist at https://tectivejk.github.io/sim-testing-app/"
printf '%s\n' "That GitHub Pages address is the app. It does not expire."
printf '%s\n' "A local copy is also at $LOCAL_URL after npm run setup."
