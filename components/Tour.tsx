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
    body: "A quick tour of the AI-assisted workflow. Each section is highlighted as we go — the rest of the screen stays visible so you keep your bearings.",
  },
  {
    target: "views",
    title: "Five ways to view work",
    body: "Switch between the Jobs list, a Calendar of arrivals & departures, an Insights dashboard, a Report you can export to Excel (.xlsx), and a Bin for deleted jobs.",
  },
  {
    target: "briefing",
    title: "AI daily briefing",
    body: "One click and the assistant reads the whole operation and tells you what's at risk — most urgent first, now including adverse arrival-day weather at Schiphol.",
  },
  {
    target: "flightmanager",
    title: "Flight Manager queue",
    body: "Booked horse shipments arrive here as ‘Pending’. Click ‘Accept’ to turn one into a job.",
  },
  {
    target: "layouts",
    title: "List, Board & Grid",
    body: "View the same jobs three ways — a detailed List, a Kanban Board grouped by status, or a card Grid. On the Board you can create a job inline with ‘+ New job’, or jump to the full intake.",
  },
  {
    target: "joblist",
    title: "Your shipments",
    body: "Every job with its readiness status, its ops stage (Enquiry → Confirmed → Ready → …), open steps, (mock) flight status, and the live Amsterdam arrival-day weather — with a welfare flag when it's too hot or cold for live animals. Click any row to open its workspace — extraction, readiness, the horse loading-list builder (HC/passport checks, grooms, SPX), submissions, documents.",
  },
  {
    target: "nav-new",
    title: "Create a booking",
    body: "Start a job from a sample email, an uploaded PDF (the AI reads it), the customer enquiry form, a CSV import, or manually.",
  },
  {
    target: "nav-staffing",
    title: "Staff planning",
    body: "The FPAS Amsterdam roster: a weekly/monthly availability board, a leave request-and-approve calendar, and an AI import that reads the planning spreadsheet. It also derives coverage from the bookings — how many crew each day's shipments need vs. who's rostered on — and flags understaffed days. Each shipment can request and assign staff from those available that day.",
  },
  {
    target: "nav-copilot",
    title: "Ask the AI Copilot",
    body: "Ask questions across all shipments — ‘what's arriving in 48 hours?’ or ‘draft the NVWA notice’.",
  },
  {
    target: "nav-requirements",
    title: "Requirements & traceability",
    body: "See how the POC maps to the FPAS brief — every requirement with a Built / Simulated / Future status, plus the extras we added. Exportable as a PDF.",
  },
  {
    target: "nav-guide",
    title: "Full guide",
    body: "The complete how-it-works guide lives here and can be saved as a PDF. That's the tour — enjoy!",
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
