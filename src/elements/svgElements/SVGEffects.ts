import { getLocationHref } from '../../main';
import { createElementID } from '../../utils/common';
import filtersFactory from '../../utils/filters';
import type { BaseInitLayerData, GlobalData, RenderableComponentEntry } from '../../types/lottieRuntime';
import type EffectsManager from '../../EffectsManager';

/** SVG filter instance registered via `registerEffect` (constructor varies per effect). */
export interface SvgRegisteredEffectInstance {
  renderFrame(_isFirstFrame: boolean): void;
  type?: string | number;
}

type SvgEffectConstructor = new (
  filter: SVGElement,
  filterManager: unknown,
  elem: SVGEffectsLayerHost,
  id: string,
  source: string,
) => SvgRegisteredEffectInstance;

const registeredEffects: Partial<Record<number, { effect: SvgEffectConstructor; countsAsEffect: boolean }>> = {};
const idPrefix = 'filter_result_';

/** Layer host for `SVGEffects` (SVG / hybrid SVG path). */
export interface SVGEffectsLayerHost {
  data: BaseInitLayerData;
  globalData: GlobalData;
  layerElement: SVGElement;
  effectsManager: EffectsManager;
  addRenderableComponent(c: RenderableComponentEntry): void;
}

class SVGEffects {
  filters: SvgRegisteredEffectInstance[];

  constructor(elem: SVGEffectsLayerHost) {
    let i: number;
    let source = 'SourceGraphic';
    const ef = elem.data.ef;
    const len = ef ? ef.length : 0;
    const filId = createElementID();
    const fil = filtersFactory.createFilter(filId, true);
    let count = 0;
    this.filters = [];
    let filterManager: SvgRegisteredEffectInstance | null;
    for (i = 0; i < len; i += 1) {
      filterManager = null;
      const type = ef![i].ty as number;
      const reg = registeredEffects[type];
      if (reg) {
        const Effect = reg.effect;
        filterManager = new Effect(fil, elem.effectsManager.effectElements[i], elem, idPrefix + count, source);
        source = idPrefix + count;
        if (reg.countsAsEffect) {
          count += 1;
        }
      }
      if (filterManager) {
        this.filters.push(filterManager);
      }
    }
    if (count) {
      (elem.globalData.defs as SVGDefsElement).appendChild(fil);
      elem.layerElement.setAttribute('filter', 'url(' + getLocationHref() + '#' + filId + ')');
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
    const effects: SvgRegisteredEffectInstance[] = [];
    for (i = 0; i < len; i += 1) {
      if (this.filters[i].type === type) {
        effects.push(this.filters[i]);
      }
    }
    return effects;
  }
}

export function registerEffect(id: number, effect: SvgEffectConstructor, countsAsEffect: boolean): void {
  registeredEffects[id] = {
    effect,
    countsAsEffect,
  };
}

export default SVGEffects;
