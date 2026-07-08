import type {
  Booking,
  ComplianceFacts,
  FlightManagerLead,
  Job,
  JobStatus,
} from "./types";
import { evaluateReadiness } from "./importSequence";
import { AGENT_EMAILS } from "./mockData";

/**
 * Airline → load-plan recipient addresses (mock). Etihad requires the load plan
 * to go to six specific addresses (per the FPAS Amsterdam notes). All fictional.
 */
export const AIRLINE_RECIPIENTS: Record<string, string[]> = {
  Etihad: [
    "cargo.ops@etihad.example",
    "live.animals@etihad.example",
    "ams.station@etihad.example",
    "loadcontrol@etihad.example",
    "auh.hub@etihad.example",
    "special.cargo@etihad.example",
  ],
  Emirates: ["skycargo.ams@emirates.example", "live.animals@emirates.example"],
  "Qatar Airways": ["qrcargo.ams@qatarairways.example"],
  KLM: ["cargo.live@klm.example", "ams.ops@klm.example"],
};

export const AIRLINES = Object.keys(AIRLINE_RECIPIENTS);

// ---------------------------------------------------------------------------
// Job helpers + localStorage persistence.
//
// Status and the outstanding-step count are ALWAYS derived from a job's own
// booking facts via evaluateReadiness() — never from a stored AI result. This
// keeps the dashboard correct and fully usable offline (no API key required);
// only the reasoned narrative on the Readiness tab needs a live AI call.
// ---------------------------------------------------------------------------

const STORAGE_KEY = "fpas.jobs.v1";
const LEADS_KEY = "fpas.leads.v1";

export const DEFAULT_FACTS: ComplianceFacts = {
  bookingCreated: false,
  oktfPrepared: false,
  hcDraftReceived: false,
  hcEndorsedByNVWA: false,
  inspectionTimeRequested: false,
  scopePreRegistration: false,
  gdbSentToCustoms: false,
  offloadingListCreated: false,
};

/** Outstanding steps for a job (0 if no booking yet). Import vs export differ. */
export function openCount(job: Job): number {
  const b = job.booking;
  if (!b) return 0;
  if (b.jobType === "export") {
    // Export readiness: a load plan exists and it has been sent to the airline.
    let open = 0;
    if (!b.loadPlan || b.loadPlan.length === 0) open++;
    if (!b.airlineSubmission) open++;
    return open;
  }
  return evaluateReadiness(b.facts, b.isHorses).filter(
    (i) => i.status === "outstanding"
  ).length;
}

/** Derived lifecycle status — pure function of the job's own data. */
export function jobStatus(job: Job): JobStatus {
  if (!job.booking) return job.extraction ? "extracted" : "new";
  return openCount(job) === 0 ? "ready" : "in_progress";
}

export const STATUS_LABEL: Record<JobStatus, string> = {
  new: "New",
  extracted: "Needs review",
  in_progress: "In progress",
  ready: "Ready for arrival",
};

/** Best-effort AWB label for lists before a booking exists. */
export function jobAwb(job: Job): string {
  if (job.booking?.awb) return job.booking.awb;
  const f = job.extraction?.fields.find((x) => x.key === "awb");
  return f?.value || "—";
}

export function jobAgent(job: Job): string {
  if (job.booking?.shippingAgent) return job.booking.shippingAgent;
  const f = job.extraction?.fields.find((x) => x.key === "shippingAgent");
  return f?.value || job.source.email?.agent || "—";
}

export function jobCommodity(job: Job): string {
  if (job.booking?.commodity) return job.booking.commodity;
  const f = job.extraction?.fields.find((x) => x.key === "commodity");
  return f?.value || "—";
}

/**
 * Deterministic mock flight status (no live integration). Derived from the
 * flight number so it's stable across renders — most flights on time, a few
 * delayed / landed. Illustrates the Flight Manager link without a real feed.
 */
export type FlightState = "on_time" | "delayed" | "landed";

export function flightStatus(job: Job): {
  state: FlightState;
  label: string;
} | null {
  const flight = job.booking?.flight;
  if (!flight) return null;
  let h = 0;
  for (let i = 0; i < flight.length; i++) h = (h * 31 + flight.charCodeAt(i)) % 97;
  if (h % 7 === 0) return { state: "delayed", label: `delayed +${(h % 3) + 1}h` };
  if (h % 11 === 0) return { state: "landed", label: "landed" };
  return { state: "on_time", label: "on time" };
}

/** Hours until arrival, or null if no/invalid arrival date. Used for "arriving soon". */
export function hoursUntilArrival(job: Job, now: Date): number | null {
  const date = job.booking?.arrivalDate;
  if (!date) return null;
  const time = job.booking?.arrivalTime || "00:00";
  const parsed = new Date(`${date}T${time}`);
  if (Number.isNaN(parsed.getTime())) return null;
  return (parsed.getTime() - now.getTime()) / 3_600_000;
}

/** Compact plain-text summary of all jobs, for the AI copilot / briefing. */
export function jobsContext(jobs: Job[], now: Date): string {
  const lines = jobs.map((job) => {
    const b = job.booking;
    let blockers = "";
    if (b && b.jobType === "import") {
      blockers = evaluateReadiness(b.facts, b.isHorses)
        .filter((i) => i.status === "outstanding")
        .map((i) => i.title)
        .join("; ");
    } else if (b && b.jobType === "export") {
      blockers = b.airlineSubmission ? "" : "load list not sent to airline";
    }
    const h = hoursUntilArrival(job, now);
    return [
      `AWB ${jobAwb(job)}`,
      `type=${b?.jobType ?? "?"}`,
      `agent=${jobAgent(job)}`,
      `commodity=${jobCommodity(job)}`,
      `flight=${b?.flight ?? "-"}`,
      `arrival=${b?.arrivalDate ?? "-"} ${b?.arrivalTime ?? ""}`.trim(),
      h !== null ? `hoursToArrival=${Math.round(h)}` : "",
      `status=${jobStatus(job)}`,
      `openSteps=${openCount(job)}`,
      blockers ? `blockers=[${blockers}]` : "",
    ]
      .filter(Boolean)
      .join(" | ");
  });
  return `Today is ${now.toISOString().slice(0, 10)}.\nJobs (${jobs.length}):\n${lines.join("\n")}`;
}

// --- localStorage -----------------------------------------------------------

export function loadJobs(): Job[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Job[]) : null;
  } catch {
    return null;
  }
}

export function saveJobs(jobs: Job[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
  } catch {
    /* quota / private-mode — non-fatal for a POC */
  }
}

export function loadLeads(): FlightManagerLead[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LEADS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as FlightManagerLead[]) : null;
  } catch {
    return null;
  }
}

export function saveLeads(leads: FlightManagerLead[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
  } catch {
    /* non-fatal */
  }
}

/** Next unique job id, derived from existing ids (stable, no clock needed). */
export function nextJobId(jobs: Job[]): string {
  const max = jobs.reduce((m, j) => {
    const n = Number.parseInt(j.id.replace(/\D/g, ""), 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `job-${max + 1}`;
}

// --- Seed data --------------------------------------------------------------
// Deterministic sample jobs at different lifecycle stages so the dashboard is
// populated (and demoable offline) on first run. This is demo seed data — not
// an AI fallback — in the same spirit as lib/mockData.ts.

function facts(overrides: Partial<ComplianceFacts>): ComplianceFacts {
  return { ...DEFAULT_FACTS, ...overrides };
}

export function seedJobs(): Job[] {
  const email1 = AGENT_EMAILS.find((e) => e.id === "email-1");
  const email2 = AGENT_EMAILS.find((e) => e.id === "email-2");
  const email3 = AGENT_EMAILS.find((e) => e.id === "email-3");

  // Job 1 — horses, booked, mid-sequence (HC draft in, not yet NVWA-endorsed).
  const booking1: Booking = {
    awb: "176-44821905",
    shippingAgent: "AIR HORSE TRANSPORT",
    commodity: "Live horses",
    isHorses: true,
    jobType: "import",
    animalCount: "4",
    flight: "EK9021",
    origin: "DXB (Dubai)",
    arrivalDate: "2026-07-04",
    arrivalTime: "06:30",
    govtVetInspectionTime: "",
    specialCargo: "2 mares in foal; temperature-sensitive",
    facts: facts({
      bookingCreated: true,
      oktfPrepared: true,
      hcDraftReceived: true,
    }),
  };

  // Job 2 — companion animals, fully ready, artifacts already drafted.
  const booking2: Booking = {
    awb: "157-30021144",
    shippingAgent: "EQUITRANS",
    commodity: "Companion animals (dogs & cats)",
    isHorses: false,
    jobType: "import",
    animalCount: "18 (12 dogs, 6 cats)",
    flight: "QR273",
    origin: "DOH (Doha)",
    arrivalDate: "2026-07-06",
    arrivalTime: "07:15",
    govtVetInspectionTime: "09:30 (day of arrival)",
    specialCargo: "One crate flagged oversize",
    facts: facts({
      bookingCreated: true,
      hcDraftReceived: true,
      hcEndorsedByNVWA: true,
      inspectionTimeRequested: true,
      scopePreRegistration: true,
      gdbSentToCustoms: true,
      offloadingListCreated: true,
    }),
  };

  // Job 4 — horse EXPORT (Melbourne-style), load plan started, not yet sent.
  const booking4: Booking = {
    awb: "176-55120388",
    shippingAgent: "IRT AUS",
    commodity: "Live horses",
    isHorses: true,
    jobType: "export",
    animalCount: "3",
    flight: "EK9022",
    origin: "AMS",
    arrivalDate: "2026-07-08",
    arrivalTime: "",
    govtVetInspectionTime: "",
    warehouseArrivalTime: "05:30",
    specialCargo: "1 stallion — separate stall",
    facts: facts({ bookingCreated: true }),
    loadPlan: [
      { id: "lp-1", stall: "1", animalId: "Aramis", gender: "Gelding", weightKg: "548", contour: "L", tackbag: true, hc: true, pp: true },
      { id: "lp-2", stall: "1", animalId: "Bella", gender: "Mare", weightKg: "512", contour: "L", tackbag: true, hc: true, pp: false },
      { id: "lp-3", stall: "2", animalId: "Comet", gender: "Stallion", weightKg: "596", contour: "R", tackbag: false, hc: true, pp: true },
    ],
    grooms: [
      { name: "Kelly Prinsen", passport: "NL X4471820" },
      { name: "João Ferreira", passport: "PT 553219" },
    ],
    spx: { declaredBy: "", time: "", declared: false },
  };

  return [
    {
      id: "job-1",
      createdAt: "2026-07-02T08:20:00.000Z",
      updatedAt: "2026-07-02T08:20:00.000Z",
      source: { emailId: "email-1", email: email1 },
      extraction: null,
      booking: booking1,
      readiness: null,
      artifacts: null,
    },
    {
      id: "job-2",
      createdAt: "2026-07-02T09:50:00.000Z",
      updatedAt: "2026-07-02T09:50:00.000Z",
      source: { emailId: "email-2", email: email2 },
      extraction: null,
      booking: booking2,
      readiness: null,
      artifacts: null,
    },
    {
      id: "job-3",
      createdAt: "2026-07-02T10:10:00.000Z",
      updatedAt: "2026-07-02T10:10:00.000Z",
      source: { emailId: "email-3", email: email3 },
      extraction: null,
      booking: null,
      readiness: null,
      artifacts: null,
    },
    {
      id: "job-4",
      createdAt: "2026-07-02T11:00:00.000Z",
      updatedAt: "2026-07-02T11:00:00.000Z",
      source: { manual: true },
      extraction: null,
      booking: booking4,
      readiness: null,
      artifacts: null,
    },
  ];
}

/**
 * Mock Flight Manager feed — booked horse shipments transferred to FPAS with a
 * Pending status for ops to review/accept. All fictional.
 */
export function seedLeads(): FlightManagerLead[] {
  return [
    {
      id: "fm-1",
      flight: "EK9021",
      carrier: "Etihad",
      commodity: "Live horses",
      isHorses: true,
      animalCount: "6",
      origin: "DXB (Dubai)",
      arrivalDate: "2026-07-09",
      arrivalTime: "05:40",
      horses: [
        { name: "Zephyr", gender: "Gelding", weightKg: "560" },
        { name: "Maple", gender: "Mare", weightKg: "505" },
      ],
      receivedAt: "2026-07-03T06:15:00.000Z",
    },
    {
      id: "fm-2",
      flight: "QR273",
      carrier: "Qatar Airways",
      commodity: "Live horses",
      isHorses: true,
      animalCount: "2",
      origin: "DOH (Doha)",
      arrivalDate: "2026-07-10",
      arrivalTime: "07:20",
      horses: [{ name: "Onyx", gender: "Stallion", weightKg: "590" }],
      receivedAt: "2026-07-03T07:02:00.000Z",
    },
  ];
}
