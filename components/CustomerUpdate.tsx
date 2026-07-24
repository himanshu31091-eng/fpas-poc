"use client";

import { useState } from "react";
import { useStore } from "./store";
import { usePrefs } from "./prefs";
import { Button, Card, ErrorRetry } from "./ui";
import { IconSparkles } from "./icons";

export function CustomerUpdate({ jobId }: { jobId: string }) {
  const { getJob, draftCustomerUpdate, markUpdateSent } = useStore();
  const { canEdit } = usePrefs();
  const job = getJob(jobId);
  const update = job?.booking?.customerUpdate;

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!job?.booking) {
    return (
      <Card className="p-10 text-center text-sm text-ink-soft">
        No booking yet. Create the booking first.
      </Card>
    );
  }

  async function draft() {
    setBusy(true);
    setError(null);
    try {
      await draftCustomerUpdate(jobId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Draft failed.");
    } finally {
      setBusy(false);
    }
  }

  function copy() {
    if (!update?.body) return;
    navigator.clipboard?.writeText(update.body).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <IconSparkles width={16} height={16} className="text-primary" />
          Movement update to customer / agent
        </div>
        <p className="mt-1 text-[13px] text-ink-soft">
          The assistant drafts a plain-language status update from the current
          state of this shipment. Review, copy, and send it yourself. (Mock — no
          email leaves this demo.)
        </p>
        {canEdit && (
          <div className="mt-3">
            <Button onClick={draft} disabled={busy}>
              <IconSparkles width={15} height={15} />
              {busy ? "Drafting…" : update ? "Re-draft update" : "Draft update with AI"}
            </Button>
          </div>
        )}
      </Card>

      {error && <ErrorRetry message={error} onRetry={draft} busy={busy} />}

      {update && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-ink-faint">
              Drafted {new Date(update.draftedAt).toLocaleString()}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="subtle" size="sm" onClick={copy}>
                {copied ? "Copied" : "Copy"}
              </Button>
              {update.sentAt ? (
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wide text-green">
                  ● sent
                </span>
              ) : (
                canEdit && (
                  <Button size="sm" onClick={() => markUpdateSent(jobId)}>
                    Mark sent
                  </Button>
                )
              )}
            </div>
          </div>
          <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-xl bg-bg/60 px-3 py-2 font-mono text-[12.5px] leading-relaxed text-ink-soft">
            {update.body}
          </pre>
          {update.sentAt && (
            <div className="mt-2 font-mono text-[11px] text-ink-faint">
              {update.sentBy} · {new Date(update.sentAt).toLocaleString()}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
