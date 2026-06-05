---
description: Bounce Pip — stop and relaunch the desktop pet
---

Restart the Pip desktop app (useful right after `/pet-setup`, or if it's stuck).
Only the user-scope install under `~/.claude/` is used — no working-directory
fallback, so a crafted script in the current repo can never run.

Use the Bash tool to run:

```bash
CLI="${CLAUDE_PLUGIN_ROOT}/scripts/app/cli.js"
if [ ! -f "$(dirname "$CLI")/dist/cli/index.js" ]; then
  echo "Pip isn't built yet — run /pet-setup first."
  exit 1
fi
node "$CLI" stop; sleep 1; node "$CLI" start
echo "Pip restarted."
```

Confirm to the user that Pip has been bounced (or that they need `/pet-setup`).
