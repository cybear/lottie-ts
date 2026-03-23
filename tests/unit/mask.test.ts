// @vitest-environment happy-dom
/**
 * Mask stack: SVG stores path props on `viewData[i].prop`; canvas stores `MaskShapeProp` on `viewData[i]`.
 * `TextAnimatorProperty` calls `maskManager.getMaskProperty(i)` and expects a `MaskShapeProp` (uses `.v`, `._mdf`).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MaskDefinitionJson, MaskHostLayerData } from '../../src/types/lottieRuntime';
import ShapePropertyFactory from '../../src/utils/shapes/ShapeProperty';
import CVMaskElement from '../../src/elements/canvasElements/CVMaskElement';
import MaskElement from '../../src/mask';

vi.mock('../../src/utils/shapes/ShapeProperty', () => ({
  default: {
    getShapeProp: vi.fn(),
  },
}));

const getShapeProp = vi.mocked(ShapePropertyFactory.getShapeProp);

function makeCanvasHost() {
  return {
    finalTransform: {
      mat: {
        applyToPointArray: (x: number, y: number) => [x, y],
        applyToTriplePoints: () => [0, 0, 0, 0, 0, 0],
      },
    },
    canvasContext: {
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      bezierCurveTo: vi.fn(),
      clip: vi.fn(),
    },
    globalData: {
      compSize: { w: 200, h: 100 },
      renderer: { save: vi.fn() },
    },
    addRenderableComponent: vi.fn(),
  };
}

describe('MaskElement.getMaskProperty', () => {
  it('returns viewData[pos].prop (SVG wire shape)', () => {
    const pathNodes = { v: [[0, 0]], o: [[0, 0]], i: [[0, 0]], _length: 1, c: false };
    const prop = { v: pathNodes, _mdf: false };
    const ctx = {
      viewData: [
        {
          prop,
          op: { v: 100, _mdf: false },
          elem: document.createElementNS('http://www.w3.org/2000/svg', 'path'),
          lastPath: '',
        },
      ],
    };
    expect(MaskElement.prototype.getMaskProperty.call(ctx as any, 0)).toBe(prop);
    expect(MaskElement.prototype.getMaskProperty.call(ctx as any, 0).v._length).toBe(1);
  });
});

describe('CVMaskElement', () => {
  beforeEach(() => {
    getShapeProp.mockClear();
    getShapeProp.mockImplementation(() => ({
      v: { v: [[1, 2]], o: [[0, 0]], i: [[0, 0]], _length: 1 },
      _mdf: true,
    }));
  });

  it('getMaskProperty returns the canvas row (same reference as viewData[pos])', () => {
    const masks: MaskDefinitionJson[] = [
      { mode: 'n' },
      { mode: 'a', pt: {} },
    ];
    const data = { masksProperties: masks } as MaskHostLayerData;
    const element = makeCanvasHost();
    const cv = new CVMaskElement(data, element as any);

    expect(cv.getMaskProperty(0)).toBe(cv.viewData[0]);
    expect(cv.getMaskProperty(1)).toBe(cv.viewData[1]);
    expect(cv.getMaskProperty(1).v._length).toBe(1);
    expect(cv.getMaskProperty(1).v.v[0]).toEqual([1, 2]);
  });

  it('calls getShapeProp with mask type 3 for each mask row', () => {
    const masks: MaskDefinitionJson[] = [{ mode: 's' }, { mode: 'n' }];
    const data = { masksProperties: masks } as MaskHostLayerData;
    new CVMaskElement(data, makeCanvasHost() as any);

    expect(getShapeProp).toHaveBeenCalledTimes(2);
    expect(getShapeProp.mock.calls[0][2]).toBe(3);
    expect(getShapeProp.mock.calls[1][2]).toBe(3);
  });

  it('registers as renderable when any mask is active', () => {
    const host = makeCanvasHost();
    const data = { masksProperties: [{ mode: 'a' } as MaskDefinitionJson] } as MaskHostLayerData;
    new CVMaskElement(data, host as any);
    expect(host.addRenderableComponent).toHaveBeenCalledTimes(1);
  });

  it('does not register when all masks are mode n', () => {
    const host = makeCanvasHost();
    const data = { masksProperties: [{ mode: 'n' }, { mode: 'n' }] as MaskDefinitionJson[] } as MaskHostLayerData;
    new CVMaskElement(data, host as any);
    expect(host.addRenderableComponent).not.toHaveBeenCalled();
  });
});
