/** Cubic bezier path node triples (`v` = vertices, `i` / `o` = tangents). */
export interface BezierPathNodes {
  o: number[][];
  i: number[][];
  v: number[][];
}

export interface ShapePathMatrixHelper {
  applyToPointStringified(x: number, y: number): string;
}

/** Path segment as stored on shape collections (`_length`, `c` = closed). */
export type BezierPathNodesWithMeta = BezierPathNodes & {
  _length: number;
  c: boolean;
};

const buildShapeString = function (
  pathNodes: BezierPathNodes,
  length: number,
  closed: boolean,
  mat: ShapePathMatrixHelper,
): string {
  if (length === 0) {
    return '';
  }
  const _o = pathNodes.o;
  const _i = pathNodes.i;
  const _v = pathNodes.v;
  let i: number;
  let shapeString = ' M' + mat.applyToPointStringified(_v[0][0], _v[0][1]);
  for (i = 1; i < length; i += 1) {
    shapeString +=
      ' C' +
      mat.applyToPointStringified(_o[i - 1][0], _o[i - 1][1]) +
      ' ' +
      mat.applyToPointStringified(_i[i][0], _i[i][1]) +
      ' ' +
      mat.applyToPointStringified(_v[i][0], _v[i][1]);
  }
  if (closed && length) {
    shapeString +=
      ' C' +
      mat.applyToPointStringified(_o[i - 1][0], _o[i - 1][1]) +
      ' ' +
      mat.applyToPointStringified(_i[0][0], _i[0][1]) +
      ' ' +
      mat.applyToPointStringified(_v[0][0], _v[0][1]);
    shapeString += 'z';
  }
  return shapeString;
};

export default buildShapeString;
