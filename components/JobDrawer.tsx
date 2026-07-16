"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useStore } from "./store";
import { usePrefs } from "./prefs";
import { StatusBadge, OpsStageChip, FlightStatusChip } from "./ui";
import { CommodityArt } from "./CommodityArt";
import { WelfareBadge, WeatherChip } from "./weather";
import { StaffingChip } from "./staffStore";
import { Barcode } from "./Barcode";
import {
  jobStatus,
  openCount,
  jobAwb,
  jobAgent,
  jobCommodity,
  flightStatus,
} from "@/lib/jobs";
import {
  IconClose,
  IconArrowRight,
  IconPlane,
} from "./icons";

/**
 * Quick-look slide-over for a job — the "peek without leaving the register"
 * pattern. Opens on a plain row/card click; the full workspace is one click
 * away. (Modified clicks on the row still deep-link straight to the page.)
 */
export function JobDrawer({
  jobId,
  onClose,
}: {
  jobId: string | null;
  onClose: () => void;
}) {
  const { getJob } = useStore();
  const { t } = usePrefs();
  const job = jobId ? getJob(jobId) : null;

  // Esc to close.
  useEffect(() => {
    if (!jobId) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [jobId, onClose]);

  if (!jobId || !job) return null;

  const b = job.booking;
  const status = jobStatus(job);
  const open = openCount(job);
  const fs = flightStatus(job);
  const isExport = b?.jobType === "export";

  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex items-start justify-between gap-4 border-b border-line py-2.5 last:border-0">
      <span className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
        {label}
      </span>
      <span className="text-right text-[13px] text-ink">{value}</span>
    </div>
  );

  return (
    <div className="no-print fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-ink/30 animate-fade-in" onClick={onClose} />
      <div className="relative flex h-full w-[440px] max-w-[92vw] animate-fade-up flex-col bg-panel shadow-lift">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="flex items-start gap-3">
            <CommodityArt commodity={jobCommodity(job)} size={38} className="mt-0.5" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[15px] font-bold text-ink">
                  {jobAwb(job)}
                </span>
                <StatusBadge status={status} />
                <OpsStageChip stage={job.stage} />
              </div>
              <div className="mt-0.5 text-[12.5px] text-ink-soft">
                {jobAgent(job)}
                {b?.flight ? ` · ${b.flight}` : ""}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bg text-ink-soft transition-colors hover:text-ink"
          >
            <IconClose width={16} height={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            <WelfareBadge date={b?.arrivalDate} />
            {fs && <FlightStatusChip state={fs.state} label={fs.label} />}
            {b?.arrivalDate && <WeatherChip date={b.arrivalDate} />}
            <StaffingChip jobId={job.id} />
          </div>

          {b ? (
            <div>
              <Row label={t("drawer.direction")} value={t(`bf.type.${b.jobType}`)} />
              <Row
                label={t("bf.field.commodity")}
                value={
                  <>
                    <span className="font-medium">{b.commodity || "—"}</span>
                    {b.animalCount ? (
                      <span className="text-ink-soft"> · {b.animalCount}</span>
                    ) : null}
                  </>
                }
              />
              <Row label={t("bf.field.flight")} value={<span className="font-mono">{b.flight || "—"}</span>} />
              <Row label={t("bf.field.origin")} value={b.origin || "—"} />
              <Row
                label={t("bf.field.arrivalDate")}
                value={
                  <span className="font-mono">
                    {b.arrivalDate || "—"}
                    {b.arrivalTime ? ` · ${b.arrivalTime}` : ""}
                  </span>
                }
              />
              <Row label={t("bf.field.awb")} value={<span className="font-mono text-[12px]">{b.awb || "—"}</span>} />
              <Row
                label={t("drawer.openSteps")}
                value={
                  open > 0 ? (
                    <span className="font-mono font-semibold text-amber">{open} open</span>
                  ) : (
                    <span className="font-mono font-semibold text-green">cleared</span>
                  )
                }
              />
              {job.assignee && <Row label={t("drawer.assignee")} value={job.assignee} />}
              {b.grooms && b.grooms.length > 0 && (
                <Row label={t("drawer.grooms")} value={b.grooms.map((g) => g.name).join(", ")} />
              )}
              {b.specialCargo && <Row label={t("bf.field.specialCargo")} value={b.specialCargo} />}

              {b.awb && (
                <div className="mt-4 flex flex-col items-center rounded-card border border-line bg-white py-3">
                  <Barcode value={b.awb} />
                </div>
              )}
            </div>
          ) : (
            <p className="py-6 text-center text-[13px] text-ink-soft">
              {job.extraction ? "Extraction ready — open the job to review and confirm the booking." : "No booking yet."}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 border-t border-line px-5 py-3">
          <Link
            href={`/jobs/${job.id}`}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-[13px] font-semibold text-fpasnavy shadow-glow transition-all hover:-translate-y-0.5"
          >
            {t("drawer.openFull")}
            <IconArrowRight width={15} height={15} />
          </Link>
          {isExport && (
            <Link
              href={`/jobs/${job.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-line-strong bg-white px-3 py-2.5 text-[13px] font-medium text-ink transition-colors hover:border-primary/40"
            >
              <IconPlane width={15} height={15} />
              {t("drawer.loadPlan")}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
