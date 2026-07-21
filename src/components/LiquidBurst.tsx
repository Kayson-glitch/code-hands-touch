import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Full-screen ink burst — WebGL shader rebuild.
 *
 * A single full-screen quad runs a fragment shader that computes:
 *   - organic ink mask via layered value noise on a signed distance field
 *   - white rim just outside the mask edge
 *   - true chromatic aberration by sampling the mask at offset UVs for R/B
 *   - mid-spread horizontal scanline glitch on the outside rim only
 */

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uProgress;
  uniform vec2  uOrigin;      // in aspect-space (uv * vec2(aspect,1))
  uniform vec2  uResolution;
  uniform float uAspect;

  // hash / value noise
  float hash(vec2 p){
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float vnoise(vec2 p){
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f*f*(3.0-2.0*f);
    return mix(a,b,u.x) + (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;
  }
  float fbm(vec2 p){
    float v = 0.0;
    float a = 0.5;
    for(int i=0;i<4;i++){
      v += a * vnoise(p);
      p *= 2.02;
      a *= 0.5;
    }
    return v;
  }

  // returns ink coverage in [0,1] at aspect-space point q
  float inkMask(vec2 q, float radius){
    vec2 d = q - uOrigin;
    float dist = length(d);
    float ang = atan(d.y, d.x);
    // low-freq lobes (pseudopods) grow as burst matures
    float lobes = 2.0 + floor(uProgress * 2.5);
    float lobe = sin(ang * lobes + uTime * 0.4) * 0.5;
    // layered noise on a domain rotating with time
    vec2 np = d * (2.2 + uProgress * 1.2) + vec2(uTime * 0.15, -uTime * 0.11);
    float n = fbm(np) - 0.5;
    float n2 = fbm(np * 2.7 + 3.1) - 0.5;
    float rough = 0.16 + (1.0 - clamp(uProgress,0.0,1.0)) * 0.22;
    float displaced = dist + (lobe * 0.55 + n * 0.6 + n2 * 0.2) * rough * radius;
    float feather = mix(0.020, 0.008, clamp(uProgress,0.0,1.0));
    return smoothstep(radius + feather, radius - feather, displaced);
  }

  void main(){
    vec2 uv = vUv;
    vec2 q = vec2(uv.x * uAspect, uv.y);

    // max radius from origin to farthest corner in aspect-space
    float maxR = 0.0;
    maxR = max(maxR, length(vec2(0.0,0.0) - uOrigin));
    maxR = max(maxR, length(vec2(uAspect,0.0) - uOrigin));
    maxR = max(maxR, length(vec2(0.0,1.0) - uOrigin));
    maxR = max(maxR, length(vec2(uAspect,1.0) - uOrigin));
    float pVisible = max(uProgress, 0.012);
    float radius = pVisible * (maxR + 0.15);

    // chromatic aberration offset — grows with progress, rotates slowly
    float ab = (0.006 + uProgress * 0.014);
    float ang = uTime * 0.5;
    vec2 off = vec2(cos(ang), sin(ang)) * ab;

    float mR = inkMask(q + off, radius);
    float mG = inkMask(q,       radius);
    float mB = inkMask(q - off, radius);

    // scanline glitch — only outside the core (mR small), mid-progress only
    float glitchWin = smoothstep(0.12,0.2,uProgress) * (1.0 - smoothstep(0.78,0.88,uProgress));
    float row = floor(uv.y * 90.0);
    float t8  = floor(uTime * 9.0);
    float g   = hash(vec2(row, t8));
    float glitchAmt = step(0.86, g) * glitchWin * 0.02;
    vec2 qG = q + vec2(glitchAmt * (g - 0.5) * 2.0, 0.0);
    float mGlitchC = inkMask(qG + off * 1.5, radius);
    float mGlitchM = inkMask(qG - off * 1.5, radius);

    // Visible edge system: black liquid core + cream rim + RGB split outside.
    // The previous shader only made the black core opaque, which can disappear
    // over dark video frames; this explicit outer halo keeps the burst readable.
    float innerRim = clamp(mG - inkMask(q, radius * 0.972), 0.0, 1.0);
    float outerA = inkMask(q + off * 0.35, radius + 0.026 + uProgress * 0.01);
    float outerB = inkMask(q - off * 0.35, radius + 0.034 + uProgress * 0.012);
    float outerRim = clamp(max(outerA, outerB) - mG, 0.0, 1.0);
    float rim = pow(max(innerRim, outerRim), 0.72);

    vec3 col = vec3(0.0);
    col += vec3(0.98, 0.95, 0.86) * rim * 0.95;

    // Fringes: compare shifted masks against the core and halo so color is
    // visible just outside the black mass instead of being hidden inside it.
    float fringeR = clamp(mR - min(mG, outerRim * 0.35), 0.0, 1.0);
    float fringeB = clamp(mB - min(mG, outerRim * 0.35), 0.0, 1.0);
    col += vec3(1.0, 0.10, 0.22) * fringeR * 0.85;
    col += vec3(0.0, 0.92, 1.0)  * fringeB * 0.85;

    // glitch scanlines add cyan/magenta bars on the outer rim
    float gr = clamp(mGlitchC - mG, 0.0, 1.0);
    float gm = clamp(mGlitchM - mG, 0.0, 1.0);
    col += vec3(0.0, 1.0, 1.0) * gr * glitchWin * 0.5;
    col += vec3(1.0, 0.2, 0.9) * gm * glitchWin * 0.4;

    // Alpha = black core + halo + aberrated/glitch fringes.
    float alpha = max(max(mR, mG), mB);
    alpha = max(alpha, rim * 0.98);
    alpha = max(alpha, max(gr, gm) * glitchWin);

    gl_FragColor = vec4(col, alpha);
  }
`;

function BurstMesh({
  origin,
  spreadMs,
  onCovered,
  onProgress,
}: {
  origin: [number, number];
  spreadMs: number;
  onCovered: () => void;
  onProgress?: (p: number) => void;
}) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const startRef = useRef<number | null>(null);
  const coveredRef = useRef(false);
  const { size } = useThree();

  const uniforms = useMemo(() => {
    const aspect = size.width / size.height;
    return {
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uOrigin: { value: new THREE.Vector2(origin[0] * aspect, origin[1]) },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uAspect: { value: aspect },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const aspect = size.width / size.height;
    uniforms.uAspect.value = aspect;
    uniforms.uResolution.value.set(size.width, size.height);
    uniforms.uOrigin.value.set(origin[0] * aspect, origin[1]);
  }, [size.width, size.height, origin, uniforms]);

  useFrame(() => {
    const nowMs = performance.now();
    if (startRef.current == null) startRef.current = nowMs;
    const t = nowMs - startRef.current;
    const rawP = Math.min(1, t / spreadMs);
    let curved: number;
    if (rawP < 0.25) {
      const s = rawP / 0.25;
      curved = 0.18 * (1 - (1 - s) * (1 - s));
    } else if (rawP < 0.85) {
      const s = (rawP - 0.25) / 0.6;
      curved = 0.18 + s * 0.78;
    } else {
      const s = (rawP - 0.85) / 0.15;
      curved = 0.96 + s * 0.04;
    }
    const endElastic = rawP > 0.85 ? Math.sin(((rawP - 0.85) / 0.15) * Math.PI) * 0.02 : 0;
    const p = Math.max(0, Math.min(1.02, curved + endElastic));
    uniforms.uProgress.value = p;
    uniforms.uTime.value = t / 1000;
    onProgress?.(p);
    if (rawP >= 1 && !coveredRef.current) {
      coveredRef.current = true;
      onCovered();
    }
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        transparent
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}

export function LiquidBurst({
  origin,
  onCovered,
  onFaded,
  onProgress,
  spreadMs = 1600,
  fadeMs = 280,
}: {
  origin: [number, number];
  onCovered: () => void;
  onFaded: () => void;
  onProgress?: (p: number) => void;
  spreadMs?: number;
  fadeMs?: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const coveredAtRef = useRef<number | null>(null);
  const fadedRef = useRef(false);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  const handleCovered = () => {
    if (coveredAtRef.current != null) return;
    coveredAtRef.current = performance.now();
    onCovered();
    const tick = () => {
      if (coveredAtRef.current == null || fadedRef.current) return;
      const fp = Math.min(1, (performance.now() - coveredAtRef.current) / fadeMs);
      const fe = fp < 0.5 ? 2 * fp * fp : 1 - Math.pow(-2 * fp + 2, 2) / 2;
      if (wrapRef.current) wrapRef.current.style.opacity = String(1 - fe);
      if (fp >= 1) {
        fadedRef.current = true;
        onFaded();
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if (!ready) return null;

  return (
    <div className="pointer-events-none fixed inset-0" style={{ zIndex: 70 }} aria-hidden>
      <div
        ref={wrapRef}
        style={{ position: "absolute", inset: 0, opacity: 1, willChange: "opacity" }}
      >
        <Canvas
          dpr={[1, 2]}
          orthographic
          camera={{ position: [0, 0, 1], zoom: 1 }}
          gl={{ alpha: true, premultipliedAlpha: false, antialias: true }}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        >
          <BurstMesh
            origin={origin}
            spreadMs={spreadMs}
            onCovered={handleCovered}
            onProgress={onProgress}
          />
        </Canvas>
      </div>
    </div>
  );
}

export default LiquidBurst;