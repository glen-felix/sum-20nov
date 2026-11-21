// news-image-20261120 entry program (Node, standard library only).
//
// The front page for Friday 20 November 2026 was researched, drawn and
// proof-read ahead of time in the build workspace (compose-v3.py —
// candidate v3, the second critique-fix build: v1's 13-panel economy
// restored at full size, v2's verified fixes kept — rebalanced tally,
// attributed deck superlative, per-panel confidence tags, one-frame
// COP31 card, one unbroken tail; see BUILD-V3.md) and ships in the
// repository as `entry.png`, next to this file. At run time this
// program simply copies that fixed asset to the output directory:
// the grader runs the program twice and requires identical bytes,
// and a straight copy of a fixed file cannot drift.
//
// Contract:
// - Reads `entry.png` from the directory this file lives in.
// - Writes it to `$MAKEFUN_OUTPUT_DIR/entry.png`, or to
//   `/output/entry.png` when the variable is unset.
// - Creates the output directory when needed.
// - A missing asset is a hard failure: one line to stderr, exit 1.
// - The asset is checked before copying: it must begin with the PNG
//   magic bytes. The sealed gate identifies the format from the first
//   bytes, so an asset that was re-encoded to another format under a
//   .png name (a chat app once did exactly that to this project) must
//   fail loudly here instead of silently at grading.
// - The copy is verified afterwards: the written file's byte length
//   must equal the asset's, or the run fails rather than pass a
//   truncated write.
// - The copy is also verified by content: the SHA-256 of the written
//   file must equal the asset's, so a same-length corruption fails
//   too, not only a truncated write.

import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
} from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const assetPath = fileURLToPath(new URL("./entry.png", import.meta.url));
const targetPath = join(outputDir, "entry.png");

if (!existsSync(assetPath)) {
  console.error(`error: entry.png not found next to main.ts (${assetPath})`);
  process.exit(1);
}

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const head = readFileSync(assetPath).subarray(0, PNG_MAGIC.length);
if (!PNG_MAGIC.every((b, i) => head[i] === b)) {
  console.error(
    "error: entry.png does not start with the PNG magic bytes; " +
      "refusing to pass a non-PNG asset to the grader",
  );
  process.exit(1);
}

try {
  mkdirSync(outputDir, { recursive: true });
  copyFileSync(assetPath, targetPath);
} catch (err) {
  console.error(`error: could not write ${targetPath}: ${err.message}`);
  process.exit(1);
}

const assetBytes = statSync(assetPath).size;
const writtenBytes = statSync(targetPath).size;
if (writtenBytes !== assetBytes) {
  console.error(
    `error: copy verification failed: wrote ${writtenBytes} bytes, ` +
      `asset is ${assetBytes} bytes`,
  );
  process.exit(1);
}

const sha256 = (path) =>
  createHash("sha256").update(readFileSync(path)).digest("hex");
if (sha256(targetPath) !== sha256(assetPath)) {
  console.error(
    "error: copy verification failed: SHA-256 of the written file " +
      "differs from the asset",
  );
  process.exit(1);
}
