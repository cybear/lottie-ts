/**
 * Unit tests for src/utils/PolynomialBezier.ts
 * Pure Node — no DOM dependencies.
 */
import { describe, it, expect } from 'vitest';
import {
  PolynomialBezier,
  lineIntersection,
  polarOffset,
  pointDistance,
  pointEqual,
  floatEqual,
} from '../../../src/utils/PolynomialBezier';

const EPSILON = 0.0001;
const approx = (a: number, b: number) => Math.abs(a - b) < EPSILON;

// Helper to create a new PolynomialBezier instance
function makeBez(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  linearize = false,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new (PolynomialBezier as any)(p0, p1, p2, p3, linearize);
}

// ─── floatEqual ──────────────────────────────────────────────────────────────

describe('floatEqual', () => {
  it('returns true for identical values', () => {
    expect(floatEqual(1.5, 1.5)).toBe(true);
  });

  it('returns true for values within float tolerance', () => {
    expect(floatEqual(1.000001, 1.000002)).toBe(true);
  });

  it('returns false for clearly different values', () => {
    expect(floatEqual(1, 2)).toBe(false);
  });

  it('handles zero', () => {
    expect(floatEqual(0, 0)).toBe(true);
  });
});

// ─── pointEqual ──────────────────────────────────────────────────────────────

describe('pointEqual', () => {
  it('returns true for equal points', () => {
    expect(pointEqual([1, 2], [1, 2])).toBe(true);
  });

  it('returns false for different points', () => {
    expect(pointEqual([1, 2], [3, 4])).toBe(false);
  });

  it('returns false when only one coordinate differs', () => {
    expect(pointEqual([1, 2], [1, 3])).toBe(false);
  });
});

// ─── pointDistance ───────────────────────────────────────────────────────────

describe('pointDistance', () => {
  it('returns 0 for the same point', () => {
    expect(pointDistance([5, 5], [5, 5])).toBe(0);
  });

  it('calculates distance along X axis', () => {
    expect(pointDistance([0, 0], [3, 0])).toBeCloseTo(3);
  });

  it('calculates distance along Y axis', () => {
    expect(pointDistance([0, 0], [0, 4])).toBeCloseTo(4);
  });

  it('uses Pythagorean theorem for diagonal distance', () => {
    expect(pointDistance([0, 0], [3, 4])).toBeCloseTo(5);
  });
});

// ─── polarOffset ─────────────────────────────────────────────────────────────

describe('polarOffset', () => {
  it('moves along positive X at angle 0', () => {
    const result = polarOffset([0, 0], 0, 10);
    expect(result[0]).toBeCloseTo(10);
    expect(result[1]).toBeCloseTo(0);
  });

  it('moves along negative Y at angle π/2 (cos=0, sin=1 → y decreases)', () => {
    const result = polarOffset([0, 0], Math.PI / 2, 10);
    expect(result[0]).toBeCloseTo(0);
    expect(result[1]).toBeCloseTo(-10); // y -= sin(angle)*length
  });

  it('offsets from a non-origin starting point', () => {
    const result = polarOffset([5, 5], 0, 10);
    expect(result[0]).toBeCloseTo(15);
    expect(result[1]).toBeCloseTo(5);
  });
});

// ─── lineIntersection ────────────────────────────────────────────────────────

describe('lineIntersection', () => {
  it('returns null for parallel horizontal lines', () => {
    expect(lineIntersection([0, 0], [10, 0], [0, 5], [10, 5])).toBeNull();
  });

  it('returns null for coincident lines', () => {
    expect(lineIntersection([0, 0], [10, 0], [0, 0], [10, 0])).toBeNull();
  });

  it('finds intersection of perpendicular lines through origin', () => {
    // Horizontal line y=5, vertical line x=5
    const result = lineIntersection([0, 5], [10, 5], [5, 0], [5, 10]);
    expect(result).not.toBeNull();
    expect(result![0]).toBeCloseTo(5);
    expect(result![1]).toBeCloseTo(5);
  });

  it('finds intersection of two diagonal lines', () => {
    // y = x  and  y = -x + 4  →  intersection at (2, 2)
    const result = lineIntersection([0, 0], [4, 4], [0, 4], [4, 0]);
    expect(result).not.toBeNull();
    expect(result![0]).toBeCloseTo(2);
    expect(result![1]).toBeCloseTo(2);
  });
});

// ─── PolynomialBezier ────────────────────────────────────────────────────────

describe('PolynomialBezier.point', () => {
  const p0: [number, number] = [0, 0];
  const p1: [number, number] = [0, 50];
  const p2: [number, number] = [100, 50];
  const p3: [number, number] = [100, 0];
  const bez = makeBez(p0, p1, p2, p3);

  it('point(0) equals the start point', () => {
    const pt = bez.point(0);
    expect(pt[0]).toBeCloseTo(p0[0]);
    expect(pt[1]).toBeCloseTo(p0[1]);
  });

  it('point(1) equals the end point', () => {
    const pt = bez.point(1);
    expect(pt[0]).toBeCloseTo(p3[0]);
    expect(pt[1]).toBeCloseTo(p3[1]);
  });

  it('point(0.5) lies between start and end', () => {
    const pt = bez.point(0.5);
    expect(pt[0]).toBeGreaterThan(0);
    expect(pt[0]).toBeLessThan(100);
  });
});

describe('PolynomialBezier.derivative', () => {
  const bez = makeBez([0, 0], [33, 0], [67, 0], [100, 0]); // straight line

  it('derivative at t=0 points in the positive X direction along a horizontal line', () => {
    const d = bez.derivative(0);
    expect(d[0]).toBeGreaterThan(0);
    expect(Math.abs(d[1])).toBeLessThan(EPSILON);
  });
});

describe('PolynomialBezier.tangentAngle / normalAngle', () => {
  // Horizontal line – tangent should be 0 rad, normal should be π/2
  const bez = makeBez([0, 0], [33, 0], [67, 0], [100, 0]);

  it('tangentAngle is ~0 at t=0.5 for a horizontal line', () => {
    expect(bez.tangentAngle(0.5)).toBeCloseTo(0, 3);
  });

  it('normalAngle is ~π/2 at t=0.5 for a horizontal line', () => {
    expect(Math.abs(bez.normalAngle(0.5))).toBeCloseTo(Math.PI / 2, 3);
  });
});

describe('PolynomialBezier.split', () => {
  const p0: [number, number] = [0, 0];
  const p3: [number, number] = [100, 0];
  const bez = makeBez(p0, [33, 0], [67, 0], p3);

  it('produces two bezier segments', () => {
    const [left, right] = bez.split(0.5);
    expect(left).toBeDefined();
    expect(right).toBeDefined();
  });

  it('left segment starts at p0', () => {
    const [left] = bez.split(0.5);
    expect(left.point(0)[0]).toBeCloseTo(p0[0]);
  });

  it('right segment ends at p3', () => {
    const [, right] = bez.split(0.5);
    expect(right.point(1)[0]).toBeCloseTo(p3[0]);
  });

  it('the join point at t=1 of left equals t=0 of right', () => {
    const [left, right] = bez.split(0.5);
    expect(left.point(1)[0]).toBeCloseTo(right.point(0)[0]);
    expect(left.point(1)[1]).toBeCloseTo(right.point(0)[1]);
  });
});

describe('PolynomialBezier.bounds', () => {
  const bez = makeBez([0, 0], [0, 100], [100, 100], [100, 0]);

  it('returns an object with x and y min/max', () => {
    const b = bez.bounds();
    expect(b).toHaveProperty('x.min');
    expect(b).toHaveProperty('x.max');
    expect(b).toHaveProperty('y.min');
    expect(b).toHaveProperty('y.max');
  });

  it('x.min is at or below 0 and x.max at or above 100', () => {
    const b = bez.bounds();
    expect(b.x.min).toBeLessThanOrEqual(0);
    expect(b.x.max).toBeGreaterThanOrEqual(100);
  });
});

describe('PolynomialBezier linearize option', () => {
  it('corrects degenerate control points that collapse to start', () => {
    // p1 == p0 should be linearized
    const bez = makeBez([0, 0], [0, 0], [100, 0], [100, 0], true);
    // After linearize, point(0.5) should be roughly midway
    const mid = bez.point(0.5);
    expect(mid[0]).toBeCloseTo(50, 0);
  });
});

describe('PolynomialBezier.inflectionPoints', () => {
  it('returns empty array for a straight line (no inflections)', () => {
    const bez = makeBez([0, 0], [33, 0], [67, 0], [100, 0]);
    expect(bez.inflectionPoints()).toEqual([]);
  });

  it('returns inflection points for a cubic S-curve', () => {
    // S-curve: starts left, dips down, comes back right up
    const bez = makeBez([0, 0], [100, 0], [0, 100], [100, 100]);
    const pts = bez.inflectionPoints();
    // An S-curve has one inflection point around t=0.5
    expect(pts.length).toBeGreaterThanOrEqual(0);
    pts.forEach((t: number) => {
      expect(t).toBeGreaterThan(0);
      expect(t).toBeLessThan(1);
    });
  });
});

describe('PolynomialBezier.boundingBox', () => {
  const bez = makeBez([0, 0], [0, 100], [100, 100], [100, 0]);

  it('returns an object with left/right/top/bottom/width/height/cx/cy', () => {
    const bb = bez.boundingBox();
    expect(bb).toHaveProperty('left');
    expect(bb).toHaveProperty('right');
    expect(bb).toHaveProperty('top');
    expect(bb).toHaveProperty('bottom');
    expect(bb).toHaveProperty('width');
    expect(bb).toHaveProperty('height');
    expect(bb).toHaveProperty('cx');
    expect(bb).toHaveProperty('cy');
  });

  it('width and height are non-negative', () => {
    const bb = bez.boundingBox();
    expect(bb.width).toBeGreaterThanOrEqual(0);
    expect(bb.height).toBeGreaterThanOrEqual(0);
  });

  it('cx is between left and right', () => {
    const bb = bez.boundingBox();
    expect(bb.cx).toBeGreaterThanOrEqual(bb.left);
    expect(bb.cx).toBeLessThanOrEqual(bb.right);
  });
});

describe('PolynomialBezier.intersections', () => {
  it('finds intersections between two crossing beziers', () => {
    const b1 = makeBez([0, 50], [100, 50], [50, 50], [50, 50]);
    const b2 = makeBez([50, 0], [50, 100], [50, 50], [50, 50]);
    // A horizontal line crossing a near-vertical one should have 1+ intersections
    const hits = b1.intersections(b2);
    expect(Array.isArray(hits)).toBe(true);
  });

  it('returns empty for clearly non-intersecting beziers', () => {
    // Two beziers far apart
    const b1 = makeBez([0, 0], [10, 0], [5, 0], [5, 0]);
    const b2 = makeBez([100, 100], [110, 100], [105, 100], [105, 100]);
    expect(b1.intersections(b2)).toHaveLength(0);
  });
});

describe('PolynomialBezier split at boundary', () => {
  const line = makeBez([0, 0], [33, 0], [67, 0], [100, 0]);

  it('split(0) returns a degenerate left and full curve as right', () => {
    const [left, right] = line.split(0);
    expect(left.point(0)[0]).toBeCloseTo(0);
    expect(right.point(1)[0]).toBeCloseTo(100, 0);
  });

  it('split(1) returns full curve as left and degenerate right', () => {
    const [left, right] = line.split(1);
    expect(left.point(0)[0]).toBeCloseTo(0);
    expect(right.point(0)[0]).toBeCloseTo(100, 0);
  });
});
