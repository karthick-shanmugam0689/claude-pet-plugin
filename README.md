# Claude Pet 🐻

A floating desktop companion — **Pip** — that lives alongside Claude Code. Pip
appears while Claude Code is focused, reacts to your session (thinking while
Claude works, celebrating when it finishes, nudging you when it needs input),
shows a little **token-usage bubble** for each session when a turn ends, hides
the moment you switch to another app, and is fun to poke at.

> **macOS only.** Self-contained — the pet ships *inside* the plugin, so there's
> nothing extra to clone. A one-time `/claude-pet:pet-setup` compiles it.

---

## Screenshots

**Stats panel — feed, play, nap (happiness · fullness · energy)**

<img width="310" height="422" alt="Screenshot 2026-06-05 at 14 34 33" src="https://github.com/user-attachments/assets/b88e1be4-1336-4a58-8c4e-89aec9ec1bd7" />

**Pick your pet from the menubar**

<img width="279" height="177" alt="Screenshot 2026-06-05 at 14 34 57" src="https://github.com/user-attachments/assets/d874914a-5442-459e-8a4c-a70073d76100" />

**Per-session token bubbles + live reactions**

<img width="288" height="399" alt="Screenshot 2026-06-12 at 17 13 26" src="https://github.com/user-attachments/assets/e336a23d-de74-45f0-b4f8-8366d0c07881" />
<img width="1096" height="957" alt="Screenshot 2026-06-12 at 17 15 10" src="https://github.com/user-attachments/assets/b3ff5441-f275-43e5-8462-151c524a3b41" />

---

## Install

```text
/plugin marketplace add karthick-shanmugam0689/claude-pet-plugin
/plugin install claude-pet@claude-pets
/claude-pet:pet-setup
```

`/claude-pet:pet-setup` runs once (~30–60s): it fetches the Electron runtime and
compiles the bundled app. Restart Claude Code (or open `/hooks`) so the hooks
load — Pip then launches every session. To see it immediately, run
`/claude-pet:pet-restart`.

> **Install ≠ Pip appears.** Installing only stages the files; the lifecycle
> hooks stay silent until `/claude-pet:pet-setup` has built the app.

**Requirements:** macOS (focus detection uses `lsappinfo`) · Node.js 18+ and npm
(for the one-time build).

---

## Features

- **Floats** in the bottom-right corner while Claude Code is focused; **auto-hides**
  instantly when you switch to any other app.
- **Reacts to Claude Code** — thinking (💭) while it works, a celebratory bounce
  ("all done! ⭐") when a turn finishes, a nudge ("your turn 👀") when it needs you.
- **Per-session token bubbles** — when a turn finishes, Pip shows a small,
  dismissable card with that session's name + token usage (context · output).
  Cards stack (newest 3), one per session, and live only in memory.
- **Multi-session / switch-safe** — one Pip tracks all your open sessions and
  only closes when the **last** one ends, so switching between sessions never
  kills it.
- **Reacts to you** — hover, click to pet, Feed / Play / Nap, plus idle
  micro-animations (glances, blinks, yawns…).
- **Multiple pets** — bear, cat, tiger, mouse — switch from the menubar; your
  choice persists.
- **Draggable**, with Tamagotchi-style stats (happiness, fullness, energy).

---

## Using Pip

### Menubar icon
Pip puts an icon in your macOS menubar (the current pet's emoji). Click it for:

- **Hide / Show** — dismiss or restore Pip (independent of the auto-hide).
- **Choose pet ▸** — Bear · Cat · Tiger · Mouse. Switches live; choice persists.
- **Quit** — fully close Pip.

### Direct interaction
- **Hover** → ears perk up. **Click** → Pip bounces (❤️) and the stats panel opens.
- **Feed / Play / Nap** buttons in the stats panel.
- **Drag** Pip anywhere to reposition it (a quick click still pets it).
- **✕** on a token bubble dismisses it.

### Slash commands

| Command | What it does |
|---|---|
| `/claude-pet:pet-setup` | Build the bundled app (run once after install, and after an upgrade) |
| `/claude-pet:pet-status` | Show whether Pip is built, running, and which app it's tracking |
| `/claude-pet:pet-restart` | Stop and relaunch Pip |
| `/claude-pet:pet-celebrate` | Trigger Pip's "all done!" bounce on demand |
| `/claude-pet:pet-wave` | Make Pip wave hello |

---

## Configuration

Pip decides which window is "Claude Code" from the frontmost macOS app. By
default it recognizes the **Claude desktop app** plus common terminals and
editors (Terminal, iTerm2, Ghostty, WezTerm, Warp, VS Code, Cursor, …). To pin
it to a specific app, set `CLAUDE_PET_HOST` (comma-separated) in
`~/.claude/settings.json`:

```json
{ "env": { "CLAUDE_PET_HOST": "Claude" } }
```

Browsers are never treated as the host (macOS can't tell a Claude tab from any
other tab).

### Other environment variables

Also under `env` in `~/.claude/settings.json`:

- **`CLAUDE_PET_FIRST_PROMPT_TITLE=0`** — when a session has no AI/custom title
  yet, Pip labels the bubble with the session's **first prompt** (truncated).
  Set this to `0` (or `off` / `false`) to fall back to the **project name**
  instead, so no prompt text is shown in the widget. (Either way the data stays
  on-device — read locally, never transmitted.)
- **`CLAUDE_PET_CONTEXT_WINDOW=1000000`** — context-window size used for the
  fullness `%`. Defaults to an estimate (200k, bumped to 1M once a turn exceeds
  200k); set it to your model's real window for an exact percentage.

---

## Updating

```text
/plugin update claude-pet@claude-pets
/claude-pet:pet-setup        # rebuild after the upgrade
/claude-pet:pet-restart
```

## Uninstall

```text
/plugin uninstall claude-pet@claude-pets
```

---

## Security & privacy

Pip is built to be unobtrusive and auditable:

- **No network at runtime, no telemetry.** The app only renders local HTML in
  Electron — it makes no outbound requests. The single network access is the
  one-time `npm install` during `/claude-pet:pet-setup`, which fetches Electron +
  TypeScript from the npm registry (pinned via `package-lock.json`).
- **Reads, never transmits, your transcript.** When a turn finishes, the CLI
  reads the session transcript **locally** only to extract the session title and
  token counts shown in the bubble. Nothing is sent anywhere; the title/tokens
  live in memory and are not persisted.
- **Minimal, owner-only filesystem use.** Runtime files (pid, host, last event,
  per-session markers) live under `$TMPDIR/claude-pet/` at `0700` permissions.
  The plugin writes nowhere else outside its own directory.
- **Hardened inputs.** Hook events are checked against a fixed allowlist
  (`busy | done | waiting | hello | idle`); the session id is sanitised before
  use as a filename; the git project-name lookup uses `execFile` (no shell), so a
  working-directory path can't inject a command. The renderer runs under a strict
  Content-Security-Policy (`default-src 'self'`).
- **No bundled binaries.** Electron's runtime is fetched at setup, never
  committed to the repo.
- **Dependencies:** `electron` + `typescript` + `@types/node` only — `npm audit`
  reports **0 vulnerabilities**.

---

## How it works

Lifecycle **hooks** are shell commands, so they can't talk to the running app
directly. The CLI writes events to a state file under `$TMPDIR/claude-pet/`; the
Electron main process watches that file and forwards updates to the renderer
over IPC, which drives Pip's animations. Hooks find the bundled CLI via
`${CLAUDE_PLUGIN_ROOT}/scripts/app/cli.js`.

Session tracking and the token bubbles are kept in memory / temp files only —
nothing about your sessions is persisted. Each pet is a small CSS **skin** (a
colour palette plus opt-in shared features such as whiskers), so adding more is
cheap.

| On disk | |
|---|---|
| Bundled app source | `<plugin>/scripts/app/` |
| Build output + deps (after setup) | `<plugin>/scripts/app/{dist,node_modules}/` |
| Runtime state (pid, host, events, session markers) | `$TMPDIR/claude-pet/` |

---

## Known limits

- **macOS only** for the focus-based hiding (Pip runs elsewhere but won't auto-hide).
- If your Claude Code host is a **browser tab**, focus detection can't tell which
  tab is active — the desktop Claude app works exactly as expected.
- Hooks/commands added mid-session aren't active until you open `/hooks` once or restart.

---

## Roadmap

- **React to the *quality* of Claude's output** — beyond busy/done/waiting:
  celebrate a clean run, look concerned on errors or failing tests, perk up when
  a PR is ready.
- Replace the state-file IPC with a local socket (nothing at rest, no polling).
- Persist stats across sessions; more pets + an in-app picker; an MCP server so
  Claude can interact with Pip directly; Linux / Windows focus watchers.

---

## Maintainer

Karthick Shanmugam
