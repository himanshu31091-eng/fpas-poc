"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "./ui";
import { IconArrowRight, IconClose } from "./icons";

// ---------------------------------------------------------------------------
// Getting-started guide — the "where do I begin?" onboarding for a new user.
// Lays out the setup-before-operate journey in order. Dismissible; the choice
// is remembered on the device. Purely instructional (links to each step).
// ---------------------------------------------------------------------------

const DISMISS_KEY = "fpas.setupGuide.dismissed.v1";

interface Step {
  n: number;
  title: string;
  desc: string;
  href: string;
  cta: string;
}

const PHASE_1: Step[] = [
  {
    n: 1,
    title: "Add your people & equipment",
    desc: "Staffing → Resources: add each person (full name, role, default shift) and your trucks, crates and stalls.",
    href: "/staffing",
    cta: "Open Staffing",
  },
  {
    n: 2,
    title: "Set the roster",
    desc: "Staffing → Roster: press “Fill from plan” to lay everyone’s shifts onto the week, then adjust any day.",
    href: "/staffing",
    cta: "Open roster",
  },
  {
    n: 3,
    title: "Check your settings",
    desc: "Organisation basics, appearance and language for this workspace.",
    href: "/settings",
    cta: "Open Settings",
  },
];

const PHASE_2: Step[] = [
  {
    n: 4,
    title: "Take your first booking",
    desc: "New booking: paste an agent email and let the AI extract it, or key one in by hand.",
    href: "/jobs/new",
    cta: "New booking",
  },
  {
    n: 5,
    title: "House the animals",
    desc: "Animals → “Place in housing”, or Housing → assign an animal to a holding unit.",
    href: "/animals",
    cta: "Open Animals",
  },
];

export function SetupGuide() {
  const [dismissed, setDismissed] = useState(true); // default hidden until we read storage

  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  function dismiss() {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  if (dismissed) return null;

  return (
    <Card className="mb-5 border-primary/25 bg-primary-soft/20 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wide text-primary">
            New here? Start here
          </div>
          <h2 className="mt-0.5 font-display text-lg font-bold text-ink">
            Getting started
          </h2>
          <p className="mt-1 max-w-2xl text-[13px] text-ink-soft">
            Set your workspace up once, then run shipments through it. Work down
            the list — it takes about five minutes.
          </p>
        </div>
        <button
          onClick={dismiss}
          title="Hide this"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/70 text-ink-soft transition-colors hover:text-ink"
        >
          <IconClose width={15} height={15} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <StepGroup label="First — set up (one time)" steps={PHASE_1} />
        <StepGroup label="Then — operate (every day)" steps={PHASE_2} />
      </div>

      <button
        onClick={dismiss}
        className="mt-4 text-[12px] font-medium text-ink-faint transition-colors hover:text-ink"
      >
        Got it — hide this
      </button>
    </Card>
  );
}

function StepGroup({ label, steps }: { label: string; steps: Step[] }) {
  return (
    <div>
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
        {label}
      </div>
      <div className="space-y-2">
        {steps.map((s) => (
          <div
            key={s.n}
            className="flex items-start gap-3 rounded-card border border-line bg-panel p-3"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-[12px] font-bold text-white">
              {s.n}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-ink">{s.title}</div>
              <p className="mt-0.5 text-[12px] leading-relaxed text-ink-soft">
                {s.desc}
              </p>
              <Link
                href={s.href}
                className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline"
              >
                {s.cta}
                <IconArrowRight width={13} height={13} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
