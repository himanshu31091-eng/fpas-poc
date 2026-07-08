"use client";

import { useState } from "react";
import { useStore } from "./store";
import { usePrefs } from "./prefs";
import { Button, Card, ErrorRetry, SimTag } from "./ui";
import {
  IconPlane,
  IconPlus,
  IconTrash,
  IconCheckCircle,
  IconAlert,
  IconUsers,
  IconCheck,
} from "./icons";
import { AIRLINES, AIRLINE_RECIPIENTS } from "@/lib/jobs";
import type { LoadPlanRow } from "@/lib/types";

const GENDERS = ["Mare", "Gelding", "Stallion", "Colt", "Filly", ""];
const CONTOURS = ["L", "R", "747"];

export function LoadPlan({ jobId }: { jobId: string }) {
  const { getJob, updateLoadPlan, updateBooking, sendToAirline } = useStore();
  const { t } = usePrefs();
  const job = getJob(jobId);

  const [airline, setAirline] = useState<string>(
    () =>
      job?.booking && AIRLINES.includes(job.booking.shippingAgent)
        ? job.booking.shippingAgent
        : "Etihad"
  );
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groom, setGroom] = useState({ name: "", passport: "" });

  if (!job?.booking) {
    return (
      <Card className="p-10 text-center text-sm text-ink-soft">
        {t("lp.noBooking")}
      </Card>
    );
  }

  const rows = job.booking.loadPlan ?? [];
  const grooms = job.booking.grooms ?? [];
  const spx = job.booking.spx ?? { declaredBy: "", time: "", declared: false };
  const sent = job.booking.airlineSubmission;
  const recipients = AIRLINE_RECIPIENTS[airline] ?? [];

  const filled = rows.filter((r) => (r.animalId ?? "").trim());
  const docGaps = filled.filter((r) => !r.hc || !r.pp).length;

  function setRows(next: LoadPlanRow[]) {
    updateLoadPlan(jobId, next);
  }
  function addRow() {
    const n = rows.length + 1;
    setRows([
      ...rows,
      {
        id: `lp-${n}-${rows.length}`,
        stall: String(n),
        gender: "",
        weightKg: "",
        contour: "L",
        tackbag: false,
        hc: false,
        pp: false,
      },
    ]);
  }
  function update(id: string, patch: Partial<LoadPlanRow>) {
    setRows(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function remove(id: string) {
    setRows(rows.filter((r) => r.id !== id));
  }

  function addGroom() {
    if (!groom.name.trim()) return;
    updateBooking(jobId, {
      grooms: [...grooms, { name: groom.name.trim(), passport: groom.passport.trim() }],
    });
    setGroom({ name: "", passport: "" });
  }
  function removeGroom(i: number) {
    updateBooking(jobId, { grooms: grooms.filter((_, idx) => idx !== i) });
  }
  function setSpx(patch: Partial<typeof spx>) {
    updateBooking(jobId, { spx: { ...spx, ...patch } });
  }

  async function send() {
    setSending(true);
    setError(null);
    try {
      await sendToAirline(jobId, airline);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not draft/send the load list.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Doc-readiness banner */}
      {filled.length > 0 && (
        <div
          className={`flex items-center gap-2 rounded-card border px-4 py-2.5 text-[13px] font-semibold ${
            docGaps > 0
              ? "border-amber/40 bg-amber-soft text-amber"
              : "border-green/40 bg-green-soft text-green"
          }`}
        >
          {docGaps > 0 ? (
            <>
              <IconAlert width={15} height={15} />
              {t("lp.docGap", { n: docGaps, total: filled.length })}
            </>
          ) : (
            <>
              <IconCheckCircle width={15} height={15} />
              {t("lp.docsComplete")}
            </>
          )}
        </div>
      )}

      {/* Loading list table */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <span className="text-sm font-semibold text-ink">{t("lp.loadingList")}</span>
          <Button variant="ghost" size="sm" onClick={addRow}>
            <IconPlus width={15} height={15} />
            {t("lp.addHorse")}
          </Button>
        </div>
        {rows.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-ink-soft">
            {t("lp.empty")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-line text-left font-mono text-[11px] uppercase tracking-wide text-ink-faint">
                  <th className="px-3 py-2 font-medium">{t("lp.col.stall")}</th>
                  <th className="px-3 py-2 font-medium">{t("lp.col.contour")}</th>
                  <th className="px-3 py-2 font-medium">{t("lp.col.horse")}</th>
                  <th className="px-3 py-2 font-medium">{t("lp.col.gender")}</th>
                  <th className="px-3 py-2 font-medium">{t("lp.col.weight")}</th>
                  <th className="px-3 py-2 text-center font-medium">{t("lp.col.tack")}</th>
                  <th className="px-3 py-2 text-center font-medium">HC</th>
                  <th className="px-3 py-2 text-center font-medium">PP</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-2 py-1.5">
                      <Cell value={r.stall} onChange={(v) => update(r.id, { stall: v })} w="w-12" mono />
                    </td>
                    <td className="px-2 py-1.5">
                      <select
                        value={r.contour ?? "L"}
                        onChange={(e) => update(r.id, { contour: e.target.value })}
                        className="w-16 rounded-md border border-line-strong bg-white px-1.5 py-1 font-mono text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        {CONTOURS.map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <Cell value={r.animalId ?? ""} onChange={(v) => update(r.id, { animalId: v })} />
                    </td>
                    <td className="px-2 py-1.5">
                      <select
                        value={r.gender ?? ""}
                        onChange={(e) => update(r.id, { gender: e.target.value })}
                        className="w-24 rounded-md border border-line-strong bg-white px-2 py-1 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        {GENDERS.map((g) => (
                          <option key={g} value={g}>
                            {g || "—"}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <Cell value={r.weightKg ?? ""} onChange={(v) => update(r.id, { weightKg: v })} w="w-16" mono />
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <Toggle on={!!r.tackbag} onClick={() => update(r.id, { tackbag: !r.tackbag })} />
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <DocTick on={!!r.hc} onClick={() => update(r.id, { hc: !r.hc })} />
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <DocTick on={!!r.pp} onClick={() => update(r.id, { pp: !r.pp })} />
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <button
                        onClick={() => remove(r.id)}
                        className="text-ink-faint hover:text-red"
                        title={t("lp.remove")}
                      >
                        <IconTrash width={15} height={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Grooms accompanying */}
      <Card className="p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <IconUsers width={16} height={16} className="text-primary" />
          {t("lp.grooms")}
          <span className="font-mono text-[11px] font-normal text-ink-faint">
            · {t("lp.pax", { n: grooms.length })}
          </span>
        </div>
        <div className="mt-3 space-y-2">
          {grooms.map((g, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-card border border-line bg-panel px-3 py-2"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-soft font-mono text-[11px] font-semibold text-primary">
                {i + 1}
              </span>
              <span className="flex-1 text-[13px] text-ink">{g.name}</span>
              <span className="font-mono text-[11px] text-ink-soft">{g.passport}</span>
              <button
                onClick={() => removeGroom(i)}
                className="text-ink-faint hover:text-red"
                title={t("lp.remove")}
              >
                <IconTrash width={14} height={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-end gap-2">
          <Cell value={groom.name} onChange={(v) => setGroom({ ...groom, name: v })} w="w-48" />
          <input
            value={groom.passport}
            onChange={(e) => setGroom({ ...groom, passport: e.target.value })}
            placeholder={t("lp.passportId")}
            className="w-40 rounded-md border border-line-strong bg-white px-2 py-1 font-mono text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <Button variant="ghost" size="sm" onClick={addGroom}>
            <IconPlus width={15} height={15} />
            {t("lp.addGroom")}
          </Button>
        </div>
      </Card>

      {/* SPX security declaration */}
      <Card className="p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <IconCheckCircle width={16} height={16} className="text-primary" />
          {t("lp.spx")}
          <SimTag />
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="mb-1 block text-[12px] text-ink-soft">{t("lp.declaredBy")}</span>
            <Cell value={spx.declaredBy} onChange={(v) => setSpx({ declaredBy: v })} w="w-48" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] text-ink-soft">{t("lp.time")}</span>
            <Cell value={spx.time} onChange={(v) => setSpx({ time: v })} w="w-24" mono />
          </label>
          <button
            onClick={() => setSpx({ declared: !spx.declared })}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-medium transition-all ${
              spx.declared
                ? "bg-green-soft text-green ring-1 ring-green/40"
                : "border border-line-strong bg-white text-ink-soft hover:text-ink"
            }`}
          >
            {spx.declared && <IconCheck width={13} height={13} />}
            {spx.declared ? t("lp.declaredSecure") : t("lp.markDeclared")}
          </button>
        </div>
      </Card>

      {/* Send to airline */}
      <Card className="p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <IconPlane width={16} height={16} className="text-primary" />
          {t("lp.sendTitle")}
          <SimTag />
        </div>
        <p className="mt-1 text-[13px] text-ink-soft">{t("lp.sendDesc")}</p>

        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="mb-1 block text-[12px] text-ink-soft">{t("lp.airline")}</span>
            <select
              value={airline}
              onChange={(e) => setAirline(e.target.value)}
              className="rounded-md border border-line-strong bg-white px-2.5 py-1.5 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {AIRLINES.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
          <Button onClick={send} disabled={sending || rows.length === 0}>
            {sending ? t("lp.drafting") : t("lp.draftSend")}
          </Button>
        </div>

        <div className="mt-3 rounded-xl border border-line bg-bg/60 px-3 py-2">
          <div className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">
            {t("lp.recipients", { n: recipients.length })}
            {airline === "Etihad" ? t("lp.etihadNote") : ""}
          </div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {recipients.map((r) => (
              <span
                key={r}
                className="rounded-full bg-white px-2 py-0.5 font-mono text-[11px] text-ink-soft ring-1 ring-line"
              >
                {r}
              </span>
            ))}
          </div>
        </div>

        {error && (
          <div className="mt-3">
            <ErrorRetry message={error} onRetry={send} busy={sending} />
          </div>
        )}
      </Card>

      {/* Sent record */}
      {sent && (
        <Card className="border-green/30 p-4">
          <div className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-wide text-green">
            <span className="h-1.5 w-1.5 rounded-full bg-green" />
            {t("lp.sentTo", { airline: sent.airline, n: sent.recipients.length })}
          </div>
          <div className="mt-1 font-mono text-[11px] text-ink-faint">
            {sent.sentBy} · {new Date(sent.sentAt).toLocaleString()}
          </div>
          <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-bg/60 px-3 py-2 font-mono text-[12px] leading-relaxed text-ink-soft">
            {sent.body}
          </pre>
        </Card>
      )}
    </div>
  );
}

function Cell({
  value,
  onChange,
  w = "w-full",
  mono,
}: {
  value: string;
  onChange: (v: string) => void;
  w?: string;
  mono?: boolean;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${w} rounded-md border border-line-strong bg-white px-2 py-1 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/30 ${
        mono ? "font-mono" : ""
      }`}
    />
  );
}

function DocTick({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={on ? "Recorded" : "Missing"}
      className={`inline-grid h-6 w-7 place-items-center rounded-md font-mono text-[12px] font-bold ring-1 ${
        on ? "bg-green-soft text-green ring-green/40" : "bg-red-soft text-red ring-red/40"
      }`}
    >
      {on ? "✓" : "✕"}
    </button>
  );
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`inline-grid h-6 w-7 place-items-center rounded-md ring-1 ${
        on
          ? "bg-primary-soft text-primary ring-primary/40"
          : "bg-white text-ink-faint ring-line-strong"
      }`}
      title={on ? "Tackbag loaded" : "No tackbag"}
    >
      {on ? <IconCheck width={13} height={13} /> : "—"}
    </button>
  );
}
