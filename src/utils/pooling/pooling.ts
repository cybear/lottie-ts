import { createSizedArray } from '../helpers/arrays';

const pooling = (function () {
  function double(arr: unknown[]): unknown[] {
    return arr.concat(createSizedArray(arr.length));
  }

  return {
    double,
  };
})();

export default pooling;
