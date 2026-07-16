"use client";

import { useMemo } from "react";
import { qrMatrix } from "@/lib/qr";

/**
 * Dynamic QR code as inline SVG. Encodes whatever `value` is passed (an AWB, a
 * unit id, a microchip, or a deep-link URL) — scannable by any phone camera.
 * No image assets, no library.
 */
export function QRCode({
  value,
  size = 108,
  caption,
  className = "",
}: {
  value: string;
  /** Rendered pixel size of the QR square. */
  size?: number;
  caption?: string;
  className?: string;
}) {
  const matrix = useMemo(() => {
    try {
      return qrMatrix(value);
    } catch {
      return null;
    }
  }, [value]);

  if (!matrix) return null;

  const n = matrix.length;
  const quiet = 4; // modules of quiet zone
  const dim = n + quiet * 2;

  // Integer pixels per module → every module identical & crisp (fractional
  // scaling with crispEdges produces uneven modules that scanners reject).
  const cell = Math.max(3, Math.round(size / dim));
  const px = cell * dim;

  // Build one path string of all dark modules (in pixel units).
  let d = "";
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (matrix[y][x]) {
        const px0 = (x + quiet) * cell;
        const py0 = (y + quiet) * cell;
        d += `M${px0} ${py0}h${cell}v${cell}h-${cell}z`;
      }
    }
  }

  return (
    <span className={`inline-flex flex-col items-center ${className}`}>
      <svg
        width={px}
        height={px}
        viewBox={`0 0 ${px} ${px}`}
        role="img"
        aria-label={`QR code for ${value}`}
        shapeRendering="crispEdges"
        style={{ background: "#ffffff" }}
      >
        <rect x="0" y="0" width={px} height={px} fill="#ffffff" />
        <path d={d} fill="#000000" />
      </svg>
      {caption && (
        <span className="mt-1 font-mono text-[10px] tracking-wide text-ink-soft">{caption}</span>
      )}
    </span>
  );
}
