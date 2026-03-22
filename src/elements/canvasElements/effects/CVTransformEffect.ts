import TransformEffect from '../../../effects/TransformEffect';
import type { GroupEffectLike } from '../../../types/lottieRuntime';

class CVTransformEffect extends TransformEffect {
  constructor(effectsManager: GroupEffectLike) {
    super();
    this.init(effectsManager);
  }
}

export default CVTransformEffect;
