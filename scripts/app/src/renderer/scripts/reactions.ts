// Idle reaction layer. Runs low-frequency micro-reactions (glance, yawn,
// long blink, doze, hum, tummy rumble) only when no real interaction has
// happened recently — and never while Claude Code is working. Hover counts
// as interaction, so the pet stops idling while you're paying attention.
import { state } from "./state.js";
import { pet, say, spawnFloat } from "./view.js";

const IDLE_QUIET_MS = 3500; // suppress idle for this long after any interaction
const IDLE_MIN_MS = 3500; // earliest a new idle action fires
const IDLE_JITTER_MS = 4500; // additional random delay (up to ~8s between)

type IdleAction = "glance" | "blink-long" | "yawn" | "doze" | "hum" | "tummy";

let lastInteractionAt = Date.now();
export const markInteraction = (): void => {
  lastInteractionAt = Date.now();
};

function pickIdleAction(): void {
  if (state.asleep) {
    if (Math.random() < 0.25) spawnFloat("💤"); // very rare sleep-talk
    return;
  }
  if (state.working) return; // life loop already emits 💭 while working

  // Weighted pool: current stats bias the pet's mood.
  const pool: IdleAction[] = ["glance", "glance", "blink-long"];
  if (state.energy < 50) pool.push("yawn", "doze");
  if (state.happiness > 70) pool.push("hum");
  if (state.hunger < 40) pool.push("tummy");

  doIdle(pool[Math.floor(Math.random() * pool.length)]);
}

function doIdle(action: IdleAction): void {
  if (action === "glance") {
    const cls = Math.random() < 0.5 ? "glance-left" : "glance-right";
    pet.classList.add(cls);
    setTimeout(() => pet.classList.remove(cls), 700 + Math.random() * 500);
  } else if (action === "blink-long") {
    pet.classList.add("dozing");
    setTimeout(() => pet.classList.remove("dozing"), 380);
  } else if (action === "yawn") {
    pet.classList.add("yawning");
    setTimeout(() => pet.classList.remove("yawning"), 800);
  } else if (action === "doze") {
    pet.classList.add("dozing");
    setTimeout(() => pet.classList.remove("dozing"), 1600 + Math.random() * 800);
  } else if (action === "hum") {
    spawnFloat("♪");
  } else if (action === "tummy") {
    say("🍽️", 1200);
  }
}

function scheduleIdle(): void {
  setTimeout(() => {
    if (Date.now() - lastInteractionAt >= IDLE_QUIET_MS) pickIdleAction();
    scheduleIdle();
  }, IDLE_MIN_MS + Math.random() * IDLE_JITTER_MS);
}

export function startIdle(): void {
  pet.addEventListener("mouseenter", markInteraction);
  scheduleIdle();
}
