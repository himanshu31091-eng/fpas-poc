"use client";

import { useMemo, useState } from "react";
import { useStaff } from "./staffStore";
import { usePrefs } from "./prefs";
import { Button, Card, Eyebrow, BrandLoader } from "./ui";
import { IconSparkles, IconChevronLeft, IconDownload } from "./icons";
import { downloadXlsx } from "@/lib/xlsx";
import {
  STATUS_META,
  LEAVE_TYPE_LABEL,
  DOW_LABELS,
  ASSET_TYPES,
  mondayOf,
  addDays,
  weekDates,
  dateStr,
  statusOnDate,
  type RosterEntry,
  type LeaveType,
  type ShiftStatus,
  type AssetType,
} from "@/lib/staff";

type Tab = "roster" | "leave" | "resources" | "import";

const TABS: { id: Tab; label: string }[] = [
  { id: "roster", label: "Roster" },
  { id: "leave", label: "Leave" },
  { id: "resources", label: "Resources" },
  { id: "import", label: "Import" },
];

export function Staffing() {
  const staff = useStaff();
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
          <Eyebrow>Staff planning</Eyebrow>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">
            Roster &amp; availability
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Who&apos;s working, off, on leave or sick — and who&apos;s free to
            cover a shipment. (Demo data, stored in your browser.)
          </p>
        </div>
      </header>

      <div className="mb-5 flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${
              tab === t.id
                ? "bg-brand text-white shadow-glow"
                : "border border-line bg-white text-ink-soft hover:border-primary/40 hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div key={tab} className="animate-fade-up">
        {tab === "roster" && <RosterTab />}
        {tab === "leave" && <LeaveTab />}
        {tab === "resources" && <ResourcesTab />}
        {tab === "import" && <ImportTab />}
      </div>
    </div>
  );
}

// --- Roster board + coverage Q&A -------------------------------------------

function RosterTab() {
  const { roster, leave, team } = useStaff();
  const [mode, setMode] = useState<"week" | "month">("week");
  const [anchor, setAnchor] = useState<Date>(() => new Date());
  const todayStr = dateStr(new Date());

  const days = useMemo(() => {
    if (mode === "week") return weekDates(mondayOf(anchor));
    const y = anchor.getFullYear();
    const m = anchor.getMonth();
    const n = new Date(y, m + 1, 0).getDate();
    return Array.from({ length: n }, (_, i) => new Date(y, m, i + 1));
  }, [mode, anchor]);

  const avail = useMemo(
    () =>
      days.map((d) => {
        const ds = dateStr(d);
        return team.filter((s) => {
          const st = statusOnDate(s, ds, roster, leave);
          return !st || st.status === "working" || st.status === "training";
        }).length;
      }),
    [days, roster, leave]
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
    const rows = team.map((s) => [s, ...days.map((d) => cellText(s, d))]);
    const availRow = ["Available", ...avail.map((n) => n)];
    downloadXlsx(`FPAS-roster-${dateStr(days[0])}`, [
      {
        name: mode === "week" ? "Roster (week)" : "Roster (month)",
        rows: [header, ...rows, availRow],
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

  return (
    <div className="space-y-4">
      <CoverageCard weekStart={mondayOf(anchor)} />
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
                  <td className="sticky left-0 z-10 bg-panel px-2 py-1.5 font-medium text-ink">
                    {s}
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
  st: RosterEntry | { status: ShiftStatus } | null;
  compact?: boolean;
}) {
  if (!st) return <span className="text-ink-faint">·</span>;
  const meta = STATUS_META[st.status];
  const working = st.status === "working";
  const start = "start" in st ? st.start : undefined;
  const full = working
    ? start
      ? `${start}–${"end" in st && st.end ? st.end : ""}`
      : "Working"
    : meta.label;
  const display = compact
    ? working
      ? start ?? "W"
      : meta.label[0]
    : working
    ? full
    : meta.label;
  return (
    <span
      className={`inline-block w-full truncate rounded-md px-1 py-1 font-mono ${
        compact ? "text-[10px]" : "text-[11px]"
      } ${meta.cell}`}
      title={"note" in st && st.note ? `${full} · ${st.note}` : full}
    >
      {display}
    </span>
  );
}

function AddShift() {
  const { upsertRosterEntry, team } = useStaff();
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
                <option key={s}>{s}</option>
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
        <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-bg/60 px-3 py-2.5 font-body text-[13px] leading-relaxed text-ink">
          {answer}
        </pre>
      )}
    </Card>
  );
}

// --- Leave requests + calendar ---------------------------------------------

const STATUS_BADGE: Record<string, string> = {
  requested: "bg-amber-soft text-amber",
  approved: "bg-green-soft text-green",
  declined: "bg-red-soft text-red",
};

function LeaveTab() {
  const { leave, requestLeave, decideLeave, team } = useStaff();
  const { canEdit, user, toast } = usePrefs();

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
                <option key={s}>{s}</option>
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
        </div>
      </Card>

      {/* Requests list */}
      <Card className="p-4">
        <div className="mb-3 text-sm font-semibold text-ink">
          Leave requests ({leave.length})
        </div>
        {sorted.length === 0 ? (
          <p className="text-[13px] text-ink-soft">No leave requests yet.</p>
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
                      {l.staff}
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
                {canEdit && l.status === "requested" && (
                  <div className="flex shrink-0 items-center gap-2">
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
                  </div>
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
  const { team, assets, addStaff, removeStaff, addAsset, removeAsset } =
    useStaff();
  const { canEdit, toast } = usePrefs();
  const [name, setName] = useState("");
  const [asset, setAsset] = useState({
    name: "",
    type: ASSET_TYPES[0],
    quantity: 1,
  });

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Team / people */}
      <Card className="p-5">
        <div className="text-sm font-semibold text-ink">Team ({team.length})</div>
        <p className="mt-1 text-[12px] text-ink-soft">
          People who appear on the roster and can be assigned to shipments.
        </p>
        {canEdit && (
          <div className="mt-3 flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim()) {
                  addStaff(name);
                  setName("");
                  toast("Staff added", "success");
                }
              }}
              placeholder="Add a staff member…"
              className={selectCls}
            />
            <Button
              onClick={() => {
                if (!name.trim()) return;
                addStaff(name);
                setName("");
                toast("Staff added", "success");
              }}
            >
              Add
            </Button>
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {team.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-1 text-[12px] text-ink-soft"
            >
              {s}
              {canEdit && (
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
              )}
            </span>
          ))}
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
