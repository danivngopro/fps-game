import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  CapsuleCollider,
  RigidBody,
  useRapier,
  type RapierRigidBody,
} from "@react-three/rapier";
import * as THREE from "three";
import { mapConfig } from "../config/map";
import { playerConfig } from "../config/player";
import { modelPaths } from "../config/models";
import { defaultWeapon } from "../config/weapons";
import { useGameStore } from "../store";
import { gameAudio } from "../systems/audio";
import { playerRuntime } from "../systems/playerRuntime";
import { InputManager } from "../systems/input";
import { ShootingSystem } from "../systems/shooting";
import type { RaycastHit, ShootableObject, SurfaceType } from "../types";
import { WeaponViewModel } from "./WeaponViewModel";
import { PlayerModel } from "./models/PlayerModel";
import type { CharacterAnimationState } from "./models/AnimatedCharacterModel";
import type { TargetDummyHandle } from "./TargetDummy";

interface PlayerControllerProps {
  onShot: (hit: RaycastHit) => void;
  targetRefs: Map<string, RefObject<TargetDummyHandle | null>>;
}

const down = { x: 0, y: -1, z: 0 };
const up = { x: 0, y: 1, z: 0 };
const threeUp = new THREE.Vector3(0, 1, 0);
const emptyInput = {
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

function accelerate(
  velocity: THREE.Vector3,
  wishDirection: THREE.Vector3,
  wishSpeed: number,
  acceleration: number,
  dt: number,
) {
  const currentSpeed = velocity.dot(wishDirection);
  const addSpeed = wishSpeed - currentSpeed;

  if (addSpeed <= 0) return;

  velocity.addScaledVector(
    wishDirection,
    Math.min(acceleration * wishSpeed * dt, addSpeed),
  );
}

export function PlayerController({
  onShot,
  targetRefs,
}: PlayerControllerProps) {
  const { camera, scene } = useThree();
  const { rapier, world } = useRapier();
  const cameraRef = useRef(camera);
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const inputManagerRef = useRef<InputManager | null>(null);
  const shootingSystemRef = useRef(new ShootingSystem());
  const lastJumpTimeRef = useRef(0);
  const lastLandingTimeRef = useRef(-Infinity);
  const reloadPressedRef = useRef(false);
  const reloadTimerRef = useRef<number | null>(null);
  const isGroundedRef = useRef(false);
  const wasGroundedRef = useRef(false);
  const bunnyhopGraceActiveRef = useRef(false);
  const isCrouchedRef = useRef(false);
  const yawRef = useRef(playerConfig.initialYaw);
  const pitchRef = useRef(playerConfig.initialPitch);
  const thirdPersonPositionRef = useRef(new THREE.Vector3());
  const velocityRef = useRef(new THREE.Vector3());
  const horizontalVelocityRef = useRef(new THREE.Vector3());
  const currentEyeHeightRef = useRef(playerConfig.standingEyeHeight);
  const playerVisualRef = useRef<THREE.Group>(null);
  const playerAnimationStateRef = useRef<CharacterAnimationState>("idle");
  const lastFootstepTimeRef = useRef(0);
  const lastDebugTimeRef = useRef(0);
  const deathTimerRef = useRef<number | null>(null);
  const isDeadRef = useRef(false);
  const [isColliderCrouched, setIsColliderCrouched] = useState(false);
  const [playerAnimationState, setPlayerAnimationState] =
    useState<CharacterAnimationState>("idle");
  const {
    consumeAmmo,
    addScore,
    startGame,
    gameStarted,
    ammo,
    health,
    isReloading,
    cameraMode,
    setReloading,
    setAiming,
    setShowMuzzleFlash,
    completeReload,
    setDebug,
    addDeath,
    restorePlayer,
  } = useGameStore();

  const resetToSpawn = useCallback(() => {
    const body = rigidBodyRef.current;
    if (!body) return;

    body.setTranslation(
      {
        x: mapConfig.playerSpawn[0],
        y: mapConfig.playerSpawn[1],
        z: mapConfig.playerSpawn[2],
      },
      true,
    );
    body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    body.setAngvel({ x: 0, y: 0, z: 0 }, true);
  }, []);

  const startReload = useCallback(() => {
    const state = useGameStore.getState();
    if (state.isReloading || state.ammo >= state.magazineSize) return;

    setReloading(true);
    gameAudio.play("reload");

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
    camera.quaternion.setFromEuler(
      new THREE.Euler(playerConfig.initialPitch, playerConfig.initialYaw, 0, "YXZ"),
    );
  }, [camera]);

  useEffect(() => {
    inputManagerRef.current = new InputManager();
    return () => {
      inputManagerRef.current?.cleanup();
      if (reloadTimerRef.current !== null) {
        window.clearTimeout(reloadTimerRef.current);
      }
      if (deathTimerRef.current !== null) {
        window.clearTimeout(deathTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleCanvasClick = () => {
      if (!gameStarted) startGame();
      gameAudio.unlock();
      inputManagerRef.current?.requestPointerLock();
    };

    document.addEventListener("click", handleCanvasClick);
    return () => document.removeEventListener("click", handleCanvasClick);
  }, [gameStarted, startGame]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!inputManagerRef.current?.isPointerLocked()) return;

      const aimingMultiplier = useGameStore.getState().isAiming
        ? defaultWeapon.adsMouseSensitivityMultiplier
        : 1;
      const sensitivity = playerConfig.mouseSensitivity * aimingMultiplier;

      yawRef.current -= event.movementX * sensitivity;
      pitchRef.current = THREE.MathUtils.clamp(
        pitchRef.current - event.movementY * sensitivity,
        -Math.PI / 2,
        Math.PI / 2,
      );
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const hasHeadroom = useCallback(() => {
    const body = rigidBodyRef.current;
    if (!body) return true;

    const translation = body.translation();
    const ray = new rapier.Ray(
      {
        x: translation.x,
        y: translation.y + playerConfig.crouchingEyeHeight,
        z: translation.z,
      },
      up,
    );
    const hit = world.castRay(
      ray,
      playerConfig.headroomCheckDistance,
      true,
      undefined,
      undefined,
      undefined,
      body,
    );

    return hit === null;
  }, [rapier, world]);

  const collectShootables = useCallback(() => {
    const shootables: ShootableObject[] = [];

    scene.traverse((object) => {
      if (object.userData.shootable !== true) return;

      const objectType =
        object.userData.objectType === "target"
          ? "target"
          : object.userData.objectType === "bot"
            ? "bot"
            : "environment";
      const targetId =
        typeof object.userData.targetId === "string"
          ? object.userData.targetId
          : undefined;
      const botId =
        typeof object.userData.botId === "string"
          ? object.userData.botId
          : undefined;

      if (objectType === "target") {
        if (!targetId) return;
        const targetRef = targetRefs.get(targetId);
        if (!targetRef?.current || targetRef.current.getHp() <= 0) return;
      }

      shootables.push({
        id: object.uuid,
        object,
        objectType,
        targetId,
        botId,
        surfaceType: (object.userData.surfaceType as SurfaceType) ?? "concrete",
      });
    });

    return shootables;
  }, [scene, targetRefs]);

  useFrame((_, delta) => {
    const body = rigidBodyRef.current;
    if (!body) return;

    const dt = Math.min(delta, 0.05);
    const frameNow = performance.now();
    const inputState = inputManagerRef.current?.getState() ?? emptyInput;

    if (!inputState.pointerLocked || !gameStarted) return;

    if (health <= 0 && !isDeadRef.current) {
      isDeadRef.current = true;
      playerRuntime.alive = false;
      addDeath();
      deathTimerRef.current = window.setTimeout(() => {
        resetToSpawn();
        restorePlayer();
        playerRuntime.alive = true;
        isDeadRef.current = false;
        deathTimerRef.current = null;
      }, 1200);
    }

    if (isDeadRef.current) {
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      return;
    }

    if (inputState.aim !== useGameStore.getState().isAiming) {
      setAiming(inputState.aim);
    }

    const bodyTranslation = body.translation();
    playerRuntime.position.set(
      bodyTranslation.x,
      bodyTranslation.y,
      bodyTranslation.z,
    );
    const bounds = mapConfig.mapBounds;
    if (
      bodyTranslation.y < mapConfig.outOfBoundsY ||
      bodyTranslation.x < bounds.minX - playerConfig.boundsResetPadding ||
      bodyTranslation.x > bounds.maxX + playerConfig.boundsResetPadding ||
      bodyTranslation.z < bounds.minZ - playerConfig.boundsResetPadding ||
      bodyTranslation.z > bounds.maxZ + playerConfig.boundsResetPadding
    ) {
      resetToSpawn();
      return;
    }

    const linvel = body.linvel();
    velocityRef.current.set(linvel.x, linvel.y, linvel.z);
    horizontalVelocityRef.current.set(linvel.x, 0, linvel.z);

    const groundRay = new rapier.Ray(
      { x: bodyTranslation.x, y: bodyTranslation.y, z: bodyTranslation.z },
      down,
    );
    const groundHit = world.castRay(
      groundRay,
      playerConfig.groundCheckDistance + playerConfig.groundCheckTolerance,
      true,
      undefined,
      undefined,
      undefined,
      body,
    );

    wasGroundedRef.current = isGroundedRef.current;
    isGroundedRef.current =
      velocityRef.current.y <= 0.6 &&
      groundHit !== null &&
      groundHit.timeOfImpact <=
        playerConfig.groundCheckDistance + playerConfig.groundCheckTolerance;

    if (isGroundedRef.current && !wasGroundedRef.current) {
      lastLandingTimeRef.current = frameNow;
      horizontalVelocityRef.current.multiplyScalar(
        playerConfig.velocityPreservationOnLanding,
      );

      if (velocityRef.current.y < playerConfig.landingSoundVelocity) {
        gameAudio.play("land");
      }
    }

    const wantsCrouch = inputState.crouch;
    if (wantsCrouch && !isCrouchedRef.current) {
      isCrouchedRef.current = true;
      setIsColliderCrouched(true);
    } else if (!wantsCrouch && isCrouchedRef.current && hasHeadroom()) {
      isCrouchedRef.current = false;
      setIsColliderCrouched(false);
    }

    const activeCamera = cameraRef.current;
    const cameraQuaternion = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(pitchRef.current, yawRef.current, 0, "YXZ"),
    );
    activeCamera.quaternion.copy(cameraQuaternion);

    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();
    const wishDirection = new THREE.Vector3();

    forward.set(0, 0, -1).applyQuaternion(cameraQuaternion);
    forward.y = 0;
    forward.normalize();
    right.crossVectors(forward, threeUp).normalize();

    if (inputState.forward) wishDirection.add(forward);
    if (inputState.backward) wishDirection.sub(forward);
    if (inputState.right) wishDirection.add(right);
    if (inputState.left) wishDirection.sub(right);
    if (wishDirection.lengthSq() > 0) wishDirection.normalize();

    const horizontalVelocity = horizontalVelocityRef.current;
    const horizontalSpeed = horizontalVelocity.length();
    const onlyAirStrafing =
      !inputState.forward &&
      !inputState.backward &&
      (inputState.left || inputState.right);
    const bunnyhopGraceActive =
      isGroundedRef.current &&
      (frameNow - lastLandingTimeRef.current <
        playerConfig.landingFrictionDelayMs ||
        (inputState.jump &&
          frameNow - lastLandingTimeRef.current <
            playerConfig.bunnyhopFrictionSkipMs));

    bunnyhopGraceActiveRef.current = bunnyhopGraceActive;

    const crouchMultiplier = isCrouchedRef.current
      ? playerConfig.crouchSpeedMultiplier
      : 1;
    const adsMultiplier = inputState.aim
      ? defaultWeapon.adsMoveSpeedMultiplier
      : 1;
    const targetSpeed =
      playerConfig.walkSpeed * crouchMultiplier * adsMultiplier;
    const useAirMovement =
      !isGroundedRef.current ||
      bunnyhopGraceActive ||
      (playerConfig.autoJumpEnabled && inputState.jump);

    if (useAirMovement) {
      if (wishDirection.lengthSq() > 0) {
        if (onlyAirStrafing && horizontalSpeed > 0.1) {
          const currentDirection = horizontalVelocity.clone().normalize();
          wishDirection
            .multiplyScalar(playerConfig.strafeTurnInfluence)
            .addScaledVector(
              currentDirection,
              1 - playerConfig.strafeTurnInfluence,
            )
            .normalize();
        }

        const acceleration =
          onlyAirStrafing || (!inputState.forward && !inputState.backward)
            ? playerConfig.strafeAcceleration
            : playerConfig.airAcceleration;
        const wishSpeed = targetSpeed * playerConfig.airControl;

        accelerate(
          horizontalVelocity,
          wishDirection,
          wishSpeed,
          acceleration,
          dt,
        );
      }

      const drag = Math.max(0, 1 - playerConfig.airDrag * dt);
      horizontalVelocity.multiplyScalar(drag);

      const maxAirSpeed = inputState.jump
        ? playerConfig.maxAirStrafeSpeed
        : playerConfig.maxAirSpeed;
      const airSpeed = horizontalVelocity.length();
      if (airSpeed > maxAirSpeed) {
        horizontalVelocity.multiplyScalar(maxAirSpeed / airSpeed);
      }
    } else {
      const speed = horizontalVelocity.length();

      if (speed > 0.001) {
        const drop = speed * playerConfig.groundFriction * dt;
        horizontalVelocity.multiplyScalar(Math.max(speed - drop, 0) / speed);
      }

      if (wishDirection.lengthSq() > 0) {
        accelerate(
          horizontalVelocity,
          wishDirection,
          targetSpeed,
          playerConfig.groundAcceleration,
          dt,
        );
      }

      const walkSpeed = horizontalVelocity.length();
      if (walkSpeed > playerConfig.maxWalkSpeed) {
        horizontalVelocity.multiplyScalar(
          playerConfig.maxWalkSpeed / walkSpeed,
        );
      }
    }

    velocityRef.current.x = horizontalVelocity.x;
    velocityRef.current.z = horizontalVelocity.z;

    if (
      inputState.jump &&
      isGroundedRef.current &&
      !isCrouchedRef.current &&
      frameNow - lastJumpTimeRef.current > playerConfig.jumpCooldownMs
    ) {
      velocityRef.current.y = playerConfig.jumpForce;
      lastJumpTimeRef.current = frameNow;
      isGroundedRef.current = false;
      gameAudio.play("jump");
    } else if (
      isGroundedRef.current &&
      !bunnyhopGraceActive &&
      velocityRef.current.y < 0
    ) {
      velocityRef.current.y = playerConfig.groundedStickVelocity;
    }

    body.setLinvel(
      {
        x: velocityRef.current.x,
        y: velocityRef.current.y,
        z: velocityRef.current.z,
      },
      true,
    );

    const targetEyeHeight = isCrouchedRef.current
      ? playerConfig.crouchingEyeHeight
      : playerConfig.standingEyeHeight;
    currentEyeHeightRef.current = THREE.MathUtils.lerp(
      currentEyeHeightRef.current,
      targetEyeHeight,
      1 - Math.exp(-dt * playerConfig.crouchLerpSpeed),
    );

    const cameraFocus = new THREE.Vector3(
      bodyTranslation.x,
      bodyTranslation.y + currentEyeHeightRef.current,
      bodyTranslation.z,
    );
    playerRuntime.eyePosition.copy(cameraFocus);

    if (cameraMode === "thirdPerson") {
      const horizontalForward = forward.clone();
      horizontalForward.y = 0;
      if (horizontalForward.lengthSq() < 0.001) {
        horizontalForward.set(0, 0, -1).applyAxisAngle(threeUp, yawRef.current);
      }
      horizontalForward.normalize();

      const desiredCameraPosition = cameraFocus
        .clone()
        .addScaledVector(horizontalForward, -playerConfig.thirdPersonDistance)
        .add(new THREE.Vector3(0, playerConfig.thirdPersonHeight, 0));
      const cameraRayDirection = desiredCameraPosition.clone().sub(cameraFocus);
      const desiredDistance = cameraRayDirection.length();

      if (desiredDistance > 0.001) {
        cameraRayDirection.normalize();
        const cameraRay = new rapier.Ray(
          { x: cameraFocus.x, y: cameraFocus.y, z: cameraFocus.z },
          {
            x: cameraRayDirection.x,
            y: cameraRayDirection.y,
            z: cameraRayDirection.z,
          },
        );
        const cameraHit = world.castRay(
          cameraRay,
          desiredDistance,
          true,
          undefined,
          undefined,
          undefined,
          body,
        );

        if (cameraHit) {
          const clampedDistance = Math.max(
            playerConfig.thirdPersonMinDistance,
            cameraHit.timeOfImpact - playerConfig.thirdPersonCollisionPadding,
          );
          desiredCameraPosition.copy(cameraFocus).addScaledVector(
            cameraRayDirection,
            clampedDistance,
          );
        }
      }

      if (thirdPersonPositionRef.current.lengthSq() === 0) {
        thirdPersonPositionRef.current.copy(desiredCameraPosition);
      }
      thirdPersonPositionRef.current.lerp(
        desiredCameraPosition,
        1 - Math.exp(-dt * playerConfig.thirdPersonCameraLerpSpeed),
      );
      activeCamera.position.copy(thirdPersonPositionRef.current);
    } else {
      thirdPersonPositionRef.current.set(0, 0, 0);
      activeCamera.position.copy(cameraFocus);
    }

    const targetFov = inputState.aim
      ? defaultWeapon.adsFov
      : playerConfig.baseFov;
    if (activeCamera instanceof THREE.PerspectiveCamera) {
      activeCamera.fov = THREE.MathUtils.lerp(
        activeCamera.fov,
        targetFov,
        1 - Math.exp(-dt * playerConfig.fovLerpSpeed),
      );
      activeCamera.updateProjectionMatrix();
    }

    const speed = horizontalVelocity.length();
    if (playerVisualRef.current) {
      playerVisualRef.current.rotation.y = yawRef.current;
    }
    const nextPlayerAnimationState: CharacterAnimationState = isDeadRef.current
      ? "death"
      : !isGroundedRef.current
        ? "jump"
        : isCrouchedRef.current
          ? "crouch"
          : inputState.aim
            ? "aim"
            : speed > playerConfig.walkSpeed * 0.75
              ? "run"
              : speed > 1.5
              ? "walk"
                : "idle";

    if (nextPlayerAnimationState !== playerAnimationStateRef.current) {
      playerAnimationStateRef.current = nextPlayerAnimationState;
      setPlayerAnimationState(nextPlayerAnimationState);
    }

    if (isGroundedRef.current && speed > 2.1 && wishDirection.lengthSq() > 0) {
      const stepInterval = THREE.MathUtils.clamp(
        playerConfig.footstepBaseInterval - speed * 9,
        playerConfig.footstepMinInterval,
        playerConfig.footstepBaseInterval,
      );
      if (frameNow - lastFootstepTimeRef.current > stepInterval) {
        gameAudio.play("footstep");
        lastFootstepTimeRef.current = frameNow;
      }
    }

    if (
      frameNow - lastDebugTimeRef.current >
      playerConfig.debugUpdateInterval
    ) {
      setDebug({
        speed,
        grounded: isGroundedRef.current,
        bunnyhopGraceActive: bunnyhopGraceActiveRef.current,
        crouched: isCrouchedRef.current,
        fps: 1 / Math.max(delta, 0.0001),
        position: [bodyTranslation.x, bodyTranslation.y, bodyTranslation.z],
        velocity: [
          velocityRef.current.x,
          velocityRef.current.y,
          velocityRef.current.z,
        ],
        botCount: useGameStore.getState().botCount,
        health: useGameStore.getState().health,
        cameraMode: useGameStore.getState().cameraMode,
      });
      lastDebugTimeRef.current = frameNow;
    }

    if (inputState.reload && !reloadPressedRef.current) {
      startReload();
    }
    reloadPressedRef.current = inputState.reload;

    if (inputState.shoot && gameStarted && !isReloading) {
      if (ammo <= 0) {
        startReload();
        return;
      }

      if (!shootingSystemRef.current.canShoot(defaultWeapon)) return;

      consumeAmmo();
      gameAudio.play("shoot");
      setShowMuzzleFlash(true);
      window.setTimeout(() => setShowMuzzleFlash(false), 65);

      const hit = shootingSystemRef.current.shoot(
        activeCamera,
        defaultWeapon,
        collectShootables(),
        inputState.aim ? defaultWeapon.adsSpread : defaultWeapon.hipFireSpread,
      );

      if (hit) {
        onShot(hit);
        if (hit.objectType === "target") addScore(25);
      }
    }
  });

  return (
    <>
      <RigidBody
        ref={rigidBodyRef}
        type="dynamic"
        position={mapConfig.playerSpawn}
        colliders={false}
        friction={0}
        restitution={0}
        linearDamping={0}
        angularDamping={1}
        lockRotations
      >
        <group
          ref={playerVisualRef}
          visible={cameraMode === "thirdPerson"}
        >
          <PlayerModel
            src={modelPaths.player}
            animationState={playerAnimationState}
          />
        </group>
        <CapsuleCollider
          key={isColliderCrouched ? "crouched" : "standing"}
          args={[
            isColliderCrouched
              ? playerConfig.crouchingColliderHalfHeight
              : playerConfig.standingColliderHalfHeight,
            playerConfig.colliderRadius,
          ]}
          friction={0}
          restitution={0}
        />
      </RigidBody>
      <WeaponViewModel />
    </>
  );
}
