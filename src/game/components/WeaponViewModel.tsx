import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "../store";

const hipOffset = new THREE.Vector3(0.34, -0.32, -0.62);
const adsOffset = new THREE.Vector3(0.04, -0.22, -0.48);
const reloadRotation = new THREE.Euler(-0.55, 0.18, 0.22);

export function WeaponViewModel() {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const offsetRef = useRef(hipOffset.clone());
  const localRotationRef = useRef(new THREE.Euler(0, 0, 0));
  const recoilRef = useRef(0);
  const lastMuzzleFlashRef = useRef(false);
  const isAiming = useGameStore((state) => state.isAiming);
  const isReloading = useGameStore((state) => state.isReloading);
  const showMuzzleFlash = useGameStore((state) => state.showMuzzleFlash);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const targetOffset = isAiming ? adsOffset : hipOffset;
    offsetRef.current.lerp(targetOffset, 1 - Math.exp(-delta * 14));

    if (showMuzzleFlash && !lastMuzzleFlashRef.current) {
      recoilRef.current = 0.065;
    }
    lastMuzzleFlashRef.current = showMuzzleFlash;
    recoilRef.current = Math.max(0, recoilRef.current - delta * 0.28);

    const bob =
      Math.sin(state.clock.elapsedTime * 8) * (isAiming ? 0.004 : 0.012);
    const localOffset = offsetRef.current
      .clone()
      .add(new THREE.Vector3(0, bob - recoilRef.current * 0.35, recoilRef.current));

    const targetRotation = isReloading ? reloadRotation : new THREE.Euler(0, 0, 0);
    const turn = 1 - Math.exp(-delta * 10);
    localRotationRef.current.x += (targetRotation.x - localRotationRef.current.x) * turn;
    localRotationRef.current.y += (targetRotation.y - localRotationRef.current.y) * turn;
    localRotationRef.current.z += (targetRotation.z - localRotationRef.current.z) * turn;

    const localQuaternion = new THREE.Quaternion().setFromEuler(localRotationRef.current);
    group.position.copy(camera.position).add(localOffset.applyQuaternion(camera.quaternion));
    group.quaternion.copy(camera.quaternion).multiply(localQuaternion);
  });

  return (
    <group ref={groupRef} renderOrder={10}>
      <mesh position={[-0.18, -0.08, 0.1]} castShadow={false}>
        <boxGeometry args={[0.12, 0.12, 0.42]} />
        <meshStandardMaterial color="#d7a47f" depthTest={false} />
      </mesh>
      <mesh position={[0.18, -0.09, 0.08]} castShadow={false}>
        <boxGeometry args={[0.12, 0.12, 0.36]} />
        <meshStandardMaterial color="#d7a47f" depthTest={false} />
      </mesh>
      <mesh position={[0, 0, 0]} castShadow={false}>
        <boxGeometry args={[0.22, 0.18, 0.62]} />
        <meshStandardMaterial color="#2b3038" roughness={0.85} depthTest={false} />
      </mesh>
      <mesh position={[0, 0.07, -0.06]} castShadow={false}>
        <boxGeometry args={[0.18, 0.08, 0.38]} />
        <meshStandardMaterial color="#474f5f" roughness={0.75} depthTest={false} />
      </mesh>
      <mesh position={[0, -0.16, 0.06]} castShadow={false}>
        <boxGeometry args={[0.12, 0.26, 0.2]} />
        <meshStandardMaterial color="#1c2027" depthTest={false} />
      </mesh>
      <mesh position={[0, 0.01, -0.44]} castShadow={false}>
        <boxGeometry args={[0.12, 0.1, 0.32]} />
        <meshStandardMaterial color="#161a20" depthTest={false} />
      </mesh>
      {showMuzzleFlash && (
        <mesh position={[0, 0.01, -0.66]} castShadow={false}>
          <boxGeometry args={[0.13, 0.13, 0.08]} />
          <meshBasicMaterial color="#ffd166" transparent opacity={0.85} depthTest={false} />
        </mesh>
      )}
    </group>
  );
}
