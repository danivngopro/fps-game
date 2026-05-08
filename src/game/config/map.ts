import type { WallConfig } from "../types";

export const mapConfig = {
  floorSize: 200,
  floorHeight: 0,
  walls: [
    // Center pillar
    { position: [0, 2, 0], size: [2, 4, 2] },
    // Back wall
    { position: [0, 2, -50], size: [60, 5, 2] },
    // Front wall
    { position: [0, 2, 50], size: [60, 5, 2] },
    // Left wall
    { position: [-50, 2, 0], size: [2, 5, 100] },
    // Right wall
    { position: [50, 2, 0], size: [2, 5, 100] },
    // Platform 1
    { position: [-30, 3, -30], size: [15, 1, 15] },
    // Platform 2
    { position: [30, 3, 30], size: [15, 1, 15] },
  ] satisfies WallConfig[],
  targetDummySpawns: [
    [0, 5, 0] as [number, number, number],
    [-25, 5, -25] as [number, number, number],
    [25, 5, 25] as [number, number, number],
  ],
};
