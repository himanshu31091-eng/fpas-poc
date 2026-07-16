# First Point Animal Services — AI Job Manager POC
### Feature summary (for presentation prep)

**What it is:** a single modern web application with an AI services layer that
demonstrates the FPAS Amsterdam live-animal operation end to end — from intake,
through AI extraction and a human-validated booking, to a compliance-readiness
assessment, AI-drafted operational documents, and a full operations suite around
it: **staff planning + timesheets**, **housing & occupancy**, an **animal
registry**, reporting and multilingual support. Built by MoreYeahs.

- **Stack:** Next.js (App Router) + TypeScript + Tailwind, AI via the Claude API. No external SDKs; runs offline for everything except the live AI calls. Data is mock and stored in the browser (localStorage). Deployed on Vercel.
- **Presentation:** an **ops-console layout** — a fixed left **sidebar** navigation (grouped sections), a slim top bar, and a calm, data-dense visual system in the FPAS brand. Responsive to phone/tablet (sidebar collapses to a drawer).
- **Languages:** the interface runs in **English, Dutch, German, French and Spanish**, switchable from the Accessibility menu.
- **Status legend:** **Built** = working, live AI where relevant · **Simulated** = demonstrated with mock data / no live integration · **Future** = planned, not in POC.

---

## 1. Core workflow (the Amsterdam import / export slice)

- **Multi-mode intake** — create a job from a sample agent email, an uploaded **PDF** (AI reads the document), pasted text, the **website enquiry form**, a **CSV import**, or manual entry.
- **AI extraction** — pulls shipment fields from unstructured input and flags low-confidence values instead of guessing. *(Live AI.)*
- **Human validation gate** — the operator reviews and confirms extracted details before a job is created.
- **Import vs Export job types** with conditional fields (import → government vet inspection time; export → warehouse arrival time). Commodity auto-fills; **horse shipments follow the OKTF path**.
- **Ops stage lifecycle** — a manual handling stage on every job (Enquiry → Quoted → Confirmed → Docs pending → Ready → Departed → Arrived → Completed → Cancelled), shown as a chip alongside the auto-derived regulatory-readiness status — the two are deliberately separate so the compliance gate can't be bypassed.
- **Compliance-readiness gate** — encodes the real Amsterdam regulatory sequence (OKTF → HC → **NVWA pre-approval** → inspection slot → Scope pre-registration → GDB to customs → offloading list) and reports, in plain language, what's outstanding, why, and how urgent. *This is the core differentiator.*
- **NVWA vs origin-vet distinction** — only a Dutch-authority (NVWA) endorsement satisfies that step; an origin-country vet endorsement does not.
- **Evidence & audit trail** — each step records who marked it done, when, and a reference (required on critical steps).
- **Operational documents** — AI-drafted **offloading list (Loslijst)** and **delivery note**, marked DRAFT for human approval; export as branded PDF. *(Live AI.)*
- **Horse loading-list builder (export)** — per-stall list with **contour (L/R/747)**, gender, weight, a **tackbag** toggle, and per-horse **health-certificate & passport ticks** with a live doc-readiness banner ("N of M horses missing HC or passport"); accompanying **grooms** (name + passport) and the **SPX security declaration**. Feeds the AI-drafted **airline load list**. *(Load-list send is Simulated.)*
- **Regulatory submissions tracker** — AI-drafted notices recorded as submitted with a reference. *(Simulated.)*
- **AI customer movement updates.** *(Live AI.)*
- **AI Copilot & daily briefing** — ask questions across all shipments; one-click "what's at risk right now" briefing. Answers render as formatted Markdown. *(Live AI.)*
- **Flight Manager intake** — booked horse shipments arrive as "Pending" for the operator to accept into a job. *(Simulated.)*
- **Role-based access** — Admin / Operations / Viewer chosen at sign-in; gates editing. *(Simulated.)*

---

## 2. FPAS branding (from the brand pack)

- Adopted the **First Point Animal Services** identity across the whole app: brand **navy `#231F5C`** as the primary UI colour, brand **yellow `#FFC40C`** as the accent (navy-on-yellow CTAs), and the **"F" mark + wordmark** in the sidebar, sign-in, documents and favicon.
- Strict two-colour palette — no off-brand tints.
- **Self-service in Settings:** admins can **upload/replace the logo** and **switch the colour theme** — branding is configurable, not hard-coded.

---

## 3. App shell, navigation & accessibility

- **Left sidebar console layout** — grouped navigation (Operations · Assistant · Reference · Manage), FPAS logo, a station switcher and a yellow active indicator; a slim top bar carries the global controls and the primary **New booking** CTA. Collapses to a drawer on mobile.
- **Job detail drawer** — a plain click on any job opens a right-side **quick-look slide-over** (key facts, status/stage, welfare/weather/staffing chips) with an "Open full job" action; modified clicks still deep-link straight to the workspace.
- **Multilingual interface** — English / Dutch / German / French / Spanish, switchable from the Accessibility menu and remembered per device (sets the page language for screen readers too).
- **Accessibility** — larger-text and high-contrast modes, dark mode, and always-visible keyboard focus.
- **AI reliability tuning** — per-call timeouts, bounded retries with in-place JSON repair, higher output limits, and prompt caching (prevents the earlier 504 timeouts and lowers latency/cost).

---

## 4. Dashboard, views & filtering

- **Three job views:** **List** (a clean register table with a column header and hairline-divided rows), **Kanban Board** (grouped by status), and **Grid** — one toggle, applies everywhere.
- **Create a job from the Kanban board** — quick-create modal, plus a link to the full intake.
- **Multi-facet Filters** — Job type, Commodity, Arrival window (≤48h / this week / overdue), and Agent, combined with search + status chips.
- **Ops-stage and staffing chips** on rows and cards for at-a-glance state.
- **Calendar** of arrivals & departures, **Insights** analytics, and a **Bin** (soft-delete / restore).
- **Per-job timeline** and a **printable job pack**.

---

## 5. Reporting & export

- **Operations Report** view — summary tiles, per-job table, and outstanding-steps breakdown.
- **Export to Excel (.xlsx)** and **Export to PDF** — a genuine multi-sheet workbook, generated in the browser with no external library.

---

## 6. Arrival-day weather (live)

- Each job shows the **live Amsterdam Schiphol forecast** for its arrival day (Open-Meteo; graceful mock fallback offline).
- **Welfare flag** — heat (≥27°C) or cold (≤4°C) is highlighted, tying weather to live-animal welfare and airline temperature embargoes.
- Weather is fed into the **AI daily briefing** so it can flag weather-driven risk.

---

## 7. Staff planning, coverage, timesheets & payroll (from the FPAS roster spreadsheet + CEO asks)

- **Roster / availability board** — weekly grid of who's working (with times), off, on leave, sick, on holiday or training, matching the spreadsheet. **Week and Month views**, per-day availability counts, and **Export to Excel**.
- **Booking-derived coverage** — the roster computes the **crew each day's shipments require** (baseline + per-movement, more for horse exports) versus who's rostered on, and flags **understaffed days** at a glance.
- **Timesheets & payroll** — a Timesheets tab compares **planned shifts vs. clock-in/out actuals**, shows per-shift **hours and variance**, and an **"approve week & export to payroll"** action produces a real Excel workbook (the payroll hand-off).
- **Leave calendar** — request leave → **admin approve/decline**; approved leave updates the roster and availability automatically.
- **Resources register (add your own):** editable **Team** (staff members) and **Equipment & assets** (trucks, crates, stalls, inspection bays, cold storage).
- **Per-shipment staffing** — on each job, request N staff and assign both **people and assets** from those **available that day**, with a **double-booking warning**. At-a-glance staffing chips (`2/3` — amber when short, green when met).
- **AI roster import** — paste or upload the existing spreadsheet (Dutch labels `Vakantie` / `Vrij` / `Ziek`); a **downloadable sample CSV** is provided. *(Live AI.)*
- **Coverage Q&A** — ask the assistant "where is coverage thin this week?" *(Live AI.)*

---

## 8. Housing & occupancy

- The **BIP holding facility** modelled as units by **zone** — stables, kennels, aviary, aqua and isolation — each with its species and current occupant.
- **Between-shipment cleaning lifecycle** — Occupied → Dirty → Cleaning → Ready → Available, advanced in one click.
- **Utilisation** and per-status counts at a glance. *(Simulated data.)*

---

## 9. Animal registry

- **Per-animal welfare & compliance records** — microchip, passport, owner/agent, weight and linked shipment.
- **Vaccination tracking with expiry alerts** — "due soon" and "expired" flags per animal.
- **CITES flag** for regulated species (e.g. the reticulated python). Searchable by name, chip, species or owner. *(Simulated data.)*

---

## 10. Website enquiry form

- The **New booking → Customer enquiry** form mirrors the **fpas.com "Online Enquiry"** form field-for-field (Name, Phone, Email, free-text Enquiry, Terms & Conditions).
- On submit, **AI reads the free-text enquiry** and proposes the booking for ops to review — same form as the website, made smarter.

---

## 11. In-app requirements traceability

- A **Requirements & Traceability** page renders the FR / IR / NFR tables from the requirements document *inside the app*, with live **Built / Simulated / Future** status badges, a functional-coverage summary, and a **"Beyond the brief"** section listing the extras added on top.

---

## 12. How it maps to client inputs

| Client input | What we delivered |
|---|---|
| FPAS brand pack (colours + logo) | Full navy/yellow rebrand + logo + self-service theme/logo in Settings |
| fpas.com website | Enquiry form mirrored; colours/logo aligned to the brand guide |
| Staff-planning spreadsheet (Ganesh) | Roster board (week/month) + AI import of the sheet |
| CEO: "need leave calendar" | Leave request-and-approve calendar |
| CEO: "option to request resources" | Request/assign **staff and equipment** per shipment + editable resource register |
| CEO: staff hours / payroll | Timesheets (planned vs actual) + approve-and-export-to-payroll |
| Client ops-console mock (Ganesh) | Adopted its best ideas — sidebar layout, job detail drawer, loading-list builder, ops-stage lifecycle, booking-derived coverage, Housing, Animal registry — on top of our live-AI engine |
| "Can the portal be in Dutch?" | Full multilingual interface (EN/NL/DE/FR/ES) |
| Requirements document | In-app traceability page mirroring FR/IR/NFR |

---

## 13. Explicitly out of scope (production phase)

Production database & persistence, real authentication/security, live integrations (Flight Manager, NetSuite, regulators, partners), direct regulatory submission, migration from HCL Notes, and multi-site rollout. All shipment/staff/housing/animal data in the POC is fictional.

---

## Suggested slide outline (for the deck)

1. **Title** — First Point Animal Services · AI Job Manager POC (MoreYeahs)
2. **The problem** — manual re-keying, spreadsheet-run Amsterdam ops, easy-to-miss regulatory steps, no single view
3. **What we built** — one AI-assisted ops console covering the Amsterdam operation end to end
4. **Intake → AI extraction → validated booking** (the front door; 6 intake modes)
5. **Compliance readiness** — the encoded Amsterdam regulatory sequence (the differentiator)
6. **AI documents & the horse loading-list builder** — offloading list, delivery note, load list, HC/passport & SPX checks (all DRAFT)
7. **Dashboard & the ops-console UX** — sidebar layout, List / Board / Grid, filters, job detail drawer, calendar, insights, weather + welfare
8. **Reporting** — operations report, Excel & PDF export
9. **Staff planning, coverage, timesheets & payroll** — roster (week/month), booking-derived coverage, timesheets → payroll export, leave calendar, per-shipment staffing, AI import
10. **Housing & occupancy + Animal registry** — BIP units + cleaning lifecycle; per-animal vaccination/CITES records
11. **Branding, multilingual & configurability** — FPAS navy/yellow, logo/theme in Settings, five languages
12. **Requirements traceability & Real vs simulated** — how the POC maps to the brief; what's live (AI, reasoning, workflow, audit) vs mock (data, integrations, access control)
13. **What's next** — the production engagement (integrations, auth, database, migration, multi-site)

---

*Prepared for internal presentation use. All data in the POC is fictional; every external integration is simulated or planned.*
