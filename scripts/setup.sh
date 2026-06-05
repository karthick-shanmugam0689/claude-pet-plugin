#!/usr/bin/env bash
# Builds the bundled Pip desktop app that ships inside this plugin.
#
# The app source is copied next to this script at install time (scripts/app).
# This step runs `npm install` + `npm run build` once to fetch Electron and
# compile the TypeScript — Electron's ~200MB platform-specific runtime can't be
# committed to the marketplace, so it's fetched here instead.
#
# Idempotent: safe to re-run after a plugin upgrade to rebuild.
#
# The app always builds in ./app next to this script (no env override, so a
# stray env var can't redirect the build to an attacker-controlled directory).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$SCRIPT_DIR/app"

for bin in node npm; do
  if ! command -v "$bin" >/dev/null 2>&1; then
    echo "ERROR: '$bin' is required but not on PATH." >&2
    exit 1
  fi
done

if [[ ! -d "$APP_DIR" ]]; then
  echo "ERROR: bundled app not found at $APP_DIR" >&2
  echo "The plugin may not have installed its scripts/app directory correctly." >&2
  exit 1
fi

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "WARNING: Pip's focus-hide feature only works on macOS. The pet will still" >&2
  echo "         launch elsewhere but won't auto-hide when you switch apps." >&2
fi

echo "→ Building Pip in $APP_DIR"
# Keep npm's audit on so any newly-disclosed advisories surface at setup time.
(cd "$APP_DIR" && npm install --no-fund && npm run build)

echo ""
echo "Pip is built. It will launch automatically on the next Claude Code session."
echo "To launch it right now without waiting, run:  /pet-restart"
