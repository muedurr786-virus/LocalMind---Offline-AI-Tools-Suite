import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPng(width, height, colorFn) {
  // ColorFn(x, y) => [r, g, b, a]
  const rowLength = 1 + width * 4; // 1 byte filter type 0 + RGBA pixels
  const rawData = Buffer.alloc(height * rowLength);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = colorFn(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Header
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bits per channel
  ihdr[9] = 6; // RGBA color type
  ihdr[10] = 0; // Compression deflate
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Non-interlaced

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(8 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4);
    data.copy(buf, 8);

    // CRC32 of type + data
    const crcBuf = Buffer.concat([Buffer.from(type), data]);
    const crc = crc32(crcBuf);
    buf.writeUInt32BE(crc, 8 + len);
    return buf;
  }

  // Precomputed CRC table
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c;
  }

  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Icon generator logic
function brandColor(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = (x - cx) / (w / 2);
  const dy = (y - cy) / (h / 2);
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Rounded corners
  if (Math.abs(dx) > 0.88 && Math.abs(dy) > 0.88) {
    const cornerDist = Math.hypot(Math.abs(dx) - 0.88, Math.abs(dy) - 0.88);
    if (cornerDist > 0.12) return [0, 0, 0, 0];
  }

  // Background gradient: dark slate #0b1329 to #020617
  let r = 11;
  let g = 19;
  let b = 41;

  // Center radial glow
  if (dist < 0.6) {
    const glow = (1 - dist / 0.6) * 0.35;
    r = Math.min(255, Math.round(r + 56 * glow));
    g = Math.min(255, Math.round(g + 189 * glow));
    b = Math.min(255, Math.round(b + 248 * glow));
  }

  // Neural nodes simulation
  const nodes = [
    { nx: -0.4, ny: -0.3, col: [56, 189, 248] },
    { nx: -0.4, ny: 0.3, col: [56, 189, 248] },
    { nx: 0, ny: -0.4, col: [6, 182, 212] },
    { nx: 0, ny: 0, col: [255, 255, 255] },
    { nx: 0, ny: 0.4, col: [6, 182, 212] },
    { nx: 0.4, ny: -0.2, col: [245, 158, 11] },
    { nx: 0.4, ny: 0.2, col: [245, 158, 11] },
    { nx: 0.6, ny: 0, col: [16, 185, 129] },
  ];

  for (const n of nodes) {
    const ndist = Math.hypot(dx - n.nx, dy - n.ny);
    if (ndist < 0.12) {
      const t = 1 - ndist / 0.12;
      return [
        Math.round(n.col[0] * t + r * (1 - t)),
        Math.round(n.col[1] * t + g * (1 - t)),
        Math.round(n.col[2] * t + b * (1 - t)),
        255,
      ];
    }
  }

  return [r, g, b, 255];
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, brandColor));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, brandColor));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, brandColor));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, brandColor));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPng(64, 64, brandColor));

console.log('Successfully generated all PWA icons.');
