"use client";

import Link from "next/link";
import { useState } from "react";
import { usePrefs } from "./prefs";
import {
  IconChevronDown,
  IconGear,
  IconLogout,
  IconMoon,
  IconSun,
  IconUsers,
} from "./icons";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AccountMenu() {
  const { user, role, isAdmin, dark, toggleDark, signOut, toast } = usePrefs();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-line bg-white py-1 pl-1 pr-2 text-ink-soft transition-colors hover:text-ink"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
          {initials(user)}
        </span>
        <IconChevronDown width={14} height={14} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-64 rounded-card border border-line bg-panel p-3 shadow-lift">
            <div className="flex items-center gap-2 border-b border-line pb-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                {initials(user)}
              </span>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold text-ink">
                  {user}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                  {role}
                </div>
              </div>
            </div>

            <div className="space-y-0.5 pt-2">
              <button
                onClick={toggleDark}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] text-ink-soft hover:bg-bg"
              >
                {dark ? <IconSun width={16} height={16} /> : <IconMoon width={16} height={16} />}
                {dark ? "Light mode" : "Dark mode"}
              </button>
              <Link
                href="/contacts"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] text-ink-soft hover:bg-bg"
              >
                <IconUsers width={16} height={16} />
                Contacts
              </Link>
              {isAdmin && (
                <Link
                  href="/settings"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] text-ink-soft hover:bg-bg"
                >
                  <IconGear width={16} height={16} />
                  Settings
                </Link>
              )}
              <button
                onClick={() => {
                  setOpen(false);
                  signOut();
                  toast("Signed out — pick a role");
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] text-ink-soft hover:bg-bg"
              >
                <IconLogout width={16} height={16} />
                Sign out / switch role
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
