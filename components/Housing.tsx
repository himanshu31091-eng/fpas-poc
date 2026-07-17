"use client";

import { useEffect, useMemo, useState } from "react";
import { usePrefs } from "./prefs";
import { Card, Eyebrow, SimTag } from "./ui";
import { IconArrowRight, IconCheck, IconSparkles, IconBox } from "./icons";
import { QRCode, useOrigin } from "./QRCode";
import {
  seedUnits,
  loadUnits,
  saveUnits,
  advanceUnit,
  UNIT_FLOW,
  type HousingUnit,
  type UnitStatus,
} from "@/lib/housing";

const STATUS_STYLE: Record<UnitStatus, { chip: string; card: string; dot: string }> = {
  Available: { chip: "bg-bg text-ink-faint", card: "border-line bg-panel", dot: "bg-ink-faint" },
  Occupied: { chip: "bg-primary-soft text-primary", card: "border-primary/20 bg-primary-soft/25", dot: "bg-primary" },
  Dirty: { chip: "bg-amber-soft text-amber", card: "border-amber/30 bg-amber-soft/40", dot: "bg-amber" },
  Cleaning: { chip: "bg-cyan/10 text-cyan", card: "border-cyan/30 bg-cyan/5", dot: "bg-cyan" },
  Ready: { chip: "bg-green-soft text-green", card: "border-green/30 bg-green-soft/40", dot: "bg-green" },
};

const STAT_STATUSES: UnitStatus[] = ["Available", "Occupied", "Dirty", "Cleaning", "Ready"];

export function Housing() {
  const { t } = usePrefs();
  const origin = useOrigin();
  const [units, setUnits] = useState<HousingUnit[]>(() => seedUnits());
  const [focus, setFocus] = useState<string | null>(null);

  useEffect(() => {
    const saved = loadUnits();
    if (saved && saved.length) setUnits(saved);
    // Deep link: /housing?unit=ST-A1 → highlight + scroll to that unit.
    const unit = new URLSearchParams(window.location.search).get("unit");
    if (unit) {
      setFocus(unit);
      setTimeout(() => {
        document.getElementById(`unit-${unit}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 200);
    }
  }, []);

  function advance(id: string) {
    setUnits((prev) => {
      const next = advanceUnit(prev, id);
      saveUnits(next);
      return next;
    });
  }

  const counts = useMemo(
    () =>
      units.reduce<Record<string, number>>((a, u) => {
        a[u.status] = (a[u.status] || 0) + 1;
        return a;
      }, {}),
    [units]
  );
  const occupied = counts.Occupied || 0;
  const util = units.length ? Math.round((occupied / units.length) * 100) : 0;
  const zones = useMemo(() => Array.from(new Set(units.map((u) => u.zone))), [units]);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Eyebrow>{t("nav.housing")}</Eyebrow>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">
            {t("house.title")}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-ink-soft">{t("house.subtitle")}</p>
        </div>
        <SimTag />
      </header>

      {/* Stat row */}
      <div className="flex flex-wrap gap-3">
        <StatBox
          label={t("house.util")}
          value={`${util}%`}
          sub={t("house.inUse", { n: occupied, total: units.length })}
          tint={util > 80 ? "text-red" : "text-primary"}
        />
        {STAT_STATUSES.map((s) => (
          <StatBox
            key={s}
            label={t(`house.status.${s}`)}
            value={String(counts[s] || 0)}
            sub={t("house.units")}
            dot={STATUS_STYLE[s].dot}
          />
        ))}
      </div>

      {/* Zones */}
      {zones.map((zone) => {
        const zoneUnits = units.filter((u) => u.zone === zone);
        return (
          <Card key={zone} className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <IconBox width={15} height={15} />
              </span>
              <span className="text-sm font-semibold text-ink">{zone}</span>
              <span className="font-mono text-[11px] text-ink-faint">· {zoneUnits[0].species}</span>
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {zoneUnits.map((u) => {
                const style = STATUS_STYLE[u.status];
                const flow = UNIT_FLOW[u.status];
                return (
                  <div
                    key={u.id}
                    id={`unit-${u.id}`}
                    className={`rounded-card border p-3 transition-colors ${style.card} ${
                      focus === u.id ? "ring-2 ring-primary ring-offset-2" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[13px] font-bold text-ink">{u.id}</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${style.chip}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                        {t(`house.status.${u.status}`)}
                      </span>
                    </div>
                    <div className="mt-2 min-h-[20px] text-[13px]">
                      {u.occupant ? (
                        <span className="font-medium text-ink">{u.occupant}</span>
                      ) : (
                        <span className="text-ink-faint">{u.type}</span>
                      )}
                    </div>
                    {flow.actionKey && (
                      <button
                        onClick={() => advance(u.id)}
                        className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-line-strong bg-white px-2.5 py-1.5 font-mono text-[11px] font-medium text-ink-soft transition-colors hover:border-primary/40 hover:text-ink"
                      >
                        {u.status === "Cleaning" ? (
                          <IconCheck width={13} height={13} />
                        ) : u.status === "Dirty" ? (
                          <IconSparkles width={13} height={13} />
                        ) : (
                          <IconArrowRight width={13} height={13} />
                        )}
                        {t(flow.actionKey)}
                      </button>
                    )}
                    {origin && (
                      <div className="mt-2.5 flex justify-center border-t border-line/70 pt-2.5">
                        <QRCode value={`${origin}/housing?unit=${encodeURIComponent(u.id)}`} size={104} caption={u.id} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function StatBox({
  label,
  value,
  sub,
  tint = "text-ink",
  dot,
}: {
  label: string;
  value: string;
  sub: string;
  tint?: string;
  dot?: string;
}) {
  return (
    <div className="min-w-[130px] flex-1 rounded-card border border-line bg-panel p-4 shadow-panel">
      <div className="flex items-center gap-1.5">
        {dot && <span className={`h-2 w-2 rounded-full ${dot}`} />}
        <span className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">{label}</span>
      </div>
      <div className={`mt-1.5 font-mono text-[26px] font-bold tracking-tight ${tint}`}>{value}</div>
      <div className="mt-0.5 text-[11px] text-ink-faint">{sub}</div>
    </div>
  );
}
