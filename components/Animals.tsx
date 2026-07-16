"use client";

import { useState } from "react";
import { usePrefs } from "./prefs";
import { Card, Eyebrow, SimTag } from "./ui";
import { IconSearch, IconAlert } from "./icons";
import { QRCode } from "./QRCode";
import { SEED_ANIMALS, daysUntil, type Animal } from "@/lib/animals";

export function Animals() {
  const { t } = usePrefs();
  const [q, setQ] = useState("");

  const list = SEED_ANIMALS.filter((a) =>
    [a.name, a.species, a.breed, a.chip, a.owner]
      .join(" ")
      .toLowerCase()
      .includes(q.trim().toLowerCase())
  );

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Eyebrow>{t("nav.animals")}</Eyebrow>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">
            {t("an.title")}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-ink-soft">{t("an.subtitle")}</p>
        </div>
        <SimTag />
      </header>

      <div className="flex max-w-md items-center gap-2 rounded-xl border border-line-strong bg-white px-3 py-2">
        <IconSearch width={15} height={15} className="text-ink-faint" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("an.search")}
          className="flex-1 bg-transparent text-[13px] text-ink outline-none"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {list.map((a) => (
          <AnimalCard key={a.id} a={a} t={t} />
        ))}
      </div>

      <p className="font-mono text-[10.5px] text-ink-faint">{t("an.footer")}</p>
    </div>
  );
}

function AnimalCard({ a, t }: { a: Animal; t: (k: string) => string }) {
  const expired = a.vax.find((v) => daysUntil(v.exp) < 0);
  const soon = a.vax.find((v) => daysUntil(v.exp) >= 0 && daysUntil(v.exp) <= 45);

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-display text-[15px] font-bold text-ink">{a.name}</div>
          <div className="mt-0.5 font-mono text-[11px] text-ink-faint">
            {a.species} · {a.breed}
          </div>
        </div>
        {a.cites && (
          <span className="rounded-md border border-primary/30 bg-primary-soft px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide text-primary">
            CITES
          </span>
        )}
      </div>

      <div className="mt-3 space-y-1">
        <Kv k={t("an.microchip")} v={a.chip} />
        <Kv k={t("an.passport")} v={a.passport || "—"} warn={!a.passport} />
        <Kv k={t("an.owner")} v={a.owner} />
        <Kv k={t("an.weight")} v={`${a.weightKg} kg`} />
        <Kv k={t("an.linkedJob")} v={a.job} />
      </div>

      <div className="mt-3 border-t border-line pt-2.5">
        <div className="mb-1.5 font-mono text-[9.5px] uppercase tracking-wide text-ink-faint">
          {t("an.vax")}
        </div>
        {a.vax.length === 0 ? (
          <span className="text-[12px] text-ink-faint">{t("an.none")}</span>
        ) : (
          a.vax.map((v) => {
            const d = daysUntil(v.exp);
            const c = d < 0 ? "text-red" : d <= 45 ? "text-amber" : "text-ink-soft";
            return (
              <div key={v.name} className="flex items-center justify-between text-[12px]">
                <span className="text-ink">{v.name}</span>
                <span className={`font-mono ${c}`}>
                  {v.exp}
                  {d < 0 ? ` · ${t("an.expiredTag")}` : d <= 45 ? ` · ${d}d` : ""}
                </span>
              </div>
            );
          })
        )}
      </div>

      {(expired || soon) && (
        <div
          className={`mt-2.5 flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11.5px] font-medium ${
            expired
              ? "border-red/30 bg-red-soft text-red"
              : "border-amber/30 bg-amber-soft text-amber"
          }`}
        >
          <IconAlert width={13} height={13} />
          {expired ? t("an.expired") : t("an.dueSoon")}
        </div>
      )}

      {a.notes && (
        <div className="mt-2.5 text-[12px] italic text-ink-soft">{a.notes}</div>
      )}

      {a.chip && a.chip !== "—" && (
        <div className="mt-3 flex justify-center border-t border-line pt-3">
          <QRCode value={a.chip} size={92} caption="microchip" />
        </div>
      )}
    </Card>
  );
}

function Kv({ k, v, warn }: { k: string; v: string; warn?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[12.5px]">
      <span className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">{k}</span>
      <span className={`font-mono text-right ${warn ? "text-red" : "text-ink"}`}>{v}</span>
    </div>
  );
}
