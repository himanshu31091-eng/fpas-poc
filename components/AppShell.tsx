"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "./store";
import { BrandLoader } from "./ui";
import { usePrefs } from "./prefs";
import { Login } from "./Login";
import { AccessibilityMenu } from "./AccessibilityMenu";
import { AccountMenu } from "./AccountMenu";
import { NotificationsBell } from "./NotificationsBell";
import { SupportWidget } from "./SupportWidget";
import { CommandPalette } from "./CommandPalette";
import { Tour } from "./Tour";
import { IconGrid, IconPlus, IconDoc, IconHorseshoe, IconSparkles } from "./icons";

const NAV = [
  { href: "/", label: "Dashboard", icon: IconGrid },
  { href: "/jobs/new", label: "New booking", icon: IconPlus },
  { href: "/copilot", label: "Copilot", icon: IconSparkles },
  { href: "/guide", label: "How it works", icon: IconDoc },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { hydrated: jobsHydrated } = useStore();
  const { hydrated: prefsHydrated, signedIn, canEdit } = usePrefs();
  const pathname = usePathname();
  const nav = NAV.filter((n) => n.href !== "/jobs/new" || canEdit);

  // Wait for prefs to hydrate before deciding auth (avoids a login flash).
  if (!prefsHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <BrandLoader label="Starting…" />
      </div>
    );
  }

  // Role-based login landing.
  if (!signedIn) return <Login />;

  const hydrated = jobsHydrated;

  return (
    <div className="min-h-screen">
      {/* Disclosure banner — non-negotiable for this demo */}
      <div className="no-print bg-brand px-6 py-2 text-center font-mono text-[11px] font-medium uppercase tracking-wide text-white/90">
        Proof of concept · mock data only · no live regulatory or airline
        integrations
      </div>

      {/* Top nav */}
      <header className="no-print sticky top-0 z-20 border-b border-line glass">
        <div className="mx-auto flex max-w-[1200px] items-center gap-6 px-6 py-3">
          <Link href="/" className="mr-2 flex shrink-0 items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white shadow-glow">
              <IconHorseshoe width={20} height={20} />
            </span>
            <span>
              <span className="block font-display text-[15px] font-bold leading-none tracking-tight text-ink">
                FPAS Job Manager
              </span>
              <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                Amsterdam · Import
              </span>
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            {nav.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-tour={
                    item.href === "/jobs/new"
                      ? "nav-new"
                      : item.href === "/copilot"
                      ? "nav-copilot"
                      : item.href === "/guide"
                      ? "nav-guide"
                      : undefined
                  }
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition-all ${
                    active
                      ? "bg-primary-soft text-primary"
                      : "text-ink-soft hover:bg-white hover:text-ink"
                  }`}
                >
                  <Icon width={16} height={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => window.dispatchEvent(new Event("fpas:start-tour"))}
              className="hidden items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-[12px] font-medium text-ink-soft transition-colors hover:border-primary/40 hover:text-ink sm:inline-flex"
            >
              <IconSparkles width={14} height={14} />
              Take a tour
            </button>
            <span className="hidden sm:block">
              <LiveTag />
            </span>
            <NotificationsBell />
            <AccessibilityMenu />
            <AccountMenu />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto min-w-0 max-w-[1200px] px-6 py-8">
        {hydrated ? (
          <div key={pathname} className="animate-fade-up">
            {children}
          </div>
        ) : (
          <div className="rounded-card border border-line bg-panel p-10 shadow-card">
            <BrandLoader label="Loading jobs…" />
          </div>
        )}
      </main>

      {hydrated && (
        <>
          <Tour />
          <SupportWidget />
          <CommandPalette />
        </>
      )}
    </div>
  );
}

function LiveTag() {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white/70 px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wide text-ink-soft"
      title="AI screens call the Claude API live. A missing key or failed call shows a retry panel."
    >
      <span className="h-1.5 w-1.5 rounded-full bg-green" />
      live AI
    </span>
  );
}
