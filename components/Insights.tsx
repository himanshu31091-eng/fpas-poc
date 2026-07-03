"use client";

import { useMemo } from "react";
import { useStore } from "./store";
import { Card, CountUp } from "./ui";
import {
  IconAlert,
  IconBox,
  IconCheckCircle,
  IconPlane,
} from "./icons";
import { evaluateReadiness } from "@/lib/importSequence";
import { hoursUntilArrival, jobStatus } from "@/lib/jobs";

const MONTHS3 = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

interface Seg {
  label: string;
  value: number;
  text: string; // text-* class for the arc stroke
  dot: string; // bg-* class for the legend dot
}

export function Insights() {
  const { jobs } = useStore();

  const d = useMemo(() => {
    const now = new Date();
    const live = jobs.filter((j) => !j.deletedAt);
    const booked = live.filter((j) => j.booking);
    const ready = booked.filter((j) => jobStatus(j) === "ready").length;
    const inProgress = booked.filter((j) => jobStatus(j) === "in_progress").length;
    const onTimePct = booked.length ? Math.round((ready / booked.length) * 100) : 0;
    const arriving = jobs.filter((j) => {
      const h = hoursUntilArrival(j, now);
      return h !== null && h >= 0 && h <= 48;
    }).length;

    // Commodity split
    let horses = 0, companion = 0, other = 0;
    for (const j of booked) {
      const c = (j.booking?.commodity ?? "").toLowerCase();
      if (/horse/.test(c)) horses++;
      else if (/dog|cat|companion|pet/.test(c)) companion++;
      else other++;
    }
    const commodity: Seg[] = [
      { label: "Horses", value: horses, text: "text-primary", dot: "bg-primary" },
      { label: "Companion", value: companion, text: "text-aqua", dot: "bg-aqua" },
      { label: "Other", value: other, text: "text-gold", dot: "bg-gold" },
    ].filter((s) => s.value > 0);

    // Status split
    const st = { new: 0, extracted: 0, in_progress: 0, ready: 0 };
    for (const j of live) st[jobStatus(j)]++;
    const status: Seg[] = [
      { label: "Ready", value: st.ready, text: "text-green", dot: "bg-green" },
      { label: "In progress", value: st.in_progress, text: "text-amber", dot: "bg-amber" },
      { label: "Needs review", value: st.extracted, text: "text-primary", dot: "bg-primary" },
      { label: "New", value: st.new, text: "text-ink-faint", dot: "bg-ink-faint" },
    ].filter((s) => s.value > 0);

    // Arrivals over the next 6 weeks
    const startOfWeek = new Date(now);
    const dow = (now.getDay() + 6) % 7;
    startOfWeek.setDate(now.getDate() - dow);
    startOfWeek.setHours(0, 0, 0, 0);
    const weeks = Array.from({ length: 6 }, (_, i) => {
      const s = new Date(startOfWeek);
      s.setDate(startOfWeek.getDate() + i * 7);
      return { label: `${s.getDate()} ${MONTHS3[s.getMonth()]}`, count: 0 };
    });
    for (const j of booked) {
      const ds = j.booking?.arrivalDate;
      if (!ds) continue;
      const t = new Date(ds).getTime();
      if (Number.isNaN(t)) continue;
      const idx = Math.floor((t - startOfWeek.getTime()) / (7 * 86400000));
      if (idx >= 0 && idx < 6) weeks[idx].count++;
    }

    // Top blockers (import)
    const blockers = new Map<string, number>();
    for (const j of booked) {
      const b = j.booking!;
      if (b.jobType !== "import") continue;
      for (const item of evaluateReadiness(b.facts, b.isHorses)) {
        if (item.status === "outstanding")
          blockers.set(item.title, (blockers.get(item.title) ?? 0) + 1);
      }
    }
    const topBlockers = Array.from(blockers.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      total: live.length, ready, inProgress, arriving, booked: booked.length,
      onTimePct, commodity, status, weeks, topBlockers,
    };
  }, [jobs]);

  return (
    <div className="stagger space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={IconBox} tone="primary" label="Total jobs" value={d.total} />
        <Kpi icon={IconCheckCircle} tone="green" label="Ready" value={d.ready} />
        <Kpi icon={IconAlert} tone="amber" label="In progress" value={d.inProgress} />
        <Kpi icon={IconPlane} tone="aqua" label="Arriving ≤48h" value={d.arriving} />
      </div>

      {/* Donuts row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-5">
          <div className="mb-2 text-sm font-semibold text-ink">On-time readiness</div>
          <Ring pct={d.onTimePct} centerTop={`${d.onTimePct}%`} centerBottom={`${d.booked} booked`} />
        </Card>
        <Card className="p-5">
          <div className="mb-2 text-sm font-semibold text-ink">Fleet mix</div>
          <Donut data={d.commodity} centerTop={String(d.booked)} centerBottom="shipments" />
          <Legend data={d.commodity} />
        </Card>
        <Card className="p-5">
          <div className="mb-2 text-sm font-semibold text-ink">By status</div>
          <Donut data={d.status} centerTop={String(d.total)} centerBottom="jobs" />
          <Legend data={d.status} />
        </Card>
      </div>

      {/* Arrivals + blockers */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 text-sm font-semibold text-ink">
            Arrivals — next 6 weeks
          </div>
          <Columns weeks={d.weeks} />
        </Card>
        <Card className="p-5">
          <div className="mb-4 text-sm font-semibold text-ink">Top blockers</div>
          {d.topBlockers.length === 0 ? (
            <p className="text-[13px] text-ink-soft">No outstanding import blockers. 🎉</p>
          ) : (
            <Bars rows={d.topBlockers.map(([label, value]) => ({ label, value }))} />
          )}
        </Card>
      </div>
    </div>
  );
}

function Kpi({
  icon: Icon,
  tone,
  label,
  value,
}: {
  icon: (p: { width?: number; height?: number }) => JSX.Element;
  tone: "primary" | "green" | "amber" | "aqua";
  label: string;
  value: number;
}) {
  const chip = {
    primary: "bg-primary-soft text-primary",
    green: "bg-green-soft text-green",
    amber: "bg-amber-soft text-amber",
    aqua: "bg-aqua/10 text-aqua",
  }[tone];
  const text = {
    primary: "text-primary",
    green: "text-green",
    amber: "text-amber",
    aqua: "text-aqua",
  }[tone];
  return (
    <Card className="lift p-4 hover:shadow-lift">
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${chip}`}>
        <Icon width={18} height={18} />
      </span>
      <div className={`mt-3 font-display text-3xl font-bold ${text}`}>
        <CountUp value={value} />
      </div>
      <div className="mt-0.5 text-[12px] text-ink-soft">{label}</div>
    </Card>
  );
}

/** Single-value radial gauge. */
function Ring({
  pct,
  centerTop,
  centerBottom,
}: {
  pct: number;
  centerTop: string;
  centerBottom: string;
}) {
  const size = 150, thickness = 16, r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const seg = (pct / 100) * c;
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" className="text-line" strokeWidth={thickness} />
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor"
            className="text-green" strokeWidth={thickness} strokeLinecap="round"
            strokeDasharray={`${seg} ${c - seg}`}
          />
        </g>
      </svg>
      <Center top={centerTop} bottom={centerBottom} />
    </div>
  );
}

function Donut({
  data,
  centerTop,
  centerBottom,
}: {
  data: Seg[];
  centerTop: string;
  centerBottom: string;
}) {
  const size = 150, thickness = 16, r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const total = data.reduce((s, x) => s + x.value, 0) || 1;
  let acc = 0;
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" className="text-line" strokeWidth={thickness} />
          {data.map((s, i) => {
            const frac = s.value / total;
            const seg = frac * c;
            const el = (
              <circle
                key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor"
                className={s.text} strokeWidth={thickness}
                strokeDasharray={`${seg} ${c - seg}`}
                strokeDashoffset={-acc * c}
              />
            );
            acc += frac;
            return el;
          })}
        </g>
      </svg>
      <Center top={centerTop} bottom={centerBottom} />
    </div>
  );
}

function Center({ top, bottom }: { top: string; bottom: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <div className="font-display text-2xl font-bold text-ink">{top}</div>
      <div className="text-[11px] text-ink-faint">{bottom}</div>
    </div>
  );
}

function Legend({ data }: { data: Seg[] }) {
  return (
    <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1">
      {data.map((s) => (
        <span key={s.label} className="flex items-center gap-1.5 text-[12px] text-ink-soft">
          <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
          {s.label} <span className="font-mono text-ink-faint">{s.value}</span>
        </span>
      ))}
    </div>
  );
}

function Columns({ weeks }: { weeks: { label: string; count: number }[] }) {
  const max = Math.max(1, ...weeks.map((w) => w.count));
  return (
    <div className="flex h-40 items-end justify-between gap-2">
      {weeks.map((w, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
          <div className="font-mono text-[11px] text-ink">{w.count}</div>
          <div className="flex w-full flex-1 items-end">
            <div
              className="w-full rounded-t-lg bg-brand transition-all"
              style={{ height: `${Math.max(4, (w.count / max) * 100)}%` }}
              title={`${w.count} arrivals`}
            />
          </div>
          <div className="font-mono text-[10px] text-ink-faint">{w.label}</div>
        </div>
      ))}
    </div>
  );
}

function Bars({ rows }: { rows: { label: string; value: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="space-y-2.5">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3">
          <div className="w-32 shrink-0 truncate text-[12px] text-ink-soft" title={r.label}>
            {r.label}
          </div>
          <div className="h-3.5 flex-1 overflow-hidden rounded-full bg-bg">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber to-gold transition-all"
              style={{ width: `${(r.value / max) * 100}%` }}
            />
          </div>
          <div className="w-6 shrink-0 text-right font-mono text-[12px] text-ink">
            {r.value}
          </div>
        </div>
      ))}
    </div>
  );
}
