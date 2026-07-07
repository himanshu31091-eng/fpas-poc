// ---------------------------------------------------------------------------
// Staff planning / rostering — data model, seed, helpers, persistence.
//
// Mirrors the FPAS Amsterdam staff-availability spreadsheet: a weekly grid of
// who is working (with shift times), off, on leave, sick, or on a public
// holiday. Adds a leave request/approve flow and per-shipment staffing, plus
// helpers to compute who is available on a given day. Client-side only
// (localStorage), in the same spirit as lib/jobs.ts.
// ---------------------------------------------------------------------------

/** FPAS Amsterdam floor staff (from the roster spreadsheet). */
export const STAFF_MEMBERS = [
  "Lotte",
  "Dominique",
  "Maud",
  "Esther",
  "Maya",
  "Bart",
  "Chiara",
  "Kelly",
  "Juliette",
  "Jamie",
  "Jobair",
];

export type ShiftStatus =
  | "working"
  | "off"
  | "leave"
  | "sick"
  | "holiday"
  | "training";

export interface RosterEntry {
  id: string;
  staff: string;
  date: string; // YYYY-MM-DD
  status: ShiftStatus;
  start?: string; // HH:MM (working)
  end?: string;
  note?: string;
}

export type LeaveType = "vacation" | "off" | "sick";
export type LeaveStatus = "requested" | "approved" | "declined";

export interface LeaveRequest {
  id: string;
  staff: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD (inclusive)
  type: LeaveType;
  status: LeaveStatus;
  note?: string;
  requestedAt: string;
  decidedBy?: string;
  decidedAt?: string;
}

/** Staff assigned to a shipment (job), for its arrival/handling day. */
export interface StaffingAssignment {
  jobId: string;
  needed: number;
  assigned: string[];
  note?: string;
}

export const STATUS_META: Record<
  ShiftStatus,
  { label: string; cell: string; dot: string }
> = {
  working: { label: "Working", cell: "bg-green-soft text-green", dot: "bg-green" },
  off: { label: "Off", cell: "bg-bg text-ink-faint", dot: "bg-ink-faint" },
  leave: { label: "Leave", cell: "bg-amber-soft text-amber", dot: "bg-amber" },
  sick: { label: "Sick", cell: "bg-red-soft text-red", dot: "bg-red" },
  holiday: { label: "Holiday", cell: "bg-primary-soft text-primary", dot: "bg-primary" },
  training: { label: "Training", cell: "bg-cyan/10 text-cyan", dot: "bg-cyan" },
};

export const LEAVE_TYPE_LABEL: Record<LeaveType, string> = {
  vacation: "Vacation",
  off: "Day off",
  sick: "Sick",
};

// --- Date helpers -----------------------------------------------------------

export function dateStr(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

/** Monday of the week containing d (weeks run Mon–Sun, like the spreadsheet). */
export function mondayOf(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  const dow = (c.getDay() + 6) % 7; // 0 = Monday
  c.setDate(c.getDate() - dow);
  return c;
}

export function weekDates(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export const DOW_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function leaveCovers(req: LeaveRequest, date: string): boolean {
  return (
    req.status === "approved" && date >= req.startDate && date <= req.endDate
  );
}

/** Effective status for a staff member on a date (approved leave wins). */
export function statusOnDate(
  staff: string,
  date: string,
  roster: RosterEntry[],
  leave: LeaveRequest[]
): RosterEntry | { status: ShiftStatus } | null {
  const lv = leave.find((l) => l.staff === staff && leaveCovers(l, date));
  if (lv) return { status: lv.type === "sick" ? "sick" : "leave" };
  const entry = roster.find((r) => r.staff === staff && r.date === date);
  return entry ?? null;
}

/** Staff available on a date — not on leave / sick / off / holiday. */
export function availableStaff(
  date: string,
  roster: RosterEntry[],
  leave: LeaveRequest[]
): string[] {
  return STAFF_MEMBERS.filter((s) => {
    const st = statusOnDate(s, date, roster, leave);
    if (!st) return true; // no entry → free to be rostered
    return st.status === "working" || st.status === "training";
  });
}

// --- Persistence ------------------------------------------------------------

const ROSTER_KEY = "fpas.roster.v1";
const LEAVE_KEY = "fpas.leave.v1";
const STAFFING_KEY = "fpas.staffing.v1";

function load<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function save<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* non-fatal */
  }
}

export const loadRoster = () => load<RosterEntry[]>(ROSTER_KEY);
export const saveRoster = (v: RosterEntry[]) => save(ROSTER_KEY, v);
export const loadLeave = () => load<LeaveRequest[]>(LEAVE_KEY);
export const saveLeave = (v: LeaveRequest[]) => save(LEAVE_KEY, v);
export const loadStaffing = () => load<StaffingAssignment[]>(STAFFING_KEY);
export const saveStaffing = (v: StaffingAssignment[]) => save(STAFFING_KEY, v);

// --- Seed data --------------------------------------------------------------
// Deterministic roster around the current week so the board is always relevant
// on first run. Demo data — not an AI fallback.

const SHIFTS = [
  ["07:00", "16:00"],
  ["08:30", "17:30"],
  ["09:00", "18:00"],
  ["10:00", "19:00"],
  ["13:00", "22:00"],
  ["06:30", "15:00"],
];

export function seedRoster(today: Date): RosterEntry[] {
  const monday = mondayOf(today);
  const out: RosterEntry[] = [];
  STAFF_MEMBERS.forEach((staff, si) => {
    for (let d = 0; d < 14; d++) {
      const date = dateStr(addDays(monday, d));
      const dow = d % 7; // 0 = Mon
      const key = si * 31 + d;
      // Weekends: most staff blank (not scheduled).
      if (dow >= 5 && (si + d) % 3 !== 0) continue;
      let status: ShiftStatus = "working";
      if (si === 2 && d <= 1) status = "leave"; // Maud on leave to start
      else if (si === 3 && d === 2) status = "sick"; // Esther sick Wed
      else if (si === 6 && d >= 7) status = "leave"; // Chiara leave next week
      else if (key % 11 === 0 && dow < 5) status = "off";
      const [start, end] = SHIFTS[(si + d) % SHIFTS.length];
      out.push({
        id: `seed-${staff}-${date}`,
        staff,
        date,
        status,
        ...(status === "working" ? { start, end } : {}),
      });
    }
  });
  return out;
}

export function seedLeave(today: Date): LeaveRequest[] {
  const monday = mondayOf(today);
  const iso = (d: number) => dateStr(addDays(monday, d));
  return [
    {
      id: "lv-seed-1",
      staff: "Maud",
      startDate: iso(0),
      endDate: iso(1),
      type: "vacation",
      status: "approved",
      note: "Pre-booked",
      requestedAt: new Date(monday).toISOString(),
      decidedBy: "Planning",
      decidedAt: new Date(monday).toISOString(),
    },
    {
      id: "lv-seed-2",
      staff: "Chiara",
      startDate: iso(7),
      endDate: iso(13),
      type: "vacation",
      status: "approved",
      requestedAt: new Date(monday).toISOString(),
      decidedBy: "Planning",
      decidedAt: new Date(monday).toISOString(),
    },
    {
      id: "lv-seed-3",
      staff: "Maya",
      startDate: iso(3),
      endDate: iso(4),
      type: "vacation",
      status: "requested",
      note: "Long weekend",
      requestedAt: new Date(monday).toISOString(),
    },
  ];
}
