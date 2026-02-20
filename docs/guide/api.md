# API Reference

## Global `lottie` object

### `lottie.loadAnimation(params)`

Creates and returns an animation instance.

```ts
lottie.loadAnimation(params: AnimationConfigWithPath | AnimationConfigWithData): AnimationItem
```

See [Getting Started → Load your first animation](./getting-started) for a full
options table.

### `lottie.play(name?)`

Play all animations, or the one with the given name.

### `lottie.stop(name?)`

Stop all animations (resets to first frame), or the named one.

### `lottie.pause(name?)`

Pause all animations, or the named one.

### `lottie.setSpeed(speed, name?)`

Set playback speed. `1` = normal, `0.5` = half speed, `2` = double speed.

### `lottie.setDirection(direction, name?)`

Set direction. `1` = forward, `-1` = reverse.

### `lottie.goToAndStop(value, isFrame, name?)`

Move all animations (or the named one) to a specific time/frame, paused.

- `value` — time in seconds (default) or frame number
- `isFrame` — set `true` to treat `value` as a frame number

### `lottie.searchAnimations(animationData?, standalone?, renderer?)`

Scan the DOM for elements with class `lottie` or `bodymovin` and load them.

### `lottie.registerAnimation(element, animationData?)`

Manually register a DOM element to be animated. The element must have a
`data-animation-path` attribute.

### `lottie.getRegisteredAnimations()`

Returns an array of all active `AnimationItem` instances.

### `lottie.setQuality(quality)`

Controls rendering quality. Accepted values: `'high'` (default), `'medium'`,
`'low'`, or a number > 1. Higher numbers improve performance with less precision.

### `lottie.setLocationHref(href)`

Sets the base URL used for SVG `href` references. Useful when a `<base>` tag
causes mask issues in Safari (see [Issues](../advanced/performance#safari-mask-issue)).

### `lottie.freeze()`

Freeze all animations (stop the render loop without destroying them).

### `lottie.unfreeze()`

Resume frozen animations.

### `lottie.destroy(name?)`

Destroy all animations, or the named one. Empties the container element.

### `lottie.inBrowser()`

Returns `true` when running in a browser environment.

### `lottie.resize()`

Notify all animations that their container was resized.

### `lottie.version`

The lottie-ts version string (e.g. `"6.0.0"`).

---

## `AnimationItem`

Returned by `lottie.loadAnimation()`.

### Playback

```ts
anim.play()
anim.pause()
anim.stop()
anim.togglePause()
anim.setSpeed(speed: number)
anim.setDirection(direction: 1 | -1)
anim.setLoop(isLooping: boolean)
anim.goToAndStop(value: number, isFrame?: boolean)
anim.goToAndPlay(value: number, isFrame?: boolean)
anim.playSegments(segments: [number, number] | [number, number][], forceFlag?: boolean)
anim.resetSegments(forceFlag: boolean)
anim.setSegment(init: number, end: number)
anim.setSubframe(useSubFrames: boolean)
```

### Info

```ts
anim.getDuration(inFrames?: boolean): number
anim.isLoaded: boolean
anim.currentFrame: number
anim.totalFrames: number
anim.frameRate: number
anim.isPaused: boolean
anim.loop: boolean | number
anim.name: string
anim.animationID: string
```

### Events

```ts
// Property shorthand
anim.onComplete     = () => {}
anim.onLoopComplete = () => {}
anim.onEnterFrame   = () => {}
anim.onSegmentStart = () => {}

// addEventListener (returns unsubscribe fn)
const off = anim.addEventListener('complete', handler)
off() // unsubscribe

anim.removeEventListener('complete', handler?)
anim.triggerEvent(name, args)
```

See [Events](./events) for payload types.

### DOM / display

```ts
anim.hide()
anim.show()
anim.resize(width?: number, height?: number)
anim.destroy()
```

### Text layers

```ts
anim.updateDocumentData(layerQuery, documentData, index?)
```

See [Text Layers](../advanced/text-layers) for details.

### Misc

```ts
anim.includeLayers(data: any)
```

---

## TypeScript types

All types are exported from the package entry point:

```ts
import type {
  AnimationItem,
  AnimationConfigWithPath,
  AnimationConfigWithData,
  AnimationDirection,
  AnimationSegment,
  AnimationEventName,
  AnimationEventCallback,
  SVGRendererConfig,
  CanvasRendererConfig,
  HTMLRendererConfig,
  BMCompleteEvent,
  BMCompleteLoopEvent,
  BMEnterFrameEvent,
  BMSegmentStartEvent,
  BMDestroyEvent,
} from 'lottie-ts';
```
