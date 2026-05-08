import type { WeaponConfig } from "../types";

export const defaultWeapon: WeaponConfig = {
  name: "Rifle",
  damage: 25,
  fireRate: 115,
  magazineSize: 30,
  reserveAmmo: 120,
  reloadTime: 1250,
  hipFireSpread: 0.012,
  adsSpread: 0.0025,
  range: 1000,
  adsFov: 58,
  adsMouseSensitivityMultiplier: 0.58,
  adsMoveSpeedMultiplier: 0.82,
};
