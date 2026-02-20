import {
  createSizedArray,
} from '../helpers/arrays';
import pooling from './pooling';

const poolFactory = (function () {
  return function <T>(
    initialLength: number,
    _create: () => T,
    _release?: (element: T) => void,
  ): { newElement: () => T; release: (element: T) => void } {
    let _length = 0;
    let _maxLength = initialLength;
    let pool = createSizedArray(_maxLength) as T[];

    const ob = {
      newElement,
      release,
    };

    function newElement(): T {
      let element: T;
      if (_length) {
        _length -= 1;
        element = pool[_length];
      } else {
        element = _create();
      }
      return element;
    }

    function release(element: T): void {
      if (_length === _maxLength) {
        pool = pooling.double(pool as unknown[]) as T[];
        _maxLength *= 2;
      }
      if (_release) {
        _release(element);
      }
      pool[_length] = element;
      _length += 1;
    }

    return ob;
  };
}());

export default poolFactory;
