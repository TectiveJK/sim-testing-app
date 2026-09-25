#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STARTER="$ROOT/scripts/start-sim-flight-testing.sh"
ENSURE="$ROOT/scripts/ensure-sim-flight-testing.sh"
SERVER="$ROOT/scripts/sim-flight-testing-server.sh"
ICON_SRC="$ROOT/packaging/sim-flight-testing.png"
if [[ ! -f "$ICON_SRC" ]]; then
  ICON_SRC="$ROOT/packaging/sim-flight-testing.svg"
fi

APP_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/applications"
ICON_HOME="${XDG_DATA_HOME:-$HOME/.local/share}/icons"
AUTOSTART_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/autostart"
SYSTEMD_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
VISIBLE_NAME="SIM Flight Testing.desktop"
SHORT_NAME="sim-flight-testing.desktop"

chmod +x "$STARTER" "$ENSURE" "$SERVER" "$ROOT/scripts/install-desktop-icon.sh"

if [[ -f "$HOME/.config/user-dirs.dirs" ]]; then
  # shellcheck disable=SC1091
  . "$HOME/.config/user-dirs.dirs"
fi

desktop_dirs() {
  local seen=""
  local dir
  local candidates=(
    "${XDG_DESKTOP_DIR:-}"
    "$HOME/Desktop"
    "$HOME/Bureaublad"
    "$HOME/Bureau"
    "$HOME/Schreibtisch"
    "$HOME/Escritorio"
  )
  for dir in "${candidates[@]}"; do
    [[ -n "$dir" && -d "$dir" ]] || continue
    case " $seen " in
      *" $dir "*) continue ;;
    esac
    seen="$seen $dir"
    printf '%s\n' "$dir"
  done
  if [[ -z "$seen" ]]; then
    mkdir -p "$HOME/Desktop"
    printf '%s\n' "$HOME/Desktop"
  fi
}

trust_launcher() {
  local file="$1"
  [[ -f "$file" ]] || return 0
  chmod a+x "$file"
  if command -v gio >/dev/null 2>&1; then
    gio set "$file" metadata::trusted true 2>/dev/null || true
    gio set "$file" metadata::trusted yes 2>/dev/null || true
    gio set "$file" "metadata::trusted" true 2>/dev/null || true
  fi
  if command -v gvfs-set-attribute >/dev/null 2>&1; then
    gvfs-set-attribute "$file" -t string metadata::trusted true 2>/dev/null || true
  fi
}

write_launcher() {
  local target="$1"
  cat >"$target" <<EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=SIM Flight Testing
GenericName=Flight test checklist
Comment=Open the SIM Flight Testing checklist
Exec=xdg-open https://tectivejk.github.io/sim-testing-app/
Icon=$ICON_HOME/hicolor/256x256/apps/sim-flight-testing.png
Terminal=false
Categories=Utility;Education;
StartupNotify=true
Keywords=drone;SIM;SkyCommand;regression;flight;checklist;
EOF
  chmod a+x "$target"
}

write_autostart() {
  local target="$1"
  cat >"$target" <<EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=SIM Flight Testing
Comment=Keep the local flight-testing checklist running
Exec=/bin/bash "$ENSURE"
Icon=$ICON_HOME/hicolor/256x256/apps/sim-flight-testing.png
Terminal=false
X-GNOME-Autostart-enabled=true
Hidden=false
EOF
  chmod a+x "$target"
}

mkdir -p "$APP_DIR" "$AUTOSTART_DIR" "$SYSTEMD_DIR"
for size in 48 128 256 512; do
  mkdir -p "$ICON_HOME/hicolor/${size}x${size}/apps"
  cp -f "$ICON_SRC" "$ICON_HOME/hicolor/${size}x${size}/apps/sim-flight-testing.png"
done
cp -f "$ICON_SRC" "$ICON_HOME/sim-flight-testing.png"

write_launcher "$APP_DIR/$SHORT_NAME"
write_autostart "$AUTOSTART_DIR/$SHORT_NAME"

CREATED=()
while IFS= read -r dir; do
  mkdir -p "$dir"
  rm -f "$dir/$SHORT_NAME" "$dir/sim-flight-testing.desktop"
  write_launcher "$dir/$VISIBLE_NAME"
  cp -f "$ICON_SRC" "$dir/SIM Flight Testing.png"
  trust_launcher "$dir/$VISIBLE_NAME"
  CREATED+=("$dir/$VISIBLE_NAME")
done < <(desktop_dirs)

if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database "$APP_DIR" >/dev/null 2>&1 || true
fi
if command -v gtk-update-icon-cache >/dev/null 2>&1; then
  gtk-update-icon-cache -f "$ICON_HOME/hicolor" >/dev/null 2>&1 || true
fi

UNIT="$SYSTEMD_DIR/sim-flight-testing.service"
sed "s|APP_ROOT|$ROOT|g" "$ROOT/packaging/sim-flight-testing.service" >"$UNIT"
if command -v systemctl >/dev/null 2>&1 && systemctl --user daemon-reload 2>/dev/null; then
  systemctl --user enable --now sim-flight-testing.service 2>/dev/null || true
fi

if command -v crontab >/dev/null 2>&1; then
  current="$(crontab -l 2>/dev/null || true)"
  line="@reboot sleep 20 && /bin/bash \"$ENSURE\""
  if ! grep -F "$ENSURE" <<<"$current" >/dev/null 2>&1; then
    { printf '%s\n' "$current"; printf '%s\n' "$line"; } | crontab - 2>/dev/null || true
  fi
fi

bash "$ENSURE" || true
/bin/bash "$STARTER" >/dev/null 2>&1 || true

echo
echo "SIM Flight Testing is installed on this computer."
echo "Look on your Desktop or Bureaublad for the gold drone icon named:"
echo "  SIM Flight Testing"
if ((${#CREATED[@]})); then
  echo
  echo "Icon files:"
  printf '  %s\n' "${CREATED[@]}"
fi
echo
echo "Double-click it. If Ubuntu asks, choose Allow Launching."
echo "The icon opens https://tectivejk.github.io/sim-testing-app/"
echo "Do not open http://127.0.0.1:43147 — that address is only a local server."
