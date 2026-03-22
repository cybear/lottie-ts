import { extendPrototype } from '../utils/functionExtensions';
import { getExpressionInterfaces } from '../utils/common';
import type { GlobalData, ImageLoaderLike, RefIdLayerData } from '../types/lottieRuntime';
import RenderableElement from './helpers/RenderableElement';
import BaseElement from './BaseElement';
import FrameElement from './helpers/FrameElement';

class FootageElement {
  declare initFrame: () => void;
  declare initRenderable: () => void;
  declare initBaseData: (data: RefIdLayerData, globalData: GlobalData, comp: unknown) => void;
  declare layerInterface: unknown;

  assetData: unknown;
  footageData: unknown;

  constructor(data: RefIdLayerData, globalData: GlobalData, comp: unknown) {
    this.initFrame();
    this.initRenderable();
    this.assetData = globalData.getAssetData!(data.refId);
    const imageLoader = globalData.imageLoader as ImageLoaderLike;
    this.footageData = imageLoader.getAsset(this.assetData);
    this.initBaseData(data, globalData, comp);
  }

  prepareFrame() {}

  getBaseElement(): null {
    return null;
  }

  renderFrame() {}

  destroy() {}

  getFootageData() {
    return this.footageData;
  }

  initExpressions() {
    const expressionsInterfaces = getExpressionInterfaces();
    if (!expressionsInterfaces) {
      return;
    }
    const FootageInterface = expressionsInterfaces('footage');
    this.layerInterface = FootageInterface(this);
  }
}

const footageInitExpressions = FootageElement.prototype.initExpressions;

extendPrototype([RenderableElement, BaseElement, FrameElement], FootageElement);

FootageElement.prototype.initExpressions = footageInitExpressions;

export default FootageElement;
