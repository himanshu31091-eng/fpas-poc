# FPAS AI Job Manager POC — Master Brief
### Portable, self-contained brief for generating a demo script + presentation deck

> **How to use this file (read me first):** This is the single source of truth for the
> First Point Animal Services (FPAS) proof of concept. Paste the whole file into a
> fresh assistant and ask it to produce **(1) a live demo script** and **(2) an updated
> slide deck / PowerPoint outline**. It contains everything needed — the product, the
> current feature set, what's real vs simulated, the client story, and suggested
> structures for both deliverables. Nothing else is required. Keep the tone executive,
> honest about scope, and lead with the AI + compliance differentiator.

---

## 1. One-liner

A working proof of concept that turns FPAS's Amsterdam live-animal air-cargo operation
into a single, AI-assisted **operations console** — replacing manual, spreadsheet-and-email
work with a guided, auditable workflow, wrapped in the FPAS brand and available in five
languages. Built by MoreYeahs.

## 2. Who / what / where

- **Client:** First Point Animal Services (FPAS), Amsterdam Schiphol — live-animal air cargo (part of IRT Global Holdings). Handles **many species**: horses, cats, dogs, ornamental fish, insects/butterfly pupae, zoo animals, reptiles, birds.
- **Audience for the demo:** the client (incl. Ganesh, IRT Australia) and their operations leadership.
- **Deployed:** a live web app on Vercel. **Demo URL:** `‹PASTE THE VERCEL URL HERE›`
- **Status:** proof of concept — all data is fictional/seeded; AI calls are real. Best viewed on **desktop** (full sidebar console); hard-refresh after updates.

## 3. The problem it addresses

- Shipment details re-keyed by hand from agent emails.
- The Amsterdam operation runs largely on spreadsheets and individual knowledge.
- A regulated import/export sequence with many touchpoints, tracked manually — a missed or out-of-order step is a real risk.
- No single view of what's arriving, what's at risk, and what's blocked.

## 4. What it is (the shape)

A modern web app with an **AI layer**, presented as an **ops console**: a fixed left
**sidebar** (grouped: Operations · Assistant · Reference · Manage), a slim top bar, and a
calm, data-dense visual system in the FPAS navy (#231F5C) / yellow (#FFC40C) brand. Runs in
**English, Dutch, German, French, Spanish** (Accessibility menu, top-right).

---

## 5. Feature inventory (current)

Tags: **[Live AI]** = real Claude call · **[Real]** = genuinely works (no external system) · **[Sim]** = demonstrated with mock data / no live integration.

### Core workflow — the Amsterdam import/export slice
- **Multi-mode intake** — create a job from a sample agent email, an uploaded **PDF** (AI reads it), pasted text, the **website enquiry form**, a **CSV import**, or manual entry. **[Live AI]**
- **AI extraction** — pulls shipment fields from unstructured input, flags low-confidence values instead of guessing. **[Live AI]**
- **Human validation gate** — operator confirms extracted details before a job is created. **[Real]**
- **Import vs Export** job types with conditional fields; horse shipments follow the **OKTF** path. **[Real]**
- **Ops-stage lifecycle** — manual handling stage (Enquiry → Quoted → Confirmed → Docs pending → Ready → Departed → Arrived → Completed → Cancelled), shown alongside the auto-derived readiness status (kept separate so the compliance gate can't be bypassed). **[Real]**
- **Compliance-readiness gate (the differentiator)** — encodes the real Amsterdam regulatory sequence (OKTF → HC → **NVWA pre-approval** → inspection slot → Scope pre-registration → GDB to customs → offloading list) and reports, in plain language, what's outstanding, why, and how urgent. Only a Dutch-authority (NVWA) endorsement satisfies that step — not an origin-country vet. **[Real]**
- **Evidence & audit trail** per step (who/when/reference; required on critical steps). **[Real]**
- **Horse loading-list builder (export)** — per-stall contour (L/R/747), gender, weight, tackbag; per-horse **health-certificate & passport** ticks with a live "N of M missing" banner; accompanying **grooms**; the **SPX security declaration**; feeds an AI-drafted airline load list. **[Live AI]** (send is **[Sim]**)
- **AI-drafted documents** — offloading list (Loslijst) & delivery note, DRAFT for approval; download as **genuine branded PDFs** (navy header, DRAFT watermark, scan-to-open QR), generated in-browser. **[Live AI]** / **[Real]** PDF
- **AI compliance rules engine** — pick a shipment; the assistant reasons the documents/checks its species·route·direction require, each tagged with authority (NVWA / EU TRACES / CITES / IATA LAR / Customs / Airline), severity and rationale. **[Live AI]**
- **Regulatory submissions tracker** — AI-drafted notices recorded as submitted with a reference. **[Sim]**
- **AI customer movement updates.** **[Live AI]**
- **Flight Manager intake** — booked shipments arrive as "Pending" to accept into a job. **[Sim]**

### Operations console
- **"Operations Today" command view (default landing)** — one at-a-glance feed pulling from every module: outstanding compliance, HC/passport document gaps, vaccination expiries, roster coverage shortfalls, weather-welfare flags, arrivals in the next 48h — each links to the record. **[Real]**
- **Jobs register** — List (table), Kanban Board, Grid; multi-facet filters; ops-stage & staffing chips. **[Real]**
- **Job detail drawer** — click any job → right-side quick-look slide-over (facts, status/stage, welfare/weather/staffing chips) with "open full job". **[Real]**
- **Calendar / Insights / Report / Bin** — arrivals & departures calendar, analytics, an exportable **Operations Report (Excel .xlsx + PDF)**, soft-delete bin. **[Real]**
- **AI Copilot & daily briefing** — ask across all shipments; one-click "what's at risk"; answers render as formatted Markdown. **[Live AI]**
- **Live arrival-day weather** at Schiphol with a **welfare flag** (heat ≥27°C / cold ≤4°C), fed into the briefing. **[Real]** (Open-Meteo, mock fallback)

### Staff planning (from the FPAS roster spreadsheet + CEO asks)
- **Roster** — weekly/monthly availability board (working/off/leave/sick/holiday/training), Excel export. **[Real]**
- **Booking-derived coverage** — crew required by each day's shipments vs. rostered, flagging understaffed days. **[Real]**
- **Timesheets & payroll** — planned shifts vs. clock-in/out actuals, variance, and **approve → export to payroll** (real .xlsx). **[Real]**
- **Leave** request-and-approve calendar. **[Real]**
- **Resources** — editable register of **people and equipment**; per-shipment staffing assigns staff *and* assets from those available, with **double-booking alerts**. **[Real]**
- **AI roster import** — paste/upload the existing spreadsheet (Dutch labels Vakantie/Vrij/Ziek). **[Live AI]**

### Facility & animals
- **Housing & occupancy** — BIP holding units by zone (stables/kennels/aviary/aqua/isolation) with the between-shipment cleaning lifecycle (Occupied → Dirty → Cleaning → Ready → Available), live utilisation, and admin **add/edit/remove**. **[Real]** (mock data)
- **Animal registry** — per-animal microchip, passport, owner, linked shipment, weight; **vaccination-expiry alerts** (due-soon / expired); **CITES** flag; admin **add/edit/remove**. **[Real]** (mock data)

### External surface
- **Agent portal (demo)** — the external view agents/airlines use: submit a booking request, upload documents to a per-commodity checklist, confirm the AWB, track a derived status (Submitted → Docs pending → Ready). **[Sim]**
- **Website enquiry form** — mirrors the fpas.com "Online Enquiry" form; AI reads the free-text enquiry and proposes a booking. **[Live AI]**

### Platform / UX
- **QR deep links** — jobs, housing units and animals (and the document PDFs) carry a **QR that opens that exact record when scanned** (job → shipment, unit → highlighted in Housing, animal → filtered registry). **[Real]** *(Note: in the POC, data is per-browser/seeded, so cross-device scanning resolves seeded records; a record created live on one device isn't on another. Frame it as the hook for a future mobile warehouse app.)*
- **Multilingual UI** (EN/NL/DE/FR/ES). **[Real]**
- **Per-species commodity icons** (horse, fish, insect, paw) — reflects the full range of animals, not just horses. **[Real]**
- **Branding & configurability** — FPAS identity throughout; admins upload the logo & switch theme in Settings. **[Real]**
- **Accessibility** — labelled menu with larger text, high-contrast, dark mode, language switch. **[Real]**
- **Guided tour** — an 11-step walkthrough that navigates the app section by section. **[Real]**
- **Support** — a help widget with guide / Copilot / a lightweight **raise-and-track request log**. **[Sim]**
- **Role-based access** (Admin / Operations / Viewer) chosen at sign-in. **[Sim]**
- **Requirements & traceability** page — every requirement mapped to Built / Simulated / Future, plus a "Beyond the brief" list; exportable as PDF. **[Real]**
- **Engineering quality** — dependency-light (hand-rolled Excel/PDF writers; a small proven QR library); an automated **unit-test suite (Vitest, ~39 tests)** over the core logic incl. an independent QR decode check.

---

## 6. Real vs simulated (be explicit in the deck)

- **Genuinely real:** the AI (extraction, reasoning, document drafting, compliance-rules reasoning, Copilot); the encoded NVWA/OKTF regulatory sequence; the operator workflow; the audit trail; live weather; real Excel/PDF/QR generation; the ops console itself.
- **Simulated (production phase):** all shipment/staff/housing/animal data (browser-stored, seeded); every external integration (Flight Manager, NetSuite, regulators, ground handler, airline); access control; the agent portal and support desk.

## 7. Built on client input (the story)

- FPAS **brand pack** (navy/yellow + logo), the **fpas.com enquiry form**, the **staff-planning spreadsheet**, and the CEO's asks (**leave calendar, resource requests, staff hours/payroll**) are all reflected.
- The client shared their own **ops-console mock**; we validated it and adopted its strongest ideas — **sidebar layout, job detail drawer, loading-list builder, ops-stage lifecycle, booking-derived coverage, Housing and Animal registry** — on top of our live-AI engine (which the static mock didn't have).
- Client feedback actioned during review: moved to the **sidebar app layout**, labelled the **Accessibility** control, replaced the horse-only icon with **per-species icons**, made the **QR codes deep-link**, fixed **modal positioning**, and made the **guided tour** navigate section by section.

## 8. What's next (production phase)

Production database & authentication, live integrations (Flight Manager, NetSuite, regulators, partners), direct regulatory submission, a **mobile warehouse app** (scan-in/out, photos, signatures — where the QR pays off), migration from HCL Notes, and multi-site rollout (Melbourne / New Zealand / Chicago). Open questions: EU data residency, target cloud/SSO, integration priority, access to redacted real samples.

---

## 9. ASK #1 — Produce a live demo script

Create a **~10–12 minute live demo script** for presenting the deployed app to the client. Requirements:
- A logical narrative: **problem → intake/AI → compliance → documents → the console (Today) → staff/housing/animals → external portal → brand/languages → what's next.**
- For each beat: **what to click**, **what to say** (1–2 sentences, executive tone), and **the point it proves**.
- Call out the **"wow" moments**: AI extraction from a messy email; the compliance readiness gate refusing a faked step; the loading-list catching a missing passport; **Operations Today**; the **AI compliance rules** reasoning per species; **scanning a QR** to open a shipment; switching the UI to **Dutch**.
- Include **honesty beats** (what's real vs mock) and **presenter tips** (desktop, hard-refresh, seeded data resets on reload; QR cross-device caveat).
- End with a crisp close tying the POC to the production engagement.

## 10. ASK #2 — Update the presentation deck

Produce a **13–15 slide** executive deck outline (title + 3–5 bullets + a one-line "say this" per slide). Suggested spine:
1. Title — FPAS AI Job Manager POC (MoreYeahs)
2. The problem today
3. What we built (one AI-assisted ops console, end to end)
4. Intake → AI extraction → validated booking (6 modes)
5. Compliance readiness — the encoded Amsterdam sequence (**the differentiator**)
6. AI documents & the horse loading-list builder (branded PDF + scan QR)
7. AI compliance rules engine (species/route → required docs)
8. The ops console — **Operations Today**, sidebar layout, drawer, weather, QR
9. Reporting & export (Excel + PDF)
10. Staff planning, coverage, timesheets → payroll
11. Housing & occupancy + Animal registry
12. Agent portal (external surface)
13. Branding, multilingual & configurability
14. Requirements traceability & Real vs simulated
15. What's next (production engagement)

Keep it executive; lead with the differentiator (real AI + encoded compliance) and be explicit about real vs simulated. All data is fictional; every external integration is simulated or planned.
