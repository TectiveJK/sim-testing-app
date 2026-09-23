#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT=43147
URL="http://127.0.0.1:${PORT}"
DATA_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/sim-flight-testing"
LOG="$DATA_DIR/server.log"
PID_FILE="$DATA_DIR/server.pid"

mkdir -p "$DATA_DIR"
cd "$ROOT"

load_node() {
  if command -v npm >/dev/null 2>&1; then
    return 0
  fi
  if [[ -s "$HOME/.nvm/nvm.sh" ]]; then
    # shellcheck disable=SC1091
    . "$HOME/.nvm/nvm.sh"
  elif [[ -s "$HOME/.local/share/fnm/fnm" ]]; then
    eval "$("$HOME/.local/share/fnm/fnm" env)"
  fi
  command -v npm >/dev/null 2>&1
}

server_up() {
  curl -sf -o /dev/null "$URL"
}

open_app() {
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$URL" >/dev/null 2>&1 || true
  elif command -v gio >/dev/null 2>&1; then
    gio open "$URL" >/dev/null 2>&1 || true
  fi
}

if ! load_node; then
  zenity --error --text="Node.js / npm was not found. Install Node.js 20+ and try again." 2>/dev/null \
    || notify-send "SIM Flight Testing" "Node.js / npm was not found. Install Node.js 20+ and try again." 2>/dev/null \
    || echo "Node.js / npm was not found. Install Node.js 20+ and try again." >&2
  exit 1
fi

if server_up; then
  open_app
  exit 0
fi

if [[ ! -d "$ROOT/node_modules" ]]; then
  npm install >>"$LOG" 2>&1
fi

nohup npm run dev >>"$LOG" 2>&1 &
echo $! >"$PID_FILE"

for _ in $(seq 1 80); do
  if server_up; then
    open_app
    exit 0
  fi
  sleep 0.25
done

zenity --error --text="The SIM Flight Testing server did not start. See $LOG" 2>/dev/null \
  || notify-send "SIM Flight Testing" "Server did not start. See $LOG" 2>/dev/null \
  || echo "Server did not start. See $LOG" >&2
exit 1
