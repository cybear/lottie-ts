# Custom Builds

lottie-ts ships with a CLI that analyses your animation JSON files, detects exactly
which features they require, and produces a tree-shaken bundle containing only
that code.

## Why?

The full `lottie.js` bundle includes three renderers, the expression engine, nine
SVG effects, and six shape modifiers. Most animations use only a small subset.

| Build | Size (min+gz) |
|---|---|
| Full `lottie.js` | ~220 KB |
| `lottie_svg.js` (SVG only) | ~90 KB |
| Custom for a simple SVG animation | ~60–70 KB |

## Analyse an animation

```bash
# Show which features the animation uses:
npm run analyze -- demo/my-animation.json

# Multiple files (union of all features):
npm run analyze -- demo/anim1.json demo/anim2.json
```

Example output:
```
LOTTIE_INCLUDE_SVG            ✓
LOTTIE_INCLUDE_CANVAS         ✗
LOTTIE_INCLUDE_EXPRESSIONS    ✗
LOTTIE_INCLUDE_TRIM           ✓
LOTTIE_INCLUDE_REPEATER       ✗
...
```

Use `--output flags.json` to write a machine-readable flags file:
```bash
npm run analyze -- my-animation.json --output .lottie-features.json
```

## Build a custom bundle

```bash
# SVG renderer, feature-detected from animation:
npm run build:custom -- --animations my-animation.json --renderer svg
# → build/player/lottie.custom.js

# Multiple animations + multiple renderers:
npm run build:custom -- \
  --animations anim1.json anim2.json \
  --renderer svg,canvas

# All renderers:
npm run build:custom -- --animations my-animation.json --renderer all

# Custom output path:
npm run build:custom -- \
  --animations my-animation.json \
  --renderer svg \
  --output dist/lottie.min.js
```

## Options

| Flag | Default | Description |
|---|---|---|
| `--animations <file> [...]` | — | Animation JSON files to analyse |
| `--renderer <svg\|canvas\|html\|all>` | `svg` | Renderer(s) to include. Comma-separated or `all`. |
| `--output <path>` | `build/player/lottie.custom.js` | Output bundle path |
| `--no-minify` | — | Skip terser (faster, larger output) |
| `--sourcemap` | — | Emit source map |
| `--expressions` | auto | Force-include expression engine |
| `--no-expressions` | auto | Force-exclude expression engine |
| `--effects` | auto | Force-include effects |
| `--no-effects` | auto | Force-exclude effects |

Run `node tools/build-custom.cjs --help` for the full list.

## How it works

1. The analyser reads each animation JSON and detects which renderers, shape
   modifiers, expressions, and effects it uses.
2. A temporary TypeScript entry file is generated in `src/modules/` importing
   only the detected features.
3. Rollup compiles the entry with `treeshake: true`, eliminating all unreferenced
   code.
4. The temp entry file is deleted immediately after the build.

The custom bundle is a standard UMD module — identical API to `lottie.js`.

## Strict mode

Use `--strict` during development to catch animations that use features not yet
covered by the custom build pipeline:

```bash
npm run analyze -- my-animation.json --strict
# Exits 1 if the animation uses features that have no source-level guard
```
