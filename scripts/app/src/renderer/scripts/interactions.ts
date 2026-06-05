// User-facing interactions: clicking the pet, the Feed / Play / Nap buttons,
// and the collapse/expand toggle for the stats panel. Each handler marks an
// interaction so reactions.ts pauses idle behavior while the user is engaged.
import { state, clamp } from "./state.js";
import { pet, say, spawnFloat, playOnce, render, resizeToContent } from "./view.js";
import { markInteraction } from "./reactions.js";

function expand(): void {
  if (!document.body.classList.contains("collapsed")) return;
  document.body.classList.remove("collapsed");
  resizeToContent();
}

function collapse(): void {
  document.body.classList.add("collapsed");
  resizeToContent();
}

function btn(id: string): HTMLButtonElement {
  const n = document.getElementById(id);
  if (!n) throw new Error(`Missing button: #${id}`);
  return n as HTMLButtonElement;
}

export function wireInteractions(): void {
  btn("collapse-btn").addEventListener("click", collapse);

  pet.addEventListener("click", () => {
    markInteraction();
    expand(); // clicking the pet reveals its stats
    if (state.asleep) {
      state.asleep = false;
      say("🥱 ...hi!");
      render();
      return;
    }
    state.happiness = clamp(state.happiness + 6);
    playOnce("bouncing");
    spawnFloat("❤️");
    const lines = ["Hehe!", "I like you!", "More pets!", "♪", "Boop!"];
    say(lines[Math.floor(Math.random() * lines.length)]);
    render();
  });

  btn("feed-btn").addEventListener("click", () => {
    markInteraction();
    if (state.asleep) {
      say("😴 too sleepy to eat");
      return;
    }
    state.hunger = clamp(state.hunger + 22);
    state.happiness = clamp(state.happiness + 3);
    pet.classList.add("eating");
    spawnFloat("🍎");
    say("Yum yum!");
    setTimeout(render, 700);
    render();
  });

  btn("play-btn").addEventListener("click", () => {
    markInteraction();
    if (state.asleep) {
      say("😴");
      return;
    }
    if (state.energy < 12) {
      say("Too tired to play...");
      return;
    }
    state.happiness = clamp(state.happiness + 10);
    state.energy = clamp(state.energy - 12);
    state.hunger = clamp(state.hunger - 5);
    playOnce("wiggle");
    spawnFloat("⭐");
    say("Wheee!");
    render();
  });

  btn("sleep-btn").addEventListener("click", () => {
    markInteraction();
    state.asleep = !state.asleep;
    say(state.asleep ? "Goodnight 😴" : "I'm awake!");
    render();
  });
}
