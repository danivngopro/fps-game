import { Component, Suspense, useEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
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

interface AnimatedCharacterModelProps {
  src?: string;
  animationState: CharacterAnimationState;
  fallback: React.ReactNode;
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

function findClip(
  clips: THREE.AnimationClip[],
  state: CharacterAnimationState,
  clipMap: AnimationClipMap,
) {
  const names = clipMap[state] ?? [];

  return (
    names
      .map((name) =>
        clips.find((clip) =>
          clip.name.toLowerCase().includes(name.toLowerCase()),
        ),
      )
      .find(Boolean) ??
    clips.find((clip) => clip.name.toLowerCase().includes("idle")) ??
    clips[0]
  );
}

function cloneModelWithMaterials(scene: THREE.Group) {
  const root = scene.clone(true);

  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;

    object.material = Array.isArray(object.material)
      ? object.material.map((material) => material.clone())
      : object.material.clone();
  });

  return root;
}

function LoadedAnimatedModel({
  src,
  animationState,
  clipMap,
  onModelReady,
}: {
  src: string;
  animationState: CharacterAnimationState;
  clipMap: AnimationClipMap;
  onModelReady?: (root: THREE.Object3D) => void;
}) {
  const gltf = useGLTF(src);
  const root = useMemo(() => cloneModelWithMaterials(gltf.scene), [gltf.scene]);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const activeActionRef = useRef<THREE.AnimationAction | null>(null);

  useEffect(() => {
    onModelReady?.(root);
    mixerRef.current = new THREE.AnimationMixer(root);

    return () => {
      mixerRef.current?.stopAllAction();
      mixerRef.current = null;
      activeActionRef.current = null;
    };
  }, [onModelReady, root]);

  useEffect(() => {
    const mixer = mixerRef.current;
    if (!mixer) return;

    const clip = findClip(gltf.animations, animationState, clipMap);
    if (!clip) return;

    const nextAction = mixer.clipAction(clip);
    nextAction.reset().fadeIn(0.12).play();

    if (activeActionRef.current && activeActionRef.current !== nextAction) {
      activeActionRef.current.fadeOut(0.12);
    }

    activeActionRef.current = nextAction;
  }, [animationState, clipMap, gltf.animations]);

  useFrame((_, delta) => {
    mixerRef.current?.update(delta);
  });

  return <primitive object={root} />;
}

export function AnimatedCharacterModel({
  src,
  animationState,
  fallback,
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
          clipMap={clipMap}
          onModelReady={onModelReady}
        />
      </Suspense>
    </AnimationModelErrorBoundary>
  );
}
