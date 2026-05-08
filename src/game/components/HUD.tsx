import { useGameStore } from "../store";

export function HUD() {
  const {
    health,
    maxHealth,
    ammo,
    magazineSize,
    kills,
    score,
    gameStarted,
    isReloading,
    isAiming,
    cameraMode,
  } = useGameStore();

  const healthPercent = (health / maxHealth) * 100;
  const ammoPercent = (ammo / magazineSize) * 100;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: "none",
        fontFamily: "Arial, sans-serif",
        color: "rgba(0, 255, 0, 0.8)",
        textShadow: "0 0 10px rgba(0, 255, 0, 0.5)",
      }}
    >
      <div
        style={{
          position: "fixed",
          top: "20px",
          left: "20px",
          fontSize: "18px",
          fontWeight: "bold",
        }}
      >
        <div>KILLS: {kills}</div>
        <div>SCORE: {score}</div>
      </div>

      <div
        style={{
          position: "fixed",
          bottom: "96px",
          left: "20px",
          fontSize: "16px",
          lineHeight: 1.35,
        }}
      >
        <div>
          {isReloading ? "RELOADING" : "AMMO"}: {ammo} / {magazineSize}
        </div>
        <div>{isAiming ? "ADS" : "HIP FIRE"}</div>
        <div>{cameraMode === "thirdPerson" ? "THIRD PERSON" : "FIRST PERSON"}</div>
        <div
          style={{
            width: "150px",
            height: "8px",
            background: "rgba(0, 0, 0, 0.5)",
            border: "1px solid rgba(0, 255, 0, 0.8)",
            marginTop: "5px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${ammoPercent}%`,
              height: "100%",
              background: ammoPercent > 30 ? "#00ff00" : "#ff6b6b",
              transition: "width 0.1s",
            }}
          />
        </div>
      </div>

      <div
        style={{
          position: "fixed",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: "16px",
          textAlign: "center",
        }}
      >
        <div>
          HEALTH: {health} / {maxHealth}
        </div>
        <div
          style={{
            width: "200px",
            height: "12px",
            background: "rgba(0, 0, 0, 0.5)",
            border: "1px solid rgba(0, 255, 0, 0.8)",
            marginTop: "5px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${healthPercent}%`,
              height: "100%",
              background: healthPercent > 40 ? "#00ff00" : "#ff6b6b",
              transition: "width 0.05s",
            }}
          />
        </div>
      </div>

      {!gameStarted && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            fontSize: "32px",
            fontWeight: "bold",
            animation: "blink 1s infinite",
          }}
        >
          <div>CLICK TO PLAY</div>
          <div style={{ fontSize: "18px", marginTop: "20px" }}>
            WASD move | SPACE jump | SHIFT crouch | RMB aim | LMB shoot | R reload | V camera
          </div>
        </div>
      )}

      <style>{`
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
