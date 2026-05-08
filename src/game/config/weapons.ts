import type { WeaponConfig } from "../types";

export const defaultWeapon: WeaponConfig = {
  name: "Rifle",
  damage: 25,
  fireRate: 100, // 100ms = 10 shots per second
  maxAmmo: 120,
  range: 1000,
};
