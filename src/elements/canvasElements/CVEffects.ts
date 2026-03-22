import type { BaseInitLayerData, RenderableComponentEntry } from '../../types/lottieRuntime';
import type EffectsManager from '../../EffectsManager';

/** Canvas effect instance registered via `registerEffect`. */
export interface CvRegisteredEffectInstance {
  renderFrame(_isFirstFrame: boolean): void;
  type?: string | number;
}

type CvEffectConstructor = new (effectRow: unknown, elem: CVEffectsLayerHost) => CvRegisteredEffectInstance;

const registeredEffects: Partial<Record<number, { effect: CvEffectConstructor }>> = {};

/** Layer host for `CVEffects` (canvas / HTML canvas-style path). */
export interface CVEffectsLayerHost {
  data: BaseInitLayerData;
  effectsManager: EffectsManager;
  addRenderableComponent(c: RenderableComponentEntry): void;
}

class CVEffects {
  filters: CvRegisteredEffectInstance[];

  constructor(elem: CVEffectsLayerHost) {
    let i: number;
    const ef = elem.data.ef;
    const len = ef ? ef.length : 0;
    this.filters = [];
    let filterManager: CvRegisteredEffectInstance | null;
    for (i = 0; i < len; i += 1) {
      filterManager = null;
      const type = ef![i].ty as number;
      const reg = registeredEffects[type];
      if (reg) {
        const Effect = reg.effect;
        filterManager = new Effect(elem.effectsManager.effectElements[i], elem);
      }
      if (filterManager) {
        this.filters.push(filterManager);
      }
    }
    if (this.filters.length) {
      elem.addRenderableComponent(this);
    }
  }

  renderFrame(_isFirstFrame: boolean) {
    let i: number;
    const len = this.filters.length;
    for (i = 0; i < len; i += 1) {
      this.filters[i].renderFrame(_isFirstFrame);
    }
  }

  getEffects(type: string | number) {
    let i: number;
    const len = this.filters.length;
    const effects: CvRegisteredEffectInstance[] = [];
    for (i = 0; i < len; i += 1) {
      if (this.filters[i].type === type) {
        effects.push(this.filters[i]);
      }
    }
    return effects;
  }
}

export function registerEffect(id: number, effect: CvEffectConstructor): void {
  registeredEffects[id] = {
    effect,
  };
}

export default CVEffects;
