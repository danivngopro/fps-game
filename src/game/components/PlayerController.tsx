import { useRef, useEffect, useState } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { Capsule } from "@react-three/drei";
import { RigidBody, type RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { InputManager } from "../systems/input";
import { ShootingSystem } from "../systems/shooting";
import { useGameStore } from "../store";
import { defaultWeapon } from "../config/weapons";
import type { RaycastHit } from "../types";
import type { TargetDummyHandle } from "./TargetDummy";

interface PlayerControllerProps {
  onShot: (hit: RaycastHit) => void;
  targetRefs: Map<string, React.RefObject<TargetDummyHandle | null>>;
}

const MOVE_SPEED = 16;
const JUMP_FORCE = 7;
const MOUSE_SENSITIVITY = 0.005;
const PLAYER_START: [number, number, number] = [0, 3, 12];

export function PlayerController({
  onShot,
  targetRefs,
}: PlayerControllerProps) {
  const { camera, scene } = useThree();
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const inputManagerRef = useRef<InputManager | null>(null);
  const shootingSystemRef = useRef<ShootingSystem>(new ShootingSystem());
  const lastJumpTimeRef = useRef(0);
  const isGroundedRef = useRef(false);
  const velocityRef = useRef(new THREE.Vector3());
  const [euler] = useState(new THREE.Euler(0, 0, 0, "YXZ"));
  const { consumeAmmo, addScore, startGame, gameStarted, ammo } =
    useGameStore();

  // Initialize input manager
  useEffect(() => {
    inputManagerRef.current = new InputManager();
    return () => {
      inputManagerRef.current?.cleanup();
    };
  }, []);

  // Handle pointer lock for play start
  useEffect(() => {
    const handleCanvasClick = () => {
      if (!gameStarted) {
        startGame();
        inputManagerRef.current?.requestPointerLock();
      }
    };

    document.addEventListener("click", handleCanvasClick);
    return () => {
      document.removeEventListener("click", handleCanvasClick);
    };
  }, [gameStarted, startGame]);

  // Handle mouse look
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!inputManagerRef.current?.isPointerLocked()) return;

      euler.setFromQuaternion(camera.quaternion, "YXZ");
      euler.y -= e.movementX * MOUSE_SENSITIVITY;
      euler.x -= e.movementY * MOUSE_SENSITIVITY;

      // Clamp pitch
      euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.x));

      camera.quaternion.setFromEuler(euler);
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, [camera, euler]);

  // Main game loop
  useFrame(() => {
    if (!rigidBodyRef.current) return;

    const inputState = inputManagerRef.current?.getState() || {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      shoot: false,
      pointerLocked: false,
    };

    if (!inputState.pointerLocked || !gameStarted) return;

    // Get current velocity
    const linvel = rigidBodyRef.current.linvel();
    velocityRef.current.set(linvel.x, linvel.y, linvel.z);

    // Calculate movement direction
    const direction = new THREE.Vector3();
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();

    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    if (inputState.forward) direction.add(forward);
    if (inputState.backward) direction.sub(forward);
    if (inputState.right) direction.add(right);
    if (inputState.left) direction.sub(right);

    if (direction.lengthSq() > 0) {
      direction.normalize().multiplyScalar(MOVE_SPEED);
    }

    // Apply movement
    velocityRef.current.x = direction.x;
    velocityRef.current.z = direction.z;

    // Jumping
    if (inputState.jump && isGroundedRef.current) {
      const now = Date.now();
      if (now - lastJumpTimeRef.current > 500) {
        velocityRef.current.y = JUMP_FORCE;
        lastJumpTimeRef.current = now;
        isGroundedRef.current = false;
      }
    }

    // Set velocity
    rigidBodyRef.current.setLinvel(
      {
        x: velocityRef.current.x,
        y: velocityRef.current.y,
        z: velocityRef.current.z,
      },
      true,
    );

    // Update camera position
    const bodyTranslation = rigidBodyRef.current.translation();
    camera.position.set(
      bodyTranslation.x,
      bodyTranslation.y + 0.6,
      bodyTranslation.z,
    );

    // Good enough for this prototype: allow jumping while resting on floor/platforms.
    isGroundedRef.current =
      Math.abs(velocityRef.current.y) < 0.05 && bodyTranslation.y <= 4.25;

    // Shooting
    if (inputState.shoot && gameStarted && ammo > 0) {
      // Create array of target meshes for raycasting
      const targetMeshes: Array<{ object: THREE.Object3D; id: string }> = [];
      targetRefs.forEach((ref, id) => {
        if (ref.current && ref.current.getHp && ref.current.getHp() > 0) {
          // Find mesh in scene that corresponds to this target
          scene.traverse((obj) => {
            if (obj.userData.targetId === id) {
              targetMeshes.push({ object: obj, id });
            }
          });
        }
      });

      const hit = shootingSystemRef.current.shoot(
        camera,
        defaultWeapon,
        targetMeshes.map((t) => ({ id: t.id, mesh: t.object })),
      );

      consumeAmmo();

      if (hit) {
        onShot(hit);
        addScore(25);
      }
    }
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="dynamic"
      position={PLAYER_START}
      friction={0.1}
      linearDamping={0.8}
      angularDamping={1}
      lockRotations
    >
      <Capsule args={[0.5, 1.2]} position={[0, 0, 0]}>
        <meshStandardMaterial visible={false} />
      </Capsule>
    </RigidBody>
  );
}
