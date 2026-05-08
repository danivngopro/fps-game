import { useRef } from "react";
import { Box, Plane } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import { mapConfig } from "../config/map";

export function Map() {
  const floorRef = useRef(null);

  return (
    <>
      {/* Floor */}
      <RigidBody type="fixed" friction={0.5} restitution={0}>
        <Plane
          ref={floorRef}
          args={[mapConfig.floorSize, mapConfig.floorSize]}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, mapConfig.floorHeight, 0]}
        >
          <meshStandardMaterial color="#5a5a5a" />
        </Plane>
      </RigidBody>

      {/* Walls and obstacles */}
      {mapConfig.walls.map((wall, index) => (
        <RigidBody key={index} type="fixed" friction={0.5} restitution={0}>
          <Box
            args={wall.size}
            position={wall.position}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial color="#3a3a3a" />
          </Box>
        </RigidBody>
      ))}

      {/* Decorative skybox cylinder to contain the game area */}
      <RigidBody type="fixed" colliders={false}>
        <Plane
          args={[mapConfig.floorSize, 50]}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 50, 0]}
        >
          <meshStandardMaterial
            color="#87ceeb"
            emissive="#87ceeb"
            emissiveIntensity={0.3}
            side={2}
          />
        </Plane>
      </RigidBody>
    </>
  );
}
