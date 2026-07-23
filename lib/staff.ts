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

/** Roles a resource can hold (lightweight — for display/filtering). */
export const STAFF_ROLES = [
  "Coordinator",
  "Groom",
  "Loadmaster",
  "Driver",
  "Vet liaison",
  "Warehouse",
  "Admin",
];

/** A recurring weekly shift pattern — the "roster plan" for a person. */
export interface ShiftPattern {
  start: string; // HH:MM
  end: string; // HH:MM
  /** Weekday indices worked, 0 = Monday … 6 = Sunday. */
  days: number[];
}

/**
 * Lightweight person profile, keyed by the staff name (the join key used across
 * roster/leave/staffing). Additive: the name string remains the identity, so
 * existing data keeps working; this just carries a display name, role and the
 * default shift pattern.
 */
export interface StaffProfile {
  name: string;
  fullName?: string;
  role?: string;
  shift?: ShiftPattern;
}

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

/** Staff (and equipment) assigned to a shipment (job), for its handling day. */
export interface StaffingAssignment {
  jobId: string;
  needed: number;
  assigned: string[];
  /** Asset IDs assigned to this shipment. */
  assets?: string[];
  note?: string;
}

/** A bookable, non-staff resource (equipment / facility). */
export type AssetType =
  | "Truck"
  | "Crate"
  | "Stall"
  | "Inspection bay"
  | "Cold storage"
  | "Other";

export const ASSET_TYPES: AssetType[] = [
  "Truck",
  "Crate",
  "Stall",
  "Inspection bay",
  "Cold storage",
  "Other",
];

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  quantity: number;
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

function withinLeave(req: LeaveRequest, date: string): boolean {
  return date >= req.startDate && date <= req.endDate;
}
function approvedLeaveCovers(req: LeaveRequest, date: string): boolean {
  return req.status === "approved" && withinLeave(req, date);
}

/** A resolved day cell: a roster entry, a synthesised status, or nothing. */
export type DayStatus =
  | (RosterEntry & { pending?: boolean })
  | { status: ShiftStatus; pending?: boolean };

/**
 * Effective status for a staff member on a date. Approved leave wins outright;
 * a still-*requested* leave shows as a pending marker over a working/off day so
 * the roster chart reflects it the moment it's submitted (before approval).
 */
export function statusOnDate(
  staff: string,
  date: string,
  roster: RosterEntry[],
  leave: LeaveRequest[]
): DayStatus | null {
  const approved = leave.find(
    (l) => l.staff === staff && approvedLeaveCovers(l, date)
  );
  if (approved) return { status: approved.type === "sick" ? "sick" : "leave" };

  const entry = roster.find((r) => r.staff === staff && r.date === date);

  const requested = leave.find(
    (l) => l.staff === staff && l.status === "requested" && withinLeave(l, date)
  );
  if (requested && (!entry || entry.status === "working" || entry.status === "off")) {
    return {
      status: requested.type === "sick" ? "sick" : "leave",
      pending: true,
    };
  }
  return entry ?? null;
}

/**
 * Staff available on a date — not on approved leave, and either free or
 * rostered working/training. Pending (unapproved) leave does NOT remove them
 * from availability; it only shows on the chart until it's approved.
 */
export function availableStaff(
  members: string[],
  date: string,
  roster: RosterEntry[],
  leave: LeaveRequest[]
): string[] {
  return members.filter((s) => {
    if (leave.some((l) => l.staff === s && approvedLeaveCovers(l, date))) {
      return false;
    }
    const entry = roster.find((r) => r.staff === s && r.date === date);
    if (!entry) return true; // no entry → free to be rostered
    return entry.status === "working" || entry.status === "training";
  });
}

/**
 * Prepare imported roster entries: canonicalise each staff name against the
 * current team (case-insensitive) so variants land on the right row, and report
 * any genuinely new names so the caller can add them to the team.
 */
export function planRosterImport<T extends { staff: string }>(
  entries: T[],
  team: string[]
): { normalized: T[]; newNames: string[] } {
  const canon = new Map(team.map((s) => [s.toLowerCase(), s]));
  const newNames: string[] = [];
  const normalized = entries.map((e) => {
    const raw = (e.staff ?? "").trim();
    const lc = raw.toLowerCase();
    let name = canon.get(lc);
    if (!name) {
      name = raw;
      canon.set(lc, raw);
      if (raw) newNames.push(raw);
    }
    return { ...e, staff: name };
  });
  return { normalized, newNames };
}

/** Build working roster entries from a shift pattern, over `weeks` from a Monday. */
export function entriesFromPattern(
  staff: string,
  monday: Date,
  pattern: ShiftPattern,
  weeks = 1
): Omit<RosterEntry, "id">[] {
  const out: Omit<RosterEntry, "id">[] = [];
  for (let d = 0; d < 7 * weeks; d++) {
    if (!pattern.days.includes(d % 7)) continue;
    out.push({
      staff,
      date: dateStr(addDays(monday, d)),
      status: "working",
      start: pattern.start,
      end: pattern.end,
    });
  }
  return out;
}

// --- Persistence ------------------------------------------------------------

const ROSTER_KEY = "fpas.roster.v2";
const LEAVE_KEY = "fpas.leave.v2";
const STAFFING_KEY = "fpas.staffing.v3";

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

const TEAM_KEY = "fpas.team.v1";
const ASSETS_KEY = "fpas.assets.v1";
const PROFILES_KEY = "fpas.profiles.v1";
export const loadTeam = () => load<string[]>(TEAM_KEY);
export const saveTeam = (v: string[]) => save(TEAM_KEY, v);
export const loadAssets = () => load<Asset[]>(ASSETS_KEY);
export const saveAssets = (v: Asset[]) => save(ASSETS_KEY, v);
export const loadProfiles = () => load<Record<string, StaffProfile>>(PROFILES_KEY);
export const saveProfiles = (v: Record<string, StaffProfile>) => save(PROFILES_KEY, v);

/** Display name for a staff key — the full name if we have one, else the key. */
export function displayName(
  name: string,
  profiles?: Record<string, StaffProfile> | null
): string {
  return profiles?.[name]?.fullName?.trim() || name;
}

/** Seed profiles (full names + roles + a Mon–Fri default shift) for the team. */
export function seedProfiles(): Record<string, StaffProfile> {
  const defs: [string, string, string][] = [
    ["Lotte", "Lotte van Dijk", "Coordinator"],
    ["Dominique", "Dominique Bakker", "Loadmaster"],
    ["Maud", "Maud de Vries", "Groom"],
    ["Esther", "Esther Jansen", "Vet liaison"],
    ["Maya", "Maya Visser", "Groom"],
    ["Bart", "Bart Willems", "Driver"],
    ["Chiara", "Chiara Rossi", "Groom"],
    ["Kelly", "Kelly Smit", "Warehouse"],
    ["Juliette", "Juliette Dubois", "Groom"],
    ["Jamie", "Jamie O'Connor", "Driver"],
    ["Jobair", "Jobair Rahman", "Warehouse"],
  ];
  const out: Record<string, StaffProfile> = {};
  defs.forEach(([name, fullName, role], i) => {
    const [start, end] = SHIFTS[i % SHIFTS.length];
    out[name] = { name, fullName, role, shift: { start, end, days: [0, 1, 2, 3, 4] } };
  });
  return out;
}

export function seedAssets(): Asset[] {
  return [
    { id: "as-1", name: "Livestock truck 1", type: "Truck", quantity: 1 },
    { id: "as-2", name: "Livestock truck 2", type: "Truck", quantity: 1 },
    { id: "as-3", name: "Horse stalls", type: "Stall", quantity: 8 },
    { id: "as-4", name: "IATA crates (large)", type: "Crate", quantity: 12 },
    { id: "as-5", name: "Inspection bay A", type: "Inspection bay", quantity: 1 },
    { id: "as-6", name: "Cold storage unit", type: "Cold storage", quantity: 2 },
  ];
}

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
      // Weekends: about half the team is scheduled on a rotation.
      if (dow >= 5 && (si + Math.floor(d / 7)) % 2 !== 0) continue;
      let status: ShiftStatus = "working";
      if (si === 2 && d <= 1) status = "leave"; // Maud on leave to start
      else if (si === 3 && d === 2) status = "sick"; // Esther sick Wed
      else if (si === 6 && d >= 7) status = "leave"; // Chiara leave next week
      else if (si === 4 && d === 9) status = "training"; // Maya training
      else if (key % 13 === 0 && dow < 5) status = "off";
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

/** Sample shipment-staffing (seed jobs job-1 = horse import, job-2 = companion). */
export function seedStaffing(): StaffingAssignment[] {
  return [
    // Short of staff → amber chip (2 of 3).
    { jobId: "job-1", needed: 3, assigned: ["Lotte", "Maya"], assets: ["as-1", "as-3"] },
    // Fully staffed → green chip (2 of 2).
    { jobId: "job-2", needed: 2, assigned: ["Dominique", "Bart"], assets: ["as-4"] },
  ];
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
