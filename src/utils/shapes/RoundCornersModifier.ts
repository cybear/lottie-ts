/* eslint-disable @typescript-eslint/no-explicit-any -- path pool / shape vertex graph */
import { roundCorner } from '../common';
import PropertyFactory from '../PropertyFactory';
import shapePool from '../pooling/shape_pool';
import { ShapeModifier } from './ShapeModifiers';

class RoundCornersModifier extends ShapeModifier {
  rd!: { v: number; effectsSequence: unknown[] };

  initModifierProperties(elem: unknown, data: { r: unknown }) {
    this.getValue = this.processKeys;
    this.rd = PropertyFactory.getProp(elem, data.r, 0, null, this) as RoundCornersModifier['rd'];
    this._isAnimated = !!this.rd.effectsSequence.length;
  }

  processPath(path: any, round: number) {
    const clonedPath = shapePool.newElement();
    clonedPath.c = path.c;
    let i;
    const len = path._length;
    let currentV;
    let currentI;
    let currentO;
    let closerV;
    let distance;
    let newPosPerc;
    let index = 0;
    let vX;
    let vY;
    let oX;
    let oY;
    let iX;
    let iY;
    for (i = 0; i < len; i += 1) {
      currentV = path.v[i];
      currentO = path.o[i];
      currentI = path.i[i];
      if (
        currentV[0] === currentO[0] &&
        currentV[1] === currentO[1] &&
        currentV[0] === currentI[0] &&
        currentV[1] === currentI[1]
      ) {
        if ((i === 0 || i === len - 1) && !path.c) {
          clonedPath.setTripleAt(
            currentV[0],
            currentV[1],
            currentO[0],
            currentO[1],
            currentI[0],
            currentI[1],
            index,
            false,
          );
          index += 1;
        } else {
          if (i === 0) {
            closerV = path.v[len - 1];
          } else {
            closerV = path.v[i - 1];
          }
          distance = Math.sqrt(Math.pow(currentV[0] - closerV[0], 2) + Math.pow(currentV[1] - closerV[1], 2));
          newPosPerc = distance ? Math.min(distance / 2, round) / distance : 0;
          iX = currentV[0] + (closerV[0] - currentV[0]) * newPosPerc;
          vX = iX;
          iY = currentV[1] - (currentV[1] - closerV[1]) * newPosPerc;
          vY = iY;
          oX = vX - (vX - currentV[0]) * roundCorner;
          oY = vY - (vY - currentV[1]) * roundCorner;
          clonedPath.setTripleAt(vX, vY, oX, oY, iX, iY, index, false);
          index += 1;

          if (i === len - 1) {
            closerV = path.v[0];
          } else {
            closerV = path.v[i + 1];
          }
          distance = Math.sqrt(Math.pow(currentV[0] - closerV[0], 2) + Math.pow(currentV[1] - closerV[1], 2));
          newPosPerc = distance ? Math.min(distance / 2, round) / distance : 0;
          oX = currentV[0] + (closerV[0] - currentV[0]) * newPosPerc;
          vX = oX;
          oY = currentV[1] + (closerV[1] - currentV[1]) * newPosPerc;
          vY = oY;
          iX = vX - (vX - currentV[0]) * roundCorner;
          iY = vY - (vY - currentV[1]) * roundCorner;
          clonedPath.setTripleAt(vX, vY, oX, oY, iX, iY, index, false);
          index += 1;
        }
      } else {
        clonedPath.setTripleAt(
          path.v[i][0],
          path.v[i][1],
          path.o[i][0],
          path.o[i][1],
          path.i[i][0],
          path.i[i][1],
          index,
          false,
        );
        index += 1;
      }
    }
    return clonedPath;
  }

  processShapes(_isFirstFrame: boolean) {
    let shapePaths;
    let i;
    const len = this.shapes.length;
    let j;
    let jLen;
    const rd = this.rd.v;

    if (rd !== 0) {
      let shapeData;
      let localShapeCollection;
      for (i = 0; i < len; i += 1) {
        shapeData = this.shapes[i];
        localShapeCollection = shapeData.localShapeCollection;
        const sh = shapeData.shape as any;
        if (!(!sh._mdf && !this._mdf && !_isFirstFrame)) {
          localShapeCollection.releaseShapes();
          sh._mdf = true;
          shapePaths = sh.paths.shapes;
          jLen = sh.paths._length;
          for (j = 0; j < jLen; j += 1) {
            localShapeCollection.addShape(this.processPath(shapePaths[j], rd));
          }
        }
        sh.paths = shapeData.localShapeCollection;
      }
    }
    if (!this.dynamicProperties.length) {
      this._mdf = false;
    }
  }
}

export default RoundCornersModifier;
