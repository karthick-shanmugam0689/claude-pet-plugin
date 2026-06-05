// Tracks the frontmost macOS app and toggles the pet's visibility so it only
// appears while the Claude Code host app (captured at session start) is in
// focus. Hiding is done in the renderer (visibility: hidden) — window-level
// hide() animates a fade and setPosition() off-screen gets clamped by macOS.
import { BrowserWindow } from "electron";
import * as fs from "fs";
import { execFile } from "child_process";
import { HOST_FILE } from "./paths";

const POLL_MS = 800;

export interface FocusWatcher {
  start(): void;
  setUserHidden(v: boolean): void;
  isUserHidden(): boolean;
}

function readHost(): string | null {
  try {
    return JSON.parse(fs.readFileSync(HOST_FILE, "utf8")).host as string;
  } catch {
    return null;
  }
}

// Name (LSDisplayName) of the frontmost macOS app, via Launch Services.
function getFrontmost(cb: (name: string | null) => void): void {
  execFile(
    "/bin/sh",
    ["-c", 'lsappinfo info -only name "$(lsappinfo front)"'],
    { timeout: 1500 },
    (err, stdout) => {
      if (err) return cb(null);
      const m = String(stdout).match(/"LSDisplayName"="([^"]+)"/);
      cb(m ? m[1] : null);
    }
  );
}

export function createFocusWatcher(win: BrowserWindow): FocusWatcher {
  let petVisible = false;
  let userHidden = false; // dismissed via the menubar tray

  function setVisible(v: boolean): void {
    if (!win || win.isDestroyed() || v === petVisible) return;
    petVisible = v;
    win.setIgnoreMouseEvents(!v);
    win.webContents.send("pet:visible", v);
  }

  function applyFocusVisibility(): void {
    getFrontmost((name) => {
      if (!win || win.isDestroyed() || !name) return;
      if (name === "Electron") return; // ignore the pet's own focus
      if (userHidden) {
        setVisible(false);
        return;
      }
      const host = readHost();
      setVisible(!host || name === host); // unknown host -> stay visible
    });
  }

  return {
    start(): void {
      win.webContents.once("did-finish-load", () => {
        win.setIgnoreMouseEvents(true);
        win.showInactive();
        petVisible = false;
        applyFocusVisibility();
      });
      setInterval(applyFocusVisibility, POLL_MS);
    },
    setUserHidden(v: boolean): void {
      userHidden = v;
      if (v) setVisible(false);
      else applyFocusVisibility();
    },
    isUserHidden: () => userHidden,
  };
}
