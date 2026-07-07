"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "./store";
import { usePrefs } from "./prefs";
import { WeatherChip, WelfareBadge, useWeather } from "./weather";
import { StaffingChip } from "./staffStore";
import { weatherLabel, welfareFlag } from "@/lib/weather";
import {
  JobFilters,
  EMPTY_FACETS,
  type JobFacets,
  type CommodityGroup,
} from "./JobFilters";
import { Button, Card, CountUp, FlightStatusChip, SimTag, StatusBadge } from "./ui";
import { CommodityArt } from "./CommodityArt";
import { Calendar } from "./Calendar";
import { Insights } from "./Insights";
import { Report } from "./Report";
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
  IconReport,
  IconSearch,
  IconSparkles,
  IconTrash,
} from "./icons";
import { SHIPPING_AGENTS } from "@/lib/mockData";
import type { FlightManagerLead, JobType } from "@/lib/types";

type View = "jobs" | "calendar" | "insights" | "report" | "bin";

const VIEWS: { id: View; label: string; icon: (p: { width?: number; height?: number }) => JSX.Element }[] = [
  { id: "jobs", label: "Jobs", icon: IconGrid },
  { id: "calendar", label: "Calendar", icon: IconPlane },
  { id: "insights", label: "Insights", icon: IconCheckCircle },
  { id: "report", label: "Report", icon: IconReport },
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
  const [facets, setFacets] = useState<JobFacets>(EMPTY_FACETS);

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

  const agentOptions = useMemo(
    () =>
      Array.from(
        new Set(activeJobs.map(jobAgent).filter((a) => a && a !== "—"))
      ).sort(),
    [activeJobs]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return activeJobs.filter((job) => {
      if (filter !== "all" && jobStatus(job) !== filter) return false;
      if (mineOnly && job.assignee !== user) return false;

      // Facet: job type
      if (facets.jobType && job.booking?.jobType !== facets.jobType) return false;

      // Facet: commodity group
      if (facets.commodities.length) {
        const c = jobCommodity(job).toLowerCase();
        const g: CommodityGroup = /horse/.test(c)
          ? "horses"
          : /dog|cat|companion|pet/.test(c)
          ? "companion"
          : "other";
        if (!facets.commodities.includes(g)) return false;
      }

      // Facet: shipping agent
      if (facets.agents.length && !facets.agents.includes(jobAgent(job)))
        return false;

      // Facet: arrival window
      if (facets.arrival) {
        const h = hoursUntilArrival(job, now);
        if (facets.arrival === "48h" && !(h !== null && h >= 0 && h <= 48))
          return false;
        if (facets.arrival === "week" && !(h !== null && h >= 0 && h <= 168))
          return false;
        if (facets.arrival === "overdue" && !(h !== null && h < 0)) return false;
      }

      // Text search
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
  }, [activeJobs, query, filter, mineOnly, user, facets, now]);

  return (
    <div>
      {/* Gradient hero */}
      <div
        data-tour="hero"
        className="no-print relative mb-6 overflow-hidden rounded-xl2 bg-brand px-7 py-7 text-white shadow-glow"
      >
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-24 right-24 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
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
              <span className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-fpasnavy shadow-lg transition-all hover:-translate-y-0.5 active:scale-[0.98]">
                <IconPlus width={16} height={16} />
                New booking
              </span>
            </Link>
          )}
        </div>
      </div>

      {/* View switcher */}
      <div data-tour="views" className="no-print mb-5 flex flex-wrap gap-1.5">
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
      {view === "report" && <Report />}
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
            <span className="rounded-full bg-primary-soft px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-primary">
              {leads.length} to review
            </span>
            <SimTag />
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
          <JobFilters facets={facets} setFacets={setFacets} agents={agentOptions} />
        </div>

        {/* Layout switcher */}
        <div
          data-tour="layouts"
          className="ml-auto flex items-center gap-0.5 rounded-full border border-line bg-white p-0.5"
        >
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
            <WelfareBadge date={job.booking?.arrivalDate} />
            <StaffingChip jobId={job.id} />
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
          {job.booking?.arrivalDate && (
            <div className="mt-1">
              <WeatherChip date={job.booking.arrivalDate} />
            </div>
          )}
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
  const router = useRouter();
  const { createQuickJob } = useStore();
  const { toast } = usePrefs();
  const [quickOpen, setQuickOpen] = useState(false);

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
    <div>
      {canEdit && (
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <Button size="sm" onClick={() => setQuickOpen(true)}>
            <IconPlus width={15} height={15} />
            New job
          </Button>
          <Link
            href="/jobs/new"
            className="text-[13px] font-medium text-ink-soft transition-colors hover:text-primary"
          >
            Use full intake →
          </Link>
        </div>
      )}

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

      {quickOpen && (
        <QuickCreateModal
          onClose={() => setQuickOpen(false)}
          onCreate={(fields) => {
            const id = createQuickJob(fields);
            setQuickOpen(false);
            toast("Job created", "success");
            router.push(`/jobs/${id}`);
          }}
        />
      )}
    </div>
  );
}

interface QuickCreateFields {
  jobType: JobType;
  awb: string;
  shippingAgent: string;
  commodity: string;
  animalCount: string;
  flight: string;
  origin: string;
  arrivalDate: string;
  arrivalTime: string;
}

function QuickCreateModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (fields: QuickCreateFields) => void;
}) {
  const [jobType, setJobType] = useState<JobType>("import");
  const [awb, setAwb] = useState("");
  const [shippingAgent, setShippingAgent] = useState("");
  const [commodity, setCommodity] = useState("");
  const [animalCount, setAnimalCount] = useState("");
  const [flight, setFlight] = useState("");
  const [origin, setOrigin] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const canSubmit = awb.trim() !== "" || commodity.trim() !== "";
  const inputCls =
    "w-full rounded-xl border border-line-strong bg-white px-3 py-2 text-sm text-ink shadow-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-primary/30";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onCreate({
      jobType,
      awb,
      shippingAgent,
      commodity,
      animalCount,
      flight,
      origin,
      arrivalDate,
      arrivalTime,
    });
  }

  return (
    <div className="no-print fixed inset-0 z-[70] flex items-start justify-center p-4 pt-[10vh]">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-xl2 border border-line bg-panel shadow-lift">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div className="text-sm font-semibold text-ink">New job</div>
          <button
            onClick={onClose}
            className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-ink-faint transition-colors hover:text-ink"
          >
            ESC
          </button>
        </div>
        <form onSubmit={submit} className="p-4">
          <div className="mb-3 flex gap-1.5">
            {(["import", "export"] as JobType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setJobType(t)}
                className={`rounded-full px-3 py-1 text-[12px] font-medium capitalize transition-all ${
                  jobType === t
                    ? "bg-brand text-white shadow-glow"
                    : "border border-line bg-white text-ink-soft hover:text-ink"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="AWB">
              <input
                autoFocus
                value={awb}
                onChange={(e) => setAwb(e.target.value)}
                placeholder="157-00000000"
                className={inputCls}
              />
            </Field>
            <Field label="Shipping agent">
              <input
                list="qc-agents"
                value={shippingAgent}
                onChange={(e) => setShippingAgent(e.target.value)}
                placeholder="Agent"
                className={inputCls}
              />
              <datalist id="qc-agents">
                {SHIPPING_AGENTS.map((a) => (
                  <option key={a} value={a} />
                ))}
              </datalist>
            </Field>
            <Field label="Commodity">
              <input
                value={commodity}
                onChange={(e) => setCommodity(e.target.value)}
                placeholder="Live horses"
                className={inputCls}
              />
            </Field>
            <Field label="Animal count">
              <input
                value={animalCount}
                onChange={(e) => setAnimalCount(e.target.value)}
                placeholder="4"
                className={inputCls}
              />
            </Field>
            <Field label="Flight">
              <input
                value={flight}
                onChange={(e) => setFlight(e.target.value)}
                placeholder="EK9021"
                className={inputCls}
              />
            </Field>
            <Field label="Origin">
              <input
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="DXB (Dubai)"
                className={inputCls}
              />
            </Field>
            <Field label="Arrival date">
              <input
                type="date"
                value={arrivalDate}
                onChange={(e) => setArrivalDate(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Arrival time">
              <input
                type="time"
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] text-ink-faint">
              Lands in “In progress”. AWB or commodity required.
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button size="sm" type="submit" disabled={!canSubmit}>
                Create job
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] font-medium uppercase tracking-wide text-ink-faint">
        {label}
      </span>
      {children}
    </label>
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
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <WelfareBadge date={job.booking?.arrivalDate} />
              <StaffingChip jobId={job.id} />
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
            {job.booking?.arrivalDate && (
              <WeatherChip date={job.booking.arrivalDate} />
            )}
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
  const { getDay } = useWeather();
  const [text, setText] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** AMS arrival-day weather lines, so the briefing can flag welfare/embargo risk. */
  function weatherContext(): string {
    const lines = jobs
      .filter((j) => j.booking?.arrivalDate)
      .map((j) => {
        const day = getDay(j.booking!.arrivalDate);
        if (!day) return null;
        const flag = welfareFlag(day);
        return (
          `AWB ${jobAwb(j)}: AMS ${day.date} ${weatherLabel(day.code).label}, ` +
          `${Math.round(day.tempMinC)}–${Math.round(day.tempMaxC)}°C` +
          (flag.level !== "ok" ? ` [${flag.label}]` : "")
        );
      })
      .filter(Boolean);
    return lines.length
      ? `\n\nAMS weather at arrival (heat >=27°C or cold <=4°C is a welfare/embargo risk):\n${lines.join(
          "\n"
        )}`
      : "";
  }

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          question:
            "Give me today's operations briefing. In 4-6 short bullet points, call out shipments at risk and why (missing NVWA approval, missing arrival time, load list not sent, arriving soon with open steps, adverse arrival-day weather at AMS), most urgent first. End with one line on overall readiness.",
          context: jobsContext(jobs, new Date()) + weatherContext(),
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
