import { create } from "zustand";
import type { GameState } from "./types";
import { defaultWeapon } from "./config/weapons";

interface GameStore extends GameState {
  // Actions
  showHitMarker: boolean;
  showMuzzleFlash: boolean;
  setShowHitMarker: (show: boolean) => void;
  setShowMuzzleFlash: (show: boolean) => void;
  addKill: () => void;
  addScore: (points: number) => void;
  damagePlayer: (amount: number) => void;
  healPlayer: (amount: number) => void;
  consumeAmmo: () => void;
  refillAmmo: () => void;
  setReloading: (isReloading: boolean) => void;
  setAiming: (isAiming: boolean) => void;
  setWeaponCooldown: (weaponCooldown: number) => void;
  completeReload: () => void;
  startGame: () => void;
  resetGame: () => void;
}

const initialState: GameState = {
  score: 0,
  kills: 0,
  health: 100,
  maxHealth: 100,
  ammo: defaultWeapon.magazineSize,
  magazineSize: defaultWeapon.magazineSize,
  reserveAmmo: defaultWeapon.reserveAmmo,
  isReloading: false,
  isAiming: false,
  weaponCooldown: 0,
  gameStarted: false,
};

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,
  showHitMarker: false,
  showMuzzleFlash: false,

  setShowHitMarker: (show: boolean) => set({ showHitMarker: show }),
  setShowMuzzleFlash: (show: boolean) => set({ showMuzzleFlash: show }),

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
      ammo: state.magazineSize,
    })),

  setReloading: (isReloading: boolean) => set({ isReloading }),

  setAiming: (isAiming: boolean) => set({ isAiming }),

  setWeaponCooldown: (weaponCooldown: number) => set({ weaponCooldown }),

  completeReload: () =>
    set((state) => {
      if (state.reserveAmmo <= 0 && defaultWeapon.reserveAmmo > 0) {
        return { isReloading: false };
      }

      const needed = state.magazineSize - state.ammo;
      const refillAmount =
        state.reserveAmmo > 0 ? Math.min(needed, state.reserveAmmo) : needed;

      return {
        ammo: state.ammo + refillAmount,
        reserveAmmo: Math.max(0, state.reserveAmmo - refillAmount),
        isReloading: false,
      };
    }),

  startGame: () => set({ gameStarted: true }),

  resetGame: () => set(initialState),
}));
