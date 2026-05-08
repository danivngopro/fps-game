import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  CapsuleCollider,
  RigidBody,
  useRapier,
  type RapierRigidBody,
} from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { playerRuntime } from "../systems/playerRuntime";
import { gameAudio } from "../systems/audio";
import { useGameStore } from "../store";
import { modelPaths } from "../config/models";
import { BotModel } from "./models/BotModel";
import type { CharacterAnimationState } from "./models/AnimatedCharacterModel";
import type { BotConfig } from "../types";

interface BotEnemyProps {
  config: BotConfig;
  onDeath: (config: BotConfig) => void;
}

export interface BotEnemyHandle {
  takeDamage: (damage: number) => void;
  getHp: () => number;
  isAlive: () => boolean;
}

const botEyeOffset = new THREE.Vector3(0, 1.2, 0);

export const BotEnemy = forwardRef<BotEnemyHandle, BotEnemyProps>(
  ({ config, onDeath }, ref) => {
    const { rapier, world } = useRapier();
    const bodyRef = useRef<RapierRigidBody>(null);
    const meshRef = useRef<THREE.Group>(null);
    const hpRef = useRef(config.maxHp);
    const aliveRef = useRef(true);
    const waypointIndexRef = useRef(1);
    const lastShotTimeRef = useRef(0);
    const respawnTimerRef = useRef<number | null>(null);
    const hitFlashRef = useRef(0);
    const animationStateRef = useRef<CharacterAnimationState>("walk");
    const [alive, setAlive] = useState(true);
    const [animationState, setAnimationState] =
      useState<CharacterAnimationState>("walk");
    const damagePlayer = useGameStore((state) => state.damagePlayer);
    const setDamageFlash = useGameStore((state) => state.setDamageFlash);

    const respawn = () => {
      hpRef.current = config.maxHp;
      aliveRef.current = true;
      waypointIndexRef.current = 1;
      setAlive(true);
      bodyRef.current?.setTranslation(
        { x: config.spawn[0], y: config.spawn[1], z: config.spawn[2] },
        true,
      );
      bodyRef.current?.setLinvel({ x: 0, y: 0, z: 0 }, true);
    };

    useImperativeHandle(ref, () => ({
      takeDamage: (damage: number) => {
        if (!aliveRef.current) return;

        hpRef.current = Math.max(0, hpRef.current - damage);
        hitFlashRef.current = 0.12;

        if (hpRef.current <= 0) {
          aliveRef.current = false;
          setAlive(false);
          onDeath(config);
          bodyRef.current?.setLinvel({ x: 0, y: 0, z: 0 }, true);
          bodyRef.current?.setTranslation(
            { x: config.spawn[0], y: -40, z: config.spawn[2] },
            true,
          );

          if (respawnTimerRef.current !== null) {
            window.clearTimeout(respawnTimerRef.current);
          }
          respawnTimerRef.current = window.setTimeout(() => {
            respawn();
            respawnTimerRef.current = null;
          }, config.respawnMs);
        }
      },
      getHp: () => hpRef.current,
      isAlive: () => aliveRef.current,
    }));

    useEffect(() => {
      return () => {
        if (respawnTimerRef.current !== null) {
          window.clearTimeout(respawnTimerRef.current);
        }
      };
    }, []);

    useEffect(() => {
      meshRef.current?.traverse((object) => {
        object.userData = {
          ...object.userData,
          shootable: true,
          objectType: "bot",
          botId: config.id,
          surfaceType: "target",
        };
      });
    }, [config.id]);

    useFrame((_, delta) => {
      const body = bodyRef.current;
      const mesh = meshRef.current;
      if (!body || !mesh) return;

      mesh.visible = alive;

      if (hitFlashRef.current > 0) {
        hitFlashRef.current = Math.max(0, hitFlashRef.current - delta);
      }

      const materialIntensity = hitFlashRef.current > 0 ? 0.8 : 0;
      mesh.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];

          materials.forEach((material) => {
            if ("emissive" in material && material.emissive instanceof THREE.Color) {
              material.emissive.set(
                materialIntensity > 0 ? "#ff3333" : "#000000",
              );
            }
            if ("emissiveIntensity" in material) {
              material.emissiveIntensity = materialIntensity;
            }
          });
        }
      });

      if (!aliveRef.current) return;

      const translation = body.translation();
      const currentPosition = new THREE.Vector3(
        translation.x,
        translation.y,
        translation.z,
      );
      const waypoint = new THREE.Vector3(
        ...config.patrolWaypoints[waypointIndexRef.current],
      );
      const toWaypoint = waypoint.clone().sub(currentPosition);
      toWaypoint.y = 0;

      if (toWaypoint.length() < 0.55) {
        waypointIndexRef.current =
          (waypointIndexRef.current + 1) % config.patrolWaypoints.length;
      } else {
        const moveDirection = toWaypoint.normalize();
        body.setLinvel(
          {
            x: moveDirection.x * config.moveSpeed,
            y: 0,
            z: moveDirection.z * config.moveSpeed,
          },
          true,
        );
        mesh.rotation.y = Math.atan2(moveDirection.x, moveDirection.z);
      }

      const botEye = currentPosition.clone().add(botEyeOffset);
      const toPlayer = playerRuntime.eyePosition.clone().sub(botEye);
      const playerDistance = toPlayer.length();

      if (playerDistance > config.detectionRange || !playerRuntime.alive) {
        return;
      }

      const rayDirection = toPlayer.normalize();
      const ray = new rapier.Ray(
        { x: botEye.x, y: botEye.y, z: botEye.z },
        { x: rayDirection.x, y: rayDirection.y, z: rayDirection.z },
      );
      const hit = world.castRay(
        ray,
        playerDistance,
        true,
        undefined,
        undefined,
        undefined,
        body,
      );
      const hasLineOfSight = hit === null || hit.timeOfImpact >= playerDistance - 0.35;

      if (!hasLineOfSight) return;

      const now = performance.now();
      if (now - lastShotTimeRef.current < config.fireRateMs) return;

      lastShotTimeRef.current = now;
      if (animationStateRef.current !== "shoot") {
        animationStateRef.current = "shoot";
        setAnimationState("shoot");
        window.setTimeout(() => {
          if (aliveRef.current && animationStateRef.current === "shoot") {
            animationStateRef.current = "walk";
            setAnimationState("walk");
          }
        }, 240);
      }
      gameAudio.play("shoot");

      if (Math.random() <= config.accuracy) {
        damagePlayer(config.damage);
        window.setTimeout(() => setDamageFlash(false), 120);
      }
    });

    return (
      <RigidBody
        ref={bodyRef}
        type="dynamic"
        position={config.spawn}
        colliders={false}
        lockRotations
        friction={0.6}
        restitution={0}
        linearDamping={1.2}
      >
        <CapsuleCollider args={[0.55, 0.45]} friction={0.5} restitution={0} />
        <group ref={meshRef} visible={alive}>
          <BotModel
            src={modelPaths.bot}
            botId={config.id}
            animationState={alive ? animationState : "death"}
          />
        </group>
      </RigidBody>
    );
  },
);
