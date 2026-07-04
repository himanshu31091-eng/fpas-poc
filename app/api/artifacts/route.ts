import { NextResponse } from "next/server";
import { callClaudeJSON, hasApiKey } from "@/lib/anthropic";
import type { Booking, DraftArtifact } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const SYSTEM = `You draft internal operational documents for FPAS Amsterdam live-animal imports. Every document you produce is a DRAFT that must be reviewed by a human before use. You never claim a document is final or valid.`;

function buildPrompt(booking: Booking): string {
  return `Draft two operational documents from the confirmed booking below:
1. An offloading list (Loslijst NVWA) for warehouse staff.
2. A delivery note for handover.

Both must open with "DRAFT — REQUIRES HUMAN REVIEW BEFORE USE" and use plain
monospace-friendly text (no markdown tables). Leave blanks where operational
detail is assigned by staff (prepared space, feed/water, signatures).

BOOKING:
${JSON.stringify(booking, null, 2)}

Return ONLY this JSON (no prose, no code fences):
{
  "artifacts": [
    { "id": "offloading-list", "title": "Offloading list (Loslijst NVWA)", "filename": "Loslijst_<AWB>.txt", "body": "..." },
    { "id": "delivery-note", "title": "Delivery note", "filename": "DeliveryNote_<AWB>.txt", "body": "..." }
  ]
}`;
}

export async function POST(req: Request) {
  const { booking } = (await req.json()) as { booking: Booking };

  if (!hasApiKey()) {
    return NextResponse.json(
      {
        error:
          "AI drafting is unavailable: ANTHROPIC_API_KEY is not set on the server.",
      },
      { status: 503 }
    );
  }

  try {
    const parsed = await callClaudeJSON<{ artifacts: DraftArtifact[] }>(
      buildPrompt(booking),
      { system: SYSTEM, maxTokens: 3500 }
    );
    return NextResponse.json({ artifacts: parsed.artifacts });
  } catch (err) {
    console.error("artifacts route error:", err);
    return NextResponse.json(
      { error: "The AI drafting call failed. Please retry." },
      { status: 502 }
    );
  }
}
