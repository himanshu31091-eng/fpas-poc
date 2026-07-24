"use client";

import { useState } from "react";
import { useStore } from "./store";
import { usePrefs } from "./prefs";
import { BrandLoader, Button, Card, ErrorRetry } from "./ui";
import { IconDoc, IconFMark, IconDownload } from "./icons";
import { downloadPdf } from "@/lib/pdf";
import type { DraftArtifact } from "@/lib/types";

export function Artifacts({ jobId }: { jobId: string }) {
  const { getJob, ui, regenerateArtifacts } = useStore();
  const { canEdit } = usePrefs();
  const job = getJob(jobId);
  const state = ui[jobId] ?? {};
  const artifacts = job?.artifacts ?? null;

  if (!job?.booking) {
    return (
      <Card className="p-10 text-center text-sm text-ink-soft">
        No booking yet. Create the booking and clear the readiness gate first.
      </Card>
    );
  }

  if (state.loadingArtifacts && !artifacts) {
    return (
      <div className="rounded-card border border-line bg-panel p-10">
        <BrandLoader label="Drafting operational documents…" />
      </div>
    );
  }

  if (state.artifactsError) {
    return (
      <ErrorRetry
        message={state.artifactsError}
        onRetry={() => regenerateArtifacts(jobId)}
        busy={state.loadingArtifacts}
      />
    );
  }

  if (!artifacts) {
    return (
      <Card className="p-10 text-center">
        <p className="text-sm text-ink-soft">
          No documents drafted yet.
          {canEdit ? " Generate the offloading list and delivery note from the confirmed booking." : ""}
        </p>
        {canEdit && (
          <div className="mt-4">
            <Button onClick={() => regenerateArtifacts(jobId)}>
              Draft operational documents →
            </Button>
          </div>
        )}
      </Card>
    );
  }

  const b = job.booking;
  const docMeta = [b.awb || b.flight, b.shippingAgent, b.arrivalDate]
    .filter(Boolean)
    .join("  ·  ");

  return (
    <div>
      <div className="no-print">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="max-w-md font-mono text-[11px] text-ink-faint">
            Drafts only. In production these would carry live data and route to
            warehouse tablets and the airline — none of which is wired here.
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => window.print()}>
              <IconDoc width={15} height={15} />
              Print all
            </Button>
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => regenerateArtifacts(jobId)}
                disabled={state.loadingArtifacts}
              >
                {state.loadingArtifacts ? "Regenerating…" : "Regenerate"}
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {artifacts.map((a) => (
            <ArtifactCard key={a.id} artifact={a} subtitle={docMeta} jobId={jobId} awb={b.awb} />
          ))}
        </div>
      </div>

      {/* Branded print layout (only visible when saving as PDF) */}
      <div className="hidden print:block">
        {artifacts.map((a) => (
          <div key={a.id} className="mb-8" style={{ pageBreakAfter: "always" }}>
            <div className="mb-3 flex items-center justify-between border-b-2 border-primary pb-2">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent">
                  <IconFMark width={15} height={15} className="text-fpasnavy" />
                </span>
                <div>
                  <div className="font-display text-sm font-bold text-ink">
                    First Point Animal Services
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                    Amsterdam · Import/Export
                  </div>
                </div>
              </div>
              <div className="text-right font-mono text-[10px] text-ink-faint">
                {a.filename}
              </div>
            </div>
            <h2 className="mb-2 font-display text-lg font-bold text-ink">
              {a.title}
            </h2>
            <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-ink">
              {a.body}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArtifactCard({
  artifact,
  subtitle,
  jobId,
  awb,
}: {
  artifact: DraftArtifact;
  subtitle: string;
  jobId: string;
  awb?: string;
}) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard?.writeText(artifact.body).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function pdf() {
    const qr =
      typeof window !== "undefined"
        ? `${window.location.origin}/jobs/${jobId}${awb ? `?awb=${encodeURIComponent(awb)}` : ""}`
        : undefined;
    downloadPdf(artifact.filename.replace(/\.[^.]+$/, ""), {
      title: artifact.title,
      subtitle,
      body: artifact.body,
      watermark: "DRAFT",
      qr,
    });
  }

  return (
    <Card>
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <div>
          <span className="text-sm font-semibold text-ink">
            {artifact.title}
          </span>
          <span className="ml-2 font-mono text-[11px] text-ink-faint">
            {artifact.filename}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="subtle" onClick={copy}>
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button variant="ghost" onClick={pdf}>
            <IconDownload width={14} height={14} />
            PDF
          </Button>
        </div>
      </div>
      <pre className="max-h-80 overflow-auto whitespace-pre-wrap px-4 py-3 font-mono text-[12px] leading-relaxed text-ink-soft">
        {artifact.body}
      </pre>
    </Card>
  );
}
