import { createTypedArray } from '../helpers/arrays';
import poolFactory from './pool_factory';

const pointPool = (function () {
  function create(): Float32Array {
    return createTypedArray('float32', 2) as Float32Array;
  }
  return poolFactory(8, create);
})();

export default pointPool;
