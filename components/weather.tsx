"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  fetchAmsForecast,
  mockForecastDay,
  weatherLabel,
  welfareFlag,
  type DayWeather,
} from "@/lib/weather";

// ---------------------------------------------------------------------------
// App-wide AMS forecast. Fetched once from Open-Meteo on mount; getDay() falls
// back to a deterministic mock for dates outside the forecast window or when
// the live call is unavailable. Returns null until the first fetch settles so
// SSR and the first client render agree (no hydration flash of mock data).
// ---------------------------------------------------------------------------

interface WeatherCtx {
  ready: boolean;
  live: boolean;
  getDay: (date?: string) => DayWeather | null;
}

const Ctx = createContext<WeatherCtx | null>(null);

export function WeatherProvider({ children }: { children: ReactNode }) {
  const [map, setMap] = useState<Map<string, DayWeather> | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), 6000);
    fetchAmsForecast(ac.signal)
      .then((m) => setMap(m))
      .catch(() => setMap(null))
      .finally(() => {
        clearTimeout(timeout);
        setReady(true);
      });
    return () => {
      clearTimeout(timeout);
      ac.abort();
    };
  }, []);

  const value = useMemo<WeatherCtx>(
    () => ({
      ready,
      live: !!map,
      getDay: (date) => {
        if (!date || !ready) return null;
        return map?.get(date) ?? mockForecastDay(date);
      },
    }),
    [map, ready]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWeather(): WeatherCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWeather must be used within WeatherProvider");
  return ctx;
}

// --- Display components -----------------------------------------------------

/** Compact temperature chip for job cards/rows. */
export function WeatherChip({
  date,
  className = "",
}: {
  date?: string;
  className?: string;
}) {
  const { getDay } = useWeather();
  const day = getDay(date);
  if (!day) return null;
  const w = weatherLabel(day.code);
  const est = day.source === "mock";
  return (
    <span
      title={`AMS ${day.date}: ${w.label}, ${Math.round(day.tempMinC)}–${Math.round(
        day.tempMaxC
      )}°C, wind ${Math.round(day.windKph)} km/h${
        est ? " · estimated (live forecast unavailable)" : ""
      }`}
      className={`inline-flex items-center gap-1 rounded-full bg-bg px-2 py-0.5 font-mono text-[10px] text-ink-soft ${className}`}
    >
      <span aria-hidden>{w.emoji}</span>
      {Math.round(day.tempMaxC)}°C{est ? "~" : ""}
    </span>
  );
}

/** Welfare warning badge — only rendered when arrival-day temps are risky. */
export function WelfareBadge({
  date,
  className = "",
}: {
  date?: string;
  className?: string;
}) {
  const { getDay } = useWeather();
  const day = getDay(date);
  if (!day) return null;
  const flag = welfareFlag(day);
  if (flag.level === "ok") return null;
  const cls =
    flag.level === "heat" ? "bg-red/10 text-red" : "bg-cyan/10 text-cyan";
  return (
    <span
      title={`Arrival-day AMS forecast — ${flag.label}`}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide ${cls} ${className}`}
    >
      {flag.level === "heat" ? "☀︎" : "❄︎"} {flag.label}
    </span>
  );
}

/** Fuller arrival-weather panel for the job detail page. */
export function WeatherPanel({
  date,
  arrivalTime,
}: {
  date?: string;
  arrivalTime?: string;
}) {
  const { getDay } = useWeather();
  const day = getDay(date);
  if (!date || !day) return null;
  const w = weatherLabel(day.code);
  const flag = welfareFlag(day);
  const flagCls =
    flag.level === "heat"
      ? "bg-red/10 text-red"
      : flag.level === "cold"
      ? "bg-cyan/10 text-cyan"
      : "bg-green-soft text-green";
  return (
    <div className="mb-5 flex flex-wrap items-center gap-4 rounded-card border border-line bg-panel p-4 shadow-card">
      <div className="flex items-center gap-3">
        <span className="text-2xl" aria-hidden>
          {w.emoji}
        </span>
        <div>
          <div className="text-sm font-semibold text-ink">
            Amsterdam Schiphol · {day.date}
            {arrivalTime ? ` · ${arrivalTime}` : ""}
          </div>
          <div className="text-[12px] text-ink-soft">
            {w.label} · {Math.round(day.tempMinC)}–{Math.round(day.tempMaxC)}°C ·
            wind {Math.round(day.windKph)} km/h
          </div>
        </div>
      </div>
      <span
        className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${flagCls}`}
      >
        {flag.label}
      </span>
      <span className="ml-auto font-mono text-[10px] uppercase tracking-wide text-ink-faint">
        {day.source === "live" ? "live · open-meteo" : "estimated"}
      </span>
    </div>
  );
}
