# PLAN — Step-by-step Migration to Target Architecture

Last updated: 2026-02-20

Read OLD.md and NEW.md first for context.

Each step is designed to be small and independently verifiable (see VERIFYING.md).
Finish one step, verify it, commit, then move to the next.

---

## Guiding principles

- **Never break the build** — after every step, `npm run build` must still produce
  working UMD/ESM/CJS output
- **Incremental** — prefer many small commits over one giant rewrite
- **Test before migrating** — establish the verification baseline *before* changing
  anything, so regressions are obvious
- **Preserve public API** — external consumers must not notice the migration

---

## Phase 0 — Establish baseline (prerequisite for everything else)

### Step 0.1 — Make the existing test suite runnable and record baseline

- Confirm `npm run build` succeeds (Rollup + worker build)
- Run `tests/verification/visual-tests.js` and `tests/verification/functional-tests.js` manually; ensure they pass
- Commit any missing fixture or script fixes so the test suite is green on `main`
- Document the baseline in `VERIFYING.md` (already done alongside this plan)

### Step 0.2 — Add `npm test` script that runs the functional tests

- Wire `tests/verification/functional-tests.js` to `"test": "node tests/verification/functional-tests.js"` in `package.json`
- Confirm `npm test` exits 0
- This gives a quick automated smoke test that every subsequent step can rely on

### Step 0.3 — Snapshot reference screenshots for visual regression

- Run the Puppeteer visual test once and commit the reference screenshots to
  `tests/verification/screenshots/` (or a dedicated `e2e/snapshots/` directory)
- Document the compare command in `VERIFYING.md`

---

## Phase 1 — Housekeeping (no logic changes)

### Step 1.1 — Delete Bower

- Remove `bower.json`
- Search for any remaining `bower_components` references; remove them
- Verify: `npm run build` and `npm test` still pass

### Step 1.2 — Gitignore the build output

- Add `build/player/`, `dist/`, and `build/extension/` to `.gitignore`
  (leave the current committed files; they will be cleaned up separately)
- Do **not** delete the committed artefacts yet — keep them until a CI publish
  step exists so CDN consumers are not broken
- Verify: `git status` shows no new untracked important files

### Step 1.3 — Delete the stale legacy build system

- Delete `tasks/build.js` (the old file-concatenation build — hardcoded at v5.8.1)
- Delete `tasks/watch.js` if it only supported the legacy build
- Remove `uglify-js` from `devDependencies` if no longer needed
- Verify: `npm run build` still succeeds (it uses Rollup, not `tasks/build.js`)

### Step 1.4 — Replace deprecated Rollup packages

- Replace `rollup-plugin-terser` (deprecated) with `@rollup/plugin-terser`
- Upgrade Rollup from 2.x to 4.x (check the changelog for breaking changes;
  mainly `output.file` vs `output.dir` semantics and plugin API changes)
- Upgrade `@rollup/plugin-babel` and `@rollup/plugin-node-resolve` to their
  current versions
- Verify: `npm run build` produces identical output (diff the built files)

---

## Phase 2 — Replace Babel with TypeScript compilation (allow-JS bridge)

The goal of this phase is to introduce TypeScript tooling without converting
any source file yet, so the risk is minimal.

### Step 2.1 — Install TypeScript toolchain

```
npm install -D typescript @rollup/plugin-typescript tslib
```

- Add `tsconfig.json` with `"allowJs": true`, `"checkJs": false`, `"strict": false`
  — this makes TypeScript aware of the JS source without enforcing any rules yet
- Add `tsconfig.build.json` extending `tsconfig.json` with emit settings
- Verify: `npx tsc --noEmit` runs without errors

### Step 2.2 — Swap Babel for TypeScript in the Rollup config

- Replace `@rollup/plugin-babel` with `@rollup/plugin-typescript` in
  `rollup.config.js`
- Keep the same output targets (ES2020 or similar to `@babel/preset-env`'s
  current output)
- Remove `@babel/core`, `@babel/preset-env`, `@babel/plugin-transform-runtime`,
  and `@rollup/plugin-babel` from `devDependencies`
- Remove `.babelrc.json`
- Verify: `npm run build` → diff the bundled output; functional tests pass

### Step 2.3 — Add Vitest

```
npm install -D vitest @vitest/coverage-v8 jsdom
```

- Create `vitest.config.ts` with `environment: 'jsdom'`
- Move / adapt the existing `functional-tests.js` assertions to be Vitest-native
  (`describe`/`it`/`expect`)
- Wire: `"test": "vitest run"` in `package.json`
- Verify: `npm test` runs and passes

---

## Phase 3 — Migrate source to TypeScript, module by module

Each sub-step migrates one leaf module (no dependents) at a time.
The order is: utilities first, then elements, then renderers, then the public API.

### Step 3.1 — Enable stricter TS config incrementally

- Turn on `"strict": true` in `tsconfig.json`
- Fix type errors one file at a time; commit each file fix separately
- This step is iterative and will span many commits — that is intentional

### Step 3.2 — Migrate `player/js/utils/helpers/**` → `src/utils/helpers/`

- Copy each file from `player/js/utils/helpers/` to `src/utils/helpers/`
- Rename `.js` → `.ts`; add explicit types; fix any TypeScript errors
- Update imports in files that depend on these helpers to point to `src/`
- Delete the original files from `player/js/`
- Verify: `npm run build`, `npm test`

### Step 3.3 — Migrate `player/js/utils/*.js` → `src/utils/`

- Same process as 3.2
- `common.js` is the most depended-upon file; migrate it first and update all
  importers
- Verify after each file

### Step 3.4 — Replace vendored third-party files

- `howler.js` → `npm install howler` + `npm install -D @types/howler`; delete
  `player/js/3rd_party/howler.js`
- `seedrandom.js` → `npm install seedrandom` + `npm install -D @types/seedrandom`;
  delete `player/js/3rd_party/seedrandom.js`
- `BezierEaser.js` → extract the used functions into `src/utils/BezierEaser.ts`;
  delete the original
- `transformation-matrix.js` → evaluate the `transformation-matrix` NPM package;
  if the API matches, replace; otherwise extract the used functions into
  `src/utils/Matrix.ts`
- Verify: `npm run build`, `npm test`

### Step 3.5 — Migrate `player/js/animation/**` → `src/animation/`

- `AnimationItem.js` → `AnimationItem.ts` with typed properties and method signatures
- `AnimationManager.js` → `AnimationManager.ts`; replace IIFE with plain module exports
- Verify after each file

### Step 3.6 — Migrate `player/js/elements/**` → `src/elements/`

- Start with leaf elements (NullElement, SolidElement, ImageElement)
- Work up to CompElement (most dependencies)
- Verify after each file

### Step 3.7 — Migrate `player/js/renderers/**` → `src/renderers/`

- Start with `renderersManager.js` then `BaseRenderer.js` then the concrete
  renderers
- Define a `Renderer` interface in `src/renderers/types.ts`
- Verify after each file

### Step 3.8 — Migrate `player/js/effects/**` → `src/effects/`

- Same pattern

### Step 3.9 — Migrate `player/js/utils/expressions/**` → `src/expressions/`

- Expressions are the most complex part; migrate last within utils
- Write unit tests for expression evaluation before migrating

### Step 3.10 — Migrate entry points

- `player/js/module.js` → `src/module.ts`
- `player/js/modules/*.js` → `src/entries/*.ts`
- Remove the standalone-mode string-literal trick (`'__[STANDALONE]__'`); replace
  with a proper separate entry point or a build-time constant via Rollup's
  `@rollup/plugin-replace`
- Verify: all build variants (svg, canvas, html, light, worker) build correctly

---

## Phase 4 — Clean up the file layout

### Step 4.1 — Rename `player/js/` entry to `src/` in Rollup config

- Once all files have been migrated (Phase 3 complete), update `rollup.config.ts`
  to point at `src/` instead of `player/js/`
- Delete the now-empty `player/` directory
- Verify: `npm run build`, `npm test`

### Step 4.2 — Delete committed build artefacts

- Set up a CI job (GitHub Actions) that runs `npm run build` and publishes to NPM
  on tag
- Once CI is confirmed working, delete `build/player/`, `build/extension/` from
  the repo
- Remove those paths from `.gitignore` (they no longer exist)
- Verify: CI pipeline is green; `npm pack` produces the expected files

### Step 4.3 — Update `package.json` exports field

- Add `exports`, `module`, `main`, `types` fields pointing at `dist/`
- Verify with `npx publint` and `npx are-the-types-wrong`

---

## Phase 5 — Tighten quality gates

### Step 5.1 — Re-enable all ESLint rules

- Switch to `@typescript-eslint/recommended`
- Turn `no-var` → `error`, `prefer-const` → `error`, etc.
- Fix any remaining lint errors
- Verify: `npm run lint` exits 0

### Step 5.2 — Add Prettier

```
npm install -D prettier eslint-config-prettier
```

- Add `.prettierrc.json`
- Run `npx prettier --write src/`
- Verify: `npx prettier --check src/` exits 0

### Step 5.3 — Add pre-commit hooks

```
npm install -D husky lint-staged
npx husky init
```

- Configure `lint-staged` to run `eslint --fix` and `prettier --write` on staged
  `.ts` files
- Verify: commit a file with a lint error; confirm the hook blocks it

### Step 5.4 — Enforce `prepublishOnly`

- Add `"prepublishOnly": "npm run lint && npm run typecheck && npm run build && npm test"`
- Verify: `npm publish --dry-run` runs the full pipeline

---

## Phase 6 — Expand test coverage

### Step 6.1 — Add unit tests for animation math utilities

- `bez.test.ts`, `TransformProperty.test.ts`, `PropertyFactory.test.ts`
- Target: ≥ 80% coverage on `src/utils/`

### Step 6.2 — Add unit tests for expression evaluation

- Mock the expression execution environment
- Test that common Lottie expression patterns produce expected values

### Step 6.3 — Expand e2e visual tests

- Add Puppeteer tests for all demo animations
- Automate comparison in CI; fail the build on visual regression

---

## Phase 7 — Vendor dependency audit & replacement

**Goal:** replace or rationalise the four files vendored under `src/3rd_party/`
with properly-versioned npm packages where possible, and document why the
remaining files must stay vendored.

### Inventory & decision (already researched)

| File | Origin | npm package | Decision |
|---|---|---|---|
| `transformation-matrix.js` | Epistemex v2.0 | `transformation-matrix` (v3 — breaking API) | **Keep vendored** — file was intentionally modified to import `createTypedArray` from lottie's own typed-array pool; v3 also has breaking changes |
| `BezierEaser.js` | bezier-easing (Gaëtan Renaudeau) | `bezier-easing@2.1.0` | **Keep vendored** — the wrapper adds a string-keyed cache (`nm` arg) used across 4 source files; an adapter would add more code than it removes |
| `seedrandom.js` | David Bau's seedrandom | `seedrandom@3.0.5` | **Replace with npm** — single usage site, identical API, straightforward swap |
| `howler.js` | howler.js v2.2.0 | `howler@2.2.4` | **Install but keep dormant for now** — the import in `AudioController.ts` is already commented out; install the package so it's available when audio is re-enabled |

### Step 7.1 — Replace `seedrandom` with the npm package

- `npm install seedrandom && npm install -D @types/seedrandom`
- Update the one import in `src/utils/expressions/ExpressionManager.ts`
- Delete `src/3rd_party/seedrandom.js`
- Verify: `npm test` and `npm run build` still pass; expression-driven
  animations (e.g. `monster.json`) still render correctly

### Step 7.2 — Install `howler` for when audio is re-enabled

- `npm install howler && npm install -D @types/howler`
- Update the commented-out import in `src/utils/audio/AudioController.ts` to
  point at `howler` instead of `../../3rd_party/howler`
- Delete `src/3rd_party/howler.js`
- Leave the `import` commented until the audio feature is explicitly enabled
- Verify: `npm run build` passes with no new type errors

### Step 7.3 — Add explanatory header comments to the remaining vendored files

- `transformation-matrix.js` — document *why* the `createTypedArray` import
  exists and why upgrading to v3 would need a migration
- `BezierEaser.js` — document the named-cache extension and link to the original
  MIT-licensed source on GitHub

---

## Phase 8 — Custom build pipeline (tree-shaking by animation features)

**Status: COMPLETE ✅**

**Goal:** allow a developer to pass one or more Lottie JSON files and receive a
custom-built `lottie.custom.js` that contains only the code those files actually
need, dramatically reducing bundle size.

### Implementation approach chosen: Generated entry

Rather than modifying ~173 source files with `if (FEATURE_X)` guards, the custom
build CLI generates a temporary TypeScript entry file in `src/modules/` that
imports only the features required by the analysed animations.  Rollup with
`treeshake: true` then eliminates all unreferenced code.  The temp file is
deleted after the build and is listed in `.gitignore`.

### What was built

| File | Purpose |
|---|---|
| `tools/analyze-animation.cjs` | Extended: multi-file, `--output flags.json`, `--strict` |
| `rollup.custom.config.js` | Rollup config with `treeshake: true`, reads params from env |
| `tools/build-custom.cjs` | CLI: analyses animations → generates entry → runs Rollup |
| `tests/verification/puppeteer-test.cjs` | Section 5: custom build smoke + visual regression |

### Achieved savings (happy2016, SVG renderer)

| Build | Size | vs reference |
|---|---|---|
| `lottie_svg.js` (full, unminified) | ~755 KB | — |
| `lottie.custom.js` (SVG only, unminified) | ~521 KB | 69% of reference |
| `lottie_svg.min.js` (full, minified) | 281 KB | — |
| `lottie.custom.min.js` (SVG only, minified) | **179 KB** | **64% of reference** |

Tree-shaking removes: CanvasRenderer, HybridRenderer, expression engine,
all SVG/Canvas effects, all shape modifiers not used by the animation.

### Usage

```bash
# Auto-detect features from a Lottie JSON, build SVG-only bundle:
npm run build:custom -- --animations demo/happy2016/data.json --renderer svg

# Multiple animations, all renderers, unminified:
npm run build:custom -- \
  --animations demo/happy2016/data.json demo/banner/data.json \
  --renderer all --no-minify

# Custom output path:
npm run build:custom -- --animations my-anim.json --output dist/lottie.min.js
```

### Step 8.1 — Extend the analyser ✅

- Support multiple input files (`npm run analyze anim1.json anim2.json`)
- Output a machine-readable feature flags file (`.lottie-features.json`) consumed
  by the build
- Add `--strict` mode that errors if the animation uses features not yet
  guard-wrapped

### Step 8.2 — Feature-flag the renderers ✅

Handled via the generated-entry approach — only the requested renderer(s) are
imported in the generated `src/modules/_custom_entry.ts` file.
Verified: SVG-only build omits CanvasRenderer and HybridRenderer.

### Step 8.3 — Feature-flag large optional subsystems ✅

Expressions: omitted when the analyser detects `LOTTIE_INCLUDE_EXPRESSIONS=false`.
Effects: omitted when `LOTTIE_INCLUDE_EFFECTS=false`.
Both are handled by not importing those modules in the generated entry.

### Step 8.4 — Feature-flag shape modifiers ✅

Individual flags for: `TRIM`, `REPEATER`, `ZIGZAG`, `ROUND_CORNERS`,
`PUCKER_BLOAT`, `OFFSET_PATH`, `MERGE`.  Only detected modifiers are
imported and registered in the custom entry.

### Step 8.5 — Custom build CLI ✅

```bash
npm run build:custom -- --animations demo/happy2016/data.json --renderer svg
# → build/player/lottie.custom.js  (with auto-detected feature flags)
```

### Step 8.6 — Verification test ✅

Section 5 in `tests/verification/puppeteer-test.cjs`:
- Runs `build-custom.cjs` for happy2016 + SVG renderer
- Loads the custom bundle in Puppeteer
- Verifies lottie global is available, animation loads, and pixel output is
  pixel-perfect against the existing `happy2016-svg` baseline

---

## Milestone summary

| Milestone | When done |
|---|---|
| **M0** — baseline verified, npm test works | Phase 0 complete ✅ |
| **M1** — repo is clean (no Bower, no legacy build, no deprecated deps) | Phase 1 complete ✅ |
| **M2** — TypeScript toolchain installed, Babel removed | Phase 2 complete ✅ |
| **M3** — all source in TypeScript, strict mode enabled | Phase 3 complete ✅ |
| **M4** — no build artefacts in git, CI publishes | Phase 4 complete ✅ |
| **M5** — full quality gates (lint, format, pre-commit) | Phase 5 complete ✅ |
| **M6** — meaningful test coverage | Phase 6 complete ✅ |
| **M7** — vendor deps audited, seedrandom & howler on npm | Phase 7 complete ✅ |
| **M8** — custom build pipeline (tree-shaking by animation) | Phase 8 complete ✅ |
