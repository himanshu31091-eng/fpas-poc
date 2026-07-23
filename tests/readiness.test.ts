import { describe, it, expect } from "vitest";
import { evaluateReadiness, IMPORT_SEQUENCE } from "@/lib/importSequence";
import type { ComplianceFacts } from "@/lib/types";

const facts = (o: Partial<ComplianceFacts> = {}): ComplianceFacts => ({
  bookingCreated: false,
  oktfPrepared: false,
  hcDraftReceived: false,
  hcEndorsedByNVWA: false,
  inspectionTimeRequested: false,
  scopePreRegistration: false,
  gdbSentToCustoms: false,
  offloadingListCreated: false,
  ...o,
});

describe("compliance · evaluateReadiness (the differentiator)", () => {
  it("includes the OKTF (horses-only) step for horse shipments, excludes it otherwise", () => {
    const horse = evaluateReadiness(facts(), true);
    const nonHorse = evaluateReadiness(facts(), false);
    expect(horse.length).toBe(IMPORT_SEQUENCE.length); // 8
    expect(nonHorse.length).toBe(IMPORT_SEQUENCE.length - 1); // OKTF dropped
    expect(horse.some((i) => i.factKey === "oktfPrepared")).toBe(true);
    expect(nonHorse.some((i) => i.factKey === "oktfPrepared")).toBe(false);
  });

  it("marks every step outstanding when no facts are satisfied", () => {
    const items = evaluateReadiness(facts(), true);
    expect(items.every((i) => i.status === "outstanding")).toBe(true);
  });

  it("sorts outstanding before satisfied, and critical before routine", () => {
    // Everything satisfied except two: one critical (HC endorsement), one routine (offloading list).
    const items = evaluateReadiness(
      facts({
        bookingCreated: true,
        oktfPrepared: true,
        hcDraftReceived: true,
        inspectionTimeRequested: true,
        scopePreRegistration: true,
        gdbSentToCustoms: true,
      }),
      true
    );
    const outstanding = items.filter((i) => i.status === "outstanding");
    // Outstanding items come first
    const firstSatisfied = items.findIndex((i) => i.status === "satisfied");
    const lastOutstanding = items.map((i) => i.status).lastIndexOf("outstanding");
    expect(lastOutstanding).toBeLessThan(firstSatisfied);
    // Critical (NVWA endorsement) ranks above routine (offloading list)
    expect(outstanding[0].factKey).toBe("hcEndorsedByNVWA");
  });

  it("treats NVWA endorsement as its own critical step (not the received HC)", () => {
    const rule = IMPORT_SEQUENCE.find((r) => r.factKey === "hcEndorsedByNVWA");
    expect(rule?.urgency).toBe("critical");
    // HC received but not NVWA-endorsed → endorsement still outstanding.
    const items = evaluateReadiness(facts({ hcDraftReceived: true }), false);
    const endorsement = items.find((i) => i.factKey === "hcEndorsedByNVWA");
    expect(endorsement?.status).toBe("outstanding");
  });
});
