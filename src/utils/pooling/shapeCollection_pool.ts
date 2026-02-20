import { createSizedArray } from '../helpers/arrays';
import shapePool from './shape_pool';
import pooling from './pooling';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import ShapeCollection from '../shapes/ShapeCollection';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ShapeCollectionInstance = any;

const shapeCollectionPool = (function () {
  const ob = {
    newShapeCollection,
    release,
  };

  let _length = 0;
  let _maxLength = 4;
  let pool = createSizedArray(_maxLength) as ShapeCollectionInstance[];

  function newShapeCollection(): ShapeCollectionInstance {
    let shapeCollection: ShapeCollectionInstance;
    if (_length) {
      _length -= 1;
      shapeCollection = pool[_length];
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      shapeCollection = new (ShapeCollection as any)();
    }
    return shapeCollection;
  }

  function release(shapeCollection: ShapeCollectionInstance): void {
    let i: number;
    const len = shapeCollection._length;
    for (i = 0; i < len; i += 1) {
      shapePool.release(shapeCollection.shapes[i]);
    }
    shapeCollection._length = 0;

    if (_length === _maxLength) {
      pool = pooling.double(pool as unknown[]) as ShapeCollectionInstance[];
      _maxLength *= 2;
    }
    pool[_length] = shapeCollection;
    _length += 1;
  }

  return ob;
})();

export default shapeCollectionPool;
