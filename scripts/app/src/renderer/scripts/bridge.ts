// Wires the renderer to window.petBridge (exposed by preload). Translates
// CC events into pet reactions, and toggles the hidden body class when the
// main process tells us focus changed.
import { state, clamp } from "./state.js";
import { say, spawnFloat, playOnce, render, resizeToContent, pushSessionBubble } from "./view.js";

function applyCc(ev: PetEvent): void {
  const s = ev.state;
  if (s === "busy") {
    state.working = true;
    say("on it…");
  } else if (s === "done") {
    state.working = false;
    state.happiness = clamp(state.happiness + 8);
    playOnce("bouncing");
    spawnFloat("⭐");
    say("all done!");
    pushSessionBubble(ev);
  } else if (s === "waiting") {
    state.working = false;
    playOnce("wiggle");
    say("your turn 👀");
  } else if (s === "hello") {
    say("Hi! Let's code 👋");
  }
  render();
}

// Apply a pet skin: swap the body theme class (CSS does the rest) and update
// the display name. render() only touches .pet, so the theme class is safe here.
function applySkin(skin: { id: string; name: string }): void {
  const body = document.body;
  for (const c of [...body.classList]) {
    if (c.startsWith("theme-")) body.classList.remove(c);
  }
  body.classList.add(`theme-${skin.id}`);
  state.name = skin.name;
  const nameEl = document.getElementById("name");
  if (nameEl) nameEl.textContent = skin.name;
  resizeToContent();
}

export function wireBridge(): void {
  if (!window.petBridge) return; // browser preview, not desktop

  document.body.classList.add("desktop");
  document.body.classList.add("pet-hidden"); // start hidden; revealed when host app is focused
  document.body.classList.add("collapsed"); // start compact: just the pet

  window.petBridge.onState((data: PetEvent) => applyCc(data));
  window.petBridge.onVisible((v: boolean) => document.body.classList.toggle("pet-hidden", !v));
  window.petBridge.onSkin(applySkin);

  resizeToContent();
}
