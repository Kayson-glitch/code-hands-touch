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
  onReady: (objectUrl: string) => void;
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

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    const finish = (url: string) => {
      if (doneRef.current || cancelled) return;
      // Prewarm a hidden <video> so first-frame decode has happened before we hand off.
      const v = document.createElement("video");
      v.muted = true;
      v.playsInline = true;
      v.preload = "auto";
      v.src = url;
      const done = () => {
        if (doneRef.current || cancelled) return;
        doneRef.current = true;
        onReady(url);
      };
      v.addEventListener("loadeddata", done, { once: true });
      v.addEventListener("error", done, { once: true });
      // Safety: don't block the UI forever if events never fire.
      setTimeout(done, 1500);
      try { v.load(); } catch { /* ignore */ }
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
        fontFamily: "Montserrat, ui-sans-serif, system-ui, sans-serif",
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
