"use client";

import { useState } from "react";
import { useStore } from "./store";
import { Button, Card, SimTag } from "./ui";
import { IconSparkles } from "./icons";
import type { JobType, SubmissionStatus } from "@/lib/types";

interface Step {
  key: string;
  regulator: string;
  topic: string;
  label: string;
}

const STEPS: Record<JobType, Step[]> = {
  import: [
    {
      key: "nvwa-preapproval",
      regulator: "NVWA",
      topic: "health-certificate pre-approval request",
      label: "NVWA health-certificate pre-approval",
    },
    {
      key: "scope-prereg",
      regulator: "Customs (Scope portal)",
      topic: "live-animal pre-registration in Scope",
      label: "Scope pre-registration",
    },
    {
      key: "gdb-customs",
      regulator: "Customs",
      topic: "HC copy + GDB number (d-controle) notification",
      label: "HC + GDB number to customs",
    },
  ],
  export: [
    {
      key: "export-hc",
      regulator: "NVWA",
      topic: "export health certification notification",
      label: "Export health certification",
    },
    {
      key: "airline-awb",
      regulator: "Airline",
      topic: "AWB number notification to the carrier",
      label: "AWB number to airline",
    },
  ],
};

const STATUS_STYLE: Record<SubmissionStatus, string> = {
  outstanding: "bg-bg text-ink-faint ring-1 ring-line-strong",
  drafted: "bg-amber-soft text-amber",
  submitted: "bg-green-soft text-green",
};

export function Submissions({ jobId }: { jobId: string }) {
  const { getJob } = useStore();
  const job = getJob(jobId);

  if (!job?.booking) {
    return (
      <Card className="p-10 text-center text-sm text-ink-soft">
        No booking yet. Create the booking first.
      </Card>
    );
  }

  const steps = STEPS[job.booking.jobType] ?? STEPS.import;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-ink">
          Regulatory submissions
        </span>
        <SimTag />
      </div>
      <p className="text-[13px] text-ink-soft">
        Regulatory touchpoints across the shipment lifecycle. Draft each
        notification with the assistant, then record it as submitted for the
        audit trail. (Mock — nothing is sent to a regulator.)
      </p>
      {steps.map((s) => (
        <SubmissionRow key={s.key} jobId={jobId} step={s} />
      ))}
    </div>
  );
}

function SubmissionRow({ jobId, step }: { jobId: string; step: Step }) {
  const { getJob, draftNotice, markSubmitted } = useStore();
  const job = getJob(jobId);
  const sub = job?.booking?.submissions?.[step.key];
  const status: SubmissionStatus = sub?.status ?? "outstanding";

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ref, setRef] = useState("");

  async function draft() {
    setBusy(true);
    setError(null);
    try {
      await draftNotice(jobId, step.key, step.regulator, step.topic);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Draft failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-ink">{step.label}</span>
            <span
              className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${STATUS_STYLE[status]}`}
            >
              {status}
            </span>
          </div>
          <div className="mt-0.5 font-mono text-[11px] text-ink-faint">
            {step.regulator}
          </div>
        </div>
        {status !== "submitted" && (
          <Button variant="ghost" size="sm" onClick={draft} disabled={busy}>
            <IconSparkles width={15} height={15} />
            {busy ? "Drafting…" : sub?.notice ? "Redraft" : "Draft with AI"}
          </Button>
        )}
      </div>

      {error && <p className="mt-2 text-[12px] text-red">{error}</p>}

      {sub?.notice && (
        <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap rounded-xl bg-bg/60 px-3 py-2 font-mono text-[12px] leading-relaxed text-ink-soft">
          {sub.notice}
        </pre>
      )}

      {status === "submitted" ? (
        <div className="mt-3 rounded-xl border border-green/30 bg-green-soft/50 px-3 py-2 text-[12px]">
          {sub?.reference && (
            <span className="text-ink">
              <span className="text-ink-faint">Ref:</span>{" "}
              <span className="font-mono">{sub.reference}</span>
            </span>
          )}
          <div className="font-mono text-[11px] text-ink-faint">
            {sub?.submittedBy} ·{" "}
            {sub?.submittedAt ? new Date(sub.submittedAt).toLocaleString() : ""}
          </div>
        </div>
      ) : (
        sub?.notice && (
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <label className="block">
              <span className="mb-1 block text-[12px] text-ink-soft">
                Submission reference <span className="text-ink-faint">(optional)</span>
              </span>
              <input
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                placeholder="portal ref / confirmation no."
                className="rounded-md border border-line-strong bg-white px-2.5 py-1.5 font-mono text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </label>
            <Button size="sm" onClick={() => markSubmitted(jobId, step.key, ref)}>
              Mark submitted
            </Button>
          </div>
        )
      )}
    </Card>
  );
}
