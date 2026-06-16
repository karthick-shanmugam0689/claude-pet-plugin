// Background life loop. The Tamagotchi stats (happiness/fullness/energy) still
// drift for the panel toy, but the pet's mood + sleep are activity-driven now
// (see state.ts): it naps after NAP_MS of Claude Code quiet and wakes on the
// next event (markActivity), not on an energy threshold.
import { state, clamp, NAP_MS } from "./state.js";
import { say, spawnFloat, render } from "./view.js";

const TICK_MS = 1500;

export function startLife(): void {
  setInterval(() => {
    if (state.asleep) {
      // recover energy while napping (panel only — waking is on activity)
      state.energy = clamp(state.energy + 4);
      state.hunger = clamp(state.hunger - 0.6);
    } else {
      if (state.working && Math.random() < 0.3) spawnFloat("💭");
      state.hunger = clamp(state.hunger - 1.4);
      state.energy = clamp(state.energy - 0.8);
      state.happiness = clamp(state.happiness - 0.4);
      if (state.hunger < 25) state.happiness = clamp(state.happiness - 1.2);
      // Nap after a long quiet spell — driven by session inactivity, not energy.
      if (Date.now() - state.lastActivityTs >= NAP_MS) {
        state.asleep = true;
        say("napping… 😴");
      }
    }
    render();
  }, TICK_MS);
}
