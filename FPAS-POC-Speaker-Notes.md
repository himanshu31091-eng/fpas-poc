# First Point Animal Services — AI Job Manager POC
### Slide-by-slide speaker notes

Notes for the 13-slide deck. Each slide: what to show, talking points, and a
one-line "say this". Keep the tone executive; demo live where you can.

---

**Slide 1 — Title**
*Show:* First Point Animal Services · AI Job Manager POC · by MoreYeahs (navy/yellow brand).
- Set expectations: this is a working POC on fictional data, built in days.
- **Say this:** "This is a live, working proof of concept of a modern Job Manager for the Amsterdam operation — everything you'll see runs in the browser."

**Slide 2 — The problem today**
*Show:* current-state bullets.
- Shipment details re-keyed by hand from agent emails.
- Amsterdam runs on spreadsheets + individual knowledge.
- Regulated sequence tracked manually → missed/out-of-order steps are a real risk.
- No single view of what's arriving / at risk / blocked.
- **Say this:** "The work is skilled and well-run today, but it's manual and fragile — that's what we set out to de-risk."

**Slide 3 — What we built**
*Show:* one app, the end-to-end arc (intake → readiness → documents).
- A single AI-assisted web app covering the Amsterdam import slice end to end.
- Preserves the mature process; modernises the tooling around it.
- **Say this:** "One screen, one flow — intake to compliance to paperwork — with AI doing the reading and drafting, and a human always in control."

**Slide 4 — Intake → AI extraction → validated booking**
*Show:* New booking; pick a sample email or the enquiry form; run extraction; confirm.
- Six intake modes: email, PDF, paste, website enquiry, CSV, manual.
- AI extracts fields and flags low-confidence values rather than guessing.
- Human validation gate before a job is created.
- **Say this:** "The assistant reads the agent's email or PDF and fills the booking — the operator just checks and confirms."

**Slide 5 — Compliance readiness (the differentiator)**
*Show:* a horse job's Readiness tab.
- The real Amsterdam sequence is encoded: OKTF → HC → NVWA pre-approval → inspection slot → Scope → customs → offloading.
- Plain-language "what's outstanding, why, how urgent" + audit trail (who/when/reference).
- Only **NVWA** pre-approval satisfies that step — not an origin-country vet.
- **Say this:** "This is where the app understands FPAS's business, not just parses text — it knows the regulatory order and won't let a step be faked."

**Slide 6 — AI documents & submissions**
*Show:* Documents tab (offloading list + delivery note), load list, notices.
- AI-drafts the offloading list (Loslijst), delivery note, airline load list, regulatory notices, customer updates.
- Everything is marked DRAFT for human approval; exportable as branded PDF.
- **Say this:** "The paperwork drafts itself from the booking — staff review and send, they don't start from a blank page."

**Slide 7 — Dashboard & operations view**
*Show:* List / Board / Grid toggle, filters, calendar, insights, weather chip.
- Three views of the same jobs; multi-facet filters (type, commodity, arrival window, agent).
- Live Amsterdam arrival-day **weather with welfare flags** (heat/cold), fed into the AI briefing.
- One-click AI daily briefing of what's at risk.
- **Say this:** "A real ops console — filter to 'overdue horse imports', see the weather for arrival day, and get an AI risk briefing in one click."

**Slide 8 — Reporting & export**
*Show:* Report view → Export to Excel and PDF.
- Operations report: summary, per-job table, outstanding steps.
- Genuine Excel workbook + PDF, generated in the browser.
- **Say this:** "An exec-ready report the team can export to Excel or PDF whenever they need it."

**Slide 9 — Staff planning & resources**
*Show:* Staffing area — roster (week/month), leave, Resources, a job's Staffing tab.
- Built from FPAS's own roster spreadsheet + the CEO's asks.
- Roster (week & month, Excel export), leave request/approve, editable register of **people and equipment**.
- Per-shipment staffing assigns staff *and* assets from those available, with **double-booking alerts**; AI imports the existing spreadsheet.
- **Say this:** "We took the Amsterdam planning spreadsheet and made it live — assign the right people and equipment to each shipment, and the app warns you about clashes."

**Slide 10 — Branding & configurability**
*Show:* the FPAS navy/yellow app; Settings → theme + logo upload.
- Full First Point Animal Services identity (navy #231F5C, yellow #FFC40C, F-mark logo).
- Admins can change the theme and upload the logo themselves — not hard-coded.
- **Say this:** "It already looks like FPAS, and you can re-brand or re-theme it yourselves from Settings."

**Slide 11 — Requirements traceability**
*Show:* the in-app Requirements page (Built / Simulated / Future).
- Every requirement from the brief mapped in-app, with a coverage summary and a "beyond the brief" section.
- **Say this:** "The app reports its own coverage against your requirements — so scope is explicit."

**Slide 12 — Real vs simulated**
*Show:* the honesty split.
- Real: AI extraction/reasoning/drafting, the encoded regulatory sequence, the operator workflow, the audit trail, live weather.
- Simulated: all data, every external integration, access control.
- **Say this:** "We're deliberately clear about what's genuinely working versus what's mocked for the demo."

**Slide 13 — What's next**
*Show:* the production roadmap.
- Production database & auth, live integrations (Flight Manager, NetSuite, regulators, partners), direct regulatory submission, HCL Notes migration, multi-site rollout (Melbourne / NZ / Chicago).
- Open questions: EU data residency, target cloud/SSO, integration priority order, access to redacted real samples.
- **Say this:** "This POC is the foundation — the production engagement wires it into the real systems and rolls it out across sites."

---

*Demo tips:* run it live on the deployed URL; if the AI is slow, screens fail gracefully with a retry. Have one horse import (for readiness/OKTF), one companion-animal shipment (fully ready), and the Staffing area pre-loaded.
