import { useEffect, useState } from "react";

/**
 * Global "inverted" (dark) skin flag. The second screen owns the threshold and
 * broadcasts `app-invert`; every surface that needs to re-skin subscribes here.
 */
export function useInverted() {
  const [inverted, setInverted] = useState(false);

  useEffect(() => {
    const read = () =>
      document.documentElement.dataset.invert === "1" ? true : false;
    setInverted(read());
    const onInvert = (e: Event) => {
      setInverted(Boolean((e as CustomEvent<boolean>).detail));
    };
    window.addEventListener("app-invert", onInvert);
    return () => window.removeEventListener("app-invert", onInvert);
  }, []);

  return inverted;
}

export function setInvertedTheme(next: boolean) {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  const cur = el.dataset.invert === "1";
  if (cur === next) return;
  if (next) el.dataset.invert = "1";
  else delete el.dataset.invert;
  window.dispatchEvent(new CustomEvent("app-invert", { detail: next }));
}
