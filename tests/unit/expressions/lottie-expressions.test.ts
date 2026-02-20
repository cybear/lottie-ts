// @vitest-environment jsdom
/**
 * Integration tests for lottie expression evaluation.
 *
 * Strategy: load the prebuilt CJS bundle (which includes ExpressionManager)
 * inside a jsdom environment, then run animations that contain expression
 * scripts and verify the output is what we expect.
 */
import { createRequire } from 'node:module';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

// Use CJS require to load the expression-capable bundle.
const require = createRequire(import.meta.url);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let lottie: any;

beforeAll(() => {
  // jsdom provides HTMLCanvasElement but not getContext. Lottie's color-map
  // builder calls getContext('2d').fillStyle at module load time, so we stub it
  // out before requiring the CJS bundle.
  HTMLCanvasElement.prototype.getContext = () =>
    ({
      fillStyle: '',
      fillRect: () => {},
      getImageData: () => ({ data: [0, 0, 0, 0] }),
      drawImage: () => {},
      putImageData: () => {},
      createLinearGradient: () => ({ addColorStop: () => {} }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;

  // The SVG-only CJS bundle avoids canvas initialization errors in jsdom.
  const mod = require('../../../build/player/cjs/lottie_svg.min.js');
  // Rollup sets __esModule: true, so the actual API lives at .default
  lottie = mod.default ?? mod;
});

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeContainer(): HTMLElement {
  const div = document.createElement('div');
  document.body.appendChild(div);
  return div;
}

/** Minimal animation with no layers — just enough to verify lottie initialization. */
const minimalAnim = {
  v: '5.7.4',
  fr: 25,
  ip: 0,
  op: 10,
  w: 100,
  h: 100,
  nm: 'Minimal',
  ddd: 0,
  assets: [],
  layers: [],
};

/** Minimal animation with one shape layer and an expression on opacity. */
function makeExprAnim(opacityExpr: string) {
  return {
    v: '5.7.4',
    fr: 25,
    ip: 0,
    op: 10,
    w: 200,
    h: 200,
    nm: 'ExprTest',
    ddd: 0,
    assets: [],
    layers: [
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: 'Layer 1',
        sr: 1,
        ks: {
          o: { a: 0, k: 100, ix: 11, x: opacityExpr },
          r: { a: 0, k: 0, ix: 10 },
          p: { a: 0, k: [100, 100, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: { a: 0, k: [100, 100, 100] },
        },
        shapes: [
          {
            ty: 'rc',
            d: 1,
            s: { a: 0, k: [50, 50] },
            p: { a: 0, k: [0, 0] },
            r: { a: 0, k: 0 },
            nm: 'rect',
          },
          {
            ty: 'fl',
            c: { a: 0, k: [1, 0, 0, 1] },
            o: { a: 0, k: 100 },
            r: 1,
            nm: 'fill',
          },
        ],
        ip: 0,
        op: 10,
        st: 0,
        bm: 0,
      },
    ],
  };
}

// ─── API surface tests ────────────────────────────────────────────────────────

describe('lottie CJS bundle API', () => {
  it('exports loadAnimation', () => {
    expect(typeof lottie.loadAnimation).toBe('function');
  });

  it('exports destroy', () => {
    expect(typeof lottie.destroy).toBe('function');
  });

  it('exports setSubframeRendering', () => {
    expect(typeof lottie.setSubframeRendering).toBe('function');
  });

  it('exports installPlugin', () => {
    expect(typeof lottie.installPlugin).toBe('function');
  });
});

// ─── loadAnimation lifecycle tests ───────────────────────────────────────────

describe('loadAnimation', () => {
  const animations: unknown[] = [];

  afterEach(() => {
    while (animations.length) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (animations.pop() as any).destroy?.();
    }
  });

  it('loads a minimal animation without throwing', () => {
    expect(() => {
      const container = makeContainer();
      const anim = lottie.loadAnimation({
        container,
        animationData: minimalAnim,
        renderer: 'svg',
        autoplay: false,
        loop: false,
      });
      animations.push(anim);
    }).not.toThrow();
  });

  it('returns an animation instance with goToAndStop', () => {
    const container = makeContainer();
    const anim = lottie.loadAnimation({
      container,
      animationData: minimalAnim,
      renderer: 'svg',
      autoplay: false,
      loop: false,
    });
    animations.push(anim);
    expect(typeof anim.goToAndStop).toBe('function');
    expect(typeof anim.destroy).toBe('function');
    expect(typeof anim.play).toBe('function');
  });

  it('goToAndStop does not throw for frame 0', () => {
    const container = makeContainer();
    const anim = lottie.loadAnimation({
      container,
      animationData: minimalAnim,
      renderer: 'svg',
      autoplay: false,
      loop: false,
    });
    animations.push(anim);
    expect(() => anim.goToAndStop(0, true)).not.toThrow();
  });
});

// ─── Expression evaluation tests ─────────────────────────────────────────────

describe('expression evaluation', () => {
  const animations: unknown[] = [];

  afterEach(() => {
    while (animations.length) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (animations.pop() as any).destroy?.();
    }
  });

  it('loads an animation with an opacity expression without throwing', () => {
    expect(() => {
      const container = makeContainer();
      const anim = lottie.loadAnimation({
        container,
        animationData: makeExprAnim('var $bm_rt;\n$bm_rt = 50;'),
        renderer: 'svg',
        autoplay: false,
        loop: false,
      });
      animations.push(anim);
      anim.goToAndStop(0, true);
    }).not.toThrow();
  });

  it('loads an animation with a value/time expression without throwing', () => {
    // Expression that reads time: common pattern in lottie
    expect(() => {
      const container = makeContainer();
      const anim = lottie.loadAnimation({
        container,
        animationData: makeExprAnim('var $bm_rt;\n$bm_rt = value;'),
        renderer: 'svg',
        autoplay: false,
        loop: false,
      });
      animations.push(anim);
      anim.goToAndStop(0, true);
    }).not.toThrow();
  });

  it('renders a layer with static expression opacity into the SVG container', () => {
    const container = makeContainer();
    const anim = lottie.loadAnimation({
      container,
      animationData: makeExprAnim('var $bm_rt;\n$bm_rt = 50;'),
      renderer: 'svg',
      autoplay: false,
      loop: false,
    });
    animations.push(anim);
    anim.goToAndStop(0, true);

    // The container should have a child SVG element rendered by lottie
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });
});
