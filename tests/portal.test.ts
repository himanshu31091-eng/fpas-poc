import { describe, it, expect } from "vitest";
import {
  portalStatus,
  requiredDocNames,
  makeDocs,
  pendingForOps,
  markAccepted,
  markDismissed,
  type PortalRequest,
} from "@/lib/portal";

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

describe("portal · ops bridge (accept / dismiss)", () => {
  const base = (o: Partial<PortalRequest>): PortalRequest => ({
    id: "r", agent: "", commodity: "Live horses", origin: "", flight: "", date: "", animalCount: "",
    notes: "", awb: "", docs: makeDocs("Live horses"), createdAt: "", ...o,
  });
  const list: PortalRequest[] = [base({ id: "a" }), base({ id: "b" }), base({ id: "c" })];

  it("pendingForOps returns only un-accepted, un-dismissed requests", () => {
    expect(pendingForOps(list).map((r) => r.id)).toEqual(["a", "b", "c"]);
  });

  it("accepting a request removes it from the pending queue and records the job id", () => {
    const next = markAccepted(list, "a", "job-123");
    const a = next.find((r) => r.id === "a")!;
    expect(a.accepted).toBe(true);
    expect(a.acceptedJobId).toBe("job-123");
    expect(pendingForOps(next).map((r) => r.id)).toEqual(["b", "c"]);
  });

  it("dismissing a request removes it from the pending queue without a job id", () => {
    const next = markDismissed(list, "b");
    const b = next.find((r) => r.id === "b")!;
    expect(b.dismissed).toBe(true);
    expect(b.acceptedJobId).toBeUndefined();
    expect(pendingForOps(next).map((r) => r.id)).toEqual(["a", "c"]);
  });

  it("does not mutate the input list", () => {
    markAccepted(list, "a", "job-1");
    expect(list.every((r) => !r.accepted && !r.dismissed)).toBe(true);
  });
});
