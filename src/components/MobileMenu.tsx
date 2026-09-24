import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import { FOOTER_COLUMNS, type MenuItem } from "@/lib/siteMenu";
import { getLenis } from "@/lib/smoothScroll";

const INK = "#0E0B22";
const MUTED = "#7A7885";
const FAINT = "#A1A0A9";
const RULE = "#ECECEF";
const PAPER = "#FAFAFA";

/** The dropdowns are hover-driven, so below `lg` the whole menu is unreachable without this. */
export function MobileMenu({ ink }: { ink: string }) {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<string | null>(FOOTER_COLUMNS[0].title);
  // The nav bar's backdrop-filter would make itself the containing block for a
  // fixed panel, so the panel goes to the body instead.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("app-menu-open", { detail: open }));
    if (!open) return;
    const lenis = getLenis();
    lenis?.stop();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      lenis?.start();
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="pointer-events-auto flex items-center justify-center lg:hidden"
        style={{ width: 40, height: 40, marginRight: -10 }}
      >
        <span style={{ position: "relative", display: "block", width: 18, height: 12 }}>
          {[0, 1].map((i) => (
            <span
              key={i}
              style={{
                position: "absolute",
                left: 0,
                width: 18,
                height: 1,
                background: ink,
                top: open ? 6 : i * 11,
                transform: open ? `rotate(${i ? -45 : 45}deg)` : "none",
                transition:
                  "top 240ms cubic-bezier(0.22,1,0.36,1), transform 240ms cubic-bezier(0.22,1,0.36,1), background 200ms ease",
              }}
            />
          ))}
        </span>
      </button>

      {mounted &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            aria-hidden={!open}
            className="fixed inset-x-0 bottom-0 flex flex-col overflow-y-auto lg:hidden"
            style={{
              top: 60,
              zIndex: 79,
              background: PAPER,
              pointerEvents: open ? "auto" : "none",
              opacity: open ? 1 : 0,
              visibility: open ? "visible" : "hidden",
              transition: "opacity 220ms ease-out, visibility 0s linear " + (open ? "0s" : "220ms"),
            }}
          >
            <div style={{ padding: "8px 24px 40px" }}>
              {FOOTER_COLUMNS.map((col) => {
                const expanded = section === col.title;
                return (
                  <div key={col.title} style={{ borderBottom: `1px solid ${RULE}` }}>
                    <button
                      type="button"
                      aria-expanded={expanded}
                      onClick={() => setSection(expanded ? null : col.title)}
                      className="flex w-full items-center justify-between"
                      style={{ padding: "18px 0", fontSize: 15, lineHeight: "22px", color: INK }}
                    >
                      {col.title}
                      <Plus open={expanded} />
                    </button>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateRows: expanded ? "1fr" : "0fr",
                        transition: "grid-template-rows 260ms cubic-bezier(0.22,1,0.36,1)",
                      }}
                    >
                      <ul style={{ overflow: "hidden", margin: 0, padding: 0, listStyle: "none" }}>
                        {col.items.map((item) => (
                          <Row key={item.title} item={item} onNavigate={() => setOpen(false)} />
                        ))}
                        <li style={{ height: 8 }} />
                      </ul>
                    </div>
                  </div>
                );
              })}

              <div className="flex flex-col" style={{ gap: 10, marginTop: 28 }}>
                <button
                  type="button"
                  style={{
                    padding: "13px 0",
                    fontSize: 13,
                    lineHeight: "20px",
                    color: INK,
                    border: `1px solid ${RULE}`,
                  }}
                >
                  Log In
                </button>
                <button
                  type="button"
                  style={{
                    padding: "13px 0",
                    fontSize: 13,
                    lineHeight: "20px",
                    color: "#FFFFFF",
                    background: INK,
                  }}
                >
                  Book a Demo
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

/** Items without a route are the pages that don't exist yet; they stay legible but inert. */
function Row({ item, onNavigate }: { item: MenuItem; onNavigate: () => void }) {
  const dot = (item as { dot?: string }).dot;
  const body = (
    <>
      <span
        aria-hidden
        style={{
          width: 6,
          height: 6,
          marginTop: 7,
          flexShrink: 0,
          background: dot ?? RULE,
          display: "block",
        }}
      />
      <span>
        <span
          style={{
            display: "block",
            fontSize: 14,
            lineHeight: "20px",
            color: item.to ? INK : MUTED,
          }}
        >
          {item.short ?? item.title}
        </span>
        <span
          style={{ display: "block", marginTop: 2, fontSize: 12, lineHeight: "18px", color: FAINT }}
        >
          {item.desc}
        </span>
      </span>
    </>
  );
  const style = { display: "flex", gap: 10, padding: "9px 0" } as const;

  return (
    <li>
      {item.to ? (
        <Link to={item.to} preload="intent" onClick={onNavigate} style={style}>
          {body}
        </Link>
      ) : (
        <span style={style}>{body}</span>
      )}
    </li>
  );
}

function Plus({ open }: { open: boolean }) {
  return (
    <span aria-hidden style={{ position: "relative", display: "block", width: 10, height: 10 }}>
      <span
        style={{ position: "absolute", top: 4.5, left: 0, width: 10, height: 1, background: MUTED }}
      />
      <span
        style={{
          position: "absolute",
          top: 4.5,
          left: 0,
          width: 10,
          height: 1,
          background: MUTED,
          transform: open ? "rotate(0deg)" : "rotate(90deg)",
          transition: "transform 240ms cubic-bezier(0.22,1,0.36,1)",
        }}
      />
    </span>
  );
}
