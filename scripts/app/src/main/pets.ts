// Pet registry + the persisted "which skin is active" choice. Lives in the main
// process because the tray menu, the menubar icon, and startup all read it.
// The renderer doesn't need this list — it just applies the skin it's told.
import { app } from "electron";
import * as fs from "fs";
import * as path from "path";

export interface PetDef {
  id: string; // matches the CSS theme class (body.theme-<id>) and skin file
  name: string; // default display name
  emoji: string; // shown as the menubar (tray) icon
}

export const PETS: PetDef[] = [
  { id: "bear", name: "Pip", emoji: "🐻" },
  { id: "cat", name: "Mochi", emoji: "🐱" },
  { id: "tiger", name: "Tora", emoji: "🐯" },
  { id: "mouse", name: "Squeak", emoji: "🐭" },
];

export function getPet(id: string): PetDef {
  return PETS.find((p) => p.id === id) ?? PETS[0];
}

// config.json lives in userData (persists across restarts), unlike the runtime
// files in tmp.
function configFile(): string {
  return path.join(app.getPath("userData"), "config.json");
}

function readConfig(): Record<string, unknown> {
  try {
    return JSON.parse(fs.readFileSync(configFile(), "utf8"));
  } catch {
    return {};
  }
}

export function getCurrentPetId(): string {
  const id = readConfig().petId;
  return typeof id === "string" && PETS.some((p) => p.id === id) ? id : PETS[0].id;
}

export function setCurrentPetId(id: string): void {
  try {
    const cfg = readConfig();
    cfg.petId = id;
    fs.writeFileSync(configFile(), JSON.stringify(cfg, null, 2));
  } catch {
    /* best-effort persistence */
  }
}
