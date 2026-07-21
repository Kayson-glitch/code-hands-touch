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
const PIXELS_FOR_FULL_PROGRESS = 2600;

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
  uniform float uBurst;         // 0..1 burst sub-progress
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
    vec2 pc = (uCenter) * aspect;

    // ---- Video-phase parallax: subtle zoom around fingertip center ----
    float videoP = clamp(uProgress / uVideoFraction, 0.0, 1.0);
    float zoom = 1.0 - videoP * 0.10;
    vec2 videoUv = (uv - uCenter) * zoom + uCenter;

    // Cover-fit to preserve aspect (no stretch)
    vec2 sampleUv = coverUV(videoUv, uResolution, uVideoRes);

    // ---- Burst distance field with organic fbm distortion ----
    float t = uTime;
    // Radius grows past 1 to fill screen. easeOutCubic feel.
    float bb = clamp(uBurst, 0.0, 1.0);
    float bbEase = 1.0 - pow(1.0 - bb, 2.5);
    float radius = bbEase * 1.6;

    // Distortion: two layers of fbm at different scales, animated
    float n1 = fbm(p * 3.5 + vec2(t * 0.15, -t * 0.10));
    float n2 = fbm(p * 8.0 - vec2(t * 0.25, t * 0.20));
    float distort = (n1 - 0.5) * 0.28 + (n2 - 0.5) * 0.09;

    float d = length(p) - radius + distort * (0.15 + bb * 0.35);

    // ---- Chromatic aberration on video sample, ramped by |d| near edge ----
    float edgeProx = exp(-abs(d) * 6.0);            // 1 at edge, ~0 far away
    float chroma = 0.006 + edgeProx * 0.020 * bb;
    vec2 caDir = normalize(p + 1e-4);
    vec3 col;
    col.r = texture2D(uVideoTex, coverUV(videoUv + caDir * chroma, uResolution, uVideoRes)).r;
    col.g = texture2D(uVideoTex, sampleUv).g;
    col.b = texture2D(uVideoTex, coverUV(videoUv - caDir * chroma, uResolution, uVideoRes)).b;

    // ---- Bright liquid rim ----
    float rimW = 0.05 + 0.12 * (1.0 - bb);
    float rim = exp(-pow(d / rimW, 2.0)) * bb;
    vec3 rimCol = mix(vec3(1.0, 0.98, 0.92), vec3(0.80, 0.72, 1.10), 0.45);
    col += rimCol * rim * 1.6;

    // Small hot core just as burst kicks off (fingertip flash)
    float coreR = 0.02 + 0.08 * bb;
    float core = smoothstep(coreR, 0.0, length(p)) * smoothstep(0.0, 0.15, bb) * (1.0 - smoothstep(0.4, 0.8, bb));
    col += vec3(1.0, 0.95, 0.85) * core * 1.2;

    // ---- Interior fade: inside the disc, mix toward white as burst finishes ----
    float inside = smoothstep(0.02, -0.15, d);
    float whiten = inside * smoothstep(0.55, 1.0, bb);
    col = mix(col, vec3(1.0), whiten);

    // Sparkle noise inside disc during late burst
    float sp = step(0.985, hash(floor(uv * uResolution / 3.0) + floor(t * 20.0)));
    col += vec3(sp) * inside * smoothstep(0.4, 0.9, bb) * 0.9;

    // ---- Final overall fade to white as burst completes ----
    float finalWhite = smoothstep(0.85, 1.0, bb);
    col = mix(col, vec3(1.0), finalWhite);

    gl_FragColor = vec4(col, 1.0);
  }
`;

export function IntroVideo({
  onEnded,
  onProgress,
}: {
  onEnded: (info: IntroVideoEndInfo) => void;
  onProgress?: (info: IntroProgressInfo) => void;
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
      uBurst: { value: 0 },
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
    let rafId = 0;
    let running = true;
    const t0 = performance.now();

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
    };
    video.addEventListener("loadedmetadata", onMeta);

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
      progress = Math.min(1, Math.max(0, progress + e.deltaY / PIXELS_FOR_FULL_PROGRESS));
    };
    window.addEventListener("wheel", onWheel, { passive: false });

    const loop = () => {
      if (!running) return;
      rafId = requestAnimationFrame(loop);
      const time = (performance.now() - t0) / 1000;
      const videoProgress = Math.min(1, progress / VIDEO_FRACTION);
      const burstProgress = Math.min(1, Math.max(0, (progress - VIDEO_FRACTION) / (1 - VIDEO_FRACTION)));
      // Scrub video
      if (video.duration && !Number.isNaN(video.duration)) {
        const target = videoProgress * video.duration;
        if (Math.abs(video.currentTime - target) > 0.02) {
          try { video.currentTime = target; } catch { /* ignore */ }
        }
      }
      uniforms.uProgress.value = progress;
      uniforms.uBurst.value = burstProgress;
      uniforms.uTime.value = time;
      renderer.render(scene, camera);

      const w = window.innerWidth;
      const h = window.innerHeight;
      onProgressRef.current?.({
        progress,
        videoProgress,
        burstProgress,
        centerX: uniforms.uCenter.value.x * w,
        centerY: uniforms.uCenter.value.y * h,
      });

      if (progress >= 1) fire();
    };
    rafId = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("wheel", onWheel);
      video.removeEventListener("loadedmetadata", onMeta);
      video.removeEventListener("error", onError);
      window.clearTimeout(errorTimer);
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
        src={videoAsset.url}
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
