// @ts-nocheck
import TransformEffect from '../../../effects/TransformEffect';

class SVGTransformEffect extends TransformEffect {
  constructor(_unused, filterManager) {
    super();
    this.init(filterManager);
  }
}

export default SVGTransformEffect;
