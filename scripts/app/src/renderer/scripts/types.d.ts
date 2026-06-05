// Ambient types for the renderer side of the IPC bridge that preload exposes
// at window.petBridge. Keeping these in a .d.ts (not an importable module)
// makes window.petBridge globally typed without a runtime dependency.

export {};

declare global {
  interface PetEvent {
    state: string;
    ts: number;
    sessionId?: string;
    title?: string;
    contextTokens?: number;
    outputTokens?: number;
  }

  interface PetBridge {
    onState(cb: (data: PetEvent) => void): void;
    onVisible(cb: (visible: boolean) => void): void;
    resize(w: number, h: number): void;
    moveBy(dx: number, dy: number): void;
    onSkin(cb: (skin: { id: string; name: string }) => void): void;
  }

  interface Window {
    petBridge?: PetBridge;
  }
}
