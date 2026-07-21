import { useRef } from "react";
import type React from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial } from "@react-three/drei";
import type { Mesh } from "three";

type OrbProps = { exiting: boolean; onExited?: () => void };

function Orb({ exiting, onExited }: OrbProps) {
  const ref = useRef<Mesh>(null);
  // MeshDistortMaterial doesn't ship a clean type for the distort uniform;
  // access it loosely to drive the exit animation.
  const matRef = useRef<any>(null);
  const exitT = useRef(0);
  const doneRef = useRef(false);
  useFrame((_, dt) => {
    const m = ref.current;
    if (!m) return;
    m.rotation.y += dt * 0.3;
    m.rotation.x += dt * 0.1;
    if (exiting) {
      // Short "charge" — orb tightens slightly and distort spikes as it
      // hands off to the full-screen liquid burst layer.
      exitT.current = Math.min(1, exitT.current + dt / 0.22);
      const t = exitT.current;
      const e = 1 - Math.pow(1 - t, 3);
      const scale = 1 - e * 0.18;
      m.scale.setScalar(scale);
      if (matRef.current) {
        matRef.current.distort = 0.45 + e * 0.55;
        matRef.current.opacity = 1 - e * 0.85;
      }
      if (t >= 1 && !doneRef.current) {
        doneRef.current = true;
        onExited?.();
      }
    }
  });
  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[1, 64]} />
      <MeshDistortMaterial
        ref={matRef}
        color="#C5A9FF"
        metalness={0.85}
        roughness={0.2}
        envMapIntensity={0}
        distort={0.45}
        speed={1.6}
        transparent
      />
    </mesh>
  );
}

export function LiquidMetalOrb({
  onClick,
  exiting = false,
  onExited,
}: {
  onClick?: (e: React.MouseEvent) => void;
  exiting?: boolean;
  onExited?: () => void;
}) {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
        preserveDrawingBuffer: false,
        failIfMajorPerformanceCaveat: false,
      }}
      frameloop="always"
      camera={{ position: [0, 0, 2.6], fov: 45 }}
      onClick={onClick}
      style={{
        background: "transparent",
        width: "100%",
        height: "100%",
        cursor: exiting ? "default" : "pointer",
        touchAction: "none",
      }}
    >
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 4, 5]} intensity={1.4} />
      <directionalLight position={[-4, -2, -3]} intensity={0.6} color="#B79BFF" />
      <pointLight position={[0, 0, 3]} intensity={0.5} color="#ffffff" />
      <Orb exiting={exiting} onExited={onExited} />
    </Canvas>
  );
}

export default LiquidMetalOrb;