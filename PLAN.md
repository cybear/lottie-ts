# PLAN — Step-by-step Migration to Target Architecture

Last updated: 2026-02-19

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

## Phase 7 — Custom build pipeline (tree-shaking by animation features)

**Goal:** allow a developer to pass one or more Lottie JSON files and receive a
custom-built `lottie.custom.js` that contains only the code those files actually
need, dramatically reducing bundle size.

**PoC already done** (`tools/analyze-animation.cjs`, `npm run analyze`):

```
npm run analyze demo/happy2016/data.json -- --renderer svg
```

Produces a full feature manifest and module map.  For happy2016 (SVG renderer):
- **Required**: SVGRenderer, SVGShapeElement, SVGCompElement, MaskElement
- **Strippable**: both other renderers, text stack, audio, image preloader,
  expression engine, all unused shape modifiers
- **Estimated custom bundle**: ~73 KB  vs  620 KB full `lottie_svg.js` (~88% smaller)

### Why it isn't trivial yet

The source uses `extendPrototype()` mixin patterns that Rollup cannot statically
eliminate.  Every feature is wired together at runtime.  Two implementation paths:

| Approach | Effort | Quality |
|---|---|---|
| **Feature-flag guards** — wrap each renderer/shape handler in `if (FEATURE_X)` conditions, replace at Rollup build time via `@rollup/plugin-replace` | Medium (~2 weeks) | Good; works with current architecture |
| **Module boundary refactor** — restructure each shape type, renderer, and effect as a proper ES module imported only when needed | Large (~6+ weeks) | Excellent; enables full tree-shaking and correct types |

### Step 7.1 — Extend the analyser

- Support multiple input files (`npm run analyze anim1.json anim2.json`)
- Output a machine-readable feature flags file (`.lottie-features.json`) consumed
  by the build
- Add `--strict` mode that errors if the animation uses features not yet
  guard-wrapped

### Step 7.2 — Feature-flag the renderers (quick win)

- Introduce `LOTTIE_INCLUDE_SVG`, `LOTTIE_INCLUDE_CANVAS`, `LOTTIE_INCLUDE_HTML`
  build-time constants in `rollup.config.js`
- Wrap renderer registration with `if (LOTTIE_INCLUDE_CANVAS) { … }`
- Verify: a `--renderer svg` custom build omits all canvas/HTML element classes
- Estimated saving: **~45%** from renderer-only flag (canvas + HTML renderers
  account for ~1200 source lines in the modelled set)

### Step 7.3 — Feature-flag large optional subsystems

Guard each subsystem behind a compile-time constant:

| Constant | Guards |
|---|---|
| `LOTTIE_INCLUDE_EXPRESSIONS` | ExpressionManager + all Expression*Interface files |
| `LOTTIE_INCLUDE_TEXT` | TextProperty, TextAnimatorProperty, FontManager, *TextElement |
| `LOTTIE_INCLUDE_AUDIO` | AudioController, AudioElement |
| `LOTTIE_INCLUDE_IMAGES` | ImagePreloader, CVImageElement, HImageElement |
| `LOTTIE_INCLUDE_GRADIENTS` | GradientProperty |
| `LOTTIE_INCLUDE_EFFECTS` | SVGEffects, CVEffects, HEffects, effect type files |
| `LOTTIE_INCLUDE_3D` | HCameraElement, HybridRenderer 3D containers |

### Step 7.4 — Feature-flag shape modifiers

Individual flags for: `TRIM`, `REPEATER`, `ZIGZAG`, `ROUND_CORNERS`,
`PUCKER_BLOAT`, `OFFSET_PATH`, `MERGE`, `GRADIENTS`.

### Step 7.5 — Custom build CLI

```bash
npm run build:custom -- --animations demo/happy2016/data.json --renderer svg
# → build/player/lottie.custom.js  (auto-detected flags injected)
```

- Reads the animation JSON(s) via the analyser
- Auto-generates the `@rollup/plugin-replace` config
- Produces a named output file with a build manifest comment at the top

### Step 7.6 — Verification test

- After custom build: load the animation in Puppeteer, compare pixel output
  against the full-build baseline
- Any missing feature causes a visible regression → test fails

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
| **M7** — custom build pipeline (tree-shaking by animation) | Phase 7 in progress 🔧 |
