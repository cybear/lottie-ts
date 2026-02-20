import { bmPow, bmFloor, bmSqrt, getDefaultCurveSegments } from './common';
import { createSizedArray, createTypedArray } from './helpers/arrays';
import segmentsLengthPool from './pooling/segments_length_pool';
import bezierLengthPool from './pooling/bezier_length_pool';

type NumberArray = ArrayLike<number> & { length: number };

interface BezierLengthData {
  percents: number[];
  lengths: number[];
  addedLength: number;
}

interface SegmentsLength {
  lengths: BezierLengthData[];
  totalLength: number;
}

interface ShapeData {
  c: boolean;
  v: NumberArray[];
  o: NumberArray[];
  i: NumberArray[];
  _length: number;
}

function bezFunction() {
  const math = Math;

  function pointOnLine2D(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): boolean {
    const det1 = x1 * y2 + y1 * x3 + x2 * y3 - x3 * y2 - y3 * x1 - x2 * y1;
    return det1 > -0.001 && det1 < 0.001;
  }

  function pointOnLine3D(
    x1: number,
    y1: number,
    z1: number,
    x2: number,
    y2: number,
    z2: number,
    x3: number,
    y3: number,
    z3: number,
  ): boolean {
    if (z1 === 0 && z2 === 0 && z3 === 0) {
      return pointOnLine2D(x1, y1, x2, y2, x3, y3);
    }
    const dist1 = math.sqrt(math.pow(x2 - x1, 2) + math.pow(y2 - y1, 2) + math.pow(z2 - z1, 2));
    const dist2 = math.sqrt(math.pow(x3 - x1, 2) + math.pow(y3 - y1, 2) + math.pow(z3 - z1, 2));
    const dist3 = math.sqrt(math.pow(x3 - x2, 2) + math.pow(y3 - y2, 2) + math.pow(z3 - z2, 2));
    let diffDist: number;
    if (dist1 > dist2) {
      if (dist1 > dist3) {
        diffDist = dist1 - dist2 - dist3;
      } else {
        diffDist = dist3 - dist2 - dist1;
      }
    } else if (dist3 > dist2) {
      diffDist = dist3 - dist2 - dist1;
    } else {
      diffDist = dist2 - dist1 - dist3;
    }
    return diffDist > -0.0001 && diffDist < 0.0001;
  }

  const getBezierLength = (function () {
    return function (pt1: NumberArray, pt2: NumberArray, pt3: NumberArray, pt4: NumberArray): BezierLengthData {
      const curveSegments = getDefaultCurveSegments();
      let k: number;
      let i: number;
      let ptCoord: number;
      let perc: number;
      let addedLength = 0;
      let ptDistance: number;
      const point: number[] = [];
      const lastPoint: number[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lengthData: BezierLengthData = (bezierLengthPool as any).newElement();
      const len = pt3.length;
      for (k = 0; k < curveSegments; k += 1) {
        perc = k / (curveSegments - 1);
        ptDistance = 0;
        for (i = 0; i < len; i += 1) {
          ptCoord =
            bmPow(1 - perc, 3) * pt1[i] +
            3 * bmPow(1 - perc, 2) * perc * pt3[i] +
            3 * (1 - perc) * bmPow(perc, 2) * pt4[i] +
            bmPow(perc, 3) * pt2[i];
          point[i] = ptCoord;
          if (lastPoint[i] !== null) {
            ptDistance += bmPow(point[i] - lastPoint[i], 2);
          }
          lastPoint[i] = point[i];
        }
        if (ptDistance) {
          ptDistance = bmSqrt(ptDistance);
          addedLength += ptDistance;
        }
        lengthData.percents[k] = perc;
        lengthData.lengths[k] = addedLength;
      }
      lengthData.addedLength = addedLength;
      return lengthData;
    };
  })();

  function getSegmentsLength(shapeData: ShapeData): SegmentsLength {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const segmentsLength: SegmentsLength = (segmentsLengthPool as any).newElement();
    const closed = shapeData.c;
    const pathV = shapeData.v;
    const pathO = shapeData.o;
    const pathI = shapeData.i;
    let i: number;
    const len = shapeData._length;
    const lengths = segmentsLength.lengths;
    let totalLength = 0;
    for (i = 0; i < len - 1; i += 1) {
      lengths[i] = getBezierLength(pathV[i], pathV[i + 1], pathO[i], pathI[i + 1]);
      totalLength += lengths[i].addedLength;
    }
    if (closed && len) {
      lengths[i] = getBezierLength(pathV[i], pathV[0], pathO[i], pathI[0]);
      totalLength += lengths[i].addedLength;
    }
    segmentsLength.totalLength = totalLength;
    return segmentsLength;
  }

  interface BezierDataType {
    segmentLength: number;
    points: PointDataType[];
  }
  interface PointDataType {
    partialLength: number;
    point: unknown[];
  }

  function BezierData(this: BezierDataType, length: number) {
    this.segmentLength = 0;
    this.points = new Array(length);
  }

  function PointData(this: PointDataType, partial: number, point: unknown[]) {
    this.partialLength = partial;
    this.point = point;
  }

  const buildBezierData = (function () {
    const storedData: Record<string, BezierDataType> = {};

    return function (pt1: NumberArray, pt2: NumberArray, pt3: NumberArray, pt4: NumberArray): BezierDataType {
      const bezierName = (
        pt1[0] +
        '_' +
        pt1[1] +
        '_' +
        pt2[0] +
        '_' +
        pt2[1] +
        '_' +
        pt3[0] +
        '_' +
        pt3[1] +
        '_' +
        pt4[0] +
        '_' +
        pt4[1]
      ).replace(/\./g, 'p');
      if (!storedData[bezierName]) {
        let curveSegments = getDefaultCurveSegments();
        let k: number;
        let i: number;
        let ptCoord: number;
        let perc: number;
        let addedLength = 0;
        let ptDistance: number;
        let point: unknown[];
        let lastPoint: number[] | null = null;
        if (
          pt1.length === 2 &&
          (pt1[0] !== pt2[0] || pt1[1] !== pt2[1]) &&
          pointOnLine2D(pt1[0], pt1[1], pt2[0], pt2[1], pt1[0] + pt3[0], pt1[1] + pt3[1]) &&
          pointOnLine2D(pt1[0], pt1[1], pt2[0], pt2[1], pt2[0] + pt4[0], pt2[1] + pt4[1])
        ) {
          curveSegments = 2;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const bezierData: BezierDataType = new (BezierData as any)(curveSegments);
        const len = pt3.length;
        for (k = 0; k < curveSegments; k += 1) {
          point = createSizedArray(len) as unknown[];
          perc = k / (curveSegments - 1);
          ptDistance = 0;
          for (i = 0; i < len; i += 1) {
            ptCoord =
              bmPow(1 - perc, 3) * pt1[i] +
              3 * bmPow(1 - perc, 2) * perc * (pt1[i] + pt3[i]) +
              3 * (1 - perc) * bmPow(perc, 2) * (pt2[i] + pt4[i]) +
              bmPow(perc, 3) * pt2[i];
            (point as number[])[i] = ptCoord;
            if (lastPoint !== null) {
              ptDistance += bmPow((point as number[])[i] - lastPoint[i], 2);
            }
          }
          ptDistance = bmSqrt(ptDistance);
          addedLength += ptDistance;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          bezierData.points[k] = new (PointData as any)(ptDistance, point);
          lastPoint = point as number[];
        }
        bezierData.segmentLength = addedLength;
        storedData[bezierName] = bezierData;
      }
      return storedData[bezierName];
    };
  })();

  function getDistancePerc(perc: number, bezierData: BezierLengthData): number {
    const percents = bezierData.percents;
    const lengths = bezierData.lengths;
    const len = percents.length;
    let initPos = bmFloor((len - 1) * perc);
    const lengthPos = perc * bezierData.addedLength;
    let lPerc = 0;
    if (initPos === len - 1 || initPos === 0 || lengthPos === lengths[initPos]) {
      return percents[initPos];
    }
    const dir = lengths[initPos] > lengthPos ? -1 : 1;
    let flag = true;
    while (flag) {
      if (lengths[initPos] <= lengthPos && lengths[initPos + 1] > lengthPos) {
        lPerc = (lengthPos - lengths[initPos]) / (lengths[initPos + 1] - lengths[initPos]);
        flag = false;
      } else {
        initPos += dir;
      }
      if (initPos < 0 || initPos >= len - 1) {
        // FIX for TypedArrays that don't store floating point values with enough accuracy
        if (initPos === len - 1) {
          return percents[initPos];
        }
        flag = false;
      }
    }
    return percents[initPos] + (percents[initPos + 1] - percents[initPos]) * lPerc;
  }

  function getPointInSegment(
    pt1: NumberArray,
    pt2: NumberArray,
    pt3: NumberArray,
    pt4: NumberArray,
    percent: number,
    bezierData: BezierLengthData,
  ): [number, number] {
    const t1 = getDistancePerc(percent, bezierData);
    const u1 = 1 - t1;
    const ptX =
      math.round(
        (u1 * u1 * u1 * pt1[0] +
          (t1 * u1 * u1 + u1 * t1 * u1 + u1 * u1 * t1) * pt3[0] +
          (t1 * t1 * u1 + u1 * t1 * t1 + t1 * u1 * t1) * pt4[0] +
          t1 * t1 * t1 * pt2[0]) *
          1000,
      ) / 1000;
    const ptY =
      math.round(
        (u1 * u1 * u1 * pt1[1] +
          (t1 * u1 * u1 + u1 * t1 * u1 + u1 * u1 * t1) * pt3[1] +
          (t1 * t1 * u1 + u1 * t1 * t1 + t1 * u1 * t1) * pt4[1] +
          t1 * t1 * t1 * pt2[1]) *
          1000,
      ) / 1000;
    return [ptX, ptY];
  }

  const bezierSegmentPoints = createTypedArray('float32', 8) as Float32Array;

  function getNewSegment(
    pt1: NumberArray,
    pt2: NumberArray,
    pt3: NumberArray,
    pt4: NumberArray,
    startPerc: number,
    endPerc: number,
    bezierData: BezierLengthData,
  ): Float32Array {
    if (startPerc < 0) {
      startPerc = 0;
    } else if (startPerc > 1) {
      startPerc = 1;
    }
    const t0 = getDistancePerc(startPerc, bezierData);
    endPerc = endPerc > 1 ? 1 : endPerc;
    const t1 = getDistancePerc(endPerc, bezierData);
    let i: number;
    const len = pt1.length;
    const u0 = 1 - t0;
    const u1 = 1 - t1;
    const u0u0u0 = u0 * u0 * u0;
    const t0u0u0_3 = t0 * u0 * u0 * 3; // eslint-disable-line camelcase
    const t0t0u0_3 = t0 * t0 * u0 * 3; // eslint-disable-line camelcase
    const t0t0t0 = t0 * t0 * t0;
    const u0u0u1 = u0 * u0 * u1;
    const t0u0u1_3 = t0 * u0 * u1 + u0 * t0 * u1 + u0 * u0 * t1; // eslint-disable-line camelcase
    const t0t0u1_3 = t0 * t0 * u1 + u0 * t0 * t1 + t0 * u0 * t1; // eslint-disable-line camelcase
    const t0t0t1 = t0 * t0 * t1;
    const u0u1u1 = u0 * u1 * u1;
    const t0u1u1_3 = t0 * u1 * u1 + u0 * t1 * u1 + u0 * u1 * t1; // eslint-disable-line camelcase
    const t0t1u1_3 = t0 * t1 * u1 + u0 * t1 * t1 + t0 * u1 * t1; // eslint-disable-line camelcase
    const t0t1t1 = t0 * t1 * t1;
    const u1u1u1 = u1 * u1 * u1;
    const t1u1u1_3 = t1 * u1 * u1 + u1 * t1 * u1 + u1 * u1 * t1; // eslint-disable-line camelcase
    const t1t1u1_3 = t1 * t1 * u1 + u1 * t1 * t1 + t1 * u1 * t1; // eslint-disable-line camelcase
    const t1t1t1 = t1 * t1 * t1;
    for (i = 0; i < len; i += 1) {
      bezierSegmentPoints[i * 4] =
        math.round((u0u0u0 * pt1[i] + t0u0u0_3 * pt3[i] + t0t0u0_3 * pt4[i] + t0t0t0 * pt2[i]) * 1000) / 1000; // eslint-disable-line camelcase
      bezierSegmentPoints[i * 4 + 1] =
        math.round((u0u0u1 * pt1[i] + t0u0u1_3 * pt3[i] + t0t0u1_3 * pt4[i] + t0t0t1 * pt2[i]) * 1000) / 1000; // eslint-disable-line camelcase
      bezierSegmentPoints[i * 4 + 2] =
        math.round((u0u1u1 * pt1[i] + t0u1u1_3 * pt3[i] + t0t1u1_3 * pt4[i] + t0t1t1 * pt2[i]) * 1000) / 1000; // eslint-disable-line camelcase
      bezierSegmentPoints[i * 4 + 3] =
        math.round((u1u1u1 * pt1[i] + t1u1u1_3 * pt3[i] + t1t1u1_3 * pt4[i] + t1t1t1 * pt2[i]) * 1000) / 1000; // eslint-disable-line camelcase
    }

    return bezierSegmentPoints;
  }

  return {
    getSegmentsLength,
    getNewSegment,
    getPointInSegment,
    buildBezierData,
    pointOnLine2D,
    pointOnLine3D,
  };
}

const bez = bezFunction();

export default bez;
