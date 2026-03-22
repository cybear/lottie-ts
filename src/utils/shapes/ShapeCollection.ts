import { createSizedArray } from '../helpers/arrays';
import shapePool from '../pooling/shape_pool';
import type ShapePath from './ShapePath';

class ShapeCollection {
  _length: number;
  _maxLength: number;
  shapes: ShapePath[];

  constructor() {
    this._length = 0;
    this._maxLength = 4;
    this.shapes = createSizedArray(this._maxLength) as ShapePath[];
  }

  addShape(shapeData: ShapePath) {
    if (this._length === this._maxLength) {
      this.shapes = this.shapes.concat(createSizedArray(this._maxLength) as ShapePath[]);
      this._maxLength *= 2;
    }
    this.shapes[this._length] = shapeData;
    this._length += 1;
  }

  releaseShapes() {
    let i: number;
    for (i = 0; i < this._length; i += 1) {
      shapePool.release(this.shapes[i]);
    }
    this._length = 0;
  }
}

export default ShapeCollection;
