"use client";

import { AGENT_EMAILS } from "@/lib/mockData";
import { Card } from "./ui";

const FLAVOUR_LABEL: Record<string, string> = {
  clean: "well-structured",
  messy: "informal / buried detail",
  incomplete: "missing fields",
};

/**
 * Controlled agent-email picker. Used inside New Booking to choose a sample
 * message to create a job from. (Originally the standalone intake screen.)
 */
export function EmailPicker({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const selected = AGENT_EMAILS.find((e) => e.id === selectedId);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      {/* List */}
      <div className="space-y-2">
        {AGENT_EMAILS.map((email) => {
          const active = email.id === selectedId;
          return (
            <button
              key={email.id}
              onClick={() => onSelect(email.id)}
              className={`block w-full rounded-card border p-3 text-left transition-colors ${
                active
                  ? "border-primary bg-primary-soft"
                  : "border-line bg-panel hover:border-line-strong"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] text-ink-faint">
                  {email.agent}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                  {FLAVOUR_LABEL[email.flavour]}
                </span>
              </div>
              <div className="mt-1 truncate text-sm font-medium text-ink">
                {email.subject}
              </div>
              <div className="mt-0.5 font-mono text-[11px] text-ink-faint">
                {email.receivedAt}
                {email.attachment ? ` · 📎 ${email.attachment}` : ""}
              </div>
            </button>
          );
        })}
      </div>

      {/* Reading pane */}
      <Card className="flex flex-col">
        {selected ? (
          <>
            <div className="border-b border-line px-4 py-3">
              <div className="text-sm font-semibold text-ink">
                {selected.subject}
              </div>
              <div className="mt-0.5 font-mono text-[11px] text-ink-faint">
                {selected.from}
              </div>
            </div>
            <pre className="flex-1 whitespace-pre-wrap px-4 py-3 font-mono text-[12.5px] leading-relaxed text-ink-soft">
              {selected.body}
            </pre>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-10 text-center text-sm text-ink-faint">
            Select a message to read it.
          </div>
        )}
      </Card>
    </div>
  );
}
