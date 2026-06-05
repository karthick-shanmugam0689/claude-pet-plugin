// Background life loop: stats drift down while awake, recover while asleep.
// Drops Pip into auto-sleep when energy runs out, and wakes them up when
// they're fully rested.
import { state, clamp } from "./state.js";
import { say, spawnFloat, render } from "./view.js";

const TICK_MS = 1500;

export function startLife(): void {
  setInterval(() => {
    if (state.asleep) {
      state.energy = clamp(state.energy + 4);
      state.hunger = clamp(state.hunger - 0.6);
      if (state.energy >= 100) {
        state.asleep = false;
        say("All rested!");
      }
    } else {
      if (state.working && Math.random() < 0.3) spawnFloat("💭");
      state.hunger = clamp(state.hunger - 1.4);
      state.energy = clamp(state.energy - 0.8);
      state.happiness = clamp(state.happiness - 0.4);
      if (state.hunger < 25) state.happiness = clamp(state.happiness - 1.2);
      if (state.energy < 14) {
        state.asleep = true;
        say("So sleepy 😴");
      }
    }
    render();
  }, TICK_MS);
}
