#!/usr/bin/env node
/**
 * puppeteer-test.js
 *
 * Functional + visual regression tests using Puppeteer.
 *
 * Usage:
 *   node tests/verification/puppeteer-test.js            # compare mode (default)
 *   node tests/verification/puppeteer-test.js --capture  # capture new baselines
 *
 * Exits 0 on success, 1 on failure.
 *
 * Dependencies (already in devDependencies):
 *   puppeteer, pixelmatch, pngjs, express
 */

import puppeteer from 'puppeteer';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const BASELINE_DIR = path.join(SCREENSHOTS_DIR, 'baseline');

const CAPTURE_MODE = process.argv.includes('--capture');

// ─── helpers ────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
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

async function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timeout after ${ms} ms`)), ms);
  });
  try {
    const result = await Promise.race([promise, timeout]);
    clearTimeout(timer);
    return result;
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

// ─── HTTP server ─────────────────────────────────────────────────────────────

function startServer() {
  const app = express();
  app.use(express.static(ROOT));
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, port });
    });
  });
}

// ─── screenshot comparison ────────────────────────────────────────────────────

/** See puppeteer-test.cjs — Linux CI vs macOS local Chromium font/AA noise. */
function allowedVisualMismatchPixels(width, height) {
  const raw = process.env.VISUAL_MAX_MISMATCH_PIXELS;
  if (raw !== undefined && raw !== '') {
    const n = Number.parseInt(raw, 10);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  const total = width * height;
  return Math.max(64, Math.ceil(total * 0.00025));
}

async function compareScreenshots(current, baselinePath, label) {
  // Lazy-load PNG+pixelmatch only when needed so the smoke test
  // can skip this if no screenshots exist yet.
  const { PNG } = await import('pngjs');
  const { default: pixelmatch } = await import('pixelmatch');

  if (!fs.existsSync(baselinePath)) {
    fail(`${label} baseline`, `baseline not found at ${baselinePath} — run with --capture first`);
    return;
  }

  const img1 = PNG.sync.read(fs.readFileSync(baselinePath));
  const img2 = PNG.sync.read(current);

  if (img1.width !== img2.width || img1.height !== img2.height) {
    fail(`${label} dimensions`, `baseline ${img1.width}×${img1.height} vs current ${img2.width}×${img2.height}`);
    return;
  }

  const diff = new PNG({ width: img1.width, height: img1.height });
  const mismatch = pixelmatch(img1.data, img2.data, diff.data, img1.width, img1.height, { threshold: 0.1 });
  const allowed = allowedVisualMismatchPixels(img1.width, img1.height);
  const totalPixels = img1.width * img1.height;
  const pct = ((mismatch / totalPixels) * 100).toFixed(2);

  if (mismatch > allowed) {
    const diffPath = path.join(SCREENSHOTS_DIR, `diff-${label}.png`);
    fs.writeFileSync(diffPath, PNG.sync.write(diff));
    fail(`${label} visual`, `${mismatch} pixels differ (${pct}%), allowed ${allowed} — diff saved to ${diffPath}`);
  } else if (mismatch > 0) {
    pass(`${label} visual (${mismatch}px differ, ≤${allowed} allowed for cross-platform Chromium)`);
  } else {
    pass(`${label} visual (pixel-perfect)`);
  }
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  fs.mkdirSync(BASELINE_DIR, { recursive: true });

  const { server, port } = await startServer();
  const BASE_URL = `http://127.0.0.1:${port}`;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    // ── Test matrix ──────────────────────────────────────────────────────────
    // [renderer, lottie build file relative to build/player/]
    const cases = [
      ['svg',    'lottie_svg.js'],
      ['canvas', 'lottie_canvas.js'],
      ['html',   'lottie_html.js'],
    ];

    // ── Section: API functional tests ────────────────────────────────────────

    console.log('\n🔌  Functional API tests\n');

    for (const [renderer, buildFile] of cases) {
      const label = `${renderer}`;
      const page = await browser.newPage();

      // Suppress noisy console output from the page
      // page.on('console', msg => process.stdout.write(`  [browser] ${msg.text()}\n`));
      page.on('pageerror', err => fail(`${label} page error`, err.message));

      try {
        await page.goto(`${BASE_URL}/tests/verification/html/test-harness.html`);
        await page.addScriptTag({ path: path.join(ROOT, 'build/player', buildFile) });

        // Test loadAnimation + DOMLoaded
        let result;
        try {
          result = await withTimeout(
            page.evaluate((rend) => window.__testLoadAnimation(rend), renderer),
            8000,
            `${label} loadAnimation`
          );
          pass(`${label} loadAnimation resolves`);
        } catch (e) {
          fail(`${label} loadAnimation`, e.message);
          await page.close();
          continue;
        }

        // Version in runtime matches package.json
        const { version: expectedVersion } = JSON.parse(
          fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')
        );
        result.version === expectedVersion
          ? pass(`${label} version (${result.version})`)
          : fail(`${label} version`, `expected ${expectedVersion}, got ${result.version}`);

        // Frame count is sane (test animation has op=30, ip=0 → 30 frames)
        result.totalFrames === 30
          ? pass(`${label} totalFrames (${result.totalFrames})`)
          : fail(`${label} totalFrames`, `expected 30, got ${result.totalFrames}`);

        // frameRate is sane
        result.frameRate === 30
          ? pass(`${label} frameRate (${result.frameRate})`)
          : fail(`${label} frameRate`, `expected 30, got ${result.frameRate}`);

        // goToAndStop works
        try {
          const gtResult = await withTimeout(
            page.evaluate((rend) => window.__testGoToAndStop(rend, 15), renderer),
            8000,
            `${label} goToAndStop`
          );
          const cf = Math.round(gtResult.currentFrame);
          cf === 15
            ? pass(`${label} goToAndStop(15) → currentFrame = ${cf}`)
            : fail(`${label} goToAndStop`, `expected currentFrame=15, got ${cf}`);
        } catch (e) {
          fail(`${label} goToAndStop`, e.message);
        }

      } catch (e) {
        fail(`${label} test`, e.message);
      } finally {
        await page.close();
      }
    }

    // ── Section: Visual regression ────────────────────────────────────────────

    console.log(`\n📸  Visual regression (${CAPTURE_MODE ? 'CAPTURE mode' : 'COMPARE mode'})\n`);

    // Visual test animations — use the bundled fixtures
    const animFixtures = [
      { name: 'bodymovin', path: 'demo/bodymovin/data.json' },
      { name: 'adrock',    path: 'demo/adrock/data.json' },
    ].filter(f => fs.existsSync(path.join(ROOT, f.path)));

    for (const fixture of animFixtures) {
      for (const [renderer] of cases) {
        const label = `${fixture.name}-${renderer}`;
        const page = await browser.newPage();
        await page.setViewport({ width: 500, height: 500 });

        try {
          await page.goto(`${BASE_URL}/tests/verification/html/test-harness.html`);
          await page.addScriptTag({ path: path.join(ROOT, 'build/player/lottie.js') });

          // Replace test anim with fixture data
          const animData = JSON.parse(fs.readFileSync(path.join(ROOT, fixture.path), 'utf8'));
          await page.evaluate((data, rend) => {
            window.__TEST_ANIM__ = data;
            return window.__testLoadAnimation(rend);
          }, animData, renderer);

          // Go to frame 0 for a deterministic screenshot
          await page.evaluate((rend) => {
            lottie.goToAndStop(0, true);
          }, renderer);

          // Give the renderer one animation frame to paint
          await page.evaluate(() => new Promise(r => requestAnimationFrame(r)));

          const shotBuffer = await page.screenshot({ type: 'png' });
          const baselinePath = path.join(BASELINE_DIR, `${label}.png`);

          if (CAPTURE_MODE) {
            fs.writeFileSync(baselinePath, shotBuffer);
            pass(`${label} baseline captured`);
          } else {
            await compareScreenshots(Buffer.from(shotBuffer), baselinePath, label);
          }

        } catch (e) {
          fail(`${label} visual`, e.message);
        } finally {
          await page.close();
        }
      }
    }

  } finally {
    await browser.close();
    server.close();
  }

  // ── Summary ────────────────────────────────────────────────────────────────

  console.log('\n─────────────────────────────────────────────────');
  console.log(`  Passed: ${passed}   Failed: ${failed}`);

  if (failed > 0) {
    console.log('\nFailed checks:');
    for (const f of failures) {
      console.log(`  • ${f.label}: ${f.reason}`);
    }
    console.log('');
    process.exit(1);
  }

  if (CAPTURE_MODE) {
    console.log(`  Baselines saved to ${BASELINE_DIR} ✅\n`);
  } else {
    console.log('  All Puppeteer tests passed ✅\n');
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('\n💥 Unexpected error:', err);
  process.exit(1);
});
