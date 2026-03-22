import { createElementID, getExpressionInterfaces } from '../utils/common';
import getBlendMode from '../utils/helpers/blendModes';
import type { BaseInitLayerData, GlobalData, LayerDynamicProperty } from '../types/lottieRuntime';
import EffectsManager from '../EffectsManager';

/** Subset of the expression “layer” handle returned by the expressions plugin. */
interface ExpressionLayerInterface {
  registerMaskInterface(maskManager: unknown): void;
  registerEffectsInterface(effectsInterface: unknown): void;
  shapeInterface?: unknown;
  content?: unknown;
  textInterface?: unknown;
  text?: unknown;
}

class BaseElement {
  declare globalData: GlobalData;
  declare comp: unknown;
  declare data: BaseInitLayerData;
  declare layerId: string;
  declare effectsManager: EffectsManager;
  declare layerInterface: ExpressionLayerInterface;
  declare maskManager: unknown;
  declare shapesData: unknown;
  declare itemsData: unknown;
  declare compInterface: unknown;
  declare baseElement: HTMLElement | undefined;
  declare layerElement: HTMLElement | undefined;
  declare type: unknown;
  declare dynamicProperties: LayerDynamicProperty[];

  checkMasks() {
    if (!this.data.hasMask) {
      return false;
    }
    let i = 0;
    const len = this.data.masksProperties!.length;
    while (i < len) {
      if (this.data.masksProperties![i].mode !== 'n' && this.data.masksProperties![i].cl !== false) {
        return true;
      }
      i += 1;
    }
    return false;
  }

  initExpressions() {
    const expressionsInterfaces = getExpressionInterfaces();
    if (!expressionsInterfaces) {
      return;
    }
    const LayerExpressionInterface = expressionsInterfaces('layer');
    const EffectsExpressionInterface = expressionsInterfaces('effects');
    const ShapeExpressionInterface = expressionsInterfaces('shape');
    const TextExpressionInterface = expressionsInterfaces('text');
    const CompExpressionInterface = expressionsInterfaces('comp');
    this.layerInterface = LayerExpressionInterface(this) as ExpressionLayerInterface;
    if (this.data.hasMask && this.maskManager) {
      this.layerInterface.registerMaskInterface(this.maskManager);
    }
    const effectsInterface = EffectsExpressionInterface.createEffectsInterface(this, this.layerInterface);
    this.layerInterface.registerEffectsInterface(effectsInterface);

    if (this.data.ty === 0 || this.data.xt) {
      this.compInterface = CompExpressionInterface(this);
    } else if (this.data.ty === 4) {
      this.layerInterface.shapeInterface = ShapeExpressionInterface(
        this.shapesData,
        this.itemsData,
        this.layerInterface,
      );
      this.layerInterface.content = this.layerInterface.shapeInterface;
    } else if (this.data.ty === 5) {
      this.layerInterface.textInterface = TextExpressionInterface(this);
      this.layerInterface.text = this.layerInterface.textInterface;
    }
  }

  setBlendMode() {
    const blendModeValue = getBlendMode(this.data.bm ?? 0);
    const elem = this.baseElement || this.layerElement;
    (elem as HTMLElement).style.setProperty('mix-blend-mode', blendModeValue);
  }

  initBaseData(data: BaseInitLayerData, globalData: GlobalData, comp: unknown) {
    this.globalData = globalData;
    this.comp = comp;
    this.data = data;
    this.layerId = createElementID();

    // Stretch factor for old animations missing this property.
    if (!this.data.sr) {
      this.data.sr = 1;
    }
    // effects manager
    this.effectsManager = new EffectsManager(this.data, this, this.dynamicProperties);
  }

  getType() {
    return this.type;
  }

  sourceRectAtTime() {}
}

export default BaseElement;
