import { useEffect, useRef, useState } from "react";
import { Mic, Paperclip, ArrowUp } from "lucide-react";

const SUGGESTIONS = [
  "Fin 能为我做什么？",
  "Fin 可以与我的帮助台集成吗？",
  "Fin 能带来什么结果？",
];

type Msg = { role: "user" | "assistant"; text: string };

export function FinChatDock() {
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const onBg = (e: Event) => {
      const detail = (e as CustomEvent<"light" | "dark">).detail;
      if (detail === "dark") window.setTimeout(() => setVisible(true), 500);
      else setVisible(false);
    };
    window.addEventListener("app-bg-change", onBg);
    return () => window.removeEventListener("app-bg-change", onBg);
  }, []);

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
        { role: "assistant", text: "（演示回复）我已收到你的问题。" },
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
    requestAnimationFrame(() => {
      autoResize();
      inputRef.current?.focus();
    });
  };

  const showSuggestions = messages.filter((m) => m.role === "user").length === 0;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-6 z-30 flex flex-col items-center px-4"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 700ms ease-out, transform 700ms ease-out",
      }}
    >
      <div className="w-full max-w-[720px]">
        {showSuggestions && (
          <div className="mb-4 flex flex-col items-start gap-2">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={s}
                onClick={() => pickSuggestion(s)}
                className="pointer-events-auto rounded-[20px] bg-white/10 px-4 py-2.5 text-left text-white backdrop-blur-md transition-colors hover:bg-white/15"
                style={{
                  fontSize: 14,
                  lineHeight: "22px",
                  marginLeft: i === 1 ? 32 : i === 2 ? 12 : 0,
                  animation: `finRise 500ms ${i * 80}ms both ease-out`,
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div
          className="pointer-events-auto flex items-end gap-2 rounded-full bg-white px-3 py-2"
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.35)" }}
        >
          <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              autoResize();
            }}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="随便问什么…"
            aria-label="向 Fin 提问"
            className="flex-1 resize-none border-0 bg-transparent px-3 py-2 text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
            style={{ fontSize: 15, lineHeight: "22px", maxHeight: 96 }}
          />
          <button
            aria-label="语音输入"
            className="grid h-9 w-9 place-items-center rounded-full text-neutral-500 hover:bg-neutral-100"
          >
            <Mic size={18} />
          </button>
          <button
            aria-label="附件"
            className="grid h-9 w-9 place-items-center rounded-full text-neutral-500 hover:bg-neutral-100"
          >
            <Paperclip size={18} />
          </button>
          <button
            aria-label="发送"
            onClick={send}
            className="grid h-9 w-9 place-items-center rounded-full bg-neutral-200 text-neutral-900 transition-colors hover:bg-neutral-300"
          >
            <ArrowUp size={18} />
          </button>
        </div>

        <p className="mt-3 text-center text-xs text-white/40">
          By chatting with us, you agree to our Privacy Policy
        </p>
      </div>

      <style>{`
        @keyframes finRise {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default FinChatDock;