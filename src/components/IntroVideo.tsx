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
const PIXELS_FOR_FULL_PROGRESS = 2600;
// Duration (ms) of the auto-driven burn-through once the video segment ends.
const BURN_AUTO_MS = 1800;
// Cap a single wheel tick so a hard mouse-wheel notch doesn't jump the progress.
const MAX_PIXELS_PER_TICK = 260;
// Cap RAF drain too; if decoding stalls, multiple wheel events can arrive
// before one frame and draining them all at once reads as a jump.
const MAX_PIXELS_PER_FRAME = 180;
// Critically damped smoothing times. Video follows slightly tighter than the
// shader timeline, but both are monotonic and direction-safe.
const PROGRESS_SMOOTH_TIME = 0.11;
const VIDEO_SMOOTH_TIME = 0.065;
const MAX_SMOOTH_DT = 1 / 30;
// Prefer letting the decoder play forward to the target; reserve seeks for coarse correction.
const SEEK_EPSILON = 0.1;
const VIDEO_CHASE_EPSILON = 0.035;
const VIDEO_BACKWARD_SEEK_EPSILON = 0.02;
const VIDEO_HARD_SEEK_EPSILON = 0.48;
const MIN_CHASE_PLAYBACK_RATE = 0.75;
const MAX_CHASE_PLAYBACK_RATE = 3.2;
// RAF-aligned seek cooldown, in frames (≈16.7ms @ 60fps).
const SEEK_COOLDOWN_FRAMES_FWD = 1;
const SEEK_COOLDOWN_FRAMES_BWD = 0;
// Only notify parent when progress moved meaningfully.
const PROGRESS_NOTIFY_EPSILON = 0.003;

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
    float burstK = smoothstep(0.0, 0.15, uBurn) * (1.0 - smoothstep(0.9, 1.0, uBurn));
    float peakK  = smoothstep(0.20, 0.55, uBurn) * (1.0 - smoothstep(0.70, 0.95, uBurn));
    float basePx = 1.6;
    // Ramp peak split up to ~11px in mid-burn.
    float burstPx = (burstK * 6.0 + peakK * 5.5) * uChromaMul;
    // Low-frequency liquid swell for a continuous "flowing" refraction.
    float swell = (0.5 + 0.5 * sin(uTime * 5.2)) * peakK * 3.2 * uChromaMul;
    // Faster, more frequent sporadic pulse -> up to ~16px spikes.
    float pulseA = step(0.88, fract(sin(uTime * 7.4) * 43758.5453)) * burstK * 6.0 * uChromaMul;
    float pulseB = step(0.82, fract(sin(uTime * 11.1 + 1.3) * 24634.6345)) * peakK * 4.0 * uChromaMul;
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
    float chromaGain = wHi * (0.7 + 0.6 * wEdge);
    chromaPx *= chromaGain;

    // Shard activity is gated to the mid peak so front/back shards silently
    // vanish before and after the burst.
    float shardK = smoothstep(0.30, 0.55, uBurn) * (1.0 - smoothstep(0.72, 0.90, uBurn));

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
      float cellTrig = step(0.94, ch) * shardK; // ~6% cells
      jitteredUv += vec2((ch - 0.5) * 16.0, (ch2 - 0.5) * 5.0) * cellTrig * uShardMul / uResolution.xy;

      // Foreground horizontal shard bands — varying stripe heights.
      float bandTier = fract(sin(floor(uTime * 12.0)) * 12345.678);
      float bandH = mix(10.0, 22.0, bandTier);
      float rowId = floor(gl_FragCoord.y / bandH);
      float bh  = hash(vec2(rowId, floor(uTime * 20.0)));
      float bh2 = hash(vec2(rowId + 91.7, floor(uTime * 20.0)));
      bandTrigger = step(0.78, bh) * shardK; // ~22% bands
      bandShiftPx = (bh2 - 0.5) * 52.0 * bandTrigger * uShardMul; // ±26px
      jitteredUv.x += bandShiftPx / uResolution.x;
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
      float ghostMix = 0.30 * shardK * (0.35 + 0.65 * wMid) * (1.0 - wHi * 0.5);
      col = mix(col, mix(col, ghost, 0.75), ghostMix);
    }

    // Fine-grain high-frequency noise: per-pixel ±0.8% luminance dither,
    // gated by burstK so it silently vanishes at the edges.
    if (burstK > 0.0) {
      float grain = (hash(gl_FragCoord.xy + vec2(uTime * 91.3, uTime * 57.1)) - 0.5)
                    * 0.016 * burstK * (0.4 + 0.6 * wMid) * uGrainMul;
      col += vec3(grain);
    }

    // Ultra-thin scanline shimmer during the peak — ±1.5% brightness ripple.
    if (peakK > 0.0) {
      float sl = sin(gl_FragCoord.y * 3.14159 + uTime * 42.0);
      col *= 1.0 + sl * 0.015 * peakK * (0.4 + 0.6 * wMid) * uGrainMul;
    }
    col = clamp(col, 0.0, 1.0);

    // Subtle brightness/gamma flicker during burn — glitch feel, no white flashes.
    if (burstK > 0.0) {
      float flick = (fract(sin(uTime * 17.3) * 91234.123) - 0.5) * 0.08 * burstK * (0.4 + 0.6 * wMid) * uGlitchMul;
      col = clamp(col * (1.0 + flick), 0.0, 1.0);
      float g = 1.0 + (fract(sin(uTime * 5.9) * 12345.678) - 0.5) * 0.06 * peakK * uGlitchMul;
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
      float r = pow(b, 3.2) * 2.05;

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
    let videoDriverProgress = 0;
    let videoDriverVelocity = 0;
    let targetProgress = 0;
    let pendingWheelPx = 0;
    let seekCooldownLeft = 0;
    let lastFrameTs = performance.now();
    let lastSeekTime = -1;
    let lastNotifiedProgress = -1;
    let lastNotifiedBurst = -1;
    let playPending = false;
    let wantsForwardPlayback = false;
    let seekInFlight = false;
    let queuedSeekTarget: number | null = null;
    let queuedSeekExact = false;
    let firstFrameReady = false;
    // If we adopted a pre-warmed video, its first frame is already decoded
    // and its seek path is already primed — skip the cold-start warmup.
    if (adoptedHandoff && video.readyState >= 2) {
      firstFrameReady = true;
      videoTex.needsUpdate = true;
    }
    let rafId = 0;
    let running = true;
    let burnActive = false;
    let forceFinish = false;
    let burnStartTs = -1;

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
      if (pendingWheelPx === 0) return 0;
      const drained = Math.min(MAX_PIXELS_PER_FRAME, Math.max(-MAX_PIXELS_PER_FRAME, pendingWheelPx));
      pendingWheelPx -= drained;
      if (Math.abs(pendingWheelPx) < 0.01) pendingWheelPx = 0;
      return drained;
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

    const pauseVideo = () => {
      wantsForwardPlayback = false;
      try {
        if (!video.paused) video.pause();
        if (video.playbackRate !== 1) video.playbackRate = 1;
      } catch { /* ignore */ }
    };

    const playVideoTowardTarget = (rate: number) => {
      wantsForwardPlayback = true;
      const playbackRate = Math.min(MAX_CHASE_PLAYBACK_RATE, Math.max(MIN_CHASE_PLAYBACK_RATE, rate));
      try {
        if (Math.abs(video.playbackRate - playbackRate) > 0.04) {
          video.playbackRate = playbackRate;
        }
      } catch { /* ignore */ }
      if (!video.paused || playPending) return;
      playPending = true;
      video.play()
        .then(() => {
          if (!wantsForwardPlayback) pauseVideo();
        })
        .catch(() => { /* ignore */ })
        .finally(() => { playPending = false; });
    };

    const commitSeek = (target: number, exact = false, force = false) => {
      if (!force && (video.seeking || seekInFlight)) {
        queuedSeekTarget = target;
        queuedSeekExact = queuedSeekExact || exact;
        return;
      }
      try {
        const fs = (video as unknown as { fastSeek?: (t: number) => void }).fastSeek;
        if (!exact && typeof fs === "function") fs.call(video, target);
        else video.currentTime = target;
        seekInFlight = true;
        lastSeekTime = target;
        seekCooldownLeft = exact ? SEEK_COOLDOWN_FRAMES_BWD : SEEK_COOLDOWN_FRAMES_FWD;
        videoTex.needsUpdate = true;
      } catch { /* ignore */ }
    };

    const flushQueuedSeek = () => {
      seekInFlight = false;
      if (queuedSeekTarget === null) return;
      const target = queuedSeekTarget;
      const exact = queuedSeekExact;
      queuedSeekTarget = null;
      queuedSeekExact = false;
      const current = Number.isFinite(video.currentTime) ? video.currentTime : lastSeekTime;
      if (Math.abs(target - current) > VIDEO_BACKWARD_SEEK_EPSILON) {
        commitSeek(target, exact, true);
      }
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
      videoTex.needsUpdate = true;
      firstFrameReady = true;
      flushQueuedSeek();
    };
    video.addEventListener("loadeddata", markFirstFrame);
    video.addEventListener("seeked", markFirstFrame);

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
      if (e.deltaMode === 1) dy *= 16;          // LINE ≈ 16px
      else if (e.deltaMode === 2) dy *= window.innerHeight; // PAGE
      // Clamp a single tick so mouse-wheel notches don't cause jumps.
      if (dy > MAX_PIXELS_PER_TICK) dy = MAX_PIXELS_PER_TICK;
      else if (dy < -MAX_PIXELS_PER_TICK) dy = -MAX_PIXELS_PER_TICK;
      // Accumulate; applied once per RAF tick for natural throttling.
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

      // Drain accumulated wheel delta once per RAF tick (natural throttling).
      const wheelPx = drainWheelPixels();
      if (wheelPx !== 0) {
        targetProgress = Math.min(
          VIDEO_FRACTION,
          Math.max(0, targetProgress + wheelPx / PIXELS_FOR_FULL_PROGRESS),
        );
      }

      // Monotonic critically damped smoothing. It avoids time-related recoil
      // from carried velocity when the wheel direction reverses.
      [progress, progressVelocity] = smoothProgress(
        progress,
        targetProgress,
        progressVelocity,
        PROGRESS_SMOOTH_TIME,
        dt,
      );
      const videoTargetProgress = targetProgress >= VIDEO_FRACTION ? VIDEO_FRACTION : targetProgress;
      [videoDriverProgress, videoDriverVelocity] = smoothProgress(
        videoDriverProgress,
        videoTargetProgress,
        videoDriverVelocity,
        VIDEO_SMOOTH_TIME,
        dt,
      );

      if (seekCooldownLeft > 0) seekCooldownLeft -= 1;
      if (seekInFlight && !video.seeking) flushQueuedSeek();

      const videoProgress = Math.min(1, progress / VIDEO_FRACTION);
      // Auto-burst: once the video segment is complete, drive the burn
      // through independently of scroll.
      if (videoProgress >= 1) {
        if (burnStartTs < 0) burnStartTs = now;
      }
      const burstProgress = burnStartTs < 0
        ? 0
        : clamp01((now - burnStartTs) / BURN_AUTO_MS);
      // Synthesize a total progress value that includes the auto burst so
      // uProgress / uTime / parent notifications stay consistent.
      const compositeProgress = Math.min(
        1,
        Math.min(progress, VIDEO_FRACTION) + burstProgress * (1 - VIDEO_FRACTION),
      );
      if (video.duration && !Number.isNaN(video.duration)) {
        const duration = video.duration;
        const targetVideoP = Math.min(1, videoDriverProgress / VIDEO_FRACTION);
        const targetTime = Math.min(duration, Math.max(0, targetVideoP * duration));
        const reversingVideo = targetProgress < videoDriverProgress - 0.0002 || videoDriverVelocity < -0.0001;
        const current = video.seeking && lastSeekTime >= 0
          ? lastSeekTime
          : Number.isFinite(video.currentTime)
          ? video.currentTime
          : Math.max(0, lastSeekTime);
        const gap = targetTime - current;
        const canSeekTick = seekCooldownLeft === 0;

        if (gap > VIDEO_CHASE_EPSILON && !reversingVideo) {
          // Forward: let the decoder play; hard-seek only on huge gaps.
          if (gap > VIDEO_HARD_SEEK_EPSILON && canSeekTick && Math.abs(gap) > SEEK_EPSILON) {
            commitSeek(Math.max(0, targetTime - VIDEO_CHASE_EPSILON), false);
          }
          playVideoTowardTarget(1 + gap * 6);
        } else if (gap < -VIDEO_BACKWARD_SEEK_EPSILON) {
          // Backward: pause immediately and seek through a single-flight queue;
          // avoids currentTime write thrash while remaining scroll-locked.
          pauseVideo();
          if (canSeekTick) commitSeek(targetTime, true);
        } else {
          pauseVideo();
        }
      }
      uniforms.uProgress.value = compositeProgress;
      // Tie shader time to scroll progress, not wall-clock time. When the user
      // stops scrolling, the burn/glitch stops too instead of drifting forward.
      uniforms.uTime.value = compositeProgress * 18;
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

      // Burn is fully scroll-driven and reversible: uBurn tracks the second
      // segment of `progress` directly. Stops when the wheel stops, retracts
      // when the wheel goes back up. Entering the next screen (fire below) is
      // the only irreversible step.
      if (videoProgress >= 1) {
        if (!burnActive) {
          burnActive = true;
        }
        pauseVideo();
      } else if (burnActive) {
        burnActive = false;
        burnStartTs = -1;
      }
      uniforms.uBurn.value = burstProgress;
      if (firstFrameReady && !document.hidden) {
        renderer.render(scene, camera);
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

      if ((burnActive && burstProgress >= 1) || forceFinish) fire();
    };
    rafId = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("wheel", onWheel);
      document.removeEventListener("visibilitychange", onVisibility);
      video.removeEventListener("loadedmetadata", onMeta);
      video.removeEventListener("loadeddata", markFirstFrame);
      video.removeEventListener("seeked", markFirstFrame);
      video.removeEventListener("error", onError);
      window.clearTimeout(errorTimer);
      pauseVideo();
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
