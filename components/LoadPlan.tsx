"use client";

import { useState } from "react";
import { useStore } from "./store";
import { Button, Card, ErrorRetry } from "./ui";
import { IconPlane, IconPlus, IconTrash } from "./icons";
import { AIRLINES, AIRLINE_RECIPIENTS } from "@/lib/jobs";
import type { LoadPlanRow } from "@/lib/types";

const GENDERS = ["Mare", "Gelding", "Stallion", "Colt", "Filly", ""];

export function LoadPlan({ jobId }: { jobId: string }) {
  const { getJob, updateLoadPlan, sendToAirline } = useStore();
  const job = getJob(jobId);

  const [airline, setAirline] = useState<string>(
    () => (job?.booking && AIRLINES.includes(job.booking.shippingAgent)
      ? job.booking.shippingAgent
      : "Etihad")
  );
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!job?.booking) {
    return (
      <Card className="p-10 text-center text-sm text-ink-soft">
        No booking yet. Create the booking first.
      </Card>
    );
  }

  const rows = job.booking.loadPlan ?? [];
  const sent = job.booking.airlineSubmission;
  const recipients = AIRLINE_RECIPIENTS[airline] ?? [];

  function setRows(next: LoadPlanRow[]) {
    updateLoadPlan(jobId, next);
  }

  function addRow() {
    const n = rows.length + 1;
    setRows([
      ...rows,
      { id: `lp-${n}-${rows.length}`, stall: String(n), gender: "", weightKg: "" },
    ]);
  }

  function update(id: string, patch: Partial<LoadPlanRow>) {
    setRows(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function remove(id: string) {
    setRows(rows.filter((r) => r.id !== id));
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
      {/* Load plan table */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <span className="text-sm font-semibold text-ink">Load plan</span>
          <Button variant="ghost" size="sm" onClick={addRow}>
            <IconPlus width={15} height={15} />
            Add stall
          </Button>
        </div>
        {rows.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-ink-soft">
            No stalls yet. Add the animals, genders and weights the airline needs.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left font-mono text-[11px] uppercase tracking-wide text-ink-faint">
                <th className="px-4 py-2 font-medium">Stall</th>
                <th className="px-4 py-2 font-medium">Animal</th>
                <th className="px-4 py-2 font-medium">Gender</th>
                <th className="px-4 py-2 font-medium">Weight (kg)</th>
                <th className="px-4 py-2 font-medium">Notes</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-2 py-1.5">
                    <Cell value={r.stall} onChange={(v) => update(r.id, { stall: v })} w="w-14" mono />
                  </td>
                  <td className="px-2 py-1.5">
                    <Cell value={r.animalId ?? ""} onChange={(v) => update(r.id, { animalId: v })} />
                  </td>
                  <td className="px-2 py-1.5">
                    <select
                      value={r.gender ?? ""}
                      onChange={(e) => update(r.id, { gender: e.target.value })}
                      className="w-28 rounded-md border border-line-strong bg-white px-2 py-1 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      {GENDERS.map((g) => (
                        <option key={g} value={g}>
                          {g || "—"}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-1.5">
                    <Cell value={r.weightKg ?? ""} onChange={(v) => update(r.id, { weightKg: v })} w="w-20" mono />
                  </td>
                  <td className="px-2 py-1.5">
                    <Cell value={r.notes ?? ""} onChange={(v) => update(r.id, { notes: v })} />
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    <button
                      onClick={() => remove(r.id)}
                      className="text-ink-faint hover:text-red"
                      title="Remove"
                    >
                      <IconTrash width={15} height={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Send to airline */}
      <Card className="p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <IconPlane width={16} height={16} className="text-primary" />
          Send load list to airline
        </div>
        <p className="mt-1 text-[13px] text-ink-soft">
          The assistant drafts the load list from the plan above and sends it to
          the carrier&apos;s operations addresses. (Mock send — no email leaves
          this demo.)
        </p>

        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="mb-1 block text-[12px] text-ink-soft">Airline</span>
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
            {sending ? "Drafting & sending…" : "Draft & send to airline →"}
          </Button>
        </div>

        <div className="mt-3 rounded-xl border border-line bg-bg/60 px-3 py-2">
          <div className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">
            {recipients.length} recipient{recipients.length === 1 ? "" : "s"}
            {airline === "Etihad" ? " (Etihad requires all six)" : ""}
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
            Sent to {sent.airline} · {sent.recipients.length} recipients
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
