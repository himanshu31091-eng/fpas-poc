"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "./store";
import { Card } from "./ui";
import { IconChevronLeft } from "./icons";
import { jobAwb } from "@/lib/jobs";
import type { Job } from "@/lib/types";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function Calendar() {
  const { jobs } = useStore();
  const [offset, setOffset] = useState(0);

  const base = useMemo(() => new Date(), []);
  const view = new Date(base.getFullYear(), base.getMonth() + offset, 1);
  const year = view.getFullYear();
  const month = view.getMonth();

  // Map arrivalDate -> jobs
  const byDate = useMemo(() => {
    const m = new Map<string, Job[]>();
    for (const j of jobs) {
      if (j.deletedAt) continue;
      const d = j.booking?.arrivalDate;
      if (!d) continue;
      if (!m.has(d)) m.set(d, []);
      m.get(d)!.push(j);
    }
    return m;
  }, [jobs]);

  // Build grid cells (Mon-first)
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // 0 = Monday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const todayStr = base.toISOString().slice(0, 10);

  function dateStr(day: number) {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${year}-${mm}-${dd}`;
  }

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-display text-lg font-bold text-ink">
          {MONTHS[month]} {year}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setOffset((o) => o - 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink-soft hover:bg-bg"
          >
            <IconChevronLeft width={16} height={16} />
          </button>
          <button
            onClick={() => setOffset(0)}
            className="rounded-lg border border-line px-2.5 py-1.5 text-[12px] text-ink-soft hover:bg-bg"
          >
            Today
          </button>
          <button
            onClick={() => setOffset((o) => o + 1)}
            className="flex h-8 w-8 rotate-180 items-center justify-center rounded-lg border border-line text-ink-soft hover:bg-bg"
          >
            <IconChevronLeft width={16} height={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DOW.map((d) => (
          <div
            key={d}
            className="pb-1 text-center font-mono text-[10px] uppercase tracking-wide text-ink-faint"
          >
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={i} className="min-h-[76px]" />;
          const ds = dateStr(day);
          const items = byDate.get(ds) ?? [];
          const isToday = ds === todayStr;
          return (
            <div
              key={i}
              className={`min-h-[76px] rounded-lg border p-1.5 ${
                isToday ? "border-primary/50 bg-primary-soft/40" : "border-line bg-white"
              }`}
            >
              <div
                className={`mb-1 text-right font-mono text-[11px] ${
                  isToday ? "font-bold text-primary" : "text-ink-faint"
                }`}
              >
                {day}
              </div>
              <div className="space-y-1">
                {items.slice(0, 3).map((j) => {
                  const isExport = j.booking?.jobType === "export";
                  return (
                    <Link
                      key={j.id}
                      href={`/jobs/${j.id}`}
                      className={`block truncate rounded px-1 py-0.5 text-[10px] font-medium ${
                        isExport
                          ? "bg-gold-soft text-amber"
                          : "bg-primary-soft text-primary"
                      }`}
                      title={`${jobAwb(j)} · ${j.booking?.flight ?? ""}`}
                    >
                      {isExport ? "↑" : "↓"} {j.booking?.flight || jobAwb(j)}
                    </Link>
                  );
                })}
                {items.length > 3 && (
                  <div className="px-1 text-[10px] text-ink-faint">
                    +{items.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-4 font-mono text-[10px] uppercase tracking-wide text-ink-faint">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-primary" /> ↓ import (arrival)
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-gold" /> ↑ export (departure)
        </span>
      </div>
    </Card>
  );
}
