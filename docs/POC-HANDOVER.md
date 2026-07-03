# FPAS Job Manager — POC Handover & Overview

**Purpose of this document:** a complete, self-contained summary of the FPAS
modernization proof-of-concept. Hand it to an assistant (e.g. Claude) to
generate a client presentation, or to get help deploying to Vercel. It is
written so a reader with **no access to the codebase** has full context.

Prepared by MoreYeahs. Status: working POC (mock data only).

---

## 1. Business context

**First Point Animal Services (FPAS)**, part of **IRT Global Holdings**, moves
live animals across international borders. Facilities:

- **Melbourne** (since 2017) — primary operation.
- **New Zealand** — the country's only approved Post-Arrival Quarantine (PAQ)
  for imported horses.
- **Amsterdam** — a Border Inspection Post (BIP) at Schiphol Airport.
- Sister operation: **Chicago Import Quarantine**.

**Current system:** an "FPAS Job Manager" built on **HCL Notes**. Melbourne and
New Zealand use it as their primary system; **Amsterdam runs largely on
spreadsheets** plus parts of the app. The operation has mature, hard-won
business processes and **many regulatory touchpoints** across each shipment's
lifecycle.

**The client's ask:** modernize the platform using **AI-assisted development and
modern cloud technology**, while **preserving the mature business processes**.
Specifically they wanted (1) initial thoughts + recommended technical approach,
(2) a demonstration of AI-assisted development capability, and (3) a built and
demoed POC — within days.

**The winning angle:** the POC leads with the value **HCL Notes structurally
cannot deliver** — reading an agent's email/PDF, turning it into a structured
booking, checking it against the Amsterdam regulatory sequence, and drafting the
operational documents — with a **human approving every step**. It is *not* a
re-skin of the existing CRUD screens.

---

## 2. What the POC is

A working, multi-job **Job Manager** web app for FPAS Amsterdam import/export
handling. It is **mock-data only** (no live integrations), persists to the
**browser (localStorage)**, and calls the **Claude API live** for the AI
features (with a graceful retry state if the key is missing or a call fails).

### Real vs mocked

| Real (genuinely working) | Mocked / simulated (POC scope) |
|---|---|
| AI extraction, readiness reasoning, document/notice/update drafting, and the Copilot — all live Claude | All shipment **data** (fictional) |
| The encoded Amsterdam regulatory sequence + evidence/audit logic | Integrations: Flight Manager, NetSuite, dnata, regulators, airline EDI |
| The full operator flow, per job, with persistence | **Auth/RBAC** — roles are a client-side switch, not real security |
| PDF reading (Claude reads uploaded PDFs) | Flight status chips, "sent" emails (no mail is sent) |

---

## 3. Feature inventory (everything built)

### Intake — six ways to create a job
1. **From a sample agent email** → AI extraction.
2. **Upload a PDF** → Claude reads the document itself and fills the booking.
3. **Paste email/message text** → AI extraction (works in **other languages**;
   a French sample is included).
4. **Customer enquiry form** (the "Customer Portal" concept) → creates a job.
5. **CSV import** → one job per row (the Amsterdam spreadsheet-migration story).
6. **Manual entry** → a blank booking.
Plus **Flight Manager intake**: booked horse shipments arrive on the dashboard
as "Pending" for ops to **Accept** into a job.

### AI extraction
- Parses fields with a **per-field confidence** (high/medium/low); low-confidence
  values are flagged. **Confirming is the mandatory human gate** — nothing is
  created until the operator confirms.

### Booking
- Amsterdam-aware, fully editable. **Import vs Export** toggle drives conditional
  fields: Import → **Govt Vet inspection time**; Export → **Warehouse arrival
  time**. Horse commodities auto-select the **OKTF** path.

### Compliance readiness gate (the signature feature)
- The encoded Amsterdam sequence as a live rail: OKTF → HC draft → **NVWA
  pre-approval** → inspection slot → Scope pre-registration → GDB to customs →
  operational artifacts. Each step carries a plain-language justification and an
  urgency flag.
- **Evidence + audit trail:** marking a step done records a **reference, who, and
  when**. A **reference is required on critical steps** (e.g. NVWA pre-approval),
  which is explicitly distinguished from an origin-country vet endorsement.

### Export load plan → airline
- Per-stall load plan (stall / animal / gender / weight). **AI drafts the load
  list** and "sends" it to the carrier's addresses — e.g. **Etihad's six specific
  addresses** (mock send).

### Regulatory submissions tracker
- Per-regulator notifications across the lifecycle (NVWA, Scope/customs, etc.),
  **AI-drafted**, recorded as submitted with a reference.

### Artifacts
- Offloading list (**Loslijst**) and delivery note, drafted from the booking,
  watermarked DRAFT, with copy/download and **"Save as branded PDF"**.

### Customer movement update
- **AI-drafts a status update** to the customer/agent from the shipment's current
  state; copy + mark sent (addresses the client's "provide movement updates" need).

### AI Copilot
- A chat over all jobs — "what's arriving in 48 hours?", "what's blocking the
  EQUITRANS job?", "draft the NVWA notice". Grounded only in the current jobs.

### AI daily briefing
- One dashboard button: the assistant reads the whole operation and reports
  what's at risk, most urgent first.

### Dashboard views
- **Jobs** (searchable/filterable list, "My jobs" filter, flight-status chips),
- **Calendar** (month grid of arrivals ↓ / departures ↑),
- **Insights** (KPI cards, a radial readiness gauge, fleet-mix & status donut
  charts, a weekly-arrivals column chart, top blockers),
- **Bin** (deleted jobs — restore or delete forever).

### Timeline & job pack
- Per-job lifecycle timeline (created → booked → steps w/ evidence → submissions →
  documents → update) plus a one-click **"Print job pack (PDF)"** dossier.

### Product shell
- **Login landing** with role selection (Admin / Operations / Viewer).
- **RBAC** (simulated): Viewer is read-only; Ops works jobs; Admin adds Settings.
- **Account menu** (dark mode, Settings, Contacts, sign out / switch role).
- **Notifications bell** with computed alerts.
- **Command palette** (Ctrl/⌘ K) — jump to any job, page, or action.
- **Support widget** (floating) — tour, guide, Copilot, mock contact form.
- **Settings** page (org/location, appearance, AI status, data export/reset).
- **Contacts** page (shipping agents + airlines & load-list recipients).
- **Assignments** — assign jobs to staff + "My jobs" filter.
- **Recycle bin** — soft delete with restore / permanent delete.
- **Toasts** on key actions.

### UX / accessibility / brand
- **Guided spotlight tour** (highlights each real section).
- **Accessibility menu**: larger text, high contrast, always-visible keyboard
  focus. **Dark mode.**
- Equine-logistics **theme** (navy → teal → gold), **horseshoe favicon**, a
  branded loader, an animated flight scene on the login, and **commodity
  thumbnails** that auto-upgrade to real photos when dropped into
  `public/animals/`.
- A built-in **"How it works" guide** page (downloadable as PDF).

---

## 4. Architecture & tech stack

- **Framework:** Next.js 14 (App Router) + React 18 + TypeScript.
- **Styling:** Tailwind CSS (custom theme tokens; light + dark).
- **State/persistence:** React context + **browser localStorage** (no database).
- **AI:** the **Claude API** (Anthropic) via server-side API routes using plain
  `fetch` (no SDK dependency). Live-only with a resilient JSON layer
  (auto-retry + JSON repair) and graceful "AI unavailable — retry" UI.
- **No external runtime dependencies** beyond Next/React/Tailwind. Everything
  works offline except the AI-generated content.

### Routes / pages
- `/` — dashboard (Jobs / Calendar / Insights / Bin); behind a role login gate.
- `/jobs/new` — create a job (six modes).
- `/jobs/[id]` — job workspace; tabs: Source, Extraction, Booking,
  Readiness *(import)* / Load plan *(export)*, Submissions, Update, Artifacts,
  Timeline.
- `/copilot` — AI Copilot chat.
- `/guide` — How it works (PDF-printable).
- `/settings` — workspace settings (admin).
- `/contacts` — agents & airlines.

### API endpoints (server, Node runtime)
- `POST /api/extract` — email / pasted text / **PDF** → structured fields + confidence.
- `POST /api/readiness` — booking → reasoned readiness summary (item list is
  computed deterministically from the sequence).
- `POST /api/artifacts` — booking → drafted operational documents.
- `POST /api/compose` — airline load list / regulatory notice / customer update.
- `POST /api/copilot` — Q&A + drafting over the jobs context.

### Data model (high level)
- **Job**: id, timestamps, `deletedAt` (bin), `assignee`, `source`
  (email/text/pdf/enquiry/flightManager/manual), `extraction`, `booking`,
  `readiness`, `artifacts`.
- **Booking**: AWB, agent, commodity, `isHorses`, `jobType` (import/export),
  counts, flight, origin, dates, `govtVetInspectionTime` / `warehouseArrivalTime`,
  `facts` (compliance booleans), `evidence` (per step), `loadPlan`,
  `airlineSubmission`, `submissions`, `customerUpdate`.

---

## 5. Configuration & environment

The AI features require an Anthropic API key. Two environment variables:

```
ANTHROPIC_API_KEY=sk-ant-...        # required for AI screens
ANTHROPIC_MODEL=claude-sonnet-4-6   # model used for extraction/reasoning/drafting
```

- If the key is absent, the app still runs; AI screens show a clean retry panel.
- `claude-sonnet-4-6` is used because it returns clean, parseable JSON reliably
  for this workload. (An earlier model string, `claude-sonnet-5`, is a reasoning
  model whose output intermittently broke JSON parsing — avoid it here.)

> ⚠️ **Security:** never commit real keys. The key used during development must be
> **rotated** before any shared/public deployment.

---

## 6. Running locally

Requirements: Node.js 18.17+ (or 20+).

```bash
npm install
# create .env.local with ANTHROPIC_API_KEY and ANTHROPIC_MODEL (see above)
npm run dev            # http://localhost:3000
# production:
npm run build && npm start
```

Note: switching between `next build`/`next start` and `next dev` in the same
folder can leave a stale `.next` cache ("Cannot find module './xxx.js'"). Fix by
deleting `.next` and restarting dev.

---

## 7. Deploying to Vercel (summary for the assistant)

This is a standard Next.js 14 App Router app — Vercel auto-detects it.

1. Push the repo to GitHub/GitLab/Bitbucket.
2. In Vercel: **New Project → import the repo**. Framework preset: **Next.js**
   (auto). Build command `next build`, output default — no overrides needed.
3. **Environment Variables** (Project → Settings → Environment Variables):
   - `ANTHROPIC_API_KEY` = your key (mark as **Secret**; set for Production &
     Preview).
   - `ANTHROPIC_MODEL` = `claude-sonnet-4-6`.
4. Deploy. The API routes run as serverless functions (Node runtime).

**Things to know / gotchas:**
- **Data is per-browser (localStorage)** — there is no shared database, so each
  visitor gets their own seeded demo data. Fine for a demo; a real deployment
  would add a backend (Postgres) + auth.
- **AI is live-only** — set the key or AI screens show the retry panel.
- **RBAC/login is demo-only** (client-side); do not treat it as access control.
- **Rotate the API key** before sharing a public URL; consider Vercel password
  protection (Deployment Protection) for a client-only demo link.
- No build-time secrets are required; everything is runtime env.

---

## 8. Suggested prompts for the external assistant

**To generate a client PPT:**
> "Using the attached FPAS POC handover, create a ~12-slide client presentation
> (title, business context/problem, our approach, the AI capabilities demo,
> what's real vs mocked, architecture, security & data notes, phased roadmap,
> next steps). Give each slide a headline, 3–5 concise bullets, and speaker
> notes. Audience: FPAS/IRT executives. Tone: confident, concrete, not salesy."

**To get Vercel deployment help:**
> "This is a Next.js 14 (App Router) app, mock-data-only, using the Claude API in
> server routes, persisting to localStorage, no database. Walk me through
> deploying it to Vercel step by step, including env vars
> (ANTHROPIC_API_KEY, ANTHROPIC_MODEL=claude-sonnet-4-6), how to password-protect
> the demo, and any gotchas for live-AI-only + no-DB apps."

---

## 9. Suggested ~12-minute demo flow

1. **Login** — pick a role (show Viewer read-only vs Admin).
2. **Dashboard** — Insights & Calendar ("operation at a glance"); AI daily briefing.
3. **Flight Manager** — Accept a pending horse shipment into a job.
4. **New booking → Upload PDF** — watch AI read the document and fill the form.
5. **Extraction → Readiness** — correct a flagged field; mark a step done with a
   reference (note the NVWA-vs-origin-vet distinction); generate documents.
6. **Copilot** — "what's arriving in 48 hours?" / "draft the NVWA notice".
7. **Customer update** — AI-draft a movement update.
8. **Timeline → Print job pack (PDF)** — hand over a branded dossier.
9. Close on **CSV import** ("we can migrate your Amsterdam spreadsheets today")
   and the disclosure: real AI, mocked integrations, built in days AI-assisted.

---

## 10. Phased roadmap (for the deck)

1. **Phase 1 — Amsterdam first.** Job Manager core + AI intake + readiness +
   load-plan/airline + submissions; migrate the Amsterdam spreadsheets; real DB +
   SSO/auth.
2. **Phase 2 — Integrations.** Flight Manager inbound, NetSuite invoicing, airline
   load-list delivery, live customer portal.
3. **Phase 3 — Parity & scale.** Melbourne / NZ / Chicago; regulatory API
   submissions where authorities support them; multi-location rollout.

_All data in this POC is fictional; every integration is mocked; no data is
submitted to any regulator._

---

_See also `docs/technical-approach.md` for the architecture/approach one-pager,
and the in-app **How it works** guide (`/guide`, downloadable as PDF)._
