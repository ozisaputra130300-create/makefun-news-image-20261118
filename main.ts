// News-image entry (Node 22, standard library only): the image is entry.png beside this
// file, and this program copies it to /output/entry.png after checking it fits the
// competition gate: a whole PNG of at most 1 MiB and at most 1024 by 1024 pixels.
// The image itself is the entry; this program only delivers it, byte for byte.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { closeSync, copyFileSync, mkdirSync, openSync, readSync, statSync } from 'node:fs';
import { join } from 'node:path';

const MAX_BYTES = 1048576; // 1 MiB
const MAX_SIDE = 1024;
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const src = new URL('./entry.png', import.meta.url);

// Size gate first, from the file's metadata, without loading the whole image.
const { size } = statSync(src);
if (size > MAX_BYTES) {
  throw new Error(`entry.png is ${size} bytes, over the 1 MiB gate (${MAX_BYTES})`);
}
// Header gate: read only the 24-byte PNG signature + IHDR prefix for the magic bytes
// and the width/height, instead of loading the whole file to inspect it.
const fd = openSync(src, 'r');
const header = Buffer.alloc(24);
const read = readSync(fd, header, 0, 24, 0);
closeSync(fd);
if (read < 24 || !header.subarray(0, 8).equals(PNG_MAGIC)) {
  throw new Error('entry.png is not a PNG (bad magic bytes)');
}
const width = header.readUInt32BE(16);
const height = header.readUInt32BE(20);
if (width > MAX_SIDE || height > MAX_SIDE) {
  throw new Error(`entry.png is ${width}x${height}, over the 1024x1024 gate`);
}

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });
copyFileSync(src, join(outDir, 'entry.png'));
console.log(`copied entry.png (${size} bytes, ${width}x${height}) to ${outDir}`);
