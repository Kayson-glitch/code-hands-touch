import { useEffect, useRef, useState } from "react";

const MIN_CLIMB_MS = 900;
const MIN_HOLD_MS = 250;
const CLIMB_RATE = 100 / MIN_CLIMB_MS; // % per ms

export function IntroPreloader({
  src,
  onReady,
  onFail,
}: {
  src: string;
  onReady: (objectUrl: string, videoEl: HTMLVideoElement | null) => void;
  onFail: () => void;
}) {
  const [displayPct, setDisplayPct] = useState(0);
  const [hasProgress, setHasProgress] = useState(true);
  const displayPctRef = useRef(0);
  const doneRef = useRef(false);
  const realPctRef = useRef(0);
  const downloadDoneRef = useRef(false);
  const holdStartRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const handshakeVideoRef = useRef<HTMLVideoElement | null>(null);
  const handedOffRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    // Staged decode handshake:
    //   A. metadata ready (dims + duration)
    //   B. first-frame decoded (loadeddata / readyState>=2)
    //   C. canplay (readyState>=3) so subsequent seeks are cheap
    //   D. warmup seek to 0 and back (primes the seek path)
    //   E. one play()/pause() cycle to wake the decoder
    //   F. requestVideoFrameCallback tick (confirms a frame is compositable)
    // Any single step may fall through on a 1.5s safety timeout; the whole
    // handshake is best-effort — if it fails we still hand off the URL and
    // IntroVideo falls back to its own cold-start path.
    const waitEvent = (target: HTMLVideoElement, name: string, timeoutMs: number) =>
      new Promise<void>((resolve) => {
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          target.removeEventListener(name, finish);
          resolve();
        };
        target.addEventListener(name, finish, { once: true });
        setTimeout(finish, timeoutMs);
      });

    const waitFrame = (target: HTMLVideoElement, timeoutMs: number) =>
      new Promise<void>((resolve) => {
        let settled = false;
        const finish = () => { if (settled) return; settled = true; resolve(); };
        const rvfc = (target as unknown as {
          requestVideoFrameCallback?: (cb: () => void) => number;
        }).requestVideoFrameCallback;
        if (typeof rvfc !== "function") { finish(); return; }
        try { rvfc.call(target, finish); } catch { finish(); return; }
        setTimeout(finish, timeoutMs);
      });

    const runHandshake = async (url: string): Promise<HTMLVideoElement | null> => {
      const v = document.createElement("video");
      v.muted = true;
      v.playsInline = true;
      v.setAttribute("playsinline", "");
      v.preload = "auto";
      (v as HTMLVideoElement & { crossOrigin?: string }).crossOrigin = "anonymous";
      Object.assign(v.style, {
        position: "fixed",
        left: "0",
        top: "0",
        width: "1px",
        height: "1px",
        opacity: "0",
        pointerEvents: "none",
        zIndex: "-1",
      });
      document.body.appendChild(v);
      handshakeVideoRef.current = v;
      v.src = url;
      try { v.load(); } catch { /* ignore */ }
      try {
        // A + B — metadata and first decoded frame
        if (v.readyState < 1) await waitEvent(v, "loadedmetadata", 1500);
        if (cancelled) return null;
        if (v.readyState < 2) await waitEvent(v, "loadeddata", 1500);
        if (cancelled) return null;
        // C — canplay (readyState>=3). Skip wait if already there.
        if (v.readyState < 3) await waitEvent(v, "canplay", 1200);
        if (cancelled) return null;
        // D — seek warmup
        try {
          v.currentTime = 0;
          await waitEvent(v, "seeked", 800);
        } catch { /* ignore */ }
        if (cancelled) return null;
        // E — decoder warmup via play/pause
        try {
          const p = v.play();
          if (p && typeof (p as Promise<void>).then === "function") await p;
          v.pause();
          try { v.currentTime = 0; } catch { /* ignore */ }
        } catch { /* ignore (autoplay policy, blob quirks) */ }
        if (cancelled) return null;
        // F — one compositable frame
        await waitFrame(v, 500);
      } catch { /* fall through */ }
      return v;
    };

    const finish = (url: string) => {
      if (doneRef.current || cancelled) return;
      doneRef.current = true;
      runHandshake(url)
        .then((v) => {
          if (cancelled) return;
          handedOffRef.current = true;
          onReady(url, v);
        })
        .catch(() => {
          if (cancelled) return;
          handedOffRef.current = true;
          onReady(url, null);
        });
    };

    let lastTime = performance.now();

    const tick = (now: number) => {
      if (cancelled || doneRef.current) return;

      const dt = now - lastTime;
      lastTime = now;

      // Display climbs at a bounded rate, but never exceeds real progress.
      const target = realPctRef.current;
      const currentDisplay = Math.min(target, displayPctRef.current + CLIMB_RATE * dt);
      displayPctRef.current = currentDisplay;
      setDisplayPct(currentDisplay);

      if (downloadDoneRef.current && currentDisplay >= 100) {
        if (holdStartRef.current === null) {
          holdStartRef.current = now;
        } else if (now - holdStartRef.current >= MIN_HOLD_MS) {
          const url = objectUrlRef.current;
          if (url) finish(url);
          return;
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    (async () => {
      try {
        const res = await fetch(src, { signal: controller.signal });
        if (!res.ok || !res.body) throw new Error("no body");
        const totalStr = res.headers.get("Content-Length");
        const total = totalStr ? parseInt(totalStr, 10) : 0;
        if (!total) setHasProgress(false);
        const reader = res.body.getReader();
        const chunks: Uint8Array[] = [];
        let received = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            received += value.length;
            if (total) {
              realPctRef.current = Math.min(100, (received / total) * 100);
            }
          }
        }
        if (cancelled) return;
        if (total) {
          realPctRef.current = 100;
        }
        const blob = new Blob(chunks as BlobPart[], { type: "video/mp4" });
        objectUrlRef.current = URL.createObjectURL(blob);
        downloadDoneRef.current = true;
        // If there was no progress, skip the climb/hold and finish immediately.
        if (!total) {
          finish(objectUrlRef.current);
        }
      } catch {
        if (!cancelled) onFail();
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      // If we created a URL but never handed it off, revoke it.
      if (objectUrlRef.current && !doneRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      // If a handshake video was created but never handed off, clean it up.
      const v = handshakeVideoRef.current;
      if (v && !handedOffRef.current) {
        try { v.pause(); } catch { /* ignore */ }
        try { v.removeAttribute("src"); v.load(); } catch { /* ignore */ }
        if (v.parentNode) v.parentNode.removeChild(v);
      }
    };
  }, [src, onReady, onFail]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        zIndex: 100,
        display: "grid",
        placeItems: "center",
        color: "#fff",
        fontFamily: "var(--font-sans)",
        fontWeight: 500,
        fontSize: 48,
        lineHeight: "56px",
        letterSpacing: "-0.01em",
      }}
    >
      {hasProgress ? `${Math.floor(displayPct)}%` : ""}
    </div>
  );
}

export default IntroPreloader;
