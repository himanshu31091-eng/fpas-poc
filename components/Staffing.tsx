"use client";

import { useMemo, useState } from "react";
import { useStaff } from "./staffStore";
import { usePrefs } from "./prefs";
import { Button, Card, Eyebrow, BrandLoader } from "./ui";
import { IconSparkles, IconChevronLeft } from "./icons";
import {
  STAFF_MEMBERS,
  STATUS_META,
  LEAVE_TYPE_LABEL,
  DOW_LABELS,
  mondayOf,
  addDays,
  weekDates,
  dateStr,
  statusOnDate,
  type RosterEntry,
  type LeaveType,
  type ShiftStatus,
} from "@/lib/staff";

type Tab = "roster" | "leave" | "import";

const TABS: { id: Tab; label: string }[] = [
  { id: "roster", label: "Roster" },
  { id: "leave", label: "Leave" },
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
        {tab === "import" && <ImportTab />}
      </div>
    </div>
  );
}

// --- Roster board + coverage Q&A -------------------------------------------

function RosterTab() {
  const { roster, leave } = useStaff();
  const [weekStart, setWeekStart] = useState<Date>(() => mondayOf(new Date()));
  const days = useMemo(() => weekDates(weekStart), [weekStart]);
  const todayStr = dateStr(new Date());

  const avail = useMemo(
    () =>
      days.map((d) => {
        const ds = dateStr(d);
        return STAFF_MEMBERS.filter((s) => {
          const st = statusOnDate(s, ds, roster, leave);
          return !st || st.status === "working" || st.status === "training";
        }).length;
      }),
    [days, roster, leave]
  );

  return (
    <div className="space-y-4">
      <CoverageCard weekStart={weekStart} />

      <Card className="p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-semibold text-ink">
            Week of{" "}
            {weekStart.toLocaleDateString(undefined, {
              day: "numeric",
              month: "short",
            })}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setWeekStart((w) => addDays(w, -7))}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink-soft hover:bg-bg"
              title="Previous week"
            >
              <IconChevronLeft width={16} height={16} />
            </button>
            <button
              onClick={() => setWeekStart(mondayOf(new Date()))}
              className="rounded-lg border border-line px-2.5 py-1.5 text-[12px] text-ink-soft hover:bg-bg"
            >
              This week
            </button>
            <button
              onClick={() => setWeekStart((w) => addDays(w, 7))}
              className="flex h-8 w-8 rotate-180 items-center justify-center rounded-lg border border-line text-ink-soft hover:bg-bg"
              title="Next week"
            >
              <IconChevronLeft width={16} height={16} />
            </button>
          </div>
        </div>

        <div className="-mx-1 overflow-x-auto px-1">
          <table className="w-full min-w-[760px] border-collapse text-[12px]">
            <thead>
              <tr>
                <th className="w-28 px-2 py-2 text-left font-medium text-ink-faint">
                  Staff
                </th>
                {days.map((d, i) => {
                  const ds = dateStr(d);
                  const isToday = ds === todayStr;
                  return (
                    <th
                      key={ds}
                      className={`px-2 py-2 text-center font-medium ${
                        isToday ? "text-primary" : "text-ink-faint"
                      }`}
                    >
                      <div>{DOW_LABELS[i]}</div>
                      <div className="font-mono text-[10px]">
                        {d.getDate()}/{d.getMonth() + 1}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {STAFF_MEMBERS.map((s) => (
                <tr key={s} className="border-t border-line">
                  <td className="px-2 py-1.5 font-medium text-ink">{s}</td>
                  {days.map((d) => {
                    const ds = dateStr(d);
                    const st = statusOnDate(s, ds, roster, leave);
                    return (
                      <td key={ds} className="px-1 py-1 text-center">
                        <RosterCell st={st} />
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="border-t border-line-strong">
                <td className="px-2 py-1.5 font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                  Available
                </td>
                {avail.map((n, i) => (
                  <td
                    key={i}
                    className="px-1 py-1.5 text-center font-mono text-[12px] font-semibold text-ink"
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
}: {
  st: RosterEntry | { status: ShiftStatus } | null;
}) {
  if (!st) return <span className="text-ink-faint">·</span>;
  const meta = STATUS_META[st.status];
  const times =
    "start" in st && st.start ? `${st.start}–${st.end ?? ""}` : meta.label;
  return (
    <span
      className={`inline-block w-full truncate rounded-md px-1.5 py-1 font-mono text-[11px] ${meta.cell}`}
      title={"note" in st && st.note ? st.note : meta.label}
    >
      {st.status === "working" ? times : meta.label}
    </span>
  );
}

function CoverageCard({ weekStart }: { weekStart: Date }) {
  const { roster, leave } = useStaff();
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function context(): string {
    const lines = weekDates(weekStart).map((d, i) => {
      const ds = dateStr(d);
      const working: string[] = [];
      const away: string[] = [];
      for (const s of STAFF_MEMBERS) {
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
  const { leave, requestLeave, decideLeave } = useStaff();
  const { canEdit, user, toast } = usePrefs();

  const today = dateStr(new Date());
  const [form, setForm] = useState({
    staff: STAFF_MEMBERS[0],
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
              {STAFF_MEMBERS.map((s) => (
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

// --- AI roster import -------------------------------------------------------

function ImportTab() {
  const { importRoster, resetRoster } = useStaff();
  const { toast } = usePrefs();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
