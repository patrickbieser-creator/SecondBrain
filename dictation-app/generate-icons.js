// generate-icons.js — run with: node generate-icons.js
// Generates mic-off.png (red "D") and mic-on.png (green "D") in assets/
"use strict";
const fs   = require("fs");
const zlib = require("zlib");
const path = require("path");

// ── CRC32 ──────────────────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// ── Minimal PNG encoder (RGBA) ─────────────────────────────────────────────────
function pngChunk(type, data) {
  const typeB = Buffer.from(type, "ascii");
  const lenB  = Buffer.allocUnsafe(4);
  lenB.writeUInt32BE(data.length);
  const crcB  = Buffer.allocUnsafe(4);
  crcB.writeUInt32BE(crc32(Buffer.concat([typeB, data])));
  return Buffer.concat([lenB, typeB, data, crcB]);
}

function makePNG(pixels, w, h) {
  // IHDR
  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8]  = 8; // bit depth
  ihdr[9]  = 6; // colour type: RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // Raw scanlines: filter byte (None=0) + RGBA rows
  const rows = [];
  for (let y = 0; y < h; y++) {
    const row = Buffer.allocUnsafe(1 + w * 4);
    row[0] = 0;
    for (let x = 0; x < w; x++) {
      const s = (y * w + x) * 4, d = 1 + x * 4;
      row[d]   = pixels[s];
      row[d+1] = pixels[s+1];
      row[d+2] = pixels[s+2];
      row[d+3] = pixels[s+3];
    }
    rows.push(row);
  }
  const idat = zlib.deflateSync(Buffer.concat(rows));

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", idat),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

// ── "D" glyph (5 wide × 7 tall pixel bitmap) ──────────────────────────────────
const D_GLYPH = [
  [1,1,1,0,0],
  [1,0,0,1,0],
  [1,0,0,0,1],
  [1,0,0,0,1],
  [1,0,0,0,1],
  [1,0,0,1,0],
  [1,1,1,0,0],
];

// ── Draw icon ──────────────────────────────────────────────────────────────────
function generateIcon(size, color) {
  const [rr, gg, bb] = color;
  const pixels = Buffer.alloc(size * size * 4, 0); // all transparent

  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 1;

  // Filled circle with 1-px anti-aliased edge
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx   = x - cx + 0.5;
      const dy   = y - cy + 0.5;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const alpha = Math.max(0, Math.min(1, radius - dist + 0.5));
      if (alpha > 0) {
        const i = (y * size + x) * 4;
        pixels[i]   = rr;
        pixels[i+1] = gg;
        pixels[i+2] = bb;
        pixels[i+3] = Math.round(alpha * 255);
      }
    }
  }

  // "D" glyph — scale to ~60 % of icon height, centred
  const gh    = D_GLYPH.length;
  const gw    = D_GLYPH[0].length;
  const scale = Math.max(1, Math.floor(size * 0.6 / gh));
  const offX  = Math.round((size - gw * scale) / 2);
  const offY  = Math.round((size - gh * scale) / 2);

  for (let gy = 0; gy < gh; gy++) {
    for (let gx = 0; gx < gw; gx++) {
      if (!D_GLYPH[gy][gx]) continue;
      for (let sy = 0; sy < scale; sy++) {
        for (let sx = 0; sx < scale; sx++) {
          const px = offX + gx * scale + sx;
          const py = offY + gy * scale + sy;
          if (px < 0 || px >= size || py < 0 || py >= size) continue;
          const i = (py * size + px) * 4;
          pixels[i]   = 255;
          pixels[i+1] = 255;
          pixels[i+2] = 255;
          pixels[i+3] = 255;
        }
      }
    }
  }

  return makePNG(pixels, size, size);
}

// ── Write files ────────────────────────────────────────────────────────────────
const assetsDir = path.join(__dirname, "assets");
fs.mkdirSync(assetsDir, { recursive: true });

const SIZE = 32; // 32×32 — Windows scales to tray size
fs.writeFileSync(path.join(assetsDir, "mic-off.png"), generateIcon(SIZE, [204, 0,   0  ])); // red
fs.writeFileSync(path.join(assetsDir, "mic-on.png"),  generateIcon(SIZE, [0,   180, 0  ])); // green

console.log(`Generated ${SIZE}×${SIZE} icons in assets/`);
