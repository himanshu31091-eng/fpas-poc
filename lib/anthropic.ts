// ---------------------------------------------------------------------------
// Minimal server-side Anthropic client. Uses plain fetch so the project has
// no external SDK dependency to install or version-pin.
//
// Only ever imported from API routes (server), never from client components,
// so the API key stays out of the browser.
// ---------------------------------------------------------------------------

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

/** Whether a server-side API key is configured. AI routes require this. */
export function hasApiKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

interface CallOptions {
  system?: string;
  maxTokens?: number;
}

/** User content: plain text, or an array of content blocks (e.g. a PDF document). */
type UserContent = string | Array<Record<string, unknown>>;

/** Call the Messages API and return the concatenated text output. */
export async function callClaude(
  userContent: UserContent,
  opts: CallOptions = {}
): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not set");

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: opts.maxTokens ?? 1500,
      system: opts.system,
      messages: [{ role: "user", content: userContent }],
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Anthropic API ${res.status}: ${detail}`);
  }

  const data = await res.json();
  return (data.content || [])
    .filter((b: { type: string }) => b.type === "text")
    .map((b: { text: string }) => b.text)
    .join("\n");
}

/**
 * Escape raw (unescaped) control characters that models sometimes leave inside
 * a JSON string value — most often literal newlines in a long document body.
 * These are the usual cause of JSON.parse failures on otherwise-valid output.
 */
function escapeControlChars(s: string): string {
  let out = "";
  for (const ch of s) {
    const code = ch.charCodeAt(0);
    if (code > 31) {
      out += ch;
    } else if (ch === "\n") {
      out += "\\n";
    } else if (ch === "\r") {
      out += "\\r";
    } else if (ch === "\t") {
      out += "\\t";
    }
    // other control chars are dropped
  }
  return out;
}

/**
 * Parse a JSON object from a model response, tolerating code fences and the
 * most common malformed-JSON case (raw control chars inside strings). Repairs
 * rather than failing the whole call.
 */
export function parseJson<T>(text: string): T {
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("No JSON object found in model response");
  }
  const candidate = cleaned.slice(start, end + 1);
  try {
    return JSON.parse(candidate) as T;
  } catch {
    return JSON.parse(escapeControlChars(candidate)) as T;
  }
}

/**
 * Call Claude and parse a JSON response, retrying a few times. Model JSON can
 * be intermittently malformed (especially from reasoning models); a couple of
 * retries plus the repair pass above make the AI screens reliable for a demo.
 */
export async function callClaudeJSON<T>(
  userContent: UserContent,
  opts: CallOptions = {},
  attempts = 3
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const raw = await callClaude(userContent, opts);
      return parseJson<T>(raw);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error("Claude JSON call failed");
}
