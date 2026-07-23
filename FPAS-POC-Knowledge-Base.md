# FPAS Job Manager — Complete Knowledge Base

> **Purpose of this document.** This is a self-contained reference to the *First Point Animal Services (FPAS) Job Manager* proof-of-concept (POC). It is written so an AI assistant with **no access to the source code** can answer questions about the POC — technical and non-technical, functional and non-functional — accurately and in detail. If a question isn't covered here, say so rather than inventing an answer. Everything below reflects the POC as built; it is a **demo**, not a production system.

---

## 1. Executive summary

- **What it is:** A working, AI-assisted **operations console** for managing live-animal air-cargo shipments (import and export) through **Amsterdam Schiphol**.
- **Who it's for:** First Point Animal Services (FPAS), the Amsterdam live-animal handling operation (part of the IRT Global Holdings group). Built by **MoreYeahs** for the client contact (Ganesh).
- **What problem it solves:** Today the work is skilled but manual — agent emails are re-keyed by hand, the operation runs on spreadsheets, the pre-arrival regulatory checklist lives "in people's heads," and there's no single place to see what's arriving or at risk. The POC replaces that with one console that **reads shipments, checks them against the real regulatory rules, drafts the paperwork, and shows the whole operation on one screen — with a human approving every step.**
- **Headline capability:** The AI genuinely reads unstructured agent emails/PDFs and turns them into structured bookings; a compliance engine encodes the Amsterdam import sequence and won't let steps be faked; documents, notices and customer updates are AI-drafted; and a cross-operation assistant answers questions across jobs and staffing.
- **Status:** Proof of concept. Real AI on **fictional data**; all external integrations (airlines, customs, accounting, partners) are **simulated**. Nothing is ever submitted to a real authority or airline.

---

## 2. The business domain (context you need to answer domain questions)

FPAS handles **live animals** moving through the EU border at Amsterdam Schiphol. Live-animal import/export is heavily regulated. Key domain terms:

| Term | Plain meaning |
|------|---------------|
| **Schiphol** | Amsterdam's airport (say "SKIP-ol"). |
| **NVWA** | The Dutch competent authority for animal/food safety. Its pre-approval is the key regulatory gate for imports. |
| **BIP** | Border Inspection Post — the facility where animals are held/inspected on arrival. |
| **OKTF** | The horse-import approval form (horses follow a specific path). |
| **HC** | Health Certificate — the animal's health documentation. |
| **EU TRACES / CHED-A** | The EU's electronic system for notifying/clearing animal imports. |
| **CITES** | The convention/permits governing trade in endangered/protected species. |
| **IATA LAR** | IATA Live Animals Regulations — airline rules for carrying live animals. |
| **AWB** | Air Waybill — the shipment's tracking/consignment number. |
| **SPX** | Security declaration for cargo. |
| **GDB** | A customs reference number; the HC copy referenced by the GDB is what customs approves ("d-controle"). |
| **Scope** | A pre-registration system all live-animal imports must be entered into before customs acts. |
| **dnata** | The airport ground handler. |
| **Loslijst** | Dutch for the "offloading list" — a key operational document. |
| **Grooms** | People who accompany/handle animals (esp. horses) in transit. |

**The core import sequence** (encoded in the POC) runs, in order: booking registered → OKTF + HC cover sheet to NVWA (horses only) → HC draft received from agent → **HC pre-approved by NVWA** (the critical gate) → inspection slot requested → Scope pre-registration → HC + GDB sent to customs → offloading list & delivery note prepared. A crucial real-world rule the POC enforces: **an origin-country vet's endorsement is NOT the same as NVWA pre-approval** — only the NVWA satisfies that step.

FPAS handles **many species**, not just horses: cats, dogs, cattle, birds, ornamental fish, reptiles/zoo animals, insects. The POC's per-species compliance engine reflects this.

---

## 3. Architecture & technology (for technical questions)

- **Framework:** Next.js 14 (App Router), React (client components), TypeScript, Tailwind CSS.
- **Client-heavy, no backend database.** Almost everything runs in the browser. All operational data (jobs, roster, leave, staff, housing, animals, portal requests, tickets, preferences) is persisted to the browser's **`localStorage`** — so data survives a refresh but is **per-browser / per-device** and **not shared between users**.
- **The only server-side code is thin, stateless API routes** whose sole job is to call the **Claude API** securely (so the API key never reaches the browser). They take data in, ask the model, return the answer; they **store nothing**. Routes:
  - `/api/extract` — extract booking fields from an email/PDF/text.
  - `/api/readiness` — reasoned plain-language readiness summary.
  - `/api/rules` — per-species compliance requirements.
  - `/api/roster` — parse a pasted/typed roster or instruction into roster entries.
  - `/api/copilot` — answer operator questions / draft text (jobs + staffing + weather context).
  - `/api/compose` — draft customer/airline/regulatory text.
  - `/api/artifacts` — draft operational documents (offloading list, delivery note).
- **AI model:** Claude, called via a hand-rolled `fetch` wrapper (`lib/anthropic.ts`) — no SDK. The app is deliberately **dependency-light**: XLSX and PDF writers are hand-rolled; the one notable npm dependency added is `qrcode-generator` for QR codes.
- **Graceful AI failure:** every AI screen shows a clean "retry" panel on failure rather than a broken screen. If `ANTHROPIC_API_KEY` isn't set, AI routes return a clear "unavailable" message; the deterministic parts (e.g. the readiness rail) still work.
- **No authentication.** "Roles" (below) are a client-side choice, not real auth.
- **State/providers:** React Context providers wrap the app — a jobs store (`StoreProvider`), preferences/roles/i18n (`AppProvider`/`usePrefs`), staffing (`StaffProvider`), and weather (`WeatherProvider`). The app shell + these providers stay mounted across navigation, so all screens share one live state.
- **Deployment:** a standard Next.js build (`npm run build`), deployable to any Node/Vercel-style host. Hosted on GitHub (repo `fpas-poc`).
- **Determinism note:** demo dates and IDs are fixed/seeded so the demo is reproducible; the code avoids `Date.now()`/`Math.random()` in places that would break reproducibility.

### What's genuinely real vs simulated

- **Real:** the AI (extraction, reasoning, drafting); the encoded regulatory sequence and per-species rules; the operator workflow; the audit trail; document/PDF/Excel generation in the browser; live Amsterdam arrival-day weather; QR generation and deep links; the automated test suite.
- **Simulated / mocked:** all shipment data is fictional; every external integration (Flight Manager, NVWA/customs submission, airline/handler delivery, NetSuite accounting, the customer/agent portal) is a demo; role-based access; "sending" anything (no email/notice actually leaves the app).

---

## 4. Roles & access

Chosen at sign-in (a landing page), switchable by signing out. Not real authentication.

- **Admin** — full edit + admin actions (add/remove staff, housing units, animals, etc.).
- **Operations** — can edit/operate jobs, roster, etc.
- **Viewer** — read-only; editing controls are hidden/disabled.

Guidance in the app is gated so Viewers aren't trapped (e.g. can still navigate, just can't save).

---

## 5. Navigation / app shell

A fixed **left sidebar** (FPAS navy/yellow brand) grouped as:

- **Operations:** Dashboard `/` · New booking `/jobs/new` (edit roles) · Housing `/housing` · Animals `/animals` · Staffing `/staffing`
- **Assistant:** Copilot `/copilot` · Compliance rules `/rules`
- **Reference:** How it works `/guide` · Requirements `/requirements`
- **Manage:** Agent portal `/portal` · Settings `/settings`

Top bar: a **"LIVE AI"** tag, **Take a tour**, **New booking**, a **notifications bell**, an **♿ Accessibility** menu (larger text, high contrast, **language switch**), and an **account menu** (dark mode, Settings, Contacts, sign out / switch role). A **command palette** (Ctrl/⌘ K) jumps to any job/page/action. A **help button** (bottom-right) opens the guide or the support widget.

The default landing view is **"Operations Today."**

---

## 6. Onboarding — the getting-started journey

A new user isn't dropped into the middle. The setup-before-operate journey is:

**Phase 1 — set up your workspace (one-time, admin):**
1. Add your **resources** (people): full name, role, default shift plan; and your **assets/equipment** (trucks, crates, stalls, inspection bays).
2. Set the **roster** (give people shifts, or "Fill from plan").
3. Check **Settings** (org basics, appearance, language).

**Phase 2 — operate (daily):**
4. **New booking** → AI extraction → confirm booking.
5. **Readiness / Load plan** → compliance.
6. **Housing** — place arriving animals into holding units.
7. Documents, customer updates, Operations Today, Copilot.

This is surfaced in-app by a dismissible **"Getting started" checklist** on the dashboard (links to each step, remembered on the device) plus **empty-state prompts** in modules.

---

## 7. Feature-by-feature reference

### 7.1 Dashboard / Operations Today

The default view is **Operations Today** — a cross-module "what needs me now" command feed. Cards:
- **Compliance outstanding** — jobs with open regulatory steps.
- **Document gaps** — missing HC/passport etc.
- **Vaccination alerts** — animals with expiring/expired vaccinations.
- **Coverage shortfalls** — days where crew needed for shipments exceeds staff rostered on.
- **Weather welfare** — arrival-day heat/cold flags at Amsterdam.
- **Arrivals · next 48h.**
Each item links straight to the relevant job or module.

Also on the dashboard:
- **Getting started** checklist (see §6).
- **AI daily briefing** — one click produces a 4–6 bullet "what's at risk" summary; it's aware of shipments, weather, **and staffing/coverage** (who's on leave, understaffed days).
- **"From the agent portal" queue** — booking requests submitted on the external portal appear here; staff **Accept & create job** (creates a pre-filled Confirmed job) or **Dismiss**. (See §7.11.)
- **Flight Manager "Pending" queue** — inbound horse shipments arrive as pending leads to Accept into jobs (simulated integration).
- **Other views** (tabs): **Jobs** register (List / Board(Kanban) / Grid), **Calendar** of arrivals/departures, **Insights**, **Report** (exportable to Excel/PDF), **Bin** (soft-deleted jobs, restorable).
- **Job detail drawer** — click any job for a quick-look slide-over (key facts + a QR that opens the shipment when scanned) with an "open full job" action.
- **Search** on the jobs list (AWB, agent, commodity, flight).
- **New entries appear at the top** of lists.

### 7.2 New booking / intake (six modes)

Create a job six ways:
1. **From a sample email** → AI extracts fields.
2. **Upload a PDF** → the AI reads the document itself and fills the booking.
3. **Paste email text** → AI extracts fields.
4. **Customer enquiry form** (mirrors the FPAS website enquiry) → AI proposes the booking.
5. **Import CSV** → one job per row (spreadsheet migration; columns matched by header).
6. **Manual entry** → a blank booking.

AI-based modes run **extraction** with a **confidence level per field**; low-confidence values are flagged for the operator to correct before confirming. The AI reads **other languages** too (there is a French sample email). Sample emails include: clean horse import (EK9021), messy dogs & cats, incomplete horses, a **French** horse import, 22 breeding cattle, pets, awaiting-details horses, and **CITES birds** (docs endorsed).

### 7.3 Job workspace (per-shipment tabs)

Opening a job shows tabs (import vs export differ):
- **Source** — the original email/PDF/enquiry/CSV row.
- **Extraction (AI)** — extracted fields with confidence; fix flagged ones; **Confirm & create booking**.
- **Booking** — full shipment details, editable. Import shows **Govt Vet inspection time**; Export shows **warehouse arrival time**. Horse shipments pick up the OKTF path automatically. A manual **ops-stage lifecycle** (Enquiry → Quoted → Confirmed → Docs pending → Ready → Departed → Arrived → Completed → Cancelled) is set from the job header, shown **alongside** the auto-derived readiness status.
- **Readiness (import)** or **Load plan (export)** — see §7.4 / §7.5.
- **Staffing** — assign crew & equipment for this shipment's arrival day (see §7.9 per-shipment staffing).
- **Submissions** — track regulatory notifications; AI-draft each, record as submitted with a reference (simulated send).
- **Update** — AI-draft a customer/agent movement update from the shipment's current state; copy and mark sent.
- **Artifacts** — the **offloading list (Loslijst)** and **delivery note**, drafted from the booking; copy, or download each as a **genuine branded FPAS PDF** (navy header, DRAFT watermark, scannable QR) generated in-browser.
- **Timeline** — the full lifecycle + one-click **"Print job pack (PDF)."**

**Guided flow:** when the readiness gate clears, the primary action routes to **Staffing** ("Assign staff & equipment →"), and Staffing then offers **"Draft operational documents →"** (Artifacts). This mirrors real ops (clear compliance → resource the job → produce paperwork) but is a **guided nudge, not a hard gate** — every tab stays directly clickable.

### 7.4 Readiness — the per-shipment compliance gate (import)

- A **live regulatory rail** derived deterministically from the booking's compliance facts (works with or without AI; the AI only adds a reasoned summary).
- The 8-step Amsterdam import sequence (see §2), **horses adding the OKTF step**.
- Each step is **outstanding** or **satisfied**; **outstanding-first, sorted by urgency** (critical → soon → routine), so the top blocker is obvious. The banner shows "N outstanding / cleared for arrival" + a progress bar + the top blocker.
- Marking a step done captures **evidence**: who, when, and a **reference** (critical steps *require* a reference, e.g. the NVWA approval number).
- Enforces **NVWA ≠ origin-vet** (can't fake the critical HC pre-approval step).
- **Demo shortcuts** (edit role): **"Mark all steps done"** clears the rail instantly (records a `DEMO` reference, one update, no per-step AI); **"Reset steps"** returns it to the start for a re-demo.

### 7.5 Load plan (export)

For export (esp. horses): a **loading-list builder** — per-stall contour, gender/weight, per-horse **HC & passport** ticks with a doc-readiness banner, accompanying **grooms**, and the **SPX** security declaration. Then pick the airline (e.g. **Etihad → six addresses**) and **Draft & send** the AI-drafted load list (mock send). The seed export job has one horse's passport deliberately **unticked** so the demo shows a flagged gap.

### 7.6 AI Compliance rules (per-species engine) — `/rules`

Pick **any** shipment; the AI reasons **which documents and checks that species, route and direction require**. Each requirement is tagged with:
- **Authority** — NVWA / EU TRACES / CITES / IATA LAR / Customs / Airline.
- **Category** — documentation / health / welfare / security / customs.
- **Severity** — mandatory / conditional / recommended.
- **Rationale** — one line each.
Mandatory-first; CITES only appears for genuinely protected species. An in-page **"How compliance works"** explainer describes the two compliance layers and how this relates to the per-shipment Readiness gate. Decision-support, **not** legal advice.

**The two compliance layers (important distinction):**
- **Readiness** = *"for this shipment, what's outstanding and blocking arrival?"* — a tracked, auditable workflow gate tuned to the horse-import path FPAS runs most.
- **Compliance rules** = *"for this species and route, what does the law require in the first place?"* — an on-demand reasoning tool that generalises to every animal.

### 7.7 Copilot — cross-operation assistant — `/copilot`

Free-text questions across all jobs **and staffing**: e.g. "what's arriving in 48 hours?", "what's blocking the EQUITRANS job?", "who's on leave this week?", "are we short-staffed on any shipment day?", or "draft the NVWA notice." It only sees this workspace's data; **decision-support, not an autonomous agent** — a human acts on answers. It is fed live jobs + a **staff/coverage summary** (who's on leave/sick, understaffed days) so it can answer coverage questions.

### 7.8 Staffing — roster, resources, timesheets, leave — `/staffing`

The FPAS Amsterdam staff planning module (five tabs). Everything is **searchable** so it scales to a large team (even ~1,000 people). Full names + roles show everywhere.

- **Resources tab:** add a person with a **full name**, a **role** (Coordinator, Groom, Loadmaster, Driver, Vet liaison, Warehouse, Admin) and a **default shift plan** (start/end + which weekdays). Manage **equipment/assets** (trucks, crates, stalls, inspection bay, cold storage). **"Restore default team"** re-adds the seed employees without touching roster/leave. Removing a person also cleans up their roster entries and leave.
- **Roster tab:** a weekly/monthly grid (working / off / leave / sick / holiday / training). **"Fill from plan"** lays each person's default shift onto the **visible** week or month (blanks only — never overwrites a shift or leave). Add/change one shift via "Add / update shift." Booking-derived **coverage** row compares crew required by that day's shipments against who's rostered, flagging understaffed days. A **"How the roster works"** primer explains it. Export the roster to Excel.
- **Timesheets tab:** planned shifts vs. clock in/out actuals, variance, and **"Approve week & export to payroll"** (produces an .xlsx). 
- **Leave tab:** request → approve / decline → **remove**. A **pending** request shows on the roster immediately (faded) and becomes solid once approved. Leave entered via the **Import** tab or "Add shift" (a roster entry with status leave/sick) is **reconciled** here too, badged "On roster" — so the Leave tab lists **every absence** however it was entered. Removing a leave reverts the roster automatically.
- **Import tab:** paste/upload the staff-planning spreadsheet (or a short free-text instruction like "Himanshu Pandey on leave 25 July"); the AI parses it into roster entries (understands Dutch labels — Vakantie/Vrij/Ziek). Unknown names are added to the team; case/spelling variants are matched to existing people.
- **Per-shipment staffing** (from a job's Staffing tab): assign the right people and equipment for the arrival day; people on **approved leave** drop out of the "available" picker; double-booking against other same-day shipments is flagged.

**Coverage logic:** `requiredCrew` starts at a baseline of 2 "shed crew" and adds per movement (horse export: ⌈count/3⌉+1; horse import: +2; else +1). Approved leave removes availability; a pending request shows but doesn't yet reduce coverage.

### 7.9 Housing & occupancy — `/housing`

The **BIP holding units** by zone (Stables A/B, Kennels, Aviary, Aqua, Isolation). Each unit has a status in the **between-shipment cleaning lifecycle**: Occupied → Dirty → Cleaning → Ready → Available (advanced in one click). Live utilisation stats. Admins add/edit/remove units. **Place a registered animal** into a unit (pick from the animal registry), and each unit carries a **QR** that opens/highlights it when scanned. **Search** units by id/zone/type/species/occupant/status.

### 7.10 Animal registry — `/animals`

Per-animal welfare & compliance records: name, species, breed, **microchip**, **passport**, owner/agent, linked shipment, weight, **vaccinations** (with due-soon / expired alerts), and a **CITES** flag for regulated species. Admins add/edit/remove animals. **"Place in housing"** assigns an animal to a free holding unit (and the card shows which unit it's in); the link works from **both** sides (Housing ↔ Animals). Each animal has a scannable **microchip QR** that opens its record. **Search** the registry. Seed animals include horses (Baloubet, Cornetto, **Bella** — passport outstanding, Casall), a beagle (Rocky), a **CITES** reticulated python, and a koi consignment.

### 7.11 Agent portal — `/portal`

A demo of the **external** surface agents/airlines use: submit a booking request, upload documents to a per-commodity checklist, confirm the AWB, and track status (Submitted / Docs pending / Ready). **Agent portal → operations bridge:** a submitted request appears on the ops **Dashboard** queue; staff **Accept** it to create a pre-filled job (or Dismiss), and the agent sees an **"Accepted by ops"** badge. In production this would be a separate authenticated portal. (Simulated.)

### 7.12 Requirements & Traceability — `/requirements`

A live, in-app map of how the POC covers the FPAS brief. Every requirement has a status — **Built / Simulated / Not built / Future / Partial / Met / By design / Open** — with a coverage summary and origin (Client-stated / Recommended / Derived). Sections: Functional (FR-01…21), Integration (IR-01…05), Non-functional (NFR-01…06), and **"Beyond the brief"** (EX-01…27 — the enhancements added on top). Exportable to PDF.

### 7.13 How it works (`/guide`) & Take a tour

- **Guide** — a full how-it-works page (what the tool is, before/after, getting around, six ways to start a job, every screen, import & export walkthroughs, "Good to know," and a getting-started note). Exportable to PDF. Fully translated (5 languages).
- **Tour** — an 11-step spotlight walkthrough launched from the top bar (or the help widget); it navigates to each section and highlights it, describing the current capabilities.

### 7.14 Settings, Contacts, Support

- **Settings** — organisation basics, appearance (six accent themes + dark mode), AI, data. (Demo; stored in the browser.)
- **Contacts** — a read-only directory of agents/airlines/authorities.
- **Support widget** (bottom-right) — a lightweight help desk: read the guide, start the tour, or raise a **ticket** (logged and tracked as a demo, newest first).

---

## 8. Cross-cutting capabilities

- **QR codes** — dynamic QR on jobs, housing units, animals, and the branded PDFs. They **deep-link** to the record (e.g. `/jobs/{id}?awb=…`, `/housing?unit=…`, `/animals?chip=…`) so scanning from a phone opens the right screen. (For jobs, the QR carries the AWB so a scan resolves even if the job id isn't on the scanning device — the hook for a future mobile warehouse app.) QR is generated in-browser via the `qrcode-generator` library and verified independently in tests.
- **PDF generation** — hand-rolled, in-browser, no external library: branded offloading list / delivery note (navy header, DRAFT watermark, QR), the guide, requirements, and job packs.
- **Excel export** — hand-rolled .xlsx writer for the operations report, roster, and payroll timesheets.
- **Weather** — live Amsterdam arrival-day forecast (with a deterministic mock fallback) and a **welfare flag** when it's too hot (≥27°C) or cold (≤4°C) for live animals; feeds the daily briefing.
- **Internationalisation (i18n)** — the interface runs in **five languages: English, Dutch, German, French, Spanish**, switchable from the Accessibility menu. A dependency-free dictionary (`lib/i18n.ts` + a generated `lib/i18nExtra.ts`, ~270 keys) with `{param}` interpolation; any missing key falls back to English. The Guide, Requirements, and all core/staffing/housing/animals/compliance UI are translated. (Sample shipment *data* and AI-drafted text stay in their source language.) The guided **Tour** is English-only by design.
- **Accessibility** — larger-text and high-contrast modes, plus the language switch; choices remembered on the device.
- **Human-in-the-loop everywhere** — the AI drafts and reasons; a person approves every step; nothing is auto-submitted to a regulator or airline.

---

## 9. Key data models (for technical/data questions)

All persisted in `localStorage` (keys shown). Shapes are TypeScript interfaces.

- **Job** (`fpas.jobs.v2`) — `{ id, createdAt, updatedAt, source, extraction, booking, readiness, artifacts, stage?, deletedAt?, assignee? }`. `source` = one of email/text/pdf/enquiry/manual/csv.
- **Booking** — `{ awb, shippingAgent, commodity, isHorses, jobType (import|export), animalCount, flight, origin, arrivalDate, arrivalTime, govtVetInspectionTime, warehouseArrivalTime, specialCargo, facts (ComplianceFacts), evidence?, loadPlan? }`.
- **ComplianceFacts** — booleans per step: `bookingCreated, oktfPrepared, hcDraftReceived, hcEndorsedByNVWA, inspectionTimeRequested, scopePreRegistration, gdbSentToCustoms, offloadingListCreated`.
- **ReadinessItem** — `{ id, factKey, title, justification, urgency (critical|soon|routine), status (outstanding|satisfied) }`.
- **Flight Manager lead** (`fpas.leads.v2`) — inbound pending shipment to accept.
- **RosterEntry** (`fpas.roster.v3`) — `{ id, staff, date, status (working|off|leave|sick|holiday|training), start?, end?, note? }`.
- **LeaveRequest** (`fpas.leave.v3`) — `{ id, staff, startDate, endDate, type (vacation|off|sick), status (requested|approved|declined), note?, requestedAt, decidedBy?, decidedAt? }`.
- **StaffProfile** (`fpas.profiles.v2`) — `{ name, fullName?, role?, shift?: { start, end, days:number[] } }` (keyed by the staff name, which is the join key across roster/leave/staffing). Team list: `fpas.team.v2`.
- **Asset** (`fpas.assets.v1`) — `{ id, name, type (Truck|Crate|Stall|Inspection bay|Cold storage|Other), quantity }`.
- **StaffingAssignment** (`fpas.staffing.v4`) — `{ jobId, needed, assigned:string[], assets?:string[], note? }`.
- **HousingUnit** (`fpas.housing.v3`) — `{ id, zone, type, species, status (Available|Occupied|Dirty|Cleaning|Ready), occupant, animalId?, since }`.
- **Animal** (`fpas.animals.v2`) — `{ id, name, species, breed, chip, passport, owner, job, weightKg, vax:[{name,exp}], cites, notes }`.
- **PortalRequest** (`fpas.portal.v2`) — `{ id, agent, commodity, origin, flight, date, animalCount, notes, awb, docs:[{name,uploaded,filename?}], createdAt, accepted?, acceptedJobId?, dismissed? }`.
- **Requirements** — static data in `lib/requirements.ts` (sections + items with status/origin).

---

## 10. Seed / demo data (so answers about "what's in the demo" are accurate)

- **Jobs:** EK9021 — 4 live horses, import, arriving ~24 Jul 2026; QR273 — companion animals (dogs & cats), import; a bare enquiry job (no booking); EK9022 — 3 live horses, **export**. Plus Flight Manager leads (EK9021, QR273) as pending.
- **Staff:** 11 people with full Dutch-style names + roles + Mon–Fri default shifts (e.g. Lotte van Dijk — Coordinator, Bart Willems — Driver…). Seed roster ~2 weeks around "today," with a couple on leave/sick to show the states.
- **Housing:** ~14 units across the zones, several occupied and a few mid-cleaning.
- **Animals:** ~7 (horses incl. Bella with an outstanding passport, a beagle, a CITES python, a koi consignment).
- **Portal:** two seed requests (IRT AUS horses; Skye Pet Travel beagle).
- **Dates are fixed around late July 2026.** "Reset demo data" / "Reset to sample" restores the seed. (Because staff storage keys were versioned up, staff/roster data resets once to the clean seed on first load after that change.)

---

## 11. Testing (for QA / non-functional questions)

- **Vitest** unit-test suite — **18 test files, 98 tests** — over the core domain logic: i18n dictionary completeness (all 5 languages, placeholder integrity), job status, the readiness sequence, staffing (status-on-date, availability, shift patterns, roster-import name canonicalisation, staff context), housing (lifecycle, animal placement), animals, portal (accept/dismiss bridge), support tickets, QR (independent jsQR round-trip decode), PDF, Excel, weather, report, requirements, and the setup-journey logic.
- **Verification gate:** every change is checked with `npx tsc --noEmit` (types), `npm test` (unit tests), and `npm run build` (production build) before it ships.

---

## 12. Non-functional posture & limitations

- **Data:** per-browser localStorage; **not multi-user**, not shared across devices; clearing the browser resets it. No real database.
- **Security:** no authentication; roles are cosmetic. Nothing sensitive is stored. Suitable for a demo only.
- **Integrations:** none are live — airlines, customs, NVWA/TRACES, accounting (NetSuite), ground handler (dnata), and the agent portal are all simulated.
- **AI:** genuine but non-deterministic; always human-approved; can be slow or occasionally fail (handled with retry panels).
- **Scale:** the UI is built to handle large lists (search everywhere), but the localStorage model is not a production data layer.
- **Data residency:** EU data-residency for Amsterdam data is flagged as an open item for production.

---

## 13. Production roadmap (what "the real thing" would add)

The POC is the **"today"** side of a today-vs-production story. Production would add: a **real secure database**; **real authentication** and access control; **live integrations** (Flight Manager, NVWA/TRACES/customs submission, airline & ground-handler delivery, NetSuite invoicing, the authenticated customer/agent portal); a **live email intake** pipeline (email FPAS → it appears in the app → booking); a **mobile warehouse app** (the QR deep-links are the hook); **data migration** off the old HCL Notes platform; and **rollout to other sites** (Melbourne, New Zealand, Chicago). It would be a scoped, phased engagement — Amsterdam first — measured in months, not days.

---

## 14. How to answer questions from this document

- If asked **"is X real or mocked?"** → see §3 (real vs simulated) and §12.
- If asked **"how does compliance work?"** → §7.4 (Readiness gate) and §7.6 (per-species rules); stress the two layers and the NVWA-vs-origin-vet rule.
- If asked **technical/architecture** → §3, §9 (data models), §11 (tests).
- If asked **about a specific screen/feature** → §7.x.
- If asked **"what's next / production"** → §13.
- For **domain terms** → §2.
- If it isn't here, say it isn't covered rather than guessing. Always frame the app as a **proof of concept**: real AI on fictional data, integrations simulated, a human approves every step.

---

*Prepared for First Point Animal Services by MoreYeahs. This document describes a proof-of-concept demo, not a production system.*
