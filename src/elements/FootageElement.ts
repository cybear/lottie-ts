// @ts-nocheck
import { extendPrototype } from '../utils/functionExtensions';
import { getExpressionInterfaces } from '../utils/common';
import RenderableElement from './helpers/RenderableElement';
import BaseElement from './BaseElement';
import FrameElement from './helpers/FrameElement';

class FootageElement {
  constructor(data, globalData, comp) {
    this.initFrame();
    this.initRenderable();
    this.assetData = globalData.getAssetData(data.refId);
    this.footageData = globalData.imageLoader.getAsset(this.assetData);
    this.initBaseData(data, globalData, comp);
  }

  prepareFrame() {}

  getBaseElement() {
    return null;
  }

  renderFrame() {}

  destroy() {}

  getFootageData() {
    return this.footageData;
  }
}

extendPrototype([RenderableElement, BaseElement, FrameElement], FootageElement);

FootageElement.prototype.initExpressions = function () {
  const expressionsInterfaces = getExpressionInterfaces();
  if (!expressionsInterfaces) {
    return;
  }
  const FootageInterface = expressionsInterfaces('footage');
  this.layerInterface = FootageInterface(this);
};

export default FootageElement;
