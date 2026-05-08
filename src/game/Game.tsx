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
import { TargetDummy } from "./components/TargetDummy";
import { PlayerController } from "./components/PlayerController";
import { BulletImpacts } from "./components/BulletImpact";
import { DesertSky } from "./components/DesertSky";
import { BotEnemy, type BotEnemyHandle } from "./components/BotEnemy";
import { useGameStore } from "./store";
import { mapConfig } from "./config/map";
import { botConfigs } from "./config/bots";
import { defaultWeapon } from "./config/weapons";
import { gameAudio } from "./systems/audio";
import type { TargetDummyHandle } from "./components/TargetDummy";
import type { BulletImpactData, RaycastHit } from "./types";

interface TargetInstance {
  id: string;
  spawnIndex: number;
  alive: boolean;
}

export function Game() {
  const nextImpactIdRef = useRef(1);
  const [bulletImpacts, setBulletImpacts] = useState<BulletImpactData[]>([]);
  const [targets, setTargets] = useState<TargetInstance[]>(() =>
    mapConfig.targetDummySpawns.map((_, idx) => ({
      id: `target-${idx}`,
      spawnIndex: idx,
      alive: true,
    })),
  );
  const targetRefs = useMemo(() => {
    const refs = new globalThis.Map<
      string,
      RefObject<TargetDummyHandle | null>
    >();

    mapConfig.targetDummySpawns.forEach((_, idx) => {
      refs.set(`target-${idx}`, createRef<TargetDummyHandle>());
    });

    return refs;
  }, []);
  const botRefs = useMemo(() => {
    const refs = new globalThis.Map<string, RefObject<BotEnemyHandle | null>>();

    botConfigs.forEach((config) => {
      refs.set(config.id, createRef<BotEnemyHandle>());
    });

    return refs;
  }, []);
  const {
    addKill,
    addScore,
    setShowHitMarker,
    tickMatch,
    setBotCount,
  } = useGameStore();

  useFrame((_, delta) => {
    const state = useGameStore.getState();
    if (state.gameStarted && state.matchTimeRemaining > 0) {
      tickMatch(delta);
    }
  });

  useEffect(() => {
    setBotCount(botConfigs.length);
  }, [setBotCount]);

  const handleTargetDeath = useCallback(
    (targetId: string) => {
      addKill();
      addScore(100);

      setTargets((prev) =>
        prev.map((target) =>
          target.id === targetId ? { ...target, alive: false } : target,
        ),
      );

      window.setTimeout(() => {
        setTargets((prev) =>
          prev.map((target) =>
            target.id === targetId ? { ...target, alive: true } : target,
          ),
        );
      }, 2000);
    },
    [addKill, addScore],
  );

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

  const aliveTargets = targets.filter((target) => target.alive);

  return (
    <>
      <DesertSky />
      <ArenaMap />
      <BulletImpacts impacts={bulletImpacts} />

      {aliveTargets.map((target) => (
        <TargetDummy
          key={target.id}
          ref={targetRefs.get(target.id)}
          id={target.id}
          position={mapConfig.targetDummySpawns[target.spawnIndex]}
          maxHp={50}
          onDeath={() => handleTargetDeath(target.id)}
          onHit={() => undefined}
        />
      ))}

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
