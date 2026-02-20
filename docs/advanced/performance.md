# Performance

## Render quality

```js
lottie.setQuality('low' | 'medium' | 'high' | number);
```

Quality maps to the number of points used to approximate bezier curves during
canvas rendering:

| Value | Points per segment |
|---|---|
| `'high'` (default) | ~200 |
| `'medium'` | ~50 |
| `'low'` | ~10 |
| `number` | exact count |

Lower quality speeds up canvas drawing noticeably on complex paths with many
segments. SVG renderer ignores this setting (browsers handle beziers natively).

## Progressive load

```js
lottie.loadAnimation({
  ...
  progressiveLoad: true,  // default: false
});
```

When enabled, the player starts rendering the first frame as soon as the first
segment of animation data is available, rather than waiting for the full JSON.
Useful for large animations loaded over slow connections.

## Hide on transparent

```js
lottie.loadAnimation({
  ...
  hideOnTransparent: true,  // default: true
});
```

When `true`, the host element gets `visibility: hidden` whenever a fully
transparent frame is rendered. This avoids painting invisible layers and lets
browser compositing skip the element entirely.

## Freeze and unfreeze

Pause the animation **and** stop the rendering loop entirely:

```js
lottie.freeze();      // all animations
anim.freeze?.();      // not on AnimationItem directly — use pause() instead
```

Use `lottie.freeze()` / `lottie.unfreeze()` on page visibility changes:

```js
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    lottie.freeze();
  } else {
    lottie.unfreeze();
  }
});
```

## Safari mask workaround

Safari has a bug with SVG `<clipPath>` elements when the document URL is used
as a base (e.g. inside an iframe without a `src`). Fix:

```js
lottie.setLocationHref(window.location.href);
```

Call this once before loading any animations that use masks.

## Canvas vs SVG trade-offs

| Concern | SVG | Canvas |
|---|---|---|
| Accessibility | `<title>` for screen readers | Bitmap only |
| CSS integration | Styleable via CSS | Isolated |
| Scaling | Resolution-independent | DPI-aware |
| Large layer counts | DOM nodes per element | Single draw call |
| Filters / blend modes | Full CSS/SVG support | Partial |
| Worker support | ❌ | ✅ (`lottie_canvas_worker`) |

Use **Canvas** when rendering many simultaneous complex animations. Use **SVG**
for most UI animations where accessibility and CSS layering matter.

## Asset size recommendations

- Minify JSON before shipping — remove whitespace and unused properties.
- Gzip: most servers compress JSON automatically; Brotli can cut 30 % more.
- Target < 50 KB gzipped for in-viewport hero animations.
- Split long animations into segments and load lazily:

```js
/* load segment lazily */
anim.playSegments([0, 60], true);
```

## Destroy when off-screen

Stop rendering and release DOM references for animations that leave the
viewport:

```js
const observer = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) {
      anim.destroy();
    }
  }
});
observer.observe(container);
```
