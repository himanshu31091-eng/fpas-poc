import { NextResponse } from "next/server";
import { callClaudeJSON, hasApiKey } from "@/lib/anthropic";

export const runtime = "nodejs";
export const maxDuration = 300;

const SYSTEM = `You are a live-animal air-cargo compliance adviser for First Point Animal Services at Amsterdam Schiphol (the EU Border Inspection Post). You know EU/NL import & export rules for live animals: NVWA (the Dutch competent authority), TRACES-NT / CHED-A, health certificates, CITES for protected species, IATA Live Animals Regulations (LAR) for carriage, customs, and airline/handler requirements. You produce a practical, shipment-specific list of the documents and checks required. This is operational decision-support for trained staff, not legal advice — be accurate and conservative, and never invent a certificate that does not exist.`;

interface Shipment {
  species?: string;
  commodity?: string;
  direction?: string;
  origin?: string;
  animalCount?: string;
}

function buildPrompt(s: Shipment): string {
  return `Produce the compliance requirements for this live-animal shipment through Amsterdam Schiphol.

Shipment:
- Direction: ${s.direction || "import"}
- Commodity / species: ${s.commodity || s.species || "unknown"}
- Origin / routing: ${s.origin || "unknown"}
- Animal count: ${s.animalCount || "unknown"}

For each requirement give: a short title, the responsible authority/standard, a category, a severity, and a one-line rationale.
- authority: one of "NVWA", "EU TRACES", "CITES", "IATA LAR", "Customs", "Airline", "Other".
- category: one of "documentation", "health", "welfare", "security", "customs".
- severity: "mandatory" (always required for this shipment), "conditional" (required only if a condition holds — state it in the rationale), or "recommended" (best practice).
Order mandatory first. Include CITES only if the species is likely protected. Keep it to the genuinely relevant items (typically 5–9).

Return ONLY this JSON (no prose, no code fences):
{
  "summary": "one sentence on the overall compliance picture for this shipment",
  "requirements": [
    { "title": "", "authority": "NVWA", "category": "documentation", "severity": "mandatory", "why": "" }
  ]
}`;
}

export async function POST(req: Request) {
  const { shipment } = (await req.json()) as { shipment?: Shipment };
  if (!shipment) {
    return NextResponse.json({ error: "No shipment provided." }, { status: 400 });
  }
  if (!hasApiKey()) {
    return NextResponse.json(
      { error: "The AI rules engine is unavailable: ANTHROPIC_API_KEY is not set." },
      { status: 503 }
    );
  }

  try {
    const result = await callClaudeJSON<{
      summary: string;
      requirements: {
        title: string;
        authority: string;
        category: string;
        severity: string;
        why: string;
      }[];
    }>(buildPrompt(shipment), { system: SYSTEM, maxTokens: 2000 });
    return NextResponse.json({
      summary: result.summary ?? "",
      requirements: result.requirements ?? [],
    });
  } catch (err) {
    console.error("rules route error:", err);
    return NextResponse.json(
      { error: "The AI rules engine failed. Please retry." },
      { status: 502 }
    );
  }
}
