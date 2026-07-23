// ---------------------------------------------------------------------------
// FPAS POC — housing & occupancy (the BIP holding facility).
// Units move through a cleaning lifecycle between occupants:
//   Occupied → Dirty → Cleaning → Ready → Available
// ---------------------------------------------------------------------------

export type UnitStatus = "Available" | "Occupied" | "Dirty" | "Cleaning" | "Ready";

export interface HousingUnit {
  id: string;
  zone: string;
  type: string;
  species: string;
  status: UnitStatus;
  /** Current occupant animal/consignment, if Occupied. */
  occupant: string;
  /** Linked animal-registry id, when the occupant is a registered animal. */
  animalId?: string;
  /** ISO date occupancy began. */
  since: string;
}

/** Place a registered animal into a unit (Occupied). Clears any other unit it held. */
export function placeAnimal(
  units: HousingUnit[],
  unitId: string,
  animal: { id: string; name: string },
  since: string
): HousingUnit[] {
  return units.map((u) => {
    if (u.id === unitId) {
      return { ...u, occupant: animal.name, animalId: animal.id, status: "Occupied", since };
    }
    // An animal lives in one place — vacate any prior unit it occupied.
    if (u.animalId === animal.id) {
      return { ...u, occupant: "", animalId: undefined, status: "Dirty", since: "" };
    }
    return u;
  });
}

/** Lifecycle transition + the i18n key for its action button. */
export const UNIT_FLOW: Record<
  UnitStatus,
  { next: UnitStatus | null; actionKey: string | null }
> = {
  Occupied: { next: "Dirty", actionKey: "house.action.checkOut" },
  Dirty: { next: "Cleaning", actionKey: "house.action.startCleaning" },
  Cleaning: { next: "Ready", actionKey: "house.action.signOff" },
  Ready: { next: "Available", actionKey: "house.action.returnToPool" },
  Available: { next: null, actionKey: null },
};

export const HOUSING_KEY = "fpas.housing.v3";

export function seedUnits(): HousingUnit[] {
  return [
    { id: "ST-A1", zone: "Stables A", type: "Stable", species: "Horses", status: "Occupied", occupant: "Baloubet", since: "2026-07-22" },
    { id: "ST-A2", zone: "Stables A", type: "Stable", species: "Horses", status: "Occupied", occupant: "Cornetto", since: "2026-07-22" },
    { id: "ST-A3", zone: "Stables A", type: "Stable", species: "Horses", status: "Dirty", occupant: "", since: "" },
    { id: "ST-A4", zone: "Stables A", type: "Stable", species: "Horses", status: "Available", occupant: "", since: "" },
    { id: "ST-B1", zone: "Stables B", type: "Stable", species: "Horses", status: "Available", occupant: "", since: "" },
    { id: "ST-B2", zone: "Stables B", type: "Stable", species: "Horses", status: "Cleaning", occupant: "", since: "" },
    { id: "K-1", zone: "Kennels", type: "Kennel L", species: "Dogs", status: "Occupied", occupant: "Rocky", since: "2026-07-22" },
    { id: "K-2", zone: "Kennels", type: "Kennel M", species: "Dogs", status: "Available", occupant: "", since: "" },
    { id: "K-3", zone: "Kennels", type: "Kennel S", species: "Dogs", status: "Ready", occupant: "", since: "" },
    { id: "AV-1", zone: "Aviary", type: "Aviary", species: "Birds / insects", status: "Available", occupant: "", since: "" },
    { id: "TQ-1", zone: "Aqua", type: "Tank", species: "Ornamental fish", status: "Occupied", occupant: "Koi consignment", since: "2026-07-21" },
    { id: "TQ-2", zone: "Aqua", type: "Tank", species: "Ornamental fish", status: "Available", occupant: "", since: "" },
    { id: "ISO-1", zone: "Isolation", type: "Isolation", species: "Any (quarantine)", status: "Occupied", occupant: "Reticulated python", since: "2026-07-22" },
    { id: "ISO-2", zone: "Isolation", type: "Isolation", species: "Any (quarantine)", status: "Available", occupant: "", since: "" },
  ];
}

export function loadUnits(): HousingUnit[] | null {
  try {
    const raw = window.localStorage.getItem(HOUSING_KEY);
    return raw ? (JSON.parse(raw) as HousingUnit[]) : null;
  } catch {
    return null;
  }
}

export function saveUnits(units: HousingUnit[]) {
  try {
    window.localStorage.setItem(HOUSING_KEY, JSON.stringify(units));
  } catch {
    /* ignore */
  }
}

/** Advance a unit to the next lifecycle state; clears occupant on check-out. */
export function advanceUnit(units: HousingUnit[], id: string): HousingUnit[] {
  return units.map((u) => {
    if (u.id !== id) return u;
    const next = UNIT_FLOW[u.status].next;
    if (!next) return u;
    const checkingOut = next === "Dirty";
    return {
      ...u,
      status: next,
      occupant: checkingOut ? "" : u.occupant,
      animalId: checkingOut ? undefined : u.animalId,
      since: checkingOut ? "" : u.since,
    };
  });
}

/** Insert a new unit or replace an existing one (matched by id). */
export function upsertUnit(units: HousingUnit[], unit: HousingUnit): HousingUnit[] {
  const i = units.findIndex((u) => u.id === unit.id);
  if (i === -1) return [...units, unit];
  const next = units.slice();
  next[i] = unit;
  return next;
}

/** Remove a unit by id. */
export function removeUnit(units: HousingUnit[], id: string): HousingUnit[] {
  return units.filter((u) => u.id !== id);
}
