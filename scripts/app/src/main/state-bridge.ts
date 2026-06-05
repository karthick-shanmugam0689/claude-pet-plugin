// Two bridges between the outside world and the renderer:
//   - watchState: file -> renderer. The CLI writes CC events to STATE_FILE;
//     we forward each update over IPC as "pet:state".
//   - handleResize: renderer -> window. The renderer measures its content
//     after a collapse/expand and asks the window to fit, anchored to the
//     bottom-right corner so the pet doesn't jump when the panel folds.
import { BrowserWindow, ipcMain } from "electron";
import * as fs from "fs";
import { STATE_FILE, ensureRuntimeDir } from "./paths";

const WATCH_INTERVAL_MS = 300;
const MIN_DIM = 80;
// Mirror of the CLI's event allowlist — defense-in-depth so a locally-written
// state.json can't push an unexpected state string into the renderer.
const ALLOWED_STATES = new Set(["busy", "done", "waiting", "hello", "idle"]);

interface ResizePayload {
  w: number;
  h: number;
}

export function watchState(win: BrowserWindow): void {
  ensureRuntimeDir();

  function push(): void {
    if (!win || win.isDestroyed()) return;
    try {
      const data = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
      if (!data || !ALLOWED_STATES.has(data.state)) return; // ignore unknown/injected states
      win.webContents.send("pet:state", data);
    } catch {
      /* no state yet */
    }
  }

  fs.watchFile(STATE_FILE, { interval: WATCH_INTERVAL_MS }, push);
  win.webContents.on("did-finish-load", push);
}

export function handleResize(win: BrowserWindow): void {
  ipcMain.on("pet:resize", (_e, size: ResizePayload | undefined) => {
    if (!win || win.isDestroyed() || !size) return;
    const w = Math.max(MIN_DIM, Math.round(size.w));
    const h = Math.max(MIN_DIM, Math.round(size.h));
    const b = win.getBounds();
    const right = b.x + b.width;
    const bottom = b.y + b.height;
    const wasResizable = win.isResizable();
    if (!wasResizable) win.setResizable(true); // some macOS builds ignore setBounds otherwise
    win.setBounds({ width: w, height: h, x: right - w, y: bottom - h });
    if (!wasResizable) win.setResizable(false);
  });
}

// renderer -> window. The renderer implements custom dragging (so the pet can
// still receive clicks/hover) and sends incremental deltas as the cursor moves.
export function handleMove(win: BrowserWindow): void {
  ipcMain.on("pet:move", (_e, d: { dx: number; dy: number } | undefined) => {
    if (!win || win.isDestroyed() || !d) return;
    const [x, y] = win.getPosition();
    win.setPosition(Math.round(x + d.dx), Math.round(y + d.dy));
  });
}
