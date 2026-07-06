"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "./store";
import { usePrefs, STAFF } from "./prefs";
import { Button, Card, FlightStatusChip, StatusBadge } from "./ui";
import { ExtractionReview } from "./ExtractionReview";
import { BookingForm } from "./BookingForm";
import { ComplianceReadiness } from "./ComplianceReadiness";
import { Artifacts } from "./Artifacts";
import { LoadPlan } from "./LoadPlan";
import { Submissions } from "./Submissions";
import { CustomerUpdate } from "./CustomerUpdate";
import { Timeline } from "./Timeline";
import { CommodityArt } from "./CommodityArt";
import { WeatherPanel } from "./weather";
import {
  IconBox,
  IconChevronLeft,
  IconCheckCircle,
  IconClock,
  IconDoc,
  IconPlane,
  IconSparkles,
  IconTrash,
} from "./icons";
import {
  flightStatus,
  jobAgent,
  jobAwb,
  jobStatus,
  openCount,
} from "@/lib/jobs";
import type { Job } from "@/lib/types";

type Tab =
  | "source"
  | "extraction"
  | "booking"
  | "readiness"
  | "loadplan"
  | "submissions"
  | "update"
  | "artifacts"
  | "timeline";

type TabDef = {
  id: Tab;
  label: string;
  icon: (p: { width?: number; height?: number }) => JSX.Element;
};

/** Tabs depend on job type: Readiness (import) vs Load plan (export). */
function tabsFor(job: Job): TabDef[] {
  const isExport = job.booking?.jobType === "export";
  return [
    { id: "source", label: "Source", icon: IconDoc },
    { id: "extraction", label: "Extraction", icon: IconSparkles },
    { id: "booking", label: "Booking", icon: IconBox },
    isExport
      ? { id: "loadplan", label: "Load plan", icon: IconPlane }
      : { id: "readiness", label: "Readiness", icon: IconPlane },
    { id: "submissions", label: "Submissions", icon: IconCheckCircle },
    { id: "update", label: "Update", icon: IconSparkles },
    { id: "artifacts", label: "Artifacts", icon: IconDoc },
    { id: "timeline", label: "Timeline", icon: IconClock },
  ];
}

function defaultTab(job: Job): Tab {
  const isExport = job.booking?.jobType === "export";
  if (job.source.manual && job.booking && !job.extraction)
    return isExport ? "loadplan" : "booking";
  if (job.booking) return isExport ? "loadplan" : "readiness";
  if (job.extraction) return "extraction";
  if (job.source.emailId || job.source.text) return "extraction";
  return "source";
}

export function JobWorkspace({ jobId }: { jobId: string }) {
  const router = useRouter();
  const { getJob, deleteJob, restoreJob, regenerateArtifacts, assignJob } =
    useStore();
  const { canEdit, toast } = usePrefs();
  const job = getJob(jobId);

  const [tab, setTab] = useState<Tab>(() => (job ? defaultTab(job) : "source"));

  if (!job) {
    return (
      <Card className="p-10 text-center">
        <p className="text-sm text-ink-soft">
          This job doesn&apos;t exist (it may have been deleted).
        </p>
        <div className="mt-4">
          <Link href="/">
            <Button variant="ghost">← Back to dashboard</Button>
          </Link>
        </div>
      </Card>
    );
  }

  const status = jobStatus(job);
  const open = openCount(job);

  function remove() {
    if (
      typeof window !== "undefined" &&
      !window.confirm("Move this job to the bin? You can restore it later.")
    )
      return;
    deleteJob(jobId);
    toast("Moved to bin");
    router.push("/");
  }

  function goDraft() {
    setTab("artifacts");
    if (!job?.artifacts) void regenerateArtifacts(jobId);
  }

  return (
    <div>
      {job.deletedAt && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-card border border-amber/40 bg-amber-soft px-4 py-3">
          <span className="text-[13px] text-ink">
            This job is in the bin (deleted{" "}
            {new Date(job.deletedAt).toLocaleDateString()}).
          </span>
          {canEdit && (
            <Button
              size="sm"
              onClick={() => {
                restoreJob(jobId);
                toast("Job restored", "success");
              }}
            >
              Restore job
            </Button>
          )}
        </div>
      )}

      {/* Header */}
      <Link
        href="/"
        className="no-print inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wide text-ink-faint transition-colors hover:text-primary"
      >
        <IconChevronLeft width={14} height={14} />
        All jobs
      </Link>

      <div className="mb-5 mt-2 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <CommodityArt
            commodity={job.booking?.commodity}
            size={44}
            className="mt-0.5"
          />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
                {jobAwb(job)}
              </h1>
              <StatusBadge status={status} />
              {(() => {
                const fs = flightStatus(job);
                return fs ? <FlightStatusChip state={fs.state} label={fs.label} /> : null;
              })()}
            </div>
            <p className="mt-0.5 text-sm text-ink-soft">
              {jobAgent(job)}
              {job.booking?.flight ? ` · ${job.booking.flight}` : ""}
              {job.booking ? ` · ${open} open step${open === 1 ? "" : "s"}` : ""}
            </p>
          </div>
        </div>
        <div className="no-print flex items-center gap-2">
          <select
            value={job.assignee ?? ""}
            onChange={(e) => {
              assignJob(jobId, e.target.value);
              toast(e.target.value ? `Assigned to ${e.target.value}` : "Unassigned");
            }}
            disabled={!canEdit}
            className="rounded-xl border border-line bg-white px-2.5 py-1.5 text-[12px] text-ink-soft focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
            title="Assign to a staff member"
          >
            <option value="">Unassigned</option>
            {STAFF.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {canEdit && (
            <button
              onClick={remove}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-1.5 text-[12px] text-ink-soft transition-colors hover:border-red/40 hover:text-red"
            >
              <IconTrash width={14} height={14} />
              Delete
            </button>
          )}
        </div>
      </div>

      {job.booking?.arrivalDate && (
        <WeatherPanel
          date={job.booking.arrivalDate}
          arrivalTime={job.booking.arrivalTime}
        />
      )}

      {/* Tab rail — freely navigable */}
      <div className="no-print mb-5 flex flex-wrap gap-1.5">
        {tabsFor(job).map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${
                tab === t.id
                  ? "bg-brand text-white shadow-glow"
                  : "border border-line bg-white text-ink-soft hover:border-primary/40 hover:text-ink"
              }`}
            >
              <Icon width={15} height={15} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Panels */}
      <div key={tab} className="animate-fade-up">
      {tab === "source" && <SourceView job={job} />}
      {tab === "extraction" && (
        <ExtractionReview jobId={jobId} onConfirmed={() => setTab("booking")} />
      )}
      {tab === "booking" &&
        (job.booking ? (
          <BookingForm jobId={jobId} onSaved={() => setTab("readiness")} />
        ) : (
          <Card className="p-10 text-center">
            <p className="text-sm text-ink-soft">
              No booking yet. Confirm the extraction to create one.
            </p>
            <div className="mt-4">
              <Button onClick={() => setTab("extraction")}>
                Go to extraction →
              </Button>
            </div>
          </Card>
        ))}
      {tab === "readiness" && (
        <ComplianceReadiness jobId={jobId} onDraft={goDraft} />
      )}
      {tab === "loadplan" && <LoadPlan jobId={jobId} />}
      {tab === "submissions" && <Submissions jobId={jobId} />}
      {tab === "update" && <CustomerUpdate jobId={jobId} />}
      {tab === "artifacts" && <Artifacts jobId={jobId} />}
      {tab === "timeline" && <Timeline jobId={jobId} />}
      </div>
    </div>
  );
}

function SourceView({ job }: { job: Job }) {
  const email = job.source.email;
  const text = job.source.text;
  const pdf = job.source.pdf;
  const enquiry = job.source.enquiry;

  if (enquiry && text) {
    return (
      <Card className="flex flex-col">
        <div className="border-b border-line px-4 py-3">
          <div className="text-sm font-semibold text-ink">Online enquiry</div>
          <div className="mt-0.5 font-mono text-[11px] text-ink-faint">
            {[enquiry.customerName, enquiry.phone, enquiry.contactEmail]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </div>
        <pre className="whitespace-pre-wrap px-4 py-3 font-mono text-[12.5px] leading-relaxed text-ink-soft">
          {text}
        </pre>
      </Card>
    );
  }

  if (pdf) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-primary">
            <IconDoc width={20} height={20} />
          </span>
          <div>
            <div className="text-sm font-semibold text-ink">{pdf.filename}</div>
            <div className="font-mono text-[11px] text-ink-faint">
              Uploaded PDF — read by AI to fill the booking.
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (email) {
    return (
      <Card className="flex flex-col">
        <div className="border-b border-line px-4 py-3">
          <div className="text-sm font-semibold text-ink">{email.subject}</div>
          <div className="mt-0.5 font-mono text-[11px] text-ink-faint">
            {email.from} · {email.receivedAt}
            {email.attachment ? ` · 📎 ${email.attachment}` : ""}
          </div>
        </div>
        <pre className="whitespace-pre-wrap px-4 py-3 font-mono text-[12.5px] leading-relaxed text-ink-soft">
          {email.body}
        </pre>
      </Card>
    );
  }

  if (text) {
    return (
      <Card>
        <div className="border-b border-line px-4 py-3 text-sm font-semibold text-ink">
          Pasted message
        </div>
        <pre className="whitespace-pre-wrap px-4 py-3 font-mono text-[12.5px] leading-relaxed text-ink-soft">
          {text}
        </pre>
      </Card>
    );
  }

  return (
    <Card className="p-10 text-center text-sm text-ink-soft">
      This job was created by manual entry — no source message. Edit the fields
      on the Booking tab.
    </Card>
  );
}
