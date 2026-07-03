"use client";

import { useState } from "react";
import { usePrefs, ROLES, type Role } from "./prefs";
import { FlightAnimation } from "./FlightAnimation";
import {
  IconHorseshoe,
  IconGear,
  IconBox,
  IconDoc,
  IconArrowRight,
} from "./icons";

const ROLE_ICON: Record<Role, (p: { width?: number; height?: number }) => JSX.Element> = {
  admin: IconGear,
  ops: IconBox,
  viewer: IconDoc,
};

const ROLE_ACCESS: Record<Role, string> = {
  admin: "Everything, including Settings & data controls",
  ops: "Create & work jobs, run AI, draft documents",
  viewer: "Read-only — view jobs, readiness & documents",
};

export function Login() {
  const { signIn } = usePrefs();
  const [heroFailed, setHeroFailed] = useState(false);
  const [heroOk, setHeroOk] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Brand backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-brand opacity-95" />
      <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 left-10 h-80 w-80 rounded-full bg-white/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-12">
        {/* Brand */}
        <div className="mb-8 text-center text-white">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30">
            <IconHorseshoe width={28} height={28} />
          </span>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            FPAS Job Manager
          </h1>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-white/70">
            Amsterdam · Live-animal import & export
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/85">
            Choose a role to sign in. This is a proof-of-concept demo — no
            password needed; access inside adapts to the role you pick.
          </p>
        </div>

        {/* Optional hero photo (drop public/animals/hero.jpg) with animation fallback */}
        {!heroFailed && (
          <div
            className={`mb-8 w-full max-w-md overflow-hidden rounded-xl2 ring-1 ring-white/25 ${
              heroOk ? "block" : "hidden"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/animals/hero.jpg"
              alt="Live-animal air transport"
              onLoad={() => setHeroOk(true)}
              onError={() => setHeroFailed(true)}
              className="h-44 w-full object-cover"
            />
          </div>
        )}
        {(!heroOk || heroFailed) && (
          <div className="mb-8 flex w-full justify-center">
            <FlightAnimation />
          </div>
        )}

        {/* Role cards */}
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
          {ROLES.map((r) => {
            const Icon = ROLE_ICON[r.id];
            return (
              <button
                key={r.id}
                onClick={() => signIn(r.id as Role)}
                className="group flex flex-col rounded-card border border-white/20 bg-white/95 p-5 text-left shadow-lift transition-all hover:-translate-y-1 hover:bg-white"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white shadow-glow">
                  <Icon width={20} height={20} />
                </span>
                <div className="mt-3 font-display text-lg font-bold text-ink">
                  {r.label}
                </div>
                <div className="mt-0.5 text-[12px] text-ink-soft">{r.desc}</div>
                <div className="mt-3 border-t border-line pt-3 text-[12px] leading-snug text-ink-soft">
                  {ROLE_ACCESS[r.id]}
                </div>
                <div className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-primary">
                  Sign in
                  <IconArrowRight
                    width={15}
                    height={15}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </div>
              </button>
            );
          })}
        </div>

        <p className="mt-6 text-center font-mono text-[11px] text-white/60">
          Signed in as himanshu.pandey@moreyeahs.com · switch roles anytime by
          signing out
        </p>
      </div>
    </div>
  );
}
