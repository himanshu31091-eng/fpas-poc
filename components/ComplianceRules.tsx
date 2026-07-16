"use client";

import { useMemo, useState } from "react";
import { useStore } from "./store";
import { usePrefs } from "./prefs";
import { Button, Card, Eyebrow, SimTag, BrandLoader, ErrorRetry } from "./ui";
import { IconSparkles, IconCheckCircle } from "./icons";
import { jobAwb, jobAgent } from "@/lib/jobs";

interface Requirement {
  title: string;
  authority: string;
  category: string;
  severity: string;
  why: string;
}

const SEVERITY: Record<string, { key: string; chip: string; dot: string }> = {
  mandatory: { key: "rules.mandatory", chip: "bg-red-soft text-red", dot: "bg-red" },
  conditional: { key: "rules.conditional", chip: "bg-amber-soft text-amber", dot: "bg-amber" },
  recommended: { key: "rules.recommended", chip: "bg-primary-soft text-primary", dot: "bg-primary" },
};

export function ComplianceRules() {
  const { jobs } = useStore();
  const { t } = usePrefs();

  const withBooking = useMemo(
    () => jobs.filter((j) => !j.deletedAt && j.booking),
    [jobs]
  );
  const [id, setId] = useState<string>(() => {
    const horse = withBooking.find((j) => j.booking?.isHorses);
    return (horse ?? withBooking[0])?.id ?? "";
  });
  const job = withBooking.find((j) => j.id === id) ?? null;
  const b = job?.booking ?? null;

  const [result, setResult] = useState<{ summary: string; requirements: Requirement[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!b) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/rules", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          shipment: {
            species: b.commodity,
            commodity: b.commodity,
            direction: b.jobType,
            origin: b.origin,
            animalCount: b.animalCount,
          },
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Request failed (${res.status})`);
      }
      setResult(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "The rules engine failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Eyebrow>{t("nav.rules")}</Eyebrow>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">
            {t("rules.title")}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-ink-soft">{t("rules.subtitle")}</p>
        </div>
        <SimTag label="AI" />
      </header>

      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block flex-1">
            <span className="mb-1 block text-[12px] text-ink-soft">{t("rules.pick")}</span>
            <select
              value={id}
              onChange={(e) => {
                setId(e.target.value);
                setResult(null);
                setError(null);
              }}
              className="w-full rounded-xl border border-line-strong bg-white px-2.5 py-2 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {withBooking.map((j) => (
                <option key={j.id} value={j.id}>
                  {jobAwb(j)} · {jobAgent(j)} · {j.booking?.commodity}
                </option>
              ))}
            </select>
          </label>
          <Button onClick={generate} disabled={busy || !b}>
            <IconSparkles width={16} height={16} />
            {t("rules.generate")}
          </Button>
        </div>
        {b && (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-3 font-mono text-[11.5px] text-ink-soft">
            <span>{b.jobType}</span>
            <span>{b.commodity}</span>
            <span>{b.origin || "—"}</span>
            <span>{b.animalCount || "—"}</span>
          </div>
        )}
      </Card>

      {busy && (
        <Card className="p-8">
          <BrandLoader label={t("rules.generating")} />
        </Card>
      )}

      {error && !busy && <ErrorRetry message={error} onRetry={generate} busy={busy} />}

      {result && !busy && (
        <div className="space-y-3">
          {result.summary && (
            <div className="flex items-start gap-2 rounded-card border border-primary/20 bg-primary-soft/30 px-4 py-3 text-[13.5px] text-ink">
              <IconCheckCircle width={16} height={16} className="mt-0.5 shrink-0 text-primary" />
              {result.summary}
            </div>
          )}
          <Card className="divide-y divide-line">
            {result.requirements.map((r, i) => {
              const sev = SEVERITY[r.severity] ?? SEVERITY.recommended;
              return (
                <div key={i} className="flex items-start gap-3 px-4 py-3">
                  <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${sev.dot}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13.5px] font-semibold text-ink">{r.title}</span>
                      <span className="rounded-full bg-bg px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-ink-soft">
                        {r.authority}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${sev.chip}`}>
                        {t(sev.key)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-soft">{r.why}</p>
                  </div>
                </div>
              );
            })}
          </Card>
        </div>
      )}
    </div>
  );
}
