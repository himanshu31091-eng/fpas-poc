// ---------------------------------------------------------------------------
// FPAS POC — dependency-free Code 39 barcode encoder.
//
// Code 39 fits air-waybill numbers (digits + hyphen) and is widely scannable.
// It is fully dynamic: bars are computed from whatever value you pass. The
// output is a list of alternating bar/space "modules" that both the on-screen
// SVG component and the PDF writer render (as rects). Narrow = 1 module,
// wide = 3 modules; a narrow space separates characters; `*` frames start/stop.
// ---------------------------------------------------------------------------

// Each glyph is 9 elements (bar,space,bar,…), "1" = wide, "0" = narrow.
const CODE39: Record<string, string> = {
  "0": "000110100", "1": "100100001", "2": "001100001", "3": "101100000",
  "4": "000110001", "5": "100110000", "6": "001110000", "7": "000100101",
  "8": "100100100", "9": "001100100", A: "100001001", B: "001001001",
  C: "101001000", D: "000011001", E: "100011000", F: "001011000",
  G: "000001101", H: "100001100", I: "001001100", J: "000011100",
  K: "100000011", L: "001000011", M: "101000010", N: "000010011",
  O: "100010010", P: "001010010", Q: "000000111", R: "100000110",
  S: "001000110", T: "000010110", U: "110000001", V: "011000001",
  W: "111000000", X: "010010001", Y: "110010000", Z: "011010000",
  "-": "010000101", ".": "110000100", " ": "011000100", $: "010101000",
  "/": "010100010", "+": "010001010", "%": "000101010", "*": "010010100",
};

export interface BarModule {
  bar: boolean;
  /** Width in modules (narrow = 1, wide = 3). */
  w: number;
}

/** Keep only characters Code 39 can encode (upper-cased). */
export function sanitizeCode39(raw: string): string {
  return (raw ?? "").toUpperCase().replace(/[^0-9A-Z\-. $/+%]/g, "");
}

/** Encode a value into ordered bar/space modules, framed by the `*` guards. */
export function code39(raw: string): BarModule[] {
  const text = `*${sanitizeCode39(raw)}*`;
  const mods: BarModule[] = [];
  text.split("").forEach((ch, idx) => {
    const pat = CODE39[ch] ?? CODE39["-"];
    for (let i = 0; i < 9; i++) {
      mods.push({ bar: i % 2 === 0, w: pat[i] === "1" ? 3 : 1 });
    }
    if (idx < text.length - 1) mods.push({ bar: false, w: 1 }); // inter-char gap
  });
  return mods;
}

/** Total width in modules — useful for sizing/scaling. */
export function code39Width(raw: string): number {
  return code39(raw).reduce((sum, m) => sum + m.w, 0);
}
