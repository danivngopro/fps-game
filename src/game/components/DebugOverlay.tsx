import { useGameStore } from "../store";

export function DebugOverlay() {
  const { debugVisible, debug, ammo, magazineSize, isReloading } = useGameStore();

  if (!debugVisible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "18px",
        right: "18px",
        width: "230px",
        padding: "12px",
        pointerEvents: "none",
        color: "#d7ffd7",
        background: "rgba(0, 0, 0, 0.58)",
        border: "1px solid rgba(90, 255, 90, 0.35)",
        fontFamily: "Consolas, monospace",
        fontSize: "13px",
        lineHeight: 1.5,
        textShadow: "0 1px 3px rgba(0,0,0,0.8)",
      }}
    >
      <div>F3 DEBUG</div>
      <div>speed: {debug.speed.toFixed(2)}</div>
      <div>grounded: {String(debug.grounded)}</div>
      <div>bhop grace: {String(debug.bunnyhopGraceActive)}</div>
      <div>crouched: {String(debug.crouched)}</div>
      <div>
        vel x/z: {debug.velocity[0].toFixed(2)}, {debug.velocity[2].toFixed(2)}
      </div>
      <div>
        ammo: {ammo}/{magazineSize} {isReloading ? "(reloading)" : ""}
      </div>
      <div>fps: {debug.fps.toFixed(0)}</div>
      <div>
        pos: {debug.position.map((value) => value.toFixed(1)).join(", ")}
      </div>
    </div>
  );
}
