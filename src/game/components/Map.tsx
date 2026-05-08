import { Box, Cylinder } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import { mapConfig } from "../config/map";
import type { MapBoxConfig } from "../types";

function ShootableBox({ item }: { item: MapBoxConfig }) {
  return (
    <RigidBody
      type="fixed"
      friction={0.7}
      restitution={0}
      position={item.position}
      rotation={item.rotation}
    >
      <Box
        args={item.size}
        castShadow
        receiveShadow
        userData={{
          shootable: item.shootable ?? true,
          objectType: "environment",
          surfaceType: item.surfaceType,
          ground: item.walkable ?? false,
        }}
      >
        <meshStandardMaterial color={item.color} roughness={0.9} />
      </Box>
    </RigidBody>
  );
}

function Palm({ position, id }: { position: [number, number, number]; id: string }) {
  return (
    <RigidBody type="fixed" colliders={false} position={position}>
      <Cylinder
        args={[0.28, 0.42, 5.5, 7]}
        position={[0, 2.75, 0]}
        castShadow
        userData={{
          shootable: true,
          objectType: "environment",
          surfaceType: "wood",
          decorationId: id,
        }}
      >
        <meshStandardMaterial color="#76512f" roughness={0.85} />
      </Cylinder>
      <Box position={[0, 5.65, 0]} args={[4.2, 0.32, 0.9]} castShadow>
        <meshStandardMaterial color="#3d7b42" roughness={0.8} />
      </Box>
      <Box
        position={[0, 5.45, 0]}
        args={[0.9, 0.32, 4.2]}
        rotation={[0, 0.5, 0]}
        castShadow
      >
        <meshStandardMaterial color="#3d7b42" roughness={0.8} />
      </Box>
    </RigidBody>
  );
}

export function Map() {
  const solidGeometry = [
    ...mapConfig.floors,
    ...mapConfig.walls,
    ...mapConfig.buildings,
    ...mapConfig.crates,
    ...mapConfig.cover,
    ...mapConfig.ramps,
  ];

  return (
    <>
      {solidGeometry.map((item) => (
        <ShootableBox key={item.id} item={item} />
      ))}

      {mapConfig.decorations.map((item) => (
        <Palm key={item.id} id={item.id} position={item.position} />
      ))}

      <ambientLight intensity={0.25} />
    </>
  );
}
