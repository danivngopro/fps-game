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

Current integrated humanoid character files:

```text
public/models/characters/player.glb
public/models/characters/bot.glb
```

Both were converted from `Animated Human by @Quaternius`, downloaded from OpenGameArt:

- Source: https://opengameart.org/content/animated-human-low-poly
- Author: Quaternius
- License: CC0 / public domain
- Original format: FBX/DAE/Blend/OBJ
- Integrated format: GLB converted with `fbx2gltf`
- Clips detected after conversion: `Human Armature|ArmatureAction.002`, `Human Armature|Death`, `Human Armature|Idle`, `Human Armature|Jump`, `Human Armature|Punch`, `Human Armature|Run`, `Human Armature|Walk`, `Human Armature|Working`
- Material note: the converted GLB currently contains a single white untextured skinned material, so the runtime applies role-based fallback materials for player and bot visuals.

## Recommended Free Animated Character Assets

### Primary recommendation: Quaternius Ultimate Platformer Pack

- Source: https://quaternius.itch.io/ultimate-platformer-pack
- License: CC0 / public domain.
- Attribution: not required by CC0, but crediting "Quaternius" is recommended.
- Format: includes glTF, FBX, OBJ, and Blend.
- Fit: low-poly/stylized, browser-suitable, matches this prototype better than realistic packs.
- Animations: listed as an animated character with 18 animations and animated enemies.
- Conversion: no conversion should be needed if using included glTF/GLB. If only `.gltf` plus external buffers/textures are provided, keep the sidecar files together under `public/models/...` or export a packed `.glb` from Blender.
- Recommended use:
  - `public/models/characters/player.glb`
  - `public/models/characters/bot.glb`
  - `public/models/props/palm.glb`

### Secondary recommendation: Quaternius Ultimate Animated Character Pack

- Source: https://quaternius.com/packs/ultimatedanimatedcharacter.html
- License: CC0 / public domain.
- Attribution: not required by CC0, but crediting "Quaternius" is recommended.
- Format: FBX, OBJ, Blend.
- Fit: low-poly/stylized humanoids.
- Animations: 50+ animated characters with many animations.
- Conversion: export selected character and animations from Blender to `.glb`.
- Recommended use when you want more humanoid variants than the platformer pack.

### Optional workflow: Mixamo-compatible animation retargeting

- Source: https://www.mixamo.com/
- License: Adobe Mixamo terms. Adobe states Mixamo is free and royalty-free for video games, but these are not CC0 assets.
- Attribution: not required by Adobe FAQ.
- Restrictions: do not redistribute raw Mixamo assets as a standalone asset pack. Use inside the game only.
- Use case: upload/rig a stylized humanoid, apply idle/walk/run/jump/crouch/aim/shoot/death clips, download FBX, then export combined GLB in Blender.
- Recommendation: use only if the Quaternius clips are insufficient.

## Animation Clip Naming

The runtime searches clip names case-insensitively using these keywords:

- idle: `idle`, `standing`, `stand`
- walk: `walk`, `walking`
- run: `run`, `running`
- jump: `jump`, `fall`, `falling`
- crouch: `crouch`, `crouching`, `crouchwalk`
- aim: `aim`, `rifle aim`, `gun aim`
- shoot: `shoot`, `fire`, `rifle fire`
- death: `death`, `die`, `dead`

If a matching clip is missing, the runtime falls back to idle or the first available clip.
