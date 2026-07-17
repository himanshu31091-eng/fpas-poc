import { describe, it, expect } from "vitest";
import { renderPdf } from "@/lib/pdf";

describe("pdf · renderPdf", () => {
  const pdf = renderPdf({
    title: "Offloading list (Loslijst)",
    subtitle: "176-13092796 · IRT AUS · 2026-07-20",
    body: "Line of the document.\n".repeat(60),
    watermark: "DRAFT",
    qr: "176-13092796",
  });

  it("produces a well-formed PDF document", () => {
    expect(pdf.startsWith("%PDF-1.4")).toBe(true);
    expect(pdf.trimEnd().endsWith("%%EOF")).toBe(true);
  });

  it("contains an xref table and a catalog", () => {
    expect(pdf).toContain("xref");
    expect(pdf).toContain("/Type /Catalog");
    expect(pdf).toContain("startxref");
  });

  it("paginates long bodies (multiple page objects)", () => {
    const pages = (pdf.match(/\/Type \/Page\b/g) || []).length;
    expect(pages).toBeGreaterThanOrEqual(2);
  });
});
