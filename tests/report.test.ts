import { describe, it, expect } from "vitest";
import { buildReport, reportSheets } from "@/lib/report";
import { DEFAULT_FACTS } from "@/lib/jobs";
import type { Job, Booking, ComplianceFacts } from "@/lib/types";

const facts = (o: Partial<ComplianceFacts> = {}): ComplianceFacts => ({ ...DEFAULT_FACTS, ...o });
const bk = (o: Partial<Booking>): Booking => ({
  awb: "1", shippingAgent: "A", commodity: "Live horses", isHorses: true, jobType: "import",
  animalCount: "4", flight: "EK1", origin: "DXB", arrivalDate: "", arrivalTime: "",
  govtVetInspectionTime: "", specialCargo: "", facts: facts(), ...o,
});
const job = (o: Partial<Job>): Job =>
  ({ id: Math.random().toString(), createdAt: "", updatedAt: "", source: {}, extraction: null, booking: null, readiness: null, artifacts: null, ...o } as Job);

describe("report · buildReport", () => {
  const now = new Date("2026-07-24T00:00:00");
  const readyHorse = job({
    booking: bk({
      commodity: "Live horses", isHorses: true, arrivalDate: "2026-07-24", arrivalTime: "06:00",
      facts: facts({ bookingCreated: true, oktfPrepared: true, hcDraftReceived: true, hcEndorsedByNVWA: true, inspectionTimeRequested: true, scopePreRegistration: true, gdbSentToCustoms: true, offloadingListCreated: true }),
    }),
  });
  const inProgFish = job({ booking: bk({ commodity: "Ornamental fish", isHorses: false, arrivalDate: "2026-08-10" }) });
  const brandNew = job({});
  const deleted = job({ deletedAt: "2026-07-20", booking: bk({}) });

  const m = buildReport([readyHorse, inProgFish, brandNew, deleted], now);

  it("counts only live jobs and classifies status", () => {
    expect(m.totals.total).toBe(3); // deleted excluded
    expect(m.totals.booked).toBe(2);
    expect(m.totals.ready).toBe(1);
    expect(m.totals.inProgress).toBe(1);
    expect(m.totals.brandNew).toBe(1);
  });

  it("counts arrivals within 48h and commodity mix", () => {
    expect(m.totals.arriving48).toBe(1); // only the 07-24 horse
    expect(m.totals.horses).toBe(1);
    expect(m.totals.other).toBe(1);
    expect(m.totals.onTimePct).toBe(50); // 1 ready of 2 booked
  });

  it("emits per-job rows and outstanding-step rows", () => {
    expect(m.jobs.length).toBe(3);
    expect(m.steps.length).toBeGreaterThan(0); // the fish import has open steps
  });

  it("reportSheets produces at least one sheet", () => {
    expect(reportSheets(m).length).toBeGreaterThan(0);
  });
});
