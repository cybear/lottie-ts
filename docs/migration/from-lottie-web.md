# Migrating from lottie-web

lottie-ts is a fully TypeScript-rewritten, modernized fork of
[airbnb/lottie-web](https://github.com/airbnb/lottie-web). The public API is
intentionally unchanged — most projects can drop it in with a one-line package
swap.

## Quick swap

::: code-group

```sh [npm]
npm uninstall lottie-web
npm install lottie-ts
```

```sh [yarn]
yarn remove lottie-web
yarn add lottie-ts
```

```sh [pnpm]
pnpm remove lottie-web
pnpm add lottie-ts
```

:::

Then update your import:

```js
// Before
import lottie from 'lottie-web';
// After
import lottie from 'lottie-ts';
```

That's it for most projects.

## What changed

### Package identity

| | lottie-web | lottie-ts |
|---|---|---|
| Package name | `lottie-web` | `lottie-ts` |
| Version | 5.x | 6.0.0 |
| Source language | JavaScript | TypeScript |
| Module format | UMD / CJS | ESM-first, CJS, UMD |

### Toolchain

| | lottie-web | lottie-ts |
|---|---|---|
| Build system | Gulp + Babel | Rollup + tsc |
| Test runner | none | Vitest + Puppeteer |
| Linter | none | ESLint + Prettier |
| Packaging | Bower + npm | npm only |

### Dependencies

| Dependency | lottie-web | lottie-ts |
|---|---|---|
| `seedrandom` | vendored in-tree | `npm install` (declared dep) |
| `howler` | vendored in-tree | `npm install` (declared dep) |
| Babel runtime | required | removed |
| Bower | required | removed |
| Gulp | required | removed |

### Tree-shaking

`package.json` now declares `"sideEffects": false`, which tells bundlers such
as webpack and Rollup that every module in the package is pure. Combined with
the named ESM exports and the custom-build tooling, you can ship only the code
your renderer needs.

## What stayed the same

- **Full API compatibility** — all `lottie.*` methods and `AnimationItem`
  methods have the same signatures. No breaking changes.
- **Animation JSON format** — all `.json` files exported from After Effects
  with Bodymovin continue to work without modification.
- **Renderer behaviour** — SVG, Canvas, and HTML renderers produce the same
  output as before.
- **CDN UMD** — the `build/player/lottie.min.js` UMD bundle exposes `lottie`
  as a global, just like the upstream package.

## New capabilities

### TypeScript types

The source is TypeScript. Types are emitted alongside every build artifact —
no separate `@types/lottie-web` package needed.

```ts
import lottie, { type AnimationItem } from 'lottie-ts';

let anim: AnimationItem;
anim = lottie.loadAnimation({ ... });
```

### Custom builds

Shrink your bundle to only the features you use:

```sh
# See which feature classes appear in an animation
npm run analyze -- --input src/animation.json

# Build a SVG-only bundle with no expressions
npm run build:custom -- --renderer svg --no-expressions
```

See [Custom Builds](/guide/custom-builds) for full documentation.

### Vitest unit tests

```sh
npm test           # run unit tests
npm run test:watch # interactive watch mode
npm run coverage   # coverage report
```

### End-to-end tests

```sh
npm run test:e2e   # Puppeteer visual verification
```

## Version bump rationale

The major version bump from 5 → 6 reflects the TypeScript rewrite and toolchain
overhaul. There are no runtime API changes — the bump signals a new maintenance
lineage, not a breaking API change.
