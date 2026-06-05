---
description: Build Pip (the Claude Pet desktop app) so it can launch
---

The Pip app ships bundled inside this plugin as TypeScript source. This builds
it once (`npm install` + compile) — needed because Electron's runtime can't be
committed to the marketplace.

This plugin is meant to be installed at **user scope**
(`--target claude-code --scope user`), so its files live under `~/.claude/`.

Use the Bash tool to run exactly this (do not add a working-directory fallback —
that would let a crafted script in the current repo run):

```bash
SETUP="${CLAUDE_PLUGIN_ROOT}/scripts/setup.sh"
if [ ! -f "$SETUP" ]; then
  echo "Pip's setup script isn't at ~/.claude/scripts/setup.sh."
  echo "Install at user scope: marketplace install claude-pet --target claude-code --scope user"
  exit 1
fi
bash "$SETUP"
```

It takes ~30–60s (downloads Electron). After it finishes, tell the user:
- Pip is built and will appear automatically on the next Claude Code session
- They can run `/pet-restart` now to launch it without waiting
