"use client";

import { useMemo, useState } from "react";
import { useStore } from "./store";
import { usePrefs } from "./prefs";
import {
  Button,
  Card,
  ErrorRetry,
  Spinner,
  UrgencyBadge,
} from "./ui";
import { evaluateReadiness } from "@/lib/importSequence";
import type {
  ComplianceFacts,
  ReadinessItem,
  StepEvidence,
} from "@/lib/types";

// Canonical order so the rail reads as a process, not a sorted to-do list.
const ORDER: (keyof ComplianceFacts)[] = [
  "bookingCreated",
  "oktfPrepared",
  "hcDraftReceived",
  "hcEndorsedByNVWA",
  "inspectionTimeRequested",
  "scopePreRegistration",
  "gdbSentToCustoms",
  "offloadingListCreated",
];

export function ComplianceReadiness({
  jobId,
  onAssign,
}: {
  jobId: string;
  onAssign?: () => void;
}) {
  const { getJob, ui, resolveItem, resolveAllSteps, resetSteps, runReadiness } = useStore();
  const { canEdit } = usePrefs();
  const job = getJob(jobId);
  const state = ui[jobId] ?? {};

  // The rail is derived deterministically from the booking facts (works with
  // or without AI). The AI call only supplies the reasoned summary. Memoised so
  // it isn't re-evaluated and re-sorted on every unrelated re-render.
  const facts = job?.booking?.facts;
  const isHorses = job?.booking?.isHorses ?? false;
  const items = useMemo(
    () =>
      facts
        ? evaluateReadiness(facts, isHorses).sort(
            (a, b) => ORDER.indexOf(a.factKey) - ORDER.indexOf(b.factKey)
          )
        : [],
    [facts, isHorses]
  );

  if (!job?.booking) {
    return (
      <Card className="p-10 text-center text-sm text-ink-soft">
        No booking yet. Confirm an extraction or fill the booking first, then
        the readiness gate can evaluate it.
      </Card>
    );
  }

  const outstanding = items.filter((i) => i.status === "outstanding");
  const cleared = outstanding.length === 0;
  const summary = job.readiness?.summary;
  const done = items.length - outstanding.length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;

  return (
    <div>
      {/* Status summary */}
      <div
        className={`mb-5 overflow-hidden rounded-card border px-5 py-4 ${
          cleared
            ? "border-green/40 bg-green-soft"
            : "border-amber/40 bg-amber-soft"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wide ${
              cleared ? "text-green" : "text-amber"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {cleared
              ? "cleared for arrival"
              : `${outstanding.length} outstanding`}
          </span>
          <span className="font-mono text-[11px] text-ink-soft">
            {done}/{items.length} steps
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-white/60">
          <div
            className={`h-full origin-left animate-grow-width rounded-full ${
              cleared ? "bg-green" : "bg-brand"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>

        <p className="mt-2.5 text-sm text-ink">
          {summary ||
            (cleared
              ? "All regulatory steps satisfied."
              : `Top blocker: ${outstanding[0].title}.`)}
        </p>
        {state.loadingReadiness && (
          <div className="mt-2">
            <Spinner label="Re-checking…" />
          </div>
        )}
      </div>

      {/* Demo shortcuts — clear or reset the whole rail in one click. */}
      {canEdit && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => resolveAllSteps(jobId)} disabled={cleared}>
            ✓ Mark all steps done
          </Button>
          <Button variant="ghost" size="sm" onClick={() => resetSteps(jobId)}>
            ↺ Reset steps
          </Button>
          <span className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
            demo shortcut
          </span>
        </div>
      )}

      {/* AI briefing controls / error */}
      {state.readinessError ? (
        <div className="mb-5">
          <ErrorRetry
            message={state.readinessError}
            onRetry={() => runReadiness(jobId)}
            busy={state.loadingReadiness}
          />
        </div>
      ) : (
        <div className="mb-5 flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => runReadiness(jobId)}
            disabled={state.loadingReadiness}
          >
            {summary ? "Refresh AI briefing" : "Generate AI briefing"}
          </Button>
          <span className="text-[12px] text-ink-faint">
            The rail below is always current; the briefing adds a reasoned
            plain-language summary from the assistant.
          </span>
        </div>
      )}

      {/* Signature: vertical regulatory rail */}
      <ol className="relative ml-3 space-y-3 border-l-2 border-line pl-6">
        {items.map((item) => (
          <SequenceNode
            key={item.id}
            item={item}
            evidence={job.booking?.evidence?.[item.factKey]}
            onResolve={(ev) => resolveItem(jobId, item.factKey, ev)}
            busy={Boolean(state.loadingReadiness) || !canEdit}
          />
        ))}
      </ol>

      <div className="mt-6 flex items-center justify-end gap-3">
        <span className="text-[12px] text-ink-faint">
          {cleared
            ? "All steps satisfied — assign the staff & equipment for the shipment."
            : "Resolve outstanding steps to clear the gate."}
        </span>
        <Button onClick={() => onAssign?.()} disabled={!cleared}>
          Assign staff &amp; equipment →
        </Button>
      </div>

      {job.booking.isHorses && (
        <p className="mt-3 font-mono text-[11px] text-ink-faint">
          Horse shipment: the OKTF step is included because commodity resolved to
          horses.
        </p>
      )}
    </div>
  );
}

function fmtWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SequenceNode({
  item,
  evidence,
  onResolve,
  busy,
}: {
  item: ReadinessItem;
  evidence?: StepEvidence;
  onResolve: (evidence: { reference?: string; note?: string }) => void;
  busy: boolean;
}) {
  const satisfied = item.status === "satisfied";
  const requireEvidence = item.urgency === "critical";

  const [open, setOpen] = useState(false);
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");

  const canConfirm = !requireEvidence || reference.trim().length > 0;

  function confirm() {
    if (!canConfirm) return;
    onResolve({ reference, note });
    setOpen(false);
    setReference("");
    setNote("");
  }

  return (
    <li className="relative">
      <span
        className={`absolute -left-[33px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 ${
          satisfied ? "border-green bg-green text-white" : "border-amber bg-panel"
        }`}
      >
        {satisfied && (
          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none">
            <path
              d="M2.5 6.2l2.2 2.3 4.8-5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>

      <Card className={`px-4 py-3 ${satisfied ? "" : "border-line-strong"}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-ink">{item.title}</span>
              {!satisfied && <UrgencyBadge level={item.urgency} />}
            </div>
            <p className="mt-1 text-[12.5px] leading-snug text-ink-soft">
              {item.justification}
            </p>
          </div>
          {!satisfied && !open && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(true)}
              disabled={busy}
            >
              Mark done
            </Button>
          )}
        </div>

        {/* Captured evidence (satisfied steps) */}
        {satisfied && evidence && (
          <div className="mt-2.5 rounded-xl border border-green/30 bg-green-soft/50 px-3 py-2 text-[12px]">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5">
              {evidence.reference && (
                <span className="text-ink">
                  <span className="text-ink-faint">Ref:</span>{" "}
                  <span className="font-mono">{evidence.reference}</span>
                </span>
              )}
              <span className="font-mono text-[11px] text-ink-faint">
                {evidence.markedBy} · {fmtWhen(evidence.markedAt)}
              </span>
            </div>
            {evidence.note && (
              <p className="mt-1 text-ink-soft">{evidence.note}</p>
            )}
          </div>
        )}
        {satisfied && !evidence && (
          <p className="mt-2 font-mono text-[11px] text-ink-faint">
            Pre-seeded — no evidence recorded.
          </p>
        )}

        {/* Evidence capture form */}
        {!satisfied && open && (
          <div className="mt-3 rounded-xl border border-line bg-bg/60 p-3">
            <label className="block">
              <span className="mb-1 flex items-center gap-1 text-[12px] text-ink-soft">
                Reference
                {requireEvidence ? (
                  <span className="text-red">*</span>
                ) : (
                  <span className="text-ink-faint">(optional)</span>
                )}
              </span>
              <input
                autoFocus
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder={
                  item.factKey === "hcEndorsedByNVWA"
                    ? "e.g. NVWA approval no."
                    : item.factKey === "gdbSentToCustoms"
                    ? "e.g. GDB number"
                    : "approval / doc reference"
                }
                className="w-full rounded-md border border-line-strong bg-white px-2.5 py-1.5 font-mono text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </label>
            <label className="mt-2 block">
              <span className="mb-1 block text-[12px] text-ink-soft">
                Note <span className="text-ink-faint">(optional)</span>
              </span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="Anything worth recording for the audit trail…"
                className="w-full rounded-md border border-line-strong bg-white px-2.5 py-1.5 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </label>
            {requireEvidence && (
              <p className="mt-1.5 font-mono text-[11px] text-amber">
                Critical step — a reference is required before it can clear.
              </p>
            )}
            <div className="mt-2.5 flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setOpen(false);
                  setReference("");
                  setNote("");
                }}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={confirm} disabled={busy || !canConfirm}>
                Confirm &amp; mark done
              </Button>
            </div>
          </div>
        )}
      </Card>
    </li>
  );
}
