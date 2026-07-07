# First Point Animal Services — AI Job Manager POC
### Feature summary (for presentation prep)

**What it is:** a single modern web application with an AI services layer that
demonstrates the FPAS Amsterdam live-animal **import** workflow end to end —
from intake, through AI extraction and a human-validated booking, to a
compliance-readiness assessment, AI-drafted operational documents, and now a
full **staff-planning / resource** module. Built by MoreYeahs.

- **Stack:** Next.js (App Router) + TypeScript + Tailwind, AI via the Claude API. No external SDKs; runs offline for everything except the live AI calls. Data is mock and stored in the browser (localStorage). Deployed on Vercel.
- **Status legend:** **Built** = working, live AI where relevant · **Simulated** = demonstrated with mock data / no live integration · **Future** = planned, not in POC.

---

## 1. Core workflow (the Amsterdam import slice)

- **Multi-mode intake** — create a job from a sample agent email, an uploaded **PDF** (AI reads the document), pasted text, the **website enquiry form**, a **CSV import**, or manual entry.
- **AI extraction** — pulls shipment fields from unstructured input and flags low-confidence values instead of guessing. *(Live AI.)*
- **Human validation gate** — the operator reviews and confirms extracted details before a job is created.
- **Import vs Export job types** with conditional fields (import → government vet inspection time; export → warehouse arrival time). Commodity auto-fills; **horse shipments follow the OKTF path**.
- **Compliance-readiness gate** — encodes the real Amsterdam regulatory sequence (OKTF → HC → **NVWA pre-approval** → inspection slot → Scope pre-registration → GDB to customs → offloading list) and reports, in plain language, what's outstanding, why, and how urgent. *This is the core differentiator.*
- **NVWA vs origin-vet distinction** — only a Dutch-authority (NVWA) endorsement satisfies that step; an origin-country vet endorsement does not.
- **Evidence & audit trail** — each step records who marked it done, when, and a reference (required on critical steps).
- **Operational documents** — AI-drafted **offloading list (Loslijst)** and **delivery note**, marked DRAFT for human approval; export as branded PDF. *(Live AI.)*
- **Export load plan** — per-stall list (stall / gender / weight); AI-drafted **airline load list**. *(Load-list send is Simulated.)*
- **Regulatory submissions tracker** — AI-drafted notices recorded as submitted with a reference. *(Simulated.)*
- **AI customer movement updates.** *(Live AI.)*
- **AI Copilot & daily briefing** — ask questions across all shipments; one-click "what's at risk right now" briefing. *(Live AI.)*
- **Flight Manager intake** — booked horse shipments arrive as "Pending" for the operator to accept into a job. *(Simulated.)*
- **Role-based access** — Admin / Operations / Viewer chosen at sign-in; gates editing. *(Simulated.)*

---

## 2. FPAS branding (from the brand pack)

- Adopted the **First Point Animal Services** identity across the whole app: brand **navy `#231F5C`** as the primary UI colour, brand **yellow `#FFC40C`** as the accent (navy-on-yellow CTAs), and the **"F" mark + wordmark** in the top bar, sign-in, documents and favicon.
- Strict two-colour palette — no off-brand tints.
- **Self-service in Settings:** admins can **upload/replace the logo** and **switch the colour theme** — branding is configurable, not hard-coded.

---

## 3. Dashboard, views & filtering

- **Three job views:** **List**, **Kanban Board** (grouped by status), and **Grid** — one toggle, applies everywhere.
- **Create a job from the Kanban board** — quick-create modal, plus a link to the full intake.
- **Multi-facet Filters** — Job type, Commodity, Arrival window (≤48h / this week / overdue), and Agent, combined with search + status chips.
- **Calendar** of arrivals & departures, **Insights** analytics, and a **Bin** (soft-delete / restore).
- **Per-job timeline** and a **printable job pack**.

---

## 4. Reporting & export

- **Operations Report** view — summary tiles, per-job table, and outstanding-steps breakdown.
- **Export to Excel (.xlsx)** and **Export to PDF** — a genuine multi-sheet workbook, generated in the browser with no external library.

---

## 5. Arrival-day weather (live)

- Each job shows the **live Amsterdam Schiphol forecast** for its arrival day (Open-Meteo; graceful mock fallback offline).
- **Welfare flag** — heat (≥27°C) or cold (≤4°C) is highlighted, tying weather to live-animal welfare and airline temperature embargoes.
- Weather is fed into the **AI daily briefing** so it can flag weather-driven risk.

---

## 6. Staff planning & resources (from the FPAS roster spreadsheet + CEO asks)

- **Roster / availability board** — weekly grid of who's working (with times), off, on leave, sick, on holiday or training, matching the spreadsheet. **Week and Month views**, per-day availability counts, and **Export to Excel**.
- **Leave calendar** — request leave → **admin approve/decline**; approved leave updates the roster and availability automatically.
- **Resources register (add your own):**
  - **Team** — add / remove staff members (the roster team is editable).
  - **Equipment & assets** — trucks, crates, stalls, inspection bays, cold storage (name + type + quantity).
- **Per-shipment staffing** — on each job, request N staff and assign both **people and assets** from those **available that day**, with a **double-booking warning** if someone/something is already committed to another shipment arriving the same day.
- **At-a-glance staffing chips** on job rows, cards and detail (e.g. `2/3` — amber when short, green when met).
- **AI roster import** — paste or upload the existing spreadsheet (Dutch labels `Vakantie` / `Vrij` / `Ziek` included); a **downloadable sample CSV** is provided. *(Live AI.)*
- **Coverage Q&A** — ask the assistant "where is coverage thin this week?" / "who can cover a 07:00 arrival Friday?". *(Live AI.)*

---

## 7. Website enquiry form

- The **New booking → Customer enquiry** form mirrors the **fpas.com "Online Enquiry"** form field-for-field (Name, Phone, Email, free-text Enquiry, Terms & Conditions).
- On submit, **AI reads the free-text enquiry** and proposes the booking for ops to review — same form as the website, made smarter.

---

## 8. In-app requirements traceability

- A **Requirements & Traceability** page renders the FR / IR / NFR tables from the requirements document *inside the app*, with live **Built / Simulated / Future** status badges, a functional-coverage summary, and a **"Beyond the brief"** section listing the extras added on top.

---

## 9. Usability, accessibility & performance

- **Decluttered, mobile/tablet-responsive top bar** with a hamburger menu; the whole app degrades cleanly to phone/tablet widths.
- **Six colour themes** (FPAS default) + **dark mode**; larger-text and high-contrast accessibility options.
- **Guided tour** and a full **"How it works"** guide, both kept in sync with every feature.
- **AI reliability tuning** — per-call timeouts, bounded retries with in-place JSON repair, higher output limits, and prompt caching (prevents the earlier 504 timeouts and lowers latency/cost).

---

## 10. How it maps to client inputs

| Client input | What we delivered |
|---|---|
| FPAS brand pack (colours + logo) | Full navy/yellow rebrand + logo + self-service theme/logo in Settings |
| fpas.com website | Enquiry form mirrored; colours/logo aligned to the brand guide |
| Staff-planning spreadsheet (Ganesh) | Roster board (week/month) + AI import of the sheet |
| CEO: "need leave calendar" | Leave request-and-approve calendar |
| CEO: "option to request resources" | Request/assign **staff and equipment** per shipment + editable resource register |
| Requirements document | In-app traceability page mirroring FR/IR/NFR |

---

## 11. Explicitly out of scope (production phase)

Production database & persistence, real authentication/security, live integrations (Flight Manager, NetSuite, regulators, partners), direct regulatory submission, migration from HCL Notes, and multi-site rollout. All shipment/staff data in the POC is fictional.

---

## Suggested slide outline (for the deck)

1. **Title** — First Point Animal Services · AI Job Manager POC (MoreYeahs)
2. **The problem** — manual re-keying, spreadsheet-run Amsterdam ops, easy-to-miss regulatory steps, no single view
3. **What we built** — one AI-assisted app covering the Amsterdam import slice end to end
4. **Intake → AI extraction → validated booking** (the front door; 6 intake modes)
5. **Compliance readiness** — the encoded Amsterdam regulatory sequence (the differentiator)
6. **AI documents & submissions** — offloading list, delivery note, load list, notices (all DRAFT)
7. **Dashboard** — List / Board / Grid, filters, calendar, insights, weather + welfare
8. **Reporting** — operations report, Excel & PDF export
9. **Staff planning & resources** — roster (week/month), leave calendar, resource register, per-shipment staffing with double-booking checks, AI import
10. **Branding & configurability** — FPAS navy/yellow, logo, themes, logo upload in Settings
11. **Requirements traceability** — how the POC maps to the brief (Built / Simulated / Future)
12. **Real vs simulated** — what's genuinely live (AI, reasoning, workflow, audit) vs mock (data, integrations, access control)
13. **What's next** — the production engagement (integrations, auth, database, migration, multi-site)

---

*Prepared for internal presentation use. All data in the POC is fictional; every external integration is simulated or planned.*
