# FPAS Modernisation — Technical Approach & POC

Prepared for First Point Animal Services (IRT Global Holdings)
Author: MoreYeahs · Status: POC + recommended approach

---

## 1. Understanding

FPAS runs live-animal import/export handling across Melbourne, New Zealand and
Amsterdam (Schiphol BIP), today on an **HCL Notes "Job Manager"**. Melbourne and
NZ use it as their primary system; **Amsterdam runs largely on spreadsheets** plus
parts of the app. The operation has **mature, hard-won business processes** and
**many regulatory touchpoints** across each shipment's lifecycle.

The goal is to **modernise the platform with AI-assisted development and modern
cloud technology — while preserving those business processes**, not replacing the
know-how that lives in the team's heads and spreadsheets.

The defensible value is **not** re-drawing the Job Manager screens (Notes already
does that, and it shows no AI). It is the work Notes structurally *cannot* do:
reading an agent's email/PDF, turning it into a structured booking, checking it
against the regulatory sequence, and drafting the operational documents — a human
validating every step.

## 2. What the POC demonstrates (built, in days, AI-assisted)

A working Next.js **Job Manager** (mock-data only, no live integrations) that shows
the AI play end-to-end:

- **Intake → AI extraction** — an agent email (or pasted text / emailed PDF, or the
  website enquiry form) is parsed by Claude into structured fields with per-field
  **confidence**; low-confidence values are flagged. Confirming is the mandatory
  human gate.
- **Booking** — Amsterdam-aware, **Import vs Export** driving conditional fields
  (Import → Govt Vet inspection time; Export → warehouse arrival time), horse/OKTF
  path auto-detected.
- **Compliance-readiness gate** — the encoded Amsterdam import sequence as a live
  rail (OKTF → HC → **NVWA pre-approval** → inspection slot → Scope → GDB to customs
  → artifacts), each step with a plain-language justification, urgency, and an
  **evidence + audit trail** (reference, who, when; required on critical steps).
- **Export load plan → airline** — per-stall load plan (stall/gender/weight), with
  an **AI-drafted load list** "sent" to the carrier's addresses (e.g. Etihad's six).
- **Regulatory submissions tracker** — per-regulator notifications across the
  lifecycle, **AI-drafted** and recorded as submitted.
- **Flight Manager intake** — booked **horse** shipments arrive as **Pending** for
  ops to **Accept** (mirrors the real Flight Manager → FPAS handoff).
- **Artifacts** — offloading list (Loslijst) + delivery note drafted from the
  booking, watermarked DRAFT, copy/download.

Everything persists in the browser and survives a refresh; the AI is **live Claude**
with graceful "AI unavailable — retry" states.

### What's real vs mocked in the POC

| Real | Mocked (POC scope) |
|---|---|
| AI extraction, readiness reasoning, document/notice drafting (live Claude) | All shipment data (fictional) |
| The encoded Amsterdam regulatory sequence + evidence/audit logic | Flight Manager, NetSuite, dnata, regulator, airline integrations |
| The full operator flow, per-job, with persistence | Authentication, multi-user, real email/EDI send |

## 3. Recommended target architecture

- **Job Manager (core)** — cloud web app (Next.js/React + a Node API), the system of
  record for jobs, AWBs, load plans, submissions and audit trail.
- **Customer Portal** — the website enquiry form and booking-email intake; PDFs are
  **AI-scanned** into a draft job for ops review.
- **AI services layer** — Claude for extraction, readiness reasoning, and drafting,
  behind our own API with schema validation, retries, and human-in-the-loop gates.
- **Integrations (phased):**
  - **Flight Manager** → inbound horse shipments as Pending (accept/review).
  - **NetSuite** → invoicing (AR/AP) from completed jobs.
  - **Regulatory systems** → submission/notification (assisted drafting now;
    API/portal submission later where available).
  - **Partner systems (dnata, airlines)** → load-list delivery / EDI (Amsterdam).
- **Cloud & data** — managed Postgres, object storage for documents, SSO/roles,
  audit logging. Deployable to the client's preferred cloud.

## 4. AI-assisted development approach

- **Preserve the business logic as code** — the regulatory sequence and conditional
  rules are encoded and version-controlled, reviewed with an FPAS ops person; the AI
  reasons *against* that ground truth rather than inventing rules.
- **Human in the loop by design** — nothing is submitted autonomously; every AI
  output is validated, with an evidence/audit trail.
- **Resilient AI plumbing** — schema-shaped prompts, JSON repair + retries, and a
  clean fallback UI so a model hiccup never breaks the operator.
- **AI-accelerated delivery** — this POC was built in days with AI-assisted coding;
  the same approach compresses the full build.

## 5. Suggested phasing

1. **Phase 1 — Amsterdam first (highest pain).** Job Manager core + AI intake +
   readiness + load-plan/airline + submissions; migrate the Amsterdam spreadsheets.
2. **Phase 2 — Integrations.** Flight Manager inbound, NetSuite invoicing, airline
   load-list delivery, customer portal live.
3. **Phase 3 — Melbourne / NZ / Chicago parity + regulatory API submissions**
   where the authorities support it; roll out multi-location.

## 6. Next steps

- Walk through the POC live; gather ops feedback on the encoded sequence.
- Confirm target cloud, auth/SSO, and integration priorities (Flight Manager,
  NetSuite first).
- Agree Phase 1 scope and timeline.

_POC is mock-data only; no data leaves the environment and nothing is submitted to
any regulator._
