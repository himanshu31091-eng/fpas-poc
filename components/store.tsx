"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  AirlineSubmission,
  Booking,
  ComplianceFacts,
  ExtractedField,
  FlightManagerLead,
  Job,
  JobType,
  LoadPlanRow,
  StepEvidence,
} from "@/lib/types";
import { AGENT_EMAILS } from "@/lib/mockData";
import {
  AIRLINE_RECIPIENTS,
  DEFAULT_FACTS,
  loadJobs,
  loadLeads,
  nextJobId,
  saveJobs,
  saveLeads,
  seedJobs,
  seedLeads,
} from "@/lib/jobs";

// ---------------------------------------------------------------------------
// Jobs store. Holds every import job, persists to localStorage, and exposes
// CRUD + per-job AI actions. Each async action tracks its own loading/error
// state per job so a screen can show a spinner or a graceful retry panel.
// ---------------------------------------------------------------------------

export interface JobUiState {
  loadingExtract?: boolean;
  extractError?: string | null;
  loadingReadiness?: boolean;
  readinessError?: string | null;
  loadingArtifacts?: boolean;
  artifactsError?: string | null;
}

interface StoreState {
  hydrated: boolean;
  jobs: Job[];
  getJob: (id: string) => Job | undefined;
  ui: Record<string, JobUiState>;

  createFromEmail: (emailId: string) => string;
  createFromText: (text: string) => string;
  createFromPdf: (filename: string, data: string) => string;
  createManual: () => string;
  updateJob: (id: string, patch: Partial<Job>) => void;
  updateBooking: (id: string, patch: Partial<Booking>) => void;
  assignJob: (id: string, assignee: string) => void;
  deleteJob: (id: string) => void;
  restoreJob: (id: string) => void;
  purgeJob: (id: string) => void;
  resetDemo: () => void;

  runExtraction: (id: string) => Promise<void>;
  confirmBooking: (id: string, fields: ExtractedField[]) => void;
  runReadiness: (id: string) => Promise<void>;
  resolveItem: (
    id: string,
    factKey: keyof ComplianceFacts,
    evidence?: { reference?: string; note?: string }
  ) => Promise<void>;
  regenerateArtifacts: (id: string) => Promise<void>;

  // Flight Manager intake
  leads: FlightManagerLead[];
  acceptLead: (leadId: string) => string;
  dismissLead: (leadId: string) => void;

  // Export load plan + airline send
  updateLoadPlan: (id: string, rows: LoadPlanRow[]) => void;
  sendToAirline: (id: string, airline: string) => Promise<void>;

  // Regulatory submissions
  draftNotice: (
    id: string,
    key: string,
    regulator: string,
    topic: string
  ) => Promise<void>;
  markSubmitted: (id: string, key: string, ref?: string) => void;

  // Customer enquiry intake
  createEnquiry: (fields: {
    customerName: string;
    contactEmail: string;
    jobType: JobType;
    commodity: string;
    animalCount: string;
    origin: string;
    flight: string;
    arrivalDate: string;
  }) => string;

  // Customer movement update (AI)
  draftCustomerUpdate: (id: string) => Promise<void>;
  markUpdateSent: (id: string) => void;

  // CSV import (Amsterdam spreadsheet migration)
  importCsvJobs: (csv: string) => number;
}

/** Current operator — no auth in this POC, so the demo user is fixed. */
const CURRENT_USER = "himanshu.pandey@moreyeahs.com";

const StoreContext = createContext<StoreState | null>(null);

function fieldMap(fields: ExtractedField[]): Record<string, string> {
  return Object.fromEntries(fields.map((f) => [f.key, f.value]));
}

function nowIso(): string {
  return new Date().toISOString();
}

/** Minimal CSV parser (handles quoted fields with commas and doubled quotes). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQuotes = false;
  const s = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQuotes = false;
      } else cur += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(cur);
      cur = "";
    } else if (c === "\n") {
      row.push(cur);
      rows.push(row);
      row = [];
      cur = "";
    } else cur += c;
  }
  if (cur.length || row.length) {
    row.push(cur);
    rows.push(row);
  }
  return rows.filter((r) => r.length > 0);
}

/** Backfill fields added after some jobs were already persisted. */
function migrateJob(job: Job): Job {
  if (job.booking && !job.booking.jobType) {
    return { ...job, booking: { ...job.booking, jobType: "import" } };
  }
  return job;
}

async function readError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return data?.error || `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [leads, setLeads] = useState<FlightManagerLead[]>([]);
  const [ui, setUi] = useState<Record<string, JobUiState>>({});
  // Always-fresh view of jobs for async actions that read-then-write.
  const jobsRef = useRef<Job[]>(jobs);
  jobsRef.current = jobs;

  // Hydrate once from localStorage (or seed on first run). Migrate any jobs
  // saved before newer fields existed (e.g. booking.jobType) so older data
  // doesn't crash newer screens.
  useEffect(() => {
    const stored = loadJobs();
    const base = stored && stored.length ? stored : seedJobs();
    commit(base.map(migrateJob));
    const storedLeads = loadLeads();
    setLeads(storedLeads ?? seedLeads());
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist on every change (after hydration).
  useEffect(() => {
    if (hydrated) saveJobs(jobs);
  }, [jobs, hydrated]);
  useEffect(() => {
    if (hydrated) saveLeads(leads);
  }, [leads, hydrated]);

  // Write jobs so the ref is fresh *synchronously* — actions that read then
  // write (create → extract) must see their own preceding change immediately.
  function commit(next: Job[]) {
    jobsRef.current = next;
    setJobs(next);
  }

  function getJob(id: string): Job | undefined {
    return jobsRef.current.find((j) => j.id === id);
  }

  function patchJob(id: string, patch: Partial<Job>) {
    commit(
      jobsRef.current.map((j) =>
        j.id === id ? { ...j, ...patch, updatedAt: nowIso() } : j
      )
    );
  }

  function setJobUi(id: string, patch: JobUiState) {
    setUi((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  function addJob(job: Job): string {
    commit([job, ...jobsRef.current]);
    return job.id;
  }

  // --- CRUD -----------------------------------------------------------------

  function blankJob(source: Job["source"]): Job {
    const id = nextJobId(jobsRef.current);
    const ts = nowIso();
    return {
      id,
      createdAt: ts,
      updatedAt: ts,
      source,
      extraction: null,
      booking: null,
      readiness: null,
      artifacts: null,
    };
  }

  function createFromEmail(emailId: string): string {
    const email = AGENT_EMAILS.find((e) => e.id === emailId);
    return addJob(blankJob({ emailId, email }));
  }

  function createFromText(text: string): string {
    return addJob(blankJob({ text }));
  }

  function createFromPdf(filename: string, data: string): string {
    return addJob(blankJob({ pdf: { filename, data } }));
  }

  function createManual(): string {
    const job = blankJob({ manual: true });
    job.booking = {
      awb: "",
      shippingAgent: "",
      commodity: "",
      isHorses: false,
      jobType: "import",
      animalCount: "",
      flight: "",
      origin: "",
      arrivalDate: "",
      arrivalTime: "",
      govtVetInspectionTime: "",
      warehouseArrivalTime: "",
      specialCargo: "",
      facts: { ...DEFAULT_FACTS, bookingCreated: true },
    };
    return addJob(job);
  }

  function updateJob(id: string, patch: Partial<Job>) {
    patchJob(id, patch);
  }

  function updateBooking(id: string, patch: Partial<Booking>) {
    const job = getJob(id);
    if (!job || !job.booking) return;
    const merged = { ...job.booking, ...patch };
    // Keep the horse/OKTF path in sync when commodity changes.
    if (patch.commodity !== undefined) {
      merged.isHorses = /horse/i.test(patch.commodity);
    }
    patchJob(id, { booking: merged });
  }

  function assignJob(id: string, assignee: string) {
    patchJob(id, { assignee: assignee || undefined });
  }

  // Soft delete — move to the bin (recoverable).
  function deleteJob(id: string) {
    patchJob(id, { deletedAt: nowIso() });
  }

  function restoreJob(id: string) {
    patchJob(id, { deletedAt: undefined });
  }

  // Permanent removal from the bin.
  function purgeJob(id: string) {
    commit(jobsRef.current.filter((j) => j.id !== id));
    setUi((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function resetDemo() {
    setUi({});
    commit(seedJobs());
    setLeads(seedLeads());
  }

  // --- Flight Manager intake ------------------------------------------------

  function acceptLead(leadId: string): string {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return "";
    const job = blankJob({ flightManager: true });
    job.booking = {
      awb: "",
      shippingAgent: lead.carrier,
      commodity: lead.commodity,
      isHorses: lead.isHorses,
      jobType: "import",
      animalCount: lead.animalCount,
      flight: lead.flight,
      origin: lead.origin,
      arrivalDate: lead.arrivalDate,
      arrivalTime: lead.arrivalTime,
      govtVetInspectionTime: "",
      warehouseArrivalTime: "",
      specialCargo: lead.horses?.length
        ? lead.horses
            .map((h) => `${h.name} (${h.gender}, ${h.weightKg}kg)`)
            .join("; ")
        : "",
      facts: { ...DEFAULT_FACTS, bookingCreated: true },
    };
    const id = addJob(job);
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
    return id;
  }

  function dismissLead(leadId: string) {
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
  }

  // --- Export load plan + airline send --------------------------------------

  function updateLoadPlan(id: string, rows: LoadPlanRow[]) {
    const job = getJob(id);
    if (!job?.booking) return;
    patchJob(id, { booking: { ...job.booking, loadPlan: rows } });
  }

  async function sendToAirline(id: string, airline: string) {
    const job = getJob(id);
    if (!job?.booking) return;
    const res = await fetch("/api/compose", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        kind: "airline-loadlist",
        booking: job.booking,
        airline,
      }),
    });
    if (!res.ok) throw new Error(await readError(res));
    const data = await res.json();
    const recipients = AIRLINE_RECIPIENTS[airline] ?? [];
    const submission: AirlineSubmission = {
      airline,
      recipients,
      body: data.result?.body ?? "",
      sentAt: nowIso(),
      sentBy: CURRENT_USER,
    };
    const current = getJob(id);
    if (current?.booking) {
      patchJob(id, { booking: { ...current.booking, airlineSubmission: submission } });
    }
  }

  // --- Regulatory submissions -----------------------------------------------

  async function draftNotice(
    id: string,
    key: string,
    regulator: string,
    topic: string
  ) {
    const job = getJob(id);
    if (!job?.booking) return;
    const res = await fetch("/api/compose", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        kind: "regulatory-notice",
        booking: job.booking,
        regulator,
        topic,
      }),
    });
    if (!res.ok) throw new Error(await readError(res));
    const data = await res.json();
    const current = getJob(id);
    if (!current?.booking) return;
    const submissions = { ...current.booking.submissions };
    submissions[key] = {
      ...submissions[key],
      status: submissions[key]?.status === "submitted" ? "submitted" : "drafted",
      notice: data.result?.body ?? "",
    };
    patchJob(id, { booking: { ...current.booking, submissions } });
  }

  function markSubmitted(id: string, key: string, ref?: string) {
    const job = getJob(id);
    if (!job?.booking) return;
    const submissions = { ...job.booking.submissions };
    submissions[key] = {
      ...submissions[key],
      status: "submitted",
      reference: ref?.trim() || submissions[key]?.reference,
      submittedAt: nowIso(),
      submittedBy: CURRENT_USER,
    };
    patchJob(id, { booking: { ...job.booking, submissions } });
  }

  // --- Customer enquiry intake ----------------------------------------------

  function createEnquiry(fields: {
    customerName: string;
    contactEmail: string;
    jobType: JobType;
    commodity: string;
    animalCount: string;
    origin: string;
    flight: string;
    arrivalDate: string;
  }): string {
    const job = blankJob({
      enquiry: {
        customerName: fields.customerName,
        contactEmail: fields.contactEmail,
      },
    });
    const isHorses = /horse/i.test(fields.commodity);
    job.booking = {
      awb: "",
      shippingAgent: "",
      commodity: fields.commodity,
      isHorses,
      jobType: fields.jobType,
      animalCount: fields.animalCount,
      flight: fields.flight,
      origin: fields.origin,
      arrivalDate: fields.arrivalDate,
      arrivalTime: "",
      govtVetInspectionTime: "",
      warehouseArrivalTime: "",
      specialCargo: "",
      facts: { ...DEFAULT_FACTS, bookingCreated: true },
    };
    return addJob(job);
  }

  // --- Customer movement update ---------------------------------------------

  async function draftCustomerUpdate(id: string) {
    const job = getJob(id);
    if (!job?.booking) return;
    const res = await fetch("/api/compose", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind: "customer-update", booking: job.booking }),
    });
    if (!res.ok) throw new Error(await readError(res));
    const data = await res.json();
    const current = getJob(id);
    if (!current?.booking) return;
    patchJob(id, {
      booking: {
        ...current.booking,
        customerUpdate: { body: data.result?.body ?? "", draftedAt: nowIso() },
      },
    });
  }

  function markUpdateSent(id: string) {
    const job = getJob(id);
    if (!job?.booking?.customerUpdate) return;
    patchJob(id, {
      booking: {
        ...job.booking,
        customerUpdate: {
          ...job.booking.customerUpdate,
          sentAt: nowIso(),
          sentBy: CURRENT_USER,
        },
      },
    });
  }

  // --- CSV import (Amsterdam spreadsheet migration) -------------------------

  function importCsvJobs(csv: string): number {
    const rows = parseCsv(csv);
    if (rows.length < 2) return 0;
    const headers = rows[0].map((h) => h.trim().toLowerCase());
    const find = (r: string[], keys: string[]) => {
      const i = headers.findIndex((h) => keys.some((k) => h.includes(k)));
      return i >= 0 ? (r[i] ?? "").trim() : "";
    };
    const created: Job[] = [];
    for (const r of rows.slice(1)) {
      if (r.every((c) => !c.trim())) continue;
      const commodity = find(r, ["commodity", "animal"]);
      const jt = find(r, ["type", "direction"]).toLowerCase();
      const jobType: JobType = jt.includes("export") ? "export" : "import";
      const job = blankJob({ manual: true });
      job.booking = {
        awb: find(r, ["awb", "waybill"]),
        shippingAgent: find(r, ["agent", "shipper"]),
        commodity,
        isHorses: /horse/i.test(commodity),
        jobType,
        animalCount: find(r, ["count", "qty", "quantity", "head"]),
        flight: find(r, ["flight"]),
        origin: find(r, ["origin", "from"]),
        arrivalDate: find(r, ["arrival date", "arrival", "date"]),
        arrivalTime: find(r, ["arrival time", "time"]),
        govtVetInspectionTime: "",
        warehouseArrivalTime: "",
        specialCargo: find(r, ["special", "notes", "remarks"]),
        facts: { ...DEFAULT_FACTS, bookingCreated: true },
      };
      created.push(job);
    }
    if (created.length) commit([...created, ...jobsRef.current]);
    return created.length;
  }

  // --- AI actions -----------------------------------------------------------

  async function runExtraction(id: string) {
    const job = getJob(id);
    if (!job) return;
    const payload = job.source.pdf?.data
      ? { pdf: job.source.pdf.data }
      : job.source.emailId
      ? { emailId: job.source.emailId }
      : { text: job.source.text ?? "" };

    setJobUi(id, { loadingExtract: true, extractError: null });
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setJobUi(id, { extractError: await readError(res) });
        return;
      }
      const data = await res.json();
      patchJob(id, { extraction: data.result });
    } catch {
      setJobUi(id, { extractError: "Could not reach the extraction service." });
    } finally {
      setJobUi(id, { loadingExtract: false });
    }
  }

  function confirmBooking(id: string, fields: ExtractedField[]) {
    const job = getJob(id);
    if (!job) return;
    const m = fieldMap(fields);
    const commodity = m.commodity || "";
    const isHorses = /horse/i.test(commodity);
    // Start from any facts already resolved on this job so re-confirming an
    // existing booking doesn't wipe progress; then layer the AI's inferences.
    const facts: ComplianceFacts = {
      ...DEFAULT_FACTS,
      ...job.booking?.facts,
      bookingCreated: true,
      ...job.extraction?.inferredFacts,
    };
    const booking: Booking = {
      awb: m.awb || "",
      shippingAgent: m.shippingAgent || "",
      commodity,
      isHorses,
      jobType: job.booking?.jobType ?? "import",
      animalCount: m.animalCount || "",
      flight: m.flight || "",
      origin: m.origin || "",
      arrivalDate: m.arrivalDate || "",
      arrivalTime: m.arrivalTime || "",
      govtVetInspectionTime: job.booking?.govtVetInspectionTime || "",
      warehouseArrivalTime: job.booking?.warehouseArrivalTime || "",
      specialCargo: m.specialCargo || "",
      facts,
    };
    patchJob(id, { booking });
  }

  async function callReadiness(id: string, booking: Booking) {
    setJobUi(id, { loadingReadiness: true, readinessError: null });
    try {
      const res = await fetch("/api/readiness", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ booking }),
      });
      if (!res.ok) {
        setJobUi(id, { readinessError: await readError(res) });
        return;
      }
      const data = await res.json();
      patchJob(id, { readiness: data.result });
    } catch {
      setJobUi(id, { readinessError: "Could not reach the readiness service." });
    } finally {
      setJobUi(id, { loadingReadiness: false });
    }
  }

  async function runReadiness(id: string) {
    const job = getJob(id);
    if (!job?.booking) return;
    await callReadiness(id, job.booking);
  }

  async function resolveItem(
    id: string,
    factKey: keyof ComplianceFacts,
    evidence?: { reference?: string; note?: string }
  ) {
    const job = getJob(id);
    if (!job?.booking) return;
    const record: StepEvidence = {
      reference: evidence?.reference?.trim() || undefined,
      note: evidence?.note?.trim() || undefined,
      markedBy: CURRENT_USER,
      markedAt: nowIso(),
    };
    const booking: Booking = {
      ...job.booking,
      facts: { ...job.booking.facts, [factKey]: true },
      evidence: { ...job.booking.evidence, [factKey]: record },
      govtVetInspectionTime:
        factKey === "inspectionTimeRequested" &&
        !job.booking.govtVetInspectionTime
          ? "09:00 (day of arrival)"
          : job.booking.govtVetInspectionTime,
    };
    patchJob(id, { booking });
    // Refresh the AI briefing to match the new facts (best-effort).
    await callReadiness(id, booking);
  }

  async function regenerateArtifacts(id: string) {
    const job = getJob(id);
    if (!job?.booking) return;
    setJobUi(id, { loadingArtifacts: true, artifactsError: null });
    try {
      const res = await fetch("/api/artifacts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ booking: job.booking }),
      });
      if (!res.ok) {
        setJobUi(id, { artifactsError: await readError(res) });
        return;
      }
      const data = await res.json();
      const current = getJob(id);
      patchJob(id, {
        artifacts: data.artifacts,
        booking: current?.booking
          ? {
              ...current.booking,
              facts: { ...current.booking.facts, offloadingListCreated: true },
            }
          : current?.booking ?? null,
      });
    } catch {
      setJobUi(id, { artifactsError: "Could not reach the artifacts service." });
    } finally {
      setJobUi(id, { loadingArtifacts: false });
    }
  }

  const value = useMemo<StoreState>(
    () => ({
      hydrated,
      jobs,
      getJob,
      ui,
      createFromEmail,
      createFromText,
      createFromPdf,
      createManual,
      updateJob,
      updateBooking,
      assignJob,
      deleteJob,
      restoreJob,
      purgeJob,
      resetDemo,
      runExtraction,
      confirmBooking,
      runReadiness,
      resolveItem,
      regenerateArtifacts,
      leads,
      acceptLead,
      dismissLead,
      updateLoadPlan,
      sendToAirline,
      draftNotice,
      markSubmitted,
      createEnquiry,
      draftCustomerUpdate,
      markUpdateSent,
      importCsvJobs,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hydrated, jobs, leads, ui]
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
