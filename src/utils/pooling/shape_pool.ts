import poolFactory from './pool_factory';
import pointPool from './point_pool';
import ShapePath from '../shapes/ShapePath';

type ShapePathInstance = ShapePath;

const shapePool = (function () {
  function create(): ShapePathInstance {
    return new ShapePath();
  }

  function release(shapePath: ShapePathInstance): void {
    const len = shapePath._length;
    let i: number;
    for (i = 0; i < len; i += 1) {
      const pv = shapePath.v[i];
      const pi = shapePath.i[i];
      const po = shapePath.o[i];
      if (pv) pointPool.release(pv);
      if (pi) pointPool.release(pi);
      if (po) pointPool.release(po);
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
      const v = shape.v[i];
      const inn = shape.i[i];
      const out = shape.o[i];
      if (v && inn && out) {
        cloned.setTripleAt(v[0], v[1], out[0], out[1], inn[0], inn[1], i, false);
      }
    }
    return cloned;
  }

  const factory = poolFactory(4, create, release);
  (factory as typeof factory & { clone: typeof clone }).clone = clone;

  return factory;
})();

export default shapePool;
