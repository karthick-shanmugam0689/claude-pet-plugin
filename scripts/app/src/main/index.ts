// Electron main-process entry. Wires the window, the state bridges, the focus
// watcher, the menubar tray, and the pet-skin selection together.
import { app, BrowserWindow } from "electron";
import * as fs from "fs";
import { createWindow } from "./window";
import { createFocusWatcher } from "./focus-watcher";
import { createTray } from "./tray";
import { watchState, handleResize, handleMove } from "./state-bridge";
import { getCurrentPetId, setCurrentPetId, getPet } from "./pets";
import { PID_FILE, ensureRuntimeDir } from "./paths";

// Tell the renderer which skin to wear (theme class + display name).
function sendSkin(win: BrowserWindow, id: string): void {
  if (win.isDestroyed()) return;
  const pet = getPet(id);
  win.webContents.send("pet:skin", { id: pet.id, name: pet.name });
}

// Only ever one Pip. The CLI checks the pid-file before spawning, but two
// near-simultaneous starts (e.g. two Claude Code sessions opening at once) can
// both pass that check and spawn. This lock is the race-proof backstop: the
// second instance fails to acquire it and quits before showing a window.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.whenReady().then(() => {
    app.setName("Claude Pet");
    if (process.platform === "darwin" && app.dock) app.dock.hide();

    // We own the single instance — record OUR pid as the running pet, so
    // `stop` always targets the live process and not a losing race-spawn.
    try {
      ensureRuntimeDir();
      fs.writeFileSync(PID_FILE, String(process.pid));
    } catch {
      /* best-effort */
    }

    const win = createWindow();
    watchState(win);
    handleResize(win);
    handleMove(win);

    const focus = createFocusWatcher(win);
    focus.start();

    let currentPet = getCurrentPetId();
    const tray = createTray(focus, currentPet, (id) => {
      currentPet = id;
      setCurrentPetId(id); // persist the choice
      sendSkin(win, id); // restyle the live pet
      tray?.refresh(id); // update the menubar icon + checkmark
    });

    // Apply the saved skin once the renderer is ready.
    win.webContents.on("did-finish-load", () => sendSkin(win, currentPet));
  });

  app.on("window-all-closed", () => app.quit());
}
