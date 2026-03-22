interface TransformMPropsLike {
  dynamicProperties: unknown[];
}

interface TransformOpLike {
  effectsSequence: unknown[];
}

class SVGTransformData {
  transform: {
    mProps: TransformMPropsLike;
    op: TransformOpLike;
    container: unknown;
  };
  elements: unknown[];
  _isAnimated: number;

  constructor(mProps: TransformMPropsLike, op: TransformOpLike, container: unknown) {
    this.transform = {
      mProps: mProps,
      op: op,
      container: container,
    };
    this.elements = [];
    this._isAnimated = this.transform.mProps.dynamicProperties.length || this.transform.op.effectsSequence.length;
  }
}

export default SVGTransformData;
