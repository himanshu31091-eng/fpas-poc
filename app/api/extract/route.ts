import { NextResponse } from "next/server";
import { callClaudeJSON, hasApiKey } from "@/lib/anthropic";
import { AGENT_EMAILS, SHIPPING_AGENTS } from "@/lib/mockData";
import type { ExtractionResult } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const SYSTEM = `You are an intake assistant for FPAS, an animal-transport company handling live-animal imports at Amsterdam Schiphol Border Inspection Post. You extract structured shipment data from unstructured agent emails. You never invent data: if a value is not stated, leave it empty and mark confidence "low". You are conservative with confidence — approximate or hedged values ("around", "~", "will confirm") are "low" or "medium", never "high".`;

function buildPrompt(body: string): string {
  return `Extract shipment fields from the agent email below.

Return ONLY a JSON object of this exact shape (no prose, no code fences):
{
  "fields": [
    { "key": "awb", "label": "Air waybill (AWB)", "value": "", "confidence": "high|medium|low", "sourceHint": "short quote from the email" },
    { "key": "shippingAgent", "label": "Shipping agent", "value": "", "confidence": "...", "sourceHint": "..." },
    { "key": "commodity", "label": "Commodity", "value": "", "confidence": "...", "sourceHint": "..." },
    { "key": "animalCount", "label": "Animal count", "value": "", "confidence": "...", "sourceHint": "..." },
    { "key": "flight", "label": "Flight", "value": "", "confidence": "...", "sourceHint": "..." },
    { "key": "origin", "label": "Origin", "value": "", "confidence": "...", "sourceHint": "..." },
    { "key": "arrivalDate", "label": "Arrival date", "value": "YYYY-MM-DD", "confidence": "...", "sourceHint": "..." },
    { "key": "arrivalTime", "label": "Arrival time", "value": "HH:MM", "confidence": "...", "sourceHint": "..." },
    { "key": "specialCargo", "label": "Special cargo", "value": "", "confidence": "...", "sourceHint": "..." }
  ],
  "inferredFacts": {
    "bookingCreated": true,
    "hcDraftReceived": <true only if a health certificate draft/scan is present or attached>,
    "hcEndorsedByNVWA": <true only if the email states NVWA (the Dutch competent authority) endorsement is already DONE — an origin-country vet endorsement or "in progress"/"to follow" is NOT enough>
  },
  "notes": "one sentence: horse (OKTF applies) vs other, and any obvious gaps"
}

Known shipping agents (map the sender to the closest match): ${SHIPPING_AGENTS.join(", ")}.

For AWB, normalise spacing to the NNN-NNNNNNNN format.

EMAIL:
"""
${body}
"""`;
}

export async function POST(req: Request) {
  const { emailId, text, pdf } = (await req.json()) as {
    emailId?: string;
    text?: string;
    pdf?: string; // base64 (no data: prefix)
  };

  // Resolve the source: a PDF document, a known sample email, or pasted text.
  let body = text?.trim() ?? "";
  if (emailId) {
    const email = AGENT_EMAILS.find((e) => e.id === emailId);
    if (!email) {
      return NextResponse.json({ error: "Unknown email" }, { status: 400 });
    }
    body = email.body;
  }
  if (!pdf && !body) {
    return NextResponse.json(
      { error: "No PDF, email, or text provided to extract from." },
      { status: 400 }
    );
  }

  if (!hasApiKey()) {
    return NextResponse.json(
      {
        error:
          "AI extraction is unavailable: ANTHROPIC_API_KEY is not set on the server.",
      },
      { status: 503 }
    );
  }

  // For a PDF, send the document itself to Claude; for text, send the prompt.
  const content = pdf
    ? [
        {
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: pdf },
        },
        { type: "text", text: buildPrompt("(see the attached PDF document)") },
      ]
    : buildPrompt(body);

  try {
    const result = await callClaudeJSON<ExtractionResult>(content, {
      system: SYSTEM,
      maxTokens: 1500,
    });
    return NextResponse.json({ result });
  } catch (err) {
    console.error("extract route error:", err);
    return NextResponse.json(
      { error: "The AI extraction call failed. Please retry." },
      { status: 502 }
    );
  }
}
