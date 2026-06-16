// Pet model. `state` is the single source of truth; view.ts renders from it,
// life.ts mutates it on each tick, and interactions.ts / bridge.ts mutate it
// in response to user actions and Claude Code events.

export type Mood = "neutral" | "happy" | "excited" | "bored" | "sad" | "sleeping" | "eating";

export interface PetState {
  name: string;
  happiness: number;
  hunger: number; // higher = more full
  energy: number;
  asleep: boolean;
  working: boolean; // true while a Claude Code turn is in flight
  lastActivityTs: number; // ms timestamp of the last Claude Code event
  mood: Mood;
}

export const state: PetState = {
  name: "Pip",
  happiness: 80,
  hunger: 70,
  energy: 90,
  asleep: false,
  working: false,
  lastActivityTs: Date.now(),
  mood: "neutral",
};

export const clamp = (n: number): number => Math.max(0, Math.min(100, n));

// Mood mirrors Claude Code activity (not the decay stats): excited while a turn
// is in flight, happy just after, settling to neutral, bored after a quiet
// spell, asleep after a long one. life.ts naps the pet at NAP_MS; markActivity
// (called on every CC event) freshens the timer and wakes it.
const HAPPY_MS = 45_000; // afterglow right after activity
const BORED_MS = 5 * 60_000; // quiet → bored
export const NAP_MS = 15 * 60_000; // long quiet → nap

export function markActivity(): void {
  state.lastActivityTs = Date.now();
  state.asleep = false;
}

export function computeMood(): Mood {
  if (state.asleep) return "sleeping";
  if (state.working) return "excited";
  const idle = Date.now() - state.lastActivityTs;
  if (idle < HAPPY_MS) return "happy";
  if (idle < BORED_MS) return "neutral";
  return "bored";
}
