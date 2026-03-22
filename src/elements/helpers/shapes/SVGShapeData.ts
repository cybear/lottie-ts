/** Transformer entry with animated matrix props (shape pipeline). */
export interface ShapeTransformerLike {
  mProps: { dynamicProperties: unknown[] };
}

class SVGShapeData {
  caches: unknown[];
  styles: unknown[];
  transformers: ShapeTransformerLike[];
  lStr: string;
  sh: { k?: unknown };
  lvl: number;
  _isAnimated: boolean;

  constructor(transformers: ShapeTransformerLike[], level: number, shape: { k?: unknown }) {
    this.caches = [];
    this.styles = [];
    this.transformers = transformers;
    this.lStr = '';
    this.sh = shape;
    this.lvl = level;
    // TODO find if there are some cases where _isAnimated can be false.
    // For now, since shapes add up with other shapes. They have to be calculated every time.
    // One way of finding out is checking if all styles associated to this shape depend only of this shape
    this._isAnimated = !!shape.k;
    // TODO: commenting this for now since all shapes are animated
    let i = 0;
    const len = transformers.length;
    while (i < len) {
      if (transformers[i].mProps.dynamicProperties.length) {
        this._isAnimated = true;
        break;
      }
      i += 1;
    }
  }

  setAsAnimated() {
    this._isAnimated = true;
  }
}

export default SVGShapeData;
