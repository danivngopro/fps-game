import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Game } from "./game/Game";
import { HUD } from "./game/components/HUD";
import { Crosshair } from "./game/components/Crosshair";
import "./App.css";

function App() {
  return (
    <div className="app-container">
      <Canvas
        camera={{ position: [0, 5, 0], fov: 75 }}
        style={{
          width: "100vw",
          height: "100vh",
          display: "block",
        }}
        shadows
      >
        <Physics
          gravity={[0, -9.8, 0]}
          debug={false}
          timeStep="vary"
        >
          <Game />
        </Physics>
      </Canvas>

      {/* Render UI outside of canvas */}
      <HUD />
      <Crosshair />
    </div>
  );
}

export default App;
