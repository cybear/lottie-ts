# Expressions

Lottie supports a subset of After Effects expressions, enabling dynamic,
data-driven animations without re-exporting from After Effects.

## Enabling expressions

Expressions are included by default in the full `lottie.js` and `lottie_svg.js`
bundles. The `_light` variants deliberately exclude them for a smaller footprint.

| Bundle | Expressions |
|---|---|
| `lottie.js` | ✅ |
| `lottie_svg.js` | ✅ |
| `lottie_light.js` | ❌ |
| `lottie_light_svg.js` | ❌ |
| Custom build | Detected automatically from animation |

## What is supported?

lottie-ts supports the most commonly used AE expression methods and globals:

- **Math:** `Math.*`, `clamp`, `linear`, `ease`, `easeIn`, `easeOut`
- **Time:** `time`, `framesToTime`, `timeToFrames`
- **Layer/comp access:** `thisComp`, `thisLayer`, `thisProperty`
- **Random:** `random`, `seedRandom` (backed by [seedrandom](https://www.npmjs.com/package/seedrandom) — deterministic across platforms)
- **Vector ops:** `add`, `sub`, `mul`, `div`, `normalize`, `length`, `lookAt`
- **Wiggle:** `wiggle(freq, amp)`
- **Value interpolation:** `valueAtTime(t)`, `velocityAtTime(t)`

## Limitations

- JavaScript **functions** defined inside expressions are evaluated by the browser's
  JS engine — behavior may differ from ExtendScript.
- Some 3D expression methods are not supported.
- `footage()` and `effect()` have partial support.

For a discussion of expression compatibility, see the
[original wiki](https://github.com/airbnb/lottie-web/wiki/Expressions).

## Expressions in custom builds

When you run the analyser on an animation that contains expressions, the custom
build automatically includes the expression engine:

```bash
npm run analyze -- my-animation-with-expressions.json
# LOTTIE_INCLUDE_EXPRESSIONS  ✓

npm run build:custom -- --animations my-animation-with-expressions.json --renderer svg
# Expression engine included automatically
```

To force-exclude expressions even when detected (e.g. if you know they aren't
needed at runtime):

```bash
npm run build:custom -- --animations my-animation.json --no-expressions
```
