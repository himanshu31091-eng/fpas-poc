# FPAS AI Job Manager POC — What's new
### One-page changelog for the team (since the last deck)

Everything below is **live on the deployed POC**. Data stays mock and browser-stored;
the AI calls are real. Grouped by theme, most demo-worthy first.

---

**Experience / UX**
- **Ops-console redesign.** Replaced the top nav with a fixed **left sidebar** (grouped: Operations · Assistant · Reference · Manage), a slim top bar, and a calmer, data-dense visual system — in the FPAS navy/yellow brand. Directly answers the client's "apps use a side nav" feedback.
- **"Operations Today" command view.** The dashboard now opens on a single at-a-glance feed that pulls from every module — outstanding compliance, HC/passport document gaps, vaccination expiries, roster coverage shortfalls, weather-welfare flags, arrivals in the next 48h — each linking to the job or module concerned.
- **Job detail drawer.** Clicking any job opens a right-side **quick-look slide-over** (key facts, status/stage, welfare/weather/staffing chips) with an "Open full job" action.
- **Register table.** The jobs **List** view is now a proper console table — column header, hairline-divided rows, mono data.
- **Multilingual interface.** The whole chrome runs in **English, Dutch, German, French and Spanish**, switchable from the Accessibility menu and remembered per device.
- **Formatted AI answers.** Copilot, the daily briefing and coverage Q&A now render clean Markdown instead of raw text.
- **QR deep links.** Jobs, housing units and animals carry a **QR code that opens that exact record when scanned** (job → shipment, unit → highlighted in Housing, animal → filtered registry); the document PDFs carry the shipment's QR too.

**New modules**
- **Housing & occupancy.** BIP holding units by zone (stables / kennels / aviary / aqua / isolation) with the between-shipment cleaning lifecycle (Occupied → Dirty → Cleaning → Ready → Available) and live utilisation.
- **Animal registry.** Per-animal microchip, passport, owner, linked shipment and weight, with **vaccination-expiry alerts** (due-soon / expired) and a **CITES** flag.
- **Timesheets & payroll** (in Staffing). Planned shifts vs. **clock-in/out actuals**, per-shift variance, and **approve → export to payroll** as a real Excel workbook.
- **AI compliance rules engine.** Pick a shipment and the assistant reasons the documents & checks its species/route/direction require — each with the authority (NVWA / EU TRACES / CITES / IATA LAR / Customs / Airline), a severity and a rationale.
- **Agent portal.** A demo of the external surface: agents submit a booking request, upload documents to a per-commodity checklist, confirm the AWB, and track status.

**Workflow depth**
- **Horse loading-list builder.** Per-stall contour (L/R/747), gender, weight, a tackbag toggle, and per-horse **health-certificate & passport ticks** with a live doc-gap banner; accompanying **grooms** and the **SPX security declaration**; feeds the AI-drafted airline load list.
- **Ops-stage lifecycle.** A manual handling stage (Enquiry → … → Completed) on each job, shown alongside the auto-derived regulatory-readiness status.
- **Booking-derived roster coverage.** The roster computes crew required by each day's shipments vs. who's rostered on, flagging **understaffed days**.
- **Real branded PDF documents.** The offloading list and delivery note download as genuine FPAS-branded PDFs (navy header, DRAFT watermark, shipment QR) — generated in the browser.

**Built on the client's own ops-console mock**
When the client shared their prototype, we validated it and adopted its strongest ideas — the **sidebar layout, job detail drawer, loading-list builder, ops-stage lifecycle, booking-derived coverage, Housing and Animal registry** — on top of our live-AI engine (email/PDF extraction, the NVWA/OKTF compliance sequence, real document drafting) that the static mock doesn't have.

---

**How it was delivered.** Each item shipped as its own reviewed change: TypeScript + production build verified, then merged to `main` and deployed to Vercel. The in-app **How it works** guide and guided tour were kept in sync throughout.

**Still simulated (unchanged, production phase).** All shipment/staff/housing/animal data, every external integration (Flight Manager, NetSuite, regulators, partners), and access control.

*All data in the POC is fictional; every external integration is simulated or planned.*
