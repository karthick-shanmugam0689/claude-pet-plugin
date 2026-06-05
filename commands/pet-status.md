---
description: Show whether Pip is running, built, and where it lives
---

Report Pip's current state. Reads only the user-scope install under `~/.claude/`
and the runtime files under `$TMPDIR/claude-pet/`.

Use the Bash tool to run:

```bash
APP="${CLAUDE_PLUGIN_ROOT}/scripts/app"
if [ ! -d "$APP" ]; then
  echo "Not installed at ~/.claude/scripts/app — run /pet-setup (user-scope install)."
  exit 0
fi
echo "App dir: $APP"
[ -f "$APP/dist/cli/index.js" ] && echo "Build: ready" || echo "Build: NOT built — run /pet-setup"

PID=$(cat "${TMPDIR:-/tmp}/claude-pet/pet.pid" 2>/dev/null)
if [ -n "$PID" ] && kill -0 "$PID" 2>/dev/null; then
  echo "Running: yes (pid $PID)"
else
  echo "Running: no"
fi

HOST=$(cat "${TMPDIR:-/tmp}/claude-pet/host.json" 2>/dev/null)
[ -n "$HOST" ] && echo "Host app: $HOST"
```

Summarize the output for the user in one or two short lines.
