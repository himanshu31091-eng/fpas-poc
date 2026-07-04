"use client";

import { useMemo } from "react";
import { useStore } from "./store";
import { usePrefs } from "./prefs";
import { Button, Card } from "./ui";
import { IconDownload, IconPrinter, IconReport } from "./icons";
import { buildReport, exportReportXlsx } from "@/lib/report";

/**
 * Operations report — an at-a-glance summary of the live jobs plus a per-job
 * table and outstanding-step breakdown, with a one-click export to a genuine
 * multi-sheet .xlsx workbook (Summary / Jobs / Outstanding steps).
 */
export function Report() {
  const { jobs } = useStore();
  const { toast } = usePrefs();

  const now = useMemo(() => new Date(), []);
  const model = useMemo(() => buildReport(jobs, now), [jobs, now]);

  function handleExport() {
    exportReportXlsx(jobs, new Date());
    toast("Report exported to Excel", "success");
  }

  function handlePrint() {
    if (typeof window !== "undefined") window.print();
  }

  const summaryTiles: { label: string; value: number | string }[] = [
    { label: "Total jobs", value: model.totals.total },
    { label: "Booked", value: model.totals.booked },
    { label: "Ready", value: model.totals.ready },
    { label: "In progress", value: model.totals.inProgress },
    { label: "Arriving ≤48h", value: model.totals.arriving48 },
    { label: "On-time readiness", value: `${model.totals.onTimePct}%` },
  ];

  return (
    <div className="animate-fade-up space-y-4">
      {/* Header + export */}
      <Card className="print-plain flex flex-wrap items-center justify-between gap-3 border-primary/20 p-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand text-white shadow-glow">
            <IconReport width={16} height={16} />
          </span>
          <div>
            <div className="text-sm font-semibold text-ink">
              Operations report
            </div>
            <div className="text-[12px] text-ink-soft">
              Snapshot of all live jobs · generated {model.generatedAt}
            </div>
          </div>
        </div>
        <div className="no-print flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={handlePrint}
            disabled={model.totals.total === 0}
          >
            <IconPrinter width={15} height={15} />
            Export to PDF
          </Button>
          <Button onClick={handleExport} disabled={model.totals.total === 0}>
            <IconDownload width={15} height={15} />
            Export to Excel
          </Button>
        </div>
      </Card>

      {model.totals.total === 0 ? (
        <div className="rounded-card border border-dashed border-line-strong bg-panel/60 p-12 text-center">
          <p className="text-sm text-ink-soft">
            No jobs to report yet. Create a booking to populate the report.
          </p>
        </div>
      ) : (
        <>
          {/* Summary tiles */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {summaryTiles.map((t) => (
              <Card key={t.label} className="print-plain p-4">
                <div className="font-display text-2xl font-bold text-ink">
                  {t.value}
                </div>
                <div className="mt-0.5 text-[12px] text-ink-soft">{t.label}</div>
              </Card>
            ))}
          </div>

          {/* Jobs table */}
          <Card className="print-plain p-4">
            <div className="mb-3 text-sm font-semibold text-ink">
              Jobs ({model.jobs.length})
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead>
                  <tr className="border-b border-line text-ink-faint">
                    <Th>AWB</Th>
                    <Th>Type</Th>
                    <Th>Agent</Th>
                    <Th>Commodity</Th>
                    <Th>Flight</Th>
                    <Th>Origin</Th>
                    <Th>Arrival</Th>
                    <Th>Status</Th>
                    <Th className="text-right">Open</Th>
                    <Th>Assignee</Th>
                  </tr>
                </thead>
                <tbody>
                  {model.jobs.map((j, i) => (
                    <tr
                      key={`${j.awb}-${i}`}
                      className="border-b border-line/60 last:border-0"
                    >
                      <Td className="font-mono font-semibold text-ink">
                        {j.awb}
                      </Td>
                      <Td className="capitalize">{j.type}</Td>
                      <Td>{j.agent}</Td>
                      <Td>{j.commodity}</Td>
                      <Td className="font-mono">{j.flight || "—"}</Td>
                      <Td>{j.origin || "—"}</Td>
                      <Td className="font-mono">
                        {j.arrivalDate || "—"}
                        {j.arrivalTime ? ` ${j.arrivalTime}` : ""}
                      </Td>
                      <Td>{j.status}</Td>
                      <Td className="text-right font-mono">{j.open}</Td>
                      <Td>{j.assignee || "—"}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Outstanding steps */}
          <Card className="print-plain p-4">
            <div className="mb-3 text-sm font-semibold text-ink">
              Outstanding steps ({model.steps.length})
            </div>
            {model.steps.length === 0 ? (
              <p className="text-[13px] text-ink-soft">
                Nothing outstanding — every booked job is cleared. 🎉
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12px]">
                  <thead>
                    <tr className="border-b border-line text-ink-faint">
                      <Th>AWB</Th>
                      <Th>Agent</Th>
                      <Th>Commodity</Th>
                      <Th>Outstanding step</Th>
                      <Th>Urgency</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {model.steps.map((s, i) => (
                      <tr
                        key={`${s.awb}-${i}`}
                        className="border-b border-line/60 last:border-0"
                      >
                        <Td className="font-mono font-semibold text-ink">
                          {s.awb}
                        </Td>
                        <Td>{s.agent}</Td>
                        <Td>{s.commodity}</Td>
                        <Td>{s.step}</Td>
                        <Td>
                          <span
                            className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${
                              s.urgency === "critical"
                                ? "bg-red/10 text-red"
                                : s.urgency === "soon"
                                ? "bg-amber-soft text-amber"
                                : "bg-bg text-ink-soft"
                            }`}
                          >
                            {s.urgency}
                          </span>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th className={`whitespace-nowrap px-2 py-2 font-medium ${className}`}>
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={`whitespace-nowrap px-2 py-2 text-ink-soft ${className}`}>
      {children}
    </td>
  );
}
