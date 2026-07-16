# First Point Animal Services — AI Job Manager POC
### One-page executive summary

**In one line:** a working proof of concept that modernises FPAS's Amsterdam
live-animal operation into a single AI-assisted ops console — turning manual,
spreadsheet-and-email work into a guided, auditable workflow with staff
planning, housing and animal records around it, in the FPAS brand and five
languages, delivered in days.

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
- **AI-drafted documents & the horse loading-list builder.** Offloading list,
  delivery note, airline load list, regulatory notices and customer updates —
  all DRAFT for approval — plus a per-stall loading list with health-certificate,
  passport, groom and SPX-security checks and a live doc-gap alert.
- **Operations view.** Jobs as List / Board / Grid with a **job detail drawer**,
  filters, an ops-stage lifecycle, calendar, insights, an exportable report
  (Excel & PDF), and live Amsterdam arrival-day **weather with welfare flags**.
- **Staff planning, coverage & payroll** (built from FPAS's own spreadsheet). A
  weekly/monthly roster, **booking-derived coverage** that flags understaffed
  days, **timesheets** (planned vs. actual hours) with a payroll export, a leave
  request-and-approve calendar, an editable register of **people and equipment**,
  per-shipment staffing with double-booking alerts, and an AI import of the sheet.
- **Housing & occupancy** — the BIP holding units by zone with a cleaning
  lifecycle and utilisation — and an **animal registry** with microchip,
  passport, vaccination-expiry alerts and CITES flags.
- **FPAS-branded, multilingual and configurable.** An ops-console layout with a
  left sidebar in the navy/yellow identity; the interface runs in **English,
  Dutch, German, French and Spanish**; admins can change the theme and upload the
  logo from Settings.

**What's genuinely real vs simulated.** Real: the AI extraction, reasoning and
drafting; the encoded regulatory sequence; the operator workflow; the audit
trail; live weather. Simulated for the POC: all shipment/staff data, every
external integration (Flight Manager, NetSuite, regulators, partners), and
access control.

**Built directly on client input.** The FPAS brand pack, the fpas.com enquiry
form, the staff-planning spreadsheet, and the CEO's asks (leave calendar,
resource requests, staff hours/payroll) are all reflected in the app. When the
client shared their own ops-console mock, we adopted its strongest ideas — the
sidebar layout, job detail drawer, loading-list builder, housing and animal
registry — on top of our live-AI engine. An in-app traceability page maps every
requirement to Built / Simulated / Future.

**What's next (production phase).** Real database and authentication, live
integrations, direct regulatory submission, migration from HCL Notes, and
rollout to Melbourne, New Zealand and Chicago.

---

*All data in the POC is fictional; nothing is sent to any external party.*
