export const modelPaths = {
  player: "/models/characters/player.glb",
  bot: "/models/characters/bot.glb",
  weapon: undefined as string | undefined,
  props: {
    palm: undefined as string | undefined,
  },
};

export const modelTransforms = {
  player: {
    scale: 0.36,
    position: [0, -0.95, -0.05] as [number, number, number],
    rotation: [0, Math.PI, 0] as [number, number, number],
  },
  bot: {
    scale: 0.36,
    position: [0, -0.95, -0.05] as [number, number, number],
    rotation: [0, Math.PI, 0] as [number, number, number],
  },
};

export const quaterniusAnimatedHumanClipMap = {
  idle: ["Human Armature|Idle", "Idle"],
  walk: ["Human Armature|Walk", "Walk"],
  run: ["Human Armature|Run", "Run"],
  jump: ["Human Armature|Jump", "Jump"],
  crouch: ["Human Armature|Idle", "Idle"],
  aim: ["Human Armature|Idle", "Idle"],
  shoot: ["Human Armature|Punch", "Punch"],
  death: ["Human Armature|Death", "Death"],
};
