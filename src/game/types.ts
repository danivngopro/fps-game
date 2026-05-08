export interface WeaponConfig {
  name: string;
  damage: number;
  fireRate: number; // milliseconds between shots
  magazineSize: number;
  reserveAmmo: number;
  reloadTime: number;
  hipFireSpread: number;
  adsSpread: number;
  range: number; // max raycast distance
  adsFov: number;
  adsMouseSensitivityMultiplier: number;
  adsMoveSpeedMultiplier: number;
}

export type Vector3Tuple = [number, number, number];

export interface WallConfig {
  position: Vector3Tuple;
  size: Vector3Tuple;
}

export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  crouch: boolean;
  aim: boolean;
  reload: boolean;
  shoot: boolean;
  pointerLocked: boolean;
}

export interface TargetState {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  hp: number;
  maxHp: number;
  alive: boolean;
}

export interface GameState {
  score: number;
  kills: number;
  health: number;
  maxHealth: number;
  ammo: number;
  magazineSize: number;
  reserveAmmo: number;
  isReloading: boolean;
  isAiming: boolean;
  weaponCooldown: number;
  gameStarted: boolean;
}

export interface RaycastHit {
  point: [number, number, number];
  distance: number;
  targetId?: string;
}
