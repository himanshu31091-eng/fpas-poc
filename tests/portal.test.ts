import { describe, it, expect } from "vitest";
import { portalStatus, requiredDocNames, makeDocs, type PortalRequest } from "@/lib/portal";

describe("portal · requiredDocNames", () => {
  it("horses require passport + 4 docs", () => {
    const d = requiredDocNames("Live horses");
    expect(d).toContain("Passport");
    expect(d.length).toBe(4);
  });
  it("non-horse commodities require 2 docs", () => {
    expect(requiredDocNames("Companion animals").length).toBe(2);
  });
});

describe("portal · portalStatus", () => {
  const base = (o: Partial<PortalRequest>): PortalRequest => ({
    id: "r", agent: "", commodity: "Live horses", origin: "", flight: "", date: "", animalCount: "",
    notes: "", awb: "", docs: makeDocs("Live horses"), createdAt: "", ...o,
  });

  it("is 'submitted' when nothing is uploaded and no AWB", () => {
    expect(portalStatus(base({}))).toBe("submitted");
  });
  it("is 'docsPending' when some docs are uploaded", () => {
    const r = base({});
    r.docs[0].uploaded = true;
    expect(portalStatus(r)).toBe("docsPending");
  });
  it("is 'ready' only when all docs are uploaded and the AWB is set", () => {
    const r = base({ awb: "176-13092796" });
    r.docs.forEach((d) => (d.uploaded = true));
    expect(portalStatus(r)).toBe("ready");
  });
});
