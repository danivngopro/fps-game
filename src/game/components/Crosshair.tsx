import { useGameStore } from "../store";

export function Crosshair() {
  const showHitMarker = useGameStore((state) => state.showHitMarker);
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
          width: "12px",
          height: "1px",
          background: "rgba(0, 255, 0, 0.5)",
          top: "50%",
          left: "50%",
          transform: "translateX(-50%)",
          transformOrigin: "left center",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "12px",
          height: "1px",
          background: "rgba(0, 255, 0, 0.5)",
          top: "50%",
          right: "50%",
          transform: "translateX(50%)",
          transformOrigin: "right center",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "1px",
          height: "12px",
          background: "rgba(0, 255, 0, 0.5)",
          left: "50%",
          top: "50%",
          transform: "translateY(-50%)",
          transformOrigin: "center top",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "1px",
          height: "12px",
          background: "rgba(0, 255, 0, 0.5)",
          left: "50%",
          bottom: "50%",
          transform: "translateY(50%)",
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

      <style>{`
        @keyframes ping {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
