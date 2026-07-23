"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  loadRoster,
  saveRoster,
  loadLeave,
  saveLeave,
  loadStaffing,
  saveStaffing,
  seedRoster,
  seedLeave,
  seedStaffing,
  seedAssets,
  seedProfiles,
  loadTeam,
  saveTeam,
  loadAssets,
  saveAssets,
  loadProfiles,
  saveProfiles,
  entriesFromPattern,
  planRosterImport,
  mondayOf,
  STAFF_MEMBERS,
  type RosterEntry,
  type LeaveRequest,
  type LeaveType,
  type LeaveStatus,
  type StaffingAssignment,
  type Asset,
  type AssetType,
  type StaffProfile,
  type ShiftPattern,
} from "@/lib/staff";

// ---------------------------------------------------------------------------
// Staff planning store: roster, leave requests, and per-shipment staffing.
// Persists to localStorage; seeds around the current week on first run.
// ---------------------------------------------------------------------------

interface StaffState {
  hydrated: boolean;
  roster: RosterEntry[];
  leave: LeaveRequest[];
  staffing: StaffingAssignment[];
  team: string[];
  assets: Asset[];
  profiles: Record<string, StaffProfile>;

  addStaff: (input: {
    name: string;
    fullName?: string;
    role?: string;
    shift?: ShiftPattern;
  }) => void;
  removeStaff: (name: string) => void;
  setProfile: (name: string, patch: Partial<StaffProfile>) => void;
  /** (Re)apply a person's saved shift pattern to the roster from this week. */
  applyShiftPattern: (name: string, weeks?: number) => void;
  addAsset: (a: { name: string; type: AssetType; quantity: number }) => void;
  removeAsset: (id: string) => void;

  requestLeave: (f: {
    staff: string;
    startDate: string;
    endDate: string;
    type: LeaveType;
    note?: string;
  }) => void;
  decideLeave: (id: string, status: LeaveStatus, by: string) => void;
  /** Remove a leave entirely (cancels it and reverts the roster). */
  removeLeave: (id: string) => void;
  importRoster: (entries: RosterEntry[]) => number;
  upsertRosterEntry: (entry: Omit<RosterEntry, "id">) => void;
  resetRoster: () => void;

  getStaffing: (jobId: string) => StaffingAssignment | undefined;
  setStaffing: (a: StaffingAssignment) => void;
}

const Ctx = createContext<StaffState | null>(null);

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(
    performance.now()
  ).toString(36)}`;
}

export function StaffProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [leave, setLeave] = useState<LeaveRequest[]>([]);
  const [staffing, setStaffing] = useState<StaffingAssignment[]>([]);
  const [team, setTeam] = useState<string[]>(STAFF_MEMBERS);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [profiles, setProfiles] = useState<Record<string, StaffProfile>>({});
  const rosterRef = useRef(roster);
  rosterRef.current = roster;

  useEffect(() => {
    const now = new Date();
    setRoster(loadRoster() ?? seedRoster(now));
    setLeave(loadLeave() ?? seedLeave(now));
    setStaffing(loadStaffing() ?? seedStaffing());
    setTeam(loadTeam() ?? STAFF_MEMBERS);
    setAssets(loadAssets() ?? seedAssets());
    setProfiles(loadProfiles() ?? seedProfiles());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveRoster(roster);
  }, [roster, hydrated]);
  useEffect(() => {
    if (hydrated) saveLeave(leave);
  }, [leave, hydrated]);
  useEffect(() => {
    if (hydrated) saveStaffing(staffing);
  }, [staffing, hydrated]);
  useEffect(() => {
    if (hydrated) saveTeam(team);
  }, [team, hydrated]);
  useEffect(() => {
    if (hydrated) saveAssets(assets);
  }, [assets, hydrated]);
  useEffect(() => {
    if (hydrated) saveProfiles(profiles);
  }, [profiles, hydrated]);

  const value = useMemo<StaffState>(
    () => ({
      hydrated,
      roster,
      leave,
      staffing,
      team,
      assets,
      profiles,

      addStaff: (input) => {
        const n = input.name.trim();
        if (!n) return;
        setTeam((prev) => (prev.includes(n) ? prev : [...prev, n]));
        setProfiles((prev) => ({
          ...prev,
          [n]: {
            name: n,
            fullName: input.fullName?.trim() || n,
            role: input.role,
            shift: input.shift,
          },
        }));
        // If a default shift was given, lay it onto the roster from this week.
        if (input.shift && input.shift.days.length) {
          const monday = mondayOf(new Date());
          const entries = entriesFromPattern(n, monday, input.shift, 2);
          setRoster((prev) => {
            const map = new Map(prev.map((r) => [`${r.staff}|${r.date}`, r]));
            for (const e of entries) {
              const key = `${e.staff}|${e.date}`;
              map.set(key, { ...e, id: map.get(key)?.id ?? uid("r") });
            }
            return Array.from(map.values());
          });
        }
      },
      removeStaff: (name) => {
        setTeam((prev) => prev.filter((s) => s !== name));
        setProfiles((prev) => {
          const next = { ...prev };
          delete next[name];
          return next;
        });
      },
      setProfile: (name, patch) =>
        setProfiles((prev) => ({
          ...prev,
          [name]: { ...prev[name], name, ...patch },
        })),
      applyShiftPattern: (name, weeks = 2) => {
        const pattern = profiles[name]?.shift;
        if (!pattern || !pattern.days.length) return;
        const monday = mondayOf(new Date());
        const entries = entriesFromPattern(name, monday, pattern, weeks);
        setRoster((prev) => {
          const map = new Map(prev.map((r) => [`${r.staff}|${r.date}`, r]));
          for (const e of entries) {
            const key = `${e.staff}|${e.date}`;
            map.set(key, { ...e, id: map.get(key)?.id ?? uid("r") });
          }
          return Array.from(map.values());
        });
      },
      addAsset: (a) => {
        const n = a.name.trim();
        if (!n) return;
        setAssets((prev) => [
          ...prev,
          { id: uid("as"), name: n, type: a.type, quantity: a.quantity },
        ]);
      },
      removeAsset: (id) => setAssets((prev) => prev.filter((x) => x.id !== id)),

      requestLeave: (f) => {
        setLeave((prev) => [
          {
            id: uid("lv"),
            staff: f.staff,
            startDate: f.startDate,
            endDate: f.endDate,
            type: f.type,
            status: "requested",
            note: f.note,
            requestedAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      },

      decideLeave: (id, status, by) => {
        setLeave((prev) =>
          prev.map((l) =>
            l.id === id
              ? { ...l, status, decidedBy: by, decidedAt: new Date().toISOString() }
              : l
          )
        );
      },

      removeLeave: (id) => setLeave((prev) => prev.filter((l) => l.id !== id)),

      importRoster: (entries) => {
        if (!entries.length) return 0;
        // Canonicalise each entry's staff name against the current team
        // (case-insensitive), so "Himanshu Pandey" lands on the existing
        // "Himanshu pandey" row. Any genuinely new name is added to the team
        // (and given a profile) so it gets a row — otherwise the entry would be
        // stored but invisible, since the grid only renders team members.
        const { normalized, newNames } = planRosterImport(entries, team);
        if (newNames.length) {
          setTeam((prev) => [
            ...prev,
            ...newNames.filter((n) => !prev.some((p) => p.toLowerCase() === n.toLowerCase())),
          ]);
          setProfiles((prev) => {
            const next = { ...prev };
            for (const n of newNames) if (!next[n]) next[n] = { name: n, fullName: n };
            return next;
          });
        }
        setRoster((prev) => {
          const map = new Map(prev.map((r) => [`${r.staff}|${r.date}`, r]));
          for (const e of normalized) {
            const key = `${e.staff}|${e.date}`;
            map.set(key, { ...e, id: map.get(key)?.id ?? uid("r") });
          }
          return Array.from(map.values());
        });
        return normalized.length;
      },

      upsertRosterEntry: (entry) => {
        setRoster((prev) => {
          const key = `${entry.staff}|${entry.date}`;
          const existing = prev.find((r) => `${r.staff}|${r.date}` === key);
          const next: RosterEntry = { ...entry, id: existing?.id ?? uid("r") };
          return [...prev.filter((r) => `${r.staff}|${r.date}` !== key), next];
        });
      },

      resetRoster: () => {
        const now = new Date();
        setRoster(seedRoster(now));
        setLeave(seedLeave(now));
        setStaffing(seedStaffing());
        setTeam(STAFF_MEMBERS);
        setAssets(seedAssets());
        setProfiles(seedProfiles());
      },

      getStaffing: (jobId) => staffing.find((s) => s.jobId === jobId),
      setStaffing: (a) =>
        setStaffing((prev) => {
          const others = prev.filter((s) => s.jobId !== a.jobId);
          return [...others, a];
        }),
    }),
    [hydrated, roster, leave, staffing, team, assets, profiles]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStaff(): StaffState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStaff must be used within StaffProvider");
  return ctx;
}

/** Compact "staff assigned" chip for job rows/cards/detail. Null when none. */
export function StaffingChip({
  jobId,
  className = "",
}: {
  jobId: string;
  className?: string;
}) {
  const { getStaffing } = useStaff();
  const sa = getStaffing(jobId);
  const assets = sa?.assets?.length ?? 0;
  if (!sa || (sa.needed === 0 && sa.assigned.length === 0 && assets === 0)) {
    return null;
  }
  const short = sa.assigned.length < sa.needed;
  return (
    <span
      title={`Staffing: ${sa.assigned.length}/${sa.needed} staff${
        assets ? `, ${assets} asset${assets === 1 ? "" : "s"}` : ""
      }`}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold ${
        short ? "bg-amber-soft text-amber" : "bg-green-soft text-green"
      } ${className}`}
    >
      <span aria-hidden>👥</span>
      {sa.assigned.length}/{sa.needed}
      {assets ? ` · ⚙${assets}` : ""}
    </span>
  );
}
