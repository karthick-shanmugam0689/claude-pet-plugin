// Pet model. `state` is the single source of truth; view.ts renders from it,
// life.ts mutates it on each tick, and interactions.ts / bridge.ts mutate it
// in response to user actions and Claude Code events.

export type Mood = "neutral" | "happy" | "excited" | "sad" | "sleeping" | "eating";

export interface PetState {
  name: string;
  happiness: number;
  hunger: number; // higher = more full
  energy: number;
  asleep: boolean;
  working: boolean; // true while a Claude Code turn is in flight
  mood: Mood;
}

export const state: PetState = {
  name: "Pip",
  happiness: 80,
  hunger: 70,
  energy: 90,
  asleep: false,
  working: false,
  mood: "neutral",
};

export const clamp = (n: number): number => Math.max(0, Math.min(100, n));

export function computeMood(): Mood {
  if (state.asleep) return "sleeping";
  if (state.hunger < 25) return "sad";
  if (state.happiness < 35) return "sad";
  if (state.happiness > 75) return "happy";
  return "neutral";
}
