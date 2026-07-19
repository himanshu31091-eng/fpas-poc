// ---------------------------------------------------------------------------
// FPAS POC — lightweight support tickets. Raised from the help widget and kept
// in the browser (localStorage) so the "raise → track → resolve" flow feels
// complete. Not a real help desk; production would route to Zendesk/Jira/etc.
// ---------------------------------------------------------------------------

export type TicketStatus = "open" | "resolved";

export interface Ticket {
  id: string;
  message: string;
  status: TicketStatus;
  createdAt: string; // ISO
}

export const SUPPORT_KEY = "fpas.support.v1";

/** Prepend a new open ticket (id/createdAt passed in so the fn stays pure). */
export function addTicket(list: Ticket[], message: string, id: string, createdAt: string): Ticket[] {
  return [{ id, message: message.trim(), status: "open", createdAt }, ...list];
}

export function setTicketStatus(list: Ticket[], id: string, status: TicketStatus): Ticket[] {
  return list.map((t) => (t.id === id ? { ...t, status } : t));
}

export function removeTicket(list: Ticket[], id: string): Ticket[] {
  return list.filter((t) => t.id !== id);
}

export function openCount(list: Ticket[]): number {
  return list.filter((t) => t.status === "open").length;
}

export function loadTickets(): Ticket[] | null {
  try {
    const raw = window.localStorage.getItem(SUPPORT_KEY);
    return raw ? (JSON.parse(raw) as Ticket[]) : null;
  } catch {
    return null;
  }
}

export function saveTickets(list: Ticket[]) {
  try {
    window.localStorage.setItem(SUPPORT_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}
