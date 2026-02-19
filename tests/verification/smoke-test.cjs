#!/usr/bin/env node
/**
 * smoke-test.cjs  (CommonJS, runs with plain `node`)
 *
 * Fast Node.js smoke test — no browser required.
 * Verifies:
 *   1. All expected build artefacts exist
 *   2. Bundle sizes are within expected ranges
 *   3. Version string matches package.json
 *   4. Key public API names are present in each bundle
 *   5. Navigator / document guards are present
 *   6. Worker builds contain `onmessage`
 *
 * Exits 0 on success, 1 on any failure.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT   = path.resolve(__dirname, '../..');
const PLAYER = path.join(ROOT, 'build/player');

// ─── helpers ────────────────────────────────────────────────────────────────

let passed   = 0;
let failed   = 0;
const failures = [];

function pass(label) {
  process.stdout.write(`  ✅  ${label}\n`);
  passed++;
}

function fail(label, reason) {
  process.stdout.write(`  ❌  ${label}  →  ${reason}\n`);
  failed++;
  failures.push({ label, reason });
}

function check(label, condition, reason) {
  condition ? pass(label) : fail(label, reason);
}

// ─── 1. expected build files ─────────────────────────────────────────────────

console.log('\n📦  Build artefacts\n');

const expectedFiles = [
  // UMD full
  'lottie.js',              'lottie.min.js',
  // UMD variants
  'lottie_svg.js',          'lottie_svg.min.js',
  'lottie_canvas.js',       'lottie_canvas.min.js',
  'lottie_html.js',         'lottie_html.min.js',
  'lottie_light.js',        'lottie_light.min.js',
  'lottie_light_canvas.js', 'lottie_light_canvas.min.js',
  'lottie_light_html.js',   'lottie_light_html.min.js',
  // Worker
  'lottie_worker.js',       'lottie_worker.min.js',
  // ESM
  'esm/lottie.min.js',      'esm/lottie_svg.min.js',
  'esm/lottie_canvas.min.js','esm/lottie_html.min.js',
  // CJS
  'cjs/lottie.min.js',      'cjs/lottie_svg.min.js',
  'cjs/lottie_canvas.min.js','cjs/lottie_html.min.js',
];

for (const rel of expectedFiles) {
  check(rel, fs.existsSync(path.join(PLAYER, rel)), 'file not found');
}

// ─── 2. bundle size bounds ────────────────────────────────────────────────────

console.log('\n📏  Bundle sizes\n');

// [path relative to PLAYER, minKB, maxKB]
const sizeBounds = [
  ['lottie.js',             400,  900],
  ['lottie.min.js',         150,  450],
  ['lottie_light.js',       200,  600],
  ['lottie_light.min.js',   100,  300],
  ['lottie_svg.js',         300,  700],
  ['lottie_svg.min.js',     100,  350],
  ['lottie_canvas.js',      200,  600],
  ['lottie_canvas.min.js',  100,  300],
];

for (const [rel, minKB, maxKB] of sizeBounds) {
  const abs = path.join(PLAYER, rel);
  if (!fs.existsSync(abs)) {
    fail(`${rel} size`, 'file missing');
    continue;
  }
  const kb = Math.round(fs.statSync(abs).size / 1024);
  check(
    `${rel} size (${kb} KB)`,
    kb >= minKB && kb <= maxKB,
    `expected ${minKB}–${maxKB} KB, got ${kb} KB`,
  );
}

// ─── 3. version string ────────────────────────────────────────────────────────

console.log('\n🔖  Version string\n');

const { version: expectedVersion } = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'),
);

for (const rel of ['lottie.js', 'lottie.min.js', 'esm/lottie.min.js']) {
  const abs = path.join(PLAYER, rel);
  if (!fs.existsSync(abs)) { fail(`version in ${rel}`, 'file missing'); continue; }
  const content = fs.readFileSync(abs, 'utf8');
  check(
    `version "${expectedVersion}" in ${rel}`,
    content.includes(expectedVersion),
    `string "${expectedVersion}" not found`,
  );
}

// ─── 4. public API surface ────────────────────────────────────────────────────

console.log('\n🔌  Public API surface (lottie.js)\n');

const mainBundlePath = path.join(PLAYER, 'lottie.js');
const bundleText     = fs.existsSync(mainBundlePath)
  ? fs.readFileSync(mainBundlePath, 'utf8')
  : '';

const expectedSymbols = [
  'loadAnimation', 'play', 'pause', 'stop', 'destroy',
  'setSpeed', 'setDirection', 'setQuality', 'resize',
  'searchAnimations', 'registerAnimation', 'goToAndStop',
  'installPlugin', 'inBrowser',
];

for (const sym of expectedSymbols) {
  check(`lottie.${sym}`, bundleText.includes(sym), 'symbol not found in bundle');
}

// ─── 5. navigator / document guards ──────────────────────────────────────────

console.log('\n🛡️   Build guards\n');

const minBundlePath = path.join(PLAYER, 'lottie.min.js');
if (fs.existsSync(minBundlePath)) {
  const text = fs.readFileSync(minBundlePath, 'utf8');
  check(
    'navigator guard in lottie.min.js',
    text.includes('typeof navigator'),
    'navigator guard not found',
  );
  check(
    'document guard in lottie.min.js',
    text.includes('typeof document'),
    'document guard not found',
  );
}

// ─── 6. worker builds ─────────────────────────────────────────────────────────

console.log('\n⚙️   Worker builds\n');

for (const rel of ['lottie_worker.js', 'lottie_worker.min.js']) {
  const abs = path.join(PLAYER, rel);
  if (!fs.existsSync(abs)) { fail(rel, 'file missing'); continue; }
  const text = fs.readFileSync(abs, 'utf8');
  check(`${rel} contains onmessage`, text.includes('onmessage'), 'onmessage not found');
}

// ─── summary ──────────────────────────────────────────────────────────────────

console.log('\n─────────────────────────────────────────────────');
console.log(`  Passed: ${passed}   Failed: ${failed}`);

if (failed > 0) {
  console.log('\nFailed checks:');
  for (const f of failures) {
    console.log(`  • ${f.label}: ${f.reason}`);
  }
  process.stdout.write('\n');
  process.exit(1);
}

console.log('  All smoke checks passed ✅\n');
process.exit(0);
