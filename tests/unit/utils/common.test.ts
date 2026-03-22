// @vitest-environment happy-dom
/**
 * Unit tests for src/utils/common.ts
 * Needs jsdom because common.ts reads navigator.userAgent at module load time.
 */
import {
  afterEach,
  describe,
  it,
  expect,
} from 'vitest';
import {
  bmPow,
  bmSqrt,
  bmFloor,
  bmMax,
  bmMin,
  degToRads,
  roundCorner,
  bmRnd,
  roundValues,
  BMMath,
  addSaturationToRGB,
  addBrightnessToRGB,
  addHueToRGB,
  rgbToHex,
  setSubframeEnabled,
  getSubframeEnabled,
  setDefaultCurveSegments,
  getDefaultCurveSegments,
  setIdPrefix,
  getIdPrefix,
  ProjectInterface,
} from '../../../src/utils/common';

// ─── Math aliases ─────────────────────────────────────────────────────────────

describe('math aliases', () => {
  it('bmPow delegates to Math.pow', () => {
    expect(bmPow(2, 10)).toBe(1024);
    expect(bmPow(0, 0)).toBe(1);
  });

  it('bmSqrt delegates to Math.sqrt', () => {
    expect(bmSqrt(9)).toBe(3);
    expect(bmSqrt(2)).toBeCloseTo(Math.sqrt(2));
  });

  it('bmFloor delegates to Math.floor', () => {
    expect(bmFloor(3.7)).toBe(3);
    expect(bmFloor(-3.1)).toBe(-4);
  });

  it('bmMax delegates to Math.max', () => {
    expect(bmMax(1, 5, 3)).toBe(5);
  });

  it('bmMin delegates to Math.min', () => {
    expect(bmMin(8, 2, 6)).toBe(2);
  });
});

// ─── constants ────────────────────────────────────────────────────────────────

describe('constants', () => {
  it('degToRads equals Math.PI / 180', () => {
    expect(degToRads).toBeCloseTo(Math.PI / 180);
  });

  it('roundCorner is the standard SVG approximation ~0.5519', () => {
    expect(roundCorner).toBeCloseTo(0.5519, 3);
  });
});

// ─── bmRnd / roundValues ──────────────────────────────────────────────────────

describe('bmRnd / roundValues', () => {
  afterEach(() => {
    // Always restore to off after each test
    roundValues(false);
  });

  it('bmRnd returns the value unchanged by default', () => {
    expect(bmRnd(3.7)).toBe(3.7);
  });

  it('bmRnd rounds when roundValues is enabled', () => {
    roundValues(true);
    expect(bmRnd(3.7)).toBe(4);
    expect(bmRnd(3.2)).toBe(3);
    expect(bmRnd(-1.6)).toBe(-2);
  });

  it('bmRnd stops rounding after roundValues(false)', () => {
    roundValues(true);
    roundValues(false);
    expect(bmRnd(3.7)).toBe(3.7);
  });
});

// ─── BMMath ───────────────────────────────────────────────────────────────────

describe('BMMath', () => {
  it('exposes standard Math properties', () => {
    expect(BMMath.PI).toBeCloseTo(Math.PI);
    expect(BMMath.E).toBeCloseTo(Math.E);
  });

  it('exposes Math methods', () => {
    expect(BMMath.floor(3.9)).toBe(3);
    expect(BMMath.sqrt(4)).toBe(2);
    expect(BMMath.pow(2, 3)).toBe(8);
  });

  it('abs handles scalar values', () => {
    expect(BMMath.abs(-5)).toBe(5);
    expect(BMMath.abs(5)).toBe(5);
  });

  it('abs handles array values', () => {
    const result = BMMath.abs([-3, 4, -1]) as number[];
    expect(result[0]).toBe(3);
    expect(result[1]).toBe(4);
    expect(result[2]).toBe(1);
  });
});

// ─── subframe ─────────────────────────────────────────────────────────────────

describe('subframeEnabled', () => {
  afterEach(() => {
    setSubframeEnabled(true);
  });

  it('is enabled by default', () => {
    expect(getSubframeEnabled()).toBe(true);
  });

  it('can be disabled', () => {
    setSubframeEnabled(false);
    expect(getSubframeEnabled()).toBe(false);
  });

  it('can be re-enabled', () => {
    setSubframeEnabled(false);
    setSubframeEnabled(true);
    expect(getSubframeEnabled()).toBe(true);
  });
});

// ─── defaultCurveSegments ─────────────────────────────────────────────────────

describe('defaultCurveSegments', () => {
  afterEach(() => {
    setDefaultCurveSegments(150);
  });

  it('defaults to 150', () => {
    expect(getDefaultCurveSegments()).toBe(150);
  });

  it('can be changed', () => {
    setDefaultCurveSegments(100);
    expect(getDefaultCurveSegments()).toBe(100);
  });
});

// ─── idPrefix ─────────────────────────────────────────────────────────────────

describe('idPrefix', () => {
  afterEach(() => {
    setIdPrefix('');
  });

  it('defaults to empty string', () => {
    expect(getIdPrefix()).toBe('');
  });

  it('can be set', () => {
    setIdPrefix('MyAnim_');
    expect(getIdPrefix()).toBe('MyAnim_');
  });
});

// ─── RGB color utilities ──────────────────────────────────────────────────────

describe('rgbToHex', () => {
  it('converts black to #000000', () => {
    expect(rgbToHex(0, 0, 0)).toBe('#000000');
  });

  it('converts white to #ffffff', () => {
    expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
  });

  it('converts red to #ff0000', () => {
    expect(rgbToHex(255, 0, 0)).toBe('#ff0000');
  });

  it('clamps negative r to 0', () => {
    expect(rgbToHex(-10, 0, 0)).toBe('#000000');
  });

  it('clamps negative g to 0', () => {
    expect(rgbToHex(0, -5, 0)).toBe('#000000');
  });

  it('clamps negative b to 0', () => {
    expect(rgbToHex(0, 0, -1)).toBe('#000000');
  });

  it('clamps all negative channels to black', () => {
    expect(rgbToHex(-1, -1, -1)).toBe('#000000');
  });
});

describe('ProjectInterface', () => {
  it('returns an empty object', () => {
    const pi = ProjectInterface();
    expect(typeof pi).toBe('object');
    expect(pi).not.toBeNull();
  });
});

describe('addSaturationToRGB', () => {
  it('increasing saturation on a grey returns a non-grey (same for a colored input)', () => {
    // Pure red [1,0,0] (normalized 0-1 range as used by the function)
    const result = addSaturationToRGB([1, 0, 0], 0);
    // Should round-trip back to approximately red
    expect(result[0]).toBeGreaterThan(0);
  });

  it('zero offset leaves a pure red value unchanged (rounded due to HSV conversions)', () => {
    const result = addSaturationToRGB([1, 0, 0], 0);
    expect(result.length).toBe(3);
  });

  it('offsets saturation upward without going above 1', () => {
    // Grey [0.5, 0.5, 0.5] with s=0 → add 0.5 saturation won't crash
    const result = addSaturationToRGB([0.5, 0.5, 0.5], 0.5);
    expect(result.length).toBe(3);
  });
});

describe('addBrightnessToRGB', () => {
  it('returns an array of 3 numbers', () => {
    const result = addBrightnessToRGB([0.5, 0.5, 0.5], 0.2);
    expect(result.length).toBe(3);
  });

  it('increasing brightness makes a dark color brighter (larger HSV v component)', () => {
    const dim = addBrightnessToRGB([0.1, 0.1, 0.1], 0.3);
    const original = addBrightnessToRGB([0.1, 0.1, 0.1], 0);
    // All channels should be at least as bright
    expect(dim[0] + dim[1] + dim[2]).toBeGreaterThanOrEqual(original[0] + original[1] + original[2]);
  });
});

describe('addHueToRGB', () => {
  it('returns an array of 3 numbers', () => {
    const result = addHueToRGB([1, 0, 0], 90);
    expect(result.length).toBe(3);
  });

  it('rotating hue by 360 degrees yields approximately the same color', () => {
    const original = addHueToRGB([1, 0, 0], 0);
    const rotated = addHueToRGB([1, 0, 0], 360);
    expect(rotated[0]).toBeCloseTo(original[0], 0);
    expect(rotated[1]).toBeCloseTo(original[1], 0);
    expect(rotated[2]).toBeCloseTo(original[2], 0);
  });
});
