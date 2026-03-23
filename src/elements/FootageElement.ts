import { getExpressionInterfaces } from '../utils/common';
import type { GlobalData, ImageLoaderLike, RefIdLayerData } from '../types/lottieRuntime';
import RenderableElement from './helpers/RenderableElement';
import BaseElement from './BaseElement';
import FrameElement from './helpers/FrameElement';

class FootageElement extends BaseElement {
  declare initFrame: () => void;
  declare initRenderable: () => void;

  assetData: unknown;
  footageData: unknown;

  constructor(data: RefIdLayerData, globalData: GlobalData, comp: unknown) {
    super();
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
const getRequiredDescriptor = (proto: object, key: string): PropertyDescriptor => {
  const desc = Object.getOwnPropertyDescriptor(proto, key);
  if (!desc) {
    throw new Error(`Missing descriptor for ${key}`);
  }
  return desc;
};

Object.defineProperties(FootageElement.prototype, {
  initRenderable: getRequiredDescriptor(RenderableElement.prototype, 'initRenderable'),
  addRenderableComponent: getRequiredDescriptor(RenderableElement.prototype, 'addRenderableComponent'),
  removeRenderableComponent: getRequiredDescriptor(RenderableElement.prototype, 'removeRenderableComponent'),
  prepareRenderableFrame: getRequiredDescriptor(RenderableElement.prototype, 'prepareRenderableFrame'),
  checkLayerLimits: getRequiredDescriptor(RenderableElement.prototype, 'checkLayerLimits'),
  renderRenderable: getRequiredDescriptor(RenderableElement.prototype, 'renderRenderable'),
  initFrame: getRequiredDescriptor(FrameElement.prototype, 'initFrame'),
  prepareProperties: getRequiredDescriptor(FrameElement.prototype, 'prepareProperties'),
  addDynamicProperty: getRequiredDescriptor(FrameElement.prototype, 'addDynamicProperty'),
});

FootageElement.prototype.initExpressions = footageInitExpressions;

export default FootageElement;
