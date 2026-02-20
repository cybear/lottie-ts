# Composition Settings

These settings control how the exported Bodymovin JSON is interpreted and rendered.

## Time ruler

| Property | Key | Type | Description |
|---|---|---|---|
| In Point | `ip` | number | First frame of the animation |
| Out Point | `op` | number | Last frame of the animation |
| Frame Rate | `fr` | number | Frames per second |

## Canvas

| Property | Key | Type | Description |
|---|---|---|---|
| Width | `w` | number | Composition width in pixels |
| Height | `h` | number | Composition height in pixels |

## Version

| Property | Key | Type | Description |
|---|---|---|---|
| Version | `v` | string | Bodymovin plugin version that exported the file |
| 3D | `ddd` | 0 \| 1 | Whether the composition has 3D layers |

## Assets

The `assets` array contains reusable resources:

- **Images** — referenced by image layers via `refId`
- **Precomps** — nested compositions referenced by precomp layers

```json
{
  "assets": [
    {
      "id": "img_0",
      "w": 512,
      "h": 512,
      "u": "images/",
      "p": "img_0.png",
      "e": 0
    }
  ]
}
```

| Key | Description |
|---|---|
| `id` | Reference ID used by layers |
| `w`, `h` | Image dimensions |
| `u` | Path prefix (relative to the JSON file) |
| `p` | Filename |
| `e` | `1` if the image is embedded as a data URI |

## Layers

See the layer-specific pages for shape layers, text layers, image layers, etc.

## Markers

Markers attach named annotations to specific frames:

```json
{
  "markers": [
    { "tm": 0, "cm": "start", "dr": 0 },
    { "tm": 60, "cm": "loop", "dr": 0 }
  ]
}
```

| Key | Description |
|---|---|
| `tm` | Time (frame number) |
| `cm` | Comment / marker name |
| `dr` | Duration |

You can use markers with `playSegments` to create named animation states:

```js
// Find a marker by name and play from it
const marker = animation.markers.find(m => m.cm === 'loop');
anim.goToAndPlay(marker.tm, true);
```
