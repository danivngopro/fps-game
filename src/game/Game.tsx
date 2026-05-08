import { createRef, useMemo, useState, useCallback } from "react";
import { Map as ArenaMap } from "./components/Map";
import { TargetDummy } from "./components/TargetDummy";
import { PlayerController } from "./components/PlayerController";
import { useGameStore } from "./store";
import { mapConfig } from "./config/map";
import { defaultWeapon } from "./config/weapons";
import type { TargetDummyHandle } from "./components/TargetDummy";
import type { RaycastHit } from "./types";

interface TargetInstance {
  id: string;
  spawnIndex: number;
  alive: boolean;
}

export function Game() {
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
      React.RefObject<TargetDummyHandle | null>
    >();

    mapConfig.targetDummySpawns.forEach((_, idx) => {
      refs.set(`target-${idx}`, createRef<TargetDummyHandle>());
    });

    return refs;
  }, []);
  const { addKill, addScore, setShowHitMarker } = useGameStore();

  // Handle target death and respawn
  const handleTargetDeath = useCallback(
    (targetId: string) => {
      addKill();
      addScore(100);

      // Respawn after delay
      setTimeout(() => {
        setTargets((prev) =>
          prev.map((t) => (t.id === targetId ? { ...t, alive: true } : t)),
        );
      }, 2000);

      setTargets((prev) =>
        prev.map((t) => (t.id === targetId ? { ...t, alive: false } : t)),
      );
    },
    [addKill, addScore],
  );

  // Handle shot
  const handleShot = useCallback((hit: RaycastHit) => {
    // Deal damage to the target
    if (hit.targetId) {
      const targetRef = targetRefs.get(hit.targetId);
      if (targetRef?.current) {
        targetRef.current.takeDamage(defaultWeapon.damage);
      }
    }

    // Show hit marker
    setShowHitMarker(true);
    setTimeout(() => {
      setShowHitMarker(false);
    }, 100);
  }, [setShowHitMarker, targetRefs]);

  // Get alive targets for rendering
  const aliveTargets = targets.filter((target) => target.alive);

  return (
    <>
      <ArenaMap />

      {/* Render alive targets */}
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

      {/* Player controller and camera */}
      <PlayerController
        onShot={handleShot}
        targetRefs={targetRefs}
      />

      {/* Lighting */}
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
