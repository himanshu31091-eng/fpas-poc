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
  name: "",
  phone: "",
  email: "",
  enquiry: "",
  terms: false,
};

export function NewBooking() {
  const router = useRouter();
  const {
    createFromEmail,
    createFromText,
    createFromPdf,
    createManual,
    createWebEnquiry,
    importCsvJobs,
    runExtraction,
  } = useStore();

  const { canEdit, t } = usePrefs();
  const [mode, setMode] = useState<Mode>("email");
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [pasted, setPasted] = useState("");
  const [enquiry, setEnquiry] = useState(EMPTY_ENQUIRY);
  const [csv, setCsv] = useState("");

  if (!canEdit) {
    return (
      <Card className="mx-auto max-w-lg p-10 text-center">
        <p className="text-sm text-ink-soft">{t("nb.viewerOnly")}</p>
        <div className="mt-4">
          <Link href="/">
            <Button variant="ghost">{t("nb.backToDashboard")}</Button>
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
    const { name, phone, email, enquiry: text, terms } = enquiry;
    if (!name.trim() || !phone.trim() || !email.trim() || !text.trim() || !terms)
      return;
    const id = createWebEnquiry({ name, phone, email, enquiry: text });
    void runExtraction(id);
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
        <Eyebrow>{t("nb.eyebrow")}</Eyebrow>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">
          {t("nb.title")}
        </h1>
        <p className="mt-1 max-w-xl text-sm text-ink-soft">{t("nb.subtitle")}</p>
      </header>

      {/* Mode switch */}
      <div className="mb-4 flex flex-wrap gap-1">
        {(["email", "pdf", "paste", "enquiry", "csv", "manual"] as Mode[]).map(
          (m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${
                mode === m
                  ? "bg-brand text-white shadow-glow"
                  : "border border-line bg-white text-ink-soft hover:border-primary/40 hover:text-ink"
              }`}
            >
              {t(`nb.mode.${m}`)}
            </button>
          )
        )}
      </div>

      {mode === "email" && (
        <div>
          <EmailPicker selectedId={selectedEmail} onSelect={setSelectedEmail} />
          <div className="mt-4 flex items-center justify-end gap-3">
            <span className="text-[12px] text-ink-faint">{t("nb.email.hint")}</span>
            <Button onClick={startFromEmail} disabled={!selectedEmail}>
              {t("nb.createExtract")}
            </Button>
          </div>
        </div>
      )}

      {mode === "pdf" && (
        <div>
          <Card className="p-8 text-center">
            <p className="mx-auto mb-4 max-w-md text-sm text-ink-soft">
              {t("nb.pdf.desc")}
            </p>
            <label className="mx-auto inline-flex cursor-pointer items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-fpasnavy shadow-glow transition-all hover:-translate-y-0.5 hover:brightness-105">
              {t("nb.pdf.choose")}
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={startFromPdf}
                className="hidden"
              />
            </label>
            <p className="mt-3 font-mono text-[11px] text-ink-faint">
              {t("nb.pdf.note")}
            </p>
          </Card>
        </div>
      )}

      {mode === "paste" && (
        <div>
          <Card className="p-4">
            <label className="mb-1 block text-[12px] text-ink-soft">
              {t("nb.paste.label")}
            </label>
            <textarea
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              rows={12}
              placeholder={t("nb.paste.placeholder")}
              className="w-full rounded-md border border-line-strong bg-white px-3 py-2 font-mono text-[12.5px] leading-relaxed text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </Card>
          <div className="mt-4 flex items-center justify-end gap-3">
            <span className="text-[12px] text-ink-faint">{t("nb.paste.hint")}</span>
            <Button onClick={startFromText} disabled={!pasted.trim()}>
              {t("nb.createExtract")}
            </Button>
          </div>
        </div>
      )}

      {mode === "enquiry" && (
        <div>
          <Card className="p-5">
            <div className="mb-4">
              <div className="text-sm font-semibold text-ink">{t("nb.enq.title")}</div>
              <p className="mt-1 text-[13px] text-ink-soft">{t("nb.enq.desc")}</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <EnqField
                label={t("nb.enq.name")}
                value={enquiry.name}
                onChange={(v) => setEnquiry({ ...enquiry, name: v })}
              />
              <EnqField
                label={t("nb.enq.phone")}
                value={enquiry.phone}
                onChange={(v) => setEnquiry({ ...enquiry, phone: v })}
                mono
              />
              <EnqField
                label={t("nb.enq.email")}
                value={enquiry.email}
                onChange={(v) => setEnquiry({ ...enquiry, email: v })}
              />
            </div>
            <label className="mt-3 block">
              <span className="mb-1 block text-[12px] text-ink-soft">
                {t("nb.enq.enquiry")}
              </span>
              <textarea
                value={enquiry.enquiry}
                onChange={(e) => setEnquiry({ ...enquiry, enquiry: e.target.value })}
                rows={7}
                placeholder={t("nb.enq.placeholder")}
                className="w-full rounded-md border border-line-strong bg-white px-3 py-2 text-[13px] leading-relaxed text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </label>
            <label className="mt-3 flex items-start gap-2 text-[12px] text-ink-soft">
              <input
                type="checkbox"
                checked={enquiry.terms}
                onChange={(e) => setEnquiry({ ...enquiry, terms: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-line-strong text-primary focus:ring-primary/30"
              />
              <span>
                {t("nb.enq.terms")} <span className="text-red">*</span>
              </span>
            </label>
            <p className="mt-2 font-mono text-[11px] text-ink-faint">
              {t("nb.enq.required")}
            </p>
          </Card>
          <div className="mt-4 flex items-center justify-end gap-3">
            <span className="text-[12px] text-ink-faint">{t("nb.enq.hint")}</span>
            <Button
              onClick={startEnquiry}
              disabled={
                !enquiry.name.trim() ||
                !enquiry.phone.trim() ||
                !enquiry.email.trim() ||
                !enquiry.enquiry.trim() ||
                !enquiry.terms
              }
            >
              {t("nb.enq.submit")}
            </Button>
          </div>
        </div>
      )}

      {mode === "csv" && (
        <div>
          <Card className="p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[13px] text-ink-soft">{t("nb.csv.desc")}</p>
              <div className="flex items-center gap-2">
                <label className="cursor-pointer rounded-xl border border-line-strong bg-white px-3 py-1.5 text-[12px] text-ink-soft hover:border-primary/40">
                  {t("nb.csv.upload")}
                  <input type="file" accept=".csv,text/csv" onChange={onCsvFile} className="hidden" />
                </label>
                <button
                  onClick={() => setCsv(CSV_SAMPLE)}
                  className="rounded-xl px-3 py-1.5 text-[12px] text-primary hover:bg-primary-soft"
                >
                  {t("nb.csv.loadSample")}
                </button>
              </div>
            </div>
            <textarea
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              rows={10}
              placeholder={t("nb.csv.placeholder")}
              className="w-full rounded-md border border-line-strong bg-white px-3 py-2 font-mono text-[12px] leading-relaxed text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </Card>
          <div className="mt-4 flex items-center justify-end gap-3">
            <span className="text-[12px] text-ink-faint">{t("nb.csv.hint")}</span>
            <Button onClick={importCsv} disabled={!csv.trim()}>
              {t("nb.csv.import")}
            </Button>
          </div>
        </div>
      )}

      {mode === "manual" && (
        <Card className="p-6 text-center">
          <p className="mx-auto max-w-md text-sm text-ink-soft">
            {t("nb.manual.desc")}
          </p>
          <div className="mt-4">
            <Button onClick={startManual}>{t("nb.manual.create")}</Button>
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
