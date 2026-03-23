import { prototypeChainInheritanceOrder } from '../../utils/functionExtensions';
import createNS from '../../utils/helpers/svg_elements';
import RenderableElement from '../helpers/RenderableElement';
import BaseElement from '../BaseElement';
import TransformElement from '../helpers/TransformElement';
import HierarchyElement from '../helpers/HierarchyElement';
import FrameElement from '../helpers/FrameElement';
import HBaseElement from './HBaseElement';
import HSolidElement from './HSolidElement';
import type { GlobalData, GlobalDataImageHost, ImageAssetData, RefIdLayerData } from '../../types/lottieRuntime';

type HImageLayerData = RefIdLayerData & { hasMask?: boolean; ln?: string };

class HImageElement {
  declare initElement: (data: HImageLayerData, globalData: GlobalData, comp: unknown) => void;
  declare data: HImageLayerData;
  declare globalData: GlobalDataImageHost;
  declare layerElement: HTMLElement | SVGElement;
  declare baseElement: SVGElement;
  declare assetData: ImageAssetData;
  declare imageElem: SVGElement;

  constructor(data: HImageLayerData, globalData: GlobalDataImageHost, comp: unknown) {
    this.assetData = globalData.getAssetData(data.refId) as ImageAssetData;
    this.initElement(data, globalData, comp);
  }

  createContent() {
    const assetPath = this.globalData.getAssetsPath(this.assetData);
    const img = new Image();

    if (this.data.hasMask) {
      this.imageElem = createNS('image');
      this.imageElem.setAttribute('width', `${this.assetData.w}px`);
      this.imageElem.setAttribute('height', `${this.assetData.h}px`);
      this.imageElem.setAttributeNS('http://www.w3.org/1999/xlink', 'href', assetPath);
      this.layerElement.appendChild(this.imageElem);
      this.baseElement.setAttribute('width', String(this.assetData.w));
      this.baseElement.setAttribute('height', String(this.assetData.h));
    } else {
      this.layerElement.appendChild(img);
    }
    img.crossOrigin = 'anonymous';
    img.src = assetPath;
    if (this.data.ln) {
      this.baseElement.setAttribute('id', this.data.ln);
    }
  }
}

const hImageCreateContent = HImageElement.prototype.createContent;

const copyPrototypeDescriptors = (sources: Array<{ prototype: object }>, destination: { prototype: object }) => {
  const destProto = destination.prototype;
  for (let i = 0; i < sources.length; i += 1) {
    const chain = prototypeChainInheritanceOrder(sources[i]);
    for (let c = 0; c < chain.length; c += 1) {
      const sourcePrototype = chain[c];
      const names = Object.getOwnPropertyNames(sourcePrototype);
      for (let j = 0; j < names.length; j += 1) {
        const key = names[j];
        if (key === 'constructor') continue;
        const desc = Object.getOwnPropertyDescriptor(sourcePrototype, key);
        if (desc) Object.defineProperty(destProto, key, desc);
      }
    }
  }
};

copyPrototypeDescriptors(
  [BaseElement, TransformElement, HBaseElement, HSolidElement, HierarchyElement, FrameElement, RenderableElement],
  HImageElement,
);

HImageElement.prototype.createContent = hImageCreateContent;

export default HImageElement;
