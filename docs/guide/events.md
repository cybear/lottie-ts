# Events

## Callback properties

Set event callbacks directly on the `AnimationItem`:

```js
const anim = lottie.loadAnimation({ ... });

anim.onComplete     = () => console.log('animation finished');
anim.onLoopComplete = () => console.log('loop finished');
anim.onEnterFrame   = () => {};
anim.onSegmentStart = () => {};
```

## addEventListener

```js
const anim = lottie.loadAnimation({ ... });

// Returns an unsubscribe function
const remove = anim.addEventListener('complete', (event) => {
  console.log('direction:', event.direction);
});

// Remove the listener later
remove();

// Or pass the original callback to removeEventListener
function onFrame(event) { ... }
anim.addEventListener('enterFrame', onFrame);
anim.removeEventListener('enterFrame', onFrame);
// Pass no callback to remove all listeners for that event:
anim.removeEventListener('enterFrame');
```

## Event reference

| Event | Callback type | Fires when |
|---|---|---|
| `complete` | `BMCompleteEvent` | Animation played to the end (non-looping) |
| `loopComplete` | `BMCompleteLoopEvent` | A loop iteration finished |
| `enterFrame` | `BMEnterFrameEvent` | Each rendered frame |
| `drawnFrame` | `BMEnterFrameEvent` | Each frame actually drawn to the DOM/canvas |
| `segmentStart` | `BMSegmentStartEvent` | A new segment begins playing |
| `config_ready` | — | Initial configuration resolved |
| `data_ready` | — | All animation data has been loaded and parsed |
| `data_failed` | — | Part of the animation data could not be loaded |
| `loaded_images` | — | All image assets have loaded (or failed) |
| `DOMLoaded` | — | Elements have been added to the DOM (SVG/HTML renderer) |
| `destroy` | `BMDestroyEvent` | `anim.destroy()` was called |

## Event payload types

```ts
interface BMCompleteEvent {
  direction: number;  // 1 = forward, -1 = reverse
  type: 'complete';
}

interface BMCompleteLoopEvent {
  currentLoop: number;
  direction: number;
  totalLoops: number;
  type: 'loopComplete';
}

interface BMEnterFrameEvent {
  currentTime: number;  // current frame number
  direction: number;
  totalTime: number;    // total frames
  type: 'enterFrame';
}

interface BMSegmentStartEvent {
  firstFrame: number;
  totalFrames: number;
  type: 'segmentStart';
}

interface BMDestroyEvent {
  type: 'destroy';
}
```
