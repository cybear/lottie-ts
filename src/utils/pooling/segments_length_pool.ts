import bezierLengthPool from './bezier_length_pool';
import poolFactory from './pool_factory';

interface BezierLengthElement {
  addedLength: number;
  percents: Float32Array;
  lengths: Float32Array;
}

interface SegmentsLengthElement {
  lengths: BezierLengthElement[];
  totalLength: number;
}

const segmentsLengthPool = (function () {
  function create(): SegmentsLengthElement {
    return {
      lengths: [],
      totalLength: 0,
    };
  }

  function release(element: SegmentsLengthElement): void {
    let i: number;
    const len = element.lengths.length;
    for (i = 0; i < len; i += 1) {
      bezierLengthPool.release(element.lengths[i]);
    }
    element.lengths.length = 0;
  }

  return poolFactory(8, create, release);
}());

export default segmentsLengthPool;
