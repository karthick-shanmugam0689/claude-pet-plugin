// Runtime paths shared between the Electron main process and the CLI.
// These live under the OS tmpdir so they don't pollute the user's home.
import * as os from "os";
import * as path from "path";
import * as fs from "fs";

export const RUNTIME_DIR = path.join(os.tmpdir(), "claude-pet");
export const STATE_FILE = path.join(RUNTIME_DIR, "state.json"); // CC events: busy/done/waiting/hello
export const HOST_FILE = path.join(RUNTIME_DIR, "host.json"); // captured host app at session start
export const PID_FILE = path.join(RUNTIME_DIR, "pet.pid"); // running Electron process
export const SESSIONS_DIR = path.join(RUNTIME_DIR, "sessions"); // one marker file per live CC session (refcount)

export function ensureRuntimeDir(): void {
  // 0o700: keep the pid/host/state files owner-only so another local process
  // can't read or tamper with them. chmod too, in case the dir already existed
  // with looser default perms.
  fs.mkdirSync(RUNTIME_DIR, { recursive: true, mode: 0o700 });
  try {
    fs.chmodSync(RUNTIME_DIR, 0o700);
  } catch {
    /* best-effort */
  }
}
