# Text Layers

## Updating text at runtime

Use `updateDocumentData` to change the text content of a text layer without
re-exporting the animation:

```js
const anim = lottie.loadAnimation({ ... });

// After 'DOMLoaded' fires (or data_ready)
anim.addEventListener('DOMLoaded', () => {
  // Change the text of a layer named "Title"
  anim.updateDocumentData({ name: 'Title' }, { t: 'Hello World' });
});
```

### Signature

```ts
anim.updateDocumentData(
  layerQuery: { name: string } | { index: number },
  documentData: Partial<TextDocumentData>,
  index?: number,
)
```

- `layerQuery` — find the layer by `name` (string) or `index` (0-based)
- `documentData` — partial text data to merge in
- `index` — keyframe index (default: 0)

### `TextDocumentData` fields

| Key | Type | Description |
|---|---|---|
| `t` | `string` | The text string |
| `s` | `number` | Font size |
| `fc` | `[r, g, b]` | Fill colour (0–1 range) |
| `sc` | `[r, g, b]` | Stroke colour |
| `sw` | `number` | Stroke width |
| `lh` | `number` | Line height |
| `ls` | `number` | Letter spacing |
| `j` | `0 \| 1 \| 2 \| 3` | Justification: left / right / centre / full |

### Example: change text and colour

```js
anim.addEventListener('DOMLoaded', () => {
  anim.updateDocumentData(
    { name: 'Score' },
    { t: '1,234', fc: [1, 0.5, 0] },
  );
});
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
