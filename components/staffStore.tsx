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
  loadTeam,
  saveTeam,
  loadAssets,
  saveAssets,
  STAFF_MEMBERS,
  type RosterEntry,
  type LeaveRequest,
  type LeaveType,
  type LeaveStatus,
  type StaffingAssignment,
  type Asset,
  type AssetType,
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

  addStaff: (name: string) => void;
  removeStaff: (name: string) => void;
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
  const rosterRef = useRef(roster);
  rosterRef.current = roster;

  useEffect(() => {
    const now = new Date();
    setRoster(loadRoster() ?? seedRoster(now));
    setLeave(loadLeave() ?? seedLeave(now));
    setStaffing(loadStaffing() ?? seedStaffing());
    setTeam(loadTeam() ?? STAFF_MEMBERS);
    setAssets(loadAssets() ?? seedAssets());
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

  const value = useMemo<StaffState>(
    () => ({
      hydrated,
      roster,
      leave,
      staffing,
      team,
      assets,

      addStaff: (name) => {
        const n = name.trim();
        if (!n) return;
        setTeam((prev) => (prev.includes(n) ? prev : [...prev, n]));
      },
      removeStaff: (name) => setTeam((prev) => prev.filter((s) => s !== name)),
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

      importRoster: (entries) => {
        if (!entries.length) return 0;
        setRoster((prev) => {
          const map = new Map(prev.map((r) => [`${r.staff}|${r.date}`, r]));
          for (const e of entries) {
            const key = `${e.staff}|${e.date}`;
            map.set(key, { ...e, id: map.get(key)?.id ?? uid("r") });
          }
          return Array.from(map.values());
        });
        return entries.length;
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
      },

      getStaffing: (jobId) => staffing.find((s) => s.jobId === jobId),
      setStaffing: (a) =>
        setStaffing((prev) => {
          const others = prev.filter((s) => s.jobId !== a.jobId);
          return [...others, a];
        }),
    }),
    [hydrated, roster, leave, staffing, team, assets]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStaff(): StaffState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStaff must be used within StaffProvider");
  return ctx;
}
