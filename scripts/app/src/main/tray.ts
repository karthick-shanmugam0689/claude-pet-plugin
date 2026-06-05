// Menubar (Tray) control:
//   - icon = the current pet's emoji
//   - Hide / Show Pip (independent of the automatic focus-based hiding)
//   - Choose pet ▸ (radio list of skins)
//   - Quit Pip
import { app, Tray, Menu, nativeImage } from "electron";
import type { FocusWatcher } from "./focus-watcher";
import { PETS, getPet } from "./pets";

export interface TrayController {
  refresh(currentPetId: string): void;
}

export function createTray(
  focusWatcher: FocusWatcher,
  currentPetId: string,
  onChoosePet: (id: string) => void,
): TrayController | null {
  let tray: Tray;
  let currentId = currentPetId;
  try {
    tray = new Tray(nativeImage.createEmpty());
    tray.setToolTip("Claude Pet — click for options");
  } catch {
    // Tray unavailable (rare) — pet still works via focus + the CLI.
    return null;
  }

  function build(): void {
    tray.setTitle(getPet(currentId).emoji); // the menubar "icon"
    tray.setContextMenu(
      Menu.buildFromTemplate([
        {
          label: focusWatcher.isUserHidden() ? "Show Pip" : "Hide Pip",
          click: () => {
            focusWatcher.setUserHidden(!focusWatcher.isUserHidden());
            build();
          },
        },
        { type: "separator" },
        {
          label: "Choose pet",
          submenu: PETS.map((p) => ({
            label: `${p.emoji}  ${p.name}`,
            type: "radio" as const,
            checked: p.id === currentId,
            click: () => onChoosePet(p.id),
          })),
        },
        { type: "separator" },
        { label: "Quit Pip", click: () => app.quit() },
      ]),
    );
  }

  build();
  return {
    refresh(id: string): void {
      currentId = id;
      build();
    },
  };
}
