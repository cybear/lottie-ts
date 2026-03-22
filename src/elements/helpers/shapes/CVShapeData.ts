import ShapePropertyFactory from '../../../utils/shapes/ShapeProperty';
import type { ShapePropertyFactoryApi } from '../../../utils/shapes/shapePropertyFactoryTypes';

const shapePropFactory = ShapePropertyFactory as ShapePropertyFactoryApi;

interface CVShapeJson {
  ty: string;
}

interface CVStyleRow {
  closed?: boolean;
  transforms: unknown;
  elements: Array<{
    transforms: unknown;
    trNodes: unknown[];
  }>;
}

interface CVTransformsManagerLike {
  addTransformSequence(transforms: unknown): unknown;
}

type StyledShapeEntry = { transforms: unknown; trNodes: unknown[] };

class CVShapeData {
  styledShapes: StyledShapeEntry[];
  tr: number[];
  sh: unknown;
  _isAnimated?: boolean;

  constructor(element: unknown, data: CVShapeJson, styles: CVStyleRow[], transformsManager: CVTransformsManagerLike) {
    this.styledShapes = [];
    this.tr = [0, 0, 0, 0, 0, 0];
    let ty = 4;
    if (data.ty === 'rc') {
      ty = 5;
    } else if (data.ty === 'el') {
      ty = 6;
    } else if (data.ty === 'sr') {
      ty = 7;
    }
    this.sh = shapePropFactory.getShapeProp(element, data, ty);
    let i: number;
    const len = styles.length;
    let styledShape: StyledShapeEntry;
    for (i = 0; i < len; i += 1) {
      if (!styles[i].closed) {
        styledShape = {
          transforms: transformsManager.addTransformSequence(styles[i].transforms),
          trNodes: [],
        };
        this.styledShapes.push(styledShape);
        styles[i].elements.push(styledShape);
      }
    }
  }

  setAsAnimated() {
    this._isAnimated = true;
  }
}

export default CVShapeData;
