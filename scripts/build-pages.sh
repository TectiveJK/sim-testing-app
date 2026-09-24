#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

STASH="$ROOT/.pages-stash"
mkdir -p "$STASH"

restore_api() {
  if [[ -d "$STASH/api" ]]; then
    rm -rf "$ROOT/app/api"
    mv "$STASH/api" "$ROOT/app/api"
  fi
  rmdir "$STASH" 2>/dev/null || true
}

trap restore_api EXIT

if [[ -d "$ROOT/app/api" ]]; then
  rm -rf "$STASH/api"
  mv "$ROOT/app/api" "$STASH/api"
fi

export PAGES_BUILD=1
rm -rf "$ROOT/out" "$ROOT/.next"
npx next build

rm -rf "$ROOT/docs"
mkdir -p "$ROOT/docs"
cp -a "$ROOT/out/." "$ROOT/docs/"
touch "$ROOT/docs/.nojekyll"
printf 'https://tectivejk.github.io/sim-testing-app/\n' > "$ROOT/docs/live-url.txt"
