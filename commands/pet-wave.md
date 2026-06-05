---
description: Make Pip wave hello
---

Send Pip a "hello" event — it'll perk up and say "Hi! Let's code 👋". Uses only
the user-scope install under `~/.claude/` (no working-directory fallback).

Use the Bash tool to run:

```bash
CLI="${CLAUDE_PLUGIN_ROOT}/scripts/app/cli.js"
if [ ! -f "$CLI" ]; then
  echo "Pip isn't set up yet — run /pet-setup."
  exit 1
fi
node "$CLI" event hello && echo "Pip waved."
```

Keep your reply to one short line.
