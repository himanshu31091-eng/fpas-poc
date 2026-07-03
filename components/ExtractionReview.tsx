"use client";

import { useEffect, useState } from "react";
import { useStore } from "./store";
import { BrandLoader, Button, Card, ConfidenceBadge, ErrorRetry } from "./ui";
import type { ExtractedField } from "@/lib/types";

export function ExtractionReview({
  jobId,
  onConfirmed,
}: {
  jobId: string;
  onConfirmed?: () => void;
}) {
  const { getJob, ui, runExtraction, confirmBooking } = useStore();
  const job = getJob(jobId);
  const state = ui[jobId] ?? {};
  const extraction = job?.extraction ?? null;

  const [fields, setFields] = useState<ExtractedField[]>([]);

  useEffect(() => {
    if (extraction) setFields(extraction.fields.map((f) => ({ ...f })));
  }, [extraction]);

  if (!job) return null;

  if (state.loadingExtract) {
    return (
      <div className="rounded-card border border-line bg-panel p-10">
        <BrandLoader label="Reading the message…" />
      </div>
    );
  }

  if (state.extractError) {
    return (
      <ErrorRetry
        message={state.extractError}
        onRetry={() => runExtraction(jobId)}
      />
    );
  }

  if (!extraction) {
    return (
      <Card className="p-10 text-center">
        <p className="text-sm text-ink-soft">
          No extraction yet for this job. Run the assistant over the source
          message to pull structured fields.
        </p>
        <div className="mt-4">
          <Button onClick={() => runExtraction(jobId)}>Run AI extraction →</Button>
        </div>
      </Card>
    );
  }

  const lowCount = fields.filter((f) => f.confidence === "low").length;

  function update(key: string, value: string) {
    setFields((prev) =>
      prev.map((f) =>
        f.key === key
          ? // Editing a flagged field is treated as human-verified.
            { ...f, value, confidence: "high" }
          : f
      )
    );
  }

  function confirm() {
    confirmBooking(jobId, fields);
    onConfirmed?.();
  }

  return (
    <div>
      {lowCount > 0 && (
        <div className="mb-4 rounded-md border border-amber/40 bg-amber-soft px-4 py-2 text-sm text-amber">
          {lowCount} field{lowCount > 1 ? "s need" : " needs"} your attention
          before this booking is trustworthy.
        </div>
      )}

      <Card className="divide-y divide-line">
        {fields.map((f) => (
          <div
            key={f.key}
            className="grid grid-cols-1 gap-2 px-4 py-3 sm:grid-cols-[180px_minmax(0,1fr)_minmax(0,1fr)] sm:items-center"
          >
            <label className="text-sm font-medium text-ink">{f.label}</label>
            <div className="flex items-center gap-2">
              <input
                value={f.value}
                onChange={(e) => update(f.key, e.target.value)}
                placeholder={f.confidence === "low" ? "— missing —" : ""}
                className={`w-full rounded-md border px-2.5 py-1.5 font-mono text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                  f.confidence === "low"
                    ? "border-red/50 bg-red-soft/40"
                    : "border-line-strong bg-white"
                }`}
              />
              <ConfidenceBadge level={f.confidence} />
            </div>
            <div className="font-mono text-[11px] leading-snug text-ink-faint">
              {f.sourceHint ? `“${f.sourceHint}”` : "—"}
            </div>
          </div>
        ))}
      </Card>

      {extraction.notes && (
        <p className="mt-3 text-[13px] text-ink-soft">
          <span className="font-medium text-ink">AI note: </span>
          {extraction.notes}
        </p>
      )}

      <div className="mt-5 flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => runExtraction(jobId)}>
          Re-run extraction
        </Button>
        <div className="flex items-center gap-3">
          <span className="text-[12px] text-ink-faint">
            {job.booking
              ? "Re-confirming overwrites the booking fields."
              : "Confirming creates the import job with these values."}
          </span>
          <Button onClick={confirm}>
            {job.booking ? "Update booking" : "Confirm & create booking →"}
          </Button>
        </div>
      </div>
    </div>
  );
}
