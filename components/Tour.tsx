"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "./ui";
import { IconArrowRight, IconChevronLeft, IconSparkles } from "./icons";

interface Step {
  target: string; // data-tour attribute value
  title: string;
  body: string;
}

// All targets live on the dashboard (nav links are always visible there),
// so the tour runs on "/" and spotlights each real section in turn.
const STEPS: Step[] = [
  {
    target: "hero",
    title: "Welcome to First Point Animal Services",
    body: "A quick tour of the AI-assisted operations console. Each section is highlighted as we go — the rest of the screen stays visible so you keep your bearings.",
  },
  {
    target: "views",
    title: "Views of your operation",
    body: "Switch between Today (a command view of what needs attention), the Jobs register (List / Board / Grid), a Calendar of arrivals & departures, Insights, an exportable Report, and a Bin for deleted jobs.",
  },
  {
    target: "today",
    title: "Operations Today",
    body: "The default landing pulls together everything needing action across the whole operation — outstanding compliance, HC/passport document gaps, vaccination expiries, roster coverage shortfalls, arrival-day weather and the next 48 hours — each linking straight to the record. Open any job for a quick-look drawer with a QR you can scan from a phone.",
  },
  {
    target: "nav-new",
    title: "Create a booking",
    body: "Start a job from a sample email, an uploaded PDF (the AI reads it), the customer enquiry form, a CSV import, or manually. The assistant extracts the fields and flags anything low-confidence; you confirm.",
  },
  {
    target: "nav-housing",
    title: "Housing & occupancy",
    body: "The BIP holding units by zone (stables, kennels, aviary, aqua, isolation) with the between-shipment cleaning cycle and live utilisation. Add, edit or remove units; each carries a QR to open it from a phone.",
  },
  {
    target: "nav-animals",
    title: "Animal registry",
    body: "Per-animal microchip, passport, owner and vaccinations — with due-soon / expired alerts and a CITES flag. Add, edit or remove animals; each has a scannable microchip QR.",
  },
  {
    target: "nav-staffing",
    title: "Staff planning",
    body: "A weekly/monthly roster with booking-derived coverage (crew needed vs. rostered, flagging understaffed days), timesheets with a payroll export, a leave request-and-approve calendar, and per-shipment staffing. AI can import the existing spreadsheet.",
  },
  {
    target: "nav-copilot",
    title: "Ask the AI Copilot",
    body: "Ask questions across all shipments — ‘what's arriving in 48 hours?’ or ‘draft the NVWA notice’. It only sees your jobs; decision-support, not an autonomous agent.",
  },
  {
    target: "nav-rules",
    title: "AI compliance rules",
    body: "Pick a shipment and the assistant reasons the documents and checks its species, route and direction require — each with the responsible authority (NVWA / TRACES / CITES / IATA), a severity and a rationale.",
  },
  {
    target: "nav-portal",
    title: "Agent portal",
    body: "A demo of the external surface agents and airlines use — submit a booking request, upload documents to a checklist, confirm the AWB, and track status.",
  },
  {
    target: "nav-guide",
    title: "Full guide & languages",
    body: "The complete how-it-works guide lives here and can be saved as a PDF. The whole interface also runs in five languages — switch it from the Accessibility menu, top-right. That's the tour — enjoy!",
  },
];

const PAD = 8;

export function Tour() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Locate + track the current step's target element.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let el: Element | null = null;
    let tries = 0;

    const measure = () => {
      if (el && !cancelled) setRect(el.getBoundingClientRect());
    };
    const locate = () => {
      if (cancelled) return;
      el = document.querySelector(`[data-tour="${STEPS[i].target}"]`);
      if (el) {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        setTimeout(measure, 300);
      } else if (tries++ < 20) {
        setTimeout(locate, 100);
      } else {
        setRect(null); // not found → tooltip centers, full dim
      }
    };

    setRect(null);
    locate();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [i, open, pathname]);

  function start() {
    setI(0);
    setOpen(true);
    if (pathname !== "/") router.push("/");
  }

  // Started from the support widget (or anywhere) via a global event.
  useEffect(() => {
    const handler = () => start();
    window.addEventListener("fpas:start-tour", handler);
    return () => window.removeEventListener("fpas:start-tour", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
  function go(n: number) {
    setI(Math.max(0, Math.min(STEPS.length - 1, n)));
  }
  function close() {
    setOpen(false);
    setRect(null);
  }

  const step = STEPS[i];
  const last = i === STEPS.length - 1;

  // Tooltip placement.
  let ttStyle: CSSProperties = {
    left: "50%",
    top: "50%",
    transform: "translate(-50%,-50%)",
    width: "min(380px, 92vw)",
  };
  if (rect && typeof window !== "undefined") {
    const w = Math.min(380, window.innerWidth - 24);
    const gap = 14;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top =
      spaceBelow > 240 ? rect.bottom + gap : Math.max(gap, rect.top - 240 - gap);
    const left = Math.min(
      Math.max(gap, rect.left),
      window.innerWidth - w - gap
    );
    ttStyle = { left, top, width: w };
  }

  return (
    <>
      {open && (
        <div className="no-print">
          {/* Click blocker (transparent; the dim comes from the spotlight shadow) */}
          <div className="fixed inset-0 z-[60]" onClick={close} />

          {/* Spotlight highlight, or full dim if target not found */}
          {rect ? (
            <div
              className="pointer-events-none fixed z-[61] rounded-xl border-2 border-white/90 transition-all duration-200"
              style={{
                left: rect.left - PAD,
                top: rect.top - PAD,
                width: rect.width + PAD * 2,
                height: rect.height + PAD * 2,
                boxShadow:
                  "0 0 0 9999px rgba(15,34,51,0.55), 0 0 0 4px rgba(42,167,154,0.55)",
              }}
            />
          ) : (
            <div className="fixed inset-0 z-[61] bg-ink/55" />
          )}

          {/* Tooltip */}
          <div
            className="fixed z-[62] animate-fade-up rounded-xl2 border border-line bg-panel p-5 shadow-lift"
            style={ttStyle}
          >
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-white shadow-glow">
                <IconSparkles width={15} height={15} />
              </span>
              <span className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">
                Step {i + 1} of {STEPS.length}
              </span>
            </div>
            <h2 className="mt-2.5 font-display text-lg font-bold text-ink">
              {step.title}
            </h2>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-soft">
              {step.body}
            </p>

            <div className="mt-3 flex gap-1.5">
              {STEPS.map((_, idx) => (
                <span
                  key={idx}
                  className={`h-1.5 flex-1 rounded-full ${
                    idx <= i ? "bg-primary" : "bg-line"
                  }`}
                />
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={close}
                className="text-[12px] text-ink-faint hover:text-ink"
              >
                Skip tour
              </button>
              <div className="flex items-center gap-2">
                {i > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => go(i - 1)}>
                    <IconChevronLeft width={15} height={15} />
                    Back
                  </Button>
                )}
                {last ? (
                  <Button size="sm" onClick={close}>
                    Done
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => go(i + 1)}>
                    Next
                    <IconArrowRight width={15} height={15} />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
