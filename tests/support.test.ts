import { describe, it, expect } from "vitest";
import { addTicket, setTicketStatus, removeTicket, openCount, type Ticket } from "@/lib/support";

describe("support · tickets", () => {
  it("addTicket prepends a trimmed open ticket", () => {
    const list = addTicket([], "  Need HC help  ", "T-1", "2026-07-19T10:00:00Z");
    expect(list.length).toBe(1);
    expect(list[0].status).toBe("open");
    expect(list[0].message).toBe("Need HC help");
  });

  it("keeps newest first", () => {
    let list: Ticket[] = [];
    list = addTicket(list, "a", "T-1", "t1");
    list = addTicket(list, "b", "T-2", "t2");
    expect(list.map((t) => t.id)).toEqual(["T-2", "T-1"]);
  });

  it("setTicketStatus flips status and openCount tracks it", () => {
    let list = addTicket([], "x", "T-1", "t");
    expect(openCount(list)).toBe(1);
    list = setTicketStatus(list, "T-1", "resolved");
    expect(list[0].status).toBe("resolved");
    expect(openCount(list)).toBe(0);
  });

  it("removeTicket deletes by id", () => {
    let list = addTicket([], "x", "T-1", "t");
    list = removeTicket(list, "T-1");
    expect(list.length).toBe(0);
  });
});
