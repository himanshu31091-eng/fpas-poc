// ---------------------------------------------------------------------------
// FPAS POC — animal registry. Per-animal welfare/compliance records:
// microchip, passport, owner, vaccinations (with expiry alerts) and CITES.
// Read-only demo data; a stand-in for the full registry (travel history,
// document attachments, breed/owner records) on the roadmap.
// ---------------------------------------------------------------------------

export interface Vax {
  name: string;
  /** ISO expiry date. */
  exp: string;
}

export interface Animal {
  id: string;
  name: string;
  species: string;
  breed: string;
  /** Microchip number, or "—" if not chipped. */
  chip: string;
  passport: string;
  /** Owner / booking agent. */
  owner: string;
  /** Linked shipment (flight · agent). */
  job: string;
  weightKg: number;
  vax: Vax[];
  cites: boolean;
  notes: string;
}

/** Fixed "today" for deterministic expiry maths (no Date.now in the POC). */
export const PROTO_TODAY = "2026-07-24";

export function daysUntil(d: string): number {
  return Math.round(
    (new Date(d).getTime() - new Date(PROTO_TODAY).getTime()) / 86_400_000
  );
}

export const ANIMALS_KEY = "fpas.animals.v2";

export function loadAnimals(): Animal[] | null {
  try {
    const raw = window.localStorage.getItem(ANIMALS_KEY);
    return raw ? (JSON.parse(raw) as Animal[]) : null;
  } catch {
    return null;
  }
}

export function saveAnimals(animals: Animal[]) {
  try {
    window.localStorage.setItem(ANIMALS_KEY, JSON.stringify(animals));
  } catch {
    /* ignore */
  }
}

/** Insert a new animal or replace an existing one (matched by id). */
export function upsertAnimal(animals: Animal[], a: Animal): Animal[] {
  const i = animals.findIndex((x) => x.id === a.id);
  if (i === -1) return [a, ...animals]; // new entries appear at the top
  const next = animals.slice();
  next[i] = a;
  return next;
}

/** Remove an animal by id. */
export function removeAnimal(animals: Animal[], id: string): Animal[] {
  return animals.filter((x) => x.id !== id);
}

export const SEED_ANIMALS: Animal[] = [
  { id: "H-001", name: "Baloubet", species: "Horses", breed: "KWPN", chip: "528210004471820", passport: "NLD-2018-004471", owner: "IRT AUS", job: "EK9022 · IRT AUS", weightKg: 585, vax: [{ name: "Equine influenza", exp: "2026-11-14" }], cites: false, notes: "" },
  { id: "H-002", name: "Cornetto", species: "Horses", breed: "Holsteiner", chip: "276098100223145", passport: "DEU-2017-223145", owner: "IRT AUS", job: "EK9022 · IRT AUS", weightKg: 601, vax: [{ name: "Equine influenza", exp: "2027-02-02" }], cites: false, notes: "Quiet loader" },
  { id: "H-003", name: "Bella", species: "Horses", breed: "KWPN", chip: "528210002210019", passport: "", owner: "IRT AUS", job: "EK9022 · IRT AUS", weightKg: 560, vax: [{ name: "Equine influenza", exp: "2026-07-31" }], cites: false, notes: "Passport outstanding" },
  { id: "H-004", name: "Casall", species: "Horses", breed: "Holsteiner", chip: "276020000119345", passport: "DEU-2016-119345", owner: "IRT AUS", job: "EK9022 · IRT AUS", weightKg: 590, vax: [{ name: "Equine influenza", exp: "2026-07-28" }], cites: false, notes: "" },
  { id: "D-001", name: "Rocky", species: "Dogs", breed: "Beagle", chip: "956000012345678", passport: "NLD-PET-88213", owner: "Skye Pet Travel", job: "QR273 · Skye Pet Travel", weightKg: 14, vax: [{ name: "Rabies", exp: "2028-04-10" }], cites: false, notes: "" },
  { id: "Z-001", name: "Reticulated python", species: "Zoo animals", breed: "M. reticulatus", chip: "—", passport: "CITES-II-NL-4471", owner: "HSI", job: "CX9042 · HSI", weightKg: 38, vax: [], cites: true, notes: "CITES Appendix II permit" },
  { id: "F-001", name: "Koi consignment (44)", species: "Ornamental fish", breed: "Mixed koi", chip: "—", passport: "—", owner: "Zoo", job: "SQ324 · Zoo", weightKg: 636, vax: [], cites: false, notes: "3 pallets · water-quality check" },
];
