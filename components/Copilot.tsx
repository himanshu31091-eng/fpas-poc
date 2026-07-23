"use client";

import { useState } from "react";
import { useStore } from "./store";
import { useStaff } from "./staffStore";
import { usePrefs } from "./prefs";
import { Button, Card, Eyebrow, Spinner } from "./ui";
import { Markdown } from "./Markdown";
import { IconSparkles, IconArrowRight } from "./icons";
import { jobsContext, requiredCrew } from "@/lib/jobs";
import { staffContext } from "@/lib/staff";

const SUGGESTIONS = [
  "What's arriving in the next 48 hours?",
  "Who's on leave this week?",
  "Are we short-staffed on any shipment day?",
  "What's blocking the EQUITRANS job?",
];

interface Msg {
  role: "user" | "assistant";
  text: string;
}

export function Copilot() {
  const { jobs } = useStore();
  const { team, roster, leave, profiles } = useStaff();
  const { t } = usePrefs();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          question: q,
          context:
            jobsContext(jobs.filter((j) => !j.deletedAt), new Date()) +
            "\n\n" +
            staffContext(
              team,
              roster,
              leave,
              new Date(),
              (d) => requiredCrew(jobs, d),
              7,
              profiles
            ),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Request failed (${res.status})`);
      }
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", text: data.answer ?? "" }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Copilot call failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-5">
        <Eyebrow>{t("copilot.eyebrow")}</Eyebrow>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">
          {t("copilot.title")}
        </h1>
        <p className="mt-1 max-w-xl text-sm text-ink-soft">
          {t("copilot.subtitle")}
        </p>
      </header>

      {/* Conversation */}
      <Card className="mb-3 min-h-[240px] p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-white shadow-glow">
              <IconSparkles width={24} height={24} />
            </span>
            <p className="text-sm text-ink-soft">
              Try one of these to get started:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className="rounded-full border border-line bg-white px-3 py-1.5 text-[12px] text-ink-soft transition-all hover:border-primary/40 hover:text-ink"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3.5 py-2 text-[13.5px] leading-relaxed ${
                    m.role === "user"
                      ? "whitespace-pre-wrap bg-brand text-white"
                      : "bg-bg text-ink ring-1 ring-line"
                  }`}
                >
                  {m.role === "user" ? m.text : <Markdown text={m.text} />}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="rounded-xl bg-bg px-3.5 py-2 ring-1 ring-line">
                  <Spinner label="Thinking…" />
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {error && (
        <div className="mb-3 rounded-xl border border-red/40 bg-red-soft/50 px-3 py-2 text-[13px] text-ink">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wide text-red">
            AI unavailable ·{" "}
          </span>
          {error}
        </div>
      )}

      {/* Composer */}
      <div className="flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              ask(input);
            }
          }}
          rows={2}
          placeholder={t("copilot.placeholder")}
          className="flex-1 resize-none rounded-xl border border-line-strong bg-white px-3 py-2 text-[13.5px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <Button onClick={() => ask(input)} disabled={busy || !input.trim()}>
          <IconArrowRight width={16} height={16} />
          {t("copilot.ask")}
        </Button>
      </div>
    </div>
  );
}
