#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT=43147
URL="http://127.0.0.1:${PORT}"

open_app() {
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$URL" >/dev/null 2>&1 || true
  elif command -v gio >/dev/null 2>&1; then
    gio open "$URL" >/dev/null 2>&1 || true
  fi
}

if ! bash "$ROOT/scripts/ensure-sim-flight-testing.sh"; then
  DATA_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/sim-flight-testing"
  zenity --error --text="The SIM Flight Testing server did not start. See $DATA_DIR/server.log" 2>/dev/null \
    || notify-send "SIM Flight Testing" "Server did not start. See $DATA_DIR/server.log" 2>/dev/null \
    || echo "Server did not start. See $DATA_DIR/server.log" >&2
  exit 1
fi

open_app
