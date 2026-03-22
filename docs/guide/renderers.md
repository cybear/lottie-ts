# Renderers

lottie-ts supports three rendering backends. Choose based on your use-case.

## SVG (recommended)

Renders animations as inline SVG elements. Best quality and browser support.

```js
lottie.loadAnimation({
  container: el,
  renderer: 'svg',
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid meet', // same as SVG attribute
    progressiveLoad: false,  // load DOM elements lazily (speeds up init for complex animations)
    hideOnTransparent: true, // hide elements when opacity reaches 0
    className: 'my-svg-class',
    id: 'my-svg-id',
    title: 'Accessible title',       // adds <title> element
    description: 'Accessible desc',  // adds <desc> element
    focusable: false,
    // Advanced
    viewBoxOnly: false,          // use only the SVG viewBox, ignore container dimensions
    viewBoxSize: '0 0 512 512',  // override the viewBox string
    filterSize: { width: '100%', height: '100%', x: '0%', y: '0%' }, // SVG filter bounds
    contentVisibility: 'auto',   // CSS content-visibility on root element
    runExpressions: true,        // set false to skip expression evaluation
  },
});
```

**Pros:** Scalable, accessible, best colour accuracy, masks + effects work fully.  
**Cons:** DOM-heavy for very complex animations; can be slower than canvas on low-end devices.

## Canvas

Renders using the 2D Canvas API. Suitable for high frame-rate animations or
situations where many instances play simultaneously.

```js
lottie.loadAnimation({
  container: el,
  renderer: 'canvas',
  rendererSettings: {
    clearCanvas: true,           // whether to clear the canvas on each frame
    progressiveLoad: false,
    preserveAspectRatio: 'xMidYMid meet',
    context: myExistingCtx,      // pass an existing CanvasRenderingContext2D
    dpr: window.devicePixelRatio, // device pixel ratio (default: auto-detected)
    className: 'my-canvas-class',
    id: 'my-canvas-id',
    contentVisibility: 'auto',   // CSS content-visibility
    runExpressions: true,        // set false to skip expression evaluation
  },
});
```

::: warning Canvas clearing
When supplying your own `context`, set `clearCanvas: false` and handle clearing
manually after each frame.
:::

**Pros:** Better performance at high frame rates; bitmap compositing.  
**Cons:** Not scalable (raster); no native accessibility; fewer effects supported.

## HTML

Renders using DOM elements positioned with CSS transforms. Useful when the animation
source uses HTML layers from After Effects.

```js
lottie.loadAnimation({
  container: el,
  renderer: 'html',
  rendererSettings: {
    className: 'my-class',
    id: 'my-id',
    hideOnTransparent: true,
    filterSize: { width: '400%', height: '400%', x: '-100%', y: '-100%' }, // CSS filter bounds
    runExpressions: true,
  },
});
```

**Pros:** Composites into the normal document flow; CSS transitions can extend animations.  
**Cons:** Not supported in all AE export scenarios; limited effects.

## Choosing a renderer

| Renderer | Quality | Performance | Accessibility | Effects |
|---|---|---|---|---|
| `svg` | ★★★★★ | ★★★★☆ | ✅ | Full |
| `canvas` | ★★★★☆ | ★★★★★ | ❌ | Partial |
| `html` | ★★★☆☆ | ★★★☆☆ | Partial | Partial |

## Renderer-specific bundles

If you only use one renderer, import the matching slim bundle to avoid shipping
the others:

```js
import lottie from 'lottie-ts/lottie_svg';
import lottie from 'lottie-ts/lottie_canvas';
```

Or use the [custom build CLI](./custom-builds) to produce the smallest possible bundle.
