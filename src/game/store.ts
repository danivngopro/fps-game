import { create } from "zustand";
import type { DebugSnapshot, GameState } from "./types";
import { defaultWeapon } from "./config/weapons";

interface GameStore extends GameState {
  showHitMarker: boolean;
  showMuzzleFlash: boolean;
  debugVisible: boolean;
  debug: DebugSnapshot;
  setShowHitMarker: (show: boolean) => void;
  setShowMuzzleFlash: (show: boolean) => void;
  toggleDebug: () => void;
  setDebug: (debug: DebugSnapshot) => void;
  addKill: () => void;
  addScore: (points: number) => void;
  damagePlayer: (amount: number) => void;
  healPlayer: (amount: number) => void;
  consumeAmmo: () => void;
  refillAmmo: () => void;
  setReloading: (isReloading: boolean) => void;
  setAiming: (isAiming: boolean) => void;
  toggleCameraMode: () => void;
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
  isReloading: false,
  isAiming: false,
  cameraMode: "firstPerson",
  weaponCooldown: 0,
  gameStarted: false,
};

const initialDebug: DebugSnapshot = {
  speed: 0,
  grounded: false,
  bunnyhopGraceActive: false,
  crouched: false,
  fps: 0,
  position: [0, 0, 0],
  velocity: [0, 0, 0],
};

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,
  showHitMarker: false,
  showMuzzleFlash: false,
  debugVisible: false,
  debug: initialDebug,

  setShowHitMarker: (show: boolean) => set({ showHitMarker: show }),
  setShowMuzzleFlash: (show: boolean) => set({ showMuzzleFlash: show }),
  toggleDebug: () => set((state) => ({ debugVisible: !state.debugVisible })),
  setDebug: (debug: DebugSnapshot) => set({ debug }),

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

  toggleCameraMode: () =>
    set((state) => ({
      cameraMode:
        state.cameraMode === "firstPerson" ? "thirdPerson" : "firstPerson",
    })),

  setWeaponCooldown: (weaponCooldown: number) => set({ weaponCooldown }),

  completeReload: () =>
    set((state) => ({
      ammo: state.magazineSize,
      isReloading: false,
    })),

  startGame: () => set({ gameStarted: true }),

  resetGame: () =>
    set({
      ...initialState,
      showHitMarker: false,
      showMuzzleFlash: false,
      debug: initialDebug,
    }),
}));
