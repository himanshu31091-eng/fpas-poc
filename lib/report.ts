// ---------------------------------------------------------------------------
// Operations report model + Excel export.
//
// buildReport() derives a plain summary of the live jobs (the same aggregates
// the Insights view shows) plus per-job and outstanding-step tables. The same
// model feeds both the on-screen Report view and the .xlsx export, so the two
// never drift. Status and open-step counts come from the deterministic job
// helpers — no AI call needed.
// ---------------------------------------------------------------------------

import type { Job } from "./types";
import { evaluateReadiness } from "./importSequence";
import {
  STATUS_LABEL,
  flightStatus,
  hoursUntilArrival,
  jobAgent,
  jobAwb,
  jobCommodity,
  jobStatus,
  openCount,
} from "./jobs";
import { downloadXlsx, type CellValue, type Sheet } from "./xlsx";

export interface ReportJobRow {
  awb: string;
  type: string;
  agent: string;
  commodity: string;
  horses: string;
  animals: string;
  flight: string;
  origin: string;
  arrivalDate: string;
  arrivalTime: string;
  flightStatus: string;
  status: string;
  open: number;
  assignee: string;
}

export interface ReportStepRow {
  awb: string;
  agent: string;
  commodity: string;
  step: string;
  urgency: string;
}

export interface ReportTotals {
  total: number;
  booked: number;
  brandNew: number;
  needsReview: number;
  inProgress: number;
  ready: number;
  arriving48: number;
  onTimePct: number;
  horses: number;
  companion: number;
  other: number;
}

export interface ReportModel {
  generatedAt: string;
  totals: ReportTotals;
  jobs: ReportJobRow[];
  steps: ReportStepRow[];
}

function fmtDateTime(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(
    d.getHours()
  )}:${p(d.getMinutes())}`;
}

export function buildReport(jobs: Job[], now: Date): ReportModel {
  const live = jobs.filter((j) => !j.deletedAt);
  const booked = live.filter((j) => j.booking);

  let ready = 0;
  let inProgress = 0;
  let needsReview = 0;
  let brandNew = 0;
  for (const j of live) {
    const s = jobStatus(j);
    if (s === "ready") ready++;
    else if (s === "in_progress") inProgress++;
    else if (s === "extracted") needsReview++;
    else brandNew++;
  }

  const arriving48 = live.filter((j) => {
    const h = hoursUntilArrival(j, now);
    return h !== null && h >= 0 && h <= 48;
  }).length;
  const onTimePct = booked.length ? Math.round((ready / booked.length) * 100) : 0;

  let horses = 0;
  let companion = 0;
  let other = 0;
  for (const j of booked) {
    const c = (j.booking?.commodity ?? "").toLowerCase();
    if (/horse/.test(c)) horses++;
    else if (/dog|cat|companion|pet/.test(c)) companion++;
    else other++;
  }

  const jobRows: ReportJobRow[] = live.map((j) => {
    const b = j.booking;
    const fs = flightStatus(j);
    return {
      awb: jobAwb(j),
      type: b?.jobType ?? "—",
      agent: jobAgent(j),
      commodity: jobCommodity(j),
      horses: b?.isHorses ? "Yes (OKTF)" : b ? "No" : "—",
      animals: b?.animalCount ?? "",
      flight: b?.flight ?? "",
      origin: b?.origin ?? "",
      arrivalDate: b?.arrivalDate ?? "",
      arrivalTime: b?.arrivalTime ?? "",
      flightStatus: fs ? fs.label : "",
      status: STATUS_LABEL[jobStatus(j)],
      open: openCount(j),
      assignee: j.assignee ?? "",
    };
  });

  const steps: ReportStepRow[] = [];
  for (const j of booked) {
    const b = j.booking!;
    const base = { awb: jobAwb(j), agent: jobAgent(j), commodity: jobCommodity(j) };
    if (b.jobType === "import") {
      for (const item of evaluateReadiness(b.facts, b.isHorses)) {
        if (item.status === "outstanding") {
          steps.push({ ...base, step: item.title, urgency: item.urgency });
        }
      }
    } else {
      if (!b.loadPlan || b.loadPlan.length === 0)
        steps.push({ ...base, step: "Load plan not created", urgency: "soon" });
      if (!b.airlineSubmission)
        steps.push({ ...base, step: "Load list not sent to airline", urgency: "soon" });
    }
  }

  return {
    generatedAt: fmtDateTime(now),
    totals: {
      total: live.length,
      booked: booked.length,
      brandNew,
      needsReview,
      inProgress,
      ready,
      arriving48,
      onTimePct,
      horses,
      companion,
      other,
    },
    jobs: jobRows,
    steps,
  };
}

/** The three worksheets that make up the exported workbook. */
export function reportSheets(m: ReportModel): Sheet[] {
  const summary: CellValue[][] = [
    ["Metric", "Value"],
    ["Report generated", m.generatedAt],
    ["Total jobs", m.totals.total],
    ["Booked", m.totals.booked],
    ["New", m.totals.brandNew],
    ["Needs review", m.totals.needsReview],
    ["In progress", m.totals.inProgress],
    ["Ready for arrival", m.totals.ready],
    ["Arriving within 48h", m.totals.arriving48],
    ["On-time readiness (%)", m.totals.onTimePct],
    ["Horses", m.totals.horses],
    ["Companion animals", m.totals.companion],
    ["Other commodities", m.totals.other],
  ];

  const jobsHeader = [
    "AWB",
    "Type",
    "Agent",
    "Commodity",
    "Horses",
    "Animal count",
    "Flight",
    "Origin",
    "Arrival date",
    "Arrival time",
    "Flight status",
    "Status",
    "Open steps",
    "Assignee",
  ];
  const jobsRows: CellValue[][] = [
    jobsHeader,
    ...m.jobs.map((j) => [
      j.awb,
      j.type,
      j.agent,
      j.commodity,
      j.horses,
      j.animals,
      j.flight,
      j.origin,
      j.arrivalDate,
      j.arrivalTime,
      j.flightStatus,
      j.status,
      j.open,
      j.assignee,
    ]),
  ];

  const stepsHeader = ["AWB", "Agent", "Commodity", "Outstanding step", "Urgency"];
  const stepsRows: CellValue[][] = [
    stepsHeader,
    ...m.steps.map((s) => [s.awb, s.agent, s.commodity, s.step, s.urgency]),
  ];
  if (m.steps.length === 0) {
    stepsRows.push(["—", "—", "—", "No outstanding steps", "—"]);
  }

  return [
    { name: "Summary", rows: summary },
    { name: "Jobs", rows: jobsRows },
    { name: "Outstanding steps", rows: stepsRows },
  ];
}

/** Build the report from live jobs and download it as an .xlsx workbook. */
export function exportReportXlsx(jobs: Job[], now: Date): void {
  const model = buildReport(jobs, now);
  downloadXlsx(`FPAS-report-${model.generatedAt.slice(0, 10)}`, reportSheets(model));
}
