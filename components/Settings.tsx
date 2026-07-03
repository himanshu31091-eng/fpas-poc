"use client";

import { useEffect, useState } from "react";
import { useStore } from "./store";
import { usePrefs } from "./prefs";
import { Button, Card, Eyebrow } from "./ui";
import { IconMoon, IconSun } from "./icons";

const LOCATIONS = ["Amsterdam (Schiphol BIP)", "Melbourne", "New Zealand (PAQ)", "Chicago"];

export function Settings() {
  const { jobs, resetDemo } = useStore();
  const { role, user, dark, toggleDark, toast } = usePrefs();
  const [location, setLocation] = useState(LOCATIONS[0]);

  useEffect(() => {
    try {
      const l = window.localStorage.getItem("fpas.location");
      if (l) setLocation(l);
    } catch {
      /* ignore */
    }
  }, []);

  function saveLocation(l: string) {
    setLocation(l);
    try {
      window.localStorage.setItem("fpas.location", l);
    } catch {
      /* ignore */
    }
    toast("Default location updated");
  }

  function exportJobs() {
    const blob = new Blob([JSON.stringify(jobs, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fpas-jobs.json";
    a.click();
    URL.revokeObjectURL(url);
    toast("Exported jobs as JSON", "success");
  }

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-5">
        <Eyebrow>Settings</Eyebrow>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">
          Workspace settings
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Configure this FPAS workspace. (Demo — changes are stored in your
          browser.)
        </p>
      </header>

      <div className="space-y-4">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-ink">Organisation</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[12px] text-ink-soft">
                Default location
              </span>
              <select
                value={location}
                onChange={(e) => saveLocation(e.target.value)}
                className="w-full rounded-md border border-line-strong bg-white px-2.5 py-1.5 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {LOCATIONS.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </label>
            <div>
              <span className="mb-1 block text-[12px] text-ink-soft">
                Signed in as
              </span>
              <div className="rounded-md border border-line bg-bg px-2.5 py-1.5 text-[13px] text-ink">
                {user} · <span className="font-mono uppercase text-ink-faint">{role}</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-ink">Appearance</h2>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <div className="text-[13px] font-medium text-ink">Dark mode</div>
              <div className="text-[12px] text-ink-soft">
                Larger text & high contrast live in the ♿ menu in the top bar.
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={toggleDark}>
              {dark ? <IconSun width={15} height={15} /> : <IconMoon width={15} height={15} />}
              {dark ? "Switch to light" : "Switch to dark"}
            </Button>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-ink">AI</h2>
          <p className="mt-2 text-[13px] text-ink-soft">
            AI screens call the Claude API live (model set via{" "}
            <span className="font-mono text-[12px]">ANTHROPIC_MODEL</span>). If a
            call fails, screens show a graceful retry — no mock reasoning.
          </p>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-ink">Data</h2>
          <p className="mt-1 text-[13px] text-ink-soft">
            Jobs are stored in this browser. Export a backup or reset to the demo
            samples.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={exportJobs}>
              Export jobs (JSON)
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                resetDemo();
                toast("Demo data reset", "success");
              }}
            >
              Reset demo data
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
