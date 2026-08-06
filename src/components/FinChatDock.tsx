import { useEffect, useRef, useState } from "react";
import { Mic, Paperclip, ArrowUp } from "lucide-react";

const SUGGESTIONS = [
  "What can Fin do for me?",
  "Can Fin integrate with my help desk?",
  "What results can Fin deliver?",
];

type Msg = { role: "user" | "assistant"; text: string };

export function FinChatDock() {
  const [visible, setVisible] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [value, setValue] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onBg = (e: Event) => {
      const detail = (e as CustomEvent<"light" | "dark">).detail;
      setTheme(detail === "dark" ? "dark" : "light");
      if (detail === "dark") setVisible(true);
      else setVisible(false);
    };
    window.addEventListener("app-bg-change", onBg);
    return () => window.removeEventListener("app-bg-change", onBg);
  }, []);

  // Dark glass only while the black section is the surface behind the dock;
  // the light third screen flips it back to the white pill.
  const [darkSurface, setDarkSurface] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const dark = document.querySelector("[data-dark-section]");
      if (!dark) {
        setDarkSurface(false);
        return;
      }
      const r = dark.getBoundingClientRect();
      const probe = window.innerHeight - 40;
      setDarkSurface(r.top <= probe && r.bottom > probe);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Rotate collapsed placeholder hint every 3s while collapsed & empty
  useEffect(() => {
    if (expanded || value) return;
    const id = window.setInterval(() => {
      setHintIndex((i) => (i + 1) % SUGGESTIONS.length);
    }, 3000);
    return () => window.clearInterval(id);
  }, [expanded, value]);

  // Collapse when clicking outside (if empty)
  useEffect(() => {
    if (!expanded) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (wrapperRef.current.contains(e.target as Node)) return;
      if (!value && messages.length === 0) setExpanded(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [expanded, value, messages.length]);

  const autoResize = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 96) + "px";
  };

  const send = () => {
    const text = value.trim();
    if (!text) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setValue("");
    requestAnimationFrame(autoResize);
    window.setTimeout(() => {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "(Demo reply) I received your question." },
      ]);
    }, 800);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const pickSuggestion = (s: string) => {
    setValue(s);
    setExpanded(true);
    requestAnimationFrame(() => {
      autoResize();
      inputRef.current?.focus();
    });
  };

  const expand = () => {
    setExpanded(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const showSuggestions =
    expanded && messages.filter((m) => m.role === "user").length === 0;

  const onDark = theme === "dark" && darkSurface;
  const dockBg = onDark ? "rgba(10,10,10,0.72)" : "#FFFFFF";
  const dockBorder = onDark
    ? "1px solid rgba(255,255,255,0.15)"
    : "1px solid transparent";
  const dockShadow = onDark
    ? "0 12px 20px rgba(0,0,0,0.25)"
    : "0 12px 20px rgba(0,0,0,0.05)";
  const textMain = onDark ? "#FFFFFF" : "#0E0B22";
  const textPlaceholder = onDark ? "rgba(255,255,255,0.45)" : "#A1A0A9";
  const textMuted = onDark ? "rgba(255,255,255,0.65)" : "#7A7885";
  const suggestionBg = onDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)";
  const sendBg = onDark ? "#FFFFFF" : "#C7C6CD";
  const sendIcon = onDark ? "#0E0B22" : "#FFFFFF";

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-6 z-30 flex flex-col items-center px-4"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 700ms ease-out, transform 700ms ease-out",
      }}
    >
      <div
        ref={wrapperRef}
        className="w-full"
        style={{
          maxWidth: expanded ? 680 : 400,
          transition: "max-width 420ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {showSuggestions && (
          <div className="mb-4 flex flex-col items-start gap-2">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={s}
                onClick={() => pickSuggestion(s)}
                className="pointer-events-auto rounded-[20px] px-4 py-2.5 text-left backdrop-blur-md transition-colors"
                style={{
                  fontSize: 14,
                  lineHeight: "22px",
                  marginLeft: i === 1 ? 32 : i === 2 ? 12 : 0,
                  animation: `finRise 500ms ${i * 80}ms both ease-out`,
                  backgroundColor: suggestionBg,
                  color: textMain,
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div
          className="pointer-events-auto flex items-center justify-between"
          onClick={() => !expanded && expand()}
          style={{
            minHeight: 48,
            borderRadius: 666,
            paddingLeft: 20,
            paddingRight: 6,
            paddingTop: 6,
            paddingBottom: 6,
            gap: 8,
            alignItems: expanded ? "flex-end" : "center",
            backgroundColor: dockBg,
            border: dockBorder,
            backdropFilter: onDark ? "blur(18px) saturate(140%)" : "none",
            boxShadow: dockShadow,
            transition:
              "box-shadow 300ms ease, background-color 300ms ease, border-color 300ms ease",
            cursor: expanded ? "text" : "pointer",
          }}
        >

          {expanded ? (
            <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              autoResize();
            }}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="Ask anything…"
            aria-label="Ask Fin"
            className="fin-dock-input flex-1 resize-none border-0 bg-transparent py-2 placeholder:text-ink-faint focus:outline-none"
            style={{
              fontSize: 14,
              lineHeight: "20px",
              maxHeight: 96,
              color: textMain,
            }}
          />
          ) : (
            <div
              key={hintIndex}
              className="flex-1 truncate"
              style={{
                fontSize: 14,
                lineHeight: "20px",
                animation: "finHintFade 500ms ease-out",
                color: textPlaceholder,
              }}
              aria-hidden
            >
              {SUGGESTIONS[hintIndex]}
            </div>
          )}
          <button
            aria-label="语音输入"
            className={`grid h-9 w-9 place-items-center rounded-full ${
              onDark ? "hover:bg-white/[0.08]" : "hover:bg-black/[0.04]"
            }`}
            style={{
              width: expanded ? 36 : 0,
              opacity: expanded ? 1 : 0,
              overflow: "hidden",
              pointerEvents: expanded ? "auto" : "none",
              transition: "width 320ms ease, opacity 240ms ease",
              color: textMuted,
            }}
          >
            <Mic size={18} />
          </button>
          <button
            aria-label="附件"
            className={`grid h-9 w-9 place-items-center rounded-full ${
              onDark ? "hover:bg-white/[0.08]" : "hover:bg-black/[0.04]"
            }`}
            style={{
              width: expanded ? 36 : 0,
              opacity: expanded ? 1 : 0,
              overflow: "hidden",
              pointerEvents: expanded ? "auto" : "none",
              transition: "width 320ms ease 40ms, opacity 240ms ease 40ms",
              color: textMuted,
            }}
          >
            <Paperclip size={18} />
          </button>
          <button
            aria-label="发送"
            onClick={send}
            className="grid shrink-0 place-items-center transition-opacity hover:opacity-80"
            style={{
              width: 36,
              height: 36,
              borderRadius: 20,
              backgroundColor: sendBg,
              color: sendIcon,
            }}
          >
            <ArrowUp size={24} />
          </button>
        </div>


      </div>

      <style>{`
        @keyframes finRise {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes finHintFade {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fin-dock-input::placeholder {
          color: ${textPlaceholder};
          opacity: 1;
        }
      `}</style>
    </div>
  );
}

export default FinChatDock;