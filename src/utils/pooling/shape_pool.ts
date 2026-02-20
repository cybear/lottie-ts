import poolFactory from './pool_factory';
import pointPool from './point_pool';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import ShapePath from '../shapes/ShapePath';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ShapePathInstance = any;

const shapePool = (function () {
  function create(): ShapePathInstance {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (ShapePath as any)();
  }

  function release(shapePath: ShapePathInstance): void {
    const len = shapePath._length;
    let i: number;
    for (i = 0; i < len; i += 1) {
      pointPool.release(shapePath.v[i]);
      pointPool.release(shapePath.i[i]);
      pointPool.release(shapePath.o[i]);
      shapePath.v[i] = null;
      shapePath.i[i] = null;
      shapePath.o[i] = null;
    }
    shapePath._length = 0;
    shapePath.c = false;
  }

  function clone(shape: ShapePathInstance): ShapePathInstance {
    const cloned = factory.newElement();
    let i: number;
    const len = shape._length === undefined ? shape.v.length : shape._length;
    cloned.setLength(len);
    cloned.c = shape.c;

    for (i = 0; i < len; i += 1) {
      cloned.setTripleAt(shape.v[i][0], shape.v[i][1], shape.o[i][0], shape.o[i][1], shape.i[i][0], shape.i[i][1], i);
    }
    return cloned;
  }

  const factory = poolFactory(4, create, release);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (factory as any).clone = clone;

  return factory;
})();

export default shapePool;
