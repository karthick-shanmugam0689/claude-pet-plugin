#!/usr/bin/env node
// CLI entry. Called by Claude Code hooks and by `node cli.js` at the repo
// root (via the thin shim). Commands:
//   start   - launch the pet (idempotent) and capture the host app
//   stop    - kill the running pet
//   event   - write a CC event (busy | done | waiting | hello) for the pet to react to
//   rehost  - re-capture the host app without restarting the pet
import * as fs from "fs";
import * as path from "path";
import { spawn, execSync, execFileSync } from "child_process";
import { STATE_FILE, HOST_FILE, PID_FILE, SESSIONS_DIR, ensureRuntimeDir } from "../main/paths";

// Project root (where package.json lives). Electron is launched against this
// directory and reads the "main" field to find dist/main/index.js.
// __dirname at runtime = dist/cli, so we go up two levels.
const APP_DIR = path.resolve(__dirname, "..", "..");

function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function readPid(): number | null {
  try {
    return parseInt(fs.readFileSync(PID_FILE, "utf8").trim(), 10);
  } catch {
    return null;
  }
}

function writeState(state: string, extras: Record<string, unknown> = {}): void {
  ensureRuntimeDir();
  fs.writeFileSync(STATE_FILE, JSON.stringify({ state, ...extras, ts: Date.now() }));
}

// --- "done" enrichment: session name + token usage, from the Stop hook ---
interface Usage {
  input_tokens?: number;
  output_tokens?: number;
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
}
interface TranscriptRecord {
  message?: { usage?: Usage };
  customTitle?: string;
  aiTitle?: string;
}
interface StopHook {
  transcript_path?: string;
  cwd?: string;
  session_id?: string;
}

// Friendly fall-back name when a session has no AI title yet. Use the git
// project (main repo) name rather than basename(cwd), so a git worktree shows
// the real project ("claude-pets") instead of its random worktree folder
// ("nostalgic-colden-5509ad"). execFileSync (no shell) keeps cwd injection-safe.
function projectName(cwd: string): string {
  try {
    const common = execFileSync("git", ["-C", cwd, "rev-parse", "--git-common-dir"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (common) {
      const gitDir = path.resolve(cwd, common); // .../claude-pets/.git
      return path.basename(path.dirname(gitDir)); // -> claude-pets
    }
  } catch {
    /* not a git repo, or git unavailable */
  }
  return path.basename(cwd);
}

// The hook pipes its JSON on stdin. Don't block an interactive (TTY) run.
function readStdin(): string {
  if (process.stdin.isTTY) return "";
  try {
    return fs.readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

// Best-effort: parse the Stop payload for the session title + latest token
// usage. The transcript schema is internal, so any failure yields no extras.
function deriveDoneExtras(): Record<string, number | string> {
  try {
    const hookRaw = readStdin();
    if (!hookRaw) return {};
    const hook = JSON.parse(hookRaw) as StopHook;
    const extras: Record<string, number | string> = {};
    let title: string | undefined;

    if (hook.transcript_path && fs.existsSync(hook.transcript_path)) {
      const text = fs.readFileSync(hook.transcript_path, "utf8");

      // Title: a custom-title / ai-title record is written once and can sit
      // anywhere in the file, so scan the whole transcript and keep the last
      // one. A cheap regex avoids JSON-parsing every (potentially huge) line.
      const re = /"(?:customTitle|aiTitle)"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(text)) !== null) {
        try {
          title = JSON.parse(`"${m[1]}"`);
        } catch {
          title = m[1];
        }
      }

      // Usage: the latest record is always at the very end, so only the tail
      // needs parsing.
      const tail = text.length > 262144 ? text.slice(text.length - 262144) : text;
      const lines = tail.split("\n").filter(Boolean);
      let usage: Usage | undefined;
      for (let i = lines.length - 1; i >= 0 && !usage; i--) {
        try {
          const rec = JSON.parse(lines[i]) as TranscriptRecord;
          if (rec.message?.usage) usage = rec.message.usage;
        } catch {
          /* skip non-JSON line */
        }
      }
      if (usage) {
        extras.contextTokens =
          (usage.input_tokens ?? 0) +
          (usage.cache_read_input_tokens ?? 0) +
          (usage.cache_creation_input_tokens ?? 0);
        extras.outputTokens = usage.output_tokens ?? 0;
      }
    }

    // Fall back to the git project name if the transcript had no AI title.
    title = title || (hook.cwd ? projectName(hook.cwd) : undefined);
    if (title) extras.title = title;
    // Carry the session id so the pet can key one bubble per parallel session.
    if (hook.session_id) extras.sessionId = hook.session_id;
    return extras;
  } catch {
    return {};
  }
}

// --- session refcount: keep the pet alive while ANY Claude Code session is
// open, and only close it when the last one ends. SessionStart/SessionEnd
// hooks pass the session id on stdin; each live session is a marker file. ---
function hookSessionId(): string | null {
  try {
    const raw = readStdin();
    if (!raw) return null;
    const j = JSON.parse(raw) as { session_id?: string };
    return j.session_id ?? null;
  } catch {
    return null;
  }
}

function sessionFile(id: string): string {
  // session ids are uuids, but sanitise to be safe as a filename
  return path.join(SESSIONS_DIR, id.replace(/[^A-Za-z0-9_-]/g, "_"));
}

function registerSession(id: string): void {
  try {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true, mode: 0o700 });
    fs.writeFileSync(sessionFile(id), "");
  } catch {
    /* best-effort */
  }
}

function unregisterSession(id: string): void {
  try {
    fs.unlinkSync(sessionFile(id));
  } catch {
    /* already gone */
  }
}

function liveSessionCount(): number {
  try {
    return fs.readdirSync(SESSIONS_DIR).length;
  } catch {
    return 0;
  }
}

// Apps the pet is allowed to treat as its Claude Code "host" — it only appears
// while one of these is frontmost. Browsers are deliberately excluded: macOS
// can't tell a claude.ai tab from any other tab. Pin it to your exact setup
// with the CLAUDE_PET_HOST env var (comma-separated), e.g. CLAUDE_PET_HOST="Claude".
const DEFAULT_ALLOWED_HOSTS = [
  "Claude", // Claude desktop app
  "Terminal",
  "iTerm2",
  "Ghostty",
  "WezTerm",
  "Warp",
  "kitty",
  "Alacritty",
  "Hyper",
  "Tabby",
  "Code", // VS Code
  "Code - Insiders",
  "Cursor",
  "Windsurf",
  "VSCodium",
];

function allowedHosts(): string[] {
  const override = process.env.CLAUDE_PET_HOST?.trim();
  if (override) return override.split(",").map((s) => s.trim()).filter(Boolean);
  return DEFAULT_ALLOWED_HOSTS;
}

function readHostName(): string | null {
  try {
    return JSON.parse(fs.readFileSync(HOST_FILE, "utf8")).host ?? null;
  } catch {
    return null;
  }
}

function frontmostApp(): string | null {
  try {
    const out = execSync('lsappinfo info -only name "$(lsappinfo front)"', {
      encoding: "utf8",
    });
    const m = out.match(/"LSDisplayName"="([^"]+)"/);
    return m ? m[1] : null;
  } catch {
    return null; // lsappinfo unavailable
  }
}

// Record the frontmost app as the Claude Code host, but only if it's an
// allowed host. Anything else — a browser, Finder, etc. — is ignored so the
// pet never latches onto the wrong window.
function captureHost(): void {
  ensureRuntimeDir();
  const name = frontmostApp();
  if (!name || !allowedHosts().includes(name)) return; // keep the previous host
  fs.writeFileSync(HOST_FILE, JSON.stringify({ host: name }));
}

function start(): void {
  ensureRuntimeDir();
  // Refcount this session so a later SessionEnd knows whether it's the last.
  const sid = hookSessionId();
  if (sid) registerSession(sid);
  // Capture the host only once. Re-capturing on every session start let a
  // session that began while another app (e.g. Chrome) was frontmost hijack
  // the host. Use `rehost` to deliberately re-bind to the focused app.
  if (!readHostName()) captureHost();
  const existing = readPid();
  if (existing && isAlive(existing)) return; // idempotent

  // The "electron" npm package's default export at runtime is the path to the
  // Electron binary. Cast through unknown so TS accepts the string.
  const electron = require("electron") as unknown as string;
  const child = spawn(electron, [APP_DIR], { detached: true, stdio: "ignore" });
  child.unref();
  if (child.pid !== undefined) fs.writeFileSync(PID_FILE, String(child.pid));
  writeState("hello");
}

function stop(): void {
  const pid = readPid();
  if (pid && isAlive(pid)) {
    try {
      process.kill(pid);
    } catch {
      /* already gone */
    }
  }
  try {
    fs.unlinkSync(PID_FILE);
  } catch {
    /* already gone */
  }
  // A hard stop resets the refcount so a stale marker can't keep a future
  // pet from ever closing.
  try {
    fs.rmSync(SESSIONS_DIR, { recursive: true, force: true });
  } catch {
    /* best-effort */
  }
}

// SessionEnd: drop this session and only shut the pet down if it was the last
// one. If we can't identify the session, err toward keeping the pet alive so
// switching between sessions never kills it.
function end(): void {
  const sid = hookSessionId();
  if (sid) unregisterSession(sid);
  if (sid && liveSessionCount() === 0) stop();
}

// Events the pet understands. The arg comes from hooks/commands, but validate
// it anyway so only known states are ever written to state.json.
const VALID_EVENTS = ["busy", "done", "waiting", "hello", "idle"] as const;

const cmd = process.argv[2];
if (cmd === "start") start();
else if (cmd === "stop") stop();
else if (cmd === "end") end();
else if (cmd === "event") {
  const ev = process.argv[3] ?? "idle";
  if (!(VALID_EVENTS as readonly string[]).includes(ev)) {
    console.error(`claude-pet: unknown event "${ev}" (expected: ${VALID_EVENTS.join(", ")})`);
    process.exit(1);
  }
  writeState(ev, ev === "done" ? deriveDoneExtras() : {});
}
else if (cmd === "rehost") captureHost();
else {
  console.error("usage: claude-pet start | stop | end | event <state> | rehost");
  process.exit(1);
}
