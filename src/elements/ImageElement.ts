import { copyPrototypeDescriptors } from '../utils/functionExtensions';

import createNS from '../utils/helpers/svg_elements';
import type { GlobalData, ImageAssetData, RefIdLayerData, SlotManagerLike } from '../types/lottieRuntime';
import BaseElement from './BaseElement';
import TransformElement from './helpers/TransformElement';
import SVGBaseElement from './svgElements/SVGBaseElement';
import HierarchyElement from './helpers/HierarchyElement';
import FrameElement from './helpers/FrameElement';
import RenderableDOMElement from './helpers/RenderableDOMElement';

class IImageElement {
  declare initElement: (data: RefIdLayerData, globalData: GlobalData, comp: unknown) => void;
  declare globalData: GlobalData;
  declare layerElement: SVGElement;

  assetData: ImageAssetData;
  innerElem!: SVGImageElement;
  sourceRect: { top: number; left: number; width: number; height: number };

  constructor(data: RefIdLayerData, globalData: GlobalData, comp: unknown) {
    let asset = globalData.getAssetData!(data.refId) as ImageAssetData;
    if (asset && asset.sid) {
      const slotManager = globalData.slotManager as SlotManagerLike;
      asset = slotManager.getProp(asset) as ImageAssetData;
    }
    this.assetData = asset;
    this.initElement(data, globalData, comp);
    this.sourceRect = {
      top: 0,
      left: 0,
      width: this.assetData.w,
      height: this.assetData.h,
    };
  }

  createContent() {
    const assetPath = this.globalData.getAssetsPath!(this.assetData);

    this.innerElem = createNS('image') as SVGImageElement;
    this.innerElem.setAttribute('width', `${this.assetData.w}px`);
    this.innerElem.setAttribute('height', `${this.assetData.h}px`);
    this.innerElem.setAttribute(
      'preserveAspectRatio',
      this.assetData.pr || this.globalData.renderConfig?.imagePreserveAspectRatio || '',
    );
    this.innerElem.setAttributeNS('http://www.w3.org/1999/xlink', 'href', assetPath);

    this.layerElement.appendChild(this.innerElem);
  }

  sourceRectAtTime() {
    return this.sourceRect;
  }
}

const imageSourceRectAtTime = IImageElement.prototype.sourceRectAtTime;

copyPrototypeDescriptors(
  [BaseElement, TransformElement, SVGBaseElement, HierarchyElement, FrameElement, RenderableDOMElement],
  IImageElement,
);

IImageElement.prototype.sourceRectAtTime = imageSourceRectAtTime;

export default IImageElement;
