# OLD — Current Codebase State

Last updated: 2026-02-19

---

## Overview

lottie-web is an After Effects animation renderer for the browser. The library is
old enough that it predates many modern JavaScript conventions. The source has
been partially modernised but carries significant historical debt.

---

## Package management

| Concern | Reality |
|---|---|
| Primary package manager | NPM (`package.json`) |
| Legacy package manager | **Bower** (`bower.json` still present) — points `main` at `build/player/lottie.js` |
| Bower usage | Not used in the build anymore but the file is still checked in and consumers who still use Bower can pick up the pre-built file |

---

## Source language

Plain **JavaScript** (`.js` files). No TypeScript in the source tree.  
A hand-written `index.d.ts` declaration file exists at the repo root so TypeScript
consumers get type information, but it is not generated from the source — it must
be maintained manually and can drift from the implementation.

ESLint enforces `airbnb-base` style, but the following rules are disabled, revealing
the historical coding style:

- `no-var` is **off** → `var` is used freely throughout many files
- `prefer-rest-params` is **off** → `arguments` object still appears
- `no-use-before-define` is **off** → hoisting is relied upon
- `prefer-arrow-callback` is **off** → old-style `function` callbacks remain
- `vars-on-top` is **off** → variable declarations are scattered

Many files still use a mix of `var`, `let`, and `const` within the same file.

---

## Module system

### Source files
The **source** files (`player/js/**`) use ES module syntax (`import`/`export`).
This was likely introduced during a partial modernisation pass.  
However, module-level encapsulation is still often done with **IIFEs**:

```js
// player/js/animation/AnimationManager.js
const animationManager = (function () {
  var moduleOb = {};
  //...
  return moduleOb;
}());
```

Standalone-mode markers (`'__[STANDALONE]__'`, `'__[ANIMATIONDATA]__'`) are baked
as string literals and replaced by the build tool at bundle time, creating an
unusual coupling between the source and the build.

### Output formats
Rollup produces three output formats:

| Format | Location | Purpose |
|---|---|---|
| UMD | `build/player/lottie*.js` | `<script>` tag, AMD, CommonJS — attaches `window.lottie` globally |
| ESM | `build/player/esm/` | Native ES module consumers |
| CJS | `build/player/cjs/` | Node.js `require()` consumers |

The UMD build intentionally exposes a **global variable** (`window.lottie`) for
pages that load lottie with a bare `<script>` tag.

---

## Build system

### Current build: Rollup (`rollup.config.js`)
- Rollup 2.x + `@rollup/plugin-babel` + `@rollup/plugin-node-resolve`
- Babel (`@babel/preset-env`, modules:false) transpiles source to wider browser
  compatibility
- `rollup-plugin-terser` minifies `.min.js` variants
- Two custom Rollup plugins inject boilerplate guards:
  - `addNavigatorValidation` — wraps output in `(typeof navigator !== "undefined") &&`
  - `addDocumentValidation` — wraps output in `(typeof document !== "undefined") &&`
- Version string `[[BM_VERSION]]` is string-replaced from `package.json` at build
  time
- The entry modules live in `player/js/modules/` and fan out via static `import`
  chains

### Legacy build: `tasks/build.js`
- Hard-coded ordered list of ~100 source file paths
- Files are **concatenated** via Node.js `fs.readFileSync` and wrapped in a closure
- Output is minified with `uglify-js` (v3)
- This is the original pre-module build; the version number in it is hardcoded to
  `5.8.1` — it is stale and no longer part of the primary `npm run build` script

### Worker build: `tasks/build_worker.js`
- Separate post-processing step that produces the web-worker variants after the
  main Rollup build

---

## Third-party dependencies

Third-party libraries are **vendored** directly inside `player/js/3rd_party/`:

| File | Library |
|---|---|
| `transformation-matrix.js` | Local matrix math |
| `seedrandom.js` | Seeded RNG (used by expressions) |
| `BezierEaser.js` | Bezier easing |
| `howler.js` | Audio playback |

None of these are installed via NPM. They are checked into the repo as modified
copies. Upstream updates require manual diffing and merging.

---

## Type system

None in the source. Observations:

- `index.d.ts` is entirely hand-written (~200 lines)
- Types are not checked during `npm run build`
- There is no `tsc --noEmit` step in CI or the build script
- Internal interfaces (e.g., `AnimationItem`, renderer contracts) are implicit —
  enforced only by runtime behaviour and code review

---

## Testing

No dedicated test runner (no Jest, Mocha, Vitest, etc.).

| Test approach | Files |
|---|---|
| Pixel/visual comparison | `tests/verification/visual-tests.js` — Puppeteer screenshot diffs with `pixelmatch` |
| Functional API tests | `tests/verification/functional-tests.js` — manual import + assertion script |
| Legacy test harness | `test/index.js` — separate script for generating reference GIFs |

Tests are run manually; there is no `npm test` script that executes them
automatically against the build output.

---

## Output / delivery artefacts

- Pre-built files are committed to `build/player/` and to `dist/` — consumers can
  point directly at these files without running the build
- This is common for browser libraries distributed via CDN/Bower but is unusual for
  a modern NPM package (it bloats the repo and creates noise in diffs)

---

## Summary of pain points

1. **No types in source** — refactoring is risky; IDEs cannot offer reliable
   autocomplete across the codebase
2. **Vendored third-party code** — hard to audit, update, or replace
3. **Bower** — dead package manager still lingering
4. **No automated test runner** — visual/functional tests require manual execution
5. **`var` + IIFE patterns** — impede static analysis and tree-shaking
6. **Build artefacts in git** — `build/` and `dist/` committed, repo is heavy
7. **Standalone-mode string substitution** — a brittle coupling between source
   and build
8. **Stale legacy build** — `tasks/build.js` hardcodes version `5.8.1` and file
   ordering that can silently diverge from what Rollup actually builds
9. **ESLint rules disabled in bulk** — lint gives false confidence; many style
   problems go undetected
10. **`index.d.ts` maintained by hand** — will inevitably drift from the
    implementation
