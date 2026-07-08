"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Confidence, JobStatus, OpsStage, Urgency } from "@/lib/types";
import { STAGE_META } from "@/lib/jobs";
import { IconFMark } from "./icons";

export function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "subtle";
  size?: "sm" | "md";
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-[0.98]";
  const sizes = {
    sm: "px-3 py-1.5 text-[13px]",
    md: "px-4 py-2 text-sm",
  }[size];
  const styles = {
    primary:
      "bg-accent text-fpasnavy shadow-glow hover:brightness-105 hover:-translate-y-0.5",
    ghost:
      "border border-line-strong bg-white/70 text-ink hover:border-primary/50 hover:bg-white hover:-translate-y-0.5",
    subtle: "text-primary hover:bg-primary-soft",
  }[variant];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes} ${styles}`}
    >
      {children}
    </button>
  );
}

export function Card({
  children,
  className = "",
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={`rounded-card border border-line bg-panel shadow-card ${
        hover ? "lift hover:border-primary/40 hover:shadow-lift" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-primary">
      {children}
    </div>
  );
}

const CONF_STYLE: Record<Confidence, string> = {
  high: "bg-green-soft text-green",
  medium: "bg-amber-soft text-amber",
  low: "bg-red-soft text-red",
};

export function ConfidenceBadge({ level }: { level: Confidence }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${CONF_STYLE[level]}`}
    >
      {level}
    </span>
  );
}

const URGENCY_STYLE: Record<Urgency, string> = {
  critical: "bg-red-soft text-red",
  soon: "bg-amber-soft text-amber",
  routine: "bg-primary-soft text-primary",
};

export function UrgencyBadge({ level }: { level: Urgency }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${URGENCY_STYLE[level]}`}
    >
      {level}
    </span>
  );
}

/**
 * Marks a surface that is demonstrated with mock data / no live integration.
 * Mirrors the "Simulated" status in the requirements traceability document.
 */
export function SimTag({
  label = "Simulated",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span
      title="Demonstrated with mock data — no live integration in this POC"
      className={`inline-flex items-center gap-1 rounded-full border border-dashed border-amber/50 bg-amber-soft px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide text-amber ${className}`}
    >
      {label}
    </span>
  );
}

export function Spinner({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-ink-soft">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-line-strong border-t-primary" />
      {label}
    </div>
  );
}

/** Themed full-panel loader: a bobbing FPAS mark over trotting dots. */
export function BrandLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-6">
      <span className="flex h-14 w-14 animate-bob items-center justify-center rounded-xl2 bg-accent shadow-glow">
        <IconFMark width={26} height={26} className="text-fpasnavy" />
      </span>
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-trot rounded-full bg-primary"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
        {label}
      </div>
    </div>
  );
}

const STATUS_STYLE: Record<JobStatus, string> = {
  new: "bg-bg text-ink-faint ring-1 ring-line-strong",
  extracted: "bg-primary-soft text-primary",
  in_progress: "bg-amber-soft text-amber",
  ready: "bg-green-soft text-green",
};

const STATUS_TEXT: Record<JobStatus, string> = {
  new: "New",
  extracted: "Needs review",
  in_progress: "In progress",
  ready: "Ready",
};

export function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide ${STATUS_STYLE[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {STATUS_TEXT[status]}
    </span>
  );
}

/** Manual ops-stage chip (commercial/handling lifecycle). Renders nothing if unset. */
export function OpsStageChip({
  stage,
  className = "",
}: {
  stage?: OpsStage;
  className?: string;
}) {
  if (!stage) return null;
  return (
    <span
      title="Ops stage — the manual handling lifecycle (distinct from regulatory readiness)"
      className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${STAGE_META[stage]} ${className}`}
    >
      {stage}
    </span>
  );
}

const FLIGHT_STYLE: Record<string, string> = {
  on_time: "bg-green-soft text-green",
  delayed: "bg-amber-soft text-amber",
  landed: "bg-primary-soft text-primary",
};

/** Mock flight-status chip (Flight Manager feel). */
export function FlightStatusChip({
  state,
  label,
}: {
  state: string;
  label: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide ${
        FLIGHT_STYLE[state] ?? "bg-bg text-ink-faint"
      }`}
      title="Mock flight status — no live feed in this POC"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

/** Graceful failure panel for a live AI call — message + retry, never a crash. */
export function ErrorRetry({
  message,
  onRetry,
  busy,
}: {
  message: string;
  onRetry: () => void;
  busy?: boolean;
}) {
  return (
    <div className="animate-fade-up rounded-card border border-red/40 bg-red-soft/50 px-5 py-5">
      <div className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-wide text-red">
        <span className="h-2 w-2 rounded-full bg-red" />
        AI unavailable
      </div>
      <p className="mt-1.5 text-sm text-ink">{message}</p>
      <div className="mt-3">
        <Button variant="ghost" onClick={onRetry} disabled={busy}>
          {busy ? "Retrying…" : "Retry"}
        </Button>
      </div>
    </div>
  );
}

/** Count-up animated number for the dashboard stat tiles. */
export function CountUp({ value, className = "" }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(0);

  useEffect(() => {
    const from = ref.current;
    const to = value;
    if (from === to) {
      setDisplay(to);
      return;
    }
    const duration = 550;
    let raf = 0;
    let start = 0;
    const tick = (t: number) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else ref.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <span className={className}>{display}</span>;
}
