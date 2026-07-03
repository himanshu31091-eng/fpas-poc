import { NextResponse } from "next/server";
import { callClaudeJSON, hasApiKey } from "@/lib/anthropic";
import {
  IMPORT_SEQUENCE,
  evaluateReadiness,
} from "@/lib/importSequence";
import type {
  Booking,
  ReadinessItem,
  ReadinessResult,
} from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM = `You are a compliance-readiness assistant for FPAS live-animal imports at Amsterdam Schiphol. You assess a booking against a fixed regulatory sequence and report what is outstanding, ordered by urgency, with a plain-language justification for each. You are a decision-support tool only: you never submit anything to a regulator and you always assume a human makes the final call.`;

function buildPrompt(booking: Booking): string {
  const rules = IMPORT_SEQUENCE.map((r) => ({
    factKey: r.factKey,
    title: r.title,
    justification: r.justification,
    urgency: r.urgency,
    horsesOnly: r.horsesOnly ?? false,
  }));

  return `Assess this Amsterdam import booking for arrival readiness.

REGULATORY SEQUENCE (ground truth — do not invent steps):
${JSON.stringify(rules, null, 2)}

BOOKING:
${JSON.stringify(
    {
      awb: booking.awb,
      commodity: booking.commodity,
      isHorses: booking.isHorses,
      animalCount: booking.animalCount,
      flight: booking.flight,
      arrivalDate: booking.arrivalDate,
      arrivalTime: booking.arrivalTime,
      facts: booking.facts,
    },
    null,
    2
  )}

Rules:
- Include a "horsesOnly" step only if isHorses is true.
- A step is "satisfied" iff its factKey is true in facts; otherwise "outstanding".
- For "hcEndorsedByNVWA", only NVWA (the Dutch competent authority) pre-approval satisfies the step; an origin-country vet or exporting-authority endorsement does not.
- Order: all outstanding items first (most urgent first), then satisfied items.

Return ONLY this JSON (no prose, no code fences):
{
  "items": [
    { "id": "<factKey>", "factKey": "<factKey>", "title": "...", "justification": "...", "urgency": "critical|soon|routine", "status": "satisfied|outstanding" }
  ],
  "summary": "one or two sentences on overall readiness and the top blocker",
  "clearedForArrival": <true only if no outstanding items remain>
}`;
}

export async function POST(req: Request) {
  const { booking } = (await req.json()) as { booking: Booking };

  // Deterministic evaluation from the encoded sequence. This is business logic
  // (not AI) and stays the source of truth for the cleared flag and item list.
  const deterministic: ReadinessItem[] = evaluateReadiness(
    booking.facts,
    booking.isHorses
  );
  const outstanding = deterministic.filter((i) => i.status === "outstanding");
  const clearedForArrival = outstanding.length === 0;

  if (!hasApiKey()) {
    return NextResponse.json(
      {
        error:
          "AI readiness reasoning is unavailable: ANTHROPIC_API_KEY is not set on the server.",
      },
      { status: 503 }
    );
  }

  try {
    const result = await callClaudeJSON<ReadinessResult>(buildPrompt(booking), {
      system: SYSTEM,
      maxTokens: 2000,
    });
    // Trust the deterministic item list + cleared flag as the source of truth;
    // keep the model's reasoned summary.
    result.items = deterministic;
    result.clearedForArrival = clearedForArrival;
    return NextResponse.json({ result });
  } catch (err) {
    console.error("readiness route error:", err);
    return NextResponse.json(
      { error: "The AI readiness call failed. Please retry." },
      { status: 502 }
    );
  }
}
