import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// Full-screen liquid-metal spread shader.
// - fbm-perturbed radial front expands from uOrigin
// - inside the front we mix two purples using a slow flow field
// - subtle chromatic aberration at the edge sells the "metallic liquid" feel
const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform vec2  uOrigin;      // in aspect-corrected space (x scaled by aspect)
  uniform float uAspect;
  uniform float uTime;
  uniform float uProgress;    // 0..1 fill progress (eased outside)
  uniform float uAlpha;       // 0..1 global fade after fill
  uniform float uMaxDist;

  // hash + value noise + fbm
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vnoise(vec2 p){
    vec2 i = floor(p); vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f*f*(3.0-2.0*f);
    return mix(a,b,u.x) + (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;
  }
  float fbm(vec2 p){
    float v = 0.0; float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * vnoise(p);
      p = p * 2.02 + vec2(13.1, 7.7);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 p = vec2(vUv.x * uAspect, vUv.y);
    float d = distance(p, uOrigin);

    // Reach slightly beyond the far corner so the edge feathering finishes
    // fully covering before uProgress hits 1.
    float R = uProgress * uMaxDist * 1.15;

    // Multi-octave noise displaces the radius → wobbly liquid front.
    float n1 = fbm(p * 2.4 + uTime * 0.18);
    float n2 = fbm(p * 6.0 - uTime * 0.32);
    float wob = (n1 - 0.5) * 0.14 + (n2 - 0.5) * 0.05;
    float edge = smoothstep(R + 0.02, R - 0.05, d + wob);

    // Inside color: two purples flowing via a slow field.
    float flow = fbm(p * 3.0 + vec2(uTime * 0.25, -uTime * 0.15));
    vec3 deep = vec3(0.227, 0.122, 0.478);   // #3a1f7a
    vec3 light = vec3(0.773, 0.663, 1.000);  // #C5A9FF
    vec3 col = mix(deep, light, smoothstep(0.35, 0.75, flow));

    // Specular streak: high-frequency ridged highlight tumbling across.
    float spec = pow(1.0 - abs(flow - 0.55) * 2.2, 6.0);
    col += vec3(1.0, 0.95, 1.0) * spec * 0.35;

    // Chromatic aberration at the leading edge: brighten in a thin band.
    float band = smoothstep(0.10, 0.0, abs(d + wob - R));
    col += vec3(0.35, 0.20, 0.55) * band * 0.6;

    float a = edge * uAlpha;
    gl_FragColor = vec4(col, a);
  }
`;

function BurstPlane({
  origin,
  onCovered,
  onFaded,
  onProgress,
  spreadMs,
  fadeMs,
}: {
  origin: [number, number];
  onCovered: () => void;
  onFaded: () => void;
  onProgress?: (p: number) => void;
  spreadMs: number;
  fadeMs: number;
}) {
  const { size } = useThree();
  const uniforms = useMemo(
    () => ({
      uOrigin: { value: new THREE.Vector2(origin[0], origin[1]) },
      uAspect: { value: 1 },
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uAlpha: { value: 1 },
      uMaxDist: { value: 1.5 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const startedRef = useRef<number | null>(null);
  const coveredRef = useRef(false);
  const fadedRef = useRef(false);
  const coveredAtRef = useRef<number | null>(null);

  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height);
    uniforms.uAspect.value = aspect;
    // Origin in aspect-corrected space: x is scaled by aspect.
    uniforms.uOrigin.value.set(origin[0] * aspect, origin[1]);
    // Furthest corner distance from origin.
    const ox = origin[0] * aspect;
    const oy = origin[1];
    const corners = [
      [0, 0],
      [aspect, 0],
      [0, 1],
      [aspect, 1],
    ];
    let maxD = 0;
    for (const [cx, cy] of corners) {
      const d = Math.hypot(cx - ox, cy - oy);
      if (d > maxD) maxD = d;
    }
    uniforms.uMaxDist.value = maxD;
  }, [size.width, size.height, origin, uniforms]);

  useFrame((state) => {
    const now = state.clock.getElapsedTime() * 1000;
    if (startedRef.current == null) startedRef.current = now;
    const t = now - startedRef.current;
    uniforms.uTime.value = now / 1000;

    // Ease-out cubic on the spread.
    const rawP = Math.min(1, t / spreadMs);
    const p = 1 - Math.pow(1 - rawP, 3);
    uniforms.uProgress.value = p;
    onProgress?.(p);

    if (rawP >= 1 && !coveredRef.current) {
      coveredRef.current = true;
      coveredAtRef.current = now;
      onCovered();
    }

    if (coveredAtRef.current != null) {
      const ft = now - coveredAtRef.current;
      const fp = Math.min(1, ft / fadeMs);
      // easeInOutQuad
      const fe = fp < 0.5 ? 2 * fp * fp : 1 - Math.pow(-2 * fp + 2, 2) / 2;
      uniforms.uAlpha.value = 1 - fe;
      if (fp >= 1 && !fadedRef.current) {
        fadedRef.current = true;
        onFaded();
      }
    }
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        depthTest={false}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
      />
    </mesh>
  );
}

export function LiquidBurst({
  origin,
  onCovered,
  onFaded,
  onProgress,
  spreadMs = 1000,
  fadeMs = 250,
}: {
  origin: [number, number];
  onCovered: () => void;
  onFaded: () => void;
  onProgress?: (p: number) => void;
  spreadMs?: number;
  fadeMs?: number;
}) {
  return (
    <div
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: 55 }}
      aria-hidden
    >
      <Canvas
        orthographic
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true, premultipliedAlpha: false }}
        style={{ width: "100%", height: "100%", background: "transparent" }}
      >
        <BurstPlane
          origin={origin}
          onCovered={onCovered}
          onFaded={onFaded}
          onProgress={onProgress}
          spreadMs={spreadMs}
          fadeMs={fadeMs}
        />
      </Canvas>
    </div>
  );
}

export default LiquidBurst;