"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePrefs } from "./prefs";
import { Button } from "./ui";
import { IconHelp, IconSparkles, IconDoc, IconCheck, IconClose, IconClipboard } from "./icons";
import {
  addTicket,
  setTicketStatus,
  removeTicket,
  openCount,
  loadTickets,
  saveTickets,
  type Ticket,
} from "@/lib/support";

type View = "menu" | "contact" | "list";

export function SupportWidget() {
  const { toast } = usePrefs();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("menu");
  const [msg, setMsg] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    setTickets(loadTickets() ?? []);
  }, []);

  function commit(next: Ticket[]) {
    setTickets(next);
    saveTickets(next);
  }

  function send() {
    if (!msg.trim()) return;
    const id = `T-${Date.now().toString(36).toUpperCase().slice(-5)}`;
    commit(addTicket(tickets, msg, id, new Date().toISOString()));
    setMsg("");
    setView("list");
    toast(`Request ${id} raised (demo)`, "success");
  }

  const openN = openCount(tickets);

  return (
    <div className="no-print fixed bottom-5 right-5 z-40">
      {open && (
        <div className="mb-3 w-80 animate-fade-up rounded-card border border-line bg-panel p-3 shadow-lift">
          {/* Header */}
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-white">
              <IconHelp width={16} height={16} />
            </span>
            <span className="text-sm font-semibold text-ink">
              {view === "contact" ? "Raise a request" : view === "list" ? "Your requests" : "How can we help?"}
            </span>
            {view !== "menu" && (
              <button
                onClick={() => setView("menu")}
                className="ml-auto text-[12px] text-ink-faint hover:text-ink"
              >
                Back
              </button>
            )}
          </div>

          {view === "menu" && (
            <div className="space-y-1">
              <Link
                href="/guide"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-lg px-2 py-2 text-[13px] text-ink-soft hover:bg-bg"
              >
                <IconDoc width={16} height={16} className="text-primary" />
                Read the guide
              </Link>
              <Link
                href="/copilot"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-lg px-2 py-2 text-[13px] text-ink-soft hover:bg-bg"
              >
                <IconSparkles width={16} height={16} className="text-primary" />
                Ask the AI Copilot
              </Link>
              <button
                onClick={() => setView("contact")}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[13px] text-ink-soft hover:bg-bg"
              >
                <IconHelp width={16} height={16} className="text-primary" />
                Raise a request
              </button>
              {tickets.length > 0 && (
                <button
                  onClick={() => setView("list")}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[13px] text-ink-soft hover:bg-bg"
                >
                  <IconClipboard width={16} height={16} className="text-primary" />
                  Your requests
                  <span className="ml-auto rounded-full bg-bg px-2 py-0.5 font-mono text-[10px] font-semibold text-ink-soft">
                    {openN} open
                  </span>
                </button>
              )}
            </div>
          )}

          {view === "contact" && (
            <>
              <textarea
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                rows={3}
                placeholder="Describe your issue or question…"
                className="w-full rounded-md border border-line-strong bg-white px-2.5 py-1.5 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <div className="mt-2 flex items-center justify-end">
                <Button size="sm" onClick={send} disabled={!msg.trim()}>
                  Submit request
                </Button>
              </div>
            </>
          )}

          {view === "list" && (
            <div className="max-h-72 space-y-1.5 overflow-y-auto">
              {tickets.length === 0 ? (
                <p className="px-2 py-6 text-center text-[13px] text-ink-faint">No requests yet.</p>
              ) : (
                tickets.map((t) => (
                  <div key={t.id} className="rounded-lg border border-line bg-bg/50 p-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-semibold text-ink">{t.id}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide ${
                          t.status === "open" ? "bg-amber-soft text-amber" : "bg-green-soft text-green"
                        }`}
                      >
                        {t.status}
                      </span>
                      <button
                        onClick={() => commit(removeTicket(tickets, t.id))}
                        title="Remove"
                        className="ml-auto text-ink-faint hover:text-red"
                      >
                        <IconClose width={13} height={13} />
                      </button>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[12.5px] text-ink-soft">{t.message}</p>
                    <button
                      onClick={() =>
                        commit(setTicketStatus(tickets, t.id, t.status === "open" ? "resolved" : "open"))
                      }
                      className="mt-1.5 inline-flex items-center gap-1 font-mono text-[11px] text-primary hover:underline"
                    >
                      <IconCheck width={12} height={12} />
                      {t.status === "open" ? "Mark resolved" : "Reopen"}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => {
          setOpen((o) => !o);
          setView("menu");
        }}
        aria-label="Help & support"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white shadow-glow transition-all hover:-translate-y-0.5"
      >
        <IconHelp width={22} height={22} />
      </button>
    </div>
  );
}
