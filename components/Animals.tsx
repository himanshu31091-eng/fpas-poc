"use client";

import { useEffect, useState } from "react";
import { usePrefs } from "./prefs";
import { Button, Card, Eyebrow, SimTag } from "./ui";
import { IconSearch, IconAlert, IconPlus, IconTrash, IconGear, IconClose } from "./icons";
import { QRCode, useOrigin } from "./QRCode";
import {
  SEED_ANIMALS,
  loadAnimals,
  saveAnimals,
  upsertAnimal,
  removeAnimal,
  daysUntil,
  PROTO_TODAY,
  type Animal,
  type Vax,
} from "@/lib/animals";
import {
  seedUnits,
  loadUnits,
  saveUnits,
  placeAnimal,
  type HousingUnit,
} from "@/lib/housing";

export function Animals() {
  const { t, canEdit, toast } = usePrefs();
  const [q, setQ] = useState("");
  const [animals, setAnimals] = useState<Animal[]>(() => SEED_ANIMALS);
  const [units, setUnits] = useState<HousingUnit[]>([]);
  const [editing, setEditing] = useState<Animal | "new" | null>(null);

  useEffect(() => {
    const saved = loadAnimals();
    if (saved && saved.length) setAnimals(saved);
    setUnits(loadUnits() ?? seedUnits());
    const chip = new URLSearchParams(window.location.search).get("chip");
    if (chip) setQ(chip);
  }, []);

  function placeInUnit(animal: Animal, unitId: string) {
    const next = placeAnimal(units, unitId, { id: animal.id, name: animal.name }, PROTO_TODAY);
    setUnits(next);
    saveUnits(next);
    toast(`${animal.name} → ${unitId}`, "success");
  }

  function commit(next: Animal[]) {
    setAnimals(next);
    saveAnimals(next);
  }
  function saveAnimal(a: Animal) {
    commit(upsertAnimal(animals, a));
    setEditing(null);
    toast(t("common.save") + " · " + a.name, "success");
  }
  function deleteAnimal(id: string, name: string) {
    commit(removeAnimal(animals, id));
    toast(t("common.remove") + " · " + name);
  }

  const list = animals.filter((a) =>
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
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button size="sm" onClick={() => setEditing("new")}>
              <IconPlus width={15} height={15} />
              {t("an.addAnimal")}
            </Button>
          )}
          <SimTag />
        </div>
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

      {list.length === 0 && (
        <Card className="border-dashed p-8 text-center">
          <p className="text-[13px] text-ink-soft">
            {animals.length === 0
              ? t("ui.an.emptyRegistry")
              : t("ui.an.noMatch", { q })}
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {list.map((a) => (
          <AnimalCard
            key={a.id}
            a={a}
            t={t}
            canEdit={canEdit}
            unit={units.find((u) => u.animalId === a.id) ?? null}
            availableUnits={units.filter((u) => u.status === "Available")}
            onPlace={(unitId) => placeInUnit(a, unitId)}
            onEdit={() => setEditing(a)}
            onDelete={() => deleteAnimal(a.id, a.name)}
          />
        ))}
      </div>

      <p className="font-mono text-[10.5px] text-ink-faint">{t("an.footer")}</p>

      {editing && (
        <AnimalForm
          initial={editing === "new" ? null : editing}
          t={t}
          onCancel={() => setEditing(null)}
          onSave={saveAnimal}
        />
      )}
    </div>
  );
}

function AnimalCard({
  a,
  t,
  canEdit,
  unit,
  availableUnits,
  onPlace,
  onEdit,
  onDelete,
}: {
  a: Animal;
  t: (k: string) => string;
  canEdit: boolean;
  unit: HousingUnit | null;
  availableUnits: HousingUnit[];
  onPlace: (unitId: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const origin = useOrigin();
  const [placing, setPlacing] = useState(false);
  const [pick, setPick] = useState("");
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
        <div className="flex items-center gap-1.5">
          {canEdit && (
            <>
              <button onClick={onEdit} title={t("common.edit")} className="text-ink-faint transition-colors hover:text-primary">
                <IconGear width={13} height={13} />
              </button>
              <button onClick={onDelete} title={t("common.remove")} className="text-ink-faint transition-colors hover:text-red">
                <IconTrash width={13} height={13} />
              </button>
            </>
          )}
          {a.cites && (
            <span className="rounded-md border border-primary/30 bg-primary-soft px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide text-primary">
              CITES
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 space-y-1">
        <Kv k={t("an.microchip")} v={a.chip} />
        <Kv k={t("an.passport")} v={a.passport || "—"} warn={!a.passport} />
        <Kv k={t("an.owner")} v={a.owner} />
        <Kv k={t("an.weight")} v={`${a.weightKg} kg`} />
        <Kv k={t("an.linkedJob")} v={a.job} />
      </div>

      {/* Housing placement — the animal → housing link. */}
      <div className="mt-2.5 border-t border-line pt-2.5">
        <div className="flex items-center justify-between gap-2 text-[12.5px]">
          <span className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
            {t("ui.an.housing")}
          </span>
          {unit ? (
            <a
              href={`/housing?unit=${encodeURIComponent(unit.id)}`}
              className="font-mono text-right text-primary hover:underline"
            >
              {unit.id} · {unit.zone}
            </a>
          ) : (
            <span className="font-mono text-ink-faint">{t("ui.an.notHoused")}</span>
          )}
        </div>
        {canEdit && !unit && (
          placing ? (
            <div className="mt-2 flex items-center gap-1.5">
              <select
                value={pick}
                onChange={(e) => setPick(e.target.value)}
                className="min-w-0 flex-1 rounded-md border border-line-strong bg-white px-2 py-1 text-[12px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">{t("ui.an.chooseFreeUnit")}</option>
                {availableUnits.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.id} · {u.zone} ({u.species})
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                onClick={() => {
                  if (pick) {
                    onPlace(pick);
                    setPlacing(false);
                    setPick("");
                  }
                }}
                disabled={!pick}
              >
                {t("ui.an.place")}
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setPlacing(true)}
              disabled={availableUnits.length === 0}
              className="mt-2 w-full rounded-lg border border-line px-2.5 py-1.5 text-[12px] text-ink-soft transition-colors hover:border-primary/40 hover:text-ink disabled:opacity-50"
            >
              {availableUnits.length ? t("ui.an.placeInHousing") : t("ui.an.noFreeUnits")}
            </button>
          )
        )}
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

      {a.chip && a.chip !== "—" && origin && (
        <div className="mt-3 flex justify-center border-t border-line pt-3">
          <QRCode value={`${origin}/animals?chip=${encodeURIComponent(a.chip)}`} size={132} caption="microchip" />
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

let idSeq = 0;

function AnimalForm({
  initial,
  t,
  onCancel,
  onSave,
}: {
  initial: Animal | null;
  t: (k: string) => string;
  onCancel: () => void;
  onSave: (a: Animal) => void;
}) {
  const [f, setF] = useState<Animal>(
    initial ?? {
      id: `A-${Date.now()}-${idSeq++}`,
      name: "",
      species: "Horses",
      breed: "",
      chip: "",
      passport: "",
      owner: "",
      job: "",
      weightKg: 0,
      vax: [],
      cites: false,
      notes: "",
    }
  );
  const set = (k: keyof Animal, v: string | number | boolean) =>
    setF((p) => ({ ...p, [k]: v } as Animal));
  const setVax = (i: number, k: keyof Vax, v: string) =>
    setF((p) => ({ ...p, vax: p.vax.map((x, idx) => (idx === i ? { ...x, [k]: v } : x)) }));
  const addVax = () => setF((p) => ({ ...p, vax: [...p.vax, { name: "", exp: "" }] }));
  const rmVax = (i: number) => setF((p) => ({ ...p, vax: p.vax.filter((_, idx) => idx !== i) }));

  const inp =
    "w-full rounded-md border border-line-strong bg-white px-2.5 py-1.5 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/30";
  const canSave = f.name.trim().length > 0;

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-xl2 border border-line bg-panel shadow-lift">
        <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-3.5">
          <span className="text-sm font-semibold text-ink">
            {initial ? t("an.editAnimal") : t("an.addAnimal")}
          </span>
          <button onClick={onCancel} className="flex h-7 w-7 items-center justify-center rounded-lg bg-bg text-ink-soft hover:text-ink">
            <IconClose width={15} height={15} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 overflow-y-auto p-5 sm:grid-cols-2">
          <Field label={t("an.f.name")}><input className={inp} value={f.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <Field label={t("an.f.species")}><input className={inp} value={f.species} onChange={(e) => set("species", e.target.value)} /></Field>
          <Field label={t("an.f.breed")}><input className={inp} value={f.breed} onChange={(e) => set("breed", e.target.value)} /></Field>
          <Field label={t("an.microchip")}><input className={`${inp} font-mono`} value={f.chip} onChange={(e) => set("chip", e.target.value)} /></Field>
          <Field label={t("an.passport")}><input className={`${inp} font-mono`} value={f.passport} onChange={(e) => set("passport", e.target.value)} /></Field>
          <Field label={t("an.owner")}><input className={inp} value={f.owner} onChange={(e) => set("owner", e.target.value)} /></Field>
          <Field label={t("an.f.job")}><input className={`${inp} font-mono`} value={f.job} onChange={(e) => set("job", e.target.value)} /></Field>
          <Field label={t("an.weight") + " (kg)"}><input type="number" className={`${inp} font-mono`} value={f.weightKg} onChange={(e) => set("weightKg", Number(e.target.value))} /></Field>
          <label className="col-span-full mt-1 flex items-center gap-2 text-[13px] text-ink">
            <input type="checkbox" checked={f.cites} onChange={(e) => set("cites", e.target.checked)} className="h-4 w-4 rounded border-line-strong text-primary focus:ring-primary/30" />
            {t("an.f.cites")}
          </label>
          <Field label={t("an.f.notes")} full><input className={inp} value={f.notes} onChange={(e) => set("notes", e.target.value)} /></Field>

          {/* Vaccinations */}
          <div className="col-span-full">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[12px] text-ink-soft">{t("an.vax")}</span>
              <button onClick={addVax} className="inline-flex items-center gap-1 font-mono text-[11px] text-primary hover:underline">
                <IconPlus width={12} height={12} /> {t("an.addVax")}
              </button>
            </div>
            <div className="space-y-2">
              {f.vax.map((v, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input className={inp} placeholder={t("an.vaccine")} value={v.name} onChange={(e) => setVax(i, "name", e.target.value)} />
                  <input className={`${inp} font-mono`} placeholder={t("an.expiry")} value={v.exp} onChange={(e) => setVax(i, "exp", e.target.value)} />
                  <button onClick={() => rmVax(i)} className="shrink-0 text-ink-faint hover:text-red"><IconTrash width={14} height={14} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-line px-5 py-3">
          <Button variant="ghost" size="sm" onClick={onCancel}>{t("common.cancel")}</Button>
          <Button size="sm" onClick={() => canSave && onSave(f)} disabled={!canSave}>{t("common.save")}</Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <label className={`block ${full ? "col-span-full" : ""}`}>
      <span className="mb-1 block text-[12px] text-ink-soft">{label}</span>
      {children}
    </label>
  );
}
