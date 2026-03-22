/**
 * Vitest smoke tests — portable, fast (<1s), no browser needed.
 * Adapted from tests/verification/smoke-test.cjs.
 */
import { describe, it, expect } from 'vitest';
import { existsSync, statSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLAYER = join(__dirname, '../../build/player');
const read = (rel) => readFileSync(join(PLAYER, rel), 'utf8');

// ─── 1. Build artefacts ───────────────────────────────────────────────────────

describe('Build artefacts', () => {
  const files = [
    'lottie.js',
    'lottie.min.js',
    'lottie_svg.js',
    'lottie_svg.min.js',
    'lottie_canvas.js',
    'lottie_canvas.min.js',
    'lottie_html.js',
    'lottie_html.min.js',
    'lottie_light.js',
    'lottie_light.min.js',
    'lottie_light_canvas.js',
    'lottie_light_canvas.min.js',
    'lottie_light_html.js',
    'lottie_light_html.min.js',
    'lottie_worker.js',
    'lottie_worker.min.js',
    'esm/lottie.min.js',
    'esm/lottie_svg.min.js',
    'esm/lottie_canvas.min.js',
    'esm/lottie_html.min.js',
    'cjs/lottie.min.js',
    'cjs/lottie_svg.min.js',
    'cjs/lottie_canvas.min.js',
    'cjs/lottie_html.min.js',
  ];

  it.each(files)('%s exists', (file) => {
    expect(existsSync(join(PLAYER, file))).toBe(true);
  });
});

// ─── 2. Bundle sizes ──────────────────────────────────────────────────────────

describe('Bundle sizes', () => {
  const bounds = [
    ['lottie.js',            400,  900],
    ['lottie.min.js',        150,  450],
    ['lottie_light.js',      200,  600],
    ['lottie_light.min.js',  100,  300],
    ['lottie_svg.js',        300,  850],
    ['lottie_svg.min.js',    100,  350],
    ['lottie_canvas.js',     200,  900],
    ['lottie_canvas.min.js', 100,  350],
  ];

  it.each(bounds)('%s is between %d and %d KB', (file, minKB, maxKB) => {
    const kb = Math.round(statSync(join(PLAYER, file)).size / 1024);
    expect(kb, `got ${kb} KB`).toBeGreaterThanOrEqual(minKB);
    expect(kb, `got ${kb} KB`).toBeLessThanOrEqual(maxKB);
  });
});

// ─── 3. Version string ────────────────────────────────────────────────────────

describe('Version string', () => {
  const pkg = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf8'));
  const v = pkg.version;

  it.each(['lottie.js', 'lottie.min.js', 'esm/lottie.min.js'])(
    '%s contains version string',
    (file) => {
      expect(read(file)).toContain(v);
    },
  );
});

// ─── 4. Public API surface ────────────────────────────────────────────────────

describe('Public API surface (lottie.js)', () => {
  const src = read('lottie.js');

  const symbols = [
    'loadAnimation', 'play', 'pause', 'stop', 'destroy',
    'setSpeed', 'setDirection', 'setQuality', 'resize',
    'searchAnimations', 'registerAnimation', 'goToAndStop',
    'installPlugin', 'inBrowser',
  ];

  it.each(symbols)('exports %s', (sym) => {
    expect(src).toContain(sym);
  });
});

// ─── 5. Build guards ──────────────────────────────────────────────────────────

describe('Build guards (lottie.min.js)', () => {
  const src = read('lottie.min.js');

  it('has navigator guard', () => {
    expect(src).toContain('typeof navigator');
  });

  it('has document guard', () => {
    expect(src).toContain('typeof document');
  });
});

// ─── 6. Worker builds ─────────────────────────────────────────────────────────

describe('Worker builds', () => {
  it.each(['lottie_worker.js', 'lottie_worker.min.js'])('%s has onmessage', (file) => {
    expect(read(file)).toContain('onmessage');
  });
});
