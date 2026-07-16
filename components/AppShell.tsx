"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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
import {
  IconGrid,
  IconPlus,
  IconDoc,
  IconFMark,
  IconSparkles,
  IconClipboard,
  IconUsers,
  IconGear,
  IconMenu,
  IconClose,
  IconChevronLeft,
  IconBox,
  IconPaw,
} from "./icons";

type NavItem = {
  href: string;
  key: string;
  icon: (p: { width?: number; height?: number }) => JSX.Element;
  tour?: string;
  editOnly?: boolean;
};

// Grouped navigation — sidebar sections, an ops-console convention.
const NAV_GROUPS: { section: string; items: NavItem[] }[] = [
  {
    section: "nav.section.operations",
    items: [
      { href: "/", key: "nav.dashboard", icon: IconGrid },
      { href: "/jobs/new", key: "nav.new", icon: IconPlus, tour: "nav-new", editOnly: true },
      { href: "/housing", key: "nav.housing", icon: IconBox },
      { href: "/animals", key: "nav.animals", icon: IconPaw },
      { href: "/staffing", key: "nav.staffing", icon: IconUsers, tour: "nav-staffing" },
    ],
  },
  {
    section: "nav.section.assistant",
    items: [{ href: "/copilot", key: "nav.copilot", icon: IconSparkles, tour: "nav-copilot" }],
  },
  {
    section: "nav.section.reference",
    items: [
      { href: "/guide", key: "nav.guide", icon: IconDoc, tour: "nav-guide" },
      { href: "/requirements", key: "nav.requirements", icon: IconClipboard, tour: "nav-requirements" },
    ],
  },
  {
    section: "nav.section.manage",
    items: [{ href: "/settings", key: "nav.settings", icon: IconGear }],
  },
];

const SIDEBAR_BG =
  "linear-gradient(180deg,#2A2570 0%,#231F5C 42%,#1B1740 100%)";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { hydrated: jobsHydrated } = useStore();
  const { hydrated: prefsHydrated, signedIn, canEdit, logo, t } = usePrefs();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile drawer on navigation.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Wait for prefs to hydrate before deciding auth (avoids a login flash).
  if (!prefsHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <BrandLoader label="Starting…" />
      </div>
    );
  }

  if (!signedIn) return <Login />;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  /* ------------------------------ sidebar ------------------------------ */
  const Sidebar = (
    <div
      className="flex h-full w-full flex-col text-white"
      style={{ background: SIDEBAR_BG }}
    >
      {/* Brand */}
      <div className="px-4 pb-4 pt-5">
        <Link href="/" className="flex items-center gap-2.5">
          {logo ? (
            <span className="flex h-9 items-center rounded-lg bg-white/95 px-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo} alt="Logo" className="h-6 w-auto max-w-[150px] object-contain" />
            </span>
          ) : (
            <>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent shadow-glow">
                <IconFMark width={17} height={17} className="text-fpasnavy" />
              </span>
              <span className="leading-none">
                <span className="block font-display text-[15px] font-bold tracking-tight text-white">
                  First Point
                </span>
                <span className="mt-0.5 block font-mono text-[9.5px] uppercase tracking-[0.16em] text-white/55">
                  Animal Services
                </span>
              </span>
            </>
          )}
        </Link>

        {/* Station switcher */}
        <Link
          href="/settings"
          className="mt-4 flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 font-mono text-[11px] text-white/80 transition-colors hover:bg-white/10"
        >
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            {t("nav.station")}
          </span>
          <IconChevronLeft width={13} height={13} className="rotate-180 opacity-60" />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2.5 pb-4">
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((i) => !i.editOnly || canEdit);
          if (items.length === 0) return null;
          return (
            <div key={group.section} className="mb-1.5">
              <div className="px-3 pb-1 pt-3 font-mono text-[9.5px] font-medium uppercase tracking-[0.12em] text-white/35">
                {t(group.section)}
              </div>
              {items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    data-tour={item.tour}
                    className={`relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] transition-colors ${
                      active
                        ? "bg-white/[0.12] font-semibold text-white"
                        : "font-medium text-white/70 hover:bg-white/[0.07] hover:text-white"
                    }`}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-accent" />
                    )}
                    <Icon width={16} height={16} />
                    {t(item.key)}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 px-4 py-3">
        <div className="font-mono text-[9.5px] leading-relaxed text-white/40">
          PROTOTYPE · mock data only
          <br />
          no live regulatory integrations
        </div>
      </div>
    </div>
  );

  const hydrated = jobsHydrated;

  return (
    <div className="flex min-h-screen">
      {/* ----- Desktop sidebar ----- */}
      <aside className="no-print sticky top-0 hidden h-screen w-[236px] shrink-0 lg:block">
        {Sidebar}
      </aside>

      {/* ----- Mobile drawer ----- */}
      {menuOpen && (
        <div className="no-print fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[248px] animate-fade-in shadow-lift">
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white"
            >
              <IconClose width={18} height={18} />
            </button>
            {Sidebar}
          </div>
        </div>
      )}

      {/* ------------------------------ main ------------------------------ */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="no-print sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-panel/85 px-4 py-2.5 backdrop-blur-md sm:px-6">
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-ink-soft transition-colors hover:bg-bg hover:text-ink lg:hidden"
          >
            <IconMenu width={20} height={20} />
          </button>

          {/* Compact brand mark (mobile — sidebar hidden) */}
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
              <IconFMark width={15} height={15} className="text-fpasnavy" />
            </span>
          </Link>

          <span className="hidden lg:block">
            <LiveTag label={t("tag.liveAI")} />
          </span>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => window.dispatchEvent(new Event("fpas:start-tour"))}
              className="hidden items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-[12px] font-medium text-ink-soft transition-colors hover:border-primary/40 hover:text-ink xl:inline-flex"
            >
              <IconSparkles width={14} height={14} />
              {t("action.takeTour")}
            </button>
            {canEdit && (
              <Link
                href="/jobs/new"
                className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3 py-1.5 text-[13px] font-semibold text-fpasnavy shadow-glow transition-all hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <IconPlus width={15} height={15} />
                <span className="hidden sm:inline">{t("nav.new")}</span>
              </Link>
            )}
            <NotificationsBell />
            <AccessibilityMenu />
            <AccountMenu />
          </div>
        </header>

        {/* Disclosure banner */}
        <div className="no-print bg-brand px-6 py-1.5 text-center font-mono text-[10.5px] font-medium uppercase tracking-wide text-white/90">
          {t("banner.poc")}
        </div>

        {/* Content */}
        <main className="mx-auto w-full max-w-[1180px] flex-1 px-4 py-6 sm:px-8 sm:py-8">
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
      </div>

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

function LiveTag({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white/70 px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wide text-ink-soft"
      title="AI screens call the Claude API live. A missing key or failed call shows a retry panel."
    >
      <span className="h-1.5 w-1.5 rounded-full bg-green" />
      {label}
    </span>
  );
}
