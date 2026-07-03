# FPAS Job Manager — Amsterdam Import POC

A proof of concept for the FPAS modernization. It is a working multi-job **Job
Manager**: a dashboard of import shipments you can create, edit, search and
delete, each opened into a workspace that runs the **AI play the legacy HCL Notes
system cannot do** — reading an agent's email, turning it into a structured
import booking, checking it against Amsterdam's regulatory sequence, and drafting
the operational documents, with a human in the loop at every step.

Jobs persist in the browser (localStorage), so the dashboard survives a refresh.

> **This is a POC. Mock data only. No live integrations** (NetSuite, TRACES/NVWA,
> dnata, airline EDI). Nothing here submits anything to a regulator. That banner
> is shown in the app on purpose — do not remove it before a customer demo.

---

## Why this slice (and not a Job Manager rebuild)

Rebuilding the job list / New Booking / AWB screens would demonstrate nothing —
the Notes app already does that, and it shows zero AI. The genuine daily pain and
the defensible AI value live in **Amsterdam import document handling**:
re-keying agent emails and holding the pre-arrival checklist in someone's head.
This POC attacks exactly that, end to end, in five screens.

The centrepiece is the **compliance-readiness gate** (step 4). It encodes FPAS's
real import sequence (OKTF → HC endorsement → NVWA pre-approval → inspection slot
→ Scope pre-registration → GDB to customs → operational artifacts). That's the
part that says "we understand your business," not just "we can parse a PDF."

---

## Quick start

Requirements: Node.js 18.17+ (or 20+).

```bash
npm install
cp .env.local.example .env.local   # then add your key — see below
npm run dev
```

Open http://localhost:3000.

### AI is live-only

The AI screens (extraction, readiness reasoning, artifact drafting) call the
Claude API for real. Set your key in `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-6
```

There is **no mock-AI fallback** — if the key is missing or a call fails, the
affected panel shows a clean **"AI unavailable — retry"** state instead of fake
reasoning. The rest of the app does not depend on the API:

- The **dashboard, job list, search/filter, booking editing, and the readiness
  rail** all work offline. Job status and the outstanding-step count are computed
  deterministically from the encoded sequence in `lib/importSequence.ts`.
- Only the *generated content* — extracted fields, the reasoned readiness
  briefing, and the drafted documents — needs a live key.

On first run the dashboard is seeded with sample jobs at different stages so it's
demoable immediately; "Reset demo data" re-seeds. All data is fictional and lives
only in your browser's localStorage.

---

## The app

**Dashboard** (`/`) — every import job in one list, with stat cards (total, ready,
in progress, arriving ≤48h), search (AWB, agent, commodity, flight) and a status
filter. Create, open or delete jobs from here.

**New booking** (`/jobs/new`) — three ways to start a job:
- **From sample email** — pick one of the three curated agent emails and run AI
  extraction.
- **Paste email text** — paste any raw agent message and extract it.
- **Manual entry** — create a blank booking and key the fields in yourself.

**Job workspace** (`/jobs/[id]`) — one shipment, with five freely-navigable tabs:
1. **Source** — the original agent email or pasted text.
2. **Extraction** — AI-parsed fields next to the source, editable, per-field
   confidence. Low-confidence fields are flagged; confirming creates/updates the
   booking (the mandatory human gate).
3. **Booking** — the Amsterdam-specific booking fields, fully editable (shipping
   agent, commodity-driven OKTF path for horses, Govt Vet inspection time).
4. **Readiness** — the signature. The regulatory sequence as a vertical rail;
   outstanding steps carry a plain-language justification and urgency. "Mark done"
   resolves a step; a live AI briefing summarizes overall readiness.
5. **Artifacts** — offloading list (Loslijst) and delivery note drafted from the
   booking, watermarked DRAFT, copy/download.

### Suggested demo

- On the dashboard, point at the seeded jobs and the stat cards.
- Open the horse job that's **in progress** — walk the readiness rail, read a
  justification aloud (note the NVWA-vs-origin-vet distinction), "Mark done" on a
  step and watch the gate re-evaluate. Generate the documents.
- Back to the dashboard, **New booking → From sample email**, pick the incomplete
  Equine Logistics email, run extraction, correct the low-confidence arrival time,
  confirm — a new job appears in the list.
- Refresh the page to show persistence.
- Close on the disclosure: what's real (the AI extraction/reasoning/drafting) vs
  mocked (all integrations, all data; localStorage only).

---

## Tech stack

One Next.js app — frontend and backend live together; no separate server, no
database.

- **Frontend:** Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS.
  UI built from scratch — no component/icon/chart libraries (custom SVG icons,
  SVG charts, and CSS/SMIL animations). State is React Context only
  (`components/store.tsx`, `components/prefs.tsx`).
- **Backend:** Next.js Route Handlers (`app/api/*`) on the Node runtime, as
  serverless functions. They keep the API key server-side.
- **AI:** Anthropic **Claude API** via plain `fetch` (no SDK) in
  `lib/anthropic.ts`; model via `ANTHROPIC_MODEL` (default `claude-sonnet-4-6`),
  key via `ANTHROPIC_API_KEY`. Resilient JSON (retry + repair); reads PDFs.
- **Data:** browser **localStorage** (per-browser, survives refresh). No DB. All
  data is mock; every integration is mocked.
- **Auth / RBAC:** client-side only (demo role login) — not real security.
- **PDF export:** the browser's native print-to-PDF (no PDF library).
- **Dependencies:** essentially just `next`, `react`, `react-dom` at runtime
  (Tailwind/TypeScript are dev-only) — deliberately minimal.
- **Runtime / deploy:** Node 18.17+; deploys to Vercel as-is (set the two env
  vars). See `docs/POC-HANDOVER.md`.

---

## Project layout

```
app/
  layout.tsx                 fonts + store provider + app shell
  page.tsx                   dashboard route
  jobs/new/page.tsx          new-booking route
  jobs/[id]/page.tsx         job workspace route
  api/
    extract/route.ts         email/text -> structured fields (+ confidence)
    readiness/route.ts       booking -> reasoned briefing (items are deterministic)
    artifacts/route.ts       booking -> drafted documents
components/
  store.tsx                  jobs store: CRUD + per-job AI actions, localStorage
  AppShell.tsx               top nav + disclosure banner
  Dashboard.tsx              job list, stats, search/filter
  NewBooking.tsx             create from email / pasted text / manual
  JobWorkspace.tsx           per-job tabbed workspace
  Inbox.tsx                  EmailPicker (sample-email chooser)
  ExtractionReview / BookingForm /
  ComplianceReadiness / Artifacts
  ui.tsx                     shared primitives (Button, Card, badges, ErrorRetry…)
lib/
  types.ts                   domain model (incl. Job)
  jobs.ts                    job status derivation, seed data, localStorage
  importSequence.ts          the encoded Amsterdam regulatory sequence  <-- the IP
  mockData.ts                sample emails + shipping-agent contacts
  anthropic.ts               fetch-based Claude client (server only)
```

## Where to extend it

- **`lib/importSequence.ts`** is the highest-value file. Tighten the rules and
  justifications with a real FPAS ops person; that's what makes the readiness gate
  credible. The prompts in `api/readiness/route.ts` send these rules as ground
  truth.
- **`lib/mockData.ts`** — swap in real (redacted) agent emails to make the demo
  land harder.
- **Persistence** — jobs are stored in the browser's localStorage (key
  `fpas.jobs.v1`), so they survive a refresh but stay on one machine. To make
  jobs shared/multi-user, swap `loadJobs`/`saveJobs` in `lib/jobs.ts` for a real
  backend — the rest of the store is agnostic to where jobs live.

## Honest scope

Real in this POC: the AI extraction, the readiness reasoning against the encoded
sequence, the artifact drafting. Mocked: all data, and every integration. Off the
table entirely: autonomous submission to any regulator — a human validates every
AI output. Say so in the demo.
