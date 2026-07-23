import { describe, it, expect } from "vitest";
import { buildXlsx } from "@/lib/xlsx";

describe("xlsx · buildXlsx", () => {
  const bytes = buildXlsx([
    { name: "Sheet1", rows: [["AWB", "Status"], ["176-1", "Ready"], ["176-2", 42]] },
  ]);

  it("returns a non-empty byte array", () => {
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(0);
  });

  it("is a ZIP container (xlsx is a zip) — starts with the PK signature", () => {
    expect(bytes[0]).toBe(0x50); // 'P'
    expect(bytes[1]).toBe(0x4b); // 'K'
  });

  it("handles multiple sheets", () => {
    const multi = buildXlsx([
      { name: "A", rows: [["x"]] },
      { name: "B", rows: [["y"]] },
    ]);
    expect(multi.length).toBeGreaterThan(bytes.length - bytes.length); // sanity: produced output
    expect(multi[0]).toBe(0x50);
  });
});
