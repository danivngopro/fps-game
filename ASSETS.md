# Asset Guide

Put GLB/GLTF files under `public/models` so Vite serves them as static files:

```text
public/models/
  weapons/
    rifle.glb
  characters/
    player.glb
    bot.glb
  props/
    palm.glb
    crate.glb
```

Use paths like `/models/weapons/rifle.glb` in the visual model components or config.

Visual models are separate from gameplay collision. Keep gameplay colliders simple:

- Player collision remains a Rapier capsule.
- Bot collision remains a Rapier capsule.
- Map collision remains simple boxes/ramps.
- Prop models are visual only unless the existing primitive collider already covers them.

To replace models, edit `src/game/config/models.ts`:

```ts
export const modelPaths = {
  player: "/models/characters/player.glb",
  bot: "/models/characters/bot.glb",
  weapon: "/models/weapons/rifle.glb",
  props: {
    palm: "/models/props/palm.glb",
  },
};
```

If a model path is omitted or fails to load, the game uses primitive fallback geometry.
