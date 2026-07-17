import { describe, it, expect } from "vitest";
import jsQR from "jsqr";
import { qrMatrix } from "@/lib/qr";

/** Render the matrix to an RGBA buffer and decode it with the independent jsQR reader. */
function decode(text: string): string | null {
  const m = qrMatrix(text);
  const n = m.length;
  const q = 4;
  const scale = 8;
  const W = (n + q * 2) * scale;
  const data = new Uint8ClampedArray(W * W * 4);
  for (let y = 0; y < W; y++) {
    for (let x = 0; x < W; x++) {
      const mx = Math.floor(x / scale) - q;
      const my = Math.floor(y / scale) - q;
      const dark = mx >= 0 && mx < n && my >= 0 && my < n && m[my][mx];
      const v = dark ? 0 : 255;
      const i = (y * W + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = v;
      data[i + 3] = 255;
    }
  }
  return jsQR(data, W, W)?.data ?? null;
}

describe("qr · qrMatrix", () => {
  it("returns a square boolean matrix", () => {
    const m = qrMatrix("ST-A1");
    expect(m.length).toBeGreaterThan(0);
    expect(m[0].length).toBe(m.length);
  });

  it("decodes back to the input with an independent decoder (jsQR)", () => {
    for (const value of ["176-13092796", "ST-A1", "528210004471820", "https://example.com/jobs/job-4"]) {
      expect(decode(value)).toBe(value);
    }
  });
});
