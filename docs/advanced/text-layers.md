# Text Layers

## Updating text at runtime

Use `updateDocumentData` to change the text content of a text layer without
re-exporting the animation:

```js
const anim = lottie.loadAnimation({ ... });

// After 'DOMLoaded' fires (or data_ready)
anim.addEventListener('DOMLoaded', () => {
  // Change the text of a layer named "Title"
  anim.updateDocumentData(['Title'], { t: 'Hello World' });
});
```

### Signature

```ts
anim.updateDocumentData(
  path: (string | number)[],
  documentData: Partial<TextDocumentData>,
  index?: number,
)
```

- `path` — array of layer names or indices that navigate to the target text layer
  (e.g. `['Comp', 'Title']` for a nested layer, `['Title']` for a top-level one)
- `documentData` — partial text data to merge in
- `index` — keyframe index (default: 0)

### `TextDocumentData` fields

| Key | Type | Description |
|---|---|---|
| `t` | `string` | The text string |
| `s` | `number` | Font size |
| `f` | `string` | Font family name |
| `fc` | `[r, g, b]` | Fill colour (0–1 range) |
| `sc` | `[r, g, b]` | Stroke colour (0–1 range) |
| `sw` | `number` | Stroke width |
| `j` | `0 \| 1 \| 2 \| 3` | Justification: left / right / centre / full |
| `tr` | `number` | Tracking (letter spacing in AE units) |
| `lh` | `number` | Line height |
| `ls` | `number` | Baseline shift |
| `ca` | `number` | Cap height (AE internal) |

### Example: change text and colour

```js
anim.addEventListener('DOMLoaded', () => {
  anim.updateDocumentData(
    ['Score'],
    { t: '1,234', fc: [1, 0.5, 0] },
  );
});
```

### Example: target a layer inside a precomp

```js
// Navigates to 'Subtitle' inside a precomp named 'HeroComp'
anim.updateDocumentData(['HeroComp', 'Subtitle'], { t: 'New subtitle' });
```

## Font management

Fonts used by text layers must be available in the browser. They are referenced
in the animation JSON under the `fonts` key.

If a font fails to load, the browser's default fallback will be used — which may
cause layout differences compared to the After Effects preview.

## Supported text features

✅ Static text, animated text (per-character / per-word / per-line)  
✅ Font size, weight, colour, stroke  
✅ Letter spacing, line height  
✅ Paragraph alignment  
✅ Text path (text following a mask path)  
⚠️  Text animators with range selectors have partial support  
❌ Paragraph boxes with auto-sizing
