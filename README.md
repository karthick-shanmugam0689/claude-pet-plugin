# Claude Pet 🐻

A floating desktop companion — **Pip** — that lives alongside Claude Code. Pip
appears while Claude Code is focused, reacts to your session (thinking while
Claude works, celebrating when it finishes, nudging you when it needs input),
hides the moment you switch to another app, and is fun to poke at.

> **macOS only.** Self-contained — the pet ships *inside* the plugin, so there's
> nothing extra to clone. A one-time `/pet-setup` compiles it.

---

## Features

- **Floats** in the bottom-right corner while Claude Code is focused; **auto-hides**
  instantly when you switch to any other app.
- **Reacts to Claude Code** — thinking (💭) while it works, a celebratory bounce
  ("all done! ⭐") when a turn finishes, a nudge ("your turn 👀") when it needs you.
- **Reacts to you** — hover, click to pet, Feed / Play / Nap, plus idle
  micro-animations (glances, blinks, yawns…).
- **Multiple pets** — bear, cat, tiger, mouse — switch from the menubar; your
  choice persists.
- **Draggable**, with Tamagotchi-style stats (happiness, fullness, energy) that
  drift over time.

---

## Requirements

- **macOS** — focus detection uses `lsappinfo`.
- **Node.js 18+** and **npm** — for the one-time build.

---

## Install

```bash
marketplace install claude-pet --target claude-code --scope user
```

Then, in Claude Code:

```
/pet-setup
```

`/pet-setup` runs once (~30–60s): it fetches the Electron runtime and compiles
the app. Restart Claude Code (or open `/hooks`) so the hooks load — Pip then
launches every session. To see it immediately, run `/pet-restart`.

> **Install ≠ Pip appears.** Installing only stages the files; the lifecycle
> hooks stay silent until `/pet-setup` has built the app.

---

## Using Pip

### Menubar icon
Pip puts an icon in your macOS menubar (it's the current pet's emoji). Click it for:

- **Hide / Show** — dismiss or restore Pip (independent of the auto-hide).
- **Choose pet ▸** — Bear · Cat · Tiger · Mouse. Switches live; choice persists.
- **Quit** — fully close Pip.

### Direct interaction
- **Hover** → ears perk up. **Click** → Pip bounces (❤️) and the stats panel opens.
- **Feed / Play / Nap** buttons in the stats panel.
- **Drag** Pip anywhere to reposition it (a quick click still pets it).

### Slash commands

| Command | What it does |
|---|---|
| `/pet-setup` | Build the bundled app (run once after install, and again after an upgrade) |
| `/pet-status` | Show whether Pip is built, running, and which app it's tracking |
| `/pet-restart` | Stop and relaunch Pip |
| `/pet-celebrate` | Trigger Pip's "all done!" bounce on demand |
| `/pet-wave` | Make Pip wave hello |

---

## Configuration

Pip decides which window is "Claude Code" from the frontmost macOS app. By
default it recognizes the **Claude desktop app** plus common terminals and
editors (Terminal, iTerm2, Ghostty, WezTerm, Warp, VS Code, Cursor, …). To pin
it to a specific app, set `CLAUDE_PET_HOST` (comma-separated) in `~/.claude/settings.json`:

```json
{ "env": { "CLAUDE_PET_HOST": "Claude" } }
```

Browsers are never treated as the host (macOS can't tell a Claude tab from any
other tab).

---

## Updating

A plugin upgrade pulls new source; rebuild it with `/pet-setup`, then `/pet-restart`.

## Uninstall

```bash
marketplace uninstall claude-pet --target claude-code --scope user
rm -rf ~/.claude/scripts/app        # built app + node_modules
```

---

## How it works

Lifecycle **hooks** are shell commands, so they can't talk to the running app
directly. Instead the CLI writes events to a state file under
`$TMPDIR/claude-pet/`; the Electron main process watches that file and forwards
updates to the renderer over IPC, which drives Pip's animations. Hooks find the
bundled CLI via `${CLAUDE_PLUGIN_ROOT}/scripts/app/cli.js` (resolved to your
install dir at install time).

Each pet is a small CSS **skin** — a colour palette plus opt-in shared features
(e.g. whiskers) — so adding more is cheap.

| On disk after install | |
|---|---|
| Bundled app source | `~/.claude/scripts/app/` |
| Build output + deps (after `/pet-setup`) | `~/.claude/scripts/app/{dist,node_modules}/` |
| Runtime state (pid, host, events) | `$TMPDIR/claude-pet/` |

---

## Known limits

- **macOS only** for the focus-based hiding (Pip runs elsewhere but won't auto-hide).
- **Install at user scope** (`--scope user`); the slash commands only look under
  `~/.claude/` and never fall back to the working directory.
- Hooks/commands added mid-session aren't active until you open `/hooks` once or restart.
- Closing one Claude Code session closes Pip even if another is open (re-opens are
  idempotent — no duplicate pets).

---

## Roadmap

- **React to the *quality* of Claude's output** — go beyond busy/done/waiting:
  celebrate a clean run, look concerned on errors or failing tests, perk up when a
  PR is ready, etc.
- Persist stats across sessions.
- More pets + an in-app pet picker.
- An MCP server so Claude can interact with Pip directly (check on it, trigger reactions).
- Linux / Windows focus watchers.

---

## Maintainer

Karthick Shanmugam · karthick.shanmugam@sixt.com
