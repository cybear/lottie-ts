#!/usr/bin/env node
/**
 * puppeteer-test.cjs  (CommonJS, runs with plain `node`)
 *
 * Functional + visual regression tests using Puppeteer.
 *
 * Usage:
 *   node tests/verification/puppeteer-test.cjs            # compare mode (default)
 *   node tests/verification/puppeteer-test.cjs --capture  # capture new baselines
 *   node tests/verification/puppeteer-test.cjs --debug    # verbose browser console
 *
 * Exits 0 on success, 1 on failure.
 */

'use strict';

const puppeteer    = require('puppeteer');
const express      = require('express');
const fs           = require('fs');
const path         = require('path');

const ROOT         = path.resolve(__dirname, '../..');
const SCREENSHOTS  = path.join(__dirname, 'screenshots');
const BASELINE_DIR = path.join(SCREENSHOTS, 'baseline');
const PLAYER_DIR   = path.join(ROOT, 'build/player');
const CAPTURE_MODE = process.argv.includes('--capture');
const DEBUG        = process.argv.includes('--debug');

// ─── helpers ────────────────────────────────────────────────────────────────

let passed   = 0;
let failed   = 0;
const failures = [];

function pass(label) {
  process.stdout.write(`  \u2705  ${label}\n`);
  passed++;
}

function fail(label, reason) {
  process.stdout.write(`  \u274C  ${label}  \u2192  ${reason}\n`);
  failed++;
  failures.push({ label, reason });
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Timed out after ${ms} ms`)), ms);
    promise.then(v => { clearTimeout(t); resolve(v); }, e => { clearTimeout(t); reject(e); });
  });
}

// ─── HTTP server ─────────────────────────────────────────────────────────────

function startServer() {
  const app = express();
  app.use(express.static(ROOT));
  return new Promise(resolve => {
    const srv = app.listen(0, '127.0.0.1', () => {
      resolve({ srv, port: srv.address().port });
    });
  });
}

// ─── page factory ────────────────────────────────────────────────────────────

async function newPage(browser, baseUrl) {
  const page = await browser.newPage();
  if (DEBUG) {
    page.on('console', msg => process.stdout.write(`  [browser:${msg.type()}] ${msg.text()}\n`));
    page.on('pageerror', err => process.stderr.write(`  [pageerror] ${err.message}\n`));
  }
  await page.goto(`${baseUrl}/tests/verification/html/test-harness.html`, {
    waitUntil: 'load',
  });
  return page;
}

// ─── inject lottie + verify it loaded ────────────────────────────────────────

async function injectLottie(page, buildFile) {
  await page.addScriptTag({ path: path.join(PLAYER_DIR, buildFile) });
  const defined = await page.evaluate(() =>
    typeof lottie !== 'undefined' && typeof lottie.loadAnimation === 'function'
  );
  if (!defined) throw new Error(`lottie global not available after loading ${buildFile}`);
}

// ─── visual comparison ────────────────────────────────────────────────────────

function compareScreenshots(currentBuf, baselinePath, label) {
  const { PNG }    = require('pngjs');
  const pixelmatch = require('pixelmatch');

  if (!fs.existsSync(baselinePath)) {
    fail(`${label} baseline`, 'not found — run with --capture first');
    return;
  }
  const img1 = PNG.sync.read(fs.readFileSync(baselinePath));
  const img2 = PNG.sync.read(currentBuf);
  if (img1.width !== img2.width || img1.height !== img2.height) {
    fail(`${label} dims`, `${img1.width}x${img1.height} vs ${img2.width}x${img2.height}`);
    return;
  }
  const diff     = new PNG({ width: img1.width, height: img1.height });
  const mismatch = pixelmatch(img1.data, img2.data, diff.data, img1.width, img1.height, { threshold: 0.1 });
  if (mismatch > 0) {
    const diffPath = path.join(SCREENSHOTS, `diff-${label}.png`);
    fs.writeFileSync(diffPath, PNG.sync.write(diff));
    const pct = ((mismatch / (img1.width * img1.height)) * 100).toFixed(2);
    fail(`${label} visual`, `${mismatch}px differ (${pct}%) diff: ${diffPath}`);
  } else {
    pass(`${label} visual (pixel-perfect)`);
  }
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  fs.mkdirSync(BASELINE_DIR, { recursive: true });

  const { srv, port } = await startServer();
  const BASE = `http://127.0.0.1:${port}`;

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const { version: expectedVersion } = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'),
    );

    // ── Section 1: API functional tests (using full lottie.js for all renderers)

    console.log('\n\uD83D\uDD0C  Functional API tests\n');

    for (const renderer of ['svg', 'canvas', 'html']) {
      const tag  = renderer;
      const page = await newPage(browser, BASE);
      try {
        await injectLottie(page, 'lottie.js');

        // loadAnimation
        let result;
        try {
          result = await withTimeout(
            page.evaluate(rend => window.__testLoadAnimation(rend), renderer),
            10000,
          );
          pass(`${tag} loadAnimation resolves`);
        } catch (e) {
          fail(`${tag} loadAnimation`, e.message);
          continue;
        }

        result.version === expectedVersion
          ? pass(`${tag} version (${result.version})`)
          : fail(`${tag} version`, `expected ${expectedVersion}, got ${result.version}`);

        result.totalFrames === 30
          ? pass(`${tag} totalFrames (${result.totalFrames})`)
          : fail(`${tag} totalFrames`, `expected 30, got ${result.totalFrames}`);

        result.frameRate === 30
          ? pass(`${tag} frameRate (${result.frameRate})`)
          : fail(`${tag} frameRate`, `expected 30, got ${result.frameRate}`);

        // goToAndStop
        try {
          const gt = await withTimeout(
            page.evaluate(rend => window.__testGoToAndStop(rend, 15), renderer),
            10000,
          );
          const cf = Math.round(gt.currentFrame);
          cf === 15
            ? pass(`${tag} goToAndStop(15) -> frame ${cf}`)
            : fail(`${tag} goToAndStop`, `expected 15, got ${cf}`);
        } catch (e) {
          fail(`${tag} goToAndStop`, e.message);
        }

      } catch (e) {
        fail(`${tag} test`, e.message);
      } finally {
        try { await page.close(); } catch (_) { /* ignore */ }
      }
    }

    // ── Section 2: Variant builds each load successfully ─────────────────────

    console.log('\n\uD83D\uDDC2\uFE0F   Variant build smoke tests\n');

    const variantCases = [
      ['lottie_svg.js',    'svg'],
      ['lottie_canvas.js', 'canvas'],
      ['lottie_html.js',   'html'],
    ];

    for (const [buildFile, rendererName] of variantCases) {
      const page = await newPage(browser, BASE);
      try {
        await injectLottie(page, buildFile);
        await withTimeout(
          page.evaluate(rend => window.__testLoadAnimation(rend), rendererName),
          10000,
        );
        pass(`${buildFile} loadAnimation`);
      } catch (e) {
        fail(`${buildFile} loadAnimation`, e.message);
      } finally {
        try { await page.close(); } catch (_) { /* ignore */ }
      }
    }

    // ── Section 3: Visual regression ─────────────────────────────────────────

    console.log(`\n\uD83D\uDCF8  Visual regression (${CAPTURE_MODE ? 'CAPTURE' : 'COMPARE'} mode)\n`);

    const animFixtures = [
      { name: 'bodymovin', file: 'demo/bodymovin/data.json' },
      { name: 'adrock',    file: 'demo/adrock/data.json' },
      { name: 'gatin',     file: 'demo/gatin/data.json' },
      { name: 'happy2016', file: 'demo/happy2016/data.json' },
      { name: 'navidad',   file: 'demo/navidad/data.json' },
    ].filter(f => fs.existsSync(path.join(ROOT, f.file)));

    if (animFixtures.length === 0) {
      process.stdout.write('  No animation fixtures found, skipping visual tests\n');
    }

    for (const fixture of animFixtures) {
      for (const renderer of ['svg', 'canvas', 'html']) {
        const label = `${fixture.name}-${renderer}`;
        const page  = await newPage(browser, BASE);
        await page.setViewport({ width: 512, height: 512 });

        try {
          await injectLottie(page, 'lottie.js');

          const animData = JSON.parse(fs.readFileSync(path.join(ROOT, fixture.file), 'utf8'));

          await withTimeout(
            page.evaluate((data, rend) => {
              window.__TEST_ANIM__ = data;
              return window.__testLoadAnimation(rend);
            }, animData, renderer),
            15000,
          );

          await page.evaluate(() => { lottie.goToAndStop(0, true); });
          // Wait two animation frames + a safety pause for paint
          await page.evaluate(() =>
            new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
          );
          await new Promise(r => setTimeout(r, 150));

          const buf          = await page.screenshot({ type: 'png' });
          const baselinePath = path.join(BASELINE_DIR, `${label}.png`);

          if (CAPTURE_MODE) {
            fs.writeFileSync(baselinePath, buf);
            pass(`${label} baseline captured`);
          } else {
            compareScreenshots(buf, baselinePath, label);
          }

        } catch (e) {
          fail(`${label}`, e.message);
        } finally {
          try { await page.close(); } catch (_) { /* ignore */ }
        }
      }
    }

  } finally {
    await browser.close();
    srv.close();
  }

  // ── Summary ────────────────────────────────────────────────────────────────

  console.log('\n-------------------------------------------------');
  console.log(`  Passed: ${passed}   Failed: ${failed}`);

  if (failed > 0) {
    console.log('\nFailed checks:');
    for (const f of failures) {
      console.log(`  * ${f.label}: ${f.reason}`);
    }
    process.stdout.write('\n');
    process.exit(1);
  }

  if (CAPTURE_MODE) {
    console.log(`  Baselines saved to ${BASELINE_DIR}\n`);
  } else {
    console.log('  All Puppeteer tests passed\n');
  }

  process.exit(0);
}

main().catch(err => {
  console.error('\nUnexpected error:', err);
  process.exit(1);
});
