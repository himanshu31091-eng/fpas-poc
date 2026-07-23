import { describe, it, expect } from "vitest";
import { statusCounts, FUNCTIONAL, SECTIONS, BEYOND } from "@/lib/requirements";

describe("requirements · statusCounts", () => {
  it("counts sum to the number of items in a section", () => {
    const counts = statusCounts(FUNCTIONAL.items);
    const sum = Object.values(counts).reduce((a, b) => a + b, 0);
    expect(sum).toBe(FUNCTIONAL.items.length);
  });

  it("the functional section has built items", () => {
    expect(statusCounts(FUNCTIONAL.items).built).toBeGreaterThan(0);
  });

  it("every section has a unique key and at least one item", () => {
    const keys = SECTIONS.map((s) => s.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const s of SECTIONS) expect(s.items.length).toBeGreaterThan(0);
  });

  it("'Beyond the brief' captures the enhancements (grew well past the original 8)", () => {
    expect(BEYOND.items.length).toBeGreaterThanOrEqual(15);
  });
});
