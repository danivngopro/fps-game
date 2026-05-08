import { ModelLoader } from "./ModelLoader";

interface WeaponModelProps {
  src?: string;
  showMuzzleFlash: boolean;
}

function MuzzleFlash() {
  return (
    <mesh position={[0, 0.01, -0.66]} castShadow={false}>
      <boxGeometry args={[0.13, 0.13, 0.08]} />
      <meshBasicMaterial
        color="#ffd166"
        transparent
        opacity={0.85}
        depthTest={false}
      />
    </mesh>
  );
}

function WeaponFallback() {
  return (
    <>
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
    </>
  );
}

export function WeaponModel({ src, showMuzzleFlash }: WeaponModelProps) {
  return (
    <>
      <ModelLoader src={src} fallback={<WeaponFallback />} />
      {showMuzzleFlash && <MuzzleFlash />}
    </>
  );
}
