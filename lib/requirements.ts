// ---------------------------------------------------------------------------
// Requirements traceability — encoded from the MoreYeahs "Requirements &
// Traceability Document" for the FPAS Amsterdam Import POC. Rendered in-app so
// the running POC reports its own coverage against the brief.
//
// Statuses and origins mirror that document verbatim. The "Beyond the brief"
// section lists enhancements added on top of the documented requirements.
// ---------------------------------------------------------------------------

export type ReqStatus =
  | "built"
  | "simulated"
  | "not-built"
  | "future"
  | "partial"
  | "met"
  | "by-design"
  | "open";

export type ReqOrigin = "Client-stated" | "Recommended" | "Derived";

export interface Req {
  id: string;
  text: string;
  origin: ReqOrigin;
  src?: string;
  status: ReqStatus;
  /** Optional: where it's shown in the app, or how the POC exceeds the ask. */
  note?: string;
}

export interface ReqSection {
  key: string;
  title: string;
  blurb?: string;
  items: Req[];
}

export const STATUS_META: Record<ReqStatus, { label: string; cls: string }> = {
  built: { label: "Built", cls: "bg-green-soft text-green" },
  simulated: { label: "Simulated", cls: "bg-amber-soft text-amber" },
  "not-built": { label: "Not built", cls: "bg-red-soft text-red" },
  future: { label: "Future", cls: "bg-bg text-ink-faint" },
  partial: { label: "Partial", cls: "bg-cyan/10 text-cyan" },
  met: { label: "Met", cls: "bg-green-soft text-green" },
  "by-design": { label: "By design", cls: "bg-primary-soft text-primary" },
  open: { label: "Open", cls: "bg-amber-soft text-amber" },
};

export const FUNCTIONAL: ReqSection = {
  key: "functional",
  title: "Functional requirements",
  blurb:
    "The Amsterdam import slice, end to end. Origin and source trace to the requirements document (S1–S5, O1–O4).",
  items: [
    { id: "FR-01", text: "Multi-mode job intake: agent email, PDF upload, pasted text, website enquiry, CSV import, and manual entry.", origin: "Client-stated", src: "S1", status: "built", note: "New booking → six intake modes." },
    { id: "FR-02", text: "AI extraction of shipment fields from unstructured input, flagging low-confidence values rather than guessing.", origin: "Client-stated", src: "S1, O2", status: "built", note: "Job → Extraction." },
    { id: "FR-03", text: "Human validation gate: the operator reviews and confirms extracted details before a job is created.", origin: "Recommended", status: "built" },
    { id: "FR-04", text: "Import vs Export job types with conditional fields (Import → vet inspection time; Export → warehouse arrival time).", origin: "Client-stated", src: "S1", status: "built" },
    { id: "FR-05", text: "Commodity auto-fill from job type; horse shipments follow the OKTF path.", origin: "Client-stated", src: "S1", status: "built" },
    { id: "FR-06", text: "Shipping agent selected from a contacts list.", origin: "Client-stated", src: "S1", status: "built" },
    { id: "FR-07", text: "Reset a shipment's status back to “New”.", origin: "Client-stated", src: "S1", status: "not-built" },
    { id: "FR-08", text: "Compliance-readiness gate encoding the Amsterdam import sequence, reporting in plain language what is outstanding, why, and how urgent.", origin: "Recommended", src: "S2", status: "built", note: "Job → Readiness. Core differentiator." },
    { id: "FR-09", text: "Evidence and audit trail per step: who marked it done, when, and the reference; a reference is required on critical steps.", origin: "Derived", src: "S2", status: "built" },
    { id: "FR-10", text: "Distinguish a Dutch-authority (NVWA) endorsement from an origin-country vet endorsement; only the former satisfies that step.", origin: "Recommended", src: "S2", status: "built" },
    { id: "FR-11", text: "Export load plan capturing stall numbers, weights and genders.", origin: "Client-stated", src: "S1, S4", status: "built", note: "Job → Load plan." },
    { id: "FR-12", text: "AI-drafted airline load list, delivered to the carrier's addresses.", origin: "Client-stated", src: "S1", status: "simulated", note: "Mock send — no email leaves the demo." },
    { id: "FR-13", text: "Regulatory submissions tracker: AI-drafted notices, recorded as submitted with a reference.", origin: "Client-stated", src: "S2", status: "simulated" },
    { id: "FR-14", text: "AI-drafted operational documents — offloading list and delivery note — marked DRAFT for human approval.", origin: "Client-stated", src: "S2", status: "built", note: "Job → Documents." },
    { id: "FR-15", text: "AI-drafted customer movement updates.", origin: "Client-stated", src: "S1", status: "built" },
    { id: "FR-16", text: "Cross-operation assistant (ask questions across jobs) and an AI daily briefing.", origin: "Recommended", src: "O2", status: "built", note: "Copilot + dashboard briefing (now weather-aware)." },
    { id: "FR-17", text: "CSV import to bring existing shipment spreadsheets in as jobs.", origin: "Recommended", src: "S1", status: "built" },
    { id: "FR-18", text: "Inbound shipments from Flight Manager surfaced as pending, for the operator to accept into a job.", origin: "Client-stated", src: "S1", status: "simulated" },
    { id: "FR-19", text: "Operational dashboard: jobs list, calendar, insights and a bin (soft-delete).", origin: "Derived", status: "built", note: "Extended: List / Board / Grid views + exportable Report." },
    { id: "FR-20", text: "Per-job timeline and a printable job pack.", origin: "Derived", status: "built" },
    { id: "FR-21", text: "Role-based access (Admin / Operations / Viewer).", origin: "Derived", src: "S1", status: "simulated", note: "Role chosen at sign-in; gates editing." },
  ],
};

export const INTEGRATION: ReqSection = {
  key: "integration",
  title: "Integration requirements",
  blurb:
    "Every external integration is simulated or future in the POC — no live system is connected; nothing is sent to any external party.",
  items: [
    { id: "IR-01", text: "Flight Manager — inbound flight and horse details create a pending shipment.", origin: "Client-stated", status: "simulated" },
    { id: "IR-02", text: "NetSuite — invoicing (accounts receivable / payable).", origin: "Client-stated", status: "future" },
    { id: "IR-03", text: "Regulatory systems — submission to the Dutch authority, pre-registration and customs.", origin: "Client-stated", status: "future" },
    { id: "IR-04", text: "Partner systems — airport ground handler and airline load-list delivery.", origin: "Client-stated", status: "future" },
    { id: "IR-05", text: "Customer portal — website enquiry and booking-email intake.", origin: "Client-stated", status: "partial" },
  ],
};

export const NON_FUNCTIONAL: ReqSection = {
  key: "nonfunctional",
  title: "Non-functional requirements & constraints",
  items: [
    { id: "NFR-01", text: "Preserve the existing business processes; modernise the tooling around them, not the workflow itself.", origin: "Client-stated", status: "met" },
    { id: "NFR-02", text: "Human-in-the-loop for all AI output; no autonomous submission to any regulator or airline.", origin: "Recommended", status: "met" },
    { id: "NFR-03", text: "Cloud-native and deployable to the client's preferred cloud.", origin: "Recommended", status: "by-design" },
    { id: "NFR-04", text: "Capable of extension to other sites (Melbourne, New Zealand, Chicago).", origin: "Derived", status: "future" },
    { id: "NFR-05", text: "Confirm EU data-residency requirements for Amsterdam data.", origin: "Derived", status: "open" },
    { id: "NFR-06", text: "Deliver a working POC within days.", origin: "Client-stated", status: "met" },
  ],
};

/** Enhancements added on top of the documented requirements. */
export const BEYOND: ReqSection = {
  key: "beyond",
  title: "Beyond the brief",
  blurb:
    "Enhancements MoreYeahs added on top of the documented requirements, to deepen the demo and the domain fit.",
  items: [
    { id: "EX-01", text: "List / Board (Kanban) / Grid layouts for the jobs view.", origin: "Recommended", status: "built" },
    { id: "EX-02", text: "Create a job directly from the Kanban board (quick-create) — plus a link to the full intake.", origin: "Recommended", status: "built" },
    { id: "EX-03", text: "Operations Report with export to Excel (.xlsx) and PDF.", origin: "Recommended", status: "built" },
    { id: "EX-04", text: "Live arrival-day weather at Amsterdam Schiphol with a welfare flag (heat/cold) — fed into the AI briefing.", origin: "Recommended", status: "built", note: "Domain fit: temperature embargoes & animal welfare." },
    { id: "EX-05", text: "“Simulated” markers across the app, reinforcing the Built / Simulated / Future boundary.", origin: "Recommended", status: "built" },
    { id: "EX-06", text: "This in-app Requirements & Traceability view.", origin: "Recommended", status: "built" },
    { id: "EX-07", text: "Additional sample intake emails (cattle, companion animals, CITES birds).", origin: "Recommended", status: "built" },
    { id: "EX-08", text: "Staff planning: weekly roster/availability board, leave request-and-approve calendar, AI import of the planning spreadsheet, and per-shipment staff assignment.", origin: "Client-stated", status: "built", note: "From the FPAS Amsterdam staff-planning spreadsheet." },
  ],
};

export const SECTIONS: ReqSection[] = [FUNCTIONAL, INTEGRATION, NON_FUNCTIONAL, BEYOND];

/** Count items by status within a section (for the coverage summary). */
export function statusCounts(items: Req[]): Record<ReqStatus, number> {
  const counts = {
    built: 0,
    simulated: 0,
    "not-built": 0,
    future: 0,
    partial: 0,
    met: 0,
    "by-design": 0,
    open: 0,
  } as Record<ReqStatus, number>;
  for (const it of items) counts[it.status]++;
  return counts;
}
