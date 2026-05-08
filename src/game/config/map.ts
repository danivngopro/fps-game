import type { MapBoxConfig, MapConfig, MapRampConfig } from "../types";

const sand = "#caa66a";
const sandstone = "#b98f55";
const shadedStone = "#8f6f45";
const plaster = "#d4b47b";
const wood = "#6b482f";
const metal = "#59616b";

const box = (
  id: string,
  position: [number, number, number],
  size: [number, number, number],
  color: string,
  surfaceType: MapBoxConfig["surfaceType"],
  walkable = false,
): MapBoxConfig => ({
  id,
  position,
  size,
  color,
  surfaceType,
  walkable,
  shootable: true,
});

const ramp = (
  id: string,
  position: [number, number, number],
  size: [number, number, number],
  rotation: [number, number, number],
): MapRampConfig => ({
  id,
  position,
  size,
  rotation,
  color: shadedStone,
  surfaceType: "stone",
  walkable: true,
  shootable: true,
});

export const mapConfig: MapConfig = {
  playerSpawn: [0, 3, 18],
  outOfBoundsY: -18,
  mapBounds: {
    minX: -62,
    maxX: 62,
    minZ: -62,
    maxZ: 62,
  },
  floors: [
    box("main-sand-floor", [0, -0.15, 0], [124, 0.3, 124], sand, "sand", true),
    box("central-stone-pad", [0, 0.02, 0], [30, 0.15, 24], "#a98552", "stone", true),
  ],
  walls: [
    box("north-boundary", [0, 3, -62], [126, 6, 2], sandstone, "stone"),
    box("south-boundary", [0, 3, 62], [126, 6, 2], sandstone, "stone"),
    box("west-boundary", [-62, 3, 0], [2, 6, 126], sandstone, "stone"),
    box("east-boundary", [62, 3, 0], [2, 6, 126], sandstone, "stone"),
    box("north-alley-wall", [-22, 2, -31], [28, 4, 2], plaster, "concrete"),
    box("market-wall", [27, 2, -16], [2, 4, 28], plaster, "concrete"),
    box("south-short-wall", [-28, 1.5, 24], [24, 3, 2], plaster, "concrete"),
    box("east-short-wall", [36, 1.5, 25], [2, 3, 22], plaster, "concrete"),
  ],
  buildings: [
    box("west-building", [-42, 3, -24], [18, 6, 22], plaster, "concrete"),
    box("west-roof", [-42, 6.25, -24], [20, 0.5, 24], shadedStone, "stone", true),
    box("east-building", [42, 4, -30], [20, 8, 18], plaster, "concrete"),
    box("east-roof", [42, 8.25, -30], [22, 0.5, 20], shadedStone, "stone", true),
    box("south-building", [24, 3, 42], [28, 6, 16], plaster, "concrete"),
    box("south-roof", [24, 6.25, 42], [30, 0.5, 18], shadedStone, "stone", true),
    box("small-shop", [-36, 2.5, 34], [16, 5, 15], plaster, "concrete"),
    box("small-shop-roof", [-36, 5.25, 34], [18, 0.5, 17], shadedStone, "stone", true),
  ],
  crates: [
    box("crate-a", [-10, 0.75, 6], [3, 1.5, 3], wood, "wood", true),
    box("crate-b", [-6, 1.25, 8], [2.5, 2.5, 2.5], wood, "wood", true),
    box("crate-c", [15, 0.75, -8], [5, 1.5, 3], wood, "wood", true),
    box("crate-d", [6, 0.7, 26], [5, 1.4, 2.5], wood, "wood", true),
    box("metal-cover", [0, 0.65, -16], [7, 1.3, 1.5], metal, "metal", true),
    box("low-crouch-cover", [-17, 0.55, -4], [9, 1.1, 2], wood, "wood", true),
    box("crouch-tunnel-roof", [-13, 2.15, 15], [9, 0.3, 7], wood, "wood"),
    box("crouch-tunnel-left", [-17.35, 0.85, 15], [0.3, 1.7, 7], wood, "wood"),
    box("crouch-tunnel-right", [-8.65, 0.85, 15], [0.3, 1.7, 7], wood, "wood"),
  ],
  cover: [
    box("courtyard-cover-north", [0, 0.65, -9], [12, 1.3, 2], sandstone, "stone", true),
    box("courtyard-cover-south", [10, 0.65, 10], [2, 1.3, 10], sandstone, "stone", true),
    box("alley-cover", [-44, 0.6, 7], [8, 1.2, 2], sandstone, "stone", true),
    box("roof-crouch-wall", [24, 7.05, 35], [18, 1.1, 1.5], sandstone, "stone", true),
  ],
  ramps: [
    ramp("west-roof-ramp", [-31, 2.9, -13], [5, 0.6, 18], [-0.42, 0, 0]),
    ramp("east-roof-ramp", [32, 3.9, -18], [5, 0.6, 20], [-0.48, 0, 0]),
    ramp("south-roof-ramp", [12, 2.9, 34], [5, 0.6, 18], [0.42, 0, 0]),
  ],
  decorations: [
    { id: "palm-nw", kind: "palm", position: [-50, 0, 17], surfaceType: "wood" },
    { id: "palm-se", kind: "palm", position: [50, 0, 18], surfaceType: "wood" },
    { id: "palm-court", kind: "palm", position: [20, 0, 4], surfaceType: "wood" },
  ],
  targetDummySpawns: [
    [0, 2.1, -22],
    [-36, 7.2, -24],
    [39, 9.2, -30],
    [23, 7.2, 41],
    [-41, 2.1, 8],
    [36, 2.1, 18],
  ],
};
