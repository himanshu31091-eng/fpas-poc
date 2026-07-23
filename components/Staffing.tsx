"use client";

import { useEffect, useMemo, useState } from "react";
import { useStaff } from "./staffStore";
import { useStore } from "./store";
import { usePrefs } from "./prefs";
import { Button, Card, Eyebrow, BrandLoader, SimTag } from "./ui";
import { Markdown } from "./Markdown";
import { IconSparkles, IconChevronLeft, IconDownload } from "./icons";
import { downloadXlsx } from "@/lib/xlsx";
import { requiredCrew, movementsOn } from "@/lib/jobs";
import {
  STATUS_META,
  LEAVE_TYPE_LABEL,
  DOW_LABELS,
  ASSET_TYPES,
  STAFF_ROLES,
  mondayOf,
  addDays,
  weekDates,
  dateStr,
  statusOnDate,
  displayName,
  type RosterEntry,
  type LeaveType,
  type ShiftStatus,
  type AssetType,
  type ShiftPattern,
  type DayStatus,
} from "@/lib/staff";

type Tab = "roster" | "timesheets" | "leave" | "resources" | "import";

const TABS: { id: Tab }[] = [
  { id: "roster" },
  { id: "timesheets" },
  { id: "leave" },
  { id: "resources" },
  { id: "import" },
];

export function Staffing() {
  const staff = useStaff();
  const { t } = usePrefs();
  const [tab, setTab] = useState<Tab>("roster");

  if (!staff.hydrated) {
    return (
      <Card className="p-10">
        <BrandLoader label="Loading roster…" />
      </Card>
    );
  }

  return (
    <div>
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Eyebrow>{t("staff.eyebrow")}</Eyebrow>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">
            {t("staff.title")}
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            {t("staff.subtitle")}
          </p>
        </div>
      </header>

      <div className="mb-5 flex flex-wrap gap-1.5">
        {TABS.map((tb) => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${
              tab === tb.id
                ? "bg-brand text-white shadow-glow"
                : "border border-line bg-white text-ink-soft hover:border-primary/40 hover:text-ink"
            }`}
          >
            {t(`staff.tab.${tb.id}`)}
          </button>
        ))}
      </div>

      <div key={tab} className="animate-fade-in">
        {tab === "roster" && <RosterTab />}
        {tab === "timesheets" && <TimesheetsTab />}
        {tab === "leave" && <LeaveTab />}
        {tab === "resources" && <ResourcesTab />}
        {tab === "import" && <ImportTab />}
      </div>
    </div>
  );
}

// --- Roster board + coverage Q&A -------------------------------------------

function RosterTab() {
  const { roster, leave, team, profiles, addRosterEntries } = useStaff();
  const { canEdit, toast } = usePrefs();
  const { jobs } = useStore();
  const [mode, setMode] = useState<"week" | "month">("week");
  const [anchor, setAnchor] = useState<Date>(() => new Date());
  const [showHelp, setShowHelp] = useState(false);
  const todayStr = dateStr(new Date());

  const days = useMemo(() => {
    if (mode === "week") return weekDates(mondayOf(anchor));
    const y = anchor.getFullYear();
    const m = anchor.getMonth();
    const n = new Date(y, m + 1, 0).getDate();
    return Array.from({ length: n }, (_, i) => new Date(y, m, i + 1));
  }, [mode, anchor]);

  // Fill the CURRENTLY VISIBLE range (week or month) from each person's shift
  // plan — blanks only, so it never overwrites existing shifts or leave.
  function fillFromPlan() {
    const entries: Omit<RosterEntry, "id">[] = [];
    for (const s of team) {
      const shift = profiles[s]?.shift;
      if (!shift?.days.length) continue;
      for (const d of days) {
        const dow = (d.getDay() + 6) % 7; // 0 = Monday
        if (!shift.days.includes(dow)) continue;
        const ds = dateStr(d);
        if (roster.some((r) => r.staff === s && r.date === ds)) continue; // keep existing
        entries.push({ staff: s, date: ds, status: "working", start: shift.start, end: shift.end });
      }
    }
    if (!entries.length) {
      toast("Nothing to fill — visible days already have shifts, or no shift plans set", "default");
      return;
    }
    addRosterEntries(entries);
    toast(`Filled ${entries.length} shift${entries.length === 1 ? "" : "s"} across the visible ${mode}`, "success");
  }

  const avail = useMemo(
    () =>
      days.map((d) => {
        const ds = dateStr(d);
        return team.filter((s) => {
          const st = statusOnDate(s, ds, roster, leave);
          return !st || st.status === "working" || st.status === "training";
        }).length;
      }),
    [days, roster, leave, team]
  );

  // Booking-derived coverage: crew required by that day's shipments vs. the
  // number actually rostered on (working/training). Blank cells don't count
  // as "scheduled" here — this is the commitment view, not the availability one.
  const coverage = useMemo(
    () =>
      days.map((d) => {
        const ds = dateStr(d);
        const required = requiredCrew(jobs, ds);
        const scheduled = team.filter((s) => {
          const st = statusOnDate(s, ds, roster, leave);
          return st && (st.status === "working" || st.status === "training");
        }).length;
        const movements = movementsOn(jobs, ds).length;
        return { required, scheduled, movements, short: scheduled < required };
      }),
    [days, roster, leave, team, jobs]
  );

  function prev() {
    setAnchor((a) =>
      mode === "week"
        ? addDays(a, -7)
        : new Date(a.getFullYear(), a.getMonth() - 1, 1)
    );
  }
  function next() {
    setAnchor((a) =>
      mode === "week"
        ? addDays(a, 7)
        : new Date(a.getFullYear(), a.getMonth() + 1, 1)
    );
  }

  function cellText(s: string, d: Date): string {
    const st = statusOnDate(s, dateStr(d), roster, leave);
    if (!st) return "";
    if (st.status === "working")
      return "start" in st && st.start ? `${st.start}-${st.end ?? ""}` : "Working";
    return STATUS_META[st.status].label;
  }

  function exportXlsx() {
    const header = [
      "Staff",
      ...days.map(
        (d) =>
          `${DOW_LABELS[(d.getDay() + 6) % 7]} ${d.getDate()}/${d.getMonth() + 1}`
      ),
    ];
    const rows = team.map((s) => [displayName(s, profiles), ...days.map((d) => cellText(s, d))]);
    const availRow = ["Available", ...avail.map((n) => n)];
    const requiredRow = ["Required (bookings)", ...coverage.map((c) => c.required)];
    const scheduledRow = ["Scheduled", ...coverage.map((c) => c.scheduled)];
    downloadXlsx(`FPAS-roster-${dateStr(days[0])}`, [
      {
        name: mode === "week" ? "Roster (week)" : "Roster (month)",
        rows: [header, ...rows, availRow, requiredRow, scheduledRow],
      },
    ]);
  }

  const label =
    mode === "week"
      ? `Week of ${mondayOf(anchor).toLocaleDateString(undefined, {
          day: "numeric",
          month: "short",
        })}`
      : anchor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const compact = mode === "month";
  const minW = compact ? "min-w-[1500px]" : "min-w-[760px]";

  const shortDays = useMemo(
    () =>
      days
        .map((d, i) => ({ d, c: coverage[i] }))
        .filter(({ c }) => c.short)
        .map(({ d, c }) => ({
          label: `${DOW_LABELS[(d.getDay() + 6) % 7]} ${d.getDate()}/${d.getMonth() + 1}`,
          gap: c.required - c.scheduled,
        })),
    [days, coverage]
  );

  return (
    <div className="space-y-4">
      <CoverageCard weekStart={mondayOf(anchor)} />

      {/* How the roster works — a plain-language primer for new users. */}
      <Card className="border-primary/20 bg-primary-soft/20 p-3">
        <button
          onClick={() => setShowHelp((v) => !v)}
          className="flex w-full items-center justify-between gap-2 text-left"
        >
          <span className="text-[13px] font-semibold text-ink">
            How the roster works
          </span>
          <span className="font-mono text-[11px] text-primary">
            {showHelp ? "Hide" : "Show"}
          </span>
        </button>
        {showHelp && (
          <ol className="mt-2 space-y-1 text-[12.5px] leading-relaxed text-ink-soft">
            <li>
              <strong>1. Each person has a shift plan</strong> — a default
              start/end and the weekdays they normally work. You set it when you
              add a resource (or edit it on the Resources tab).
            </li>
            <li>
              <strong>2. Fill from the plan</strong> — the &ldquo;Fill from
              plan&rdquo; button lays each person&apos;s default shift onto the
              range you&apos;re viewing (this week, or the whole month in Month
              view), skipping any day that already has a shift or leave. You can
              then tweak any single day.
            </li>
            <li>
              <strong>3. Add or change one shift</strong> — use &ldquo;Add /
              update shift&rdquo; below to set a person to working, off, sick,
              training, etc. on a specific date.
            </li>
            <li>
              <strong>4. Leave shows automatically</strong> — approved leave
              (Leave tab) overrides the roster; a pending request shows faded
              until it&apos;s approved.
            </li>
            <li>
              <strong>5. Coverage checks bookings</strong> — the
              &ldquo;Req · sched&rdquo; row compares crew each shipment needs
              against who&apos;s rostered on, flagging thin days.
            </li>
          </ol>
        )}
      </Card>

      {shortDays.length > 0 ? (
        <Card className="border-red/30 bg-red-soft/40 p-3">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
            <span className="font-semibold text-red">Understaffed vs. bookings:</span>
            {shortDays.map((s) => (
              <span
                key={s.label}
                className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 font-mono text-[11px] font-semibold text-red"
              >
                {s.label} · short {s.gap}
              </span>
            ))}
            <span className="text-ink-soft">
              — crew needed for that day&apos;s shipments exceeds staff rostered on.
            </span>
          </div>
        </Card>
      ) : (
        <Card className="border-green/30 bg-green-soft/30 p-3">
          <span className="text-[13px] text-ink-soft">
            <span className="font-semibold text-green">Coverage OK</span> — every
            shipment day in view has enough crew rostered on.
          </span>
        </Card>
      )}

      <AddShift />

      <Card className="p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="text-sm font-semibold text-ink">{label}</div>
            <div className="flex items-center gap-0.5 rounded-full border border-line bg-white p-0.5">
              {(["week", "month"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`rounded-full px-2.5 py-1 text-[12px] font-medium capitalize transition-all ${
                    mode === m
                      ? "bg-brand text-white shadow-glow"
                      : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={prev}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink-soft hover:bg-bg"
              title="Previous"
            >
              <IconChevronLeft width={16} height={16} />
            </button>
            <button
              onClick={() => setAnchor(new Date())}
              className="rounded-lg border border-line px-2.5 py-1.5 text-[12px] text-ink-soft hover:bg-bg"
            >
              Today
            </button>
            <button
              onClick={next}
              className="flex h-8 w-8 rotate-180 items-center justify-center rounded-lg border border-line text-ink-soft hover:bg-bg"
              title="Next"
            >
              <IconChevronLeft width={16} height={16} />
            </button>
            {canEdit && (
              <button
                onClick={fillFromPlan}
                className="ml-1 inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary-soft px-2.5 py-1.5 text-[12px] font-medium text-primary transition-colors hover:bg-primary-soft/70"
                title="Lay each person's default shift plan onto the next two weeks"
              >
                Fill from plan
              </button>
            )}
            <button
              onClick={exportXlsx}
              className="ml-1 inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[12px] text-ink-soft transition-colors hover:border-primary/40 hover:text-ink"
              title="Export to Excel"
            >
              <IconDownload width={14} height={14} />
              Export
            </button>
          </div>
        </div>

        <div className="-mx-1 overflow-x-auto px-1">
          <table className={`w-full ${minW} border-collapse text-[12px]`}>
            <thead>
              <tr>
                <th className="sticky left-0 z-10 w-28 bg-panel px-2 py-2 text-left font-medium text-ink-faint">
                  Staff
                </th>
                {days.map((d) => {
                  const ds = dateStr(d);
                  const isToday = ds === todayStr;
                  const weekend = [0, 6].includes(d.getDay());
                  return (
                    <th
                      key={ds}
                      className={`px-1 py-2 text-center font-medium ${
                        isToday
                          ? "text-primary"
                          : weekend
                          ? "text-ink-faint/60"
                          : "text-ink-faint"
                      }`}
                    >
                      <div>{DOW_LABELS[(d.getDay() + 6) % 7]}</div>
                      <div className="font-mono text-[10px]">
                        {d.getDate()}
                        {compact ? "" : `/${d.getMonth() + 1}`}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {team.map((s) => (
                <tr key={s} className="border-t border-line">
                  <td className="sticky left-0 z-10 bg-panel px-2 py-1.5">
                    <div className="font-medium text-ink">{displayName(s, profiles)}</div>
                    {profiles[s]?.role && (
                      <div className="text-[10px] text-ink-faint">{profiles[s].role}</div>
                    )}
                  </td>
                  {days.map((d) => (
                    <td key={dateStr(d)} className="px-0.5 py-1 text-center">
                      <RosterCell
                        st={statusOnDate(s, dateStr(d), roster, leave)}
                        compact={compact}
                      />
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t border-line-strong">
                <td className="sticky left-0 z-10 bg-panel px-2 py-1.5 font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                  Available
                </td>
                {avail.map((n, i) => (
                  <td
                    key={i}
                    className="px-0.5 py-1.5 text-center font-mono text-[12px] font-semibold text-ink"
                  >
                    {n}
                  </td>
                ))}
              </tr>
              <tr className="border-t border-line">
                <td
                  className="sticky left-0 z-10 bg-panel px-2 py-1.5 font-mono text-[10px] uppercase tracking-wide text-ink-faint"
                  title="Crew required by that day's shipments vs. staff rostered on"
                >
                  Req · sched
                </td>
                {coverage.map((c, i) => (
                  <td key={i} className="px-0.5 py-1.5 text-center">
                    <span
                      className={`inline-flex min-w-[3.2rem] items-center justify-center gap-0.5 rounded-md px-1 py-0.5 font-mono text-[11px] font-semibold ${
                        c.short
                          ? "bg-red-soft text-red"
                          : c.movements > 0
                          ? "bg-green-soft text-green"
                          : "text-ink-faint"
                      }`}
                      title={
                        c.movements > 0
                          ? `${c.movements} movement${c.movements === 1 ? "" : "s"} · needs ${c.required}, ${c.scheduled} rostered`
                          : "No shipments this day"
                      }
                    >
                      {c.required}/{c.scheduled}
                      {c.short ? " !" : ""}
                    </span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          {(
            ["working", "off", "leave", "sick", "holiday", "training"] as ShiftStatus[]
          ).map((s) => (
            <span
              key={s}
              className="flex items-center gap-1.5 text-[11px] text-ink-soft"
            >
              <span className={`h-2.5 w-2.5 rounded-full ${STATUS_META[s].dot}`} />
              {STATUS_META[s].label}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}

function RosterCell({
  st,
  compact,
}: {
  st: DayStatus | null;
  compact?: boolean;
}) {
  if (!st) return <span className="text-ink-faint">·</span>;
  const meta = STATUS_META[st.status];
  const working = st.status === "working";
  const pending = "pending" in st && st.pending;
  const start = "start" in st ? st.start : undefined;
  const base = working
    ? start
      ? `${start}–${"end" in st && st.end ? st.end : ""}`
      : "Working"
    : meta.label;
  const full = pending ? `${base} (pending approval)` : base;
  const display = compact
    ? working
      ? start ?? "W"
      : `${meta.label[0]}${pending ? "·" : ""}`
    : working
    ? base
    : `${meta.label}${pending ? " ·" : ""}`;
  return (
    <span
      className={`inline-block w-full truncate rounded-md px-1 py-1 font-mono ${
        compact ? "text-[10px]" : "text-[11px]"
      } ${meta.cell} ${pending ? "opacity-60 ring-1 ring-dashed ring-current" : ""}`}
      title={"note" in st && st.note ? `${full} · ${st.note}` : full}
    >
      {display}
    </span>
  );
}

function AddShift() {
  const { upsertRosterEntry, team, profiles } = useStaff();
  const { canEdit, toast } = usePrefs();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    staff: team[0] ?? "",
    date: dateStr(new Date()),
    status: "working" as ShiftStatus,
    start: "09:00",
    end: "17:00",
    note: "",
  });

  if (!canEdit) return null;

  function add() {
    if (!f.date) return;
    upsertRosterEntry({
      staff: f.staff,
      date: f.date,
      status: f.status,
      ...(f.status === "working" ? { start: f.start, end: f.end } : {}),
      ...(f.note.trim() ? { note: f.note.trim() } : {}),
    });
    toast("Roster updated", "success");
  }

  return (
    <Card className="p-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-sm font-semibold text-ink">
          Add / update a shift
        </span>
        <span className="font-mono text-ink-faint">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Field label="Staff">
            <select
              value={f.staff}
              onChange={(e) => setF({ ...f, staff: e.target.value })}
              className={selectCls}
            >
              {team.map((s) => (
                <option key={s} value={s}>
                  {displayName(s, profiles)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date">
            <input
              type="date"
              value={f.date}
              onChange={(e) => setF({ ...f, date: e.target.value })}
              className={selectCls}
            />
          </Field>
          <Field label="Status">
            <select
              value={f.status}
              onChange={(e) =>
                setF({ ...f, status: e.target.value as ShiftStatus })
              }
              className={selectCls}
            >
              {(
                [
                  "working",
                  "off",
                  "leave",
                  "sick",
                  "holiday",
                  "training",
                ] as ShiftStatus[]
              ).map((s) => (
                <option key={s} value={s}>
                  {STATUS_META[s].label}
                </option>
              ))}
            </select>
          </Field>
          {f.status === "working" ? (
            <>
              <Field label="Start">
                <input
                  type="time"
                  value={f.start}
                  onChange={(e) => setF({ ...f, start: e.target.value })}
                  className={selectCls}
                />
              </Field>
              <Field label="End">
                <input
                  type="time"
                  value={f.end}
                  onChange={(e) => setF({ ...f, end: e.target.value })}
                  className={selectCls}
                />
              </Field>
            </>
          ) : (
            <Field label="Note">
              <input
                value={f.note}
                onChange={(e) => setF({ ...f, note: e.target.value })}
                className={selectCls}
              />
            </Field>
          )}
          <div className="flex items-end">
            <Button onClick={add}>Save</Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function CoverageCard({ weekStart }: { weekStart: Date }) {
  const { roster, leave, team } = useStaff();
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function context(): string {
    const lines = weekDates(weekStart).map((d, i) => {
      const ds = dateStr(d);
      const working: string[] = [];
      const away: string[] = [];
      for (const s of team) {
        const st = statusOnDate(s, ds, roster, leave);
        if (!st) continue;
        if (st.status === "working" || st.status === "training") working.push(s);
        else away.push(`${s} (${st.status})`);
      }
      return `${DOW_LABELS[i]} ${ds}: ${working.length} working [${working.join(
        ", "
      )}]${away.length ? `; away [${away.join(", ")}]` : ""}`;
    });
    return `FPAS Amsterdam staff roster for the week of ${dateStr(
      weekStart
    )}:\n${lines.join("\n")}`;
  }

  async function ask(question: string) {
    const qq = question.trim();
    if (!qq) return;
    setBusy(true);
    setError(null);
    setAnswer(null);
    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: qq, context: context() }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Request failed (${res.status})`);
      }
      const data = await res.json();
      setAnswer(data.answer ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Coverage check failed.");
    } finally {
      setBusy(false);
    }
  }

  const suggestions = [
    "Where is coverage thin this week?",
    "Who is off or on leave this week?",
  ];

  return (
    <Card className="border-primary/20 p-4">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand text-white shadow-glow">
          <IconSparkles width={16} height={16} />
        </span>
        <div>
          <div className="text-sm font-semibold text-ink">Coverage check</div>
          <div className="text-[12px] text-ink-soft">
            Ask the assistant about availability for the visible week.
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask(q)}
          placeholder="e.g. Who can cover a 07:00 arrival on Friday?"
          className="min-w-[240px] flex-1 rounded-xl border border-line-strong bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <Button onClick={() => ask(q)} disabled={busy || !q.trim()}>
          <IconSparkles width={15} height={15} />
          {busy ? "Checking…" : "Ask"}
        </Button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => {
              setQ(s);
              ask(s);
            }}
            className="rounded-full border border-line bg-white px-2.5 py-1 text-[11px] text-ink-soft hover:border-primary/40 hover:text-ink"
          >
            {s}
          </button>
        ))}
      </div>
      {error && (
        <p className="mt-3 text-[12px] text-red">
          <span className="font-mono font-semibold uppercase">AI unavailable · </span>
          {error}
        </p>
      )}
      {answer && (
        <div className="mt-3 rounded-xl bg-bg/60 px-3 py-2.5 text-[13px] text-ink">
          <Markdown text={answer} />
        </div>
      )}
    </Card>
  );
}

// --- Leave requests + calendar ---------------------------------------------

// --- Timesheets: planned (roster) vs actual clock in/out → payroll export ---
const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};
const hoursBetween = (start: string, end: string) =>
  Math.max(0, (toMin(end) - toMin(start)) / 60);

function TimesheetsTab() {
  const { roster, profiles } = useStaff();
  const { t, toast } = usePrefs();
  const [actuals, setActuals] = useState<Record<string, { start: string; end: string }>>({});
  const [seeded, setSeeded] = useState(false);

  const week = useMemo(() => weekDates(mondayOf(new Date())).map((d) => dateStr(d)), []);

  const rows = useMemo(
    () =>
      roster
        .filter(
          (r) =>
            (r.status === "working" || r.status === "training") &&
            r.start &&
            r.end &&
            week.includes(r.date)
        )
        .sort((a, b) => a.date.localeCompare(b.date) || a.staff.localeCompare(b.staff)),
    [roster, week]
  );

  // Seed a couple of realistic variances so the demo shows the point.
  useEffect(() => {
    if (seeded || rows.length === 0) return;
    const seed: Record<string, { start: string; end: string }> = {};
    if (rows[0]) seed[rows[0].id] = { start: rows[0].start!, end: addMin(rows[0].end!, 45) };
    if (rows[2]) seed[rows[2].id] = { start: addMin(rows[2].start!, 20), end: rows[2].end! };
    setActuals(seed);
    setSeeded(true);
  }, [rows, seeded]);

  const actOf = (id: string, start: string, end: string) => actuals[id] ?? { start, end };
  const setAct = (id: string, key: "start" | "end", v: string) =>
    setActuals((p) => ({ ...p, [id]: { ...(p[id] ?? { start: "", end: "" }), [key]: v } }));

  const planned = rows.reduce((s, r) => s + hoursBetween(r.start!, r.end!), 0);
  const actual = rows.reduce((s, r) => {
    const a = actOf(r.id, r.start!, r.end!);
    return s + hoursBetween(a.start, a.end);
  }, 0);
  const variance = actual - planned;

  function exportPayroll() {
    const header = [t("ts.employee"), t("ts.date"), t("ts.planned"), t("ts.clockIn"), t("ts.clockOut"), t("ts.hours"), t("ts.variance")];
    const body = rows.map((r) => {
      const a = actOf(r.id, r.start!, r.end!);
      const h = hoursBetween(a.start, a.end);
      const v = h - hoursBetween(r.start!, r.end!);
      return [displayName(r.staff, profiles), r.date, `${r.start}-${r.end}`, a.start, a.end, h.toFixed(2), v.toFixed(2)];
    });
    const totals = ["", "", planned.toFixed(2), "", "", actual.toFixed(2), variance.toFixed(2)];
    downloadXlsx(`FPAS-timesheets-${week[0]}`, [
      { name: "Timesheets", rows: [header, ...body, totals] },
    ]);
    toast("Week approved · payroll workbook exported", "success");
  }

  const inp =
    "w-[68px] rounded-md border border-line-strong bg-white px-2 py-1 text-center font-mono text-[12px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <TsStat label={t("ts.planned")} value={`${planned.toFixed(1)}h`} sub={t("ts.rostered")} tint="text-ink" />
        <TsStat label={t("ts.actual")} value={`${actual.toFixed(1)}h`} sub={t("ts.fromClock")} tint="text-primary" />
        <TsStat
          label={t("ts.variance")}
          value={`${variance >= 0 ? "+" : ""}${variance.toFixed(1)}h`}
          sub={t("ts.actualMinusPlanned")}
          tint={variance > 0 ? "text-red" : "text-green"}
        />
        <button
          onClick={exportPayroll}
          disabled={rows.length === 0}
          className="ml-auto inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-[13px] font-semibold text-fpasnavy shadow-glow transition-all hover:-translate-y-0.5 disabled:opacity-50"
        >
          <IconDownload width={15} height={15} />
          {t("ts.approveExport")}
        </button>
      </div>

      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-ink-soft">{t("ts.empty")}</p>
        ) : (
          <div className="-mx-1 overflow-x-auto px-1">
            <table className="w-full min-w-[720px] border-collapse text-[12.5px]">
              <thead>
                <tr className="border-b border-line font-mono text-[10px] uppercase tracking-wider text-ink-faint">
                  <th className="px-3 py-2.5 text-left font-medium">{t("ts.employee")}</th>
                  <th className="px-3 py-2.5 text-left font-medium">{t("ts.date")}</th>
                  <th className="px-3 py-2.5 text-left font-medium">{t("ts.planned")}</th>
                  <th className="px-3 py-2.5 text-center font-medium">{t("ts.clockIn")}</th>
                  <th className="px-3 py-2.5 text-center font-medium">{t("ts.clockOut")}</th>
                  <th className="px-3 py-2.5 text-right font-medium">{t("ts.hours")}</th>
                  <th className="px-3 py-2.5 text-right font-medium">{t("ts.variance")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => {
                  const a = actOf(r.id, r.start!, r.end!);
                  const h = hoursBetween(a.start, a.end);
                  const v = h - hoursBetween(r.start!, r.end!);
                  return (
                    <tr key={r.id}>
                      <td className="px-3 py-2 font-medium text-ink">{displayName(r.staff, profiles)}</td>
                      <td className="px-3 py-2 font-mono text-ink-soft">{r.date.slice(5)}</td>
                      <td className="px-3 py-2 font-mono text-ink-faint">
                        {r.start}–{r.end}
                      </td>
                      <td className="px-2 py-2 text-center">
                        <input className={inp} value={a.start} onChange={(e) => setAct(r.id, "start", e.target.value)} />
                      </td>
                      <td className="px-2 py-2 text-center">
                        <input className={inp} value={a.end} onChange={(e) => setAct(r.id, "end", e.target.value)} />
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-semibold text-ink">{h.toFixed(1)}h</td>
                      <td className="px-3 py-2 text-right">
                        <span
                          className={`font-mono font-semibold ${
                            v > 0 ? "text-red" : v < 0 ? "text-amber" : "text-ink-faint"
                          }`}
                        >
                          {v > 0 ? `+${v.toFixed(1)}` : v < 0 ? v.toFixed(1) : "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <p className="font-mono text-[10.5px] text-ink-faint">
        <SimTag className="mr-1.5" /> Approve locks the week and exports approved hours per employee — the payroll hand-off (dnata interim).
      </p>
    </div>
  );
}

function addMin(t: string, mins: number) {
  const total = toMin(t) + mins;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function TsStat({ label, value, sub, tint }: { label: string; value: string; sub: string; tint: string }) {
  return (
    <div className="min-w-[140px] rounded-card border border-line bg-panel p-3.5 shadow-panel">
      <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">{label}</div>
      <div className={`mt-1 font-mono text-[22px] font-bold tracking-tight ${tint}`}>{value}</div>
      <div className="mt-0.5 text-[11px] text-ink-faint">{sub}</div>
    </div>
  );
}

const STATUS_BADGE: Record<string, string> = {
  requested: "bg-amber-soft text-amber",
  approved: "bg-green-soft text-green",
  declined: "bg-red-soft text-red",
};

function LeaveTab() {
  const { leave, roster, requestLeave, decideLeave, removeLeave, removeRosterEntries, team, profiles } =
    useStaff();
  const { canEdit, user, toast } = usePrefs();

  // Absences entered directly on the roster (Import tab / Add shift with status
  // leave|sick) — not leave *requests*. Surface them here too, grouped into
  // contiguous date ranges, so this screen shows every absence in the system.
  const rosterAbsences = useMemo(() => {
    const nextDayStr = (d: string) => {
      const [y, m, dd] = d.split("-").map(Number);
      return dateStr(addDays(new Date(y, m - 1, dd), 1));
    };
    const covered = (staff: string, date: string) =>
      leave.some((l) => l.staff === staff && date >= l.startDate && date <= l.endDate);
    const rows = roster
      .filter((r) => (r.status === "leave" || r.status === "sick") && !covered(r.staff, r.date))
      .sort((a, b) => a.staff.localeCompare(b.staff) || a.date.localeCompare(b.date));
    const groups: {
      staff: string;
      status: ShiftStatus;
      startDate: string;
      endDate: string;
      ids: string[];
    }[] = [];
    for (const r of rows) {
      const last = groups[groups.length - 1];
      if (last && last.staff === r.staff && last.status === r.status && nextDayStr(last.endDate) === r.date) {
        last.endDate = r.date;
        last.ids.push(r.id);
      } else {
        groups.push({ staff: r.staff, status: r.status, startDate: r.date, endDate: r.date, ids: [r.id] });
      }
    }
    return groups;
  }, [roster, leave]);

  const today = dateStr(new Date());
  const [form, setForm] = useState({
    staff: team[0] ?? "",
    startDate: today,
    endDate: today,
    type: "vacation" as LeaveType,
    note: "",
  });

  const canSubmit =
    form.staff && form.startDate && form.endDate && form.endDate >= form.startDate;

  const sorted = useMemo(
    () =>
      [...leave].sort((a, b) => {
        const order = { requested: 0, approved: 1, declined: 2 } as const;
        if (order[a.status] !== order[b.status])
          return order[a.status] - order[b.status];
        return a.startDate.localeCompare(b.startDate);
      }),
    [leave]
  );

  function submit() {
    if (!canSubmit) return;
    requestLeave(form);
    toast("Leave request submitted", "success");
    setForm({ ...form, note: "" });
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
      {/* Request form */}
      <Card className="h-fit p-5">
        <div className="text-sm font-semibold text-ink">Request leave</div>
        <div className="mt-3 space-y-3">
          <Field label="Staff">
            <select
              value={form.staff}
              onChange={(e) => setForm({ ...form, staff: e.target.value })}
              className={selectCls}
            >
              {team.map((s) => (
                <option key={s} value={s}>
                  {displayName(s, profiles)}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="From">
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className={selectCls}
              />
            </Field>
            <Field label="To">
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className={selectCls}
              />
            </Field>
          </div>
          <Field label="Type">
            <select
              value={form.type}
              onChange={(e) =>
                setForm({ ...form, type: e.target.value as LeaveType })
              }
              className={selectCls}
            >
              <option value="vacation">Vacation</option>
              <option value="off">Day off</option>
              <option value="sick">Sick</option>
            </select>
          </Field>
          <Field label="Note (optional)">
            <input
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Reason / cover notes"
              className={selectCls}
            />
          </Field>
          <Button onClick={submit} disabled={!canSubmit}>
            Submit request
          </Button>
          <p className="text-[11px] text-ink-faint">
            Submitted requests show on the roster straight away as
            &ldquo;pending&rdquo; (faded), and become solid once approved on the
            right.
          </p>
        </div>
      </Card>

      {/* Requests list */}
      <Card className="p-4">
        <div className="mb-3 text-sm font-semibold text-ink">
          Leave &amp; absences ({leave.length + rosterAbsences.length})
        </div>
        {sorted.length === 0 && rosterAbsences.length === 0 ? (
          <p className="text-[13px] text-ink-soft">No leave or absences yet.</p>
        ) : (
          <div className="space-y-2">
            {sorted.map((l) => (
              <div
                key={l.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-line bg-panel px-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-ink">
                      {displayName(l.staff, profiles)}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide ${
                        STATUS_BADGE[l.status]
                      }`}
                    >
                      {l.status}
                    </span>
                  </div>
                  <div className="mt-0.5 font-mono text-[11px] text-ink-soft">
                    {LEAVE_TYPE_LABEL[l.type]} · {l.startDate}
                    {l.endDate !== l.startDate ? ` → ${l.endDate}` : ""}
                    {l.note ? ` · ${l.note}` : ""}
                  </div>
                </div>
                {canEdit && (
                  <div className="flex shrink-0 items-center gap-2">
                    {l.status === "requested" && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            decideLeave(l.id, "approved", user);
                            toast("Leave approved", "success");
                          }}
                        >
                          Approve
                        </Button>
                        <button
                          onClick={() => {
                            decideLeave(l.id, "declined", user);
                            toast("Leave declined");
                          }}
                          className="rounded-xl px-2.5 py-1.5 text-[12px] text-ink-faint transition-colors hover:text-red"
                        >
                          Decline
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => {
                        removeLeave(l.id);
                        toast(`Leave removed · ${displayName(l.staff, profiles)}`);
                      }}
                      title="Remove this leave and revert the roster"
                      className="rounded-xl px-2.5 py-1.5 text-[12px] text-ink-faint transition-colors hover:text-red"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            ))}

            {rosterAbsences.map((g) => (
              <div
                key={g.ids[0]}
                className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-line bg-panel px-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-ink">
                      {displayName(g.staff, profiles)}
                    </span>
                    <span className="rounded-full bg-primary-soft px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide text-primary">
                      On roster
                    </span>
                  </div>
                  <div className="mt-0.5 font-mono text-[11px] text-ink-soft">
                    {g.status === "sick" ? "Sick" : "Leave"} · {g.startDate}
                    {g.endDate !== g.startDate ? ` → ${g.endDate}` : ""}
                  </div>
                </div>
                {canEdit && (
                  <button
                    onClick={() => {
                      removeRosterEntries(g.ids);
                      toast(`Leave removed · ${displayName(g.staff, profiles)}`);
                    }}
                    title="Remove this absence and revert the roster"
                    className="rounded-xl px-2.5 py-1.5 text-[12px] text-ink-faint transition-colors hover:text-red"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// --- Resources: team + equipment/assets ------------------------------------

function ResourcesTab() {
  const {
    team,
    assets,
    profiles,
    addStaff,
    removeStaff,
    restoreTeam,
    applyShiftPattern,
    addAsset,
    removeAsset,
  } = useStaff();
  const { canEdit, toast } = usePrefs();
  const [person, setPerson] = useState({
    fullName: "",
    role: STAFF_ROLES[1],
    start: "09:00",
    end: "17:00",
    days: [0, 1, 2, 3, 4] as number[],
  });
  const [asset, setAsset] = useState({
    name: "",
    type: ASSET_TYPES[0],
    quantity: 1,
  });

  function addPerson() {
    const fullName = person.fullName.trim();
    if (!fullName) return;
    addStaff({
      name: fullName,
      fullName,
      role: person.role,
      shift: { start: person.start, end: person.end, days: person.days },
    });
    setPerson({
      fullName: "",
      role: STAFF_ROLES[1],
      start: "09:00",
      end: "17:00",
      days: [0, 1, 2, 3, 4],
    });
    toast("Resource added — shift plan applied to the roster", "success");
  }

  function toggleDay(i: number) {
    setPerson((p) => ({
      ...p,
      days: p.days.includes(i)
        ? p.days.filter((d) => d !== i)
        : [...p.days, i].sort((a, b) => a - b),
    }));
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Team / people */}
      <Card className="p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-semibold text-ink">Team ({team.length})</div>
          {canEdit && (
            <button
              onClick={() => {
                restoreTeam();
                toast("Default team restored", "success");
              }}
              title="Re-add the default employees without touching the roster or leave"
              className="rounded-lg border border-line px-2.5 py-1 text-[11px] text-ink-soft transition-colors hover:border-primary/40 hover:text-ink"
            >
              ↺ Restore default team
            </button>
          )}
        </div>
        <p className="mt-1 text-[12px] text-ink-soft">
          People who appear on the roster and can be assigned to shipments. A new
          resource gets a name, a role and a default shift plan — the plan fills
          straight onto the roster.
        </p>

        {canEdit && (
          <div className="mt-3 space-y-2.5 rounded-card border border-line bg-bg/40 p-3">
            <Field label="Full name">
              <input
                value={person.fullName}
                onChange={(e) =>
                  setPerson({ ...person, fullName: e.target.value })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") addPerson();
                }}
                placeholder="e.g. Sanne de Boer"
                className={selectCls}
              />
            </Field>
            <div className="grid grid-cols-3 gap-2">
              <Field label="Role">
                <select
                  value={person.role}
                  onChange={(e) => setPerson({ ...person, role: e.target.value })}
                  className={selectCls}
                >
                  {STAFF_ROLES.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </Field>
              <Field label="Shift start">
                <input
                  type="time"
                  value={person.start}
                  onChange={(e) =>
                    setPerson({ ...person, start: e.target.value })
                  }
                  className={selectCls}
                />
              </Field>
              <Field label="Shift end">
                <input
                  type="time"
                  value={person.end}
                  onChange={(e) => setPerson({ ...person, end: e.target.value })}
                  className={selectCls}
                />
              </Field>
            </div>
            <Field label="Works on">
              <div className="flex flex-wrap gap-1">
                {DOW_LABELS.map((d, i) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(i)}
                    className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                      person.days.includes(i)
                        ? "bg-brand text-white"
                        : "border border-line bg-white text-ink-soft hover:border-primary/40"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </Field>
            <Button onClick={addPerson}>Add resource</Button>
          </div>
        )}

        <div className="mt-3 space-y-2">
          {team.map((s) => {
            const p = profiles[s];
            const shift = p?.shift;
            return (
              <div
                key={s}
                className="flex items-center justify-between gap-2 rounded-card border border-line bg-panel px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[13px] font-medium text-ink">
                      {displayName(s, profiles)}
                    </span>
                    {p?.role && (
                      <span className="rounded-full bg-bg px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                        {p.role}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 font-mono text-[11px] text-ink-faint">
                    {shift?.days.length
                      ? `${shift.start}–${shift.end} · ${shift.days
                          .map((d) => DOW_LABELS[d])
                          .join(" ")}`
                      : "No shift plan"}
                  </div>
                </div>
                {canEdit && (
                  <div className="flex shrink-0 items-center gap-1.5">
                    {shift?.days.length ? (
                      <button
                        onClick={() => {
                          applyShiftPattern(s, 2);
                          toast(`Applied ${displayName(s, profiles)}'s plan`, "success");
                        }}
                        title="Lay this person's shift plan onto the next two weeks"
                        className="rounded-lg border border-line px-2 py-1 text-[11px] text-ink-soft transition-colors hover:border-primary/40 hover:text-ink"
                      >
                        Apply plan
                      </button>
                    ) : null}
                    <button
                      onClick={() => {
                        removeStaff(s);
                        toast("Staff removed");
                      }}
                      title="Remove"
                      className="text-ink-faint transition-colors hover:text-red"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Equipment / assets */}
      <Card className="p-5">
        <div className="text-sm font-semibold text-ink">
          Equipment &amp; assets ({assets.length})
        </div>
        <p className="mt-1 text-[12px] text-ink-soft">
          Trucks, crates, stalls, bays — resources you can request/assign to a
          shipment.
        </p>
        {canEdit && (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <input
              value={asset.name}
              onChange={(e) => setAsset({ ...asset, name: e.target.value })}
              placeholder="Name"
              className={`${selectCls} col-span-2`}
            />
            <select
              value={asset.type}
              onChange={(e) =>
                setAsset({ ...asset, type: e.target.value as AssetType })
              }
              className={selectCls}
            >
              {ASSET_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              value={asset.quantity}
              onChange={(e) =>
                setAsset({
                  ...asset,
                  quantity: Math.max(1, Number(e.target.value) || 1),
                })
              }
              className={selectCls}
              title="Quantity"
            />
            <div className="col-span-2 sm:col-span-4">
              <Button
                onClick={() => {
                  if (!asset.name.trim()) return;
                  addAsset(asset);
                  setAsset({ name: "", type: ASSET_TYPES[0], quantity: 1 });
                  toast("Resource added", "success");
                }}
              >
                Add resource
              </Button>
            </div>
          </div>
        )}
        <div className="mt-3 space-y-2">
          {assets.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between gap-2 rounded-card border border-line bg-panel px-3 py-2"
            >
              <div className="min-w-0">
                <span className="text-[13px] font-medium text-ink">{a.name}</span>
                <span className="ml-2 font-mono text-[11px] text-ink-faint">
                  {a.type} · ×{a.quantity}
                </span>
              </div>
              {canEdit && (
                <button
                  onClick={() => {
                    removeAsset(a.id);
                    toast("Resource removed");
                  }}
                  title="Remove"
                  className="text-ink-faint transition-colors hover:text-red"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// --- AI roster import -------------------------------------------------------

function ImportTab() {
  const { importRoster, resetRoster } = useStaff();
  const { toast } = usePrefs();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result ?? ""));
    reader.onerror = () => setError("Could not read that file.");
    reader.readAsText(file);
  }

  async function parse() {
    if (!text.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/roster", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Request failed (${res.status})`);
      }
      const data = await res.json();
      const n = importRoster(data.entries ?? []);
      toast(`Imported ${n} roster ${n === 1 ? "entry" : "entries"}`, "success");
      setText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-5">
      <div className="text-sm font-semibold text-ink">Import roster (AI)</div>
      <p className="mt-1 text-[13px] text-ink-soft">
        Paste rows from the staff-planning spreadsheet (staff names, day headers
        and shift times). The assistant reads the layout — including Dutch
        labels like <span className="font-mono">Vakantie</span>,{" "}
        <span className="font-mono">Vrij</span>,{" "}
        <span className="font-mono">Ziek</span> — and adds them to the roster.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={10}
        placeholder={`e.g.\n\tMon Jul 6\tTue Jul 7\tWed Jul 8\nLotte\t08:30-17:00\t10:00-18:30\tVakantie\nMaud\tx\t8:00-15:00\tZiek`}
        className="mt-3 w-full rounded-md border border-line-strong bg-white px-3 py-2 font-mono text-[12px] leading-relaxed text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button onClick={parse} disabled={busy || !text.trim()}>
          <IconSparkles width={15} height={15} />
          {busy ? "Reading roster…" : "Parse with AI"}
        </Button>
        <label className="cursor-pointer rounded-xl border border-line-strong bg-white px-3 py-1.5 text-[12px] text-ink-soft transition-colors hover:border-primary/40 hover:text-ink">
          Upload .csv
          <input
            type="file"
            accept=".csv,text/csv,text/plain"
            onChange={onCsvFile}
            className="hidden"
          />
        </label>
        <a
          href="/staff-roster-sample.csv"
          download
          className="rounded-xl px-3 py-1.5 text-[12px] text-primary transition-colors hover:bg-primary-soft"
        >
          Download sample .csv
        </a>
        <button
          onClick={() => {
            resetRoster();
            toast("Roster reset to sample data");
          }}
          className="rounded-xl px-3 py-1.5 text-[12px] text-ink-faint transition-colors hover:text-primary"
        >
          ↺ Reset to sample
        </button>
      </div>
      {error && (
        <p className="mt-3 text-[12px] text-red">
          <span className="font-mono font-semibold uppercase">AI unavailable · </span>
          {error}
        </p>
      )}
    </Card>
  );
}

// --- small helpers ----------------------------------------------------------

const selectCls =
  "w-full rounded-md border border-line-strong bg-white px-2.5 py-1.5 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/30";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] text-ink-soft">{label}</span>
      {children}
    </label>
  );
}
