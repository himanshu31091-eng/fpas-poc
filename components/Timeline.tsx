"use client";

import { useStore } from "./store";
import { Button, Card } from "./ui";
import { IconDoc } from "./icons";
import { IMPORT_SEQUENCE } from "@/lib/importSequence";
import { jobAwb } from "@/lib/jobs";

const STEP_TITLES: Record<string, string> = Object.fromEntries(
  IMPORT_SEQUENCE.map((r) => [r.factKey, r.title])
);

interface Event {
  at?: string;
  label: string;
  detail?: string;
}

function printPack() {
  if (typeof window !== "undefined") window.print();
}

export function Timeline({ jobId }: { jobId: string }) {
  const { getJob } = useStore();
  const job = getJob(jobId);

  if (!job) return null;
  const b = job.booking;

  const events: Event[] = [];
  events.push({ at: job.createdAt, label: "Job created" });
  if (job.source.emailId || job.source.email)
    events.push({ label: "Source: agent email", detail: job.source.email?.subject });
  if (job.source.enquiry)
    events.push({ label: "Source: customer enquiry", detail: job.source.enquiry.customerName });
  if (job.source.flightManager)
    events.push({ label: "Source: Flight Manager (accepted)" });
  if (job.extraction) events.push({ label: "AI extraction completed" });
  if (b) events.push({ label: "Booking confirmed", detail: `${b.jobType} · ${b.commodity}` });

  if (b?.evidence) {
    for (const [key, ev] of Object.entries(b.evidence)) {
      if (!ev) continue;
      events.push({
        at: ev.markedAt,
        label: `Step done — ${STEP_TITLES[key] ?? key}`,
        detail: [ev.reference && `ref ${ev.reference}`, ev.markedBy]
          .filter(Boolean)
          .join(" · "),
      });
    }
  }
  if (b?.submissions) {
    for (const [key, s] of Object.entries(b.submissions)) {
      if (s?.status === "submitted" && s.submittedAt)
        events.push({
          at: s.submittedAt,
          label: `Submitted — ${key}`,
          detail: s.reference ? `ref ${s.reference}` : undefined,
        });
    }
  }
  if (b?.airlineSubmission)
    events.push({
      at: b.airlineSubmission.sentAt,
      label: `Load list sent — ${b.airlineSubmission.airline}`,
      detail: `${b.airlineSubmission.recipients.length} recipients`,
    });
  if (job.artifacts) events.push({ label: "Operational documents drafted" });
  if (b?.customerUpdate?.sentAt)
    events.push({ at: b.customerUpdate.sentAt, label: "Customer update sent" });

  // Sort: timestamped chronologically first, then untimed state markers.
  const timed = events
    .filter((e) => e.at)
    .sort((a, z) => (a.at! < z.at! ? -1 : 1));
  const untimed = events.filter((e) => !e.at);
  const ordered = [...timed, ...untimed];

  return (
    <div className="space-y-4">
      <div className="no-print flex items-center justify-between">
        <p className="text-[13px] text-ink-soft">
          The shipment&apos;s lifecycle and a printable job dossier.
        </p>
        <Button variant="ghost" size="sm" onClick={printPack}>
          <IconDoc width={15} height={15} />
          Print job pack (PDF)
        </Button>
      </div>

      {/* Print-only header */}
      <div className="hidden print:block">
        <h1 className="font-display text-xl font-bold text-ink">
          FPAS job pack — {jobAwb(job)}
        </h1>
      </div>

      {/* Booking summary (prints too) */}
      {b && (
        <Card className="print-plain p-4">
          <div className="mb-2 text-sm font-semibold text-ink">Booking</div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-[13px] sm:grid-cols-3">
            {[
              ["AWB", b.awb || "—"],
              ["Type", b.jobType],
              ["Agent", b.shippingAgent || "—"],
              ["Commodity", b.commodity || "—"],
              ["Animals", b.animalCount || "—"],
              ["Flight", b.flight || "—"],
              ["Origin", b.origin || "—"],
              ["Arrival", `${b.arrivalDate || "—"} ${b.arrivalTime || ""}`.trim()],
              [
                b.jobType === "export" ? "Warehouse time" : "Govt vet time",
                (b.jobType === "export" ? b.warehouseArrivalTime : b.govtVetInspectionTime) || "—",
              ],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[11px] uppercase tracking-wide text-ink-faint">{k}</dt>
                <dd className="text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
      )}

      {/* Timeline */}
      <Card className="print-plain p-4">
        <div className="mb-3 text-sm font-semibold text-ink">Activity</div>
        <ol className="relative ml-2 space-y-3 border-l-2 border-line pl-5">
          {ordered.map((e, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-primary bg-panel" />
              <div className="text-[13.5px] font-medium text-ink">{e.label}</div>
              {e.detail && (
                <div className="text-[12px] text-ink-soft">{e.detail}</div>
              )}
              {e.at && (
                <div className="font-mono text-[11px] text-ink-faint">
                  {new Date(e.at).toLocaleString()}
                </div>
              )}
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
