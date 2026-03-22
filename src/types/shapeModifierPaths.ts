/**
 * Minimal path shapes used by shape modifiers (ShapePath / shape pool).
 * Shared by strictly typed modifier modules.
 */

/** Input path from `shape.paths.shapes` (subset used by zig-zag / pucker). */
export interface LottieBezierInputPath {
  c: boolean;
  _length: number;
  v: number[][];
  o: number[][];
  i: number[][];
  length(): number;
}

/** Output / working path from `shapePool.newElement()` (ShapePath; points are pooled `Float32Array`). */
export interface PooledShapePath {
  c: boolean;
  _length: number;
  v: (Float32Array | null)[];
  o: (Float32Array | null)[];
  i: (Float32Array | null)[];
  length(): number;
  setTripleAt(
    vX: number,
    vY: number,
    oX: number,
    oY: number,
    iX: number,
    iY: number,
    index: number,
    replace?: boolean,
  ): void;
}

/** Bezier segment from `PolynomialBezier.shapeSegment`. */
export interface ZigZagBezierSegment {
  normalAngle(t: number): number;
  point(t: number): number[];
  points: number[][];
}
