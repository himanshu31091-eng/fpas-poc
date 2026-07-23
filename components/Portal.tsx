"use client";

import { useEffect, useState } from "react";
import { usePrefs } from "./prefs";
import { Button, Card, Eyebrow, SimTag } from "./ui";
import { IconCheck, IconClose, IconArrowRight } from "./icons";
import {
  seedRequests,
  loadRequests,
  saveRequests,
  makeDocs,
  portalStatus,
  type PortalRequest,
  type PortalStatus,
} from "@/lib/portal";

const COMMODITIES = ["Live horses", "Companion animals", "Ornamental fish", "Zoo animals", "Other"];

const STATUS_STYLE: Record<PortalStatus, string> = {
  submitted: "bg-bg text-ink-faint ring-1 ring-line-strong",
  docsPending: "bg-amber-soft text-amber",
  ready: "bg-green-soft text-green",
};

const EMPTY = { agent: "", commodity: "Live horses", origin: "", flight: "", date: "", animalCount: "", notes: "" };

export function Portal() {
  const { t, toast } = usePrefs();
  const [reqs, setReqs] = useState<PortalRequest[]>(() => seedRequests());
  const [form, setForm] = useState({ ...EMPTY });

  useEffect(() => {
    const saved = loadRequests();
    if (saved) setReqs(saved);
  }, []);

  function persist(next: PortalRequest[]) {
    setReqs(next);
    saveRequests(next);
  }

  function submit() {
    if (!form.agent.trim() || !form.commodity.trim()) return;
    const r: PortalRequest = {
      id: `req-${Date.now()}`,
      agent: form.agent.trim(),
      commodity: form.commodity,
      origin: form.origin.trim(),
      flight: form.flight.trim(),
      date: form.date,
      animalCount: form.animalCount.trim(),
      notes: form.notes.trim(),
      awb: "",
      docs: makeDocs(form.commodity),
      createdAt: new Date().toISOString(),
    };
    persist([r, ...reqs]);
    setForm({ ...EMPTY });
    toast("Request submitted", "success");
  }

  function setDoc(reqId: string, docName: string, filename: string | null) {
    persist(
      reqs.map((r) =>
        r.id !== reqId
          ? r
          : {
              ...r,
              docs: r.docs.map((d) =>
                d.name === docName
                  ? { ...d, uploaded: !!filename, filename: filename ?? undefined }
                  : d
              ),
            }
      )
    );
  }
  function setAwb(reqId: string, awb: string) {
    persist(reqs.map((r) => (r.id === reqId ? { ...r, awb } : r)));
  }
  function remove(reqId: string) {
    persist(reqs.filter((r) => r.id !== reqId));
  }

  const inp =
    "w-full rounded-md border border-line-strong bg-white px-2.5 py-1.5 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/30";
  const lbl = "mb-1 block text-[12px] text-ink-soft";

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Eyebrow>{t("nav.portal")}</Eyebrow>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">
            {t("portal.title")}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-ink-soft">{t("portal.subtitle")}</p>
        </div>
        <SimTag />
      </header>

      {/* New request */}
      <Card className="p-4">
        <div className="mb-3 text-sm font-semibold text-ink">{t("portal.newTitle")}</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="block">
            <span className={lbl}>{t("nb.enq.name")}</span>
            <input className={inp} value={form.agent} onChange={(e) => setForm({ ...form, agent: e.target.value })} />
          </label>
          <label className="block">
            <span className={lbl}>{t("bf.field.commodity")}</span>
            <select className={inp} value={form.commodity} onChange={(e) => setForm({ ...form, commodity: e.target.value })}>
              {COMMODITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={lbl}>{t("bf.field.origin")}</span>
            <input className={inp} value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} />
          </label>
          <label className="block">
            <span className={lbl}>{t("bf.field.flight")}</span>
            <input className={`${inp} font-mono`} value={form.flight} onChange={(e) => setForm({ ...form, flight: e.target.value })} />
          </label>
          <label className="block">
            <span className={lbl}>{t("bf.field.arrivalDate")}</span>
            <input type="date" className={`${inp} font-mono`} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </label>
          <label className="block">
            <span className={lbl}>{t("bf.field.animalCount")}</span>
            <input className={`${inp} font-mono`} value={form.animalCount} onChange={(e) => setForm({ ...form, animalCount: e.target.value })} />
          </label>
        </div>
        <label className="mt-3 block">
          <span className={lbl}>{t("portal.notes")}</span>
          <textarea rows={2} className={inp} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </label>
        <div className="mt-3 flex justify-end">
          <Button onClick={submit} disabled={!form.agent.trim()}>
            {t("portal.submit")}
          </Button>
        </div>
      </Card>

      {/* My requests */}
      <div>
        <div className="mb-2 font-mono text-[11px] uppercase tracking-wide text-ink-faint">
          {t("portal.mine")}
        </div>
        {reqs.length === 0 ? (
          <Card className="p-8 text-center text-sm text-ink-soft">{t("portal.empty")}</Card>
        ) : (
          <div className="space-y-3">
            {reqs.map((r) => {
              const status = portalStatus(r);
              const have = r.docs.filter((d) => d.uploaded).length;
              return (
                <Card key={r.id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[14px] font-bold text-ink">
                          {r.flight || "TBC"}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${STATUS_STYLE[status]}`}>
                          {t(`portal.st.${status}`)}
                        </span>
                        {r.accepted && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-soft px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-green">
                            <IconCheck width={10} height={10} />
                            Accepted by ops
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-[12.5px] text-ink-soft">
                        {r.agent} · {r.commodity}
                        {r.origin ? ` · ${r.origin}` : ""} {r.date ? `· ${r.date}` : ""}
                        {r.animalCount ? ` · ${r.animalCount}` : ""}
                      </div>
                    </div>
                    <button
                      onClick={() => remove(r.id)}
                      className="text-ink-faint transition-colors hover:text-red"
                      title="Remove"
                    >
                      <IconClose width={15} height={15} />
                    </button>
                  </div>

                  {r.notes && <div className="mt-2 text-[12.5px] italic text-ink-soft">{r.notes}</div>}

                  {/* Doc checklist */}
                  <div className="mt-3 border-t border-line pt-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[12px] font-semibold text-ink">{t("portal.docs")}</span>
                      <span className="font-mono text-[11px] text-ink-faint">
                        {t("portal.progress", { have, need: r.docs.length })}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {r.docs.map((d) => (
                        <div key={d.name} className="flex items-center gap-2 text-[13px]">
                          <span
                            className={`inline-grid h-5 w-5 shrink-0 place-items-center rounded-md ${
                              d.uploaded ? "bg-green-soft text-green" : "bg-bg text-ink-faint ring-1 ring-line-strong"
                            }`}
                          >
                            {d.uploaded ? <IconCheck width={12} height={12} /> : ""}
                          </span>
                          <span className={d.uploaded ? "text-ink" : "text-ink-soft"}>{d.name}</span>
                          {d.uploaded ? (
                            <span className="ml-auto flex items-center gap-2">
                              <span className="font-mono text-[11px] text-ink-faint">{d.filename}</span>
                              <button
                                onClick={() => setDoc(r.id, d.name, null)}
                                className="text-ink-faint hover:text-red"
                                title="Remove"
                              >
                                <IconClose width={13} height={13} />
                              </button>
                            </span>
                          ) : (
                            <label className="ml-auto cursor-pointer rounded-lg border border-line-strong bg-white px-2.5 py-1 font-mono text-[11px] text-ink-soft transition-colors hover:border-primary/40 hover:text-ink">
                              {t("portal.upload")}
                              <input
                                type="file"
                                className="hidden"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  e.target.value = "";
                                  if (f) setDoc(r.id, d.name, f.name);
                                }}
                              />
                            </label>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* AWB confirm */}
                    <label className="mt-3 flex items-center gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                        {t("bf.field.awb")}
                      </span>
                      <input
                        value={r.awb}
                        onChange={(e) => setAwb(r.id, e.target.value)}
                        placeholder="176-…"
                        className="flex-1 rounded-md border border-line-strong bg-white px-2.5 py-1 font-mono text-[12.5px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      {status === "ready" && <IconArrowRight width={15} height={15} className="text-green" />}
                    </label>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
