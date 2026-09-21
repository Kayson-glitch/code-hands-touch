import { useEffect, useRef, useState, type CSSProperties } from "react";
import { AudioLines, ChevronDown, Plus } from "lucide-react";
import { DotArrow } from "@/components/DotArrow";
import { logoAsset as logo } from "@/lib/media";

/* ----------------------------------------------------------------------------
 * Lightweight AI support assistant.
 *
 * States
 *   collapsed   → one rotating hint inside the pill
 *   expanded    → looping suggestion bubbles above the input
 *   chatting    → glass panel: greeting, streamed replies, follow-up chips
 *   minimised   → panel collapsed via the chevron, thread kept, pill stays
 *
 * Replies are matched locally against a small knowledge base derived from the
 * site's own claims, so the assistant never promises anything the page
 * doesn't. High-intent questions (pricing, demo, human) first ask for a work
 * email so the team can follow up, then answer. Unknown questions fall back
 * to a human handoff.
 * ------------------------------------------------------------------------- */

const SUGGESTIONS = [
  "What can Synergy do for my support team?",
  "How fast can it resolve customer issues?",
  "Can it answer in our brand voice?",
  "Does it integrate with our help desk?",
  "How does handoff to a human agent work?",
  "What does pricing look like?",
];

const GREETING = ["Hi there.", "What can I help you with today?"];

type Intent = {
  id: string;
  keywords: string[];
  answer: string;
  followUps: string[];
  /** Ask for a work email before answering (once per conversation). */
  capture?: boolean;
  /** Variant used when the visitor declined to share an email. */
  answerNoEmail?: string;
};

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
    capture: true,
    answer:
      "Pricing scales with resolved conversations rather than seats, so you only pay for outcomes. A specialist will send a tailored quote based on your ticket volume.",
    answerNoEmail:
      "Pricing scales with resolved conversations rather than seats, so you only pay for outcomes. Book a demo whenever you'd like a tailored quote based on your ticket volume.",
    followUps: ["Book a demo", "What can Synergy do for my support team?"],
  },
];

const HANDOFF: Intent = {
  id: "handoff",
  keywords: ["talk to", "human", "sales", "contact", "someone", "person", "demo", "call"],
  capture: true,
  answer:
    "A specialist will reach out within one business day to walk through your setup. In the meantime, feel free to keep asking me anything.",
  answerNoEmail:
    "You can book a demo directly and pick a time that suits you—a specialist will walk through your setup live. In the meantime, feel free to keep asking me anything.",
  followUps: ["What can Synergy do for my support team?", "How fast can it resolve issues?"],
};

const FALLBACK: Intent = {
  id: "fallback",
  keywords: [],
  answer:
    "I'm not certain about that one yet. I can connect you with the team, or you can ask me about resolution speed, brand voice, integrations, routing or pricing.",
  followUps: ["Talk to a human", "Book a demo", "What can Synergy do for my support team?"],
};

const CAPTURE_PROMPT =
  "Happy to help with that. First, could you share your work email? That way a specialist can follow up if you need to step away.";
const CAPTURE_RETRY =
  "That doesn't look like an email address—could you double-check it? You can also type \"skip\" to continue without one.";
const CAPTURE_SKIPPED = "No problem, we can continue without it.";

const EMAIL_RE = /[^\s@]+@[^\s@]+\.[^\s@]{2,}/;
const SKIP_RE = /^\s*(skip|no|no thanks|not now|later|nope)\b/i;

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

type Msg = {
  id: number;
  role: "user" | "assistant";
  text: string;
  followUps?: string[];
  streaming?: boolean;
};

type Lead = {
  stage: "idle" | "asking" | "captured" | "declined";
  email?: string;
  pending?: Intent;
  attempts: number;
};

/* Bubbles cycle upward like incoming chat: one enters from below every
   interval, the oldest drifts up and fades. Hovering pauses the loop. */
const BUBBLE_H = 42;
const BUBBLE_GAP = 8;
const BUBBLE_ROWS = 3;
const BUBBLE_PITCH = BUBBLE_H + BUBBLE_GAP;
const BUBBLE_INTERVAL = 2600;

function SuggestionBubbles({
  onPick,
  bg,
  hoverBg,
  color,
}: {
  onPick: (s: string) => void;
  bg: string;
  hoverBg: string;
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
            className="fin-bubble pointer-events-auto absolute left-0 whitespace-nowrap rounded-[21px] px-4 text-left backdrop-blur-md"
            style={
              {
                height: BUBBLE_H,
                fontSize: 14,
                lineHeight: `${BUBBLE_H}px`,
                color,
                opacity: visible ? 1 : 0,
                transform: `translateY(${y}px) scale(${visible ? 1 : 0.96})`,
                pointerEvents: visible ? "auto" : "none",
                transition:
                  "transform 620ms cubic-bezier(0.22, 1, 0.36, 1), opacity 480ms ease, background-color 200ms ease",
                "--bubble-bg": bg,
                "--bubble-hover-bg": hoverBg,
              } as CSSProperties
            }
          >
            {text}
          </button>
        );
      })}
    </div>
  );
}

/**
 * The resting mark: a solid bubble with the assistant's spark cut out of it.
 * Lucide is a stroke set with no filled variant, and the cut-out is a hole
 * rather than a second colour so the pill's own surface shows through and the
 * icon needs no help on the dark sections.
 */
function AssistantMark({ size = 26, color }: { size?: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        fill={color}
        d="M7 2.5 L17 2.5 A5 5 0 0 1 22 7.5 L22 12.5 A5 5 0 0 1 17 17.5 L12.5 17.5 L7.5 21.5 L7.5 17.5 L7 17.5 A5 5 0 0 1 2 12.5 L2 7.5 A5 5 0 0 1 7 2.5 Z
           M12 5.7 C12.5 8.4 13.6 9.5 16.3 10 C13.6 10.5 12.5 11.6 12 14.3 C11.5 11.6 10.4 10.5 7.7 10 C10.4 9.5 11.5 8.4 12 5.7 Z"
      />
    </svg>
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

/* Reveals the reply word by word so it reads as streamed rather than pasted. */
function StreamedText({
  text,
  active,
  onProgress,
  onDone,
}: {
  text: string;
  active: boolean;
  onProgress: () => void;
  onDone: () => void;
}) {
  const [shown, setShown] = useState(active ? "" : text);
  const doneRef = useRef(!active);

  useEffect(() => {
    if (!active || doneRef.current) return;
    const tokens = text.match(/\S+\s*/g) ?? [text];
    let i = 0;
    let timer = 0;
    const step = () => {
      i += 1;
      setShown(tokens.slice(0, i).join(""));
      onProgress();
      if (i < tokens.length) {
        const tok = tokens[i - 1] ?? "";
        const pause = /[.,;:—]\s*$/.test(tok) ? 120 : 0;
        timer = window.setTimeout(step, 34 + Math.random() * 26 + pause);
      } else {
        doneRef.current = true;
        onDone();
      }
    };
    timer = window.setTimeout(step, 40);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, text]);

  return <>{shown}</>;
}

export function FinChatDock({ alwaysVisible = false }: { alwaysVisible?: boolean } = {}) {
  const [visible, setVisible] = useState(alwaysVisible);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [value, setValue] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [panelClosing, setPanelClosing] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const [lead, setLead] = useState<Lead>({ stage: "idle", attempts: 0 });
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  const replyTimeoutRef = useRef<number | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);
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

  // The mobile menu covers the screen; the dock would float over its CTAs.
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const onMenu = (e: Event) => setMenuOpen((e as CustomEvent<boolean>).detail);
    window.addEventListener("app-menu-open", onMenu);
    return () => window.removeEventListener("app-menu-open", onMenu);
  }, []);

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

  const chatting = messages.length > 0;

  // Click outside: collapse entirely when nothing has happened yet, otherwise
  // just minimise the panel and keep the thread.
  useEffect(() => {
    if (!expanded) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (wrapperRef.current.contains(e.target as Node)) return;
      // Minimised once already: the next click outside puts the mark back, so
      // the resting state stays reachable with a thread going.
      if (!value && !chatting) setExpanded(false);
      else if (chatting && !panelOpen) setExpanded(false);
      else if (chatting) closePanel();
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, value, chatting, panelOpen]);

  const scrollToBottom = (smooth = false) => {
    const el = threadRef.current;
    if (!el) return;
    if (smooth) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    else el.scrollTop = el.scrollHeight;
  };

  // Follow new content only while the reader is already at the bottom.
  useEffect(() => {
    if (stickRef.current) scrollToBottom();
  }, [messages, typing]);

  const onThreadScroll = () => {
    const el = threadRef.current;
    if (!el) return;
    const gap = el.scrollHeight - el.clientHeight - el.scrollTop;
    const bottom = gap < 24;
    stickRef.current = bottom;
    setAtBottom(bottom);
  };

  useEffect(
    () => () => {
      if (replyTimeoutRef.current) window.clearTimeout(replyTimeoutRef.current);
      if (closeTimeoutRef.current) window.clearTimeout(closeTimeoutRef.current);
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

  const focusInput = () => requestAnimationFrame(() => inputRef.current?.focus());

  const openPanel = () => {
    if (closeTimeoutRef.current) window.clearTimeout(closeTimeoutRef.current);
    setPanelClosing(false);
    setPanelOpen(true);
  };

  const closePanel = () => {
    if (!panelOpen || panelClosing) return;
    setPanelClosing(true);
    closeTimeoutRef.current = window.setTimeout(() => {
      setPanelOpen(false);
      setPanelClosing(false);
    }, 220);
  };

  const pushAssistant = (text: string, followUps?: string[]) => {
    setMessages((m) => [...m, { id: nextId(), role: "assistant", text, followUps, streaming: true }]);
  };

  const reply = (text: string, followUps?: string[]) => {
    setTyping(true);
    // First token lands after a short "thinking" pause; the rest streams.
    replyTimeoutRef.current = window.setTimeout(() => {
      setTyping(false);
      pushAssistant(text, followUps);
    }, 480 + Math.random() * 320);
  };

  const ask = (raw: string) => {
    const text = raw.trim();
    if (!text || typing) return;
    stickRef.current = true;
    setMessages((m) => [...m, { id: nextId(), role: "user", text }]);
    setValue("");
    openPanel();
    requestAnimationFrame(() => {
      autoResize();
      inputRef.current?.focus();
    });

    // Lead capture takes precedence while we're waiting for an email.
    if (lead.stage === "asking") {
      const email = text.match(EMAIL_RE)?.[0];
      const pending = lead.pending ?? FALLBACK;
      if (email) {
        setLead({ stage: "captured", email, attempts: 0 });
        reply(`Thanks, ${email} noted. ${pending.answer}`, pending.followUps);
        return;
      }
      if (SKIP_RE.test(text) || lead.attempts >= 1) {
        // Declining is remembered for the session so we never nag twice.
        setLead({ stage: "declined", attempts: 0 });
        reply(`${CAPTURE_SKIPPED} ${pending.answerNoEmail ?? pending.answer}`, pending.followUps);
        return;
      }
      // Anything else that reads like a real question gets answered, and we
      // gently re-ask once rather than blocking the conversation.
      const other = matchIntent(text);
      if (other !== FALLBACK && other.id !== "greeting") {
        setLead((l) => ({ ...l, attempts: l.attempts + 1 }));
        reply(`${other.answer} And whenever you're ready, drop your work email so a specialist can follow up.`, other.followUps);
        return;
      }
      setLead((l) => ({ ...l, attempts: l.attempts + 1 }));
      reply(CAPTURE_RETRY);
      return;
    }

    const intent = matchIntent(text);
    if (intent.capture && lead.stage === "idle") {
      setLead({ stage: "asking", pending: intent, attempts: 0 });
      reply(CAPTURE_PROMPT);
      return;
    }
    const answer = lead.stage === "declined" ? intent.answerNoEmail ?? intent.answer : intent.answer;
    reply(answer, intent.followUps);
  };

  const send = () => ask(value);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    } else if (e.key === "Escape") {
      if (chatting && panelOpen) closePanel();
      else if (!value && !chatting) setExpanded(false);
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
    if (chatting) openPanel();
    focusInput();
  };

  const reset = () => {
    if (replyTimeoutRef.current) window.clearTimeout(replyTimeoutRef.current);
    setTyping(false);
    setMessages([]);
    setLead({ stage: "idle", attempts: 0 });
    setValue("");
    setPanelOpen(true);
    setPanelClosing(false);
    stickRef.current = true;
    setAtBottom(true);
    focusInput();
  };

  const markStreamed = (id: number) => {
    setMessages((m) => m.map((msg) => (msg.id === id ? { ...msg, streaming: false } : msg)));
  };

  const showSuggestions = expanded && !chatting;
  const showPanel = expanded && chatting && panelOpen;
  // Minimised (panel closed but thread kept) returns to the short pill.
  const wide = expanded && (!chatting || panelOpen || panelClosing);
  const hasText = value.trim().length > 0;

  const onDark = theme === "dark" && darkSurface;
  const pillBg = onDark ? "rgba(255,255,255,0.20)" : "#FFFFFF";
  const pillBorder = onDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid #F1F1F3";
  const pillShadow = onDark ? "0 12px 40px rgba(0,0,0,0.05)" : "0 12px 20px rgba(0,0,0,0.05)";
  const textMain = onDark ? "#FFFFFF" : "#0E0B22";
  const textPlaceholder = "#A1A0A9";
  const textMuted = onDark ? "rgba(255,255,255,0.70)" : "#7A7885";
  const suggestionBg = onDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)";
  const suggestionHoverBg = onDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.10)";
  const glassBg = onDark ? "rgba(24,24,27,0.62)" : "rgba(255,255,255,0.72)";
  const glassBorder = onDark ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(14,11,34,0.08)";
  const glassShadow = onDark ? "0 24px 60px rgba(0,0,0,0.35)" : "0 24px 60px rgba(14,11,34,0.12)";
  const userBubbleBg = onDark ? "rgba(255,255,255,0.16)" : "rgba(14,11,34,0.06)";
  const chipBorder = onDark ? "1px solid rgba(255,255,255,0.18)" : "1px solid rgba(14,11,34,0.12)";
  const sendBg = hasText ? (onDark ? "#FFFFFF" : "#0E0B22") : onDark ? "rgba(255,255,255,0.35)" : "#C7C6CD";
  const sendIcon = hasText && onDark ? "#0E0B22" : "#FFFFFF";
  const iconBtnHover = onDark ? "hover:bg-white/[0.08]" : "hover:bg-black/[0.04]";

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const showFollowUps = !typing && lastAssistant?.followUps && !lastAssistant.streaming;

  const show = visible && !footerVisible && !menuOpen;
  return (
    <div
      className="pointer-events-none fixed bottom-6 right-6 flex flex-col items-end md:bottom-10 md:right-10"
      style={{
        // Fixed and shrink-wrapped, `items-end` would have nothing to align
        // against, so the widest state sets the column and everything in it
        // hangs off the right margin.
        width: "min(520px, calc(100vw - 48px))",
        zIndex: 10000,
        opacity: show ? 1 : 0,
        transform: show ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 700ms ease-out, transform 700ms ease-out",
      }}
    >
      {/* Resting state: the mark on its own. Everything else is behind a click. */}
      {!expanded && (
        <button
          type="button"
          aria-label="Ask Synergy"
          onClick={expand}
          className="pointer-events-auto grid place-items-center rounded-full transition-transform hover:scale-105 active:scale-95"
          style={{
            width: 56,
            height: 56,
            backgroundColor: pillBg,
            border: pillBorder,
            boxShadow: pillShadow,
            backdropFilter: onDark ? "blur(6px)" : "none",
            animation: "finFabIn 320ms cubic-bezier(0.22, 1, 0.36, 1) both",
          }}
        >
          <AssistantMark color={textMain} />
        </button>
      )}

      {/* Empty until opened — the children below all gate on `expanded`. */}
      <div
        ref={wrapperRef}
        className="w-full"
        style={{
          // never wider than the phone minus the dock's side padding
          maxWidth: wide ? "min(520px, calc(100vw - 48px))" : "min(400px, calc(100vw - 48px))",
          transition: "max-width 420ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {showSuggestions && (
          <SuggestionBubbles
            onPick={pickSuggestion}
            bg={suggestionBg}
            hoverBg={suggestionHoverBg}
            color={textMain}
          />
        )}

        {showPanel && (
          <div
            className="pointer-events-auto relative mb-4 flex flex-col overflow-hidden"
            style={{
              height: "min(480px, calc(100vh - 220px))",
              borderRadius: 24,
              backgroundColor: glassBg,
              border: glassBorder,
              boxShadow: glassShadow,
              backdropFilter: "blur(28px) saturate(1.4)",
              WebkitBackdropFilter: "blur(28px) saturate(1.4)",
              transformOrigin: "50% 100%",
              animation: panelClosing
                ? "finPanelOut 220ms cubic-bezier(0.4, 0, 1, 1) both"
                : "finPanelIn 420ms cubic-bezier(0.22, 1, 0.36, 1) both",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between"
              style={{ padding: "16px 16px 10px 20px", fontSize: 13, lineHeight: "18px", color: textMain }}
            >
              <span className="inline-flex items-center gap-2.5">
                <img
                  src={logo.url}
                  alt=""
                  aria-hidden
                  style={{ width: 22, height: 22, borderRadius: 999, objectFit: "cover", display: "block" }}
                />
                <span style={{ fontWeight: 500 }}>Synergy assistant</span>
                <span
                  aria-hidden
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 999,
                    backgroundColor: "#34D399",
                    boxShadow: "0 0 0 3px rgba(52,211,153,0.18)",
                  }}
                />
              </span>
              <span className="inline-flex items-center gap-1">
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-full px-2.5 transition-opacity hover:opacity-70"
                  style={{ color: textMuted, fontSize: 12, lineHeight: "28px" }}
                >
                  Clear
                </button>
                <button
                  type="button"
                  aria-label="Minimise"
                  onClick={closePanel}
                  className={`grid h-8 w-8 place-items-center rounded-full ${iconBtnHover}`}
                  style={{ color: textMuted }}
                >
                  <ChevronDown size={18} strokeWidth={1.75} />
                </button>
              </span>
            </div>

            {/* Thread */}
            <div
              ref={threadRef}
              data-lenis-prevent
              onScroll={onThreadScroll}
              className="fin-thread flex flex-1 flex-col gap-4 overflow-y-auto"
              style={{
                padding: "12px 20px 28px",
                overscrollBehavior: "contain",
                WebkitMaskImage:
                  "linear-gradient(to bottom, transparent 0, #000 12px, #000 calc(100% - 16px), transparent 100%)",
                maskImage:
                  "linear-gradient(to bottom, transparent 0, #000 12px, #000 calc(100% - 16px), transparent 100%)",
              }}
            >
              <div style={{ color: textMain, fontSize: 14, lineHeight: "22px", padding: "8px 4px 12px" }}>
                {GREETING.map((line) => (
                  <p key={line} style={{ margin: 0 }}>
                    {line}
                  </p>
                ))}
              </div>

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
                        maxWidth: mine ? "80%" : "100%",
                        padding: mine ? "10px 16px" : "4px 4px",
                        borderRadius: 20,
                        backgroundColor: mine ? userBubbleBg : "transparent",
                        color: textMain,
                        fontSize: 14,
                        lineHeight: "22px",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {mine ? (
                        m.text
                      ) : (
                        <StreamedText
                          text={m.text}
                          active={!!m.streaming}
                          onProgress={() => {
                            if (stickRef.current) scrollToBottom();
                          }}
                          onDone={() => markStreamed(m.id)}
                        />
                      )}
                    </div>
                  </div>
                );
              })}

              {typing && (
                <div className="flex justify-start" style={{ padding: "8px 4px" }}>
                  <TypingDots color={textMuted} />
                </div>
              )}

              {showFollowUps && (
                <div className="flex flex-wrap gap-2" style={{ padding: "4px 0 0 4px", animation: "finRise 320ms ease-out both" }}>
                  {lastAssistant!.followUps!.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => ask(f)}
                      className="transition-opacity hover:opacity-70"
                      style={{
                        padding: "8px 14px",
                        borderRadius: 999,
                        border: chipBorder,
                        color: textMain,
                        fontSize: 13,
                        lineHeight: "18px",
                        backgroundColor: "transparent",
                      }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Jump to latest */}
            <button
              type="button"
              aria-label="Scroll to latest"
              onClick={() => scrollToBottom(true)}
              className="absolute left-1/2 grid h-9 w-9 place-items-center rounded-full"
              style={{
                bottom: 12,
                transform: `translate(-50%, ${atBottom ? 8 : 0}px)`,
                opacity: atBottom ? 0 : 1,
                pointerEvents: atBottom ? "none" : "auto",
                backgroundColor: onDark ? "#FFFFFF" : "#FFFFFF",
                color: "#0E0B22",
                boxShadow: "0 6px 18px rgba(14,11,34,0.16)",
                transition: "opacity 220ms ease, transform 220ms ease",
              }}
            >
              <ChevronDown size={18} strokeWidth={2} />
            </button>
          </div>
        )}

        {/* Input pill */}
        {expanded && (
          <div
            className="pointer-events-auto flex justify-between"
            onClick={() => chatting && !panelOpen && expand()}
            style={{
              animation: "finPillIn 380ms cubic-bezier(0.22, 1, 0.36, 1) both",
              minHeight: 48,
              borderRadius: 666,
              paddingLeft: 20,
              paddingRight: 6,
              paddingTop: 6,
              paddingBottom: 6,
              gap: 4,
              alignItems: wide ? "flex-end" : "center",
              backgroundColor: pillBg,
              border: pillBorder,
              backdropFilter: onDark ? "blur(6px)" : "none",
              boxShadow: pillShadow,
              transition:
                "box-shadow 300ms ease, background-color 300ms ease, border-color 300ms ease",
              cursor: wide ? "text" : "pointer",
            }}
          >
            <textarea
              ref={inputRef}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                autoResize();
                if (chatting && !panelOpen) openPanel();
              }}
              onKeyDown={onKeyDown}
              onFocus={() => {
                if (chatting && !panelOpen) openPanel();
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

            <button
              type="button"
              aria-label="Voice input"
              className={`grid h-9 shrink-0 place-items-center rounded-full ${iconBtnHover}`}
              style={{
                width: wide ? 36 : 0,
                opacity: wide ? 1 : 0,
                overflow: "hidden",
                pointerEvents: wide ? "auto" : "none",
                transition: "width 320ms ease, opacity 240ms ease",
                color: textMuted,
              }}
            >
              <AudioLines size={17} strokeWidth={1.75} />
            </button>
            <button
              type="button"
              aria-label="Add attachment"
              className={`grid h-9 shrink-0 place-items-center rounded-full ${iconBtnHover}`}
              style={{
                width: wide ? 36 : 0,
                opacity: wide ? 1 : 0,
                overflow: "hidden",
                pointerEvents: wide ? "auto" : "none",
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
              disabled={typing || !hasText}
              className="grid shrink-0 place-items-center transition-colors hover:opacity-80"
              style={{
                width: 36,
                height: 36,
                borderRadius: 20,
                marginLeft: 4,
                backgroundColor: sendBg,
                color: sendIcon,
                opacity: typing ? 0.5 : 1,
                cursor: hasText && !typing ? "pointer" : "default",
                transition: "background-color 200ms ease, color 200ms ease, opacity 200ms ease",
              }}
            >
              <DotArrow size={24} direction="up" connectOnHover={false} dotRadius={0.5} />
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes finRise {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes finFabIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes finPillIn {
          from { opacity: 0; transform: translateY(10px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes finTyping {
          0%, 80%, 100% { opacity: 0.35; transform: translateY(0); }
          40% { opacity: 1; transform: translateY(-2px); }
        }
        @keyframes finPanelIn {
          from { opacity: 0; transform: translateY(16px) scale(0.94); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes finPanelOut {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(12px) scale(0.96); }
        }
        .fin-dock-input::placeholder {
          color: ${textPlaceholder};
          opacity: 1;
        }
        .fin-thread {
          scrollbar-width: none;
        }
        .fin-thread::-webkit-scrollbar {
          display: none;
        }
        .fin-bubble {
          background-color: var(--bubble-bg);
        }
        .fin-bubble:hover {
          background-color: var(--bubble-hover-bg);
        }
        @media (prefers-reduced-motion: reduce) {
          .fin-bubble, .fin-thread * { transition: none !important; animation: none !important; }
        }
      `}</style>
    </div>
  );
}

export default FinChatDock;
