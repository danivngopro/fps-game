import { Component, Suspense, useEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import * as THREE from "three";

export type CharacterAnimationState =
  | "idle"
  | "walk"
  | "run"
  | "jump"
  | "crouch"
  | "aim"
  | "shoot"
  | "death";

export interface AnimationClipMap {
  idle?: string[];
  walk?: string[];
  run?: string[];
  jump?: string[];
  crouch?: string[];
  aim?: string[];
  shoot?: string[];
  death?: string[];
}

export type CharacterModelRole = "player" | "bot";

interface AnimatedCharacterModelProps {
  src?: string;
  animationState: CharacterAnimationState;
  fallback: React.ReactNode;
  role: CharacterModelRole;
  clipMap?: AnimationClipMap;
  onModelReady?: (root: THREE.Object3D) => void;
}

interface ErrorBoundaryProps {
  fallback: React.ReactNode;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class AnimationModelErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  public state: ErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  public render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

const defaultClipMap: AnimationClipMap = {
  idle: ["idle", "standing", "stand"],
  walk: ["walk", "walking"],
  run: ["run", "running"],
  jump: ["jump", "fall", "falling"],
  crouch: ["crouch", "crouching", "crouchwalk"],
  aim: ["aim", "rifle aim", "gun aim"],
  shoot: ["shoot", "fire", "rifle fire"],
  death: ["death", "die", "dead"],
};

const loggedClipSources = new Set<string>();
const loggedFallbacks = new Set<string>();

const roleMaterialColors: Record<CharacterModelRole, THREE.ColorRepresentation> = {
  player: "#3e4a5f",
  bot: "#8d3030",
};

function resolveClip(
  src: string,
  clips: THREE.AnimationClip[],
  state: CharacterAnimationState,
  clipMap: AnimationClipMap,
) {
  const names = clipMap[state] ?? [];
  const matchedClip = names
    .map((name) =>
      clips.find((clip) =>
        clip.name.toLowerCase().includes(name.toLowerCase()),
      ),
    )
    .find(Boolean);

  if (matchedClip) return matchedClip;

  const fallbackClip =
    clips.find((clip) => clip.name.toLowerCase().includes("idle")) ?? clips[0];

  if (import.meta.env.DEV && fallbackClip) {
    const fallbackKey = `${src}:${state}`;
    if (!loggedFallbacks.has(fallbackKey)) {
      loggedFallbacks.add(fallbackKey);
      console.warn(
        `[AnimatedCharacterModel] No exact clip for "${state}" in ${src}. Using fallback "${fallbackClip.name}". Available clips:`,
        clips.map((clip) => clip.name),
      );
    }
  }

  return fallbackClip;
}

function createRoleMaterial(role: CharacterModelRole) {
  return new THREE.MeshStandardMaterial({
    color: roleMaterialColors[role],
    roughness: 0.82,
    metalness: 0,
  });
}

function cloneMaterialForRole(
  material: THREE.Material,
  role: CharacterModelRole,
) {
  const clonedMaterial = material.clone();

  if (
    clonedMaterial instanceof THREE.MeshBasicMaterial ||
    clonedMaterial instanceof THREE.MeshStandardMaterial ||
    clonedMaterial instanceof THREE.MeshPhongMaterial ||
    clonedMaterial instanceof THREE.MeshLambertMaterial
  ) {
    const hasTexture = clonedMaterial.map !== null;
    const isNearWhite = clonedMaterial.color.r > 0.85 &&
      clonedMaterial.color.g > 0.85 &&
      clonedMaterial.color.b > 0.85;

    if (!hasTexture && isNearWhite) {
      return createRoleMaterial(role);
    }
  }

  return clonedMaterial;
}

function cloneModelWithMaterials(
  scene: THREE.Object3D,
  role: CharacterModelRole,
) {
  const root = cloneSkeleton(scene);

  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;

    object.material = Array.isArray(object.material)
      ? object.material.map((material) => cloneMaterialForRole(material, role))
      : cloneMaterialForRole(object.material, role);
    object.castShadow = true;
    object.receiveShadow = true;
  });

  return root;
}

function LoadedAnimatedModel({
  src,
  animationState,
  role,
  clipMap,
  onModelReady,
}: {
  src: string;
  animationState: CharacterAnimationState;
  role: CharacterModelRole;
  clipMap: AnimationClipMap;
  onModelReady?: (root: THREE.Object3D) => void;
}) {
  const gltf = useGLTF(src);
  const root = useMemo(
    () => cloneModelWithMaterials(gltf.scene, role),
    [gltf.scene, role],
  );
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const activeActionRef = useRef<THREE.AnimationAction | null>(null);

  useEffect(() => {
    if (import.meta.env.DEV && !loggedClipSources.has(src)) {
      loggedClipSources.add(src);
      console.info(
        `[AnimatedCharacterModel] Clips loaded for ${src}:`,
        gltf.animations.map((clip) => clip.name),
      );
    }

    onModelReady?.(root);
    mixerRef.current = new THREE.AnimationMixer(root);

    return () => {
      mixerRef.current?.stopAllAction();
      mixerRef.current = null;
      activeActionRef.current = null;
    };
  }, [gltf.animations, onModelReady, root, src]);

  useEffect(() => {
    const mixer = mixerRef.current;
    if (!mixer) return;

    const clip = resolveClip(src, gltf.animations, animationState, clipMap);
    if (!clip) return;

    const nextAction = mixer.clipAction(clip);
    nextAction.enabled = true;
    nextAction.reset().fadeIn(0.12).play();

    if (activeActionRef.current && activeActionRef.current !== nextAction) {
      activeActionRef.current.fadeOut(0.12);
    }

    activeActionRef.current = nextAction;
  }, [animationState, clipMap, gltf.animations, src]);

  useFrame((_, delta) => {
    mixerRef.current?.update(delta);
  });

  return <primitive object={root} />;
}

export function AnimatedCharacterModel({
  src,
  animationState,
  fallback,
  role,
  clipMap = defaultClipMap,
  onModelReady,
}: AnimatedCharacterModelProps) {
  if (!src) return <>{fallback}</>;

  return (
    <AnimationModelErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <LoadedAnimatedModel
          src={src}
          animationState={animationState}
          role={role}
          clipMap={clipMap}
          onModelReady={onModelReady}
        />
      </Suspense>
    </AnimationModelErrorBoundary>
  );
}
