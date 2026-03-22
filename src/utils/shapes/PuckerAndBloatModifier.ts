import PropertyFactory from '../PropertyFactory';
import shapePool from '../pooling/shape_pool';
import { ShapeModifier } from './ShapeModifiers';
import type { ElementData, ModifierHostElement, NumericAnimatedProperty } from '../../types/lottieRuntime';
import type { LottieBezierInputPath, PooledShapePath } from '../../types/shapeModifierPaths';

interface PuckerModifierPayload extends ElementData {
  a?: unknown;
}

interface LocalShapeCollection {
  releaseShapes(): void;
  addShape(shape: PooledShapePath): void;
}

interface PuckerShapeBundle {
  shape: {
    _mdf: boolean;
    paths: { shapes: LottieBezierInputPath[]; _length: number } | LocalShapeCollection;
  };
  localShapeCollection: LocalShapeCollection;
}

class PuckerAndBloatModifier extends ShapeModifier {
  declare amount: NumericAnimatedProperty;

  initModifierProperties(elem: ModifierHostElement, data: PuckerModifierPayload) {
    this.getValue = this.processKeys;
    this.amount = PropertyFactory.getProp(elem, data.a, 0, null, this) as NumericAnimatedProperty;
    this._isAnimated = !!this.amount.effectsSequence.length;
  }

  processPath(path: LottieBezierInputPath, amount: number): PooledShapePath {
    const percent = amount / 100;
    const centerPoint = [0, 0];
    const pathLength = path._length;
    let i = 0;
    for (i = 0; i < pathLength; i += 1) {
      centerPoint[0] += path.v[i][0];
      centerPoint[1] += path.v[i][1];
    }
    centerPoint[0] /= pathLength;
    centerPoint[1] /= pathLength;
    const clonedPath = shapePool.newElement() as PooledShapePath;
    clonedPath.c = path.c;
    let vX: number;
    let vY: number;
    let oX: number;
    let oY: number;
    let iX: number;
    let iY: number;
    for (i = 0; i < pathLength; i += 1) {
      vX = path.v[i][0] + (centerPoint[0] - path.v[i][0]) * percent;
      vY = path.v[i][1] + (centerPoint[1] - path.v[i][1]) * percent;
      oX = path.o[i][0] + (centerPoint[0] - path.o[i][0]) * -percent;
      oY = path.o[i][1] + (centerPoint[1] - path.o[i][1]) * -percent;
      iX = path.i[i][0] + (centerPoint[0] - path.i[i][0]) * -percent;
      iY = path.i[i][1] + (centerPoint[1] - path.i[i][1]) * -percent;
      clonedPath.setTripleAt(vX, vY, oX, oY, iX, iY, i);
    }
    return clonedPath;
  }

  processShapes(_isFirstFrame: boolean) {
    let shapePaths: LottieBezierInputPath[];
    let i: number;
    const len = this.shapes.length;
    let j: number;
    let jLen: number;
    const amount = this.amount.v;

    if (amount !== 0) {
      let shapeData: PuckerShapeBundle;
      let localShapeCollection: LocalShapeCollection;
      for (i = 0; i < len; i += 1) {
        shapeData = this.shapes[i] as PuckerShapeBundle;
        localShapeCollection = shapeData.localShapeCollection;
        if (!(!shapeData.shape._mdf && !this._mdf && !_isFirstFrame)) {
          localShapeCollection.releaseShapes();
          shapeData.shape._mdf = true;
          const pathsBlock = shapeData.shape.paths as { shapes: LottieBezierInputPath[]; _length: number };
          shapePaths = pathsBlock.shapes;
          jLen = pathsBlock._length;
          for (j = 0; j < jLen; j += 1) {
            localShapeCollection.addShape(this.processPath(shapePaths[j], amount));
          }
        }
        shapeData.shape.paths = shapeData.localShapeCollection;
      }
    }
    if (!this.dynamicProperties.length) {
      this._mdf = false;
    }
  }
}

export default PuckerAndBloatModifier;
