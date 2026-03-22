import TransformEffect from '../../../effects/TransformEffect';
import type { GroupEffectLike } from '../../../types/lottieRuntime';

class SVGTransformEffect extends TransformEffect {
  constructor(_unused: unknown, filterManager: GroupEffectLike, _elem?: unknown, _id?: string, _source?: string) {
    super();
    this.init(filterManager);
  }
}

export default SVGTransformEffect;
