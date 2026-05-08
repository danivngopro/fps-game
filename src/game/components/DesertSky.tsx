export function DesertSky() {
  return (
    <>
      <color attach="background" args={["#8ec8ff"]} />
      <fog attach="fog" args={["#d9bd82", 75, 170]} />
      <hemisphereLight
        args={["#bfe5ff", "#c79752", 0.55]}
        position={[0, 60, 0]}
      />
    </>
  );
}
