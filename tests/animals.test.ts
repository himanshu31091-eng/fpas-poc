import { describe, it, expect } from "vitest";
import { daysUntil, PROTO_TODAY, upsertAnimal, removeAnimal, SEED_ANIMALS, type Animal } from "@/lib/animals";

describe("animals · daysUntil", () => {
  it("is 0 for the reference date", () => expect(daysUntil(PROTO_TODAY)).toBe(0));
  it("is negative for a past date", () => expect(daysUntil("2020-01-01")).toBeLessThan(0));
  it("is positive for a future date", () => expect(daysUntil("2030-01-01")).toBeGreaterThan(0));
});

describe("animals · upsert / remove", () => {
  const a = (o: Partial<Animal>): Animal => ({
    id: "X1", name: "N", species: "Horses", breed: "", chip: "", passport: "", owner: "", job: "", weightKg: 0, vax: [], cites: false, notes: "", ...o,
  });

  it("upsert inserts then replaces by id", () => {
    let arr = [...SEED_ANIMALS];
    const n = arr.length;
    arr = upsertAnimal(arr, a({}));
    expect(arr.length).toBe(n + 1);
    arr = upsertAnimal(arr, a({ name: "Merlin" }));
    expect(arr.length).toBe(n + 1);
    expect(arr.find((x) => x.id === "X1")?.name).toBe("Merlin");
  });

  it("remove deletes by id", () => {
    let arr = [...SEED_ANIMALS];
    const id = arr[0].id;
    arr = removeAnimal(arr, id);
    expect(arr.some((x) => x.id === id)).toBe(false);
  });

  it("the seed has a deliberate document gap (Bella missing passport)", () => {
    const bella = SEED_ANIMALS.find((x) => x.name === "Bella");
    expect(bella).toBeDefined();
    expect(bella?.passport).toBe("");
  });
});
