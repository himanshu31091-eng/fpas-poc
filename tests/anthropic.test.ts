import { describe, it, expect } from "vitest";
import { parseJson } from "@/lib/anthropic";

describe("anthropic · parseJson (in-place JSON repair)", () => {
  it("parses plain JSON", () => {
    expect(parseJson<{ a: number }>('{"a":1}')).toEqual({ a: 1 });
  });

  it("strips ```json code fences", () => {
    expect(parseJson<{ ok: boolean }>('```json\n{"ok":true}\n```')).toEqual({ ok: true });
  });

  it("extracts the object from surrounding prose", () => {
    const txt = 'Sure, here is the result:\n{"awb":"176-1","n":3}\nHope that helps!';
    expect(parseJson<{ awb: string; n: number }>(txt)).toEqual({ awb: "176-1", n: 3 });
  });

  it("repairs raw (unescaped) control characters inside strings", () => {
    // A literal newline inside a JSON string is invalid JSON; parseJson escapes it.
    const broken = '{"note":"line one\nline two"}';
    const out = parseJson<{ note: string }>(broken);
    expect(out.note).toContain("line one");
    expect(out.note).toContain("line two");
  });

  it("throws when no JSON object is present", () => {
    expect(() => parseJson("no json here")).toThrow();
  });
});
