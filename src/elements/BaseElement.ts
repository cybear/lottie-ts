// @ts-nocheck
import { createElementID, getExpressionInterfaces } from '../utils/common';
import getBlendMode from '../utils/helpers/blendModes';
import EffectsManager from '../EffectsManager';

class BaseElement {
  checkMasks() {
    if (!this.data.hasMask) {
      return false;
    }
    let i = 0;
    const len = this.data.masksProperties.length;
    while (i < len) {
      if (this.data.masksProperties[i].mode !== 'n' && this.data.masksProperties[i].cl !== false) {
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
    this.layerInterface = LayerExpressionInterface(this);
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
    const blendModeValue = getBlendMode(this.data.bm);
    const elem = this.baseElement || this.layerElement;

    elem.style['mix-blend-mode'] = blendModeValue;
  }

  initBaseData(data, globalData, comp) {
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
