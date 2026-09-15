import { useEffect, useRef, useState } from "react";
import { AudioLines, Plus } from "lucide-react";
import { DotArrow } from "@/components/DotArrow";

/* ----------------------------------------------------------------------------
 * Lightweight AI support assistant.
 *
 * States
 *   collapsed   → one rotating hint inside the pill
 *   expanded    → looping suggestion bubbles above the input
 *   chatting    → message thread + typing indicator + follow-up chips
 *   handoff     → assistant offers a human / demo when it cannot answer
 *
 * Replies are matched locally against a small knowledge base derived from the
 * site's own claims, so the assistant never promises anything the page
 * doesn't. Unknown questions fall back to a human handoff.
 * ------------------------------------------------------------------------- */

const SUGGESTIONS = [
  "What can Synergy do for my support team?",
  "How fast can it resolve customer issues?",
  "Can it answer in our brand voice?",
  "Does it integrate with our help desk?",
  "How does handoff to a human agent work?",
  "What does pricing look like?",
];

type Intent = {
  id: string;
  keywords: string[];
  answer: string;
  followUps: string[];
};

const HANDOFF_FOLLOW_UPS = ["Talk to a human", "Book a demo"];

const KNOWLEDGE: Intent[] = [
  {
    id: "greeting",
    keywords: ["hello", "hey", "good morning", "good afternoon", "thanks", "thank you"],
    answer:
      "Hi, I'm Synergy's assistant. Ask me anything about resolution speed, brand voice, integrations, routing or pricing—or I can connect you with the team.",
    followUps: ["What can Synergy do for my support team?", "How fast can it resolve issues?", "Book a demo"],
  },
  {
    id: "capabilities",
    keywords: ["what can", "do for", "capabilit", "feature", "help me", "what is synergy", "what does synergy"],
    answer:
      "Synergy is an AI support agent that resolves around 93% of routine customer issues instantly, guides new agents with on-brand suggestions, handles multi-step workflows end to end, and hands off to a human with full context when needed.",
    followUps: ["How fast can it resolve issues?", "Does it integrate with our help desk?", "Book a demo"],
  },
  {
    id: "speed",
    keywords: ["fast", "speed", "resolve", "resolution", "response time", "seconds", "instant", "93"],
    answer:
      "Most answers arrive in under 3 seconds. Across customers, roughly 93% of issues are resolved on first contact without a human touching the ticket.",
    followUps: ["What happens to the other 7%?", "Can it answer in our brand voice?", "Book a demo"],
  },
  {
    id: "handoff-rest",
    keywords: ["other 7", "rest", "cannot resolve", "can't resolve", "fails", "unresolved"],
    answer:
      "Anything Synergy can't close confidently is routed to the right human queue with a context summary, so the agent picks up exactly where the customer left off—no retelling.",
    followUps: ["How does routing work?", "Talk to a human"],
  },
  {
    id: "brand",
    keywords: ["brand", "voice", "tone", "style", "sound like", "language", "multilingual", "translate"],
    answer:
      "Yes. Synergy is tuned to your style guide—from playful to strictly formal—cites your own help center and policy pages, and answers in 30+ languages without separate content sets. Guardrails block promises or refunds you never approved.",
    followUps: ["What guardrails are in place?", "How fast can it resolve issues?", "Book a demo"],
  },
  {
    id: "guardrails",
    keywords: ["guardrail", "hallucinat", "accura", "wrong answer", "safe", "control"],
    answer:
      "Every reply is grounded in your approved knowledge sources, and off-topic claims, discounts or refunds outside policy are blocked before they reach the customer. Anything uncertain is escalated instead of guessed.",
    followUps: ["How is our data protected?", "Talk to a human"],
  },
  {
    id: "integration",
    keywords: ["integrat", "help desk", "helpdesk", "zendesk", "intercom", "salesforce", "hubspot", "crm", "api", "connect", "ticket"],
    answer:
      "Synergy connects to your CRM, order system and ticketing tool in minutes, and works across web chat, email, in-app and social in one unified inbox—so context follows the customer everywhere.",
    followUps: ["Which channels are supported?", "How long does setup take?", "Book a demo"],
  },
  {
    id: "channels",
    keywords: ["channel", "omnichannel", "email", "whatsapp", "social", "in-app", "mobile", "web chat"],
    answer:
      "Web chat, email, in-app and social threads live in one timeline. A customer can start on mobile and finish on desktop without losing anything, and Synergy can reach out proactively—for example on order delays—before they ask.",
    followUps: ["Does it integrate with our help desk?", "Book a demo"],
  },
  {
    id: "setup",
    keywords: ["setup", "set up", "onboard", "how long", "implement", "deploy", "go live"],
    answer:
      "Typical teams connect their knowledge base and help desk in an afternoon and go live within the first week, starting with routine questions and expanding to complex workflows as confidence grows.",
    followUps: ["Does it integrate with our help desk?", "Book a demo"],
  },
  {
    id: "routing",
    keywords: ["rout", "human", "agent", "handoff", "hand off", "escalat", "priority", "vip", "queue"],
    answer:
      "Synergy reads urgency, sentiment and account value in real time, so VIP and at-risk customers reach a human before they churn, and billing, shipping or technical tickets land with the right specialist—with the full history attached.",
    followUps: ["What happens to the other 7%?", "Talk to a human"],
  },
  {
    id: "insight",
    keywords: ["insight", "analytic", "report", "data", "dashboard", "quality", "metric", "measure"],
    answer:
      "Recurring questions are clustered into themes you can act on, deflection analytics show which answers save the most agent hours, and every conversation is quality-scored—not a 2% random sample. Gaps feed straight back into your knowledge base.",
    followUps: ["How fast can it resolve issues?", "Book a demo"],
  },
  {
    id: "security",
    keywords: ["secur", "privacy", "gdpr", "soc", "compliance", "protect", "private", "encrypt"],
    answer:
      "Synergy supports private deployment with customer-controlled data, and your knowledge stays yours. For compliance documentation and a full security review, our team can walk you through it.",
    followUps: ["Talk to a human", "Book a demo"],
  },
  {
    id: "pricing",
    keywords: ["pric", "cost", "plan", "how much", "budget", "fee", "subscription"],
    answer:
      "Pricing scales with resolved conversations rather than seats, so you only pay for outcomes. The team can share a tailored quote based on your ticket volume.",
    followUps: ["Book a demo", "Talk to a human"],
  },
];

const HANDOFF: Intent = {
  id: "handoff",
  keywords: ["talk to", "human", "sales", "contact", "someone", "person", "demo", "call"],
  answer:
    "Happy to connect you. Book a demo and a specialist will walk through your setup, or leave your email here and the team will reach out within one business day.",
  followUps: ["Book a demo", "What can Synergy do for my support team?"],
};

const FALLBACK: Intent = {
  id: "fallback",
  keywords: [],
  answer:
    "I'm not certain about that one yet. I can connect you with the team, or you can ask me about resolution speed, brand voice, integrations, routing or pricing.",
  followUps: [...HANDOFF_FOLLOW_UPS, "What can Synergy do for my support team?"],
};

function matchIntent(text: string): Intent {
  const q = text.toLowerCase();
  if (/^\s*(hi|hey|hello|yo)\b[\s!.,]*$/.test(q)) return KNOWLEDGE[0]!;
  if (/\b(demo|talk to|human|sales|contact)\b/.test(q) && !/handoff|hand off|route/.test(q)) return HANDOFF;
  let best: Intent | null = null;
  let bestScore = 0;
  for (const intent of KNOWLEDGE) {
    const score = intent.keywords.reduce((n, k) => (q.includes(k) ? n + 1 : n), 0);
    if (score > bestScore) {
      best = intent;
      bestScore = score;
    }
  }
  return best ?? FALLBACK;
}

type Msg = { id: number; role: "user" | "assistant"; text: string; followUps?: string[] };

/* Bubbles cycle upward like incoming chat: one enters from below every
   interval, the oldest drifts up and fades. Hovering pauses the loop. */
const BUBBLE_H = 42;
const BUBBLE_GAP = 8;
const BUBBLE_ROWS = 3;
const BUBBLE_PITCH = BUBBLE_H + BUBBLE_GAP;
const BUBBLE_INTERVAL = 2600;
const BUBBLE_OFFSETS = [0, 28, 10];

function SuggestionBubbles({
  onPick,
  bg,
  color,
}: {
  onPick: (s: string) => void;
  bg: string;
  color: string;
}) {
  const [cursor, setCursor] = useState(BUBBLE_ROWS - 1);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => setCursor((c) => c + 1), BUBBLE_INTERVAL);
    return () => window.clearInterval(id);
  }, [paused]);

  // Render one exiting bubble above and one waiting below the visible rows so
  // every transition is a continuous slide rather than a mount/unmount.
  const first = cursor - BUBBLE_ROWS;
  const last = cursor + 1;
  const items: number[] = [];
  for (let i = Math.max(0, first); i <= last; i += 1) items.push(i);

  return (
    <div
      className="relative mb-4 w-full"
      style={{ height: BUBBLE_ROWS * BUBBLE_PITCH - BUBBLE_GAP }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {items.map((i) => {
        const slot = i - (cursor - (BUBBLE_ROWS - 1));
        const visible = slot >= 0 && slot < BUBBLE_ROWS;
        const text = SUGGESTIONS[i % SUGGESTIONS.length]!;
        const y = slot * BUBBLE_PITCH + (slot < 0 ? -12 : slot >= BUBBLE_ROWS ? 12 : 0);
        return (
          <button
            key={i}
            type="button"
            tabIndex={visible ? 0 : -1}
            onClick={() => onPick(text)}
            className="pointer-events-auto absolute left-0 whitespace-nowrap rounded-[21px] px-4 text-left backdrop-blur-md"
            style={{
              height: BUBBLE_H,
              marginLeft: BUBBLE_OFFSETS[i % BUBBLE_OFFSETS.length],
              fontSize: 14,
              lineHeight: `${BUBBLE_H}px`,
              backgroundColor: bg,
              color,
              opacity: visible ? 1 : 0,
              transform: `translateY(${y}px) scale(${visible ? 1 : 0.96})`,
              pointerEvents: visible ? "auto" : "none",
              transition:
                "transform 620ms cubic-bezier(0.22, 1, 0.36, 1), opacity 480ms ease",
            }}
          >
            {text}
          </button>
        );
      })}
    </div>
  );
}

function TypingDots({ color }: { color: string }) {
  return (
    <span className="inline-flex items-center gap-1" aria-label="Synergy is typing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 5,
            height: 5,
            borderRadius: 999,
            backgroundColor: color,
            animation: `finTyping 1.1s ${i * 160}ms infinite ease-in-out`,
          }}
        />
      ))}
    </span>
  );
}

export function FinChatDock({ alwaysVisible = false }: { alwaysVisible?: boolean } = {}) {
  const [visible, setVisible] = useState(alwaysVisible);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [value, setValue] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const focusTimeoutRef = useRef<number | null>(null);
  const replyTimeoutRef = useRef<number | null>(null);
  const idRef = useRef(0);

  useEffect(() => {
    const onBg = (e: Event) => {
      const detail = (e as CustomEvent<"light" | "dark">).detail;
      setTheme(detail === "dark" ? "dark" : "light");
      if (alwaysVisible) setVisible(true);
      else setVisible(detail === "dark");
    };
    window.addEventListener("app-bg-change", onBg);
    return () => window.removeEventListener("app-bg-change", onBg);
  }, [alwaysVisible]);

  // Dark glass only while the black section is the surface behind the dock;
  // the light third screen flips it back to the white pill.
  const [darkSurface, setDarkSurface] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const probe = window.innerHeight - 40;
      const dark = Array.from(document.querySelectorAll("[data-dark-section]")).some((el) => {
        const r = el.getBoundingClientRect();
        return r.top <= probe && r.bottom > probe;
      });
      setDarkSurface(dark);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Hide the dock while a footer (or any [data-progressive-blur-hide] element)
  // is visible near the bottom of the viewport, so it never overlaps the
  // copyright bar / social icons.
  const [footerVisible, setFooterVisible] = useState(false);
  useEffect(() => {
    const visibleEls = new Set<Element>();
    const observed = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visibleEls.add(e.target);
          else visibleEls.delete(e.target);
        }
        setFooterVisible(visibleEls.size > 0);
      },
      { threshold: 0.01, rootMargin: "0px 0px -80px 0px" },
    );
    const scan = () => {
      const targets = Array.from(
        document.querySelectorAll<HTMLElement>("[data-progressive-blur-hide]"),
      );
      for (const el of targets) {
        if (!observed.has(el)) {
          observed.add(el);
          io.observe(el);
        }
      }
      for (const el of Array.from(observed)) {
        if (!el.isConnected) {
          observed.delete(el);
          visibleEls.delete(el);
          io.unobserve(el);
        }
      }
      setFooterVisible(visibleEls.size > 0);
    };
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      io.disconnect();
    };
  }, []);

  // Rotate the collapsed placeholder hint while collapsed and empty.
  useEffect(() => {
    if (expanded || value) return;
    const id = window.setInterval(() => {
      setHintIndex((i) => (i + 1) % SUGGESTIONS.length);
    }, 3000);
    return () => window.clearInterval(id);
  }, [expanded, value]);

  // Collapse when clicking outside if nothing has been typed or sent.
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

  // Keep the newest message in view.
  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  useEffect(
    () => () => {
      if (replyTimeoutRef.current) window.clearTimeout(replyTimeoutRef.current);
    },
    [],
  );

  const autoResize = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 96) + "px";
  };

  const nextId = () => {
    idRef.current += 1;
    return idRef.current;
  };

  const ask = (raw: string) => {
    const text = raw.trim();
    if (!text || typing) return;
    setMessages((m) => [...m, { id: nextId(), role: "user", text }]);
    setValue("");
    requestAnimationFrame(() => {
      autoResize();
      inputRef.current?.focus();
    });
    setTyping(true);
    const intent = matchIntent(text);
    // Longer answers "take longer to type" so the pacing feels considered.
    const delay = 500 + Math.min(900, intent.answer.length * 3);
    replyTimeoutRef.current = window.setTimeout(() => {
      setTyping(false);
      setMessages((m) => [
        ...m,
        { id: nextId(), role: "assistant", text: intent.answer, followUps: intent.followUps },
      ]);
    }, delay);
  };

  const send = () => ask(value);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    } else if (e.key === "Escape" && !value && messages.length === 0) {
      setExpanded(false);
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

  const reset = () => {
    if (replyTimeoutRef.current) window.clearTimeout(replyTimeoutRef.current);
    setTyping(false);
    setMessages([]);
    setValue("");
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const chatting = messages.length > 0;
  const showSuggestions = expanded && !chatting;

  const onDark = theme === "dark" && darkSurface;
  const dockBg = onDark ? "rgba(255,255,255,0.20)" : "#FFFFFF";
  const dockBorder = onDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid #F1F1F3";
  const dockShadow = onDark ? "0 12px 40px rgba(0,0,0,0.05)" : "0 12px 20px rgba(0,0,0,0.05)";
  const textMain = onDark ? "#FFFFFF" : "#0E0B22";
  const textPlaceholder = "#A1A0A9";
  const textMuted = onDark ? "rgba(255,255,255,0.70)" : "#7A7885";
  const suggestionBg = onDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)";
  const threadBg = onDark ? "rgba(255,255,255,0.08)" : "#FFFFFF";
  const userBubbleBg = onDark ? "rgba(255,255,255,0.16)" : "rgba(14,11,34,0.06)";
  const chipBorder = onDark ? "1px solid rgba(255,255,255,0.18)" : "1px solid rgba(14,11,34,0.12)";
  const sendBg = focused ? "#FFFFFF" : "#C7C6CD";
  const sendIcon = focused ? "#0E0B22" : "#FFFFFF";

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");

  const show = visible && !footerVisible;
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-10 flex flex-col items-center px-4"
      style={{
        zIndex: 10000,
        opacity: show ? 1 : 0,
        transform: show ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 700ms ease-out, transform 700ms ease-out",
      }}
    >
      <div
        ref={wrapperRef}
        className="w-full"
        style={{
          maxWidth: expanded ? 520 : 400,
          transition: "max-width 420ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {showSuggestions && (
          <SuggestionBubbles onPick={pickSuggestion} bg={suggestionBg} color={textMain} />
        )}

        {chatting && (
          <div
            className="pointer-events-auto mb-3 overflow-hidden backdrop-blur-md"
            style={{
              borderRadius: 20,
              backgroundColor: threadBg,
              border: dockBorder,
              boxShadow: dockShadow,
              animation: "finRise 400ms ease-out both",
            }}
          >
            <div
              className="flex items-center justify-between"
              style={{ padding: "10px 16px 8px", fontSize: 12, lineHeight: "16px", color: textMuted }}
            >
              <span className="inline-flex items-center gap-2">
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 999,
                    backgroundColor: "#34D399",
                    boxShadow: "0 0 0 3px rgba(52,211,153,0.18)",
                  }}
                />
                Synergy assistant
              </span>
              <span className="inline-flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => ask("Talk to a human")}
                  className="transition-opacity hover:opacity-70"
                  style={{ color: textMuted }}
                >
                  Talk to a human
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="transition-opacity hover:opacity-70"
                  style={{ color: textMuted }}
                >
                  Clear
                </button>
              </span>
            </div>

            <div
              ref={threadRef}
              className="flex flex-col gap-2.5 overflow-y-auto"
              style={{ maxHeight: 280, padding: "4px 12px 12px", scrollbarWidth: "thin" }}
            >
              {messages.map((m) => {
                const mine = m.role === "user";
                return (
                  <div
                    key={m.id}
                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                    style={{ animation: "finRise 320ms ease-out both" }}
                  >
                    <div
                      style={{
                        maxWidth: "84%",
                        padding: mine ? "8px 14px" : "8px 4px",
                        borderRadius: 18,
                        backgroundColor: mine ? userBubbleBg : "transparent",
                        color: textMain,
                        fontSize: 14,
                        lineHeight: "21px",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {m.text}
                    </div>
                  </div>
                );
              })}

              {typing && (
                <div className="flex justify-start" style={{ padding: "6px 4px" }}>
                  <TypingDots color={textMuted} />
                </div>
              )}

              {!typing && lastAssistant?.followUps && (
                <div className="flex flex-wrap gap-2" style={{ paddingTop: 4 }}>
                  {lastAssistant.followUps.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => ask(f)}
                      className="transition-opacity hover:opacity-70"
                      style={{
                        padding: "6px 12px",
                        borderRadius: 999,
                        border: chipBorder,
                        color: textMain,
                        fontSize: 12,
                        lineHeight: "16px",
                        backgroundColor: "transparent",
                      }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div
          className="pointer-events-auto flex justify-between"
          onClick={() => !expanded && expand()}
          style={{
            minHeight: 48,
            borderRadius: 666,
            paddingLeft: 20,
            paddingRight: 6,
            paddingTop: 6,
            paddingBottom: 6,
            gap: 4,
            alignItems: expanded ? "flex-end" : "center",
            backgroundColor: dockBg,
            border: dockBorder,
            backdropFilter: onDark ? "blur(6px)" : "none",
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
              onFocus={() => {
                if (focusTimeoutRef.current) window.clearTimeout(focusTimeoutRef.current);
                setFocused(true);
              }}
              onBlur={() => {
                if (focusTimeoutRef.current) window.clearTimeout(focusTimeoutRef.current);
                focusTimeoutRef.current = window.setTimeout(() => setFocused(false), 120);
              }}
              rows={1}
              placeholder={chatting ? "Ask a follow-up…" : "Ask Synergy anything…"}
              aria-label="Ask Synergy"
              className="fin-dock-input flex-1 resize-none border-0 bg-transparent py-2 focus:outline-none"
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
            type="button"
            aria-label="Voice input"
            className={`grid h-9 shrink-0 place-items-center rounded-full ${
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
            <AudioLines size={17} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            aria-label="Add attachment"
            className={`grid h-9 shrink-0 place-items-center rounded-full ${
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
            <Plus size={18} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            aria-label="Send"
            onClick={send}
            disabled={typing}
            className="grid shrink-0 place-items-center transition-colors hover:opacity-80"
            style={{
              width: 36,
              height: 36,
              borderRadius: 20,
              marginLeft: 4,
              backgroundColor: sendBg,
              color: sendIcon,
              opacity: typing ? 0.5 : 1,
              transition: "background-color 200ms ease, color 200ms ease, opacity 200ms ease",
            }}
          >
            <DotArrow size={24} direction="up" connectOnHover={false} dotRadius={0.5} />
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
        @keyframes finTyping {
          0%, 80%, 100% { opacity: 0.35; transform: translateY(0); }
          40% { opacity: 1; transform: translateY(-2px); }
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
