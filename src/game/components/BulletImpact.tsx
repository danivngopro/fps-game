import { useMemo } from "react";
import * as THREE from "three";
import type { BulletImpactData, SurfaceType } from "../types";

const markColors: Record<SurfaceType, string> = {
  sand: "#6f5a3a",
  stone: "#2c2a25",
  concrete: "#34302a",
  wood: "#1e1711",
  metal: "#111822",
  target: "#3b0909",
};

function BulletMark({ impact }: { impact: BulletImpactData }) {
  const { position, quaternion, scale } = useMemo(() => {
    const normal = new THREE.Vector3(...impact.normal).normalize();
    const point = new THREE.Vector3(...impact.point).addScaledVector(normal, 0.018);
    const q = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      normal,
    );
    const size = 0.18 + (impact.id % 4) * 0.018;

    return {
      position: point,
      quaternion: q,
      scale: new THREE.Vector3(size, size, 1),
    };
  }, [impact]);

  return (
    <mesh position={position} quaternion={quaternion} scale={scale} renderOrder={2}>
      <circleGeometry args={[1, 10]} />
      <meshBasicMaterial
        color={markColors[impact.surfaceType]}
        transparent
        opacity={0.72}
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-1}
      />
    </mesh>
  );
}

export function BulletImpacts({ impacts }: { impacts: BulletImpactData[] }) {
  return (
    <>
      {impacts.map((impact) => (
        <BulletMark key={impact.id} impact={impact} />
      ))}
    </>
  );
}
