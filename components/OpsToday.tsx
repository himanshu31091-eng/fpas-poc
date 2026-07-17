"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useStore } from "./store";
import { useStaff } from "./staffStore";
import { useWeather } from "./weather";
import { usePrefs } from "./prefs";
import { Card } from "./ui";
import {
  IconPlane,
  IconAlert,
  IconCheckCircle,
  IconUsers,
  IconPaw,
  IconArrowRight,
} from "./icons";
import {
  jobAwb,
  jobAgent,
  openCount,
  hoursUntilArrival,
  requiredCrew,
  movementsOn,
} from "@/lib/jobs";
import { statusOnDate, dateStr, addDays } from "@/lib/staff";
import { SEED_ANIMALS, loadAnimals, daysUntil } from "@/lib/animals";
import { welfareFlag } from "@/lib/weather";

type Tone = "red" | "amber" | "primary" | "green";

interface Item {
  key: string;
  href: string;
  primary: string;
  detail: string;
  tone?: Tone;
}

export function OpsToday() {
  const { jobs } = useStore();
  const { roster, leave, team } = useStaff();
  const { getDay } = useWeather();
  const { t } = usePrefs();

  const now = useMemo(() => new Date(), []);
  const active = useMemo(() => jobs.filter((j) => !j.deletedAt), [jobs]);
  const [animals, setAnimals] = useState(SEED_ANIMALS);
  useEffect(() => {
    const saved = loadAnimals();
    if (saved && saved.length) setAnimals(saved);
  }, []);

  // --- Arrivals in the next 48h -------------------------------------------
  const arrivals: Item[] = useMemo(() => {
    return active
      .map((j) => ({ j, h: hoursUntilArrival(j, now) }))
      .filter((x) => x.h !== null && (x.h as number) >= -6 && (x.h as number) <= 48)
      .sort((a, b) => (a.h as number) - (b.h as number))
      .map(({ j, h }) => ({
        key: j.id,
        href: `/jobs/${j.id}`,
        primary: `${j.booking?.flight || jobAwb(j)}`,
        detail: `${jobAgent(j)} · ${(h as number) <= 0 ? "now" : `${Math.round(h as number)}h`}`,
      }));
  }, [active, now]);

  // --- Compliance outstanding (soonest first) -----------------------------
  const compliance: Item[] = useMemo(() => {
    return active
      .filter((j) => j.booking && openCount(j) > 0)
      .map((j) => ({ j, h: hoursUntilArrival(j, now) }))
      .sort((a, b) => (a.h ?? 1e9) - (b.h ?? 1e9))
      .map(({ j }) => ({
        key: j.id,
        href: `/jobs/${j.id}`,
        primary: `${j.booking?.flight || jobAwb(j)}`,
        detail: `${openCount(j)} open · ${j.booking?.arrivalDate || "—"}`,
        tone: "amber" as Tone,
      }));
  }, [active, now]);

  // --- Document gaps: export horses missing HC / passport -----------------
  const docGaps: Item[] = useMemo(() => {
    return active
      .filter((j) => j.booking?.jobType === "export" && j.booking.loadPlan?.length)
      .map((j) => {
        const filled = (j.booking!.loadPlan ?? []).filter((r) => (r.animalId ?? "").trim());
        const gaps = filled.filter((r) => !r.hc || !r.pp).length;
        return { j, gaps };
      })
      .filter((x) => x.gaps > 0)
      .map(({ j, gaps }) => ({
        key: j.id,
        href: `/jobs/${j.id}`,
        primary: `${j.booking?.flight || jobAwb(j)}`,
        detail: `${gaps} horse${gaps === 1 ? "" : "s"} missing HC/PP`,
        tone: "red" as Tone,
      }));
  }, [active]);

  // --- Vaccination expiries (animal registry) -----------------------------
  const vax: Item[] = useMemo(() => {
    const out: Item[] = [];
    for (const a of animals) {
      for (const v of a.vax) {
        const d = daysUntil(v.exp);
        if (d < 0)
          out.push({ key: `${a.id}-${v.name}`, href: "/animals", primary: a.name, detail: `${v.name} · expired`, tone: "red" });
        else if (d <= 45)
          out.push({ key: `${a.id}-${v.name}`, href: "/animals", primary: a.name, detail: `${v.name} · ${d}d`, tone: "amber" });
      }
    }
    return out.sort((a, b) => (a.tone === "red" ? -1 : 1));
  }, [animals]);

  // --- Coverage shortfalls (next 7 days with movements) -------------------
  const coverage: Item[] = useMemo(() => {
    const out: Item[] = [];
    for (let i = 0; i < 7; i++) {
      const ds = dateStr(addDays(now, i));
      if (movementsOn(jobs, ds).length === 0) continue;
      const required = requiredCrew(jobs, ds);
      const scheduled = team.filter((s) => {
        const st = statusOnDate(s, ds, roster, leave);
        return st && (st.status === "working" || st.status === "training");
      }).length;
      if (scheduled < required)
        out.push({
          key: ds,
          href: "/staffing",
          primary: ds.slice(5),
          detail: `${scheduled}/${required} · short ${required - scheduled}`,
          tone: "amber",
        });
    }
    return out;
  }, [jobs, roster, leave, team, now]);

  // --- Weather welfare on upcoming arrivals -------------------------------
  const weather: Item[] = useMemo(() => {
    const out: Item[] = [];
    for (const j of active) {
      const date = j.booking?.arrivalDate;
      if (!date) continue;
      const h = hoursUntilArrival(j, now);
      if (h === null || h < -6 || h > 24 * 7) continue;
      const day = getDay(date);
      if (!day) continue;
      const flag = welfareFlag(day);
      if (flag.level === "ok") continue;
      out.push({
        key: j.id,
        href: `/jobs/${j.id}`,
        primary: `${j.booking?.flight || jobAwb(j)}`,
        detail: `${date} · ${flag.label}`,
        tone: flag.level === "heat" ? "red" : "amber",
      });
    }
    return out;
  }, [active, getDay, now]);

  const attention =
    compliance.length + docGaps.length + vax.length + coverage.length + weather.length;

  return (
    <div className="space-y-5">
      {/* Summary banner */}
      <div
        className={`flex items-center gap-3 rounded-card border px-4 py-3 ${
          attention > 0
            ? "border-amber/30 bg-amber-soft/40"
            : "border-green/30 bg-green-soft/40"
        }`}
      >
        {attention > 0 ? (
          <IconAlert width={18} height={18} className="text-amber" />
        ) : (
          <IconCheckCircle width={18} height={18} className="text-green" />
        )}
        <span className="text-[14px] font-semibold text-ink">
          {attention > 0 ? t("ops.needAttention", { n: attention }) : t("ops.allClear")}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <AlertCard title={t("ops.compliance")} icon={IconAlert} tone="amber" items={compliance} t={t} />
        <AlertCard title={t("ops.docGaps")} icon={IconAlert} tone="red" items={docGaps} t={t} />
        <AlertCard title={t("ops.vaccinations")} icon={IconPaw} tone="red" items={vax} t={t} />
        <AlertCard title={t("ops.coverage")} icon={IconUsers} tone="amber" items={coverage} t={t} />
        <AlertCard title={t("ops.weather")} icon={IconAlert} tone="amber" items={weather} t={t} />
        <AlertCard title={t("ops.arrivals")} icon={IconPlane} tone="primary" items={arrivals} t={t} />
      </div>
    </div>
  );
}

const TONE: Record<Tone, { icon: string; badge: string; dot: string }> = {
  red: { icon: "text-red", badge: "bg-red-soft text-red", dot: "bg-red" },
  amber: { icon: "text-amber", badge: "bg-amber-soft text-amber", dot: "bg-amber" },
  primary: { icon: "text-primary", badge: "bg-primary-soft text-primary", dot: "bg-primary" },
  green: { icon: "text-green", badge: "bg-green-soft text-green", dot: "bg-green" },
};

function AlertCard({
  title,
  icon: Icon,
  tone,
  items,
  t,
}: {
  title: string;
  icon: (p: { width?: number; height?: number; className?: string }) => ReactNode;
  tone: Tone;
  items: Item[];
  t: (k: string) => string;
}) {
  const shown = items.slice(0, 5);
  const more = items.length - shown.length;
  const s = TONE[tone];
  return (
    <Card className="flex flex-col p-4">
      <div className="mb-2.5 flex items-center gap-2">
        <Icon width={15} height={15} className={items.length ? s.icon : "text-ink-faint"} />
        <span className="text-[13px] font-semibold text-ink">{title}</span>
        <span
          className={`ml-auto rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold ${
            items.length ? s.badge : "bg-bg text-ink-faint"
          }`}
        >
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <div className="flex items-center gap-1.5 py-1.5 text-[12.5px] text-ink-faint">
          <IconCheckCircle width={13} height={13} className="text-green" />
          {t("ops.none")}
        </div>
      ) : (
        <div className="space-y-0.5">
          {shown.map((it) => (
            <Link
              key={it.key}
              href={it.href}
              className="group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-bg"
            >
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${TONE[it.tone ?? tone].dot}`} />
              <span className="shrink-0 font-mono text-[12.5px] font-semibold text-ink">
                {it.primary}
              </span>
              <span className="truncate text-[12px] text-ink-soft">{it.detail}</span>
              <IconArrowRight
                width={13}
                height={13}
                className="ml-auto shrink-0 text-ink-faint opacity-0 transition-opacity group-hover:opacity-100"
              />
            </Link>
          ))}
          {more > 0 && (
            <div className="px-2 pt-1 font-mono text-[11px] text-ink-faint">+{more} more</div>
          )}
        </div>
      )}
    </Card>
  );
}
