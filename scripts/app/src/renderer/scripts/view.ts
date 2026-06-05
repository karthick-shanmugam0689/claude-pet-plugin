// DOM-facing helpers: cache element refs once, draw the current state, run
// one-shot animations, show speech bubbles, and resize the desktop window to
// hug the current content.
import { state, computeMood } from "./state.js";

// Small helper so the cast happens once per id (we know the markup ships
// every id this file references — null here means the HTML drifted).
function el<T extends HTMLElement = HTMLElement>(id: string): T {
  const n = document.getElementById(id);
  if (!n) throw new Error(`Missing element: #${id}`);
  return n as T;
}

export const pet = el("pet");
const speech = el("speech");
const sleepBtn = el<HTMLButtonElement>("sleep-btn");

const happinessBar = el("happiness-bar");
const hungerBar = el("hunger-bar");
const energyBar = el("energy-bar");
const happinessVal = el("happiness-val");
const hungerVal = el("hunger-val");
const energyVal = el("energy-val");
const bubbles = el("bubbles");

let speechTimer: number | undefined;
export function say(msg: string, ms = 2200): void {
  speech.textContent = msg;
  speech.classList.add("show");
  if (speechTimer !== undefined) clearTimeout(speechTimer);
  speechTimer = window.setTimeout(() => speech.classList.remove("show"), ms);
}

// Restart and run a class-driven keyframe animation once.
export function playOnce(cls: string): void {
  pet.classList.remove(cls);
  void pet.offsetWidth; // force reflow so the animation restarts
  pet.classList.add(cls);
  pet.addEventListener("animationend", () => pet.classList.remove(cls), { once: true });
}

// Float a small emoji up from the pet (hearts / stars / apples / 💭 / ♪).
export function spawnFloat(emoji: string): void {
  const node = document.createElement("div");
  node.className = "float";
  node.textContent = emoji;
  node.style.left = (40 + Math.random() * 70) + "px";
  node.style.top = (20 + Math.random() * 40) + "px";
  pet.appendChild(node);
  setTimeout(() => node.remove(), 1000);
}

export function render(): void {
  state.mood = computeMood();
  pet.className = "pet " + state.mood + (state.working && !state.asleep ? " thinking" : "");

  happinessBar.style.width = state.happiness + "%";
  hungerBar.style.width = state.hunger + "%";
  energyBar.style.width = state.energy + "%";
  happinessVal.textContent = Math.round(state.happiness) + "%";
  hungerVal.textContent = Math.round(state.hunger) + "%";
  energyVal.textContent = Math.round(state.energy) + "%";
  sleepBtn.textContent = state.asleep ? "Wake" : "Nap";
}

// Tell the host window to fit the renderer's content. No-op in browser mode.
export function resizeToContent(): void {
  if (!window.petBridge?.resize) return;
  const r = el("wrap").getBoundingClientRect();
  window.petBridge.resize(Math.ceil(r.width), Math.ceil(r.height));
}

function fmtTokens(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + "M";
  if (n >= 1e4) return Math.round(n / 1e3) + "k";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "k";
  return String(n);
}

// One dismissable bubble per Claude Code session, keyed by session id. A new
// "done" event for a session updates its existing bubble (no duplicates).
// Everything lives in this Map — nothing is written to disk.
const MAX_BUBBLES = 3; // show only the most recent N sessions
const sessionBubbles = new Map<string, HTMLElement>();

export function pushSessionBubble(ev: PetEvent): void {
  const id = ev.sessionId || "session";

  let card = sessionBubbles.get(id);
  if (!card) {
    card = document.createElement("div");
    card.className = "bubble";
    card.dataset.sessionId = id;

    const text = document.createElement("div");
    text.className = "bubble-text";

    const close = document.createElement("button");
    close.className = "bubble-x";
    close.textContent = "✕";
    close.title = "Dismiss";
    close.addEventListener("click", () => {
      const node = card;
      if (!node) return;
      sessionBubbles.delete(id);
      node.classList.add("removing"); // fade out, then remove + resize once
      let removed = false;
      const finish = (): void => {
        if (removed) return;
        removed = true;
        node.remove();
        resizeToContent();
      };
      node.addEventListener("transitionend", finish, { once: true });
      window.setTimeout(finish, 200); // fallback if transitionend doesn't fire
    });

    card.append(text, close);
    bubbles.prepend(card); // newest on top
    sessionBubbles.set(id, card);
  }

  const title = document.createElement("div");
  title.className = "bubble-title";
  title.textContent = `✅ ${ev.title || "session done"}`;

  const meta = document.createElement("div");
  meta.className = "bubble-meta";
  const parts: string[] = [];
  if (ev.contextTokens) parts.push(`${fmtTokens(ev.contextTokens)} ctx`);
  if (ev.outputTokens) parts.push(`${fmtTokens(ev.outputTokens)} out`);
  meta.textContent = parts.length ? `🪙 ${parts.join(" · ")}` : "";

  const text = card.querySelector(".bubble-text") as HTMLElement;
  text.replaceChildren(title, meta);

  // little pop each time it updates
  card.classList.remove("pop");
  void card.offsetWidth;
  card.classList.add("pop");

  // keep only the most recent N sessions; drop the oldest (bottom) ones
  while (bubbles.children.length > MAX_BUBBLES) {
    const oldest = bubbles.lastElementChild as HTMLElement | null;
    if (!oldest) break;
    const oldId = oldest.dataset.sessionId;
    oldest.remove();
    if (oldId) sessionBubbles.delete(oldId);
  }

  resizeToContent();
}
