# First Point Animal Services — AI Job Manager POC
### One-page executive summary

**In one line:** a working proof of concept that modernises FPAS's Amsterdam
live-animal import operation into a single AI-assisted web app — turning
manual, spreadsheet-and-email work into a guided, auditable, single-screen
workflow, delivered in days.

---

**The problem today.** Shipment details are re-keyed by hand from agent
emails. The Amsterdam team runs largely on spreadsheets and individual
knowledge. The regulated import sequence has many touchpoints and is tracked
manually, so a missed or out-of-order step is a real risk. There is no single
view of what's arriving, what's at risk, and what's blocked.

**What we built.** One modern web application with an AI layer that covers the
Amsterdam import slice end to end:

- **Intake → AI extraction → validated booking.** The assistant reads real
  agent emails and PDFs (and the website enquiry form) and proposes a booking;
  a human confirms it. Six ways to start a job.
- **Compliance readiness (the differentiator).** The real Amsterdam regulatory
  sequence is encoded — OKTF, health certificate, **NVWA pre-approval**,
  inspection slot, Scope pre-registration, customs, offloading — and reported
  in plain language: what's outstanding, why, and how urgent, with a full
  audit trail.
- **AI-drafted documents.** Offloading list, delivery note, airline load list,
  regulatory notices and customer updates — all marked DRAFT for human
  approval.
- **Operations view.** Jobs as List / Board / Grid, filters, calendar,
  insights, an exportable report (Excel & PDF), and live Amsterdam
  arrival-day **weather with animal-welfare flags**.
- **Staff planning & resources** (built from FPAS's own spreadsheet). A weekly
  and monthly roster, a leave request-and-approve calendar, an editable
  register of **people and equipment**, and per-shipment staffing that assigns
  staff *and* assets from those available — with double-booking alerts and an
  AI import of the existing spreadsheet.
- **FPAS-branded and configurable.** The navy/yellow identity and logo
  throughout; admins can change the theme and upload the logo from Settings.

**What's genuinely real vs simulated.** Real: the AI extraction, reasoning and
drafting; the encoded regulatory sequence; the operator workflow; the audit
trail; live weather. Simulated for the POC: all shipment/staff data, every
external integration (Flight Manager, NetSuite, regulators, partners), and
access control.

**Built directly on client input.** The FPAS brand pack, the fpas.com enquiry
form, the staff-planning spreadsheet, and the CEO's asks (leave calendar,
resource requests) are all reflected in the app, and an in-app traceability
page maps every requirement to Built / Simulated / Future.

**What's next (production phase).** Real database and authentication, live
integrations, direct regulatory submission, migration from HCL Notes, and
rollout to Melbourne, New Zealand and Chicago.

---

*All data in the POC is fictional; nothing is sent to any external party.*
