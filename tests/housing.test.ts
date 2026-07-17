import { describe, it, expect } from "vitest";
import { advanceUnit, upsertUnit, removeUnit, seedUnits, type HousingUnit } from "@/lib/housing";

const u = (o: Partial<HousingUnit>): HousingUnit => ({
  id: "U1", zone: "Z", type: "T", species: "S", status: "Occupied", occupant: "X", since: "2026-07-01", ...o,
});

describe("housing · advanceUnit", () => {
  it("Occupied → Dirty and clears the occupant", () => {
    const [r] = advanceUnit([u({})], "U1");
    expect(r.status).toBe("Dirty");
    expect(r.occupant).toBe("");
  });

  it("cycles Occupied → Dirty → Cleaning → Ready → Available, then stops", () => {
    let arr = [u({ status: "Occupied" })];
    for (const expected of ["Dirty", "Cleaning", "Ready", "Available"] as const) {
      arr = advanceUnit(arr, "U1");
      expect(arr[0].status).toBe(expected);
    }
    arr = advanceUnit(arr, "U1"); // Available has no next
    expect(arr[0].status).toBe("Available");
  });
});

describe("housing · upsert / remove", () => {
  it("upsert inserts a new unit then replaces by id", () => {
    let arr = seedUnits();
    const n = arr.length;
    arr = upsertUnit(arr, u({ id: "NEW" }));
    expect(arr.length).toBe(n + 1);
    arr = upsertUnit(arr, u({ id: "NEW", occupant: "Bella" }));
    expect(arr.length).toBe(n + 1);
    expect(arr.find((x) => x.id === "NEW")?.occupant).toBe("Bella");
  });

  it("remove deletes by id", () => {
    let arr = seedUnits();
    const id = arr[0].id;
    arr = removeUnit(arr, id);
    expect(arr.find((x) => x.id === id)).toBeUndefined();
  });
});
