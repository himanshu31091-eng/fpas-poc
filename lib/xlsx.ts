// ---------------------------------------------------------------------------
// Minimal, dependency-free .xlsx (OOXML SpreadsheetML) writer.
//
// Produces a genuine multi-sheet Excel workbook entirely in the browser — no
// libraries to install or version-pin, in the same spirit as lib/anthropic.ts.
// The ZIP is written with the STORE method (no compression), which is fine for
// report-sized data and keeps the code small and verifiable.
// ---------------------------------------------------------------------------

export type CellValue = string | number | null | undefined;

export interface Sheet {
  name: string;
  rows: CellValue[][];
}

const enc = new TextEncoder();

function xmlEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** 0 -> A, 25 -> Z, 26 -> AA … */
function colLetter(n: number): string {
  let s = "";
  let x = n + 1;
  while (x > 0) {
    const m = (x - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    x = Math.floor((x - 1) / 26);
  }
  return s;
}

function sanitizeSheetName(name: string, index: number): string {
  const cleaned = name
    .replace(/[\\/?*[\]:]/g, " ")
    .trim()
    .slice(0, 31);
  return cleaned || `Sheet${index + 1}`;
}

function sheetXml(rows: CellValue[][]): string {
  const body = rows
    .map((row, r) => {
      const cells = row
        .map((val, c) => {
          const ref = `${colLetter(c)}${r + 1}`;
          const style = r === 0 ? ' s="1"' : ""; // bold header row
          if (val === null || val === undefined || val === "") {
            return `<c r="${ref}"${style}/>`;
          }
          if (typeof val === "number" && Number.isFinite(val)) {
            return `<c r="${ref}"${style}><v>${val}</v></c>`;
          }
          return `<c r="${ref}"${style} t="inlineStr"><is><t xml:space="preserve">${xmlEscape(
            String(val)
          )}</t></is></c>`;
        })
        .join("");
      return `<row r="${r + 1}">${cells}</row>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${body}</sheetData></worksheet>`;
}

// --- ZIP (store method) -----------------------------------------------------

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

interface Entry {
  name: string;
  size: number;
  crc: number;
  offset: number;
}

function zip(files: { name: string; data: Uint8Array }[]): Uint8Array {
  const chunks: Uint8Array[] = [];
  const entries: Entry[] = [];
  let offset = 0;
  const push = (u: Uint8Array) => {
    chunks.push(u);
    offset += u.length;
  };

  for (const f of files) {
    const nameBytes = enc.encode(f.name);
    const crc = crc32(f.data);
    const local = new Uint8Array(30 + nameBytes.length);
    const dv = new DataView(local.buffer);
    dv.setUint32(0, 0x04034b50, true); // local file header signature
    dv.setUint16(4, 20, true); // version needed
    dv.setUint16(6, 0, true); // flags
    dv.setUint16(8, 0, true); // method: store
    dv.setUint16(10, 0, true); // mod time
    dv.setUint16(12, 0x21, true); // mod date (1980-01-01)
    dv.setUint32(14, crc, true);
    dv.setUint32(18, f.data.length, true); // compressed size
    dv.setUint32(22, f.data.length, true); // uncompressed size
    dv.setUint16(26, nameBytes.length, true);
    dv.setUint16(28, 0, true); // extra len
    local.set(nameBytes, 30);
    entries.push({ name: f.name, size: f.data.length, crc, offset });
    push(local);
    push(f.data);
  }

  const cdStart = offset;
  for (const e of entries) {
    const nameBytes = enc.encode(e.name);
    const cd = new Uint8Array(46 + nameBytes.length);
    const dv = new DataView(cd.buffer);
    dv.setUint32(0, 0x02014b50, true); // central directory signature
    dv.setUint16(4, 20, true); // version made by
    dv.setUint16(6, 20, true); // version needed
    dv.setUint16(8, 0, true); // flags
    dv.setUint16(10, 0, true); // method: store
    dv.setUint16(12, 0, true); // mod time
    dv.setUint16(14, 0x21, true); // mod date
    dv.setUint32(16, e.crc, true);
    dv.setUint32(20, e.size, true);
    dv.setUint32(24, e.size, true);
    dv.setUint16(28, nameBytes.length, true);
    dv.setUint16(30, 0, true); // extra len
    dv.setUint16(32, 0, true); // comment len
    dv.setUint16(34, 0, true); // disk number start
    dv.setUint16(36, 0, true); // internal attrs
    dv.setUint32(38, 0, true); // external attrs
    dv.setUint32(42, e.offset, true); // local header offset
    cd.set(nameBytes, 46);
    push(cd);
  }
  const cdSize = offset - cdStart;

  const eocd = new Uint8Array(22);
  const dv = new DataView(eocd.buffer);
  dv.setUint32(0, 0x06054b50, true); // EOCD signature
  dv.setUint16(4, 0, true); // disk number
  dv.setUint16(6, 0, true); // cd start disk
  dv.setUint16(8, entries.length, true);
  dv.setUint16(10, entries.length, true);
  dv.setUint32(12, cdSize, true);
  dv.setUint32(16, cdStart, true);
  dv.setUint16(20, 0, true); // comment len
  push(eocd);

  const out = new Uint8Array(offset);
  let p = 0;
  for (const c of chunks) {
    out.set(c, p);
    p += c.length;
  }
  return out;
}

// --- Fixed OOXML parts ------------------------------------------------------

const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs></styleSheet>`;

function contentTypes(sheetCount: number): string {
  const overrides = Array.from(
    { length: sheetCount },
    (_, i) =>
      `<Override PartName="/xl/worksheets/sheet${
        i + 1
      }.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
  ).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${overrides}</Types>`;
}

function workbookXml(names: string[]): string {
  const sheets = names
    .map(
      (n, i) =>
        `<sheet name="${xmlEscape(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets}</sheets></workbook>`;
}

function workbookRels(sheetCount: number): string {
  const sheetRels = Array.from(
    { length: sheetCount },
    (_, i) =>
      `<Relationship Id="rId${
        i + 1
      }" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${
        i + 1
      }.xml"/>`
  ).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheetRels}<Relationship Id="rId${
    sheetCount + 1
  }" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
}

/** Assemble the workbook bytes for the given sheets. */
export function buildXlsx(sheets: Sheet[]): Uint8Array {
  const named = sheets.map((s, i) => ({
    name: sanitizeSheetName(s.name, i),
    rows: s.rows,
  }));
  const files = [
    { name: "[Content_Types].xml", data: enc.encode(contentTypes(named.length)) },
    { name: "_rels/.rels", data: enc.encode(ROOT_RELS) },
    { name: "xl/workbook.xml", data: enc.encode(workbookXml(named.map((s) => s.name))) },
    { name: "xl/_rels/workbook.xml.rels", data: enc.encode(workbookRels(named.length)) },
    { name: "xl/styles.xml", data: enc.encode(STYLES) },
    ...named.map((s, i) => ({
      name: `xl/worksheets/sheet${i + 1}.xml`,
      data: enc.encode(sheetXml(s.rows)),
    })),
  ];
  return zip(files);
}

/** Build the workbook and trigger a browser download. */
export function downloadXlsx(filename: string, sheets: Sheet[]): void {
  const bytes = buildXlsx(sheets);
  const blob = new Blob([bytes.buffer as ArrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
