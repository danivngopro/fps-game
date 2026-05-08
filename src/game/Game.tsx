import {
  createRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useFrame } from "@react-three/fiber";
import { Map as ArenaMap } from "./components/Map";
import { PlayerController } from "./components/PlayerController";
import { BulletImpacts } from "./components/BulletImpact";
import { DesertSky } from "./components/DesertSky";
import { BotEnemy, type BotEnemyHandle } from "./components/BotEnemy";
import { useGameStore } from "./store";
import { botConfigs } from "./config/bots";
import { defaultWeapon } from "./config/weapons";
import { gameAudio } from "./systems/audio";
import type { BulletImpactData, RaycastHit } from "./types";
import type { TargetDummyHandle } from "./components/TargetDummy";

export function Game() {
  const nextImpactIdRef = useRef(1);
  const [bulletImpacts, setBulletImpacts] = useState<BulletImpactData[]>([]);
  const targetRefs = useMemo(() => {
    return new globalThis.Map<string, RefObject<TargetDummyHandle | null>>();
  }, []);
  const botRefs = useMemo(() => {
    const refs = new globalThis.Map<string, RefObject<BotEnemyHandle | null>>();

    botConfigs.forEach((config) => {
      refs.set(config.id, createRef<BotEnemyHandle>());
    });

    return refs;
  }, []);
  const { addKill, addScore, setShowHitMarker, tickMatch, setBotCount } =
    useGameStore();

  useFrame((_, delta) => {
    const state = useGameStore.getState();
    if (state.gameStarted && state.matchTimeRemaining > 0) {
      tickMatch(delta);
    }
  });

  useEffect(() => {
    setBotCount(botConfigs.length);
  }, [setBotCount]);

  const handleShot = useCallback(
    (hit: RaycastHit) => {
      if (hit.objectType === "target" && hit.targetId) {
        const targetRef = targetRefs.get(hit.targetId);
        targetRef?.current?.takeDamage(defaultWeapon.damage);
        gameAudio.play("targetHit");
        setShowHitMarker(true);
        window.setTimeout(() => setShowHitMarker(false), 100);
        return;
      }

      if (hit.objectType === "bot" && hit.botId) {
        const botRef = botRefs.get(hit.botId);
        botRef?.current?.takeDamage(defaultWeapon.damage);
        gameAudio.play("targetHit");
        setShowHitMarker(true);
        window.setTimeout(() => setShowHitMarker(false), 100);
        return;
      }

      setBulletImpacts((current) => {
        const next = [
          ...current,
          {
            id: nextImpactIdRef.current,
            point: hit.point,
            normal: hit.normal,
            surfaceType: hit.materialType ?? "concrete",
          },
        ];

        nextImpactIdRef.current += 1;
        return next.slice(-100);
      });
    },
    [botRefs, setShowHitMarker, targetRefs],
  );

  return (
    <>
      <DesertSky />
      <ArenaMap />
      <BulletImpacts impacts={bulletImpacts} />

      {botConfigs.map((config) => (
        <BotEnemy
          key={config.id}
          ref={botRefs.get(config.id)}
          config={config}
          onDeath={(botConfig) => {
            addKill();
            addScore(botConfig.scoreValue);
          }}
        />
      ))}

      <PlayerController onShot={handleShot} targetRefs={targetRefs} />

      <ambientLight intensity={0.6} />
      <directionalLight
        position={[50, 50, 50]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={200}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />
      <pointLight position={[0, 10, 0]} intensity={0.3} />
    </>
  );
}
