import { describe, it, expect } from "vitest";
import {
  jobStatus,
  openCount,
  hoursUntilArrival,
  flightStatus,
  jobAwb,
  jobAgent,
  jobCommodity,
  DEFAULT_FACTS,
} from "@/lib/jobs";
import type { Job, Booking, ComplianceFacts } from "@/lib/types";

const facts = (o: Partial<ComplianceFacts> = {}): ComplianceFacts => ({ ...DEFAULT_FACTS, ...o });

const importBooking = (o: Partial<Booking> = {}): Booking => ({
  awb: "176-1", shippingAgent: "AIR HORSE", commodity: "Live horses", isHorses: true,
  jobType: "import", animalCount: "4", flight: "EK9021", origin: "DXB",
  arrivalDate: "2026-07-24", arrivalTime: "06:00", govtVetInspectionTime: "", specialCargo: "",
  facts: facts(), ...o,
});
const exportBooking = (o: Partial<Booking> = {}): Booking => ({
  ...importBooking({ jobType: "export", commodity: "Live horses" }), ...o,
});
const job = (o: Partial<Job> = {}): Job =>
  ({ id: "j", createdAt: "", updatedAt: "", source: {}, extraction: null, booking: null, readiness: null, artifacts: null, ...o } as Job);

describe("jobs · derived status", () => {
  it("new when no booking and no extraction; extracted once extraction exists", () => {
    expect(jobStatus(job())).toBe("new");
    expect(jobStatus(job({ extraction: { fields: [], inferredFacts: {} } }))).toBe("extracted");
  });

  it("import job is in_progress with open steps, ready when all satisfied", () => {
    expect(jobStatus(job({ booking: importBooking() }))).toBe("in_progress");
    const allDone = importBooking({
      facts: facts({
        bookingCreated: true, oktfPrepared: true, hcDraftReceived: true, hcEndorsedByNVWA: true,
        inspectionTimeRequested: true, scopePreRegistration: true, gdbSentToCustoms: true, offloadingListCreated: true,
      }),
    });
    expect(jobStatus(job({ booking: allDone }))).toBe("ready");
  });

  it("export job needs a load plan AND an airline submission to be ready", () => {
    expect(openCount(job({ booking: exportBooking() }))).toBe(2); // no plan, no send
    const planned = exportBooking({ loadPlan: [{ id: "1", stall: "1" }] });
    expect(openCount(job({ booking: planned }))).toBe(1); // plan yes, send no
    const sent = exportBooking({
      loadPlan: [{ id: "1", stall: "1" }],
      airlineSubmission: { airline: "Etihad", recipients: [], body: "", sentAt: "", sentBy: "" },
    });
    expect(jobStatus(job({ booking: sent }))).toBe("ready");
  });
});

describe("jobs · helpers", () => {
  it("hoursUntilArrival computes hours vs a reference now; null without a date", () => {
    const now = new Date("2026-07-24T00:00:00");
    const j = job({ booking: importBooking({ arrivalDate: "2026-07-24", arrivalTime: "06:00" }) });
    expect(Math.round(hoursUntilArrival(j, now)!)).toBe(6);
    expect(hoursUntilArrival(job(), now)).toBeNull();
  });

  it("flightStatus is deterministic and null without a flight", () => {
    const a = flightStatus(job({ booking: importBooking({ flight: "EK9021" }) }));
    const b = flightStatus(job({ booking: importBooking({ flight: "EK9021" }) }));
    expect(a).toEqual(b);
    expect(["on_time", "delayed", "landed"]).toContain(a!.state);
    expect(flightStatus(job())).toBeNull();
  });

  it("label helpers fall back to extraction then em dash", () => {
    expect(jobAwb(job({ booking: importBooking({ awb: "176-9" }) }))).toBe("176-9");
    expect(jobAwb(job())).toBe("—");
    expect(jobAgent(job())).toBe("—");
    expect(jobCommodity(job({ booking: importBooking({ commodity: "Ornamental fish" }) }))).toBe("Ornamental fish");
  });
});
