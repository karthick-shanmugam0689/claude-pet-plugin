// Custom window dragging. We can't use `-webkit-app-region: drag` because the
// pet needs its own click/hover handlers, and app-region drag regions swallow
// those events. Instead we move the window over IPC and use a small movement
// threshold to tell a click (pet it) from a drag (move the window). Pointer
// capture keeps events flowing even if the cursor briefly outruns the window.

const DRAG_THRESHOLD = 4; // px of movement before a press becomes a drag

export function enableDrag(): void {
  const bridge = window.petBridge;
  if (!bridge) return; // browser preview, not the desktop app
  const moveBy = bridge.moveBy.bind(bridge);

  const root = document.documentElement;
  let startX = 0;
  let startY = 0;
  let pressed = false;
  let dragging = false;

  root.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return; // left button only
    pressed = true;
    dragging = false;
    startX = e.screenX;
    startY = e.screenY;
  });

  root.addEventListener("pointermove", (e) => {
    if (!pressed) return;
    const dx = e.screenX - startX;
    const dy = e.screenY - startY;
    if (!dragging) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return; // still a click, not a drag
      dragging = true;
      document.body.classList.add("dragging");
      try {
        root.setPointerCapture(e.pointerId);
      } catch {
        /* capture is best-effort */
      }
    }
    moveBy(dx, dy);
    startX = e.screenX;
    startY = e.screenY;
  });

  const end = (e: PointerEvent): void => {
    if (!pressed) return;
    pressed = false;
    document.body.classList.remove("dragging");
    try {
      root.releasePointerCapture(e.pointerId);
    } catch {
      /* nothing was captured */
    }
  };
  root.addEventListener("pointerup", end);
  root.addEventListener("pointercancel", end);

  // Swallow the click that fires right after a drag, so moving the window
  // doesn't also pet/feed/toggle. A plain click (no drag) passes through.
  document.addEventListener(
    "click",
    (e) => {
      if (dragging) {
        e.stopImmediatePropagation();
        e.preventDefault();
        dragging = false;
      }
    },
    true,
  );
}
