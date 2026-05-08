import { create } from "zustand";
import type { GameState } from "./types";
import { defaultWeapon } from "./config/weapons";

interface GameStore extends GameState {
  // Actions
  showHitMarker: boolean;
  setShowHitMarker: (show: boolean) => void;
  addKill: () => void;
  addScore: (points: number) => void;
  damagePlayer: (amount: number) => void;
  healPlayer: (amount: number) => void;
  consumeAmmo: () => void;
  refillAmmo: () => void;
  startGame: () => void;
  resetGame: () => void;
}

const initialState: GameState = {
  score: 0,
  kills: 0,
  health: 100,
  maxHealth: 100,
  ammo: defaultWeapon.maxAmmo,
  maxAmmo: defaultWeapon.maxAmmo,
  gameStarted: false,
};

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,
  showHitMarker: false,

  setShowHitMarker: (show: boolean) => set({ showHitMarker: show }),

  addKill: () => set((state) => ({ kills: state.kills + 1 })),

  addScore: (points: number) =>
    set((state) => ({ score: state.score + points })),

  damagePlayer: (amount: number) =>
    set((state) => ({
      health: Math.max(0, state.health - amount),
    })),

  healPlayer: (amount: number) =>
    set((state) => ({
      health: Math.min(state.maxHealth, state.health + amount),
    })),

  consumeAmmo: () =>
    set((state) => ({
      ammo: Math.max(0, state.ammo - 1),
    })),

  refillAmmo: () =>
    set((state) => ({
      ammo: state.maxAmmo,
    })),

  startGame: () => set({ gameStarted: true }),

  resetGame: () => set(initialState),
}));
