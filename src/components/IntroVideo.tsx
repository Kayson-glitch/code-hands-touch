import { useEffect, useRef } from "react";
import * as THREE from "three";
import videoAsset from "@/assets/intro-hands.mp4.asset.json";

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
const PIXELS_FOR_FULL_PROGRESS = 3200;
const BURN_DURATION_MS = 2600;
// Cap a single wheel tick so a hard mouse-wheel notch doesn't jump the progress.
const MAX_PIXELS_PER_TICK = 140;
// Exponential smoothing rate (higher = snappier follow, lower = more inertia).
const SMOOTH_RATE = 10;
// Extra snappiness when the user scrolls fast (large gap between target and current).
const SMOOTH_RATE_FAST = 14;
// Prefer letting the decoder play forward to the target; reserve seeks for coarse correction.
const SEEK_MIN_INTERVAL_MS = 80;
const SEEK_EPSILON = 0.1;
const VIDEO_CHASE_EPSILON = 0.035;
const VIDEO_BACKWARD_SEEK_EPSILON = 0.12;
const VIDEO_HARD_SEEK_EPSILON = 0.48;
const MIN_CHASE_PLAYBACK_RATE = 0.75;
const MAX_CHASE_PLAYBACK_RATE = 2.35;
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
    for (int i = 0; i < 5; i++) {
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

    vec3 col = texture2D(uVideoTex, sampleUv).rgb;

    // ---- Burn-through: paper burns from center outward, revealing black ----
    float b = clamp(uBurn, 0.0, 1.0);
    if (b > 0.0) {
      float t = uTime;
      // fbm distortion for irregular edge
      float n1 = fbm(p * 3.2 + vec2(t * 0.18, -t * 0.12));
      float n2 = fbm(p * 7.5 - vec2(t * 0.22, t * 0.16));
      float distort = (n1 - 0.5) * 0.16 + (n2 - 0.5) * 0.06;

      // Outer radius (burn front) — easeOutCubic, expands past screen.
      float bOuter = 1.0 - pow(1.0 - b, 3.0);
      float rOuter = bOuter * 1.9;
      // Inner radius (already-burned-through hole) — lags behind, delayed start.
      float bInner = smoothstep(0.10, 0.95, b);
      float rInner = bInner * 1.9;

      float len = length(p);
      // Signed distances from front (positive = outside burn, negative = burning/burned)
      float dOuter = len - rOuter + distort * 0.22;
      float dInner = len - rInner + distort * 0.18;

      // Burned-through mask (crisp inner hole → black)
      float burned = smoothstep(0.015, -0.015, dInner);

      // Solid bright ring band centred on dOuter with thickness ~ringWidth.
      float ringWidth = 0.10;
      float ringBand = smoothstep(ringWidth, ringWidth * 0.55, abs(dOuter));
      float ring = clamp(ringBand * (1.0 - burned), 0.0, 1.0);

      // Fade the ring in from zero so the first burn frames don't pop.
      float appear = smoothstep(0.0, 0.12, b);
      ring *= appear;

      vec3 ringCol = vec3(1.00, 0.98, 1.00); // near-white solid band

      // Composite:
      //  - burned area → black
      //  - ring → thin bright band along the hole's outer edge
      col = mix(col, vec3(0.0), burned);
      col = mix(col, ringCol, ring);
    }

    gl_FragColor = vec4(col, 1.0);
  }
`;

export function IntroVideo({
  onEnded,
  onProgress,
  src,
}: {
  onEnded: (info: IntroVideoEndInfo) => void;
  onProgress?: (info: IntroProgressInfo) => void;
  src?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const firedRef = useRef(false);
  const onProgressRef = useRef(onProgress);
  useEffect(() => { onProgressRef.current = onProgress; }, [onProgress]);

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
    const t0 = performance.now();

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
      onEnded({
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
      if (burnActive) { e.preventDefault(); return; }
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

      // Start burn once scroll reaches the end; drive its own 1.6s timeline.
      if (!burnActive && progress >= 1) {
        burnActive = true;
        burnStartedAt = now;
        pauseVideo();
      }
      if (burnActive) {
        const bt = Math.min(1, (now - burnStartedAt) / BURN_DURATION_MS);
        uniforms.uBurn.value = bt;
      }
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

      if (burnActive && uniforms.uBurn.value >= 1) fire();
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
  }, [onEnded]);

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
    </div>
  );
}

export default IntroVideo;
