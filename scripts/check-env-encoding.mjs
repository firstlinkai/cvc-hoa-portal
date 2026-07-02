/**
 * Scans an env file for characters outside Latin-1 (e.g. an embedded BOM
 * U+FEFF) that break HTTP header ByteString conversion.
 * Usage: node scripts/check-env-encoding.mjs <file>
 */
import { readFileSync } from 'node:fs';

const file = process.argv[2] || '.env.vercel-check';
const raw = readFileSync(file, 'utf8');

let bad = 0;
for (const line of raw.split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)="?(.*?)"?$/);
  if (!m) continue;
  const [, key, value] = m;
  const issues = [];
  for (let i = 0; i < value.length; i++) {
    const code = value.codePointAt(i);
    if (code > 255) {
      issues.push(`index ${i}: U+${code.toString(16).toUpperCase()} (${code})`);
    }
  }
  if (issues.length) {
    bad++;
    console.log(`✘ ${key}: ${issues.join(', ')}`);
  } else {
    console.log(`✔ ${key}: clean (${value.length} chars)`);
  }
}
process.exit(bad === 0 ? 0 : 1);
