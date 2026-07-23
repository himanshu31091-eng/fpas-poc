import { NextResponse } from "next/server";
import { callClaudeJSON, hasApiKey } from "@/lib/anthropic";
import { STAFF_MEMBERS } from "@/lib/staff";

export const runtime = "nodejs";
export const maxDuration = 300;

const SYSTEM = `You convert a pasted staff-rostering spreadsheet (FPAS Amsterdam) into structured roster entries. The sheet is a weekly grid: staff names down the side, dates across the top, and each cell describes that person's day. You never invent people or shifts — only structure what is present.`;

function buildPrompt(text: string, year: number): string {
  return `Parse the roster text below into JSON. It is usually a weekly grid with day headers (e.g. "Jul 6th", "6-Aug") and one row per staff member — but it may instead be a short free-text instruction, e.g. "Himanshu Pandey will be on leave on 25 July" or "Bart works 8-16 on Mon and Tue". Handle both: turn each stated person + day + state into an entry.

Cell / statement meaning (Dutch labels appear in the source):
- A time range like "8:30-17:30" → status "working", with start and end in HH:MM (24h).
- "Vakantie" → status "leave". "Vrij"/"vrij" → status "off". "Ziek" → status "sick".
- "x" or an otherwise-marked unavailable cell → status "off".
- A public holiday name (Goede vrijdag, Koningsdag, Hemelvaartdag, pinksterdag, paasdag, etc.) → status "holiday".
- "training" → status "training".
- A blank cell → omit it entirely (no entry).
Free-text like "tot 17:00" / "vanaf 10:30" → status "working" with the note preserved.

Known staff: ${STAFF_MEMBERS.join(", ")}. If a name clearly refers to one of these (e.g. a spelling/case variant), use that exact spelling; otherwise keep the name exactly as written — do NOT force an unknown person onto a known name.
Resolve day headers or stated dates to ISO dates (YYYY-MM-DD). Assume year ${year} unless a year is stated. "on 25 July" → "${year}-07-25".

Return ONLY this JSON (no prose, no code fences):
{
  "entries": [
    { "staff": "Lotte", "date": "YYYY-MM-DD", "status": "working|off|leave|sick|holiday|training", "start": "HH:MM", "end": "HH:MM", "note": "" }
  ]
}
Include start/end only for "working". Omit blank cells.

ROSTER:
"""
${text}
"""`;
}

export async function POST(req: Request) {
  const { text } = (await req.json()) as { text?: string };
  if (!text || !text.trim()) {
    return NextResponse.json({ error: "No roster text provided." }, { status: 400 });
  }
  if (!hasApiKey()) {
    return NextResponse.json(
      { error: "AI roster import is unavailable: ANTHROPIC_API_KEY is not set." },
      { status: 503 }
    );
  }

  try {
    const result = await callClaudeJSON<{
      entries: {
        staff: string;
        date: string;
        status: string;
        start?: string;
        end?: string;
        note?: string;
      }[];
    }>(buildPrompt(text, new Date().getFullYear()), {
      system: SYSTEM,
      maxTokens: 3500,
    });
    return NextResponse.json({ entries: result.entries ?? [] });
  } catch (err) {
    console.error("roster route error:", err);
    return NextResponse.json(
      { error: "The AI roster import failed. Please retry." },
      { status: 502 }
    );
  }
}
