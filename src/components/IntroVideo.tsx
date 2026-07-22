import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import videoAsset from "@/assets/intro-hands.mp4.asset.json";
import { BurnDebugPanel, DEFAULT_BURN_PARAMS, type BurnParams } from "./BurnDebugPanel";

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
const BURN_DURATION_MS = 3600;
// Cap a single wheel tick so a hard mouse-wheel notch doesn't jump the progress.
const MAX_PIXELS_PER_TICK = 260;
// Symmetric exponential smoothing rate (identical for forward & backward).
const SMOOTH_RATE = 12;
// Prefer letting the decoder play forward to the target; reserve seeks for coarse correction.
const SEEK_MIN_INTERVAL_MS = 24;
const SEEK_EPSILON = 0.1;
const VIDEO_CHASE_EPSILON = 0.035;
const VIDEO_BACKWARD_SEEK_EPSILON = 0.02;
const VIDEO_HARD_SEEK_EPSILON = 0.48;
const MIN_CHASE_PLAYBACK_RATE = 0.75;
const MAX_CHASE_PLAYBACK_RATE = 3.2;
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
      // ---- Domain-warp the sample point so the edge is non-circular ----
      // Two low-freq fbm channels displace p → petal / tongue-like contour.
      float wx = fbm(p * uWarpFreq + vec2( t * 0.09,  t * 0.06));
      float wy = fbm(p * uWarpFreq + vec2(-t * 0.07,  t * 0.11) + 17.3);
      vec2  pw = p + (vec2(wx, wy) - 0.5) * uWarpAmp;

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
                +  sin(ang * 9.0 * uAngularFreq + t * 1.3) * 0.018) * uAngularAmp;

      float len = length(pw);
      float d = len - r + distort * 0.55 + wob; // signed distance from the front

      // Burned-through hole sits just inside the front.
      float burned = smoothstep(0.035, -0.015, d);

      // Fade-in and tail-out envelopes (avoid pop / final flash).
      float appear = smoothstep(0.0, 0.10, b);
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
}: {
  onEnded: (info: IntroVideoEndInfo) => void;
  onProgress?: (info: IntroProgressInfo) => void;
  src?: string;
  debug?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
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
    const video = videoRef.current;
    if (!canvas || !video) return;

    video.muted = true;
    video.playsInline = true;
    (video as any).crossOrigin = "anonymous";

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
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
    let targetProgress = 0;
    let lastFrameTs = performance.now();
    let lastSeekTime = -1;
    let lastSeekAt = 0;
    let lastNotifiedProgress = -1;
    let lastNotifiedBurst = -1;
    let playPending = false;
    let firstFrameReady = false;
    let rafId = 0;
    let running = true;
    let burnStartedAt = 0;
    let burnActive = false;
    let forceFinish = false;
    const t0 = performance.now();

    targetProgressRef.current = (v: number) => {
      targetProgress = Math.min(1, Math.max(0, v));
    };
    forceFinishRef.current = () => {
      forceFinish = true;
      targetProgress = 1;
    };

    const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

    const pauseVideo = () => {
      try {
        if (!video.paused) video.pause();
      } catch { /* ignore */ }
    };

    const playVideoTowardTarget = (rate: number) => {
      const playbackRate = Math.min(MAX_CHASE_PLAYBACK_RATE, Math.max(MIN_CHASE_PLAYBACK_RATE, rate));
      try {
        if (Math.abs(video.playbackRate - playbackRate) > 0.04) {
          video.playbackRate = playbackRate;
        }
      } catch { /* ignore */ }
      if (!video.paused || playPending) return;
      playPending = true;
      video.play()
        .catch(() => { /* ignore */ })
        .finally(() => { playPending = false; });
    };

    const commitSeek = (target: number, now: number, exact = false) => {
      try {
        const fs = (video as unknown as { fastSeek?: (t: number) => void }).fastSeek;
        if (!exact && typeof fs === "function") fs.call(video, target);
        else video.currentTime = target;
        lastSeekTime = target;
        lastSeekAt = now;
        videoTex.needsUpdate = true;
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
      videoTex.needsUpdate = true;
      firstFrameReady = true;
    };
    video.addEventListener("loadeddata", markFirstFrame);
    video.addEventListener("seeked", markFirstFrame);

    // Start paused; play once to force first frame decode on some browsers.
    video.play().then(() => { try { video.pause(); } catch { /* ignore */ } })
      .catch(() => { /* ignore */ });

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
      targetProgress = clamp01(targetProgress + dy / PIXELS_FOR_FULL_PROGRESS);
    };
    window.addEventListener("wheel", onWheel, { passive: false });

    const loop = () => {
      if (!running) return;
      rafId = requestAnimationFrame(loop);
      const now = performance.now();
      const time = (now - t0) / 1000;
      const dt = Math.min(0.05, Math.max(0.001, (now - lastFrameTs) / 1000));
      lastFrameTs = now;

      // Frame-rate-independent exponential smoothing toward the target.
      // Scale rate up when the gap is large so fast scroll feels responsive,
      // while slow scroll retains a softer, inertial follow.
      const gap = Math.abs(targetProgress - progress);
      const rate = SMOOTH_RATE + (SMOOTH_RATE_FAST - SMOOTH_RATE) * Math.min(1, gap * 8);
      const alpha = 1 - Math.exp(-rate * dt);
      progress += (targetProgress - progress) * alpha;
      // Snap when essentially there so `fire()` still triggers cleanly.
      if (Math.abs(targetProgress - progress) < 0.0005) progress = targetProgress;

      const videoProgress = Math.min(1, progress / VIDEO_FRACTION);
      const burstProgress = Math.min(1, Math.max(0, (progress - VIDEO_FRACTION) / (1 - VIDEO_FRACTION)));
      // Scrub video with a hybrid strategy: play forward to chase small gaps,
      // and seek only for large jumps / reverse movement / final-frame locking.
      if (video.duration && !Number.isNaN(video.duration)) {
        const duration = video.duration;
        const target = Math.min(duration, Math.max(0, videoProgress * duration));
        const current = Number.isFinite(video.currentTime)
          ? video.currentTime
          : Math.max(0, lastSeekTime);
        const gap = target - current;
        const absGap = Math.abs(gap);
        const canSeek = now - lastSeekAt > SEEK_MIN_INTERVAL_MS && absGap > SEEK_EPSILON;
        const lockFinalFrame = videoProgress >= 0.998 || burstProgress > 0;

        if (lockFinalFrame) {
          pauseVideo();
          if (absGap > VIDEO_CHASE_EPSILON && canSeek) commitSeek(target, now, true);
        } else if (gap > VIDEO_CHASE_EPSILON) {
          if (gap > VIDEO_HARD_SEEK_EPSILON && canSeek) {
            commitSeek(Math.max(0, target - VIDEO_CHASE_EPSILON), now, false);
          }
          playVideoTowardTarget(MIN_CHASE_PLAYBACK_RATE + gap * 4.2);
        } else {
          pauseVideo();
          if (gap < -VIDEO_BACKWARD_SEEK_EPSILON && canSeek) commitSeek(target, now, true);
        }
      }
      uniforms.uProgress.value = progress;
      uniforms.uTime.value = time;
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
          burnStartedAt = now;
        }
        pauseVideo();
      } else if (burnActive) {
        burnActive = false;
      }
      uniforms.uBurn.value = burstProgress;
      if (firstFrameReady) {
        renderer.render(scene, camera);
      }

      // Throttle parent notifications to avoid per-frame React re-renders.
      const burstBoundaryCrossed =
        (lastNotifiedBurst <= 0 && burstProgress > 0) ||
        (lastNotifiedBurst < 1 && burstProgress >= 1);
      if (
        Math.abs(progress - lastNotifiedProgress) > PROGRESS_NOTIFY_EPSILON ||
        burstBoundaryCrossed ||
        progress >= 1
      ) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        onProgressRef.current?.({
          progress,
          videoProgress,
          burstProgress,
          centerX: uniforms.uCenter.value.x * w,
          centerY: uniforms.uCenter.value.y * h,
        });
        lastNotifiedProgress = progress;
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
    };
  }, [src]);

  return (
    <div style={{ position: "absolute", inset: 0, background: "#000", overflow: "hidden" }}>
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
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
      />
      <BurnDebugPanel
          values={burnParams}
          onChange={setBurnParams}
          onReset={() => setBurnParams(DEFAULT_BURN_PARAMS)}
          onJumpToBurst={() => targetProgressRef.current(0.605)}
          onFinish={() => forceFinishRef.current()}
      />
    </div>
  );
}

export default IntroVideo;
