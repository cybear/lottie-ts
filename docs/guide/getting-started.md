# Getting Started

## Load your first animation

After [installing](./installation) lottie-ts, put a container element in your HTML:

```html
<div id="my-animation" style="width: 400px; height: 400px;"></div>
```

Then load an animation:

```js
import lottie from 'lottie-ts';

const animation = lottie.loadAnimation({
  container: document.getElementById('my-animation'),
  renderer: 'svg',   // 'svg' | 'canvas' | 'html'
  loop: true,
  autoplay: true,
  path: 'animation.json', // URL to your exported Bodymovin JSON
});
```

## Loading options

`loadAnimation` accepts one configuration object:

| Option | Type | Default | Description |
|---|---|---|---|
| `container` | `HTMLElement` | — | The DOM element that will contain the animation (**required**) |
| `renderer` | `'svg' \| 'canvas' \| 'html'` | `'svg'` | Rendering backend |
| `loop` | `boolean \| number` | `false` | `true` = loop forever, `number` = loop N times |
| `autoplay` | `boolean` | `true` | Start playing immediately once ready |
| `path` | `string` | — | URL to the animation JSON file |
| `animationData` | `object` | — | Inline animation data (alternative to `path`) |
| `name` | `string` | — | Optional name for targeting with global methods |
| `assetsPath` | `string` | — | Base URL for external assets (images, audio) |
| `initialSegment` | `[number, number]` | — | Constrain playback to this frame range on load |
| `rendererSettings` | object | — | Renderer-specific settings (see [Renderers](./renderers)) |
| `audioFactory` | function | — | Custom audio factory for audio layers (advanced) |

::: warning Note on animationData with repeaters
If your animation contains repeaters and you plan to call `loadAnimation` multiple
times with the same `animationData` object, deep-clone it first:

```js
import { cloneDeep } from 'lodash-es';
lottie.loadAnimation({ animationData: cloneDeep(data), ... });
```
:::

## Inline animation data

```js
import lottie from 'lottie-ts';
import animationData from './my-animation.json';

lottie.loadAnimation({
  container: document.getElementById('my-animation'),
  renderer: 'svg',
  loop: true,
  autoplay: true,
  animationData,
});
```

## HTML auto-loading

Add the class `lottie` (or `bodymovin`) to any element with a `data-animation-path`
attribute. Call `lottie.searchAnimations()` after the page loads:

```html
<div
  class="lottie"
  data-animation-path="animation.json"
  data-anim-loop="true"
  data-name="my-anim"
  style="width: 400px; height: 400px;"
></div>
```

```js
import lottie from 'lottie-ts';
lottie.searchAnimations();
```

Or include the script before `</body>` — elements with class `lottie` present at
page-load time are detected automatically.

## Controlling an animation

`loadAnimation` returns an `AnimationItem` instance:

```js
const anim = lottie.loadAnimation({ ... });

anim.play();
anim.pause();
anim.stop();
anim.setSpeed(1.5);          // 1.5× speed
anim.setDirection(-1);       // reverse
anim.goToAndStop(30, true);  // jump to frame 30, paused
anim.goToAndPlay(0, true);   // jump to frame 0, play

// Clean up when done
anim.destroy();
```

See the full [API reference](./api) for all available methods.
