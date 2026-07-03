"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "./store";
import { usePrefs } from "./prefs";
import { IconSearch, IconArrowRight } from "./icons";
import { jobAwb, jobAgent, jobCommodity } from "@/lib/jobs";

interface Item {
  label: string;
  hint?: string;
  run: () => void;
}

export function CommandPalette() {
  const router = useRouter();
  const { jobs } = useStore();
  const { toggleDark } = usePrefs();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const items = useMemo<Item[]>(() => {
    const nav: Item[] = [
      { label: "Dashboard", hint: "page", run: () => router.push("/") },
      { label: "New booking", hint: "page", run: () => router.push("/jobs/new") },
      { label: "AI Copilot", hint: "page", run: () => router.push("/copilot") },
      { label: "How it works", hint: "page", run: () => router.push("/guide") },
      { label: "Contacts", hint: "page", run: () => router.push("/contacts") },
      { label: "Settings", hint: "page", run: () => router.push("/settings") },
      { label: "Toggle dark mode", hint: "action", run: () => toggleDark() },
    ];
    const jobItems: Item[] = jobs
      .filter((j) => !j.deletedAt)
      .map((j) => ({
      label: `${jobAwb(j)} · ${jobAgent(j)}`,
      hint: jobCommodity(j),
      run: () => router.push(`/jobs/${j.id}`),
    }));
    const all = [...nav, ...jobItems];
    const query = q.trim().toLowerCase();
    if (!query) return all.slice(0, 8);
    return all
      .filter((i) => (i.label + " " + (i.hint ?? "")).toLowerCase().includes(query))
      .slice(0, 10);
  }, [jobs, q, router, toggleDark]);

  function runItem(it: Item) {
    it.run();
    setOpen(false);
    setQ("");
  }

  if (!open) return null;

  return (
    <div className="no-print fixed inset-0 z-[70] flex items-start justify-center p-4 pt-[12vh]">
      <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-xl2 border border-line bg-panel shadow-lift">
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <IconSearch width={16} height={16} className="text-ink-faint" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && items[0]) runItem(items[0]);
            }}
            placeholder="Search jobs, pages, actions…"
            className="w-full bg-transparent text-sm text-ink focus:outline-none"
          />
          <span className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-ink-faint">
            ESC
          </span>
        </div>
        <div className="max-h-80 overflow-auto p-1.5">
          {items.length === 0 ? (
            <p className="px-3 py-6 text-center text-[13px] text-ink-soft">
              No matches.
            </p>
          ) : (
            items.map((it, idx) => (
              <button
                key={idx}
                onClick={() => runItem(it)}
                className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left hover:bg-bg"
              >
                <span className="truncate text-[13px] text-ink">{it.label}</span>
                <span className="flex items-center gap-2">
                  {it.hint && (
                    <span className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                      {it.hint}
                    </span>
                  )}
                  <IconArrowRight width={14} height={14} className="text-ink-faint" />
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
