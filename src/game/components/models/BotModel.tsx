import { useCallback } from "react";
import * as THREE from "three";
import {
  AnimatedCharacterModel,
  type CharacterAnimationState,
} from "./AnimatedCharacterModel";
import {
  modelTransforms,
  quaterniusAnimatedHumanClipMap,
} from "../../config/models";

interface BotModelProps {
  src?: string;
  botId: string;
  animationState: CharacterAnimationState;
}

function applyBotUserData(root: THREE.Object3D, botId: string) {
  root.traverse((object) => {
    object.userData = {
      ...object.userData,
      shootable: true,
      objectType: "bot",
      botId,
      surfaceType: "target",
    };
  });
}

function BotFallback({ botId }: { botId: string }) {
  const userData = {
    shootable: true,
    objectType: "bot",
    botId,
    surfaceType: "target",
  };

  return (
    <>
      <mesh position={[0, 0.2, 0]} castShadow userData={userData}>
        <capsuleGeometry args={[0.45, 1.1, 6, 10]} />
        <meshStandardMaterial color="#4b5f72" roughness={0.82} />
      </mesh>
      <mesh position={[0, 1.1, 0]} castShadow userData={userData}>
        <boxGeometry args={[0.7, 0.38, 0.55]} />
        <meshStandardMaterial color="#202631" roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.68, -0.45]} castShadow userData={userData}>
        <boxGeometry args={[0.35, 0.18, 0.75]} />
        <meshStandardMaterial color="#7a2d2d" roughness={0.7} />
      </mesh>
    </>
  );
}

export function BotModel({ src, botId, animationState }: BotModelProps) {
  const onModelReady = useCallback(
    (root: THREE.Object3D) => applyBotUserData(root, botId),
    [botId],
  );

  return (
    <group
      position={modelTransforms.bot.position}
      rotation={modelTransforms.bot.rotation}
      scale={modelTransforms.bot.scale}
    >
      <AnimatedCharacterModel
        src={src}
        animationState={animationState}
        role="bot"
        clipMap={quaterniusAnimatedHumanClipMap}
        fallback={<BotFallback botId={botId} />}
        onModelReady={onModelReady}
      />
    </group>
  );
}
