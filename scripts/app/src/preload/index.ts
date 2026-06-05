// Bridges the renderer to the main process under a single safe surface.
// Renderer code uses window.petBridge — it has no direct Node access.
import { contextBridge, ipcRenderer } from "electron";

export interface PetEvent {
  state: string;
  ts: number;
}

export interface PetBridge {
  onState(cb: (data: PetEvent) => void): void;
  onVisible(cb: (visible: boolean) => void): void;
  resize(w: number, h: number): void;
  moveBy(dx: number, dy: number): void;
  onSkin(cb: (skin: { id: string; name: string }) => void): void;
}

const bridge: PetBridge = {
  onState: (cb) => ipcRenderer.on("pet:state", (_e, data: PetEvent) => cb(data)),
  onVisible: (cb) => ipcRenderer.on("pet:visible", (_e, v: boolean) => cb(v)),
  resize: (w, h) => ipcRenderer.send("pet:resize", { w, h }),
  moveBy: (dx, dy) => ipcRenderer.send("pet:move", { dx, dy }),
  onSkin: (cb) => ipcRenderer.on("pet:skin", (_e, skin) => cb(skin)),
};

contextBridge.exposeInMainWorld("petBridge", bridge);
