"use client";

import { useEffect, useState } from "react";
import { useStore } from "./store";
import { usePrefs } from "./prefs";
import { Button, Card } from "./ui";
import { SHIPPING_AGENTS } from "@/lib/mockData";
import type { Booking, JobType } from "@/lib/types";

type Editable = Omit<
  Booking,
  | "facts"
  | "isHorses"
  | "evidence"
  | "loadPlan"
  | "airlineSubmission"
  | "submissions"
>;

// Common text fields (job-type-conditional ones handled separately below).
const FIELDS: { key: keyof Editable; label: string; mono?: boolean }[] = [
  { key: "awb", label: "Air waybill (AWB)", mono: true },
  { key: "shippingAgent", label: "Shipping agent" },
  { key: "commodity", label: "Commodity" },
  { key: "animalCount", label: "Animal count" },
  { key: "flight", label: "Flight", mono: true },
  { key: "origin", label: "Origin" },
  { key: "arrivalDate", label: "Arrival date (YYYY-MM-DD)", mono: true },
  { key: "arrivalTime", label: "Arrival time (HH:MM)", mono: true },
  { key: "specialCargo", label: "Special cargo" },
];

export function BookingForm({
  jobId,
  onSaved,
}: {
  jobId: string;
  onSaved?: () => void;
}) {
  const { getJob, updateBooking } = useStore();
  const { canEdit, toast } = usePrefs();
  const job = getJob(jobId);
  const booking = job?.booking ?? null;

  const [draft, setDraft] = useState<Editable | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (booking) {
      const {
        facts: _f,
        isHorses: _i,
        evidence: _e,
        loadPlan: _lp,
        airlineSubmission: _as,
        submissions: _s,
        ...rest
      } = booking;
      setDraft(rest);
    }
  }, [booking]);

  if (!booking || !draft) return null;

  const isHorses = /horse/i.test(draft.commodity);
  const isExport = draft.jobType === "export";

  function set(key: keyof Editable, value: string) {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
    setSaved(false);
  }

  function setJobType(t: JobType) {
    setDraft((prev) => (prev ? { ...prev, jobType: t } : prev));
    setSaved(false);
  }

  function save() {
    if (!draft) return;
    updateBooking(jobId, draft);
    setSaved(true);
    toast("Booking saved", "success");
    onSaved?.();
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <span className="font-mono text-[12px] text-ink-faint">
          AWB {draft.awb || "—"}
        </span>
        <div className="flex items-center gap-2">
          {/* Job type segmented control */}
          <div className="flex rounded-xl border border-line bg-bg p-0.5">
            {(["import", "export"] as JobType[]).map((t) => (
              <button
                key={t}
                onClick={() => setJobType(t)}
                className={`rounded-lg px-3 py-1 text-[12px] font-medium capitalize transition-all ${
                  draft.jobType === t
                    ? "bg-brand text-white shadow-glow"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <span
            className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${
              isHorses ? "bg-primary-soft text-primary" : "bg-bg text-ink-faint"
            }`}
          >
            {isHorses ? "Horses · OKTF" : "Non-horse"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <label key={f.key} className="block">
            <span className="mb-1 block text-[12px] text-ink-soft">
              {f.label}
            </span>
            {f.key === "shippingAgent" ? (
              <>
                <input
                  list="fpas-agents"
                  value={draft[f.key] ?? ""}
                  onChange={(e) => set(f.key, e.target.value)}
                  className="w-full rounded-md border border-line-strong bg-white px-2.5 py-1.5 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <datalist id="fpas-agents">
                  {SHIPPING_AGENTS.map((a) => (
                    <option key={a} value={a} />
                  ))}
                </datalist>
              </>
            ) : (
              <input
                value={(draft[f.key] as string) ?? ""}
                onChange={(e) => set(f.key, e.target.value)}
                className={`w-full rounded-md border border-line-strong bg-white px-2.5 py-1.5 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                  f.mono ? "font-mono" : ""
                }`}
              />
            )}
          </label>
        ))}

        {/* Job-type conditional field */}
        <label className="block">
          <span className="mb-1 block text-[12px] text-ink-soft">
            {isExport
              ? "Warehouse arrival time (export)"
              : "Govt vet inspection time (import)"}
          </span>
          <input
            value={
              (isExport
                ? draft.warehouseArrivalTime
                : draft.govtVetInspectionTime) ?? ""
            }
            onChange={(e) =>
              set(
                isExport ? "warehouseArrivalTime" : "govtVetInspectionTime",
                e.target.value
              )
            }
            className="w-full rounded-md border border-line-strong bg-white px-2.5 py-1.5 font-mono text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </label>
      </div>

      <div className="mt-4 flex items-center justify-end gap-3">
        {!canEdit && (
          <span className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">
            read-only (viewer)
          </span>
        )}
        {saved && canEdit && (
          <span className="font-mono text-[11px] uppercase tracking-wide text-green">
            ● saved
          </span>
        )}
        <Button onClick={save} disabled={!canEdit}>
          Save booking
        </Button>
      </div>
    </Card>
  );
}
