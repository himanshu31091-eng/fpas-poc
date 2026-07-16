// ---------------------------------------------------------------------------
// FPAS POC — QR matrix helper.
//
// Uses the battle-tested `qrcode-generator` library (pure JS, no canvas) to
// build a spec-correct QR, then exposes it as a boolean[][] the SVG component
// and the PDF writer render themselves. We hand-rolled xlsx/pdf/weather, but a
// spec-perfect QR encoder (Reed–Solomon + masking + format BCH) is too
// error-prone to hand-verify without a reference decoder, so we lean on a
// proven generator here. Output verified to decode with the independent jsQR
// reader (see scratch verification).
// ---------------------------------------------------------------------------

import qrcode from "qrcode-generator";

/** Build a QR code for `text` as a matrix of dark(true)/light(false) modules. */
export function qrMatrix(text: string): boolean[][] {
  const qr = qrcode(0, "M"); // type 0 = auto-size, error-correction level M
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount();
  const matrix: boolean[][] = [];
  for (let r = 0; r < n; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < n; c++) row.push(qr.isDark(r, c));
    matrix.push(row);
  }
  return matrix;
}
