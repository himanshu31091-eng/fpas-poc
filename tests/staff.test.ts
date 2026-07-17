import { describe, it, expect } from "vitest";
import { dateStr, mondayOf, weekDates, addDays, availableStaff, statusOnDate } from "@/lib/staff";
import type { RosterEntry, LeaveRequest } from "@/lib/staff";

describe("staff · date helpers", () => {
  it("dateStr formats YYYY-MM-DD (zero-padded)", () => {
    expect(dateStr(new Date(2026, 6, 5))).toBe("2026-07-05");
  });
  it("mondayOf returns the Monday of the week", () => {
    expect(mondayOf(new Date(2026, 6, 8)).getDay()).toBe(1); // Wed 8 Jul → Mon
  });
  it("weekDates returns 7 consecutive days", () => {
    const m = mondayOf(new Date(2026, 6, 8));
    const w = weekDates(m);
    expect(w.length).toBe(7);
    expect(dateStr(w[6])).toBe(dateStr(addDays(m, 6)));
  });
});

describe("staff · availability", () => {
  const roster: RosterEntry[] = [
    { id: "1", staff: "Lotte", date: "2026-07-20", status: "working", start: "08:00", end: "16:00" },
    { id: "2", staff: "Bart", date: "2026-07-20", status: "off" },
  ];
  const leave: LeaveRequest[] = [
    { id: "l1", staff: "Maud", startDate: "2026-07-19", endDate: "2026-07-21", type: "vacation", status: "approved", requestedAt: "" },
  ];

  it("working & unrostered staff are available; off & on-leave are not", () => {
    const avail = availableStaff(["Lotte", "Bart", "Maud", "Esther"], "2026-07-20", roster, leave).sort();
    expect(avail).toEqual(["Esther", "Lotte"]);
  });

  it("statusOnDate reflects an approved leave", () => {
    expect(statusOnDate("Maud", "2026-07-20", roster, leave)?.status).toBe("leave");
  });
});
