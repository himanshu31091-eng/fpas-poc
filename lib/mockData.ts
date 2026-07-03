import type { AgentEmail } from "./types";

// ---------------------------------------------------------------------------
// Curated demo inputs. Three samples, deliberately different so the demo has
// something for the readiness gate to catch:
//   - clean:      well-structured, most fields present
//   - messy:      details buried in prose, informal
//   - incomplete: missing HC endorsement + arrival time (readiness will flag)
//
// All data is fictional. Nothing here connects to a live system.
// ---------------------------------------------------------------------------

/** Shipping agents — mirrors the HCL Contacts database selection. */
export const SHIPPING_AGENTS = [
  "IRT AUS",
  "EIAF",
  "NZB",
  "STC",
  "HKJC",
  "SPIX",
  "Instone UK",
  "Stock Air",
  "BBA IRE",
  "EQUITRANS",
  "LIVESTOCK AIR CORP",
  "EQUINE LOGISTICS",
  "AIR HORSE TRANSPORT",
  "SKYE PET TRAVEL",
];

export const AGENT_EMAILS: AgentEmail[] = [
  {
    id: "email-1",
    from: "operations@airhorsetransport.example",
    agent: "AIR HORSE TRANSPORT",
    subject: "Import AMS — 4 horses EK9021, HC attached",
    receivedAt: "2026-07-02 08:14",
    attachment: "HC_draft_EK9021.pdf",
    flavour: "clean",
    body: `Hi FPAS Amsterdam team,

Please find the details for our import into Schiphol:

AWB: 176-44821905
Commodity: Live horses (4 head)
Flight: EK9021 from Dubai (DXB)
Arrival: 04 July 2026, 06:30 local
Special handling: 2 mares in foal, temperature-sensitive

Health certificate draft is attached. NVWA endorsement is in progress on
their side, we will forward the endorsed copy once received.

Please confirm the government vet inspection slot once booked.

Kind regards,
Air Horse Transport Ops`,
  },
  {
    id: "email-2",
    from: "j.klaassen@equitrans.example",
    agent: "EQUITRANS",
    subject: "Fwd: incoming shipment next week",
    receivedAt: "2026-07-02 09:41",
    attachment: "scan_0342.pdf",
    flavour: "messy",
    body: `hey — following up on the call. we've got a consignment of dogs and cats
coming through, think it's around 18 animals total (12 dogs, 6 cats, will
confirm). coming in on Qatar, QR273 out of Doha, should land the morning of
the 6th July, believe it's the early flight ~07:15.

awb is 157 30021144. commodity companion animals. no special cargo notes
other than one crate flagged oversize.

HC has been endorsed already by the vet authority on our end, scan attached.
can you sort the customs side + the scope registration?

cheers
Jan`,
  },
  {
    id: "email-3",
    from: "bookings@equinelogistics.example",
    agent: "EQUINE LOGISTICS",
    subject: "New import booking request",
    receivedAt: "2026-07-02 10:05",
    attachment: undefined,
    flavour: "incomplete",
    body: `Good morning,

We would like to book an import handling for the following:

AWB: 020-99887766
Commodity: Live horses (2)
Flight: KL644 from Johannesburg
Origin: JNB

Health certificate to follow. We have not yet submitted for NVWA endorsement.
Arrival date is 5 July 2026 — we will confirm the exact arrival time shortly.

Please advise on next steps.

Regards,
Equine Logistics Bookings`,
  },
  {
    id: "email-4",
    from: "operations@stockair.example",
    agent: "Stock Air",
    subject: "Import AMS — 3 chevaux, vol AF1240",
    receivedAt: "2026-07-03 07:35",
    attachment: "certificat_sanitaire.pdf",
    flavour: "clean",
    body: `Bonjour l'équipe FPAS Amsterdam,

Voici les détails de notre importation vers Schiphol :

LTA : 057-88123400
Marchandise : Chevaux vivants (3 têtes)
Vol : AF1240 en provenance de Paris (CDG)
Arrivée : 6 juillet 2026, 08:15 heure locale
Manutention spéciale : 1 étalon — box séparé

Le certificat sanitaire est joint. L'agrément NVWA est déjà obtenu.
Merci de confirmer le créneau d'inspection vétérinaire officielle.

Cordialement,
Stock Air — Service Opérations`,
  },
];
