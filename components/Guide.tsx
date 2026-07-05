"use client";

import { Button, Card, Eyebrow } from "./ui";
import {
  IconArrowRight,
  IconBox,
  IconCheckCircle,
  IconClipboard,
  IconClock,
  IconDoc,
  IconGrid,
  IconPlane,
  IconPlus,
  IconSparkles,
} from "./icons";

function download() {
  if (typeof window !== "undefined") window.print();
}

export function Guide() {
  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>How it works</Eyebrow>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">
            Using First Point Animal Services
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-ink-soft">
            A quick guide to what this tool does and how to operate it — from an
            incoming shipment to the drafted documents and customer updates.
          </p>
        </div>
        <span className="no-print">
          <Button onClick={download}>
            <IconDoc width={16} height={16} />
            Download PDF
          </Button>
        </span>
      </div>

      {/* What it is */}
      <Card className="print-plain mb-5 p-5">
        <h2 className="font-display text-lg font-bold text-ink">
          What this tool is
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
          FPAS Job Manager tracks every live-animal shipment (import and export)
          through Amsterdam Schiphol against the regulatory sequence. Its job is
          the work a spreadsheet can&apos;t: an <strong>AI assistant reads an
          agent&apos;s email</strong>, turns it into a structured booking, checks
          it against the compliance rules, drafts the operational documents and
          customer updates, and lets you <strong>ask questions about your whole
          operation</strong> — with a person approving every step. Nothing is
          ever submitted automatically.
        </p>
      </Card>

      {/* Before vs after */}
      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="print-plain border-line-strong p-5">
          <div className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">
            Before — HCL Notes today
          </div>
          <ul className="mt-2 space-y-1.5 text-[13.5px] text-ink-soft">
            <li>• Agent emails re-keyed by hand into the system.</li>
            <li>• Amsterdam runs on spreadsheets held in someone&apos;s head.</li>
            <li>• The pre-arrival checklist is manual and easy to miss.</li>
            <li>• No cross-shipment view; no drafting help.</li>
          </ul>
        </Card>
        <Card className="print-plain border-primary/30 p-5">
          <div className="font-mono text-[11px] uppercase tracking-wide text-primary">
            After — FPAS AI
          </div>
          <ul className="mt-2 space-y-1.5 text-[13.5px] text-ink">
            <li>• Email/PDF → structured booking in seconds.</li>
            <li>• Compliance gate encodes the rules, with an audit trail.</li>
            <li>• AI drafts documents, notices and customer updates.</li>
            <li>• Ask the copilot anything across the whole operation.</li>
          </ul>
        </Card>
      </div>

      {/* Getting around */}
      <Card className="print-plain mb-5 p-5">
        <h2 className="font-display text-lg font-bold text-ink">
          Getting around
        </h2>
        <p className="mt-1 text-[13.5px] text-ink-soft">
          The top bar has five areas:
        </p>
        <ul className="mt-2 grid grid-cols-1 gap-1.5 text-[13.5px] text-ink-soft sm:grid-cols-2">
          <li><strong>Dashboard</strong> — jobs (List / Board / Grid), plus Calendar, Insights and an exportable Report.</li>
          <li><strong>New booking</strong> — six ways to create a job.</li>
          <li><strong>Copilot</strong> — ask questions about your shipments.</li>
          <li><strong>How it works</strong> — this page.</li>
          <li><strong>Requirements</strong> — how the POC traces to the brief.</li>
        </ul>
        <p className="mt-2 text-[13px] text-ink-faint">
          You sign in by picking a role on the landing page. Top-right: a{" "}
          <strong>notifications bell</strong>, the <strong>♿ accessibility</strong>{" "}
          menu, and your <strong>account menu</strong> (dark mode, Settings,
          Contacts, and sign out / switch role). Press{" "}
          <span className="font-mono text-[12px]">Ctrl/⌘ K</span> for the command
          palette, a <strong>Take a tour</strong> button in the top bar, and the{" "}
          <strong>help button</strong> (bottom-right) for the guide or support.
        </p>
      </Card>

      {/* Ways to create a job */}
      <Card className="print-plain mb-5 p-5">
        <h2 className="font-display text-lg font-bold text-ink">
          Six ways to start a job
        </h2>
        <ol className="mt-2 grid grid-cols-1 gap-1.5 text-[13.5px] text-ink-soft sm:grid-cols-2">
          <li>1. <strong>From a sample email</strong> → AI extracts the fields.</li>
          <li>2. <strong>Upload a PDF</strong> → the AI reads the document itself.</li>
          <li>3. <strong>Paste email text</strong> → AI extracts the fields.</li>
          <li>4. <strong>Customer enquiry form</strong> (the website form).</li>
          <li>5. <strong>Import CSV</strong> — a whole spreadsheet at once.</li>
          <li>6. <strong>Manual entry</strong> — a blank booking.</li>
        </ol>
        <p className="mt-2 text-[13px] text-ink-faint">
          The AI reads <strong>other languages</strong> too (there&apos;s a French
          sample email). Booked <strong>horse</strong> shipments also arrive
          automatically from Flight Manager on the dashboard as “Pending” — click{" "}
          <em>Accept</em> to turn one into a job.
        </p>
      </Card>

      {/* The screens / flow */}
      <div className="mb-5">
        <h2 className="mb-3 font-display text-lg font-bold text-ink">
          The screens
        </h2>
        <div className="stagger space-y-2.5">
          <Step
            icon={IconGrid}
            title="Dashboard"
            body="Every job with search, filters, live stats, mock flight-status chips, and the live Amsterdam arrival-day weather (with a welfare flag when it's too hot or cold). View jobs as a List, a Kanban Board (create a job inline from the Board), or a Grid. Switch views: Jobs, Calendar (arrivals & departures), Insights (charts), Report (export to Excel or PDF), and Bin (deleted jobs — restore or delete forever). The Flight Manager “Pending” queue sits at the top, and one button gives you an AI daily briefing of what's at risk — weather included."
          />
          <Step
            icon={IconPlus}
            title="New booking"
            body="Create a job the six ways above. AI-based ones (email/paste/PDF) run extraction; enquiry/manual/CSV create the booking directly."
          />
          <Step
            icon={IconSparkles}
            title="Extraction (AI)"
            body="The assistant pulls fields out of the message with a confidence level on each. Low-confidence values are flagged; fix them and confirm to create the booking."
          />
          <Step
            icon={IconBox}
            title="Booking"
            body="The shipment details, fully editable. Choose Import or Export: Import shows Govt Vet inspection time; Export shows warehouse arrival time. Horse shipments pick up the OKTF path automatically."
          />
          <Step
            icon={IconPlane}
            title="Readiness (import) / Load plan (export)"
            body="Import: a live compliance rail — mark each step done with a reference for the audit trail (critical steps require one). Export: build the per-stall load plan (stall/gender/weight) and send the AI-drafted load list to the airline."
          />
          <Step
            icon={IconCheckCircle}
            title="Submissions"
            body="Track regulatory notifications across the lifecycle. Draft each with AI, then record it as submitted with a reference."
          />
          <Step
            icon={IconSparkles}
            title="Update"
            body="Draft a movement update to the customer/agent with AI, from the shipment's current state. Copy it and mark it sent."
          />
          <Step
            icon={IconDoc}
            title="Artifacts"
            body="The offloading list (Loslijst) and delivery note, drafted from the booking. Copy, download, or Save as a branded FPAS PDF. Everything is watermarked DRAFT."
          />
          <Step
            icon={IconClock}
            title="Timeline"
            body="The full lifecycle of the shipment, plus a one-click “Print job pack (PDF)” — a clean dossier of the booking and its activity."
          />
          <Step
            icon={IconSparkles}
            title="Copilot"
            body="Ask questions across all jobs — “what's arriving in 48 hours?”, “what's blocking the EQUITRANS job?”, or “draft the NVWA notice.” It only sees your jobs; it's decision-support, not an autonomous agent."
          />
          <Step
            icon={IconClipboard}
            title="Requirements & Traceability"
            body="A live, in-app map of how the POC covers the FPAS brief: every requirement with a Built / Simulated / Future status and a coverage summary, plus the extras added on top. Export it as a PDF."
          />
        </div>
      </div>

      {/* How to operate */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="print-plain p-5">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <IconArrowRight width={16} height={16} />
            </span>
            <h3 className="font-display text-base font-bold text-ink">
              Walkthrough — an import
            </h3>
          </div>
          <ol className="mt-3 space-y-2 text-[13.5px] leading-relaxed text-ink-soft">
            <li>1. New booking → pick a sample email → <em>Create &amp; extract</em>.</li>
            <li>2. On Extraction, correct any flagged field → <em>Confirm &amp; create booking</em>.</li>
            <li>3. Open Readiness. <em>Mark done</em> on a step, add the reference (e.g. NVWA approval no.).</li>
            <li>4. When all steps clear, <em>Draft operational documents</em>.</li>
            <li>5. Optionally draft a customer <em>Update</em>, then open <em>Timeline → Print job pack</em>.</li>
          </ol>
        </Card>

        <Card className="print-plain p-5">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <IconPlane width={16} height={16} />
            </span>
            <h3 className="font-display text-base font-bold text-ink">
              Walkthrough — an export
            </h3>
          </div>
          <ol className="mt-3 space-y-2 text-[13.5px] leading-relaxed text-ink-soft">
            <li>1. Open an Export job (or set Booking → Export).</li>
            <li>2. On Load plan, add each stall — animal, gender, weight.</li>
            <li>3. Pick the airline (e.g. Etihad → six addresses) → <em>Draft &amp; send to airline</em>.</li>
            <li>4. Use <em>Submissions</em> to draft &amp; record regulatory notices.</li>
            <li>5. Draft a customer <em>Update</em> and print the <em>Timeline</em> job pack.</li>
          </ol>
        </Card>
      </div>

      {/* Good to know */}
      <Card className="print-plain mt-4 p-5">
        <h3 className="font-display text-base font-bold text-ink">
          Good to know
        </h3>
        <ul className="mt-3 grid grid-cols-1 gap-2 text-[13.5px] leading-relaxed text-ink-soft sm:grid-cols-2">
          <li>
            <strong>Human in the loop.</strong> The AI drafts and reasons; you
            approve. Nothing is sent to a regulator or airline for real.
          </li>
          <li>
            <strong>Audit trail.</strong> Marking a step done or a notice sent
            records who, when, and the reference.
          </li>
          <li>
            <strong>Statuses.</strong> New → Needs review → In progress → Ready,
            shown as a coloured tag on every job.
          </li>
          <li>
            <strong>It saves automatically.</strong> Jobs persist in your browser
            and survive a refresh. “Reset demo data” restores the samples.
          </li>
          <li>
            <strong>Live AI.</strong> The AI screens call Claude live; if a call
            fails you&apos;ll see a clean “retry” panel, never a broken screen.
          </li>
          <li>
            <strong>Spreadsheet migration.</strong> Import CSV turns an existing
            spreadsheet into jobs in one step.
          </li>
          <li>
            <strong>Arrival weather.</strong> Each job shows the live Amsterdam
            arrival-day forecast with a welfare flag when it&apos;s too hot or
            cold for live animals; the daily briefing factors it in.
          </li>
          <li>
            <strong>Traceability.</strong> The Requirements page maps the POC to
            the brief in-app — Built / Simulated / Future — so scope is explicit.
          </li>
          <li>
            <strong>Print to PDF.</strong> The guide and each job&apos;s Timeline
            can be saved as a PDF from your browser.
          </li>
          <li>
            <strong>Photos, optional.</strong> Jobs show an on-brand commodity
            thumbnail; drop licensed images into <span className="font-mono text-[12px]">public/animals/</span>{" "}
            and real photos appear automatically.
          </li>
          <li>
            <strong>Roles.</strong> Sign in as Admin, Operations or Viewer on the
            landing page; switch by signing out. Viewer is read-only.
          </li>
          <li>
            <strong>Assignments.</strong> Assign a job to a staff member and use
            the “My jobs” filter on the dashboard.
          </li>
          <li>
            <strong>Command palette.</strong> Press Ctrl/⌘ K to jump to any job,
            page or action.
          </li>
          <li>
            <strong>Themes.</strong> Settings → Appearance offers six accent
            themes plus dark mode; the choice applies everywhere and is
            remembered on this device.
          </li>
          <li>
            <strong>Accessibility.</strong> The ♿ button in the top bar offers
            larger text and high-contrast mode, plus a dark theme — remembered on
            this device.
          </li>
          <li>
            <strong>Take a tour.</strong> The button in the top bar walks new
            users through the whole flow, spotlighting each section.
          </li>
          <li>
            <strong>Proof of concept.</strong> All data is fictional and every
            integration is mocked — this is a demo, not a production system.
          </li>
        </ul>
      </Card>

      <p className="mt-5 text-center font-mono text-[11px] text-ink-faint">
        Tip: “Download PDF” opens your browser&apos;s print dialog — choose “Save
        as PDF” as the destination.
      </p>
    </div>
  );
}

function Step({
  icon: Icon,
  title,
  body,
}: {
  icon: (p: { width?: number; height?: number }) => JSX.Element;
  title: string;
  body: string;
}) {
  return (
    <Card className="print-plain flex items-start gap-3 p-4">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-primary">
        <Icon width={18} height={18} />
      </span>
      <div>
        <div className="text-sm font-semibold text-ink">{title}</div>
        <p className="mt-0.5 text-[13.5px] leading-relaxed text-ink-soft">
          {body}
        </p>
      </div>
    </Card>
  );
}
