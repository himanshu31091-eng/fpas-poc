// ---------------------------------------------------------------------------
// FPAS POC — dependency-free QR Code generator.
//
// Byte-mode, error-correction level M, versions 1–6 (enough for AWBs, IDs and
// short URLs). Implements the QR spec directly: UTF-8 byte segment, Reed–Solomon
// error correction over GF(256), block interleaving, matrix placement of the
// finder / timing / alignment patterns, all 8 data masks scored by penalty, and
// BCH-coded format bits. No library, no image assets — fully dynamic from the
// value passed in. (Algorithm faithfully follows the well-known reference QR
// construction.)
// ---------------------------------------------------------------------------

// Error-correction level M tables, indexed by version (1–6).
const ECC_CW_PER_BLOCK: Record<number, number> = { 1: 10, 2: 16, 3: 26, 4: 18, 5: 24, 6: 16 };
const NUM_BLOCKS: Record<number, number> = { 1: 1, 2: 1, 3: 1, 4: 2, 5: 2, 6: 4 };
const ECL_BITS = 0; // level M

// --- GF(256) Reed–Solomon -------------------------------------------------
function rsDivisor(degree: number): number[] {
  const result = new Array(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < degree; j++) {
      result[j] = mul(result[j], root);
      if (j + 1 < degree) result[j] ^= result[j + 1];
    }
    root = mul(root, 0x02);
  }
  return result;
}
function rsRemainder(data: number[], divisor: number[]): number[] {
  const result = divisor.map(() => 0);
  for (const b of data) {
    const factor = b ^ (result.shift() as number);
    result.push(0);
    for (let i = 0; i < divisor.length; i++) result[i] ^= mul(divisor[i], factor);
  }
  return result;
}
function mul(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z & 0xff;
}

// --- Version sizing --------------------------------------------------------
function numRawDataModules(ver: number): number {
  let result = (16 * ver + 128) * ver + 64;
  if (ver >= 2) {
    const numAlign = Math.floor(ver / 7) + 2;
    result -= (25 * numAlign - 10) * numAlign - 55;
    // versions >= 7 also subtract version-info modules; not used here (v ≤ 6)
  }
  return result;
}
function numDataCodewords(ver: number): number {
  return Math.floor(numRawDataModules(ver) / 8) - ECC_CW_PER_BLOCK[ver] * NUM_BLOCKS[ver];
}
function pickVersion(byteLen: number): number {
  const need = 4 + 8 + 8 * byteLen; // mode + 8-bit count + data
  for (let v = 1; v <= 6; v++) {
    if (need <= numDataCodewords(v) * 8) return v;
  }
  throw new Error("QR: content too long for versions 1–6");
}

function alignmentPositions(ver: number): number[] {
  if (ver === 1) return [];
  const size = ver * 4 + 17;
  return [6, size - 7]; // v2–6 have exactly two coordinates
}

// --- Public entry ----------------------------------------------------------
export function qrMatrix(text: string): boolean[][] {
  const bytes = Array.from(new TextEncoder().encode(text));
  const ver = pickVersion(bytes.length);
  const size = ver * 4 + 17;

  // 1. Data bit buffer: byte-mode segment.
  const bits: number[] = [];
  const push = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1);
  };
  push(0b0100, 4); // byte mode
  push(bytes.length, 8); // char count (v1–9)
  for (const b of bytes) push(b, 8);

  const capacityBits = numDataCodewords(ver) * 8;
  push(0, Math.min(4, capacityBits - bits.length)); // terminator
  while (bits.length % 8 !== 0) bits.push(0); // byte-align
  for (let pad = 0xec; bits.length < capacityBits; pad ^= 0xec ^ 0x11) push(pad, 8);

  const dataCw: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j];
    dataCw.push(byte);
  }

  // 2. ECC + interleave.
  const allCw = addEccAndInterleave(dataCw, ver);

  // 3. Matrix.
  const modules: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));
  const isFn: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));

  drawFunctionPatterns(modules, isFn, ver, size);
  drawCodewords(modules, isFn, allCw, size);

  // 4. Pick the best mask by penalty.
  let bestMask = 0;
  let minPenalty = Infinity;
  for (let m = 0; m < 8; m++) {
    applyMask(modules, isFn, m, size);
    drawFormatBits(modules, isFn, m, size);
    const p = penalty(modules, size);
    if (p < minPenalty) {
      minPenalty = p;
      bestMask = m;
    }
    applyMask(modules, isFn, m, size); // undo (XOR is its own inverse)
  }
  applyMask(modules, isFn, bestMask, size);
  drawFormatBits(modules, isFn, bestMask, size);

  return modules;
}

function addEccAndInterleave(data: number[], ver: number): number[] {
  const numBlocks = NUM_BLOCKS[ver];
  const blockEccLen = ECC_CW_PER_BLOCK[ver];
  const rawCw = Math.floor(numRawDataModules(ver) / 8);
  const numShort = numBlocks - (rawCw % numBlocks);
  const shortLen = Math.floor(rawCw / numBlocks);
  const divisor = rsDivisor(blockEccLen);

  const blocks: number[][] = [];
  for (let i = 0, k = 0; i < numBlocks; i++) {
    const datLen = shortLen - blockEccLen + (i < numShort ? 0 : 1);
    const dat = data.slice(k, k + datLen);
    k += datLen;
    const ecc = rsRemainder(dat, divisor);
    if (i < numShort) dat.push(0); // align short blocks
    blocks.push(dat.concat(ecc));
  }

  const result: number[] = [];
  for (let i = 0; i < blocks[0].length; i++) {
    for (let j = 0; j < blocks.length; j++) {
      if (i !== shortLen - blockEccLen || j >= numShort) result.push(blocks[j][i]);
    }
  }
  return result;
}

function drawFunctionPatterns(m: boolean[][], fn: boolean[][], ver: number, size: number) {
  // Timing patterns
  for (let i = 0; i < size; i++) {
    setFn(m, fn, 6, i, i % 2 === 0);
    setFn(m, fn, i, 6, i % 2 === 0);
  }
  // Finder patterns + separators
  drawFinder(m, fn, 3, 3, size);
  drawFinder(m, fn, 3, size - 4, size);
  drawFinder(m, fn, size - 4, 3, size);

  // Alignment patterns
  const pos = alignmentPositions(ver);
  for (let i = 0; i < pos.length; i++) {
    for (let j = 0; j < pos.length; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === pos.length - 1) || (i === pos.length - 1 && j === 0))
        continue;
      drawAlignment(m, fn, pos[i], pos[j]);
    }
  }

  // Reserve format-info areas (filled later); dark module.
  drawFormatBits(m, fn, 0, size);
}

function drawFinder(m: boolean[][], fn: boolean[][], cy: number, cx: number, size: number) {
  for (let dy = -4; dy <= 4; dy++) {
    for (let dx = -4; dx <= 4; dx++) {
      const y = cy + dy;
      const x = cx + dx;
      if (x < 0 || x >= size || y < 0 || y >= size) continue;
      const dist = Math.max(Math.abs(dx), Math.abs(dy));
      setFn(m, fn, y, x, dist !== 2 && dist !== 4); // dark at 0,1,3; white at 2,4
    }
  }
}

function drawAlignment(m: boolean[][], fn: boolean[][], cy: number, cx: number) {
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      setFn(m, fn, cy + dy, cx + dx, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
  }
}

function drawFormatBits(m: boolean[][], fn: boolean[][], mask: number, size: number) {
  const data = (ECL_BITS << 3) | mask; // 5 bits
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  const bits = ((data << 10) | rem) ^ 0x5412; // 15 bits
  const getBit = (x: number, i: number) => ((x >>> i) & 1) !== 0;

  // First copy (around top-left finder)
  for (let i = 0; i <= 5; i++) setFn(m, fn, 8, i, getBit(bits, i));
  setFn(m, fn, 8, 7, getBit(bits, 6));
  setFn(m, fn, 8, 8, getBit(bits, 7));
  setFn(m, fn, 7, 8, getBit(bits, 8));
  for (let i = 9; i < 15; i++) setFn(m, fn, 14 - i, 8, getBit(bits, i));

  // Second copy
  for (let i = 0; i < 8; i++) setFn(m, fn, size - 1 - i, 8, getBit(bits, i));
  for (let i = 8; i < 15; i++) setFn(m, fn, 8, size - 15 + i, getBit(bits, i));
  setFn(m, fn, size - 8, 8, true); // dark module
}

function drawCodewords(m: boolean[][], fn: boolean[][], cw: number[], size: number) {
  let i = 0; // bit index
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vert : vert;
        if (!fn[y][x] && i < cw.length * 8) {
          m[y][x] = ((cw[i >>> 3] >>> (7 - (i & 7))) & 1) !== 0;
          i++;
        }
      }
    }
  }
}

function applyMask(m: boolean[][], fn: boolean[][], mask: number, size: number) {
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (fn[y][x]) continue;
      let invert = false;
      switch (mask) {
        case 0: invert = (x + y) % 2 === 0; break;
        case 1: invert = y % 2 === 0; break;
        case 2: invert = x % 3 === 0; break;
        case 3: invert = (x + y) % 3 === 0; break;
        case 4: invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
        case 5: invert = ((x * y) % 2) + ((x * y) % 3) === 0; break;
        case 6: invert = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0; break;
        case 7: invert = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0; break;
      }
      if (invert) m[y][x] = !m[y][x];
    }
  }
}

function penalty(m: boolean[][], size: number): number {
  let p = 0;
  // Rule 1: runs of 5+ same-colour in rows/cols
  for (let y = 0; y < size; y++) {
    let runColor = m[y][0], run = 1;
    for (let x = 1; x < size; x++) {
      if (m[y][x] === runColor) { run++; if (run === 5) p += 3; else if (run > 5) p++; }
      else { runColor = m[y][x]; run = 1; }
    }
  }
  for (let x = 0; x < size; x++) {
    let runColor = m[0][x], run = 1;
    for (let y = 1; y < size; y++) {
      if (m[y][x] === runColor) { run++; if (run === 5) p += 3; else if (run > 5) p++; }
      else { runColor = m[y][x]; run = 1; }
    }
  }
  // Rule 2: 2x2 blocks
  for (let y = 0; y < size - 1; y++)
    for (let x = 0; x < size - 1; x++)
      if (m[y][x] === m[y][x + 1] && m[y][x] === m[y + 1][x] && m[y][x] === m[y + 1][x + 1]) p += 3;
  // Rule 3: finder-like 1:1:3:1:1 patterns
  const pat1 = [true, false, true, true, true, false, true, false, false, false, false];
  const pat2 = [false, false, false, false, true, false, true, true, true, false, true];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (x + 11 <= size) {
        let a = true, b = true;
        for (let k = 0; k < 11; k++) { if (m[y][x + k] !== pat1[k]) a = false; if (m[y][x + k] !== pat2[k]) b = false; }
        if (a || b) p += 40;
      }
      if (y + 11 <= size) {
        let a = true, b = true;
        for (let k = 0; k < 11; k++) { if (m[y + k][x] !== pat1[k]) a = false; if (m[y + k][x] !== pat2[k]) b = false; }
        if (a || b) p += 40;
      }
    }
  }
  // Rule 4: dark/light balance
  let dark = 0;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (m[y][x]) dark++;
  const total = size * size;
  const k = Math.floor((Math.abs(dark * 20 - total * 10) / total));
  p += k * 10;
  return p;
}

function setFn(m: boolean[][], fn: boolean[][], y: number, x: number, val: boolean) {
  m[y][x] = val;
  fn[y][x] = true;
}
