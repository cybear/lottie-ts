# Installation

## Requirements

- Node.js 18 or later
- A bundler (Vite, Webpack, Rollup, etc.) **or** a direct `<script>` tag

## npm / yarn / pnpm

::: code-group

```bash [npm]
npm install lottie-ts
```

```bash [yarn]
yarn add lottie-ts
```

```bash [pnpm]
pnpm add lottie-ts
```

:::

## CDN (script tag)

```html
<!-- Full build — all renderers, expressions, effects -->
<script src="https://cdn.jsdelivr.net/npm/lottie-ts/build/player/lottie.js"></script>
```

Lighter variants are also available:

| File | Contents | Size (min+gz) |
|---|---|---|
| `lottie.js` | All renderers + expressions + effects | ~220 KB |
| `lottie_svg.js` | SVG renderer only | ~90 KB |
| `lottie_canvas.js` | Canvas renderer only | ~95 KB |
| `lottie_light.js` | SVG, no expressions | ~65 KB |
| `lottie_light_canvas.js` | Canvas, no expressions | ~68 KB |

## ES Modules

```js
// Full build (all renderers)
import lottie from 'lottie-ts';

// SVG renderer only (tree-shaken)
import lottie from 'lottie-ts/lottie_svg';

// Canvas renderer only
import lottie from 'lottie-ts/lottie_canvas';

// Light (no expression engine)
import lottie from 'lottie-ts/lottie_light';
```

## Custom build (recommended for production)

For the smallest possible bundle, use the custom build CLI to produce a bundle
containing only the features your specific animations need.

See [Custom Builds](./custom-builds) for details.
