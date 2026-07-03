import { NextResponse } from "next/server";
import { callClaudeJSON, hasApiKey } from "@/lib/anthropic";
import type { Booking } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const SYSTEM = `You draft internal operational and regulatory text for FPAS live-animal shipments at Amsterdam Schiphol. Everything you produce is a DRAFT for human review before it is sent. You are precise, plain, and never invent facts not present in the booking.`;

type Kind = "airline-loadlist" | "regulatory-notice" | "customer-update";

function customerUpdatePrompt(booking: Booking): string {
  return `Draft a short, friendly MOVEMENT UPDATE email to the customer/agent about their shipment, based only on the booking below. Plain text. Open with "DRAFT — REQUIRES HUMAN REVIEW BEFORE USE". State what is confirmed, what is still pending, and the arrival/travel details. 3–5 sentences, warm but professional.

BOOKING:
${JSON.stringify(booking, null, 2)}

Return ONLY this JSON (no prose, no code fences):
{ "subject": "Shipment update — <AWB> <flight>", "body": "..." }`;
}

function loadListPrompt(booking: Booking, airline: string): string {
  return `Draft the LOAD LIST message to send to the airline ${airline} for this export shipment.
Plain monospace-friendly text (no markdown tables). Open with "DRAFT — REQUIRES HUMAN REVIEW BEFORE USE".
Include AWB, flight, warehouse arrival time, and a per-stall breakdown (stall, animal, gender, weight) from the load plan.

BOOKING:
${JSON.stringify(booking, null, 2)}

Return ONLY this JSON (no prose, no code fences):
{ "subject": "Load list — <AWB> <flight>", "body": "..." }`;
}

function noticePrompt(booking: Booking, regulator: string, topic: string): string {
  return `Draft a short REGULATORY NOTIFICATION to ${regulator} regarding: ${topic}.
Plain text. Open with "DRAFT — REQUIRES HUMAN REVIEW BEFORE USE". Reference AWB/flight/arrival and the specific action. Keep it to a few sentences.

BOOKING:
${JSON.stringify(
    {
      awb: booking.awb,
      commodity: booking.commodity,
      flight: booking.flight,
      origin: booking.origin,
      arrivalDate: booking.arrivalDate,
      arrivalTime: booking.arrivalTime,
      shippingAgent: booking.shippingAgent,
    },
    null,
    2
  )}

Return ONLY this JSON (no prose, no code fences):
{ "subject": "<regulator> — <topic>", "body": "..." }`;
}

export async function POST(req: Request) {
  const { kind, booking, airline, regulator, topic } = (await req.json()) as {
    kind: Kind;
    booking: Booking;
    airline?: string;
    regulator?: string;
    topic?: string;
  };

  if (!hasApiKey()) {
    return NextResponse.json(
      { error: "AI drafting is unavailable: ANTHROPIC_API_KEY is not set." },
      { status: 503 }
    );
  }

  const prompt =
    kind === "airline-loadlist"
      ? loadListPrompt(booking, airline || "the airline")
      : kind === "customer-update"
      ? customerUpdatePrompt(booking)
      : noticePrompt(booking, regulator || "the authority", topic || "shipment notification");

  try {
    const result = await callClaudeJSON<{ subject: string; body: string }>(
      prompt,
      { system: SYSTEM, maxTokens: 1500 }
    );
    return NextResponse.json({ result });
  } catch (err) {
    console.error("compose route error:", err);
    return NextResponse.json(
      { error: "The AI drafting call failed. Please retry." },
      { status: 502 }
    );
  }
}
