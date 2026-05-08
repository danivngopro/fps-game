import { ModelLoader } from "./ModelLoader";

interface PlayerModelProps {
  src?: string;
}

function PlayerFallback() {
  return (
    <>
      <mesh position={[0, 0.05, 0]} castShadow>
        <capsuleGeometry args={[0.5, 1.24, 6, 10]} />
        <meshStandardMaterial color="#2d3542" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.05, -0.08]} castShadow>
        <boxGeometry args={[0.5, 0.28, 0.35]} />
        <meshStandardMaterial color="#d7a47f" roughness={0.75} />
      </mesh>
    </>
  );
}

export function PlayerModel({ src }: PlayerModelProps) {
  return <ModelLoader src={src} fallback={<PlayerFallback />} />;
}
