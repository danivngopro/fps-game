import type * as THREE from "three";

export interface WeaponConfig {
  name: string;
  damage: number;
  fireRate: number; // milliseconds between shots
  magazineSize: number;
  reloadTime: number;
  hipFireSpread: number;
  adsSpread: number;
  range: number; // max raycast distance
  adsFov: number;
  adsMouseSensitivityMultiplier: number;
  adsMoveSpeedMultiplier: number;
}

export type Vector3Tuple = [number, number, number];
export type EulerTuple = [number, number, number];
export type SurfaceType = "sand" | "stone" | "concrete" | "wood" | "metal" | "target";
export type ShootableObjectType = "target" | "bot" | "environment";

export interface MapBoxConfig {
  id: string;
  position: Vector3Tuple;
  size: Vector3Tuple;
  color: string;
  surfaceType: SurfaceType;
  rotation?: EulerTuple;
  walkable?: boolean;
  shootable?: boolean;
}

export interface MapRampConfig extends MapBoxConfig {
  rotation: EulerTuple;
}

export interface DecorativeObjectConfig {
  id: string;
  position: Vector3Tuple;
  surfaceType: SurfaceType;
  kind: "palm";
}

export interface MapBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface MapConfig {
  floors: MapBoxConfig[];
  walls: MapBoxConfig[];
  buildings: MapBoxConfig[];
  crates: MapBoxConfig[];
  ramps: MapRampConfig[];
  cover: MapBoxConfig[];
  decorations: DecorativeObjectConfig[];
  targetDummySpawns: Vector3Tuple[];
  playerSpawn: Vector3Tuple;
  outOfBoundsY: number;
  mapBounds: MapBounds;
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
  deaths: number;
  ammo: number;
  magazineSize: number;
  isReloading: boolean;
  isAiming: boolean;
  cameraMode: "firstPerson" | "thirdPerson";
  weaponCooldown: number;
  gameStarted: boolean;
  matchDuration: number;
  matchTimeRemaining: number;
  botCount: number;
}

export interface RaycastHit {
  point: Vector3Tuple;
  normal: Vector3Tuple;
  distance: number;
  objectType: ShootableObjectType;
  targetId?: string;
  botId?: string;
  materialType?: SurfaceType;
}

export interface ShootableObject {
  id: string;
  object: THREE.Object3D;
  objectType: ShootableObjectType;
  targetId?: string;
  botId?: string;
  surfaceType: SurfaceType;
}

export interface BulletImpactData {
  id: number;
  point: Vector3Tuple;
  normal: Vector3Tuple;
  surfaceType: SurfaceType;
}

export interface DebugSnapshot {
  speed: number;
  grounded: boolean;
  bunnyhopGraceActive: boolean;
  crouched: boolean;
  fps: number;
  position: Vector3Tuple;
  velocity: Vector3Tuple;
  botCount: number;
  health: number;
  cameraMode: "firstPerson" | "thirdPerson";
}

export interface BotConfig {
  id: string;
  spawn: Vector3Tuple;
  patrolWaypoints: Vector3Tuple[];
  maxHp: number;
  moveSpeed: number;
  respawnMs: number;
  scoreValue: number;
  detectionRange: number;
  fireRateMs: number;
  damage: number;
  accuracy: number;
}
