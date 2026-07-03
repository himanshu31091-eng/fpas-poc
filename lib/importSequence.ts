import type { ComplianceFacts, ReadinessItem, Urgency } from "./types";

// ---------------------------------------------------------------------------
// The Amsterdam import regulatory sequence, encoded from the FPAS swimlane.
//
// This is the part of the POC that shows we understand FPAS's business rather
// than just parsing text. Each check corresponds to a real step from the
// import workflow (OKTF -> HC endorsement -> NVWA pre-approval -> inspection
// slot -> Scope pre-registration -> GDB to customs -> operational artifacts).
//
// The readiness API sends these definitions to the model as ground truth.
// The mock fallback evaluates them deterministically from the same rules,
// so the demo behaves identically with or without an API key.
// ---------------------------------------------------------------------------

export interface SequenceRule {
  factKey: keyof ComplianceFacts;
  title: string;
  /** Why this step matters, in ops language. Used by the model + mock. */
  justification: string;
  urgency: Urgency;
  /** Only applies to horse shipments (e.g. OKTF). */
  horsesOnly?: boolean;
}

export const IMPORT_SEQUENCE: SequenceRule[] = [
  {
    factKey: "bookingCreated",
    title: "Booking registered in Job Manager",
    justification:
      "The shipment must exist as a structured job before any regulatory step can be tracked against it.",
    urgency: "routine",
  },
  {
    factKey: "oktfPrepared",
    title: "OKTF prepared and HC cover sheet sent to NVWA",
    justification:
      "Mandatory for horses. The OKTF and health-certificate cover sheet must reach NVWA before pre-approval can begin.",
    urgency: "critical",
    horsesOnly: true,
  },
  {
    factKey: "hcDraftReceived",
    title: "Health certificate draft received from agent",
    justification:
      "The HC draft is the input to NVWA's document review. Without it, review cannot start.",
    urgency: "critical",
  },
  {
    factKey: "hcEndorsedByNVWA",
    title: "Health certificate pre-approved by NVWA (Dutch authority, not origin vet)",
    justification:
      "Only pre-approval by the NVWA — the Dutch competent authority — satisfies this step. An endorsement or signature by the origin-country vet or exporting authority does NOT count: that is the input to NVWA's review, not a substitute for it. The shipment cannot proceed to pre-registration until NVWA itself has pre-approved the health documents. A received-but-unendorsed HC, or one carrying only an origin-country endorsement, is the single most common pre-arrival blocker.",
    urgency: "critical",
  },
  {
    factKey: "inspectionTimeRequested",
    title: "Inspection slot requested (>2h after arrival, 1 day prior)",
    justification:
      "The Govt Vet inspection time must be requested at least one day before arrival and scheduled more than two hours after the flight lands. Miss the window and the animals wait on the ramp.",
    urgency: "soon",
  },
  {
    factKey: "scopePreRegistration",
    title: "Scope pre-registration made",
    justification:
      "All live-animal imports require a pre-registration in Scope before customs will act on the shipment.",
    urgency: "soon",
  },
  {
    factKey: "gdbSentToCustoms",
    title: "HC + GDB number sent to customs",
    justification:
      "Customs approves on the HC copy referenced by the GDB number ('d-controle'). This unblocks clearance on arrival.",
    urgency: "soon",
  },
  {
    factKey: "offloadingListCreated",
    title: "Offloading list + delivery note prepared",
    justification:
      "Warehouse and truck staff need the offloading list and delivery note ready before the aircraft arrives to prepare the planned space.",
    urgency: "routine",
  },
];

const URGENCY_ORDER: Record<Urgency, number> = {
  critical: 0,
  soon: 1,
  routine: 2,
};

/**
 * Deterministic readiness evaluation. Used as the mock-mode fallback and as a
 * sanity reference for the model's output.
 */
export function evaluateReadiness(
  facts: ComplianceFacts,
  isHorses: boolean
): ReadinessItem[] {
  const applicable = IMPORT_SEQUENCE.filter(
    (rule) => !rule.horsesOnly || isHorses
  );

  const items: ReadinessItem[] = applicable.map((rule) => ({
    id: rule.factKey,
    factKey: rule.factKey,
    title: rule.title,
    justification: rule.justification,
    urgency: rule.urgency,
    status: facts[rule.factKey] ? "satisfied" : "outstanding",
  }));

  // Outstanding first, then by urgency, so the coordinator sees the blocker.
  return items.sort((a, b) => {
    if (a.status !== b.status) return a.status === "outstanding" ? -1 : 1;
    return URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency];
  });
}
