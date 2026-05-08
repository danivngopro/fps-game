import { create } from "zustand";
import type { DebugSnapshot, GameState } from "./types";
import { defaultWeapon } from "./config/weapons";

interface GameStore extends GameState {
  showHitMarker: boolean;
  showMuzzleFlash: boolean;
  damageFlash: boolean;
  debugVisible: boolean;
  debug: DebugSnapshot;
  setShowHitMarker: (show: boolean) => void;
  setShowMuzzleFlash: (show: boolean) => void;
  setDamageFlash: (show: boolean) => void;
  toggleDebug: () => void;
  setDebug: (debug: DebugSnapshot) => void;
  addKill: () => void;
  addDeath: () => void;
  addScore: (points: number) => void;
  damagePlayer: (amount: number) => void;
  healPlayer: (amount: number) => void;
  restorePlayer: () => void;
  consumeAmmo: () => void;
  refillAmmo: () => void;
  setReloading: (isReloading: boolean) => void;
  setAiming: (isAiming: boolean) => void;
  toggleCameraMode: () => void;
  setWeaponCooldown: (weaponCooldown: number) => void;
  completeReload: () => void;
  startGame: () => void;
  resetGame: () => void;
  resetMatch: () => void;
  tickMatch: (deltaSeconds: number) => void;
  setBotCount: (botCount: number) => void;
}

const initialState: GameState = {
  score: 0,
  kills: 0,
  deaths: 0,
  health: 100,
  maxHealth: 100,
  ammo: defaultWeapon.magazineSize,
  magazineSize: defaultWeapon.magazineSize,
  isReloading: false,
  isAiming: false,
  cameraMode: "firstPerson",
  weaponCooldown: 0,
  gameStarted: false,
  matchDuration: 180,
  matchTimeRemaining: 180,
  botCount: 0,
};

const initialDebug: DebugSnapshot = {
  speed: 0,
  grounded: false,
  bunnyhopGraceActive: false,
  crouched: false,
  fps: 0,
  position: [0, 0, 0],
  velocity: [0, 0, 0],
  botCount: 0,
  health: 100,
  cameraMode: "firstPerson",
};

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,
  showHitMarker: false,
  showMuzzleFlash: false,
  damageFlash: false,
  debugVisible: false,
  debug: initialDebug,

  setShowHitMarker: (show: boolean) => set({ showHitMarker: show }),
  setShowMuzzleFlash: (show: boolean) => set({ showMuzzleFlash: show }),
  setDamageFlash: (show: boolean) => set({ damageFlash: show }),
  toggleDebug: () => set((state) => ({ debugVisible: !state.debugVisible })),
  setDebug: (debug: DebugSnapshot) => set({ debug }),

  addKill: () => set((state) => ({ kills: state.kills + 1 })),
  addDeath: () => set((state) => ({ deaths: state.deaths + 1 })),

  addScore: (points: number) =>
    set((state) => ({ score: state.score + points })),

  damagePlayer: (amount: number) =>
    set((state) => ({
      health: Math.max(0, state.health - amount),
      damageFlash: true,
    })),

  healPlayer: (amount: number) =>
    set((state) => ({
      health: Math.min(state.maxHealth, state.health + amount),
    })),

  restorePlayer: () => set((state) => ({ health: state.maxHealth })),

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
      damageFlash: false,
      debug: initialDebug,
    }),

  resetMatch: () =>
    set({
      ...initialState,
      showHitMarker: false,
      showMuzzleFlash: false,
      damageFlash: false,
      debug: initialDebug,
    }),

  tickMatch: (deltaSeconds: number) =>
    set((state) => ({
      matchTimeRemaining: Math.max(0, state.matchTimeRemaining - deltaSeconds),
    })),

  setBotCount: (botCount: number) =>
    set((state) => ({
      botCount,
      debug: { ...state.debug, botCount },
    })),
}));
