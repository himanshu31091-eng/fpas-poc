import { describe, it, expect } from "vitest";
import { requiredCrew, movementsOn, seedJobs, jobStatus, openCount } from "@/lib/jobs";
import type { Job } from "@/lib/types";

const mk = (o: { id?: string; deletedAt?: string; booking?: unknown }) =>
  ({ id: o.id ?? "j", deletedAt: o.deletedAt, booking: o.booking ?? null } as unknown as Job);

describe("jobs · requiredCrew", () => {
  it("is the baseline of 2 with no movements", () => {
    expect(requiredCrew([], "2026-07-20")).toBe(2);
  });

  it("adds ceil(count/3)+1 for a horse export", () => {
    const jobs = [mk({ booking: { arrivalDate: "2026-07-20", jobType: "export", isHorses: true, animalCount: "6", commodity: "Live horses" } })];
    expect(requiredCrew(jobs, "2026-07-20")).toBe(5); // 2 + (ceil(6/3)+1) = 2 + 3
  });

  it("adds 2 for a horse import; ignores other dates and deleted jobs", () => {
    const jobs = [
      mk({ booking: { arrivalDate: "2026-07-20", jobType: "import", isHorses: true, animalCount: "3", commodity: "Horses" } }),
      mk({ booking: { arrivalDate: "2026-07-21", jobType: "import", isHorses: true, animalCount: "3", commodity: "Horses" } }),
      mk({ deletedAt: "x", booking: { arrivalDate: "2026-07-20", jobType: "import", isHorses: true, animalCount: "3", commodity: "Horses" } }),
    ];
    expect(requiredCrew(jobs, "2026-07-20")).toBe(4); // 2 + 2
  });

  it("adds 1 for a non-horse shipment", () => {
    const jobs = [mk({ booking: { arrivalDate: "2026-07-20", jobType: "import", isHorses: false, animalCount: "40", commodity: "Ornamental fish" } })];
    expect(requiredCrew(jobs, "2026-07-20")).toBe(3);
  });
});

describe("jobs · movementsOn", () => {
  it("filters by arrival date and excludes deleted", () => {
    const jobs = [
      mk({ id: "a", booking: { arrivalDate: "2026-07-20" } }),
      mk({ id: "b", booking: { arrivalDate: "2026-07-21" } }),
      mk({ id: "c", deletedAt: "x", booking: { arrivalDate: "2026-07-20" } }),
    ];
    expect(movementsOn(jobs, "2026-07-20").map((j) => j.id)).toEqual(["a"]);
  });
});

describe("jobs · seed invariants", () => {
  const jobs = seedJobs();
  it("seeds four jobs", () => expect(jobs.length).toBe(4));
  it("every job has a valid derived status and non-negative open count", () => {
    for (const j of jobs) {
      expect(["new", "extracted", "in_progress", "ready"]).toContain(jobStatus(j));
      expect(openCount(j)).toBeGreaterThanOrEqual(0);
    }
  });
});
