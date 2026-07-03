import { NextResponse } from "next/server";
import { callClaude, hasApiKey } from "@/lib/anthropic";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM = `You are the operations copilot for FPAS, a live-animal air-transport company at Amsterdam Schiphol. You answer questions about the current jobs and can draft short operational text (notices, customer updates) on request. Be concise and specific, cite AWB/flight where relevant, and never invent shipments or facts not present in the provided data. You are decision-support only — a human acts on your answers.`;

export async function POST(req: Request) {
  const { question, context } = (await req.json()) as {
    question: string;
    context: string;
  };

  if (!hasApiKey()) {
    return NextResponse.json(
      { error: "The AI copilot is unavailable: ANTHROPIC_API_KEY is not set." },
      { status: 503 }
    );
  }

  const prompt = `Here is the current state of all jobs (JSON-ish summary):

${context}

Question from the operator:
"""
${question}
"""

Answer using only the data above. If the answer isn't in the data, say so. Keep it short and scannable (use short lines or a small list).`;

  try {
    const answer = await callClaude(prompt, { system: SYSTEM, maxTokens: 1200 });
    return NextResponse.json({ answer });
  } catch (err) {
    console.error("copilot route error:", err);
    return NextResponse.json(
      { error: "The AI copilot call failed. Please retry." },
      { status: 502 }
    );
  }
}
