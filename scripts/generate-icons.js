import fs from 'fs';
import path from 'path';

// Simple PNG generator for standard DevLens icon (Blue square with 'D' / lens shape)
function createMinimalPng(width, height, colorHex) {
  // We can write a tiny PNG buffer or SVG-to-PNG binary generator
  // Alternatively, create a standard valid PNG binary structure
  // For a clean valid PNG:
  const r = parseInt(colorHex.slice(1, 3), 16);
  const g = parseInt(colorHex.slice(3, 5), 16);
  const b = parseInt(colorHex.slice(5, 7), 16);

  // SVG representation converted or simple uncompressed PNG header + IDAT chunk
  // Simple 1x1 or NxN raw PNG generation:
  // Using zlib/png structure:
  const p = (n) => [n >> 24 & 0xff, n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff];
  
  // Header: 8 bytes PNG signature
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  
  // IHDR chunk: 13 bytes
  const ihdrData = Buffer.from([
    ...p(width), ...p(height),
    8, // bit depth
    2, // color type 2 (RGB)
    0, 0, 0
  ]);
  
  const crc32 = (buf) => {
    let c = 0xffffffff;
    const table = [];
    for (let n = 0; n < 256; n++) {
      let k = n;
      for (let m = 0; m < 8; m++) {
        k = (k & 1) ? (0xedb88320 ^ (k >>> 1)) : (k >>> 1);
      }
      table[n] = k;
    }
    for (let i = 0; i < buf.length; i++) {
      c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  };

  const makeChunk = (type, data) => {
    const len = data.length;
    const typeBuf = Buffer.from(type, 'ascii');
    const typeAndData = Buffer.concat([typeBuf, data]);
    const crc = crc32(typeAndData);
    const lenBuf = Buffer.from(p(len));
    const crcBuf = Buffer.from(p(crc));
    return Buffer.concat([lenBuf, typeAndData, crcBuf]);
  };

  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Uncompressed raw scanlines: each row has 1 filter byte (0) + width*3 bytes (RGB)
  const rowSize = 1 + width * 3;
  const rawData = Buffer.alloc(height * rowSize);
  for (let y = 0; y < height; y++) {
    const offset = y * rowSize;
    rawData[offset] = 0; // Filter type 0
    for (let x = 0; x < width; x++) {
      // Draw a dark background with blue lens accent
      const distFromCenter = Math.sqrt(Math.pow(x - width/2, 2) + Math.pow(y - height/2, 2));
      const isLens = distFromCenter <= width * 0.35;
      const pixelOffset = offset + 1 + x * 3;
      if (isLens) {
        rawData[pixelOffset] = r;
        rawData[pixelOffset + 1] = g;
        rawData[pixelOffset + 2] = b;
      } else {
        rawData[pixelOffset] = 0x1e; // #1e293b dark slate
        rawData[pixelOffset + 1] = 0x29;
        rawData[pixelOffset + 2] = 0x3b;
      }
    }
  }

  // IDAT zlib uncompressed block
  // Zlib header (0x78 0x01 for no compression), store blocks, adler32 checksum
  const adler32 = (buf) => {
    let s1 = 1, s2 = 0;
    for (let i = 0; i < buf.length; i++) {
      s1 = (s1 + buf[i]) % 65521;
      s2 = (s2 + s1) % 65521;
    }
    return (s2 << 16) | s1;
  };

  const numBlocks = Math.ceil(rawData.length / 65535);
  const zlibChunks = [Buffer.from([0x78, 0x01])]; // Zlib header
  
  for (let b = 0; b < numBlocks; b++) {
    const start = b * 65535;
    const end = Math.min(start + 65535, rawData.length);
    const blockData = rawData.subarray(start, end);
    const isLast = (b === numBlocks - 1) ? 1 : 0;
    const len = blockData.length;
    const nlen = len ^ 0xffff;
    
    const header = Buffer.from([
      isLast,
      len & 0xff, (len >> 8) & 0xff,
      nlen & 0xff, (nlen >> 8) & 0xff
    ]);
    zlibChunks.push(header);
    zlibChunks.push(blockData);
  }
  
  const checksum = adler32(rawData);
  zlibChunks.push(Buffer.from(p(checksum)));

  const idatData = Buffer.concat(zlibChunks);
  const idatChunk = makeChunk('IDAT', idatData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

const iconsDir = path.resolve(process.cwd(), 'public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

fs.writeFileSync(path.join(iconsDir, 'icon16.png'), createMinimalPng(16, 16, '#2563eb'));
fs.writeFileSync(path.join(iconsDir, 'icon48.png'), createMinimalPng(48, 48, '#2563eb'));
fs.writeFileSync(path.join(iconsDir, 'icon128.png'), createMinimalPng(128, 128, '#2563eb'));

console.log('Successfully generated icon16.png, icon48.png, and icon128.png');
