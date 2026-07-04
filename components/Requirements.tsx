"use client";

import { Button, Card } from "./ui";
import { IconClipboard, IconPrinter } from "./icons";
import {
  FUNCTIONAL,
  SECTIONS,
  STATUS_META,
  statusCounts,
  type Req,
  type ReqSection,
} from "@/lib/requirements";

/**
 * In-app requirements traceability — mirrors the MoreYeahs requirements
 * document so the running POC reports its own coverage against the brief.
 */
export function Requirements() {
  const fc = statusCounts(FUNCTIONAL.items);

  function print() {
    if (typeof window !== "undefined") window.print();
  }

  return (
    <div className="mx-auto max-w-[1000px] animate-fade-up">
      {/* Header */}
      <Card className="print-plain mb-5 flex flex-wrap items-center justify-between gap-3 border-primary/20 p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white shadow-glow">
            <IconClipboard width={18} height={18} />
          </span>
          <div>
            <h1 className="font-display text-xl font-bold text-ink">
              Requirements &amp; Traceability
            </h1>
            <p className="text-[13px] text-ink-soft">
              How this POC maps to the FPAS Amsterdam Import requirements.
              Statuses mirror the MoreYeahs traceability document.
            </p>
          </div>
        </div>
        <span className="no-print">
          <Button variant="ghost" onClick={print}>
            <IconPrinter width={15} height={15} />
            Save as PDF
          </Button>
        </span>
      </Card>

      {/* Functional coverage summary */}
      <Card className="print-plain mb-5 p-5">
        <div className="mb-3 text-sm font-semibold text-ink">
          Functional coverage
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CoveragePill status="built" n={fc.built} total={FUNCTIONAL.items.length} />
          <CoveragePill status="simulated" n={fc.simulated} total={FUNCTIONAL.items.length} />
          <CoveragePill status="not-built" n={fc["not-built"]} total={FUNCTIONAL.items.length} />
        </div>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-bg">
          <div className="flex h-full w-full">
            <span
              className="h-full bg-green"
              style={{ width: `${(fc.built / FUNCTIONAL.items.length) * 100}%` }}
            />
            <span
              className="h-full bg-amber"
              style={{ width: `${(fc.simulated / FUNCTIONAL.items.length) * 100}%` }}
            />
            <span
              className="h-full bg-red"
              style={{ width: `${(fc["not-built"] / FUNCTIONAL.items.length) * 100}%` }}
            />
          </div>
        </div>
        <p className="mt-3 text-[12px] text-ink-faint">
          Genuinely real in the POC: AI extraction, reasoning and drafting; the
          encoded regulatory sequence; the operator workflow; and the audit
          trail. Simulated: all data, every external integration, and access
          control.
        </p>
      </Card>

      {/* Sections */}
      <div className="space-y-5">
        {SECTIONS.map((section) => (
          <SectionCard key={section.key} section={section} />
        ))}
      </div>
    </div>
  );
}

function CoveragePill({
  status,
  n,
  total,
}: {
  status: keyof typeof STATUS_META;
  n: number;
  total: number;
}) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[12px] font-semibold ${meta.cls}`}
    >
      {n} {meta.label}
      <span className="font-normal opacity-70">of {total}</span>
    </span>
  );
}

function StatusBadge({ status }: { status: Req["status"] }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${meta.cls}`}
    >
      {meta.label}
    </span>
  );
}

function SectionCard({ section }: { section: ReqSection }) {
  return (
    <Card className="print-plain p-5">
      <h2 className="font-display text-lg font-bold text-ink">
        {section.title}
      </h2>
      {section.blurb && (
        <p className="mt-1 text-[13px] text-ink-soft">{section.blurb}</p>
      )}
      <div className="mt-3 divide-y divide-line">
        {section.items.map((item) => (
          <div
            key={item.id}
            className="flex flex-wrap items-start gap-x-4 gap-y-1.5 py-2.5"
          >
            <div className="flex w-16 shrink-0 items-center">
              <span className="font-mono text-[12px] font-semibold text-ink">
                {item.id}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] text-ink">{item.text}</div>
              <div className="mt-0.5 flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                  {item.origin}
                </span>
                {item.src && (
                  <span className="font-mono text-[10px] text-ink-faint">
                    · {item.src}
                  </span>
                )}
                {item.note && (
                  <span className="text-[11.5px] text-ink-soft">
                    — {item.note}
                  </span>
                )}
              </div>
            </div>
            <div className="shrink-0">
              <StatusBadge status={item.status} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
