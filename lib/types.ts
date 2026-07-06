// ---------------------------------------------------------------------------
// FPAS POC — shared domain types
// ---------------------------------------------------------------------------

export type Confidence = "high" | "medium" | "low";

/** A single field extracted from an agent email/PDF. */
export interface ExtractedField {
  key: string;
  label: string;
  value: string;
  confidence: Confidence;
  /** Short quote / location in the source the value was drawn from. */
  sourceHint?: string;
}

/** Result of the AI extraction step. */
export interface ExtractionResult {
  fields: ExtractedField[];
  /** Regulatory facts the model could infer from the message text. */
  inferredFacts: Partial<ComplianceFacts>;
  notes?: string;
}

/** An inbound agent message in the intake inbox (mock). */
export interface AgentEmail {
  id: string;
  from: string;
  agent: string;
  subject: string;
  receivedAt: string;
  attachment?: string;
  body: string;
  /** Difficulty label shown in the demo so you can pick the right sample. */
  flavour: "clean" | "messy" | "incomplete";
}

/**
 * Boolean regulatory facts for an Amsterdam import job.
 * These map 1:1 to the readiness checks in importSequence.ts.
 */
export interface ComplianceFacts {
  bookingCreated: boolean;
  oktfPrepared: boolean;
  hcDraftReceived: boolean;
  hcEndorsedByNVWA: boolean;
  inspectionTimeRequested: boolean;
  scopePreRegistration: boolean;
  gdbSentToCustoms: boolean;
  offloadingListCreated: boolean;
}

/** Evidence captured when a regulatory step is marked done (audit trail). */
export interface StepEvidence {
  /** Reference the step is proven by — e.g. NVWA approval no., GDB number. */
  reference?: string;
  note?: string;
  /** Who marked the step done. */
  markedBy: string;
  /** ISO timestamp of when it was marked. */
  markedAt: string;
}

/** Import (into the BIP) or Export (out to an airline). Drives conditional fields. */
export type JobType = "import" | "export";

/** One line of an export load plan (per stall). */
export interface LoadPlanRow {
  id: string;
  stall: string;
  animalId?: string;
  gender?: string;
  weightKg?: string;
  notes?: string;
}

/** Record of a load plan sent to an airline (mock send). */
export interface AirlineSubmission {
  airline: string;
  recipients: string[];
  body: string;
  sentAt: string;
  sentBy: string;
}

export type SubmissionStatus = "outstanding" | "drafted" | "submitted";

/** A regulatory notification/submission across the shipment lifecycle. */
export interface RegSubmission {
  status: SubmissionStatus;
  /** AI-drafted notification text. */
  notice?: string;
  reference?: string;
  submittedAt?: string;
  submittedBy?: string;
}

/** The confirmed booking after human validation. */
export interface Booking {
  awb: string;
  shippingAgent: string;
  commodity: string;
  isHorses: boolean;
  jobType: JobType;
  animalCount: string;
  flight: string;
  origin: string;
  arrivalDate: string;
  arrivalTime: string;
  /** Import-only: government vet inspection time. */
  govtVetInspectionTime: string;
  /** Export-only: warehouse arrival time. */
  warehouseArrivalTime?: string;
  specialCargo: string;
  facts: ComplianceFacts;
  /** Evidence per satisfied step, keyed by ComplianceFacts key. */
  evidence?: Partial<Record<keyof ComplianceFacts, StepEvidence>>;
  /** Export-only: the load plan (stall / gender / weight). */
  loadPlan?: LoadPlanRow[];
  /** Export-only: record of the load plan sent to the airline. */
  airlineSubmission?: AirlineSubmission;
  /** Regulatory submissions/notifications keyed by a stable step id. */
  submissions?: Record<string, RegSubmission>;
  /** Latest AI-drafted movement update to the customer/agent. */
  customerUpdate?: {
    body: string;
    draftedAt: string;
    sentAt?: string;
    sentBy?: string;
  };
}

/**
 * A booked horse shipment pushed from Flight Manager, awaiting FPAS ops
 * review/acceptance. Not yet a Job until accepted.
 */
export interface FlightManagerLead {
  id: string;
  flight: string;
  carrier: string;
  commodity: string;
  isHorses: boolean;
  animalCount: string;
  origin: string;
  arrivalDate: string;
  arrivalTime: string;
  horses?: { name: string; gender: string; weightKg: string }[];
  receivedAt: string;
}

export type Urgency = "critical" | "soon" | "routine";

/** One outstanding item returned by the readiness reasoning step. */
export interface ReadinessItem {
  id: string;
  /** Which ComplianceFacts key, if resolved, clears this item. */
  factKey: keyof ComplianceFacts;
  title: string;
  justification: string;
  urgency: Urgency;
  status: "satisfied" | "outstanding";
}

export interface ReadinessResult {
  items: ReadinessItem[];
  summary: string;
  clearedForArrival: boolean;
}

/** A drafted operational document. */
export interface DraftArtifact {
  id: string;
  title: string;
  filename: string;
  body: string;
}

/**
 * A single import job — one shipment tracked through its whole lifecycle.
 * This is the unit the Job Manager lists, opens, edits and deletes. Everything
 * the demo used to hold as one global flow now lives on a Job, so the app can
 * hold many shipments at once and persist them to localStorage.
 */
export interface Job {
  id: string;
  createdAt: string;
  updatedAt: string;
  /** Set when the job is moved to the bin (soft delete). */
  deletedAt?: string;
  /** Where the job originated: a sample email, pasted text, manual, enquiry, or Flight Manager. */
  source: {
    emailId?: string;
    email?: AgentEmail;
    text?: string;
    /** Uploaded PDF: filename for display + base64 data for (re-)extraction. */
    pdf?: { filename: string; data: string };
    manual?: boolean;
    enquiry?: { customerName?: string; contactEmail?: string; phone?: string };
    flightManager?: boolean;
  };
  extraction: ExtractionResult | null;
  /** Ops staff member this job is assigned to (demo). */
  assignee?: string;
  /** The confirmed booking (carries its own ComplianceFacts). */
  booking: Booking | null;
  /** The AI-reasoned readiness briefing. The rail itself is derived from facts. */
  readiness: ReadinessResult | null;
  artifacts: DraftArtifact[] | null;
}

/**
 * Derived lifecycle status for a job. Never stored — always computed from the
 * job's own data so the dashboard is correct without any AI call.
 */
export type JobStatus = "new" | "extracted" | "in_progress" | "ready";
