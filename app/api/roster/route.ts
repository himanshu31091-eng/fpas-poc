import { NextResponse } from "next/server";
import { callClaudeJSON, hasApiKey } from "@/lib/anthropic";
import { STAFF_MEMBERS } from "@/lib/staff";

export const runtime = "nodejs";
export const maxDuration = 300;

const SYSTEM = `You convert a pasted staff-rostering spreadsheet (FPAS Amsterdam) into structured roster entries. The sheet is a weekly grid: staff names down the side, dates across the top, and each cell describes that person's day. You never invent people or shifts — only structure what is present.`;

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Anchor for resolving relative dates ("this Saturday", "this week", "tomorrow"). */
function dateContext(today: string) {
  const [y, m, d] = today.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const weekday = dt.toLocaleDateString("en-US", { weekday: "long" });
  const dow = (dt.getDay() + 6) % 7; // 0 = Monday
  const monday = new Date(dt);
  monday.setDate(dt.getDate() - dow);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const nextMon = new Date(monday);
  nextMon.setDate(monday.getDate() + 7);
  const nextSun = new Date(sunday);
  nextSun.setDate(sunday.getDate() + 7);
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const thisWeek = days.map((name, i) => {
    const x = new Date(monday);
    x.setDate(monday.getDate() + i);
    return `${name} ${iso(x)}`;
  });
  return { weekday, year: y, monday: iso(monday), sunday: iso(sunday), nextMon: iso(nextMon), nextSun: iso(nextSun), thisWeek };
}

function buildPrompt(text: string, today: string): string {
  const c = dateContext(today);
  return `Parse the roster text below into JSON. It is usually a weekly grid with day headers (e.g. "Jul 6th", "6-Aug") and one row per staff member — but it may instead be a short free-text instruction, e.g. "Himanshu Pandey will be on leave this Saturday" or "Bart works 8-16 on Mon and Tue". Handle both: turn each stated person + day + state into an entry.

DATES — resolve every date to ISO (YYYY-MM-DD) relative to TODAY:
- Today is ${c.weekday}, ${today}.
- This week (Mon–Sun) is: ${c.thisWeek.join(", ")}.
- Next week runs ${c.nextMon} to ${c.nextSun}.
- A bare weekday name or "this <weekday>" (e.g. "Saturday", "this Saturday") = that day IN THIS WEEK (from the list above). "next <weekday>" = the following week.
- "today" = ${today}; "tomorrow"/"yesterday" relative to today; "this week"/"next week" as above.
- A stated date without a year uses year ${c.year} (or the nearest sensible occurrence on/after today). Never invent a date in a different month/year than intended — anchor to the list above.

Cell / statement meaning (Dutch labels appear in the source):
- A time range like "8:30-17:30" → status "working", with start and end in HH:MM (24h).
- "Vakantie" → status "leave". "Vrij"/"vrij" → status "off". "Ziek" → status "sick".
- "x" or an otherwise-marked unavailable cell → status "off".
- A public holiday name (Goede vrijdag, Koningsdag, Hemelvaartdag, pinksterdag, paasdag, etc.) → status "holiday".
- "training" → status "training".
- A blank cell → omit it entirely (no entry).
Free-text like "tot 17:00" / "vanaf 10:30" → status "working" with the note preserved.

Known staff: ${STAFF_MEMBERS.join(", ")}. If a name clearly refers to one of these (e.g. a spelling/case variant), use that exact spelling; otherwise keep the name exactly as written — do NOT force an unknown person onto a known name.

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
  const { text, today } = (await req.json()) as { text?: string; today?: string };
  if (!text || !text.trim()) {
    return NextResponse.json({ error: "No roster text provided." }, { status: 400 });
  }
  // Client sends its "today" so relative dates resolve to the same week the
  // roster shows; fall back to the server date if absent.
  const anchor = today && /^\d{4}-\d{2}-\d{2}$/.test(today) ? today : iso(new Date());
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
    }>(buildPrompt(text, anchor), {
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
