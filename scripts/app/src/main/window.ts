// Creates the frameless, transparent, always-on-top pet window.
// The window is shown immediately, but its body starts hidden (CSS) so it
// doesn't flash in the wrong place before the focus check decides.
import { BrowserWindow, screen } from "electron";
import * as path from "path";

const WIDTH = 320;
const HEIGHT = 440;
const MARGIN = 20;

export function createWindow(): BrowserWindow {
  const wa = screen.getPrimaryDisplay().workArea;

  const win = new BrowserWindow({
    width: WIDTH,
    height: HEIGHT,
    x: wa.x + wa.width - WIDTH - MARGIN,
    y: wa.y + wa.height - HEIGHT - MARGIN,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    show: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    fullscreenable: false,
    webPreferences: {
      preload: path.join(__dirname, "..", "preload", "index.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.setAlwaysOnTop(true, "floating");
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.loadFile(path.join(__dirname, "..", "renderer", "index.html"));
  return win;
}
