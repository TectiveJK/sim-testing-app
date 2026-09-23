#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT=43147
URL="http://127.0.0.1:${PORT}"
DATA_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/sim-flight-testing"
LOG="$DATA_DIR/server.log"
PID_FILE="$DATA_DIR/server.pid"
SERVER="$ROOT/scripts/sim-flight-testing-server.sh"

mkdir -p "$DATA_DIR"

server_up() {
  curl -sf -o /dev/null "$URL" || curl -sf -o /dev/null "http://localhost:${PORT}"
}

if server_up; then
  exit 0
fi

if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  for _ in $(seq 1 40); do
    server_up && exit 0
    sleep 0.5
  done
fi

if command -v systemctl >/dev/null 2>&1 && systemctl --user start sim-flight-testing.service 2>/dev/null; then
  for _ in $(seq 1 80); do
    server_up && exit 0
    sleep 0.5
  done
fi

nohup "$SERVER" >>"$LOG" 2>&1 &
echo $! >"$PID_FILE"

for _ in $(seq 1 120); do
  if server_up; then
    exit 0
  fi
  sleep 0.5
done

echo "SIM Flight Testing did not start. See $LOG" >&2
exit 1
