import { useRef, useEffect, useState, useCallback } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { Capsule } from "@react-three/drei";
import { RigidBody, type RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { InputManager } from "../systems/input";
import { ShootingSystem } from "../systems/shooting";
import { useGameStore } from "../store";
import { defaultWeapon } from "../config/weapons";
import { playerConfig } from "../config/player";
import { WeaponViewModel } from "./WeaponViewModel";
import type { RaycastHit } from "../types";
import type { TargetDummyHandle } from "./TargetDummy";

interface PlayerControllerProps {
  onShot: (hit: RaycastHit) => void;
  targetRefs: Map<string, React.RefObject<TargetDummyHandle | null>>;
}

const down = new THREE.Vector3(0, -1, 0);
const up = new THREE.Vector3(0, 1, 0);

export function PlayerController({
  onShot,
  targetRefs,
}: PlayerControllerProps) {
  const { camera, scene } = useThree();
  const cameraRef = useRef(camera);
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const inputManagerRef = useRef<InputManager | null>(null);
  const shootingSystemRef = useRef<ShootingSystem>(new ShootingSystem());
  const groundRaycasterRef = useRef(new THREE.Raycaster());
  const lastJumpTimeRef = useRef(0);
  const reloadPressedRef = useRef(false);
  const reloadTimerRef = useRef<number | null>(null);
  const isGroundedRef = useRef(false);
  const velocityRef = useRef(new THREE.Vector3());
  const horizontalVelocityRef = useRef(new THREE.Vector3());
  const currentEyeHeightRef = useRef(playerConfig.standingEyeHeight);
  const [euler] = useState(new THREE.Euler(0, 0, 0, "YXZ"));
  const {
    consumeAmmo,
    addScore,
    startGame,
    gameStarted,
    ammo,
    isReloading,
    setReloading,
    setAiming,
    setShowMuzzleFlash,
    completeReload,
  } = useGameStore();

  const startReload = useCallback(() => {
    const state = useGameStore.getState();
    if (state.isReloading || state.ammo >= state.magazineSize) return;
    if (state.reserveAmmo <= 0) return;

    setReloading(true);
    if (reloadTimerRef.current !== null) {
      window.clearTimeout(reloadTimerRef.current);
    }

    reloadTimerRef.current = window.setTimeout(() => {
      completeReload();
      reloadTimerRef.current = null;
    }, defaultWeapon.reloadTime);
  }, [completeReload, setReloading]);

  useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);

  // Initialize input manager
  useEffect(() => {
    inputManagerRef.current = new InputManager();
    return () => {
      inputManagerRef.current?.cleanup();
      if (reloadTimerRef.current !== null) {
        window.clearTimeout(reloadTimerRef.current);
      }
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
      const aimingMultiplier = useGameStore.getState().isAiming
        ? defaultWeapon.adsMouseSensitivityMultiplier
        : 1;
      const sensitivity = playerConfig.mouseSensitivity * aimingMultiplier;

      const activeCamera = cameraRef.current;
      euler.setFromQuaternion(activeCamera.quaternion, "YXZ");
      euler.y -= e.movementX * sensitivity;
      euler.x -= e.movementY * sensitivity;

      // Clamp pitch
      euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.x));

      activeCamera.quaternion.setFromEuler(euler);
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, [camera, euler]);

  // Main game loop
  useFrame((_, delta) => {
    if (!rigidBodyRef.current) return;
    const dt = Math.min(delta, 0.05);

    const inputState = inputManagerRef.current?.getState() || {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      crouch: false,
      aim: false,
      reload: false,
      shoot: false,
      pointerLocked: false,
    };

    if (!inputState.pointerLocked || !gameStarted) return;

    if (inputState.aim !== useGameStore.getState().isAiming) {
      setAiming(inputState.aim);
    }

    // Get current velocity
    const linvel = rigidBodyRef.current.linvel();
    velocityRef.current.set(linvel.x, linvel.y, linvel.z);
    horizontalVelocityRef.current.set(linvel.x, 0, linvel.z);

    // Calculate movement direction
    const wishDirection = new THREE.Vector3();
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();

    const activeCamera = cameraRef.current;
    activeCamera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    right.crossVectors(forward, up).normalize();

    if (inputState.forward) wishDirection.add(forward);
    if (inputState.backward) wishDirection.sub(forward);
    if (inputState.right) wishDirection.add(right);
    if (inputState.left) wishDirection.sub(right);

    if (wishDirection.lengthSq() > 0) {
      wishDirection.normalize();
    }

    const bodyTranslation = rigidBodyRef.current.translation();
    const groundObjects: THREE.Object3D[] = [];
    scene.traverse((obj) => {
      if (obj.userData.ground === true) {
        groundObjects.push(obj);
      }
    });

    groundRaycasterRef.current.set(
      new THREE.Vector3(bodyTranslation.x, bodyTranslation.y, bodyTranslation.z),
      down,
    );
    groundRaycasterRef.current.far =
      playerConfig.groundCheckDistance + playerConfig.groundCheckTolerance;

    const groundHits = groundRaycasterRef.current.intersectObjects(
      groundObjects,
      false,
    );
    isGroundedRef.current =
      velocityRef.current.y <= 0.3 &&
      groundHits.some(
        (hit) =>
          hit.distance <=
          playerConfig.groundCheckDistance + playerConfig.groundCheckTolerance,
      );

    const crouchMultiplier = inputState.crouch
      ? playerConfig.crouchSpeedMultiplier
      : 1;
    const adsMultiplier = inputState.aim
      ? defaultWeapon.adsMoveSpeedMultiplier
      : 1;
    const targetSpeed =
      playerConfig.walkSpeed * crouchMultiplier * adsMultiplier;
    const horizontalVelocity = horizontalVelocityRef.current;

    if (isGroundedRef.current) {
      const friction =
        inputState.jump && horizontalVelocity.length() > playerConfig.walkSpeed
          ? playerConfig.groundFriction * 0.25
          : playerConfig.groundFriction;
      const speed = horizontalVelocity.length();

      if (speed > 0.001) {
        const drop = speed * friction * dt;
        horizontalVelocity.multiplyScalar(Math.max(speed - drop, 0) / speed);
      }

      if (wishDirection.lengthSq() > 0) {
        const desiredVelocity = wishDirection.clone().multiplyScalar(targetSpeed);
        horizontalVelocity.lerp(
          desiredVelocity,
          Math.min(1, playerConfig.groundAcceleration * dt),
        );
      }

      const speedAfterInput = horizontalVelocity.length();
      if (speedAfterInput > playerConfig.maxGroundSpeed && !inputState.jump) {
        horizontalVelocity.multiplyScalar(
          playerConfig.maxGroundSpeed / speedAfterInput,
        );
      }
    } else if (wishDirection.lengthSq() > 0) {
      const currentAlongWish = horizontalVelocity.dot(wishDirection);
      const airTargetSpeed = targetSpeed * playerConfig.airControl;
      const addSpeed = Math.max(0, airTargetSpeed - currentAlongWish);
      const acceleration = Math.min(
        addSpeed,
        playerConfig.airAcceleration * targetSpeed * dt,
      );

      horizontalVelocity.addScaledVector(wishDirection, acceleration);

      const airSpeed = horizontalVelocity.length();
      const maxAirSpeed = inputState.jump
        ? playerConfig.maxBhopSpeed
        : playerConfig.maxAirSpeed;
      if (airSpeed > maxAirSpeed) {
        horizontalVelocity.multiplyScalar(maxAirSpeed / airSpeed);
      }
    }

    velocityRef.current.x = horizontalVelocity.x;
    velocityRef.current.z = horizontalVelocity.z;

    // Jumping
    if (inputState.jump && isGroundedRef.current) {
      const now = Date.now();
      if (now - lastJumpTimeRef.current > playerConfig.jumpCooldownMs) {
        velocityRef.current.y = playerConfig.jumpForce;
        lastJumpTimeRef.current = now;
        isGroundedRef.current = false;
      }
    } else if (isGroundedRef.current && velocityRef.current.y < 0) {
      velocityRef.current.y = playerConfig.groundedStickVelocity;
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
    const targetEyeHeight = inputState.crouch
      ? playerConfig.crouchingEyeHeight
      : playerConfig.standingEyeHeight;
    currentEyeHeightRef.current = THREE.MathUtils.lerp(
      currentEyeHeightRef.current,
      targetEyeHeight,
      1 - Math.exp(-dt * playerConfig.crouchLerpSpeed),
    );

    activeCamera.position.set(
      bodyTranslation.x,
      bodyTranslation.y + currentEyeHeightRef.current,
      bodyTranslation.z,
    );

    const targetFov = inputState.aim ? defaultWeapon.adsFov : playerConfig.baseFov;
    if (activeCamera instanceof THREE.PerspectiveCamera) {
      activeCamera.fov = THREE.MathUtils.lerp(
        activeCamera.fov,
        targetFov,
        1 - Math.exp(-dt * playerConfig.fovLerpSpeed),
      );
      activeCamera.updateProjectionMatrix();
    }

    if (inputState.reload && !reloadPressedRef.current) {
      startReload();
    }
    reloadPressedRef.current = inputState.reload;

    // Shooting
    if (inputState.shoot && gameStarted && !isReloading) {
      if (ammo <= 0) {
        startReload();
        return;
      }

      if (!shootingSystemRef.current.canShoot(defaultWeapon)) return;

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

      consumeAmmo();
      setShowMuzzleFlash(true);
      window.setTimeout(() => setShowMuzzleFlash(false), 65);

      const hit = shootingSystemRef.current.shoot(
        activeCamera,
        defaultWeapon,
        targetMeshes.map((t) => ({ id: t.id, mesh: t.object })),
        inputState.aim ? defaultWeapon.adsSpread : defaultWeapon.hipFireSpread,
      );

      if (hit) {
        onShot(hit);
        addScore(25);
      }
    }
  });

  return (
    <>
    <RigidBody
      ref={rigidBodyRef}
      type="dynamic"
      position={playerConfig.startPosition}
      friction={0}
      linearDamping={0}
      angularDamping={1}
      lockRotations
    >
      <Capsule
        args={[playerConfig.colliderRadius, playerConfig.colliderSegmentHeight]}
        position={[0, 0, 0]}
      >
        <meshStandardMaterial visible={false} />
      </Capsule>
    </RigidBody>
    <WeaponViewModel />
    </>
  );
}
