"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "./store";
import { usePrefs } from "./prefs";
import { EmailPicker } from "./Inbox";
import { Button, Card, Eyebrow } from "./ui";

type Mode = "email" | "pdf" | "paste" | "enquiry" | "csv" | "manual";

const CSV_SAMPLE = `awb,agent,commodity,type,animalCount,flight,origin,arrivalDate,arrivalTime
176-10011002,IRT AUS,Live horses,import,3,EK9021,DXB,2026-07-11,06:30
157-20033044,SKYE PET TRAVEL,Companion animals,import,8,QR273,DOH,2026-07-12,07:15
176-30055066,EQUINE LOGISTICS,Live horses,export,2,KL644,AMS,2026-07-13,`;

const EMPTY_ENQUIRY = {
  customerName: "",
  contactEmail: "",
  jobType: "import" as "import" | "export",
  commodity: "",
  animalCount: "",
  origin: "",
  flight: "",
  arrivalDate: "",
};

export function NewBooking() {
  const router = useRouter();
  const {
    createFromEmail,
    createFromText,
    createFromPdf,
    createManual,
    createEnquiry,
    importCsvJobs,
    runExtraction,
  } = useStore();

  const { canEdit } = usePrefs();
  const [mode, setMode] = useState<Mode>("email");
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [pasted, setPasted] = useState("");
  const [enquiry, setEnquiry] = useState(EMPTY_ENQUIRY);
  const [csv, setCsv] = useState("");

  if (!canEdit) {
    return (
      <Card className="mx-auto max-w-lg p-10 text-center">
        <p className="text-sm text-ink-soft">
          Creating bookings requires the Operations or Admin role. You&apos;re
          currently in the read-only Viewer role.
        </p>
        <div className="mt-4">
          <Link href="/">
            <Button variant="ghost">← Back to dashboard</Button>
          </Link>
        </div>
      </Card>
    );
  }

  function startFromEmail() {
    if (!selectedEmail) return;
    const id = createFromEmail(selectedEmail);
    void runExtraction(id);
    router.push(`/jobs/${id}`);
  }

  function startFromText() {
    if (!pasted.trim()) return;
    const id = createFromText(pasted.trim());
    void runExtraction(id);
    router.push(`/jobs/${id}`);
  }

  function startFromPdf(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = String(reader.result ?? "").split(",")[1] ?? "";
      if (!base64) return;
      const id = createFromPdf(file.name, base64);
      void runExtraction(id);
      router.push(`/jobs/${id}`);
    };
    reader.readAsDataURL(file);
  }

  function startManual() {
    const id = createManual();
    router.push(`/jobs/${id}`);
  }

  function startEnquiry() {
    if (!enquiry.commodity.trim()) return;
    const id = createEnquiry(enquiry);
    router.push(`/jobs/${id}`);
  }

  function importCsv() {
    const n = importCsvJobs(csv);
    if (n > 0) router.push("/");
  }

  function onCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCsv(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  return (
    <div>
      <header className="mb-5">
        <Eyebrow>New import job</Eyebrow>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">
          Create a booking
        </h1>
        <p className="mt-1 max-w-xl text-sm text-ink-soft">
          Start from an agent email and let the assistant extract the fields, or
          key one in by hand.
        </p>
      </header>

      {/* Mode switch */}
      <div className="mb-4 flex flex-wrap gap-1">
        {(
          [
            { id: "email", label: "From sample email" },
            { id: "pdf", label: "Upload PDF" },
            { id: "paste", label: "Paste email text" },
            { id: "enquiry", label: "Customer enquiry" },
            { id: "csv", label: "Import CSV" },
            { id: "manual", label: "Manual entry" },
          ] as { id: Mode; label: string }[]
        ).map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${
              mode === m.id
                ? "bg-brand text-white shadow-glow"
                : "border border-line bg-white text-ink-soft hover:border-primary/40 hover:text-ink"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === "email" && (
        <div>
          <EmailPicker selectedId={selectedEmail} onSelect={setSelectedEmail} />
          <div className="mt-4 flex items-center justify-end gap-3">
            <span className="text-[12px] text-ink-faint">
              Creates a job and runs AI extraction on the selected message.
            </span>
            <Button onClick={startFromEmail} disabled={!selectedEmail}>
              Create &amp; extract →
            </Button>
          </div>
        </div>
      )}

      {mode === "pdf" && (
        <div>
          <Card className="p-8 text-center">
            <p className="mx-auto mb-4 max-w-md text-sm text-ink-soft">
              Upload an agent PDF (health certificate, booking sheet). The
              assistant reads the document itself and fills the booking — the
              &quot;PDF → form&quot; flow from the target architecture.
            </p>
            <label className="mx-auto inline-flex cursor-pointer items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-glow transition-all hover:-translate-y-0.5">
              Choose a PDF…
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={startFromPdf}
                className="hidden"
              />
            </label>
            <p className="mt-3 font-mono text-[11px] text-ink-faint">
              The PDF is read by AI on upload; large scans may take a few seconds.
            </p>
          </Card>
        </div>
      )}

      {mode === "paste" && (
        <div>
          <Card className="p-4">
            <label className="mb-1 block text-[12px] text-ink-soft">
              Paste the agent&apos;s email or message text
            </label>
            <textarea
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              rows={12}
              placeholder="Paste the raw email here…"
              className="w-full rounded-md border border-line-strong bg-white px-3 py-2 font-mono text-[12.5px] leading-relaxed text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </Card>
          <div className="mt-4 flex items-center justify-end gap-3">
            <span className="text-[12px] text-ink-faint">
              Creates a job and runs AI extraction on the pasted text.
            </span>
            <Button onClick={startFromText} disabled={!pasted.trim()}>
              Create &amp; extract →
            </Button>
          </div>
        </div>
      )}

      {mode === "enquiry" && (
        <div>
          <Card className="p-5">
            <p className="mb-4 text-[13px] text-ink-soft">
              The customer-facing enquiry form (from the website / booking email).
              Submitting creates a job for ops to review.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <EnqField label="Customer name" value={enquiry.customerName} onChange={(v) => setEnquiry({ ...enquiry, customerName: v })} />
              <EnqField label="Contact email" value={enquiry.contactEmail} onChange={(v) => setEnquiry({ ...enquiry, contactEmail: v })} />
              <label className="block">
                <span className="mb-1 block text-[12px] text-ink-soft">Direction</span>
                <select
                  value={enquiry.jobType}
                  onChange={(e) => setEnquiry({ ...enquiry, jobType: e.target.value as "import" | "export" })}
                  className="w-full rounded-md border border-line-strong bg-white px-2.5 py-1.5 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="import">Import</option>
                  <option value="export">Export</option>
                </select>
              </label>
              <EnqField label="Commodity" value={enquiry.commodity} onChange={(v) => setEnquiry({ ...enquiry, commodity: v })} placeholder="e.g. Live horses" />
              <EnqField label="Animal count" value={enquiry.animalCount} onChange={(v) => setEnquiry({ ...enquiry, animalCount: v })} />
              <EnqField label="Origin" value={enquiry.origin} onChange={(v) => setEnquiry({ ...enquiry, origin: v })} />
              <EnqField label="Flight" value={enquiry.flight} onChange={(v) => setEnquiry({ ...enquiry, flight: v })} mono />
              <EnqField label="Arrival / travel date" value={enquiry.arrivalDate} onChange={(v) => setEnquiry({ ...enquiry, arrivalDate: v })} mono />
            </div>
          </Card>
          <div className="mt-4 flex items-center justify-end gap-3">
            <span className="text-[12px] text-ink-faint">
              Creates a job from the enquiry for ops review.
            </span>
            <Button onClick={startEnquiry} disabled={!enquiry.commodity.trim()}>
              Submit enquiry →
            </Button>
          </div>
        </div>
      )}

      {mode === "csv" && (
        <div>
          <Card className="p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[13px] text-ink-soft">
                Migrate the Amsterdam spreadsheet: upload or paste CSV and each
                row becomes a job. Columns are matched by header (awb, agent,
                commodity, type, animalCount, flight, origin, arrivalDate…).
              </p>
              <div className="flex items-center gap-2">
                <label className="cursor-pointer rounded-xl border border-line-strong bg-white px-3 py-1.5 text-[12px] text-ink-soft hover:border-primary/40">
                  Upload .csv
                  <input type="file" accept=".csv,text/csv" onChange={onCsvFile} className="hidden" />
                </label>
                <button
                  onClick={() => setCsv(CSV_SAMPLE)}
                  className="rounded-xl px-3 py-1.5 text-[12px] text-primary hover:bg-primary-soft"
                >
                  Load sample
                </button>
              </div>
            </div>
            <textarea
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              rows={10}
              placeholder="Paste CSV here, or upload a file…"
              className="w-full rounded-md border border-line-strong bg-white px-3 py-2 font-mono text-[12px] leading-relaxed text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </Card>
          <div className="mt-4 flex items-center justify-end gap-3">
            <span className="text-[12px] text-ink-faint">
              Creates one job per data row.
            </span>
            <Button onClick={importCsv} disabled={!csv.trim()}>
              Import jobs →
            </Button>
          </div>
        </div>
      )}

      {mode === "manual" && (
        <Card className="p-6 text-center">
          <p className="mx-auto max-w-md text-sm text-ink-soft">
            Create a blank import job and fill the booking fields yourself. You
            can still run the readiness gate and draft documents afterwards.
          </p>
          <div className="mt-4">
            <Button onClick={startManual}>Create blank booking →</Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function EnqField({
  label,
  value,
  onChange,
  placeholder,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] text-ink-soft">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-md border border-line-strong bg-white px-2.5 py-1.5 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/30 ${
          mono ? "font-mono" : ""
        }`}
      />
    </label>
  );
}
