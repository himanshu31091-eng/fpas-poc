"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "./ui";
import { usePrefs } from "./prefs";
import { IconArrowRight, IconClose } from "./icons";

// ---------------------------------------------------------------------------
// Getting-started guide — the "where do I begin?" onboarding for a new user.
// Lays out the setup-before-operate journey in order. Dismissible; the choice
// is remembered on the device. Purely instructional (links to each step).
// ---------------------------------------------------------------------------

const DISMISS_KEY = "fpas.setupGuide.dismissed.v1";

interface Step {
  n: number;
  key: string; // ui.setup.<key>.title/.desc/.cta
  href: string;
}

const PHASE_1: Step[] = [
  { n: 1, key: "s1", href: "/staffing" },
  { n: 2, key: "s2", href: "/staffing" },
  { n: 3, key: "s3", href: "/settings" },
];

const PHASE_2: Step[] = [
  { n: 4, key: "s4", href: "/jobs/new" },
  { n: 5, key: "s5", href: "/animals" },
];

export function SetupGuide() {
  const { t } = usePrefs();
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
            {t("ui.setup.eyebrow")}
          </div>
          <h2 className="mt-0.5 font-display text-lg font-bold text-ink">
            {t("ui.setup.title")}
          </h2>
          <p className="mt-1 max-w-2xl text-[13px] text-ink-soft">
            {t("ui.setup.subtitle")}
          </p>
        </div>
        <button
          onClick={dismiss}
          title={t("ui.setup.dismiss")}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/70 text-ink-soft transition-colors hover:text-ink"
        >
          <IconClose width={15} height={15} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <StepGroup label={t("ui.setup.phase1")} steps={PHASE_1} t={t} />
        <StepGroup label={t("ui.setup.phase2")} steps={PHASE_2} t={t} />
      </div>

      <button
        onClick={dismiss}
        className="mt-4 text-[12px] font-medium text-ink-faint transition-colors hover:text-ink"
      >
        {t("ui.setup.dismiss")}
      </button>
    </Card>
  );
}

function StepGroup({
  label,
  steps,
  t,
}: {
  label: string;
  steps: Step[];
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
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
              <div className="text-[13px] font-semibold text-ink">
                {t(`ui.setup.${s.key}.title`)}
              </div>
              <p className="mt-0.5 text-[12px] leading-relaxed text-ink-soft">
                {t(`ui.setup.${s.key}.desc`)}
              </p>
              <Link
                href={s.href}
                className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline"
              >
                {t(`ui.setup.${s.key}.cta`)}
                <IconArrowRight width={13} height={13} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
