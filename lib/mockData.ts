import type { AgentEmail } from "./types";

// ---------------------------------------------------------------------------
// Curated demo inputs. Deliberately different flavours so the demo has
// something for the readiness gate to catch:
//   - clean:      well-structured, most fields present
//   - messy:      details buried in prose, informal
//   - incomplete: missing HC endorsement + arrival time (readiness will flag)
// Mix of commodities (horses, cattle, pets, CITES birds) and agents drawn
// from SHIPPING_AGENTS below.
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
  {
    id: "email-5",
    from: "dispatch@livestockaircorp.example",
    agent: "LIVESTOCK AIR CORP",
    subject: "Import AMS — 22 breeding cattle, QR8177",
    receivedAt: "2026-07-03 06:20",
    attachment: "HC_endorsed_QR8177.pdf",
    flavour: "clean",
    body: `Dear FPAS Amsterdam,

Please handle the following import at Schiphol:

AWB: 157-60094321
Commodity: Live cattle — 22 breeding heifers
Flight: QR8177 from Doha (DOH)
Arrival: 05 July 2026, 14:40 local
Special handling: bedding replenishment required on arrival, water on stand

The health certificate has been endorsed by NVWA (endorsed copy attached).
Please confirm the border inspection slot and the unloading dock.

Best regards,
Livestock Air Corp — Dispatch`,
  },
  {
    id: "email-6",
    from: "bookings@skyepettravel.example",
    agent: "SKYE PET TRAVEL",
    subject: "pets coming in — need help",
    receivedAt: "2026-07-03 09:12",
    attachment: undefined,
    flavour: "messy",
    body: `hi there! so we have a bunch of pets flying into schiphol, think it's
7 dogs and a couple of cats but let me double check the exact count. coming
from bangkok on thai, flight TG932 i believe, lands sometime around midday
on the 7th? maybe 12:30ish, not 100% sure yet.

awb should be 217 55810022 — commodity companion animals. one of the dogs is
a snub-nose breed so temperature care please.

no HC scan yet, vet is finalising it, and we haven't gone to NVWA for the
endorsement — is that something you handle or do we? new to this route sorry!

thanks so much
Priya`,
  },
  {
    id: "email-7",
    from: "ops@instone.example",
    agent: "Instone UK",
    subject: "Import booking — 6 horses, awaiting details",
    receivedAt: "2026-07-03 10:48",
    attachment: undefined,
    flavour: "incomplete",
    body: `Good afternoon,

Requesting import handling at Amsterdam for:

AWB: 125-33470091
Commodity: Live horses (6 head)
Flight: BA9440 from London (LHR)
Origin: LHR

Health certificate to follow — the endorsement has not yet been submitted to
NVWA. Arrival is planned for 8 July 2026; the confirmed slot and arrival time
will follow once the airline releases them.

Kindly outline the required steps on your side.

Regards,
Instone UK Operations`,
  },
  {
    id: "email-8",
    from: "cargo@nzb.example",
    agent: "NZB",
    subject: "Import AMS — CITES birds, CX0271, docs endorsed",
    receivedAt: "2026-07-03 11:30",
    attachment: "HC_and_CITES_CX0271.pdf",
    flavour: "clean",
    body: `Hello FPAS Amsterdam,

Please arrange import handling for the following consignment into Schiphol:

AWB: 160-71203355
Commodity: Live birds — 30 parrots (CITES Appendix II)
Flight: CX0271 from Hong Kong (HKG)
Arrival: 06 July 2026, 05:55 local
Special handling: quiet, low-light holding; CITES permit accompanies the HC

The health certificate is endorsed by NVWA and attached together with the
CITES documentation. Please confirm the inspection slot and CITES check.

Kind regards,
NZB Cargo`,
  },
];
