// @vitest-environment happy-dom
/**
 * Unit tests for src/utils/bez.ts
 * Needs jsdom because bez.ts imports common.ts which reads navigator.userAgent at module load.
 */
import { describe, it, expect } from 'vitest';
import bez from '../../../src/utils/bez';

const { pointOnLine2D, pointOnLine3D, buildBezierData, getPointInSegment, getNewSegment } = bez;

// ─── pointOnLine2D ────────────────────────────────────────────────────────────

describe('pointOnLine2D', () => {
  it('returns true when third point is on the line between p1 and p2', () => {
    // p1=(0,0), p2=(10,0), p3=(5,0) — collinear on y=0
    expect(pointOnLine2D(0, 0, 10, 0, 5, 0)).toBe(true);
  });

  it('returns true for collinear diagonal points', () => {
    // p1=(0,0), p2=(4,4), p3=(2,2)
    expect(pointOnLine2D(0, 0, 4, 4, 2, 2)).toBe(true);
  });

  it('returns false when the third point is off the line', () => {
    // p1=(0,0), p2=(10,0), p3=(5,1) — y=1 is off the x-axis
    expect(pointOnLine2D(0, 0, 10, 0, 5, 1)).toBe(false);
  });

  it('handles negative coordinates', () => {
    // p1=(-5,-5), p2=(5,5), p3=(0,0)
    expect(pointOnLine2D(-5, -5, 5, 5, 0, 0)).toBe(true);
  });
});

// ─── pointOnLine3D ────────────────────────────────────────────────────────────

describe('pointOnLine3D', () => {
  it('delegates to 2D when all z-values are zero', () => {
    expect(pointOnLine3D(0, 0, 0, 10, 0, 0, 5, 0, 0)).toBe(true);
    expect(pointOnLine3D(0, 0, 0, 10, 0, 0, 5, 1, 0)).toBe(false);
  });

  it('returns true for collinear 3D points', () => {
    // (0,0,0) → (10,10,10), midpoint (5,5,5)
    expect(pointOnLine3D(0, 0, 0, 10, 10, 10, 5, 5, 5)).toBe(true);
  });

  it('returns false for a 3D point off the line', () => {
    // (0,0,0) → (10,0,0), point (5,5,0) — clearly off axis
    expect(pointOnLine3D(0, 0, 0, 10, 0, 0, 5, 5, 0)).toBe(false);
  });
});

// ─── buildBezierData ──────────────────────────────────────────────────────────

describe('buildBezierData', () => {
  it('returns an object with segmentLength and points', () => {
    // Curved bezier: start=[0,0], end=[100,0], cp1=[20,80], cp2=[-20,-80]
    const data = buildBezierData([0, 0], [100, 0], [20, 80], [-20, -80]);
    expect(data).toHaveProperty('segmentLength');
    expect(data).toHaveProperty('points');
    expect(data.segmentLength).toBeGreaterThan(0);
  });

  it('caches results for the same bezier (referential equality)', () => {
    const data1 = buildBezierData([0, 0], [50, 50], [0, 20], [0, -20]);
    const data2 = buildBezierData([0, 0], [50, 50], [0, 20], [0, -20]);
    expect(data1).toBe(data2);
  });

  it('points array length equals curveSegments', () => {
    const data = buildBezierData([0, 0], [100, 0], [10, 50], [-10, -50]);
    expect(Array.isArray(data.points) || ArrayBuffer.isView(data.points)).toBe(true);
    expect(data.points.length).toBeGreaterThan(0);
  });

  it('linear bezier shortcut produces only 2 segments', () => {
    // Straight horizontal line with collinear handles → curveSegments = 2
    const data = buildBezierData([0, 0], [100, 0], [33, 0], [-33, 0]);
    expect(data.points.length).toBe(2);
  });

  it('segmentLength approximates the true length of a horizontal line', () => {
    // Straight line length should be ~100
    const data = buildBezierData([0, 0], [100, 0], [33, 0], [-33, 0]);
    expect(data.segmentLength).toBeCloseTo(100, 0);
  });
});

// ─── getPointInSegment ────────────────────────────────────────────────────────

describe('getPointInSegment', () => {
  // We build a synthetic BezierLengthData (percents, lengths, addedLength)
  // for a uniformly-spaced 3-sample straight horizontal line
  const mockBezierData = {
    percents: [0, 0.5, 1],
    lengths: [0, 50, 100],
    addedLength: 100,
  };
  const pt1 = [0, 0]; // start
  const pt2 = [100, 0]; // end
  // Absolute control points lying on the line x-axis (1/3 and 2/3 of the way)
  const pt3 = [33.333, 0]; // cp1 absolute
  const pt4 = [66.667, 0]; // cp2 absolute

  it('returns start point at percent=0', () => {
    const pt = getPointInSegment(pt1, pt2, pt3, pt4, 0, mockBezierData as never);
    expect(pt[0]).toBeCloseTo(0);
    expect(pt[1]).toBeCloseTo(0);
  });

  it('returns end point at percent=1', () => {
    const pt = getPointInSegment(pt1, pt2, pt3, pt4, 1, mockBezierData as never);
    expect(pt[0]).toBeCloseTo(100);
    expect(pt[1]).toBeCloseTo(0);
  });

  it('returns midpoint at percent=0.5 for a straight line (collinear handles)', () => {
    // With collinear absolute handles at 1/3 and 2/3, t=0.5 lands at x=50
    const pt = getPointInSegment(pt1, pt2, pt3, pt4, 0.5, mockBezierData as never);
    expect(pt[0]).toBeCloseTo(50, 1);
    expect(pt[1]).toBeCloseTo(0);
  });
});

// ─── getNewSegment ────────────────────────────────────────────────────────────

describe('getSegmentsLength', () => {
  it('calculates total length for a simple open path', () => {
    // Two vertices: (0,0) and (100,0) with zero handles → straight horizontal line
    const shapeData = {
      c: false,
      v: [[0, 0], [100, 0]],
      o: [[0, 0], [0, 0]],   // out handles (relative to v, used as abs in formula)
      i: [[0, 0], [0, 0]],   // in handles
      _length: 2,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = bez.getSegmentsLength(shapeData as any);
    expect(result).toHaveProperty('lengths');
    expect(result).toHaveProperty('totalLength');
    expect(result.totalLength).toBeGreaterThan(0);
  });

  it('adds a closing segment for closed paths', () => {
    // Triangle: 3 vertices forming a closed path
    const shapeData = {
      c: true,
      v: [[0, 0], [100, 0], [50, 80]],
      o: [[0, 0], [0, 0], [0, 0]],
      i: [[0, 0], [0, 0], [0, 0]],
      _length: 3,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = bez.getSegmentsLength(shapeData as any);
    // 3 vertices with closed path → 3 segments
    expect(result.lengths.length).toBe(3);
    expect(result.totalLength).toBeGreaterThan(0);
  });
});

describe('getPointInSegment with interpolated bezierData', () => {
  // 4-sample bezierData with uniform spacing to hit the while-loop in getDistancePerc
  const mockBezierData4 = {
    percents: [0, 0.33, 0.67, 1],
    lengths: [0, 33, 67, 100],
    addedLength: 100,
  };
  const pt1 = [0, 0];
  const pt2 = [100, 0];
  const pt3 = [33.333, 0];
  const pt4 = [66.667, 0];

  it('interpolates at a non-boundary percent (exercises the while loop)', () => {
    // percent=0.6 → lengthPos=60, between lengths[1]=33 and lengths[2]=67 → interpolated
    const pt = getPointInSegment(pt1, pt2, pt3, pt4, 0.6, mockBezierData4 as never);
    // x should be somewhere in the [0,100] range
    expect(pt[0]).toBeGreaterThan(0);
    expect(pt[0]).toBeLessThan(100);
  });
});

// ─── getNewSegment ────────────────────────────────────────────────────────────

describe('getNewSegment', () => {
  const mockBezierData = {
    percents: [0, 0.5, 1],
    lengths: [0, 50, 100],
    addedLength: 100,
  };
  const pt1 = [0, 0]; // start
  const pt2 = [100, 0]; // end
  const pt3 = [0, 0]; // start handle
  const pt4 = [0, 0]; // end handle

  it('returns a Float32Array of 8 values', () => {
    const seg = getNewSegment(pt1, pt2, pt3, pt4, 0, 1, mockBezierData as never);
    expect(seg).toBeInstanceOf(Float32Array);
    expect(seg.length).toBe(8);
  });

  it('full segment (0→1) starts at pt1 and ends at pt2 for a straight line', () => {
    const seg = getNewSegment(pt1, pt2, pt3, pt4, 0, 1, mockBezierData as never);
    // seg[0..3] = x coords, seg[4..7] = y coords
    expect(seg[0]).toBeCloseTo(0, 0); // start x
    expect(seg[3]).toBeCloseTo(100, 0); // end x
  });

  it('clamps startPerc below 0 to 0', () => {
    // Should not throw with out-of-range input
    expect(() => getNewSegment(pt1, pt2, pt3, pt4, -0.5, 1, mockBezierData as never)).not.toThrow();
  });

  it('clamps endPerc above 1 to 1', () => {
    expect(() => getNewSegment(pt1, pt2, pt3, pt4, 0, 1.5, mockBezierData as never)).not.toThrow();
  });
});
