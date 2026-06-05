---
description: Make Pip do a celebration bounce (the "all done!" reaction)
---

Trigger Pip's celebration — a happy bounce with a ⭐ and the "all done!" bubble.
Nice for finishing something off-cycle. Uses only the user-scope install under
`~/.claude/` (no working-directory fallback).

Use the Bash tool to run:

```bash
CLI="${CLAUDE_PLUGIN_ROOT}/scripts/app/cli.js"
if [ ! -f "$CLI" ]; then
  echo "Pip isn't set up yet — run /pet-setup."
  exit 1
fi
node "$CLI" event done && echo "Pip cheered."
```

Keep your reply to one short line.
