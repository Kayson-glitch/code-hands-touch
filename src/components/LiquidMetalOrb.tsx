import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial, Environment } from "@react-three/drei";
import type { Mesh } from "three";

function Orb() {
  const ref = useRef<Mesh>(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.y += dt * 0.3;
    ref.current.rotation.x += dt * 0.1;
  });
  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[1, 64]} />
      {/* @ts-expect-error drei material props */}
      <MeshDistortMaterial
        color="#C5A9FF"
        metalness={0.9}
        roughness={0.15}
        distort={0.45}
        speed={1.6}
      />
    </mesh>
  );
}

export function LiquidMetalOrb() {
  if (typeof window !== "undefined" && !("WebGLRenderingContext" in window)) {
    return null;
  }
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true }}
      camera={{ position: [0, 0, 2.6], fov: 45 }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 3, 3]} intensity={1.2} />
      <Environment preset="studio" />
      <Orb />
    </Canvas>
  );
}

export default LiquidMetalOrb;