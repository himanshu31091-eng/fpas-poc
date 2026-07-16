// ---------------------------------------------------------------------------
// FPAS POC — agent/customer portal (external-facing surface, simulated).
// Agents submit booking requests, upload documents to a checklist, confirm the
// AWB, and track status. In production this is a separate authenticated portal;
// here it is a self-contained demo persisted to localStorage.
// ---------------------------------------------------------------------------

export type PortalStatus = "submitted" | "docsPending" | "ready";

export interface PortalDoc {
  name: string;
  uploaded: boolean;
  filename?: string;
}

export interface PortalRequest {
  id: string;
  agent: string;
  commodity: string;
  origin: string;
  flight: string;
  date: string;
  animalCount: string;
  notes: string;
  awb: string;
  docs: PortalDoc[];
  createdAt: string;
}

export const PORTAL_KEY = "fpas.portal.v1";

/** Documents an agent must upload, by commodity. */
export function requiredDocNames(commodity: string): string[] {
  const horses = /horse/i.test(commodity);
  return horses
    ? ["Health certificate", "Passport", "Import permit", "Booking confirmation"]
    : ["Health certificate", "Booking confirmation"];
}

export function makeDocs(commodity: string): PortalDoc[] {
  return requiredDocNames(commodity).map((name) => ({ name, uploaded: false }));
}

/** Derived status from checklist + AWB completeness. */
export function portalStatus(r: PortalRequest): PortalStatus {
  const have = r.docs.filter((d) => d.uploaded).length;
  if (have === r.docs.length && r.docs.length > 0 && r.awb.trim()) return "ready";
  if (have > 0 || r.awb.trim()) return "docsPending";
  return "submitted";
}

export function seedRequests(): PortalRequest[] {
  return [
    {
      id: "req-1",
      agent: "IRT AUS",
      commodity: "Live horses",
      origin: "DXB",
      flight: "EK9022",
      date: "2026-07-22",
      animalCount: "6",
      notes: "3 mares, 3 geldings. Grooms travelling.",
      awb: "176-13092796",
      docs: [
        { name: "Health certificate", uploaded: true, filename: "HC-irt-0722.pdf" },
        { name: "Passport", uploaded: true, filename: "passports-6.pdf" },
        { name: "Import permit", uploaded: false },
        { name: "Booking confirmation", uploaded: true, filename: "booking-EK9022.pdf" },
      ],
      createdAt: "2026-07-15T09:00:00.000Z",
    },
    {
      id: "req-2",
      agent: "Skye Pet Travel",
      commodity: "Companion animals",
      origin: "DOH",
      flight: "QR273",
      date: "2026-07-24",
      animalCount: "1",
      notes: "One beagle, IATA crate.",
      awb: "",
      docs: [
        { name: "Health certificate", uploaded: false },
        { name: "Booking confirmation", uploaded: false },
      ],
      createdAt: "2026-07-16T14:20:00.000Z",
    },
  ];
}

export function loadRequests(): PortalRequest[] | null {
  try {
    const raw = window.localStorage.getItem(PORTAL_KEY);
    return raw ? (JSON.parse(raw) as PortalRequest[]) : null;
  } catch {
    return null;
  }
}

export function saveRequests(reqs: PortalRequest[]) {
  try {
    window.localStorage.setItem(PORTAL_KEY, JSON.stringify(reqs));
  } catch {
    /* ignore */
  }
}
