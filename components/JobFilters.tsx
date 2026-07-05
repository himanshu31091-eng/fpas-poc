"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { IconFilter } from "./icons";

// ---------------------------------------------------------------------------
// Compact multi-facet filter for the dashboard jobs view. Presentational: the
// facet state lives in the Dashboard (so it can feed the shared `visible`
// computation across List / Board / Grid). Facets AND-combine.
// ---------------------------------------------------------------------------

export type CommodityGroup = "horses" | "companion" | "other";
export type ArrivalWindow = "48h" | "week" | "overdue";

export interface JobFacets {
  jobType: "import" | "export" | null;
  commodities: CommodityGroup[];
  agents: string[];
  arrival: ArrivalWindow | null;
}

export const EMPTY_FACETS: JobFacets = {
  jobType: null,
  commodities: [],
  agents: [],
  arrival: null,
};

export function facetCount(f: JobFacets): number {
  return (
    (f.jobType ? 1 : 0) +
    (f.commodities.length ? 1 : 0) +
    (f.agents.length ? 1 : 0) +
    (f.arrival ? 1 : 0)
  );
}

const JOB_TYPES: { id: "import" | "export"; label: string }[] = [
  { id: "import", label: "Import" },
  { id: "export", label: "Export" },
];
const COMMODITIES: { id: CommodityGroup; label: string }[] = [
  { id: "horses", label: "Horses" },
  { id: "companion", label: "Companion" },
  { id: "other", label: "Other" },
];
const ARRIVALS: { id: ArrivalWindow; label: string }[] = [
  { id: "48h", label: "≤ 48h" },
  { id: "week", label: "This week" },
  { id: "overdue", label: "Overdue" },
];

export function JobFilters({
  facets,
  setFacets,
  agents,
}: {
  facets: JobFacets;
  setFacets: (f: JobFacets) => void;
  agents: string[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const count = facetCount(facets);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggleCommodity = (id: CommodityGroup) =>
    setFacets({
      ...facets,
      commodities: facets.commodities.includes(id)
        ? facets.commodities.filter((x) => x !== id)
        : [...facets.commodities, id],
    });

  const toggleAgent = (a: string) =>
    setFacets({
      ...facets,
      agents: facets.agents.includes(a)
        ? facets.agents.filter((x) => x !== a)
        : [...facets.agents, a],
    });

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-all ${
          count > 0
            ? "bg-brand text-white shadow-glow"
            : "border border-line bg-white text-ink-soft hover:border-primary/40 hover:text-ink"
        }`}
      >
        <IconFilter width={13} height={13} />
        Filters
        {count > 0 && (
          <span className="ml-0.5 rounded-full bg-white/25 px-1.5 text-[10px] font-semibold">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 z-40 mt-2 w-64 rounded-xl2 border border-line bg-panel p-3.5 shadow-lift">
          <FieldLabel>Job type</FieldLabel>
          <div className="flex flex-wrap gap-1.5">
            {JOB_TYPES.map((t) => (
              <Chip
                key={t.id}
                active={facets.jobType === t.id}
                onClick={() =>
                  setFacets({
                    ...facets,
                    jobType: facets.jobType === t.id ? null : t.id,
                  })
                }
              >
                {t.label}
              </Chip>
            ))}
          </div>

          <FieldLabel className="mt-3">Commodity</FieldLabel>
          <div className="flex flex-wrap gap-1.5">
            {COMMODITIES.map((c) => (
              <Chip
                key={c.id}
                active={facets.commodities.includes(c.id)}
                onClick={() => toggleCommodity(c.id)}
              >
                {c.label}
              </Chip>
            ))}
          </div>

          <FieldLabel className="mt-3">Arrival</FieldLabel>
          <div className="flex flex-wrap gap-1.5">
            {ARRIVALS.map((a) => (
              <Chip
                key={a.id}
                active={facets.arrival === a.id}
                onClick={() =>
                  setFacets({
                    ...facets,
                    arrival: facets.arrival === a.id ? null : a.id,
                  })
                }
              >
                {a.label}
              </Chip>
            ))}
          </div>

          {agents.length > 0 && (
            <>
              <FieldLabel className="mt-3">Agent</FieldLabel>
              <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
                {agents.map((a) => (
                  <Chip
                    key={a}
                    active={facets.agents.includes(a)}
                    onClick={() => toggleAgent(a)}
                  >
                    {a}
                  </Chip>
                ))}
              </div>
            </>
          )}

          <div className="mt-3.5 flex items-center justify-between border-t border-line pt-3">
            <button
              onClick={() => setFacets(EMPTY_FACETS)}
              disabled={count === 0}
              className="text-[12px] text-ink-faint transition-colors hover:text-ink disabled:opacity-40"
            >
              Clear all
            </button>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg bg-accent px-3 py-1 text-[12px] font-semibold text-fpasnavy"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FieldLabel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mb-1.5 font-mono text-[10px] font-medium uppercase tracking-wide text-ink-faint ${className}`}
    >
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-all ${
        active
          ? "bg-primary-soft text-primary ring-1 ring-primary/40"
          : "border border-line bg-white text-ink-soft hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
