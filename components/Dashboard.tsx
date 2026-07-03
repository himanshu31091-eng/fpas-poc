"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useStore } from "./store";
import { usePrefs } from "./prefs";
import { Button, Card, CountUp, FlightStatusChip, StatusBadge } from "./ui";
import { CommodityArt } from "./CommodityArt";
import { Calendar } from "./Calendar";
import { Insights } from "./Insights";
import {
  IconAlert,
  IconArrowRight,
  IconBox,
  IconCheckCircle,
  IconColumns,
  IconGrid,
  IconList,
  IconPlane,
  IconPlus,
  IconSearch,
  IconSparkles,
  IconTrash,
} from "./icons";
import type { FlightManagerLead } from "@/lib/types";

type View = "jobs" | "calendar" | "insights" | "bin";

const VIEWS: { id: View; label: string; icon: (p: { width?: number; height?: number }) => JSX.Element }[] = [
  { id: "jobs", label: "Jobs", icon: IconGrid },
  { id: "calendar", label: "Calendar", icon: IconPlane },
  { id: "insights", label: "Insights", icon: IconCheckCircle },
  { id: "bin", label: "Bin", icon: IconTrash },
];
import {
  STATUS_LABEL,
  flightStatus,
  hoursUntilArrival,
  jobAgent,
  jobAwb,
  jobCommodity,
  jobStatus,
  jobsContext,
  openCount,
} from "@/lib/jobs";
import type { Job, JobStatus } from "@/lib/types";

const FILTERS: { id: JobStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "extracted", label: "Needs review" },
  { id: "in_progress", label: "In progress" },
  { id: "ready", label: "Ready" },
];

type Layout = "list" | "board" | "grid";

const LAYOUTS: {
  id: Layout;
  label: string;
  icon: (p: { width?: number; height?: number }) => JSX.Element;
}[] = [
  { id: "list", label: "List", icon: IconList },
  { id: "board", label: "Board", icon: IconColumns },
  { id: "grid", label: "Grid", icon: IconGrid },
];

/** Kanban columns, in workflow order. */
const BOARD_COLUMNS: JobStatus[] = ["new", "extracted", "in_progress", "ready"];

export function Dashboard() {
  const {
    jobs,
    deleteJob,
    restoreJob,
    purgeJob,
    resetDemo,
    leads,
    acceptLead,
    dismissLead,
  } = useStore();
  const { canEdit, user, toast } = usePrefs();
  const router = useRouter();
  const [view, setView] = useState<View>("jobs");
  const [layout, setLayout] = useState<Layout>("list");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<JobStatus | "all">("all");
  const [mineOnly, setMineOnly] = useState(false);

  const handleDelete = (id: string) => {
    deleteJob(id);
    toast("Moved to bin");
  };

  const now = useMemo(() => new Date(), []);
  const activeJobs = useMemo(() => jobs.filter((j) => !j.deletedAt), [jobs]);
  const deletedJobs = useMemo(() => jobs.filter((j) => j.deletedAt), [jobs]);

  const stats = useMemo(() => {
    let ready = 0;
    let blocked = 0;
    let arriving = 0;
    for (const job of activeJobs) {
      const status = jobStatus(job);
      if (status === "ready") ready++;
      if (status === "in_progress") blocked++;
      const h = hoursUntilArrival(job, now);
      if (h !== null && h >= 0 && h <= 48) arriving++;
    }
    return { total: activeJobs.length, ready, blocked, arriving };
  }, [activeJobs, now]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return activeJobs.filter((job) => {
      if (filter !== "all" && jobStatus(job) !== filter) return false;
      if (mineOnly && job.assignee !== user) return false;
      if (!q) return true;
      const hay = [
        jobAwb(job),
        jobAgent(job),
        jobCommodity(job),
        job.booking?.flight ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [activeJobs, query, filter, mineOnly, user]);

  return (
    <div>
      {/* Gradient hero */}
      <div
        data-tour="hero"
        className="relative mb-6 overflow-hidden rounded-xl2 bg-brand px-7 py-7 text-white shadow-glow"
      >
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-24 right-24 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-white/70">
              Import jobs · Amsterdam Schiphol
            </div>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">
              Live-animal import control
            </h1>
            <p className="mt-1.5 max-w-xl text-sm text-white/80">
              Every shipment tracked against the regulatory sequence. Open a job
              to run AI extraction, check readiness, and draft documents.
            </p>
          </div>
          {canEdit && (
            <Link href="/jobs/new">
              <span className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-primary shadow-lg transition-all hover:-translate-y-0.5 active:scale-[0.98]">
                <IconPlus width={16} height={16} />
                New booking
              </span>
            </Link>
          )}
        </div>
      </div>

      {/* View switcher */}
      <div data-tour="views" className="mb-5 flex flex-wrap gap-1.5">
        {VIEWS.map((v) => {
          const Icon = v.icon;
          return (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${
                view === v.id
                  ? "bg-brand text-white shadow-glow"
                  : "border border-line bg-white text-ink-soft hover:border-primary/40 hover:text-ink"
              }`}
            >
              <Icon width={15} height={15} />
              {v.label}
            </button>
          );
        })}
      </div>

      {view === "calendar" && <Calendar />}
      {view === "insights" && <Insights />}
      {view === "bin" && (
        <BinView
          jobs={deletedJobs}
          canEdit={canEdit}
          onRestore={(id) => {
            restoreJob(id);
            toast("Job restored", "success");
          }}
          onPurge={(id) => {
            purgeJob(id);
            toast("Job permanently deleted");
          }}
        />
      )}

      {view === "jobs" && (
      <div className="animate-fade-up">
      <div data-tour="briefing">
        <BriefingCard jobs={activeJobs} />
      </div>
      {/* Flight Manager intake */}
      {leads.length > 0 && (
        <div data-tour="flightmanager" className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <IconPlane width={16} height={16} className="text-primary" />
            <span className="text-sm font-semibold text-ink">
              Pending from Flight Manager
            </span>
            <span className="rounded-full bg-amber-soft px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-amber">
              {leads.length} to review
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {leads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                canEdit={canEdit}
                onAccept={() => {
                  const id = acceptLead(lead.id);
                  if (id) {
                    toast("Job created from Flight Manager", "success");
                    router.push(`/jobs/${id}`);
                  }
                }}
                onDismiss={() => dismissLead(lead.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Stat tiles */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Total jobs" value={stats.total} tone="primary" icon={IconBox} />
        <Stat label="Ready for arrival" value={stats.ready} tone="green" icon={IconCheckCircle} />
        <Stat label="In progress" value={stats.blocked} tone="amber" icon={IconAlert} />
        <Stat label="Arriving ≤ 48h" value={stats.arriving} tone="cyan" icon={IconPlane} />
      </div>

      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <IconSearch
            width={16}
            height={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search AWB, agent, commodity, flight…"
            className="w-full rounded-xl border border-line-strong bg-white py-2 pl-9 pr-3 text-sm text-ink shadow-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-all ${
                filter === f.id
                  ? "bg-brand text-white shadow-glow"
                  : "border border-line bg-white text-ink-soft hover:border-primary/40 hover:text-ink"
              }`}
            >
              {f.label}
            </button>
          ))}
          <button
            onClick={() => setMineOnly((m) => !m)}
            className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-all ${
              mineOnly
                ? "bg-brand text-white shadow-glow"
                : "border border-line bg-white text-ink-soft hover:border-primary/40 hover:text-ink"
            }`}
            title={`Show only jobs assigned to ${user}`}
          >
            My jobs
          </button>
        </div>

        {/* Layout switcher */}
        <div className="ml-auto flex items-center gap-0.5 rounded-full border border-line bg-white p-0.5">
          {LAYOUTS.map((l) => {
            const Icon = l.icon;
            const active = layout === l.id;
            return (
              <button
                key={l.id}
                onClick={() => setLayout(l.id)}
                title={`${l.label} view`}
                aria-pressed={active}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium transition-all ${
                  active
                    ? "bg-brand text-white shadow-glow"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                <Icon width={14} height={14} />
                <span className="hidden sm:inline">{l.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Jobs list */}
      <div data-tour="joblist">
        {visible.length === 0 ? (
          <EmptyState
            hasJobs={jobs.length > 0}
            canEdit={canEdit}
            onReset={resetDemo}
          />
        ) : layout === "board" ? (
          <JobBoard jobs={visible} canEdit={canEdit} onDelete={handleDelete} />
        ) : layout === "grid" ? (
          <div className="stagger grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                canEdit={canEdit}
                onDelete={handleDelete}
                showStatus
              />
            ))}
          </div>
        ) : (
          <div className="stagger space-y-2.5">
            {visible.map((job) => (
              <JobRow
                key={job.id}
                job={job}
                canEdit={canEdit}
                onDelete={() => handleDelete(job.id)}
              />
            ))}
          </div>
        )}
      </div>

      </div>
      )}

      {canEdit && (
        <div className="mt-5 flex justify-end">
          <button
            onClick={() => {
              resetDemo();
              toast("Demo data reset", "success");
            }}
            className="font-mono text-[11px] uppercase tracking-wide text-ink-faint transition-colors hover:text-primary"
          >
            ↺ Reset demo data
          </button>
        </div>
      )}
    </div>
  );
}

const TONES = {
  primary: { text: "text-primary", chip: "bg-primary-soft text-primary" },
  green: { text: "text-green", chip: "bg-green-soft text-green" },
  amber: { text: "text-amber", chip: "bg-amber-soft text-amber" },
  cyan: { text: "text-cyan", chip: "bg-cyan/10 text-cyan" },
} as const;

function Stat({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: number;
  tone: keyof typeof TONES;
  icon: (p: { width?: number; height?: number }) => JSX.Element;
}) {
  const t = TONES[tone];
  return (
    <div className="lift rounded-card border border-line bg-panel p-4 shadow-card hover:shadow-lift">
      <div className="flex items-center justify-between">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${t.chip}`}>
          <Icon width={18} height={18} />
        </span>
      </div>
      <div className={`mt-3 font-display text-3xl font-bold ${t.text}`}>
        <CountUp value={value} />
      </div>
      <div className="mt-0.5 text-[12px] text-ink-soft">{label}</div>
    </div>
  );
}

function JobRow({
  job,
  canEdit,
  onDelete,
}: {
  job: Job;
  canEdit: boolean;
  onDelete: () => void;
}) {
  const status = jobStatus(job);
  const open = openCount(job);
  const isHorses = job.booking?.isHorses;
  return (
    <div className="group relative">
      <Link
        href={`/jobs/${job.id}`}
        className="lift flex items-center gap-4 rounded-card border border-line bg-panel px-4 py-3.5 shadow-card hover:border-primary/40 hover:shadow-lift"
      >
        <CommodityArt commodity={jobCommodity(job)} size={40} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-ink">
              {jobAwb(job)}
            </span>
            {isHorses && (
              <span className="rounded-full bg-primary-soft px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide text-primary">
                OKTF
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2 truncate text-[13px] text-ink-soft">
            <span className="truncate">
              {jobAgent(job)} · {jobCommodity(job)}
            </span>
            {job.assignee && (
              <span className="hidden shrink-0 rounded-full bg-primary-soft px-2 py-0.5 font-mono text-[10px] text-primary md:inline">
                {job.assignee.split(" ")[0]}
              </span>
            )}
          </div>
        </div>

        <div className="hidden w-32 shrink-0 sm:block">
          <div className="font-mono text-[12px] text-ink">
            {job.booking?.flight || "—"}
          </div>
          <div className="font-mono text-[11px] text-ink-faint">
            {job.booking?.arrivalDate || "—"}
          </div>
          {(() => {
            const fs = flightStatus(job);
            return fs ? (
              <div className="mt-1">
                <FlightStatusChip state={fs.state} label={fs.label} />
              </div>
            ) : null;
          })()}
        </div>

        <div className="hidden w-24 shrink-0 text-center sm:block">
          {job.booking ? (
            open > 0 ? (
              <span className="font-mono text-[12px] font-semibold text-amber">
                {open} open
              </span>
            ) : (
              <span className="font-mono text-[12px] font-semibold text-green">
                cleared
              </span>
            )
          ) : (
            <span className="font-mono text-[12px] text-ink-faint">—</span>
          )}
        </div>

        <StatusBadge status={status} />

        <IconArrowRight
          width={18}
          height={18}
          className="shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
        />
      </Link>

      {canEdit && (
        <button
          onClick={onDelete}
          title="Delete job"
          className="absolute -right-2 -top-2 hidden h-7 w-7 items-center justify-center rounded-full border border-line bg-white text-ink-faint shadow-card transition-colors hover:text-red group-hover:flex"
        >
          <IconTrash width={14} height={14} />
        </button>
      )}
    </div>
  );
}

function JobBoard({
  jobs,
  canEdit,
  onDelete,
}: {
  jobs: Job[];
  canEdit: boolean;
  onDelete: (id: string) => void;
}) {
  const columns = useMemo(() => {
    const map: Record<JobStatus, Job[]> = {
      new: [],
      extracted: [],
      in_progress: [],
      ready: [],
    };
    for (const job of jobs) map[jobStatus(job)].push(job);
    return map;
  }, [jobs]);

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      {BOARD_COLUMNS.map((col) => (
        <div
          key={col}
          className="rounded-card border border-line bg-panel/50 p-2.5"
        >
          <div className="mb-2.5 flex items-center justify-between px-1">
            <span className="text-[12px] font-semibold text-ink">
              {STATUS_LABEL[col]}
            </span>
            <span className="rounded-full bg-bg px-2 py-0.5 font-mono text-[10px] font-semibold text-ink-soft">
              {columns[col].length}
            </span>
          </div>
          <div className="stagger space-y-2.5">
            {columns[col].length === 0 ? (
              <div className="rounded-xl border border-dashed border-line px-3 py-6 text-center text-[11px] text-ink-faint">
                Nothing here
              </div>
            ) : (
              columns[col].map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  canEdit={canEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function JobCard({
  job,
  canEdit,
  onDelete,
  showStatus = false,
}: {
  job: Job;
  canEdit: boolean;
  onDelete: (id: string) => void;
  showStatus?: boolean;
}) {
  const status = jobStatus(job);
  const open = openCount(job);
  const isHorses = job.booking?.isHorses;
  const fs = flightStatus(job);
  return (
    <div className="group relative">
      <Link
        href={`/jobs/${job.id}`}
        className="lift block rounded-card border border-line bg-panel p-3.5 shadow-card hover:border-primary/40 hover:shadow-lift"
      >
        <div className="flex items-start gap-3">
          <CommodityArt commodity={jobCommodity(job)} size={36} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[13px] font-semibold text-ink">
                {jobAwb(job)}
              </span>
              {isHorses && (
                <span className="rounded-full bg-primary-soft px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide text-primary">
                  OKTF
                </span>
              )}
            </div>
            <div className="mt-0.5 truncate text-[12px] text-ink-soft">
              {jobAgent(job)} · {jobCommodity(job)}
            </div>
          </div>
          {showStatus && <StatusBadge status={status} />}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5">
          <div className="min-w-0">
            <div className="font-mono text-[12px] text-ink">
              {job.booking?.flight || "—"}
            </div>
            <div className="font-mono text-[11px] text-ink-faint">
              {job.booking?.arrivalDate || "—"}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {fs && <FlightStatusChip state={fs.state} label={fs.label} />}
            {job.booking ? (
              open > 0 ? (
                <span className="font-mono text-[12px] font-semibold text-amber">
                  {open} open
                </span>
              ) : (
                <span className="font-mono text-[12px] font-semibold text-green">
                  cleared
                </span>
              )
            ) : null}
          </div>
        </div>

        {job.assignee && (
          <div className="mt-2 inline-flex rounded-full bg-primary-soft px-2 py-0.5 font-mono text-[10px] text-primary">
            {job.assignee.split(" ")[0]}
          </div>
        )}
      </Link>

      {canEdit && (
        <button
          onClick={() => onDelete(job.id)}
          title="Delete job"
          className="absolute -right-2 -top-2 hidden h-7 w-7 items-center justify-center rounded-full border border-line bg-white text-ink-faint shadow-card transition-colors hover:text-red group-hover:flex"
        >
          <IconTrash width={14} height={14} />
        </button>
      )}
    </div>
  );
}

function BinView({
  jobs,
  canEdit,
  onRestore,
  onPurge,
}: {
  jobs: Job[];
  canEdit: boolean;
  onRestore: (id: string) => void;
  onPurge: (id: string) => void;
}) {
  if (jobs.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-line-strong bg-panel/60 p-12 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-bg text-ink-faint">
          <IconTrash width={22} height={22} />
        </div>
        <p className="text-sm text-ink-soft">The bin is empty.</p>
        <p className="mt-1 text-[12px] text-ink-faint">
          Deleted jobs appear here and can be restored.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-2.5">
      <p className="text-[13px] text-ink-soft">
        {jobs.length} deleted job{jobs.length === 1 ? "" : "s"}. Restore to bring
        one back, or delete permanently.
      </p>
      {jobs.map((job) => (
        <Card key={job.id} className="flex items-center gap-4 p-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-bg text-ink-faint">
            <IconTrash width={18} height={18} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-sm font-semibold text-ink">
              {jobAwb(job)}
            </div>
            <div className="truncate text-[13px] text-ink-soft">
              {jobAgent(job)} · {jobCommodity(job)}
              {job.deletedAt ? ` · deleted ${new Date(job.deletedAt).toLocaleDateString()}` : ""}
            </div>
          </div>
          {canEdit && (
            <div className="flex shrink-0 items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => onRestore(job.id)}>
                Restore
              </Button>
              <button
                onClick={() => onPurge(job.id)}
                className="rounded-xl px-2.5 py-1.5 text-[12px] text-ink-faint transition-colors hover:text-red"
              >
                Delete forever
              </button>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

function BriefingCard({ jobs }: { jobs: Job[] }) {
  const [text, setText] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          question:
            "Give me today's operations briefing. In 4-6 short bullet points, call out shipments at risk and why (missing NVWA approval, missing arrival time, load list not sent, arriving soon with open steps), most urgent first. End with one line on overall readiness.",
          context: jobsContext(jobs, new Date()),
        }),
      });
      if (!res.ok) {
        const dd = await res.json().catch(() => ({}));
        throw new Error(dd.error || `Request failed (${res.status})`);
      }
      const data = await res.json();
      setText(data.answer ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Briefing failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mb-5 border-primary/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand text-white shadow-glow">
            <IconSparkles width={16} height={16} />
          </span>
          <div>
            <div className="text-sm font-semibold text-ink">AI daily briefing</div>
            <div className="text-[12px] text-ink-soft">
              What needs attention across the operation, right now.
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={generate} disabled={busy}>
          <IconSparkles width={15} height={15} />
          {busy ? "Reading the board…" : text ? "Refresh" : "Generate briefing"}
        </Button>
      </div>
      {error && (
        <p className="mt-3 text-[12px] text-red">
          <span className="font-mono font-semibold uppercase">AI unavailable · </span>
          {error}
        </p>
      )}
      {text && (
        <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-bg/60 px-3 py-2.5 font-body text-[13px] leading-relaxed text-ink">
          {text}
        </pre>
      )}
    </Card>
  );
}

function LeadCard({
  lead,
  canEdit,
  onAccept,
  onDismiss,
}: {
  lead: FlightManagerLead;
  canEdit: boolean;
  onAccept: () => void;
  onDismiss: () => void;
}) {
  return (
    <Card className="border-primary/20 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-3">
          <CommodityArt commodity={lead.commodity} size={40} />
          <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-ink">
              {lead.flight}
            </span>
            <span className="rounded-full bg-primary-soft px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide text-primary">
              Pending
            </span>
          </div>
          <div className="mt-0.5 text-[13px] text-ink-soft">
            {lead.carrier} · {lead.animalCount} {lead.commodity.toLowerCase()} ·{" "}
            {lead.origin}
          </div>
          <div className="mt-0.5 font-mono text-[11px] text-ink-faint">
            arr {lead.arrivalDate} {lead.arrivalTime}
          </div>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wide text-primary">
          <IconSparkles width={11} height={11} />
          Flight Mgr
        </span>
      </div>
      {canEdit && (
        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            onClick={onDismiss}
            className="rounded-xl px-3 py-1.5 text-[12px] text-ink-faint transition-colors hover:text-red"
          >
            Dismiss
          </button>
          <Button size="sm" onClick={onAccept}>
            Accept & create job →
          </Button>
        </div>
      )}
    </Card>
  );
}

function EmptyState({
  hasJobs,
  canEdit,
  onReset,
}: {
  hasJobs: boolean;
  canEdit: boolean;
  onReset: () => void;
}) {
  return (
    <div className="rounded-card border border-dashed border-line-strong bg-panel/60 p-12 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft text-primary">
        <IconBox width={22} height={22} />
      </div>
      <p className="text-sm text-ink-soft">
        {hasJobs
          ? "No jobs match your search or filter."
          : "No jobs yet. Create one from an agent email, or load the sample data."}
      </p>
      {canEdit && (
        <div className="mt-4 flex justify-center gap-3">
          <Link href="/jobs/new">
            <Button>
              <IconPlus width={16} height={16} />
              New booking
            </Button>
          </Link>
          {!hasJobs && (
            <Button variant="ghost" onClick={onReset}>
              Load sample data
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
