"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useStore } from "./store";
import { usePrefs, STAFF } from "./prefs";
import { Button, Card, FlightStatusChip, OpsStageChip, StatusBadge } from "./ui";
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
import { useStaff, StaffingChip } from "./staffStore";
import { availableStaff, statusOnDate, displayName, STATUS_META } from "@/lib/staff";
import {
  IconBox,
  IconChevronLeft,
  IconCheckCircle,
  IconClock,
  IconDoc,
  IconPlane,
  IconSparkles,
  IconTrash,
  IconUsers,
} from "./icons";
import {
  flightStatus,
  jobAgent,
  jobAwb,
  jobStatus,
  openCount,
  OPS_STAGES,
} from "@/lib/jobs";
import type { Job, OpsStage } from "@/lib/types";

type Tab =
  | "source"
  | "extraction"
  | "booking"
  | "readiness"
  | "loadplan"
  | "staffing"
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
    ...(job.booking
      ? [{ id: "staffing", label: "Staffing", icon: IconUsers } as TabDef]
      : []),
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
  const { getJob, jobs, deleteJob, restoreJob, regenerateArtifacts, assignJob, updateJob } =
    useStore();
  const { canEdit, toast } = usePrefs();
  const job = getJob(jobId);

  const [tab, setTab] = useState<Tab>(() => (job ? defaultTab(job) : "source"));

  // Deep-link resilience: a QR/link may carry ?awb= — if this device doesn't
  // have that exact job id (e.g. scanned from another device), resolve to the
  // job with the same AWB instead of showing "doesn't exist".
  useEffect(() => {
    if (job) return;
    const awb = new URLSearchParams(window.location.search).get("awb");
    if (!awb) return;
    const match = jobs.find((j) => !j.deletedAt && j.booking?.awb === awb);
    if (match && match.id !== jobId) router.replace(`/jobs/${match.id}`);
  }, [job, jobs, jobId, router]);

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
              <OpsStageChip stage={job.stage} />
              {(() => {
                const fs = flightStatus(job);
                return fs ? <FlightStatusChip state={fs.state} label={fs.label} /> : null;
              })()}
              <StaffingChip jobId={jobId} />
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
            value={job.stage ?? ""}
            onChange={(e) => {
              const stage = (e.target.value || undefined) as OpsStage | undefined;
              updateJob(jobId, { stage });
              toast(stage ? `Stage → ${stage}` : "Stage cleared");
            }}
            disabled={!canEdit}
            className="rounded-xl border border-line bg-white px-2.5 py-1.5 text-[12px] text-ink-soft focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
            title="Ops stage — the manual handling lifecycle (distinct from regulatory readiness)"
          >
            <option value="">No stage</option>
            {OPS_STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
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
      <div key={tab} className="animate-fade-in">
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
      {tab === "staffing" && <JobStaffing job={job} />}
      {tab === "submissions" && <Submissions jobId={jobId} />}
      {tab === "update" && <CustomerUpdate jobId={jobId} />}
      {tab === "artifacts" && <Artifacts jobId={jobId} />}
      {tab === "timeline" && <Timeline jobId={jobId} />}
      </div>
    </div>
  );
}

function JobStaffing({ job }: { job: Job }) {
  const { roster, leave, team, assets, staffing, profiles, getStaffing, setStaffing } =
    useStaff();
  const { jobs } = useStore();
  const { canEdit, toast } = usePrefs();
  const date = job.booking?.arrivalDate ?? "";
  const existing = getStaffing(job.id);
  const [needed, setNeeded] = useState(existing?.needed ?? 2);
  const [assigned, setAssigned] = useState<string[]>(existing?.assigned ?? []);
  const [assignedAssets, setAssignedAssets] = useState<string[]>(
    existing?.assets ?? []
  );

  if (!date) {
    return (
      <Card className="p-8 text-center text-sm text-ink-soft">
        Set an arrival date on the booking to plan staffing for the shipment day.
      </Card>
    );
  }

  const free = availableStaff(team, date, roster, leave);
  const away = team
    .map((s) => ({ s, st: statusOnDate(s, date, roster, leave) }))
    .filter((x) => x.st && !["working", "training"].includes(x.st.status));

  // Double-booking: staff/assets assigned to OTHER shipments arriving the same day.
  const jobById = new Map(jobs.map((j) => [j.id, j]));
  const staffUse = new Map<string, string[]>();
  const assetUse = new Map<string, string[]>();
  for (const sa of staffing) {
    if (sa.jobId === job.id) continue;
    const other = jobById.get(sa.jobId);
    if (!other || other.deletedAt || other.booking?.arrivalDate !== date)
      continue;
    const awb = jobAwb(other);
    for (const s of sa.assigned)
      staffUse.set(s, [...(staffUse.get(s) ?? []), awb]);
    for (const a of sa.assets ?? [])
      assetUse.set(a, [...(assetUse.get(a) ?? []), awb]);
  }
  const clashCount =
    assigned.filter((s) => staffUse.has(s)).length +
    assignedAssets.filter((a) => assetUse.has(a)).length;

  function toggle(name: string) {
    setAssigned((a) =>
      a.includes(name) ? a.filter((x) => x !== name) : [...a, name]
    );
  }
  function toggleAsset(id: string) {
    setAssignedAssets((a) =>
      a.includes(id) ? a.filter((x) => x !== id) : [...a, id]
    );
  }

  function saveStaffing() {
    setStaffing({ jobId: job.id, needed, assigned, assets: assignedAssets });
    toast("Staffing saved", "success");
  }

  const short = assigned.length < needed;

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-ink">
              Staffing for arrival · {date}
              {job.booking?.arrivalTime ? ` ${job.booking.arrivalTime}` : ""}
            </div>
            <div className="text-[12px] text-ink-soft">
              Assign floor staff for this shipment from those available that day.
            </div>
          </div>
          <label className="flex items-center gap-2 text-[13px] text-ink-soft">
            Staff needed
            <input
              type="number"
              min={0}
              value={needed}
              disabled={!canEdit}
              onChange={(e) => setNeeded(Math.max(0, Number(e.target.value) || 0))}
              className="w-16 rounded-md border border-line-strong bg-white px-2 py-1 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
            />
          </label>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold ${
              short ? "bg-amber-soft text-amber" : "bg-green-soft text-green"
            }`}
          >
            {assigned.length}/{needed} assigned
          </span>
          {short && (
            <span className="text-[12px] text-ink-soft">
              {needed - assigned.length} more needed
            </span>
          )}
          {clashCount > 0 && (
            <span className="rounded-full bg-red-soft px-2.5 py-1 font-mono text-[11px] font-semibold text-red">
              ⚠ {clashCount} double-booked
            </span>
          )}
        </div>

        <div className="mt-4">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-wide text-ink-faint">
            Available that day ({free.length})
          </div>
          {free.length === 0 ? (
            <p className="text-[13px] text-ink-soft">
              No staff available on {date}. Check leave/roster.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {free.map((s) => {
                const on = assigned.includes(s);
                const clash = staffUse.get(s);
                return (
                  <button
                    key={s}
                    onClick={() => canEdit && toggle(s)}
                    disabled={!canEdit}
                    title={
                      clash
                        ? `Also assigned to ${clash.join(", ")} on ${date}`
                        : undefined
                    }
                    className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-all disabled:cursor-not-allowed ${
                      on
                        ? "bg-brand text-white shadow-glow"
                        : clash
                        ? "border border-amber/60 bg-amber-soft text-amber hover:brightness-105"
                        : "border border-line bg-white text-ink-soft hover:border-primary/40 hover:text-ink"
                    }`}
                  >
                    {clash ? "⚠ " : ""}
                    {displayName(s, profiles)}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {away.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-wide text-ink-faint">
              Unavailable
            </div>
            <div className="flex flex-wrap gap-2">
              {away.map(({ s, st }) => (
                <span
                  key={s}
                  className={`rounded-full px-2.5 py-1 text-[12px] ${
                    STATUS_META[st!.status].cell
                  }`}
                >
                  {displayName(s, profiles)} · {STATUS_META[st!.status].label}
                </span>
              ))}
            </div>
          </div>
        )}

        {assets.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-wide text-ink-faint">
              Equipment / assets ({assignedAssets.length} assigned)
            </div>
            <div className="flex flex-wrap gap-2">
              {assets.map((a) => {
                const on = assignedAssets.includes(a.id);
                const clash = assetUse.get(a.id);
                return (
                  <button
                    key={a.id}
                    onClick={() => canEdit && toggleAsset(a.id)}
                    disabled={!canEdit}
                    title={
                      clash
                        ? `${a.type} · already on ${clash.join(", ")} on ${date}`
                        : `${a.type} · ×${a.quantity}`
                    }
                    className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-all disabled:cursor-not-allowed ${
                      on
                        ? "bg-brand text-white shadow-glow"
                        : clash
                        ? "border border-amber/60 bg-amber-soft text-amber hover:brightness-105"
                        : "border border-line bg-white text-ink-soft hover:border-primary/40 hover:text-ink"
                    }`}
                  >
                    {clash ? "⚠ " : ""}
                    {a.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {canEdit && (
          <div className="mt-5 flex justify-end">
            <Button onClick={saveStaffing}>Save staffing</Button>
          </div>
        )}
      </Card>
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
