# Installation

## Requirements

- A bundler (Vite, Webpack, Rollup, etc.) **or** a direct `<script>` tag
- Node.js 18+ if you're building from source or using the CLI tools (`npm run analyze`, `npm run build:custom`)

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
| `lottie.js` | All renderers + expressions + effects | ~86 KB |
| `lottie_svg.js` | SVG renderer only | ~73 KB |
| `lottie_canvas.js` | Canvas renderer only | ~78 KB |
| `lottie_html.js` | HTML renderer only | ~78 KB |
| `lottie_light.js` | SVG, no expressions | ~55 KB |
| `lottie_light_canvas.js` | Canvas, no expressions | ~63 KB |
| `lottie_light_html.js` | HTML, no expressions | ~60 KB |

## ES Modules

```js
// Full build (all renderers)
import lottie from 'lottie-ts';

// SVG renderer only
import lottie from 'lottie-ts/lottie_svg';

// Canvas renderer only
import lottie from 'lottie-ts/lottie_canvas';

// HTML renderer only
import lottie from 'lottie-ts/lottie_html';

// Light builds (no expression engine)
import lottie from 'lottie-ts/lottie_light';         // SVG
import lottie from 'lottie-ts/lottie_light_canvas';  // Canvas
import lottie from 'lottie-ts/lottie_light_html';    // HTML
```

## Custom build (recommended for production)

For the smallest possible bundle, use the custom build CLI to produce a bundle
containing only the features your specific animations need.

See [Custom Builds](./custom-builds) for details.
