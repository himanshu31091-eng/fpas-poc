"use client";

import { code39, sanitizeCode39, code39Width } from "@/lib/barcode";

/**
 * Dynamic Code 39 barcode as inline SVG — encodes whatever `value` is passed
 * (e.g. the job's real AWB). Renders the human-readable value beneath, the way
 * a cargo label does. No image assets, no library.
 */
export function Barcode({
  value,
  height = 44,
  module = 1.6,
  showValue = true,
  className = "",
}: {
  value: string;
  /** Bar height in px. */
  height?: number;
  /** Narrow-module width in px. */
  module?: number;
  showValue?: boolean;
  className?: string;
}) {
  const clean = sanitizeCode39(value);
  if (!clean) return null;

  const mods = code39(value);
  const totalW = code39Width(value) * module;
  const pad = module * 10; // quiet zone
  const width = totalW + pad * 2;

  const rects: { x: number; w: number }[] = [];
  let x = pad;
  for (const m of mods) {
    const w = m.w * module;
    if (m.bar) rects.push({ x, w });
    x += w;
  }

  return (
    <span className={`inline-flex flex-col items-center ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Barcode ${clean}`}
        style={{ background: "#fff", borderRadius: 4 }}
      >
        {rects.map((r, i) => (
          <rect key={i} x={r.x} y={4} width={r.w} height={height - 8} fill="#0C1B29" />
        ))}
      </svg>
      {showValue && (
        <span className="mt-1 font-mono text-[10px] tracking-[0.15em] text-ink-soft">
          {clean}
        </span>
      )}
    </span>
  );
}
