import {
  SliderEffect,
  AngleEffect,
  ColorEffect,
  PointEffect,
  LayerIndexEffect,
  MaskIndexEffect,
  CheckboxEffect,
  NoValueEffect,
} from './effects/SliderEffect';
import DynamicPropertyContainer from './utils/helpers/dynamicProperties';
import type { BaseInitLayerData, EffectJsonEntry } from './types/lottieRuntime';

type EffectHostElement = unknown;

class GroupEffect extends DynamicPropertyContainer {
  declare data: EffectJsonEntry;
  declare effectElements: unknown[];
  declare getValue: () => void;

  constructor(data: EffectJsonEntry, element: EffectHostElement) {
    super();
    this.getValue = this.iterateDynamicProperties;
    this.init(data, element);
  }

  init(data: EffectJsonEntry, element: EffectHostElement) {
    this.data = data;
    this.effectElements = [];
    this.initDynamicPropertyContainer(element);
    const effects = this.data.ef!;
    let i: number;
    const len = effects.length;
    let eff: unknown;
    for (i = 0; i < len; i += 1) {
      eff = null;
      switch (effects[i].ty) {
        case 0:
          eff = new SliderEffect(effects[i], element, this);
          break;
        case 1:
          eff = new AngleEffect(effects[i], element, this);
          break;
        case 2:
          eff = new ColorEffect(effects[i], element, this);
          break;
        case 3:
          eff = new PointEffect(effects[i], element, this);
          break;
        case 4:
        case 7:
          eff = new CheckboxEffect(effects[i], element, this);
          break;
        case 10:
          eff = new LayerIndexEffect(effects[i], element, this);
          break;
        case 11:
          eff = new MaskIndexEffect(effects[i], element, this);
          break;
        case 5:
          eff = new EffectsManager(effects[i], element, this);
          break;
        default:
          eff = new NoValueEffect(effects[i], element, this);
          break;
      }
      if (eff) {
        this.effectElements.push(eff);
      }
    }
  }
}

class EffectsManager {
  effectElements: GroupEffect[];

  constructor(data: BaseInitLayerData | EffectJsonEntry, element: EffectHostElement, _dynamicProperties?: unknown) {
    const effects = data.ef || [];
    this.effectElements = [];
    let i: number;
    const len = effects.length;
    let effectItem: GroupEffect;
    for (i = 0; i < len; i += 1) {
      effectItem = new GroupEffect(effects[i], element);
      this.effectElements.push(effectItem);
    }
  }
}

export default EffectsManager;
