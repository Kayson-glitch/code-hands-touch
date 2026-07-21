import { useEffect, useRef, useState } from "react";

export function IntroPreloader({
  src,
  onReady,
  onFail,
}: {
  src: string;
  onReady: (objectUrl: string) => void;
  onFail: () => void;
}) {
  const [pct, setPct] = useState(0);
  const [hasProgress, setHasProgress] = useState(true);
  const doneRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    let objectUrl: string | null = null;

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
              setPct(Math.min(100, (received / total) * 100));
            }
          }
        }
        if (cancelled) return;
        setPct(100);
        const blob = new Blob(chunks as BlobPart[], { type: "video/mp4" });
        objectUrl = URL.createObjectURL(blob);
        finish(objectUrl);
      } catch {
        if (!cancelled) onFail();
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
      // If we created a URL but never handed it off, revoke it.
      if (objectUrl && !doneRef.current) URL.revokeObjectURL(objectUrl);
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
      {hasProgress ? `${Math.floor(pct)}%` : ""}
    </div>
  );
}

export default IntroPreloader;