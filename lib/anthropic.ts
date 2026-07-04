// ---------------------------------------------------------------------------
// Minimal server-side Anthropic client. Uses plain fetch so the project has
// no external SDK dependency to install or version-pin.
//
// Only ever imported from API routes (server), never from client components,
// so the API key stays out of the browser.
//
// Processing notes:
//  - Every call is bounded by an AbortController timeout so one slow generation
//    can't consume the whole request budget (the cause of occasional 504s).
//  - callClaudeJSON keeps retries low and repairs malformed JSON in-place
//    rather than paying for a whole new generation on a formatting hiccup.
//  - The (stable) system prompt is sent as a cache_control block so repeat
//    calls skip re-processing it — lower latency and cost.
// ---------------------------------------------------------------------------

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

/** Per-call ceiling. Two attempts stay well under the routes' 300s budget. */
const DEFAULT_TIMEOUT_MS = 90_000;

/** Whether a server-side API key is configured. AI routes require this. */
export function hasApiKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

interface CallOptions {
  system?: string;
  maxTokens?: number;
  /** Abort the call after this many ms (default 90s). */
  timeoutMs?: number;
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

  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  // Cache the stable system prompt: identical across requests, so the model
  // skips re-reading it. Below the model's minimum cacheable size this is a
  // harmless no-op.
  const system = opts.system
    ? [
        {
          type: "text",
          text: opts.system,
          cache_control: { type: "ephemeral" },
        },
      ]
    : undefined;

  try {
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
        system,
        messages: [{ role: "user", content: userContent }],
      }),
      signal: controller.signal,
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
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(
        `Anthropic API timed out after ${Math.round(timeoutMs / 1000)}s`
      );
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
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
 * Extract the first *balanced* {...} object from a string. Tolerates prose or
 * fences around the JSON and ignores braces inside string values. Returns null
 * if the object never closes (i.e. the output was truncated).
 */
function balancedObject(s: string): string | null {
  const start = s.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
    } else if (c === '"') {
      inStr = true;
    } else if (c === "{") {
      depth++;
    } else if (c === "}") {
      depth--;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  return null;
}

/**
 * Parse a JSON object from a model response, tolerating code fences and the
 * most common malformed-JSON cases (prose around the object, raw control
 * characters inside strings). Repairs in-place rather than failing the call —
 * which avoids paying for a whole new generation on a formatting hiccup.
 */
export function parseJson<T>(text: string): T {
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  // Candidate JSON substrings, best first: the first balanced object, then the
  // greedy first-{ … last-} slice as a fallback.
  const candidates: string[] = [];
  const balanced = balancedObject(cleaned);
  if (balanced) candidates.push(balanced);
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    candidates.push(cleaned.slice(start, end + 1));
  }
  if (candidates.length === 0) {
    throw new Error("No JSON object found in model response");
  }

  let lastErr: unknown;
  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as T;
    } catch (err) {
      lastErr = err;
    }
    try {
      return JSON.parse(escapeControlChars(candidate)) as T;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error("Failed to parse JSON from model response");
}

/**
 * Call Claude and parse a JSON response. Keeps retries low: a fresh generation
 * is only worth it for a genuine call/timeout failure, and parseJson already
 * repairs the common malformed-JSON cases in-place, so most formatting hiccups
 * never cost a second call. Two attempts (each timeout-bounded) stay under the
 * routes' request budget, so slow calls can't stack into a 504.
 */
export async function callClaudeJSON<T>(
  userContent: UserContent,
  opts: CallOptions = {},
  attempts = 2
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    let raw: string;
    try {
      raw = await callClaude(userContent, opts);
    } catch (err) {
      // Transient call/timeout error — a fresh attempt may succeed.
      lastErr = err;
      continue;
    }
    try {
      return parseJson<T>(raw);
    } catch (err) {
      // Output arrived but couldn't be parsed even after repair; only a
      // regeneration might help, so fall through to the next attempt (if any).
      lastErr = err;
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error("Claude JSON call failed");
}
