# First Point Animal Services — Demo Call Walkthrough & Live Script

*For presenting the deck and showing the POC live on a video call. Keep this on your phone or a second screen. Speak the lines naturally — don't recite.*

**SLIDE** = on the deck.  **LIVE** = share the app.

---

## The shape of the call (~25 minutes)

Don't present all 17 slides. Frame on three, show the real thing live, then close on three. The rest of the deck is the leave-behind.

- **Slides 1–3** — the problem and what you built (the console).
- **Go LIVE in the app** — the core: intake → readiness → compliance rules → documents → Operations Today → staff, then a quick switch to Dutch.
- **Slides 14, 16, 17** — what's real vs simulated, today vs production, and what's next.
- **Then questions.** (Slide 15, the architecture, only if a technical person is on the call.)

---

## Before the call (15 minutes)

- **Reset to a clean state first.** Use "Reset demo data", then hard-refresh, so you start from the samples. *(Do this before anything else — reset wipes any jobs you create.)*
- **Then warm up the AI and set up your demo jobs.** After the reset, run two or three jobs through extraction, readiness and documents so results load instantly instead of making you wait live. **If you want Beat 3 to show birds:** create a job now from the "CITES birds, CX0271" sample email, so a bird shipment is available to pick in the compliance-rules view.
- **Check Operations Today is populated.** Glance at the dashboard's "Operations Today" — you should see arrivals in the next 48h and at-risk items. If it looks empty, the seed dates have drifted past this week; ask MoreYeahs to re-seed to the current week (a 2-minute change).
- **Open both, side by side.** Deck full-screen in one window; the app in another, on a desktop (the full console only shows at desktop width).
- **Share the window, not your whole screen.** Share the deck window, then switch the shared window to the browser when you go live — so nothing else leaks.
- **Keep a safety net:** a job you've already run in a spare tab; and for the optional QR beat, your phone (it opens seeded records, not ones you create live).

---

## The walkthrough

### SLIDE 1 — Title
**Say:** Thanks for the time. You asked us to modernise the Job Manager with AI. Rather than just describe it, we built a working version — I'll frame it in three slides, then show it to you live.

### SLIDE 2 — The problem today
**Say:** Today the work is skilled but manual: details retyped from agent emails, the operation run on spreadsheets, the approval checklist mostly in people's heads, and no single place to see what's arriving or at risk.

### SLIDE 3 — What we built — the console
**Say:** What we built is one AI operations console: it reads the shipment, checks it against your real rules, drafts the paperwork, and shows the whole operation on one screen. Much of the layout came from your own mock — with our AI engine underneath. Let me show you the real thing.

---

### LIVE — Switch to the app now (share the browser window)

*Beats 1–6 are the core, then the Dutch switch to close. The extras are only if they're engaged and time allows.*

#### Beat 1 — It reads a messy email
**Do:** New booking → a sample agent email → Create & extract.
**Say:** A real agent email the tool has never seen — watch it fill the booking and flag what it's unsure of, instead of guessing.
**Flourish (if they're engaged):** open the French sample email ("3 chevaux, vol AF1240") and extract it too — it reads other languages just as well.

#### Beat 2 — Readiness: it won't be faked
**Do:** Open the horse job (EK9021) → Readiness → mark a step done, add a reference.
**Say:** The part a spreadsheet can't do. It knows the Amsterdam sequence, and it knows a Dutch approval isn't the same as a home-country vet — so it won't let a step be ticked off falsely.

#### Beat 3 — AI compliance rules, per species
**Do:** Open the compliance-rules view and pick a **non-horse** shipment — the companion-animals (dogs & cats) shipment that's already seeded, **or** the CITES-birds job if you created one in prep.
**Say:** Pick any shipment and it reasons exactly what that species and route need — by authority, with a reason for each. Every animal you move, not just horses.
*(Note: the seed includes horses and companion animals with bookings. Birds/fish are sample emails, not seeded jobs — create the CITES-birds job first if you want to show it here.)*

#### Beat 4 — Documents & the loading list
**Do:** Documents → the offloading list / delivery note → Save as PDF (point out DRAFT + the scan QR). Then the export job (EK9022) → Load plan — one horse's passport is already flagged unticked.
**Say:** It drafts the paperwork as a branded PDF, and for exports the loading list flags the one horse whose passport is still missing before it ever reaches the aircraft.

#### Beat 5 — Operations Today (the console)
**Do:** Go to Operations Today → point to the at-risk feed → click one item to jump to its record. Then switch to the **Jobs** view and click a row to open the quick-look **detail drawer**.
**Say:** This is where a coordinator lives — everything at risk, from every part of the operation, each linking straight to the record; and any job opens a quick-look drawer without leaving the list.
*(Operations Today items deep-link to the full job page; the slide-over drawer opens from the Jobs list/board/grid.)*

#### Beat 6 — Staff planning
**Do:** Staffing → roster coverage; (optional) a timesheet → approve → export to payroll.
**Say:** Your roster made live — assign the right people and equipment, get warned about clashes and thin days, and run timesheets through to a payroll export.

#### Close the demo — switch to Dutch
**Do:** Accessibility menu (top-right) → switch the interface to Dutch.
**Say:** And it's already in your brand, in five languages — here it is in Dutch.

#### Optional extras (only if engaged and time allows)
- **Housing & animals:** a holding unit's cleaning status (a couple are mid-cycle), and an animal's vaccination or CITES alert (there's a CITES-listed python and horses with expiring vaccinations).
- **Agent portal:** the outside view — submit and track a shipment, and see it land in the ops queue to accept. (Simulated.)
- **Scan a QR:** open a seeded job's QR with your phone to show the deep-link.
- **Reporting / Copilot:** export the report to Excel/PDF, or ask "what's at risk this week?"

---

### SLIDE 14 — What's real vs simulated (back to the deck)
**Say:** To be straight about what you saw: the AI, the compliance logic, the documents, the console and the weather are genuinely real. The data is fictional and the outside connections — airlines, customs, accounting — are simulated. Nothing is ever sent for real.

### SLIDE 16 — Today versus production
**Say:** Here it is side by side: real AI on fictional data today; a real database, real security, live connections and rollout in production. The gap is a scoped engagement, Amsterdam first.

### SLIDE 17 — What's next & close
**Say:** So production wires it into your systems, adds a mobile warehouse app, migrates you off the old platform, and rolls out to your other sites. A few things we'd confirm with you — and the best next step is a short session with your ops team to check we've got the rules exactly right. What questions can I answer?

### SLIDE 15 — Architecture (only if a technical person is on the call)
**Say:** If it's useful for your technical team: one slide on how it's built — a browser app that does most of the work, a thin layer that calls the AI safely, and the Claude API. No database in the POC; that comes with production.

---

## If the AI is slow or errors (on a call, don't go silent)

- **Keep talking.** Say: "This is running live against the AI, so give it a second." Click Retry once if the panel appears.
- **Still stuck?** "Let me show you one I ran earlier" — open the job you pre-ran. If it fully stalls, switch back to the deck, keep talking, and offer a recording afterwards.

---

## Say it simply (skip the jargon)

Use the plain version. You never have to say the technical term out loud.

| Term | What to say instead |
|------|---------------------|
| Schiphol | "the Amsterdam airport" (say it: "SKIP-ol"). |
| NVWA | "the Dutch animal-safety authority." |
| OKTF | "the horse import approval form." |
| TRACES / CITES / IATA LAR | "the EU import system," "the endangered-species rules," "the airline live-animal rules." |
| Loslijst | "the offloading list." |
| AWB / SPX | "the air waybill" (tracking number); "the security declaration." |
| dnata | "the airport ground handler." |

---

## Questions they might ask (short, honest answers)

**"Did you really build all this, or is it mocked up?"**
The app and the AI are genuinely built and working — the console, the compliance logic, the documents, staff planning, housing and animals. The data is fictional and it's not connected to your live systems yet.

**"Is it connected to our real systems?"**
Not yet — airlines, customs, accounting and partners are the next phase. Today it's a working prototype on made-up data.

**"Does the AI make the decisions?"**
No. It drafts and checks; your team approves every step. Nothing goes to an authority automatically.

**"What if the AI gets something wrong?"**
It flags what it's unsure of, a person reviews before anything is saved, and every step is logged.

**"Can we edit the staff, equipment, housing and animals?"**
Yes — they're registers you manage yourselves, and the roster imports your existing spreadsheet, Dutch labels and all.

**"How long and how much for the real thing?"**
The demo took days. The full system is a phased project we'd scope and price with you — months, not days — starting with Amsterdam.

**"Who moves us off the old system?"**
We do. Migrating the data and logic is core to what we do, and it's the part we'd plan most carefully.

**"Is our data safe / where would it live?"**
In production we'd use a proper secure database and confirm where Amsterdam data must legally sit. Today's demo stores nothing sensitive.

**"Can it run our other sites?"**
Yes — that's the final phase. The same platform for Melbourne, New Zealand and Chicago.

---

*If time's short, the essential core is beats 1, 2, 4 and 5, then the Dutch switch — drop beats 3 and 6 and the extras. Rehearse the core once end to end.*

*Prepared by MoreYeahs.*
