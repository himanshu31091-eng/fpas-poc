import { describe, it, expect } from "vitest";
import {
  statusOnDate,
  availableStaff,
  entriesFromPattern,
  planRosterImport,
  displayName,
  dateStr,
  type RosterEntry,
  type LeaveRequest,
  type StaffProfile,
} from "@/lib/staff";
import { placeAnimal, seedUnits, type HousingUnit } from "@/lib/housing";

const roster = (o: Partial<RosterEntry>): RosterEntry => ({
  id: "r", staff: "Ann", date: "2026-07-24", status: "working", start: "09:00", end: "17:00", ...o,
});
const leave = (o: Partial<LeaveRequest>): LeaveRequest => ({
  id: "l", staff: "Ann", startDate: "2026-07-24", endDate: "2026-07-24", type: "vacation",
  status: "requested", requestedAt: "", ...o,
});

describe("staff · statusOnDate leave visibility", () => {
  it("shows a requested leave as pending over a working day", () => {
    const st = statusOnDate("Ann", "2026-07-24", [roster({})], [leave({ status: "requested" })]);
    expect(st?.status).toBe("leave");
    expect((st as { pending?: boolean }).pending).toBe(true);
  });

  it("shows approved leave as solid (not pending)", () => {
    const st = statusOnDate("Ann", "2026-07-24", [roster({})], [leave({ status: "approved" })]);
    expect(st?.status).toBe("leave");
    expect((st as { pending?: boolean }).pending).toBeUndefined();
  });

  it("a plain working day has no leave marker", () => {
    const st = statusOnDate("Ann", "2026-07-24", [roster({})], []);
    expect(st?.status).toBe("working");
  });
});

describe("staff · availableStaff", () => {
  it("approved leave removes availability; requested leave does not", () => {
    const r = [roster({})];
    expect(availableStaff(["Ann"], "2026-07-24", r, [leave({ status: "approved" })])).toEqual([]);
    expect(availableStaff(["Ann"], "2026-07-24", r, [leave({ status: "requested" })])).toEqual(["Ann"]);
  });
});

describe("staff · entriesFromPattern (roster plan)", () => {
  it("creates working entries only on the pattern's weekdays", () => {
    const monday = new Date("2026-07-20T00:00:00"); // a Monday
    const entries = entriesFromPattern("Ann", monday, { start: "06:00", end: "14:00", days: [0, 2, 4] }, 1);
    expect(entries).toHaveLength(3); // Mon, Wed, Fri
    expect(entries.every((e) => e.status === "working" && e.start === "06:00")).toBe(true);
    expect(entries.map((e) => e.date)).toEqual(["2026-07-20", "2026-07-22", "2026-07-24"]);
  });

  it("spans multiple weeks", () => {
    const monday = new Date("2026-07-20T00:00:00");
    const entries = entriesFromPattern("Ann", monday, { start: "09:00", end: "17:00", days: [0] }, 2);
    expect(entries.map((e) => e.date)).toEqual(["2026-07-20", "2026-07-27"]);
  });
});

describe("staff · planRosterImport (import → roster row)", () => {
  const team = ["Lotte", "Himanshu pandey"];

  it("canonicalises a case/spelling variant onto the existing team member", () => {
    const { normalized, newNames } = planRosterImport(
      [{ staff: "Himanshu Pandey", date: "2026-07-25", status: "leave" }],
      team
    );
    expect(normalized[0].staff).toBe("Himanshu pandey"); // matched existing row
    expect(newNames).toEqual([]);
  });

  it("keeps a genuinely new person and reports them as new", () => {
    const { normalized, newNames } = planRosterImport(
      [{ staff: "Nieuwe Persoon", date: "2026-07-25", status: "working" }],
      team
    );
    expect(normalized[0].staff).toBe("Nieuwe Persoon");
    expect(newNames).toEqual(["Nieuwe Persoon"]);
  });

  it("does not report the same new name twice", () => {
    const { newNames } = planRosterImport(
      [
        { staff: "Sam", date: "2026-07-25", status: "working" },
        { staff: "sam", date: "2026-07-26", status: "off" },
      ],
      team
    );
    expect(newNames).toEqual(["Sam"]);
  });
});

describe("staff · displayName", () => {
  const profiles: Record<string, StaffProfile> = { Ann: { name: "Ann", fullName: "Ann Jansen" } };
  it("prefers the full name, falls back to the key", () => {
    expect(displayName("Ann", profiles)).toBe("Ann Jansen");
    expect(displayName("Bob", profiles)).toBe("Bob");
    expect(displayName("Ann", null)).toBe("Ann");
  });
});

describe("housing · placeAnimal (animal → housing link)", () => {
  const base: HousingUnit[] = [
    { id: "A", zone: "Z", type: "Stable", species: "Horses", status: "Available", occupant: "", since: "" },
    { id: "B", zone: "Z", type: "Stable", species: "Horses", status: "Occupied", occupant: "Rex", animalId: "an-1", since: "2026-07-20" },
  ];

  it("places an animal into a free unit as Occupied with the link", () => {
    const next = placeAnimal(base, "A", { id: "an-9", name: "Bella" }, "2026-07-24");
    const a = next.find((u) => u.id === "A")!;
    expect(a.status).toBe("Occupied");
    expect(a.occupant).toBe("Bella");
    expect(a.animalId).toBe("an-9");
    expect(a.since).toBe("2026-07-24");
  });

  it("vacates any prior unit the same animal occupied (one place at a time)", () => {
    const next = placeAnimal(base, "A", { id: "an-1", name: "Rex" }, "2026-07-24");
    const b = next.find((u) => u.id === "B")!;
    expect(b.animalId).toBeUndefined();
    expect(b.occupant).toBe("");
    expect(b.status).toBe("Dirty");
  });

  it("the seed still parses (regression on the added field)", () => {
    expect(seedUnits().length).toBeGreaterThan(0);
  });
});
