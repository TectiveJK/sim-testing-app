#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STARTER="$ROOT/scripts/start-sim-flight-testing.sh"
ENSURE="$ROOT/scripts/ensure-sim-flight-testing.sh"
SERVER="$ROOT/scripts/sim-flight-testing-server.sh"
ICON="$ROOT/packaging/sim-flight-testing.png"
if [[ ! -f "$ICON" ]]; then
  ICON="$ROOT/packaging/sim-flight-testing.svg"
fi
APP_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/applications"
ICON_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/icons/hicolor/256x256/apps"
AUTOSTART_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/autostart"
SYSTEMD_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
DESKTOP_DIR="${XDG_DESKTOP_DIR:-$HOME/Desktop}"
FILE_NAME="sim-flight-testing.desktop"

if [[ -f "$HOME/.config/user-dirs.dirs" ]]; then
  # shellcheck disable=SC1091
  . "$HOME/.config/user-dirs.dirs"
  if [[ -n "${XDG_DESKTOP_DIR:-}" ]]; then
    DESKTOP_DIR="$XDG_DESKTOP_DIR"
  fi
fi

chmod +x "$STARTER" "$ENSURE" "$SERVER" "$ROOT/scripts/install-desktop-icon.sh"

escape() {
  printf '%s' "$1" | sed 's/ /\\ /g'
}

write_launcher() {
  local target="$1"
  cat >"$target" <<EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=SIM Flight Testing
GenericName=Flight test lab
Comment=Flight testing and regression testing for SkyCommand / SIM and drone software
Exec=$(escape "$STARTER")
Icon=$ICON
Terminal=false
Categories=Utility;
StartupNotify=true
Keywords=drone;SIM;SkyCommand;regression;flight;
EOF
  chmod +x "$target"
}

write_autostart() {
  local target="$1"
  cat >"$target" <<EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=SIM Flight Testing
Comment=Keep the local flight-testing lab running
Exec=$(escape "$ENSURE")
Icon=$ICON
Terminal=false
X-GNOME-Autostart-enabled=true
Hidden=false
EOF
  chmod +x "$target"
}

mkdir -p "$APP_DIR" "$DESKTOP_DIR" "$ICON_DIR" "$AUTOSTART_DIR" "$SYSTEMD_DIR"
cp -f "$ICON" "$ICON_DIR/sim-flight-testing.png" 2>/dev/null || cp -f "$ICON" "$ICON_DIR/sim-flight-testing.svg"

APP_FILE="$APP_DIR/$FILE_NAME"
DESKTOP_FILE="$DESKTOP_DIR/$FILE_NAME"
AUTOSTART_FILE="$AUTOSTART_DIR/$FILE_NAME"

write_launcher "$APP_FILE"
write_launcher "$DESKTOP_FILE"
write_autostart "$AUTOSTART_FILE"

if command -v gio >/dev/null 2>&1; then
  gio set "$DESKTOP_FILE" metadata::trusted true 2>/dev/null || true
  gio set "$DESKTOP_FILE" "metadata::trusted" true 2>/dev/null || true
fi

if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database "$APP_DIR" >/dev/null 2>&1 || true
fi

UNIT="$SYSTEMD_DIR/sim-flight-testing.service"
sed "s|APP_ROOT|$ROOT|g" "$ROOT/packaging/sim-flight-testing.service" >"$UNIT"
if command -v systemctl >/dev/null 2>&1 && systemctl --user daemon-reload 2>/dev/null; then
  systemctl --user enable --now sim-flight-testing.service 2>/dev/null || true
fi

if command -v crontab >/dev/null 2>&1; then
  current="$(crontab -l 2>/dev/null || true)"
  line="@reboot sleep 20 && $(escape "$ENSURE")"
  if ! grep -F "$ENSURE" <<<"$current" >/dev/null 2>&1; then
    { printf '%s\n' "$current"; printf '%s\n' "$line"; } | crontab - 2>/dev/null || true
  fi
fi

bash "$ENSURE" || true

echo "SIM Flight Testing will stay running on this computer."
echo "  Desktop icon: $DESKTOP_FILE"
echo "  Starts at login: $AUTOSTART_FILE"
echo
echo "After this one-time setup, open http://127.0.0.1:43147 — no command needed."
echo "On Ubuntu, right-click the Desktop icon and choose Allow Launching if asked."
