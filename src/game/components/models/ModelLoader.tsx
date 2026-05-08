import { Component, type ReactNode, Suspense, useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

interface ModelLoaderProps {
  src?: string;
  fallback: ReactNode;
  onModelReady?: (root: THREE.Object3D) => void;
}

interface ErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ModelErrorBoundary extends Component<
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

function LoadedModel({
  src,
  onModelReady,
}: {
  src: string;
  onModelReady?: (root: THREE.Object3D) => void;
}) {
  const gltf = useGLTF(src);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  useEffect(() => {
    onModelReady?.(scene);
  }, [onModelReady, scene]);

  return <primitive object={scene} />;
}

export function ModelLoader({ src, fallback, onModelReady }: ModelLoaderProps) {
  if (!src) return <>{fallback}</>;

  return (
    <ModelErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <LoadedModel src={src} onModelReady={onModelReady} />
      </Suspense>
    </ModelErrorBoundary>
  );
}
