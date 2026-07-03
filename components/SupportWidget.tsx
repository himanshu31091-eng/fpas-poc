"use client";

import Link from "next/link";
import { useState } from "react";
import { usePrefs } from "./prefs";
import { Button } from "./ui";
import { IconHelp, IconSparkles, IconDoc } from "./icons";

export function SupportWidget() {
  const { toast } = usePrefs();
  const [open, setOpen] = useState(false);
  const [contact, setContact] = useState(false);
  const [msg, setMsg] = useState("");

  function send() {
    if (!msg.trim()) return;
    setMsg("");
    setContact(false);
    setOpen(false);
    toast("Support request sent (demo)", "success");
  }

  return (
    <div className="no-print fixed bottom-5 right-5 z-40">
      {open && (
        <div className="mb-3 w-72 animate-fade-up rounded-card border border-line bg-panel p-3 shadow-lift">
          {!contact ? (
            <>
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-white">
                  <IconHelp width={16} height={16} />
                </span>
                <span className="text-sm font-semibold text-ink">
                  How can we help?
                </span>
              </div>
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
                  onClick={() => setContact(true)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[13px] text-ink-soft hover:bg-bg"
                >
                  <IconHelp width={16} height={16} className="text-primary" />
                  Contact support
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-2 text-sm font-semibold text-ink">
                Contact support
              </div>
              <textarea
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                rows={3}
                placeholder="Describe your issue…"
                className="w-full rounded-md border border-line-strong bg-white px-2.5 py-1.5 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => setContact(false)}
                  className="text-[12px] text-ink-faint hover:text-ink"
                >
                  Back
                </button>
                <Button size="sm" onClick={send} disabled={!msg.trim()}>
                  Send
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      <button
        onClick={() => {
          setOpen((o) => !o);
          setContact(false);
        }}
        aria-label="Help & support"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white shadow-glow transition-all hover:-translate-y-0.5"
      >
        <IconHelp width={22} height={22} />
      </button>
    </div>
  );
}
