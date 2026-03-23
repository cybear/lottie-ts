import { prototypeChainInheritanceOrder } from '../../utils/functionExtensions';
import { createSizedArray } from '../../utils/helpers/arrays';
import PropertyFactory from '../../utils/PropertyFactory';
import BaseRenderer from '../../renderers/BaseRenderer';
import HybridRendererBase from '../../renderers/HybridRendererBase';
import HBaseElement from './HBaseElement';
import ICompElement from '../CompElement';
import SVGCompElement from '../svgElements/SVGCompElement';
import type {
  CompChildElement,
  CompLayerData,
  GlobalData,
  RendererElementInstance,
  RendererLayerData,
} from '../../types/lottieRuntime';

/** Time remap property on comps (`PropertyFactory` or placeholder). */
type CompTimeRemapProp = { _placeholder: true } | { _placeholder?: false; v: number };

class HCompElement {
  declare initElement: (data: CompLayerData, globalData: GlobalData, comp: unknown) => void;
  declare globalData: GlobalData;
  declare layers: CompLayerData['layers'];
  declare completeLayers: boolean;
  declare pendingElements: RendererElementInstance[];
  declare elements: Array<CompChildElement | null | undefined>;
  declare data: CompLayerData;
  declare tm: CompTimeRemapProp;
  declare layerElement: HTMLElement | SVGElement;
  declare svgElement: SVGSVGElement;
  declare baseElement: HTMLElement;
  declare transformedElement: HTMLElement;
  supports3d!: boolean;
  declare _createBaseContainerElements: () => void;

  constructor(data: RendererLayerData, globalData: GlobalData, comp: unknown) {
    const compData = data as unknown as CompLayerData;
    this.layers = compData.layers;
    this.supports3d = !compData.hasMask;
    this.completeLayers = false;
    this.pendingElements = [];
    this.elements = this.layers
      ? (createSizedArray(this.layers.length) as Array<CompChildElement | null | undefined>)
      : [];
    this.initElement(compData, globalData, comp);
    this.tm = compData.tm
      ? (PropertyFactory.getProp(this, compData.tm, 0, globalData.frameRate, this) as CompTimeRemapProp)
      : { _placeholder: true };
  }

  addTo3dContainer(elem: Element, pos: number) {
    let j = 0;
    let nextElement: Element | undefined;
    while (j < pos) {
      const el = this.elements[j];
      if (el?.getBaseElement) {
        nextElement = el.getBaseElement() ?? undefined;
      }
      j += 1;
    }
    if (nextElement) {
      this.layerElement.insertBefore(elem, nextElement);
    } else {
      this.layerElement.appendChild(elem);
    }
  }

  createComp(data: RendererLayerData): RendererElementInstance {
    if (!this.supports3d) {
      return new SVGCompElement(data, this.globalData, this) as unknown as RendererElementInstance;
    }
    return new HCompElement(data, this.globalData, this) as unknown as RendererElementInstance;
  }

  createContainerElements() {
    this._createBaseContainerElements();
    if (this.data.hasMask) {
      this.svgElement.setAttribute('width', String(this.data.w));
      this.svgElement.setAttribute('height', String(this.data.h));
      this.transformedElement = this.baseElement;
    } else {
      this.transformedElement = this.layerElement as HTMLElement;
    }
  }
}

const hcompCreateContainerElements = HCompElement.prototype.createContainerElements;

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

copyPrototypeDescriptors([BaseRenderer, HybridRendererBase, ICompElement, HBaseElement], HCompElement);

HCompElement.prototype._createBaseContainerElements = HCompElement.prototype.createContainerElements;
HCompElement.prototype.createContainerElements = hcompCreateContainerElements;

export default HCompElement;
