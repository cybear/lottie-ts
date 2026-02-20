---
layout: home

hero:
  name: lottie-ts
  text: After Effects animations for the web
  tagline: Fully rewritten in TypeScript. Tree-shakeable custom builds. Drop-in upgrade from lottie-web.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/installation
    - theme: alt
      text: View on GitHub
      link: https://github.com/bsod/lottie-ts

features:
  - icon: 🟦
    title: Written in TypeScript
    details: Full type safety from source to output. Includes bundled type declarations — no @types package required.
  - icon: 🌲
    title: Tree-shakeable custom builds
    details: Point the CLI at your animation files and get a bundle containing only the renderers, modifiers, and features they actually use.
  - icon: 🔌
    title: Drop-in compatible
    details: The lottie API is unchanged. Replace lottie-web with lottie-ts in your project with a single line change.
  - icon: 🧪
    title: Thoroughly tested
    details: 180 unit tests (Vitest) + 43 Puppeteer end-to-end checks including pixel-perfect visual regression.
  - icon: 📦
    title: Modern toolchain
    details: Rollup, ESLint, Prettier, Husky pre-commit hooks. No Babel, no Bower, no vendored dependencies.
  - icon: 🎵
    title: Audio support
    details: Audio layers backed by Howler.js, loaded from npm — no vendored copy.
---

## Quick start

```bash
npm install lottie-ts
```

```js
import lottie from 'lottie-ts';

lottie.loadAnimation({
  container: document.getElementById('animation'),
  renderer: 'svg',
  loop: true,
  autoplay: true,
  path: 'animation.json',
});
```

## Custom builds — ship only what you need

```bash
# Analyse your animation to detect exactly which features it uses:
npx lottie-ts analyze animation.json

# Produce a tree-shaken bundle for that animation:
npx lottie-ts build:custom --animations animation.json --renderer svg
# → lottie.custom.js  (~179 KB minified vs ~281 KB for lottie_svg.min.js)
```
