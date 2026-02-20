import {
  getDefaultCurveSegments,
} from '../common';
import {
  createTypedArray,
} from '../helpers/arrays';
import poolFactory from './pool_factory';

interface BezierLengthElement {
  addedLength: number;
  percents: Float32Array;
  lengths: Float32Array;
}

const bezierLengthPool = (function () {
  function create(): BezierLengthElement {
    return {
      addedLength: 0,
      percents: createTypedArray('float32', getDefaultCurveSegments()) as Float32Array,
      lengths: createTypedArray('float32', getDefaultCurveSegments()) as Float32Array,
    };
  }
  return poolFactory(8, create);
}());

export default bezierLengthPool;
