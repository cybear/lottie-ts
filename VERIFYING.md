# VERIFYING — How to confirm the code works at every step

Last updated: 2026-02-19

This document describes **concrete, runnable commands** for verifying the library
still works correctly after each change described in PLAN.md.

The checks are split into tiers by speed. Always run Tier 1 after any change.
Run Tier 2 before merging a feature branch. Run Tier 3 before a release.

---

## Tier 1 — Fast checks (< 30 s) — run after every commit

### 1a. Build succeeds

```bash
npm run build
```

Expected: exits 0.  
Produces `build/player/lottie.js`, `build/player/lottie.min.js`, and all variant
files (`lottie_svg`, `lottie_canvas`, `lottie_html`, `lottie_light*`, `lottie_worker`).

Quick sanity — confirm the lottie global is present in the UMD build:

```bash
grep -c "var lottie" build/player/lottie.js
# expected: 1
```

And confirm the version string was injected:

```bash
node -e "const l = require('./build/player/lottie.js'); console.log(l.version)"
# expected: 5.13.0  (or whatever the current package.json version is)
```

### 1b. TypeScript type-check (after Phase 2)

```bash
npm run typecheck
# maps to: tsc --noEmit
```

Expected: exits 0 with no errors.

### 1c. Lint

```bash
npm run lint
```

Expected: exits 0.

---

## Tier 2 — Functional tests (1–2 min) — run before merging

### 2a. Automated functional test suite

```bash
npm test
```

Runs `tests/verification/smoke-test.cjs` — pure Node.js, no browser required.
Checks build artefacts, file sizes, version strings, API surface, guards, and workers.  
After Phase 2.3 (Vitest): `npm test` will run Vitest unit tests instead.

Expected: all tests pass, exit 0.

The functional tests verify:

- `loadAnimation()` returns an `AnimationItem` with the expected shape
- `play()`, `pause()`, `stop()`, `destroy()` do not throw
- `goToAndStop(frame, true)` moves `currentFrame` to the expected value
- All named renderer types (`svg`, `canvas`, `html`) can be instantiated
- `lottie.version` matches `package.json`

### 2b. Module format verification

Verify that all three output formats can actually be consumed:

**UMD (browser global)**

```bash
node -e "
const lottie = require('./build/player/lottie.js');
if (typeof lottie.loadAnimation !== 'function') throw new Error('API broken');
console.log('UMD OK');
"
```

**CJS**

```bash
node -e "
const lottie = require('./build/player/cjs/lottie.min.js');
if (typeof lottie.loadAnimation !== 'function') throw new Error('API broken');
console.log('CJS OK');
"
```

**ESM** (requires Node 12+)

```bash
node --input-type=module -e "
import lottie from './build/player/esm/lottie.min.js';
if (typeof lottie.loadAnimation !== 'function') throw new Error('API broken');
console.log('ESM OK');
"
```

### 2c. Type declarations are valid (after Phase 2+)

```bash
npx tsd
# or
npx attw --pack
```

`tsd` checks that the shipped `.d.ts` files match the documented API.  
`are-the-types-wrong` (`attw`) checks that the `exports` field in `package.json`
resolves types correctly in all module resolution modes (Node16, Bundler, etc.).

---

## Tier 3 — Visual regression tests (5–15 min) — run before release

### 3a. Capture reference screenshots (run once to establish baseline)

```bash
npm run test:e2e:capture
```

Launches Puppeteer, loads `bodymovin` and `adrock` demo animations in all three
renderers (svg, canvas, html), snaps frame 0, and writes PNG files to
`tests/verification/screenshots/baseline/`. Commit these files — they are the
reference images that must not change.

Baseline is already committed on `main` (captured 2026-02-19).

### 3b. Compare against reference (run to detect regressions)

```bash
npm run test:e2e
```

Also runs the full functional API test suite (loadAnimation, version, frameRate,
goToAndStop) in a real Chromium browser via Puppeteer.  

Expected:
- Exit 0 — all 24 checks pass (15 API + 3 variant-build smoke + 6 visual)
- Exit 1 + diff PNG saved to `tests/verification/screenshots/diff-<label>.png`
  if any pixel differs beyond the 0.1 threshold

### 3c. Manual browser smoke test

1. `npm run build`
2. Open `demo/bodymovin/index.html` in a browser (use a local server, e.g.
   `npx serve .`)
3. Open `demo/adrock/index.html`
4. Open `player/index.html` (the internal test player)
5. Confirm animations play without console errors

For convenience:

```bash
npx serve . -p 8080
# then open http://localhost:8080/demo/bodymovin/index.html
```

---

## Regression checklist — what to verify after each PLAN.md step

| PLAN.md step | Minimum verification |
|---|---|
| Step 0.1–0.3 | `npm test` (53 checks) + `npm run test:e2e` (24 checks) — **DONE ✅** |
| Step 1.1 (remove Bower) | `npm test` |
| Step 1.2 (gitignore build) | `git status` shows no surprise changes; Tier 1a |
| Step 1.3 (delete legacy build) | Tier 1a + Tier 2b |
| Step 1.4 (upgrade Rollup) | Tier 1a + Tier 2b + diff UMD bundle size |
| Step 2.1 (add TS) | `npx tsc --noEmit` exits 0; Tier 1a |
| Step 2.2 (swap Babel → TS) | Tier 1a + Tier 2b + Tier 3c |
| Step 2.3 (add Vitest) | `npm test` passes |
| Each Step 3.x (migrate a module) | Tier 1a + Tier 1b + Tier 2a + Tier 3c |
| Step 3.4 (replace vendored libs) | Tier 1a + Tier 2a + Tier 3b (diff must be clean) |
| Step 4.1 (rename player→src) | Full Tier 1 + Tier 2 + Tier 3b |
| Step 4.2 (delete committed artefacts) | CI green; `npm pack` manifest correct |
| Step 4.3 (exports field) | `npx publint` + `npx attw --pack` |
| Step 5.1–5.4 (quality gates) | `npm run lint`, `npm run typecheck`, `npm test` |
| Step 6.x (test coverage) | `npm run test -- --coverage`; coverage ≥ targets |

---

## Checking bundle size doesn't regress

After any build change, compare the output sizes:

```bash
# before change
wc -c build/player/lottie.min.js
# -> record the number

# after change
wc -c build/player/lottie.min.js
# -> compare; a significant increase is a red flag
```

Or use `bundlesize` / `size-limit` for an automated gate (optional, Phase 5+ enhancement).

---

## Useful one-liners

```bash
# Count total source files being processed
find player/js -name "*.js" | wc -l

# Count remaining var declarations (track decline across Phase 3)
grep -rn "\bvar " player/js --include="*.js" | wc -l

# After Phase 2+: same metric for src/
grep -rn "\bvar " src --include="*.ts" | wc -l

# Confirm no circular dependency warnings from Rollup
npm run build 2>&1 | grep -i "circular"

# Confirm declaration files are generated
ls build/player/*.d.ts
# expected: lottie.d.ts, lottie_svg.d.ts, etc.
```

---

## What a "green" migration looks like

At any point during the migration, the codebase is in a valid state if:

1. `npm run build` exits 0
2. `npm test` exits 0
3. The visual test comparison shows no regressions against the committed baseline
4. `npm run typecheck` exits 0 (after Phase 2.2)
5. `npm run lint` exits 0

If all five are true, the migration step is complete and safe to merge.
