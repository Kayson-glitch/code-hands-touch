import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import videoAsset from "@/assets/intro-hands.mp4.asset.json";
import { BurnDebugPanel, DEFAULT_BURN_PARAMS, type BurnParams } from "./BurnDebugPanel";
import { ScrollHint } from "./ScrollHint";

export type IntroVideoEndInfo = {
  videoW: number;
  videoH: number;
};

export type IntroProgressInfo = {
  progress: number;
  videoProgress: number;
  burstProgress: number;
  centerX: number;
  centerY: number;
};

const VIDEO_FRACTION = 0.6;
// Reference project (Synergy AI Launchpad) maps ~2200px of wheel travel to the
// full video duration. Because our progress spans video + burst, we scale that
// number so the video segment alone consumes the same wheel distance:
// 2200 / VIDEO_FRACTION ≈ 3667 for the full 0..1 progress range.
const PIXELS_FOR_FULL_PROGRESS = 2200 / VIDEO_FRACTION;
// Duration (ms) of the auto-driven burn-through once the video segment ends.
const BURN_AUTO_MS = 1800;
// Cap a single wheel tick so a hard mouse-wheel notch doesn't jump the progress.
// Matches the reference project's ±180px clamp for calmer notch response.
const MAX_PIXELS_PER_TICK = 180;
// Critically-damped smoothing time chosen so the per-frame catch-up rate at
// 60fps matches the reference project's simple `diff * 0.22` lerp
// (≈ 1 - (1-0.22) ≈ 22%/frame → ~75ms smooth time). Feels visibly silkier
// than the previous 50ms while still tracking the wheel closely.
// Tighter than the reference project's ~75ms so scroll feels more direct
// without giving up perceptible smoothing. At 60fps this catches ~35% per
// frame — visibly snappier while still absorbing wheel jitter.
// Direct-seek driver: video stays paused and we set currentTime every frame.
// Very short smoothing just absorbs wheel-event jitter, near-direct feel.
const PROGRESS_SMOOTH_TIME = 0.018;
const MAX_SMOOTH_DT = 1 / 30;
// Only notify parent when progress moved meaningfully.
const PROGRESS_NOTIFY_EPSILON = 0.003;
// Skip GL render if nothing visibly changed and no new video frame arrived.
const PROGRESS_RENDER_EPSILON = 0.0005;

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
  uniform sampler2D uVideoTex;
  uniform float uProgress;      // 0..1 total; burst active when > VIDEO_FRACTION
  uniform float uBurn;          // 0..1 burn-through progress
  uniform float uTime;
  uniform vec2  uCenter;        // burst origin in uv (0..1)
  uniform vec2  uResolution;    // canvas px
  uniform vec2  uVideoRes;      // video px
  uniform float uVideoFraction;
  // ---- Debug tunables ----
  uniform float uWarpAmp;
  uniform float uWarpFreq;
  uniform float uStreakAmp;
  uniform float uStreakFreq;
  uniform float uAngularAmp;
  uniform float uAngularFreq;
  uniform float uChromaMul;
  uniform float uShardMul;
  uniform float uGrainMul;
  uniform float uGlitchMul;
  uniform float uCoreRimA;
  uniform float uHotHaloA;
  uniform float uCloudDiffA;
  uniform float uMistA;
  uniform float uHaloFalloff;

  // hash / value noise / fbm
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 6; i++) {
      v += a * vnoise(p);
      p *= 2.02;
      a *= 0.5;
    }
    return v;
  }

  // cover-fit uv into video aspect (like object-fit: cover on the shader plane)
  vec2 coverUV(vec2 uv, vec2 canvasRes, vec2 videoRes) {
    float canvasAspect = canvasRes.x / canvasRes.y;
    float videoAspect  = videoRes.x  / videoRes.y;
    vec2 scale = vec2(1.0);
    if (canvasAspect > videoAspect) {
      // canvas wider than video → fit width, crop height
      scale = vec2(1.0, videoAspect / canvasAspect);
    } else {
      scale = vec2(canvasAspect / videoAspect, 1.0);
    }
    return (uv - 0.5) * scale + 0.5;
  }

  // ---- Chromatic-aberration sampler with an explicit direction (px units) ----
  vec3 sampleChroma(vec2 sUv, vec2 dirPx) {
    vec2 dir = dirPx / uResolution.xy;
    float r = texture2D(uVideoTex, sUv + dir).r;
    float g = texture2D(uVideoTex, sUv).g;
    float b = texture2D(uVideoTex, sUv - dir).b;
    return vec3(r, g, b);
  }

  void main() {
    vec2 uv = vUv;

    // Aspect-correct radial coords for a round burst on any viewport.
    vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
    vec2 p  = (uv - uCenter) * aspect;

    // ---- Video-phase parallax: subtle zoom around fingertip center ----
    float videoP = clamp(uProgress / uVideoFraction, 0.0, 1.0);
    float zoom = 1.0 - videoP * 0.10;
    vec2 videoUv = (uv - uCenter) * zoom + uCenter;

    // Cover-fit to preserve aspect (no stretch)
    vec2 sampleUv = coverUV(videoUv, uResolution, uVideoRes);

    // Base chromatic aberration is always on but very subtle (edge fringe only).
    // During burn, ramp it up dramatically and add liquid-pulse jitter.
    // Non-linear envelope: soft in, big mid-burst punch, gentle release.
    // Widen active windows so glitch/shard read across the full diffusion.
    float burstK = smoothstep(0.0, 0.08, uBurn) * (1.0 - smoothstep(0.94, 1.0, uBurn));
    float peakK  = smoothstep(0.10, 0.40, uBurn) * (1.0 - smoothstep(0.80, 0.98, uBurn));
    float basePx = 1.6;
    // Stronger split — the frozen last frame is often dark, so we need more punch.
    float burstPx = (burstK * 9.0 + peakK * 8.5) * uChromaMul;
    float swell = (0.5 + 0.5 * sin(uTime * 5.2)) * peakK * 5.0 * uChromaMul;
    float pulseA = step(0.84, fract(sin(uTime * 7.4) * 43758.5453)) * burstK * 9.0 * uChromaMul;
    float pulseB = step(0.78, fract(sin(uTime * 11.1 + 1.3) * 24634.6345)) * peakK * 6.5 * uChromaMul;
    float chromaPx = basePx + burstPx + swell + pulseA + pulseB;

    // ---- Content-adaptive weighting ----
    // Sample base luminance and neighbors to derive highlight / midtone / edge weights.
    vec3 baseCol = texture2D(uVideoTex, sampleUv).rgb;
    float Lb = dot(baseCol, vec3(0.2126, 0.7152, 0.0722));
    vec2 px = 1.0 / uResolution.xy;
    float Lx1 = dot(texture2D(uVideoTex, sampleUv + vec2(px.x, 0.0)).rgb, vec3(0.2126, 0.7152, 0.0722));
    float Lx0 = dot(texture2D(uVideoTex, sampleUv - vec2(px.x, 0.0)).rgb, vec3(0.2126, 0.7152, 0.0722));
    float Ly1 = dot(texture2D(uVideoTex, sampleUv + vec2(0.0, px.y)).rgb, vec3(0.2126, 0.7152, 0.0722));
    float Ly0 = dot(texture2D(uVideoTex, sampleUv - vec2(0.0, px.y)).rgb, vec3(0.2126, 0.7152, 0.0722));
    float wHi   = 1.0 - smoothstep(0.72, 0.98, Lb);
    float wMid  = smoothstep(0.05, 0.35, Lb) * (1.0 - smoothstep(0.85, 1.0, Lb));
    float wEdge = clamp(length(vec2(Lx1 - Lx0, Ly1 - Ly0)) * 6.0, 0.0, 1.0);
    // During burst, video is frozen on the last frame — if that frame is dark,
    // content-adaptive weights collapse to 0 and the glitch disappears. Lift a
    // baseline for burst so the effect is visible independent of luminance.
    float wHiB   = max(wHi,  burstK * 0.95);
    float wMidB  = max(wMid, burstK * 0.90);
    float wEdgeB = max(wEdge, burstK * 0.55);
    float chromaGain = wHiB * (0.7 + 0.6 * wEdgeB);
    chromaPx *= chromaGain;

    // Shard activity is gated to the mid peak so front/back shards silently
    // vanish before and after the burst.
    float shardK = smoothstep(0.10, 0.35, uBurn) * (1.0 - smoothstep(0.82, 0.96, uBurn));

    // Mid-ground mosaic cells (subtle, low trigger).
    vec2 jitteredUv = sampleUv;
    float bandTrigger = 0.0;
    float bandShiftPx = 0.0;
    if (shardK > 0.0) {
      float tierPick = fract(sin(floor(uTime * 6.0)) * 43758.5453);
      float cell = mix(22.0, 30.0, step(0.33, tierPick)) + step(0.66, tierPick) * 8.0;
      vec2 cellId = floor(gl_FragCoord.xy / cell);
      float ch  = hash(cellId + vec2(floor(uTime * 20.0), 0.0));
      float ch2 = hash(cellId + vec2(7.31, floor(uTime * 20.0)));
      float cellTrig = step(0.90, ch) * shardK; // ~10% cells
      jitteredUv += vec2((ch - 0.5) * 22.0, (ch2 - 0.5) * 7.0) * cellTrig * uShardMul / uResolution.xy;

      // Micro-tremor on each active mosaic cell so shards jitter continuously
      // instead of only snapping between hash frames.
      float jPhase = ch * 6.2831;
      float jx = sin(uTime * 58.0 + jPhase) + sin(uTime * 91.0 + jPhase * 2.3);
      float jy = cos(uTime * 47.0 + jPhase * 1.7) + sin(uTime * 73.0 + jPhase * 0.9);
      jitteredUv += vec2(jx * 1.4, jy * 0.9) * cellTrig * uShardMul / uResolution.xy;

      // Foreground horizontal shard bands — varying stripe heights.
      float bandTier = fract(sin(floor(uTime * 12.0)) * 12345.678);
      float bandH = mix(10.0, 22.0, bandTier);
      float rowId = floor(gl_FragCoord.y / bandH);
      float bh  = hash(vec2(rowId, floor(uTime * 20.0)));
      float bh2 = hash(vec2(rowId + 91.7, floor(uTime * 20.0)));
      bandTrigger = step(0.72, bh) * shardK; // ~28% bands
      bandShiftPx = (bh2 - 0.5) * 66.0 * bandTrigger * uShardMul;
      // High-frequency horizontal tremor superimposed on active bands.
      float bandTremor = sin(uTime * 84.0 + rowId * 1.37) * 2.4 * bandTrigger * uShardMul;
      jitteredUv.x += (bandShiftPx + bandTremor) / uResolution.x;
      jitteredUv.y += sin(uTime * 63.0 + rowId * 0.83) * 0.9 * bandTrigger * uShardMul / uResolution.y;
    }

    // Chromatic aberration direction: radial from burn center → liquid outward
    // flow when burn is active; falls back to a fixed axis at rest.
    vec2 radial = uv - uCenter;
    float rlen = max(length(radial * aspect), 1e-4);
    vec2 chromaDir = mix(vec2(1.0, 0.0), radial * aspect / rlen, burstK);
    // Extra radial split inside active shard bands → colored fringe on shards.
    // Fringe suppressed in highlights to avoid over-exposure blowouts.
    float shardChromaPx = chromaPx + bandTrigger * 7.0 * (0.55 + 0.45 * wHi);
    vec3 col = sampleChroma(jitteredUv, chromaDir * shardChromaPx);
    // Slight brightness lift on foreground shards so they pop against ghosts.
    col *= 1.0 + 0.03 * bandTrigger;

    // Background ghost / afterimage: a low-opacity large-offset copy of the
    // video texture, only during the shard peak.
    if (shardK > 0.0) {
      float gh = hash(vec2(floor(uTime * 10.0), 3.14));
      float gv = hash(vec2(floor(uTime * 10.0) + 17.0, 2.71));
      float ghostShiftPx = (gh - 0.5) * 68.0;
      float ghostShiftPy = (gv - 0.5) * 12.0;
      vec2 ghostUv = sampleUv + vec2(ghostShiftPx / uResolution.x, ghostShiftPy / uResolution.y);
      vec3 ghost = sampleChroma(ghostUv, chromaDir * (chromaPx + 3.0));
      float ghostMix = 0.30 * shardK * (0.35 + 0.65 * wMidB) * (1.0 - wHiB * 0.5);
      col = mix(col, mix(col, ghost, 0.75), ghostMix);
    }

    // Fine-grain high-frequency noise: per-pixel ±0.8% luminance dither,
    // gated by burstK so it silently vanishes at the edges.
    if (burstK > 0.0) {
      float grain = (hash(gl_FragCoord.xy + vec2(uTime * 91.3, uTime * 57.1)) - 0.5)
                    * 0.032 * burstK * (0.4 + 0.6 * wMidB) * uGrainMul;
      col += vec3(grain);
    }

    // Ultra-thin scanline shimmer during the peak — ±1.5% brightness ripple.
    if (peakK > 0.0) {
      float sl = sin(gl_FragCoord.y * 3.14159 + uTime * 42.0);
      col *= 1.0 + sl * 0.030 * peakK * (0.4 + 0.6 * wMidB) * uGrainMul;
    }
    col = clamp(col, 0.0, 1.0);

    // Subtle brightness/gamma flicker during burn — glitch feel, no white flashes.
    if (burstK > 0.0) {
      float flick = (fract(sin(uTime * 17.3) * 91234.123) - 0.5) * 0.16 * burstK * (0.4 + 0.6 * wMidB) * uGlitchMul;
      col = clamp(col * (1.0 + flick), 0.0, 1.0);
      float g = 1.0 + (fract(sin(uTime * 5.9) * 12345.678) - 0.5) * 0.12 * peakK * uGlitchMul;
      col = pow(col, vec3(g));
    }

    // Highlight roll-off: hard-cap channels at ~0.985 to prevent any bright
    // flash frame from the combined chroma/glitch layers.
    col = col - max(vec3(0.0), col - vec3(0.985));

    // ---- Burn-through: paper burns from center outward, revealing black ----
    float b = clamp(uBurn, 0.0, 1.0);
    if (b > 0.0) {
      float t = uTime;
      // Squash Y so the burn front is a wide ellipse (~1.75:1), matching
      // unseen.co/world's horizontally elongated silhouette.
      vec2 pe = vec2(p.x, p.y * 2.15);
      // ---- Domain-warp the sample point so the edge is non-circular ----
      // Two low-freq fbm channels displace p → petal / tongue-like contour.
      float wx = fbm(pe * uWarpFreq + vec2( t * 0.09,  t * 0.06));
      float wy = fbm(pe * uWarpFreq + vec2(-t * 0.07,  t * 0.11) + 17.3);
      vec2  pw = pe + (vec2(wx, wy) - 0.5) * uWarpAmp;

      // Anisotropic long-streak noise (stretched horizontally) → flame tongues.
      float streak = fbm(vec2(pw.x * uStreakFreq, pw.y * 1.6) + vec2(t * 0.35, -t * 0.2));
      float hi     = fbm(pw * 9.0 - vec2(t * 0.28, t * 0.20));

      float distort = (streak - 0.5) * uStreakAmp + (hi - 0.5) * 0.10;

      // easeIn (pow 3.2): fingertip lingers as a small light, then accelerates outward.
      float r = b * 2.05;

      // Angle-dependent radius wobble so the front is never a perfect circle.
      float ang = atan(pw.y, pw.x);
      float wob = (sin(ang * 3.0 * uAngularFreq + t * 0.7) * 0.045
                +  sin(ang * 5.0 * uAngularFreq - t * 0.9) * 0.030
                +  sin(ang * 9.0 * uAngularFreq + t * 1.3) * 0.018) * uAngularAmp
                + 0.09 * cos(ang * 2.0)
                + 0.04 * cos(ang * 4.0 + 1.1); // bias horizontal lobes

      float len = length(pw);
      float d = len - r + distort * 0.55 + wob; // signed distance from the front

      // Burned-through hole sits just inside the front.
      float burned = smoothstep(0.035, -0.015, d);

      // Fade-in and tail-out envelopes (avoid pop / final flash).
      float appear = smoothstep(0.0, 0.02, b);
      float tail   = 1.0 - smoothstep(0.92, 1.00, b);
      float env    = appear * tail;

      // ---- Composite: black hole first ----
      col = mix(col, vec3(0.0), burned);

      // ---- Multi-layer glowing edge (only outside the burned hole) ----
      float outside = 1.0 - burned;

      // L0 — thin core rim, near-white, opaque-ish
      float L0 = smoothstep(0.014, 0.000, abs(d)) * outside * env;
      col += vec3(1.00, 0.99, 1.00) * L0 * uCoreRimA;

      // L1 — hot halo, warm lavender-white, additive
      float L1 = smoothstep(0.055, 0.010, abs(d)) * outside * env;
      col += vec3(0.96, 0.92, 1.00) * L1 * uHotHaloA;

      // L2 — cloudy diffusion, lavender, additive, exp falloff + noise
      float cloud = fbm(pw * 5.0 + vec2(t * 0.15, -t * 0.1));
      float dOut2 = max(d, 0.0);
      float L2 = exp(-dOut2 / (0.09 * uHaloFalloff)) * outside * env * (0.65 + 0.55 * cloud);
      col += vec3(0.77, 0.66, 1.00) * L2 * uCloudDiffA;

      // L3 — outer misty falloff, cooler lavender, additive, grainy
      float grain = fract(sin(dot(uv * uResolution + t, vec2(12.9898, 78.233))) * 43758.5453);
      float L3 = exp(-dOut2 / (0.22 * uHaloFalloff)) * outside * env * (0.55 + 0.45 * grain);
      col += vec3(0.62, 0.54, 0.95) * L3 * uMistA;
    }

    // Highlight roll-off again after additive glow to guarantee no white flash.
    col = col - max(vec3(0.0), col - vec3(0.985));

    gl_FragColor = vec4(col, 1.0);
  }
`;

export function IntroVideo({
  onEnded,
  onProgress,
  src,
  debug,
  handoffVideo,
}: {
  onEnded: (info: IntroVideoEndInfo) => void;
  onProgress?: (info: IntroProgressInfo) => void;
  src?: string;
  debug?: boolean;
  handoffVideo?: HTMLVideoElement | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoHostRef = useRef<HTMLDivElement>(null);
  const firedRef = useRef(false);
  const onEndedRef = useRef(onEnded);
  const onProgressRef = useRef(onProgress);
  useEffect(() => { onEndedRef.current = onEnded; }, [onEnded]);
  useEffect(() => { onProgressRef.current = onProgress; }, [onProgress]);
  const [burnParams, setBurnParams] = useState<BurnParams>(DEFAULT_BURN_PARAMS);
  const burnParamsRef = useRef<BurnParams>(burnParams);
  useEffect(() => { burnParamsRef.current = burnParams; }, [burnParams]);
  const debugEnabled = !!debug;
  const debugRef = useRef(debugEnabled);
  useEffect(() => { debugRef.current = debugEnabled; }, [debugEnabled]);
  // Exposed to the debug panel so it can jump / finish.
  const targetProgressRef = useRef<(v: number) => void>(() => {});
  const forceFinishRef = useRef<() => void>(() => {});

  useEffect(() => {
    const canvas = canvasRef.current;
    // Prefer the pre-warmed video handed off by the preloader; it already
    // has metadata + first frame decoded + seek path primed. Fall back to
    // our internal <video> element if handoff is unavailable.
    const host = videoHostRef.current;
    let video: HTMLVideoElement | null = handoffVideo ?? videoRef.current;
    let adoptedHandoff = false;
    if (handoffVideo && host) {
      // Move the pre-warmed element into our container without recreating it.
      Object.assign(handoffVideo.style, {
        position: "absolute",
        width: "1px",
        height: "1px",
        opacity: "0",
        pointerEvents: "none",
        left: "0",
        top: "0",
      });
      host.appendChild(handoffVideo);
      adoptedHandoff = true;
    }
    if (!canvas || !video) return;

    video.muted = true;
    video.playsInline = true;
    (video as any).crossOrigin = "anonymous";

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
    // Shader fill-rate is the main cost; 1.5x DPR keeps the burn/glitch
    // effects sharp without paying for 2x/3x pixel count on retina/4K.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x000000, 1);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const videoTex = new THREE.VideoTexture(video);
    videoTex.minFilter = THREE.LinearFilter;
    videoTex.magFilter = THREE.LinearFilter;
    videoTex.format = THREE.RGBAFormat;
    (videoTex as any).colorSpace = THREE.SRGBColorSpace;

    const uniforms = {
      uVideoTex: { value: videoTex },
      uProgress: { value: 0 },
      uBurn: { value: 0 },
      uTime: { value: 0 },
      uCenter: { value: new THREE.Vector2(0.5, 0.5) },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uVideoRes: { value: new THREE.Vector2(16, 9) },
      uVideoFraction: { value: VIDEO_FRACTION },
      uWarpAmp: { value: DEFAULT_BURN_PARAMS.warpAmp },
      uWarpFreq: { value: DEFAULT_BURN_PARAMS.warpFreq },
      uStreakAmp: { value: DEFAULT_BURN_PARAMS.streakAmp },
      uStreakFreq: { value: DEFAULT_BURN_PARAMS.streakFreq },
      uAngularAmp: { value: DEFAULT_BURN_PARAMS.angularAmp },
      uAngularFreq: { value: DEFAULT_BURN_PARAMS.angularFreq },
      uChromaMul: { value: DEFAULT_BURN_PARAMS.chromaAberration },
      uShardMul: { value: DEFAULT_BURN_PARAMS.shardDisplace },
      uGrainMul: { value: DEFAULT_BURN_PARAMS.grainAmount },
      uGlitchMul: { value: DEFAULT_BURN_PARAMS.glitchFlicker },
      uCoreRimA: { value: DEFAULT_BURN_PARAMS.coreRimAlpha },
      uHotHaloA: { value: DEFAULT_BURN_PARAMS.hotHaloAlpha },
      uCloudDiffA: { value: DEFAULT_BURN_PARAMS.cloudDiffuseAlpha },
      uMistA: { value: DEFAULT_BURN_PARAMS.mistAlpha },
      uHaloFalloff: { value: DEFAULT_BURN_PARAMS.haloFalloff },
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERT,
      fragmentShader: FRAG,
      depthTest: false,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h, false);
      uniforms.uResolution.value.set(w, h);
    };
    resize();
    window.addEventListener("resize", resize);

    let progress = 0;
    let progressVelocity = 0;
    let targetProgress = 0;
    let pendingWheelPx = 0;
    let lastFrameTs = performance.now();
    let lastNotifiedProgress = -1;
    let lastNotifiedBurst = -1;
    let lastRenderedProgress = -1;
    // Authoritative "current media time" — updated by rVFC when available,
    // otherwise falls back to video.currentTime reads.
    let mediaTime = 0;
    let mediaFrameDirty = false;
    let firstFrameReady = false;
    // If we adopted a pre-warmed video, its first frame is already decoded
    // and its seek path is already primed — skip the cold-start warmup.
    if (adoptedHandoff && video.readyState >= 2) {
      firstFrameReady = true;
      videoTex.needsUpdate = true;
      mediaFrameDirty = true;
    }
    let rafId = 0;
    let running = true;
    let burnActive = false;
    let forceFinish = false;
    let burnStartTs = -1;
    // Monotonic shader clock — advances every frame while burn is active so
    // sin(uTime * ...) terms never rewind (rewinding causes a visible flash).
    let burnClock = 0;
    // One-shot: pause video and freeze texture uploads the instant burst starts.
    let burnVideoFrozen = false;
    // Hold `fire()` for one extra rendered frame after burstProgress hits 1
    // so the parent scene switch happens on a fully-drawn final state.
    let finalFrameRendered = false;

    targetProgressRef.current = (v: number) => {
      // Wheel/debug can only advance up to the end of the video segment;
      // the burst is driven automatically after that.
      targetProgress = Math.min(VIDEO_FRACTION, Math.max(0, v));
    };
    forceFinishRef.current = () => {
      forceFinish = true;
      targetProgress = 1;
    };

    const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

    const drainWheelPixels = () => {
      const px = pendingWheelPx;
      pendingWheelPx = 0;
      return px;
    };

    const smoothProgress = (
      current: number,
      target: number,
      velocity: number,
      smoothTime: number,
      dt: number,
    ): [number, number] => {
      const distance = target - current;
      if (Math.abs(distance) < 0.00015) return [target, 0];

      const omega = 2 / Math.max(0.0001, smoothTime);
      const x = omega * dt;
      const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
      const change = current - target;
      const temp = (velocity + omega * change) * dt;
      let nextVelocity = (velocity - omega * temp) * exp;
      let next = target + (change + temp) * exp;
      const moved = next - current;

      if (moved * distance < 0) {
        next = current;
        nextVelocity = 0;
      } else if (Math.abs(moved) > Math.abs(distance)) {
        next = target;
        nextVelocity = 0;
      }

      return [clamp01(next), nextVelocity];
    };

    const ensurePaused = () => {
      try {
        if (!video.paused) video.pause();
        if (video.playbackRate !== 1) video.playbackRate = 1;
      } catch { /* ignore */ }
    };

    const fire = () => {
      if (firedRef.current) return;
      firedRef.current = true;
      onEndedRef.current({
        videoW: video.videoWidth || 0,
        videoH: video.videoHeight || 0,
      });
    };

    const onMeta = () => {
      if (video.videoWidth && video.videoHeight) {
        uniforms.uVideoRes.value.set(video.videoWidth, video.videoHeight);
      }
      try { video.pause(); } catch { /* ignore */ }
      // Force decoding of the first frame so the shader doesn't sample black.
      try { video.currentTime = 0; } catch { /* ignore */ }
    };
    video.addEventListener("loadedmetadata", onMeta);

    const markFirstFrame = () => {
      firstFrameReady = true;
      mediaFrameDirty = true;
      if (Number.isFinite(video.currentTime)) mediaTime = video.currentTime;
    };
    video.addEventListener("loadeddata", markFirstFrame);
    const onSeeked = () => {
      mediaFrameDirty = true;
      if (Number.isFinite(video.currentTime)) mediaTime = video.currentTime;
    };
    video.addEventListener("seeked", onSeeked);

    // requestVideoFrameCallback → authoritative frame + time source.
    type RVFCMeta = { mediaTime: number };
    type RVFCVideo = HTMLVideoElement & {
      requestVideoFrameCallback?: (cb: (now: number, meta: RVFCMeta) => void) => number;
      cancelVideoFrameCallback?: (id: number) => void;
    };
    const rvfcVideo = video as RVFCVideo;
    const hasRVFC = typeof rvfcVideo.requestVideoFrameCallback === "function";
    let rvfcId = 0;
    const onVideoFrame = (_now: number, meta: RVFCMeta) => {
      mediaTime = meta.mediaTime;
      mediaFrameDirty = true;
      if (running && hasRVFC) {
        rvfcId = rvfcVideo.requestVideoFrameCallback!(onVideoFrame);
      }
    };
    if (hasRVFC) {
      rvfcId = rvfcVideo.requestVideoFrameCallback!(onVideoFrame);
    }

    if (adoptedHandoff && video.videoWidth && video.videoHeight) {
      uniforms.uVideoRes.value.set(video.videoWidth, video.videoHeight);
    }
    if (!adoptedHandoff) {
      // Start paused; play once to force first frame decode on some browsers.
      video.play().then(() => { try { video.pause(); } catch { /* ignore */ } })
        .catch(() => { /* ignore */ });
    } else {
      try { video.pause(); } catch { /* ignore */ }
    }

    // GPU warmup: push one frame through the shader pipeline before the
    // wheel handler is active so the first user-driven frame doesn't pay
    // the texture-upload / shader-compile cost.
    try {
      if (firstFrameReady) renderer.render(scene, camera);
    } catch { /* ignore */ }

    let errorTimer = 0;
    const onError = () => {
      window.clearTimeout(errorTimer);
      errorTimer = window.setTimeout(() => fire(), 500);
    };
    video.addEventListener("error", onError);

    const onWheel = (e: WheelEvent) => {
      if (firedRef.current) return;
      e.preventDefault();
      // Normalize delta across PIXEL/LINE/PAGE modes.
      let dy = e.deltaY;
      // Match reference project line/page multipliers (LINE ≈ 18px, PAGE ≈ 360px).
      if (e.deltaMode === 1) dy *= 18;
      else if (e.deltaMode === 2) dy *= 360;
      // Clamp a single tick so mouse-wheel notches don't cause jumps.
      if (dy > MAX_PIXELS_PER_TICK) dy = MAX_PIXELS_PER_TICK;
      else if (dy < -MAX_PIXELS_PER_TICK) dy = -MAX_PIXELS_PER_TICK;
      // Direction reversal → drop carried velocity so the reversal is instant.
      if (dy !== 0 && pendingWheelPx !== 0 && Math.sign(dy) !== Math.sign(pendingWheelPx)) {
        pendingWheelPx = 0;
        progressVelocity = 0;
      }
      pendingWheelPx += dy;
    };
    window.addEventListener("wheel", onWheel, { passive: false });

    // Freeze dt when the tab is hidden so we don't accumulate a big jump.
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        lastFrameTs = performance.now();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const loop = () => {
      if (!running) return;
      rafId = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min(MAX_SMOOTH_DT, Math.max(0.001, (now - lastFrameTs) / 1000));
      lastFrameTs = now;

      // Drain the full accumulated wheel delta this tick — no artificial cap,
      // playbackRate chase handles long distances gracefully.
      const wheelPx = drainWheelPixels();
      if (wheelPx !== 0) {
        targetProgress = Math.min(
          VIDEO_FRACTION,
          Math.max(0, targetProgress + wheelPx / PIXELS_FOR_FULL_PROGRESS),
        );
      }

      // Single critically-damped smoothing channel drives both shader and video.
      [progress, progressVelocity] = smoothProgress(
        progress,
        targetProgress,
        progressVelocity,
        PROGRESS_SMOOTH_TIME,
        dt,
      );

      // rVFC-less fallback: read currentTime each frame.
      if (!hasRVFC && Number.isFinite(video.currentTime)) {
        const t = video.currentTime;
        if (t !== mediaTime) { mediaTime = t; mediaFrameDirty = true; }
      }

      const videoProgress = Math.min(1, progress / VIDEO_FRACTION);
      // Auto-burst: once the video segment is complete, drive the burn
      // through independently of scroll.
      if (videoProgress >= 1 && burnStartTs < 0) {
        burnStartTs = now;
      }
      // Once burst has started it is irreversible; user scroll-back cannot
      // retract it (that used to cause the burst to restart from 0 = flash).
      const burstEngaged = burnStartTs >= 0;
      if (burstEngaged) {
        // Clamp target so the video-phase state can't be pulled back below the
        // burst boundary and won't rewind uProgress / video mediaTime.
        if (targetProgress < VIDEO_FRACTION) targetProgress = VIDEO_FRACTION;
        if (progress < VIDEO_FRACTION) progress = VIDEO_FRACTION;
      }
      const burstProgress = burstEngaged
        ? clamp01((now - burnStartTs) / BURN_AUTO_MS)
        : 0;
      // Composite: while bursting, freeze the video-segment contribution at
      // VIDEO_FRACTION so uProgress advances purely with burstProgress.
      const compositeProgress = burstEngaged
        ? Math.min(1, VIDEO_FRACTION + burstProgress * (1 - VIDEO_FRACTION))
        : Math.min(progress, VIDEO_FRACTION);
      if (burstEngaged) {
        burnClock += dt;
      }
      // Legacy no-op branch kept for readability
      if (videoProgress >= 1) {
        if (burnStartTs < 0) burnStartTs = now;
      }
      // ---- Direct-seek driver ----
      // Video stays paused; every rAF we set currentTime to the scroll-derived
      // target. all-intra encode makes seek ~1 frame cost, so forward/backward
      // are symmetric and there is zero chase / drift.
      if (!burstEngaged && video.duration && !Number.isNaN(video.duration) && firstFrameReady) {
        ensurePaused();
        const duration = video.duration;
        const targetTime = clamp01(progress / VIDEO_FRACTION) * duration;
        // Only write when we've crossed at least ~half a frame worth of time,
        // to avoid duplicate seeks within the same displayed frame.
        const HALF_FRAME = 0.5 / 48;
        if (!video.seeking && Math.abs(targetTime - mediaTime) > HALF_FRAME) {
          try {
            const fs = (video as unknown as { fastSeek?: (t: number) => void }).fastSeek;
            if (typeof fs === "function") fs.call(video, targetTime);
            else video.currentTime = targetTime;
            mediaTime = targetTime;
            mediaFrameDirty = true;
          } catch { /* ignore */ }
        }
      }
      uniforms.uProgress.value = compositeProgress;
      // Pre-burst: tie shader time to scroll progress (glitch stops when
      // the user stops scrolling). During burst: use a monotonic clock so
      // sin(uTime * ...) phases never rewind, which would flash.
      uniforms.uTime.value = burstEngaged
        ? VIDEO_FRACTION * 18 + burnClock * 6.0
        : compositeProgress * 18;
      // Sync debug uniforms from ref every frame (cheap, no shader recompile).
      const bp = burnParamsRef.current;
      uniforms.uWarpAmp.value = bp.warpAmp;
      uniforms.uWarpFreq.value = bp.warpFreq;
      uniforms.uStreakAmp.value = bp.streakAmp;
      uniforms.uStreakFreq.value = bp.streakFreq;
      uniforms.uAngularAmp.value = bp.angularAmp;
      uniforms.uAngularFreq.value = bp.angularFreq;
      uniforms.uChromaMul.value = bp.chromaAberration;
      uniforms.uShardMul.value = bp.shardDisplace;
      uniforms.uGrainMul.value = bp.grainAmount;
      uniforms.uGlitchMul.value = bp.glitchFlicker;
      uniforms.uCoreRimA.value = bp.coreRimAlpha;
      uniforms.uHotHaloA.value = bp.hotHaloAlpha;
      uniforms.uCloudDiffA.value = bp.cloudDiffuseAlpha;
      uniforms.uMistA.value = bp.mistAlpha;
      uniforms.uHaloFalloff.value = bp.haloFalloff;

      // Burst is irreversible: once engaged it only moves forward. Freeze the
      // video (pause + stop uploading new frames) exactly once at start so a
      // stray decoded frame can't refresh the canvas mid-burn.
      if (burstEngaged && !burnActive) {
        burnActive = true;
      }
      if (burstEngaged && !burnVideoFrozen) {
        ensurePaused();
        mediaFrameDirty = false;
        videoTex.needsUpdate = false;
        burnVideoFrozen = true;
      }
      uniforms.uBurn.value = burstProgress;

      // Only upload a new video texture when a new frame actually arrived.
      if (mediaFrameDirty && !burstEngaged) {
        videoTex.needsUpdate = true;
        mediaFrameDirty = false;
      } else if (burstEngaged) {
        mediaFrameDirty = false;
      }
      const progressChanged = Math.abs(compositeProgress - lastRenderedProgress) > PROGRESS_RENDER_EPSILON;
      const needsRender = firstFrameReady && !document.hidden && (
        videoTex.needsUpdate || progressChanged || burnActive || burstProgress > 0
      );
      if (needsRender) {
        renderer.render(scene, camera);
        lastRenderedProgress = compositeProgress;
      }

      // Throttle parent notifications to avoid per-frame React re-renders.
      const burstBoundaryCrossed =
        (lastNotifiedBurst <= 0 && burstProgress > 0) ||
        (lastNotifiedBurst < 1 && burstProgress >= 1);
      if (
        Math.abs(compositeProgress - lastNotifiedProgress) > PROGRESS_NOTIFY_EPSILON ||
        burstBoundaryCrossed ||
        compositeProgress >= 1
      ) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        onProgressRef.current?.({
          progress: compositeProgress,
          videoProgress,
          burstProgress,
          centerX: uniforms.uCenter.value.x * w,
          centerY: uniforms.uCenter.value.y * h,
        });
        lastNotifiedProgress = compositeProgress;
        lastNotifiedBurst = burstProgress;
      }

      // Fire only after the burst has fully resolved to solid black AND we've
      // painted that final frame at least once. Swapping earlier leaves a
      // half-burnt frame visible on screen while the video unmounts, which
      // reads as a flash. Since the final composite is #000, the handoff to
      // the hero (which lives on a #000 section) is seamless — no cover
      // overlay needed.
      if (burnActive && burstProgress >= 1) {
        if (finalFrameRendered) fire();
        else if (needsRender) finalFrameRendered = true;
      }
      if (forceFinish) fire();
    };
    rafId = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      if (hasRVFC && rvfcId && typeof rvfcVideo.cancelVideoFrameCallback === "function") {
        try { rvfcVideo.cancelVideoFrameCallback(rvfcId); } catch { /* ignore */ }
      }
      window.removeEventListener("resize", resize);
      window.removeEventListener("wheel", onWheel);
      document.removeEventListener("visibilitychange", onVisibility);
      video.removeEventListener("loadedmetadata", onMeta);
      video.removeEventListener("loadeddata", markFirstFrame);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      window.clearTimeout(errorTimer);
      ensurePaused();
      videoTex.dispose();
      material.dispose();
      mesh.geometry.dispose();
      renderer.dispose();
      // Return the adopted element to detached state so the preloader's
      // revoke logic (or React unmount) can safely dispose the URL.
      if (adoptedHandoff && video && video.parentNode) {
        try { video.parentNode.removeChild(video); } catch { /* ignore */ }
      }
    };
  }, [src, handoffVideo]);

  return (
    <div style={{ position: "absolute", inset: 0, background: "#000", overflow: "hidden" }}>
      <div ref={videoHostRef} aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {!handoffVideo && (
          <video
            ref={videoRef}
            src={src ?? videoAsset.url}
            muted
            playsInline
            preload="auto"
            aria-hidden
            tabIndex={-1}
            style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
          />
        )}
      </div>
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 2,
          mixBlendMode: "overlay",
          opacity: 0.35,
          backgroundImage:
            "repeating-linear-gradient(to bottom, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, rgba(0,0,0,0) 1px, rgba(0,0,0,0) 3px)",
        }}
      />
      <ScrollHint />
      {debugEnabled && (
        <BurnDebugPanel
          values={burnParams}
          onChange={setBurnParams}
          onReset={() => setBurnParams(DEFAULT_BURN_PARAMS)}
          onJumpToBurst={() => targetProgressRef.current(0.605)}
          onFinish={() => forceFinishRef.current()}
        />
      )}
    </div>
  );
}

export default IntroVideo;
