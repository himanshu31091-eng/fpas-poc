// ---------------------------------------------------------------------------
// FPAS POC — dependency-free PDF writer.
//
// Produces a genuine, branded, multi-page .pdf (no external library, same
// spirit as lib/xlsx.ts): a navy header band with the FPAS wordmark + a yellow
// accent bar, the document body in Courier, a footer, and a diagonal DRAFT
// watermark. Uses the built-in Helvetica/Courier fonts (no embedding), so text
// is sanitised to ASCII to keep the standard encoding happy.
// ---------------------------------------------------------------------------

import { qrMatrix } from "./qr";

const PAGE_W = 595; // A4 in points
const PAGE_H = 842;
const MARGIN = 48;
const HEADER_H = 92;
const BODY_TOP = PAGE_H - HEADER_H - 30;
const BODY_BOTTOM = 56;
const LINE_H = 13;
const BODY_FONT = 9.5;
const CHARS_PER_LINE = Math.floor((PAGE_W - MARGIN * 2) / (BODY_FONT * 0.6));
const LINES_PER_PAGE = Math.floor((BODY_TOP - BODY_BOTTOM) / LINE_H);

/** Fold accented / typographic characters down to ASCII the base-14 fonts render. */
function sanitize(s: string): string {
  return (s ?? "")
    .replace(/[‘’‚]/g, "'")
    .replace(/[“”„]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/•/g, "*")
    .replace(/·/g, "-")
    .replace(/°/g, " deg")
    .replace(/€/g, "EUR")
    .replace(/[→➔]/g, "->")
    .replace(/[àáâä]/g, "a").replace(/[èéêë]/g, "e").replace(/[ìíîï]/g, "i")
    .replace(/[òóôö]/g, "o").replace(/[ùúûü]/g, "u").replace(/[ç]/g, "c")
    .replace(/[ñ]/g, "n").replace(/[ÀÁÂÄ]/g, "A").replace(/[ÈÉÊË]/g, "E")
    .replace(/[Ö]/g, "O").replace(/[Ü]/g, "U")
    // eslint-disable-next-line no-control-regex
    .replace(/[^\x09\x0a\x20-\x7e]/g, "");
}

function escapePdf(s: string): string {
  return sanitize(s).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/** Wrap a paragraph to CHARS_PER_LINE, honouring explicit newlines. */
function wrap(text: string): string[] {
  const out: string[] = [];
  for (const raw of sanitize(text).split("\n")) {
    if (raw.trim() === "") {
      out.push("");
      continue;
    }
    let line = "";
    for (const word of raw.split(/\s+/)) {
      if (line && (line + " " + word).length > CHARS_PER_LINE) {
        out.push(line);
        line = word;
      } else {
        line = line ? `${line} ${word}` : word;
      }
      // hard-break very long tokens
      while (line.length > CHARS_PER_LINE) {
        out.push(line.slice(0, CHARS_PER_LINE));
        line = line.slice(CHARS_PER_LINE);
      }
    }
    out.push(line);
  }
  return out;
}

/** White panel + black QR modules, drawn in vector (scannable off the sheet). */
function qrPdfOps(value: string, x: number, y: number, box: number): string {
  let matrix: boolean[][];
  try {
    matrix = qrMatrix(value);
  } catch {
    return "";
  }
  const n = matrix.length;
  const quiet = 2;
  const dim = n + quiet * 2;
  const mod = box / dim;
  let c = `1 1 1 rg ${x} ${y} ${box} ${box} re f\n0.05 0.11 0.16 rg\n`;
  for (let r = 0; r < n; r++) {
    for (let col = 0; col < n; col++) {
      if (!matrix[r][col]) continue;
      const px = x + (col + quiet) * mod;
      const py = y + box - (r + quiet + 1) * mod; // flip: matrix row 0 = top
      c += `${px.toFixed(2)} ${py.toFixed(2)} ${mod.toFixed(2)} ${mod.toFixed(2)} re f\n`;
    }
  }
  return c;
}

function pageContent(
  title: string,
  subtitle: string,
  footer: string,
  lines: string[],
  watermark?: string,
  qr?: string
): string {
  const navy = "0.137 0.122 0.361";
  const yellow = "1 0.769 0.047";
  let c = "";

  // Header band + yellow accent bar
  c += `${navy} rg 0 ${PAGE_H - HEADER_H} ${PAGE_W} ${HEADER_H} re f\n`;
  c += `${yellow} rg 0 ${PAGE_H - HEADER_H - 5} ${PAGE_W} 5 re f\n`;

  // Wordmark + title (white) in the header
  c += `BT /F2 11 Tf 1 1 1 rg ${MARGIN} ${PAGE_H - 34} Td (FPAS - First Point Animal Services) Tj ET\n`;
  c += `BT /F2 18 Tf 1 1 1 rg ${MARGIN} ${PAGE_H - 62} Td (${escapePdf(title)}) Tj ET\n`;
  if (subtitle)
    c += `BT /F1 9 Tf 0.85 0.85 0.9 rg ${MARGIN} ${PAGE_H - 80} Td (${escapePdf(subtitle)}) Tj ET\n`;

  // Scannable AWB QR code (top-right, on a white panel over the header)
  if (qr) c += qrPdfOps(qr, PAGE_W - 108, PAGE_H - 84, 66);

  // Diagonal DRAFT watermark
  if (watermark) {
    c += `q 0.92 0.92 0.94 rg BT /F2 90 Tf 0.7071 0.7071 -0.7071 0.7071 150 250 Tm (${escapePdf(watermark)}) Tj ET Q\n`;
  }

  // Body (Courier, dark)
  c += `0.05 0.11 0.16 rg\n`;
  let y = BODY_TOP;
  for (const line of lines) {
    c += `BT /F3 ${BODY_FONT} Tf ${MARGIN} ${y} Td (${escapePdf(line)}) Tj ET\n`;
    y -= LINE_H;
  }

  // Footer
  c += `BT /F1 8 Tf 0.45 0.5 0.55 rg ${MARGIN} ${BODY_BOTTOM - 20} Td (${escapePdf(footer)}) Tj ET\n`;

  return c;
}

/** Build the full PDF as an ASCII string (pure — safe to unit-test in Node). */
export function renderPdf(doc: {
  title: string;
  subtitle?: string;
  body: string;
  watermark?: string;
  qr?: string;
}): string {
  const allLines = wrap(doc.body);
  const pages: string[][] = [];
  for (let i = 0; i < allLines.length; i += LINES_PER_PAGE) {
    pages.push(allLines.slice(i, i + LINES_PER_PAGE));
  }
  if (pages.length === 0) pages.push([]);

  const footerBase = `DRAFT - FPAS proof of concept - not a legal document`;

  // Build objects. 1 Catalog, 2 Pages, 3/4/5 fonts, then per page: Page + Contents.
  const objects: string[] = [];
  const fontObjs = 3;
  const pageObjStart = 6;
  const kids: string[] = [];
  pages.forEach((_, i) => kids.push(`${pageObjStart + i * 2} 0 R`));

  objects[1] = `<< /Type /Catalog /Pages 2 0 R >>`;
  objects[2] = `<< /Type /Pages /Kids [${kids.join(" ")}] /Count ${pages.length} >>`;
  objects[3] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`;
  objects[4] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>`;
  objects[5] = `<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>`;

  pages.forEach((lines, i) => {
    const pageObj = pageObjStart + i * 2;
    const contentObj = pageObj + 1;
    const footer = `${footerBase}   ·   page ${i + 1} / ${pages.length}`.replace(/·/g, "-");
    const content = pageContent(
      doc.title,
      doc.subtitle ?? "",
      footer,
      lines,
      doc.watermark,
      i === 0 ? doc.qr : undefined
    );
    objects[pageObj] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
      `/Resources << /Font << /F1 ${fontObjs} 0 R /F2 4 0 R /F3 5 0 R >> >> ` +
      `/Contents ${contentObj} 0 R >>`;
    objects[contentObj] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;
  });

  // Assemble with a byte-accurate xref (everything is ASCII → 1 char = 1 byte).
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  for (let i = 1; i < objects.length; i++) {
    if (!objects[i]) continue;
    offsets[i] = pdf.length;
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xrefStart = pdf.length;
  const count = objects.length; // includes index 0
  pdf += `xref\n0 ${count}\n`;
  pdf += `0000000000 65535 f \n`;
  for (let i = 1; i < count; i++) {
    if (objects[i]) {
      pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
    } else {
      pdf += `0000000000 00000 f \n`;
    }
  }
  pdf += `trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return pdf;
}

export function downloadPdf(
  filename: string,
  doc: { title: string; subtitle?: string; body: string; watermark?: string; qr?: string }
) {
  const pdf = renderPdf(doc);

  // ASCII string → bytes.
  const bytes = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xff;

  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
