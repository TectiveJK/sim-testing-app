#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STARTER="$ROOT/scripts/start-sim-flight-testing.sh"
ICON="$ROOT/packaging/sim-flight-testing.png"
if [[ ! -f "$ICON" ]]; then
  ICON="$ROOT/packaging/sim-flight-testing.svg"
fi
APP_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/applications"
ICON_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/icons/hicolor/256x256/apps"
DESKTOP_DIR="${XDG_DESKTOP_DIR:-$HOME/Desktop}"
FILE_NAME="sim-flight-testing.desktop"

if [[ -f "$HOME/.config/user-dirs.dirs" ]]; then
  # shellcheck disable=SC1091
  . "$HOME/.config/user-dirs.dirs"
  if [[ -n "${XDG_DESKTOP_DIR:-}" ]]; then
    DESKTOP_DIR="$XDG_DESKTOP_DIR"
  fi
fi

chmod +x "$STARTER" "$ROOT/scripts/install-desktop-icon.sh"

escape() {
  printf '%s' "$1" | sed 's/ /\\ /g'
}

write_entry() {
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

mkdir -p "$APP_DIR" "$DESKTOP_DIR" "$ICON_DIR"
cp -f "$ICON" "$ICON_DIR/sim-flight-testing.png" 2>/dev/null || cp -f "$ICON" "$ICON_DIR/sim-flight-testing.svg"

APP_FILE="$APP_DIR/$FILE_NAME"
DESKTOP_FILE="$DESKTOP_DIR/$FILE_NAME"

write_entry "$APP_FILE"
write_entry "$DESKTOP_FILE"

if command -v gio >/dev/null 2>&1; then
  gio set "$DESKTOP_FILE" metadata::trusted true 2>/dev/null || true
  gio set "$DESKTOP_FILE" "metadata::trusted" true 2>/dev/null || true
fi

if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database "$APP_DIR" >/dev/null 2>&1 || true
fi

echo "Desktop icon installed:"
echo "  $DESKTOP_FILE"
echo "  $APP_FILE"
echo
echo "On Ubuntu, right-click the icon on the Desktop and choose Allow Launching if asked."
echo "Double-click SIM Flight Testing to start the lab in your browser."
