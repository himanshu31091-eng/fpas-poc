"use client";

import { Card, Eyebrow } from "./ui";
import { IconPaw, IconPlane } from "./icons";
import { SHIPPING_AGENTS } from "@/lib/mockData";
import { AIRLINE_RECIPIENTS } from "@/lib/jobs";

export function Contacts() {
  const airlines = Object.entries(AIRLINE_RECIPIENTS);

  return (
    <div>
      <header className="mb-5">
        <Eyebrow>Contacts</Eyebrow>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">
          Agents &amp; airlines
        </h1>
        <p className="mt-1 max-w-xl text-sm text-ink-soft">
          The contacts database that feeds bookings and load-list delivery —
          mirrors the HCL Contacts selection.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <IconPaw width={18} height={18} />
            </span>
            <h2 className="text-sm font-semibold text-ink">
              Shipping agents ({SHIPPING_AGENTS.length})
            </h2>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SHIPPING_AGENTS.map((a) => (
              <span
                key={a}
                className="rounded-full border border-line bg-bg px-2.5 py-1 text-[12px] text-ink-soft"
              >
                {a}
              </span>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <IconPlane width={18} height={18} />
            </span>
            <h2 className="text-sm font-semibold text-ink">
              Airlines &amp; load-list recipients
            </h2>
          </div>
          <div className="space-y-3">
            {airlines.map(([name, recips]) => (
              <div key={name}>
                <div className="text-[13px] font-medium text-ink">
                  {name}{" "}
                  <span className="font-mono text-[11px] text-ink-faint">
                    · {recips.length} recipient{recips.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {recips.map((r) => (
                    <span
                      key={r}
                      className="rounded bg-bg px-1.5 py-0.5 font-mono text-[11px] text-ink-soft"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
