"use client";

import { useEffect, useState } from "react";
import { IconAccessibility } from "./icons";
import { usePrefs } from "./prefs";
import { LANGS } from "@/lib/i18n";

const KEY = "fpas.a11y.v1";

interface Prefs {
  large: boolean;
  contrast: boolean;
}

function apply(prefs: Prefs) {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  el.classList.toggle("a11y-large", prefs.large);
  el.classList.toggle("a11y-contrast", prefs.contrast);
}

export function AccessibilityMenu() {
  const { lang, setLang, t } = usePrefs();
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>({ large: false, contrast: false });

  // Load saved prefs on mount.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const p = JSON.parse(raw) as Prefs;
        setPrefs(p);
        apply(p);
      }
    } catch {
      /* ignore */
    }
  }, []);

  function set(patch: Partial<Prefs>) {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    apply(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={t("a11y.title")}
        title={t("a11y.title")}
        className={`flex h-8 items-center gap-1.5 rounded-lg border px-2 transition-colors ${
          prefs.large || prefs.contrast
            ? "border-primary/50 bg-primary-soft text-primary"
            : "border-line bg-white text-ink-soft hover:text-ink"
        }`}
      >
        <IconAccessibility width={16} height={16} />
        <span className="hidden text-[12px] font-medium sm:inline">{t("a11y.title")}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-64 rounded-card border border-line bg-panel p-3 shadow-lift">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-wide text-ink-faint">
              {t("a11y.title")}
            </div>
            <Toggle
              label={t("a11y.largerText")}
              desc={t("a11y.largerTextDesc")}
              on={prefs.large}
              onChange={(v) => set({ large: v })}
            />
            <Toggle
              label={t("a11y.highContrast")}
              desc={t("a11y.highContrastDesc")}
              on={prefs.contrast}
              onChange={(v) => set({ contrast: v })}
            />

            {/* Language */}
            <div className="mt-2 border-t border-line px-2 pt-3">
              <label className="block">
                <span className="block text-[13px] font-medium text-ink">
                  {t("a11y.language")}
                </span>
                <span className="mb-1.5 block text-[11px] text-ink-soft">
                  {t("a11y.languageDesc")}
                </span>
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value as (typeof LANGS)[number]["id"])}
                  className="w-full rounded-lg border border-line-strong bg-white px-2 py-1.5 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {LANGS.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.flag} {l.native}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Toggle({
  label,
  desc,
  on,
  onChange,
}: {
  label: string;
  desc: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left hover:bg-bg"
    >
      <span>
        <span className="block text-[13px] font-medium text-ink">{label}</span>
        <span className="block text-[11px] text-ink-soft">{desc}</span>
      </span>
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          on ? "bg-primary" : "bg-line-strong"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
            on ? "left-[18px]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}
