#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT=43147
LOCAL_URL="http://127.0.0.1:${PORT}"
DATA_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/sim-flight-testing"
BIN="${DATA_DIR}/cloudflared"
TMUX_CONF="/exec-daemon/tmux.portal.conf"
SESSION="sim-flight-tunnel"
LIVE_FILE="$ROOT/docs/live-url.txt"
INDEX_FILE="$ROOT/docs/index.html"
LOG="$DATA_DIR/public-link.log"

mkdir -p "$DATA_DIR"

log() {
  printf '%s %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*" | tee -a "$LOG"
}

tmux_cmd() {
  if [[ -f "$TMUX_CONF" ]]; then
    tmux -f "$TMUX_CONF" "$@"
  else
    tmux "$@"
  fi
}

ensure_app() {
  curl -sf -o /dev/null "$LOCAL_URL" && return 0
  bash "$ROOT/scripts/ensure-sim-flight-testing.sh"
}

ensure_cloudflared() {
  if [[ -x /tmp/cloudflared ]]; then
    BIN=/tmp/cloudflared
    return 0
  fi
  if [[ -x "$BIN" ]]; then
    return 0
  fi
  curl -fsSL -o "$BIN" https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
  chmod +x "$BIN"
}

current_live() {
  if [[ -f "$LIVE_FILE" ]]; then
    tr -d '[:space:]' <"$LIVE_FILE"
  fi
}

tunnel_url_from_logs() {
  tmux_cmd capture-pane -t "$SESSION" -p -S -200 2>/dev/null \
    | grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' \
    | tail -1 || true
}

url_ok() {
  local url="$1"
  [[ -n "$url" ]] || return 1
  curl -sf -o /dev/null --max-time 20 "${url%/}/"
}

start_tunnel() {
  tmux_cmd has-session -t "=$SESSION" 2>/dev/null && tmux_cmd kill-session -t "$SESSION" || true
  tmux_cmd new-session -d -s "$SESSION" -c "$ROOT" -- "$BIN" tunnel --url "$LOCAL_URL" --no-autoupdate
  local url=""
  for _ in $(seq 1 30); do
    sleep 1
    url="$(tunnel_url_from_logs)"
    if [[ -n "$url" ]] && url_ok "$url"; then
      printf '%s\n' "$url"
      return 0
    fi
  done
  return 1
}

write_redirect() {
  local url="$1"
  local href="${url%/}/"
  cat >"$INDEX_FILE" <<EOF
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>SIM Flight Testing</title>
    <meta http-equiv="refresh" content="0; url=${href}" />
    <link rel="canonical" href="${href}" />
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        font-family: Georgia, "Times New Roman", serif;
        background: #0f1419;
        color: #e8eef4;
      }
      main { max-width: 36rem; padding: 2rem; text-align: center; }
      a { color: #8ec8ff; }
    </style>
  </head>
  <body>
    <main>
      <p>Opening SIM Flight Testing…</p>
      <p><a id="open" href="${href}">Open the checklist</a></p>
    </main>
    <script>window.location.replace("${href}");</script>
  </body>
</html>
EOF
  printf '%s\n' "$url" >"$LIVE_FILE"
}

publish_redirect() {
  local url="$1"
  write_redirect "$url"
  if ! git -C "$ROOT" diff --quiet -- "$INDEX_FILE" "$LIVE_FILE"; then
    git -C "$ROOT" add "$INDEX_FILE" "$LIVE_FILE"
    git -C "$ROOT" commit -m "Keep the public app link pointed at the live checklist"
    git -C "$ROOT" push github main || git -C "$ROOT" push origin main || true
    git -C "$ROOT" push origin main || true
    log "Published public redirect to $url"
  fi
}

ensure_app
ensure_cloudflared

live="$(current_live)"
if ! url_ok "$live"; then
  log "Live URL is down. Opening a new tunnel."
  live="$(start_tunnel)"
  publish_redirect "$live"
else
  log "Live URL is healthy: $live"
fi

if [[ "${1:-}" == "--once" ]]; then
  exit 0
fi

log "Keeping ${live} alive. Permanent entry is https://tectivejk.github.io/sim-testing-app/"
while true; do
  ensure_app || true
  if ! url_ok "$live"; then
    log "Tunnel expired. Replacing it and updating the permanent GitHub Pages link."
    if new_url="$(start_tunnel)"; then
      live="$new_url"
      publish_redirect "$live"
    else
      log "Could not start a replacement tunnel."
    fi
  else
    curl -sf -o /dev/null --max-time 15 "${live%/}/" || true
  fi
  sleep 45
done
