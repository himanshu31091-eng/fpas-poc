"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "./store";
import { IconBell } from "./icons";
import {
  hoursUntilArrival,
  jobAwb,
  jobStatus,
  openCount,
} from "@/lib/jobs";

interface Alert {
  id: string;
  jobId: string;
  text: string;
  tone: "red" | "amber" | "primary";
}

export function NotificationsBell() {
  const { jobs } = useStore();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const alerts = useMemo(() => {
    const now = new Date();
    const out: Alert[] = [];
    for (const job of jobs) {
      if (job.deletedAt) continue;
      const b = job.booking;
      const awb = jobAwb(job);
      if (b) {
        const h = hoursUntilArrival(job, now);
        const open = openCount(job);
        if (h !== null && h >= 0 && h <= 48 && open > 0) {
          out.push({
            id: `${job.id}-arr`,
            jobId: job.id,
            tone: "red",
            text: `${awb} arrives in ${Math.round(h)}h with ${open} open step${open === 1 ? "" : "s"}`,
          });
        }
        if (b.jobType === "export" && !b.airlineSubmission) {
          out.push({
            id: `${job.id}-load`,
            jobId: job.id,
            tone: "amber",
            text: `${awb}: load list not yet sent to the airline`,
          });
        }
      }
      if (jobStatus(job) === "extracted") {
        out.push({
          id: `${job.id}-review`,
          jobId: job.id,
          tone: "primary",
          text: `${awb}: extraction needs review`,
        });
      }
    }
    return out.filter((a) => !dismissed.has(a.id));
  }, [jobs, dismissed]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white text-ink-soft transition-colors hover:text-ink"
      >
        <IconBell width={16} height={16} />
        {alerts.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red px-1 text-[9px] font-bold text-white">
            {alerts.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-80 rounded-card border border-line bg-panel p-2 shadow-lift">
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="text-sm font-semibold text-ink">Notifications</span>
              {alerts.length > 0 && (
                <button
                  onClick={() =>
                    setDismissed(new Set(jobs.flatMap((j) => [`${j.id}-arr`, `${j.id}-load`, `${j.id}-review`])))
                  }
                  className="text-[11px] text-ink-faint hover:text-primary"
                >
                  Mark all read
                </button>
              )}
            </div>
            {alerts.length === 0 ? (
              <p className="px-2 py-6 text-center text-[13px] text-ink-soft">
                You&apos;re all caught up. 🎉
              </p>
            ) : (
              <div className="max-h-80 space-y-1 overflow-auto">
                {alerts.map((a) => (
                  <Link
                    key={a.id}
                    href={`/jobs/${a.jobId}`}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-2 rounded-lg px-2 py-2 hover:bg-bg"
                  >
                    <span
                      className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                        a.tone === "red"
                          ? "bg-red"
                          : a.tone === "amber"
                          ? "bg-amber"
                          : "bg-primary"
                      }`}
                    />
                    <span className="text-[13px] leading-snug text-ink">{a.text}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
