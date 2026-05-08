import { useGameStore } from "../store";

export function Crosshair() {
  const showHitMarker = useGameStore((state) => state.showHitMarker);
  const isAiming = useGameStore((state) => state.isAiming);
  const isReloading = useGameStore((state) => state.isReloading);
  const lineOffset = isAiming ? 9 : 13;
  const lineLength = isAiming ? 8 : 12;

  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "30px",
        height: "30px",
        pointerEvents: "none",
        zIndex: 100,
      }}
    >
      {/* Crosshair circle */}
      <div
        style={{
          position: "absolute",
          width: "8px",
          height: "8px",
          border: "2px solid rgba(0, 255, 0, 0.7)",
          borderRadius: "50%",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* Crosshair lines */}
      <div
        style={{
          position: "absolute",
          width: `${lineLength}px`,
          height: "1px",
          background: "rgba(0, 255, 0, 0.5)",
          top: "50%",
          left: "50%",
          transform: `translateX(${lineOffset}px)`,
          transformOrigin: "left center",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: `${lineLength}px`,
          height: "1px",
          background: "rgba(0, 255, 0, 0.5)",
          top: "50%",
          right: "50%",
          transform: `translateX(-${lineOffset}px)`,
          transformOrigin: "right center",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "1px",
          height: `${lineLength}px`,
          background: "rgba(0, 255, 0, 0.5)",
          left: "50%",
          top: "50%",
          transform: `translateY(${lineOffset}px)`,
          transformOrigin: "center top",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "1px",
          height: `${lineLength}px`,
          background: "rgba(0, 255, 0, 0.5)",
          left: "50%",
          bottom: "50%",
          transform: `translateY(-${lineOffset}px)`,
          transformOrigin: "center bottom",
        }}
      />

      {/* Hit marker */}
      {showHitMarker && (
        <div
          style={{
            position: "absolute",
            width: "15px",
            height: "15px",
            border: "2px solid #ff6b6b",
            borderRadius: "50%",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            animation: "ping 0.1s ease-out",
          }}
        />
      )}

      {isReloading && (
        <div
          style={{
            position: "absolute",
            top: "38px",
            left: "50%",
            transform: "translateX(-50%)",
            color: "rgba(0, 255, 0, 0.75)",
            fontFamily: "Arial, sans-serif",
            fontSize: "11px",
            fontWeight: "bold",
            letterSpacing: 0,
            whiteSpace: "nowrap",
          }}
        >
          RELOAD
        </div>
      )}

      <style>{`
        @keyframes ping {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
