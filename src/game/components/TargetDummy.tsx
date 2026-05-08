import {
  useRef,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Box } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface TargetDummyProps {
  id: string;
  position: [number, number, number];
  maxHp: number;
  onDeath: () => void;
  onHit: (damage: number) => void;
}

export interface TargetDummyHandle {
  takeDamage: (damage: number) => void;
  getHp: () => number;
}

export const TargetDummy = forwardRef<TargetDummyHandle, TargetDummyProps>(
  ({ id, position, maxHp, onDeath, onHit }, ref) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const aliveRef = useRef(true);
    const [hp, setHp] = useState(maxHp);
    const [hitFlashTime, setHitFlashTime] = useState(0);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      takeDamage: (damage: number) => {
        if (!aliveRef.current) return;

        setHitFlashTime(0.1);
        onHit(damage);

        setHp((currentHp) => {
          const newHp = Math.max(0, currentHp - damage);

          if (newHp <= 0) {
            aliveRef.current = false;
            onDeath();
          }

          return newHp;
        });
      },
      getHp: () => hp,
    }));

    // Make target hittable
    useEffect(() => {
      aliveRef.current = true;
      setHp(maxHp);
    }, [maxHp]);

    useEffect(() => {
      if (meshRef.current) {
        meshRef.current.userData = { targetId: id };
      }
    }, [id]);

    // Flash color when hit
    useFrame(() => {
      if (meshRef.current && hitFlashTime > 0) {
        const intensity = hitFlashTime / 0.1;
        const material = meshRef.current.material as THREE.MeshStandardMaterial;
        material.emissive = new THREE.Color(1, 0.3, 0.3);
        material.emissiveIntensity = intensity * 0.5;
        setHitFlashTime((t) => Math.max(0, t - 0.016));
      } else if (meshRef.current) {
        const material = meshRef.current.material as THREE.MeshStandardMaterial;
        material.emissive = new THREE.Color(0, 0, 0);
        material.emissiveIntensity = 0;
      }
    });

    if (hp <= 0) {
      return null;
    }

    return (
      <RigidBody
        type="fixed"
        position={position}
        userData={{ targetId: id }}
      >
        <Box ref={meshRef} args={[3, 4, 3]} castShadow receiveShadow>
          <meshStandardMaterial color="#ff6b6b" />
        </Box>
      </RigidBody>
    );
  },
);
