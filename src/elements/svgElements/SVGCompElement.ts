import { extendPrototype } from '../../utils/functionExtensions';
import { createSizedArray } from '../../utils/helpers/arrays';
import PropertyFactory from '../../utils/PropertyFactory';
import BaseRenderer from '../../renderers/BaseRenderer';
import SVGRendererBase from '../../renderers/SVGRendererBase'; // eslint-disable-line
import SVGBaseElement from './SVGBaseElement';
import ICompElement from '../CompElement';
import { registerSVGCompElement } from './svgElementRefs';
import type {
  CompChildElement,
  CompLayerData,
  GlobalData,
  RendererElementInstance,
  RendererLayerData,
} from '../../types/lottieRuntime';

/** Time remap property on comps (`PropertyFactory` or placeholder). */
type CompTimeRemapProp = { _placeholder: true } | { _placeholder?: false; v: number };

class SVGCompElement {
  declare initElement: (data: CompLayerData, globalData: GlobalData, comp: unknown) => void;
  declare globalData: GlobalData;
  declare layers: CompLayerData['layers'];
  declare completeLayers: boolean;
  declare pendingElements: RendererElementInstance[];
  declare elements: Array<CompChildElement | null | undefined>;
  declare data: CompLayerData;
  declare tm: CompTimeRemapProp;
  supports3d!: boolean;

  constructor(data: RendererLayerData, globalData: GlobalData, comp: unknown) {
    const compData = data as unknown as CompLayerData;
    this.layers = compData.layers;
    this.supports3d = true;
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

  createComp(data: RendererLayerData): RendererElementInstance {
    return new SVGCompElement(data, this.globalData, this) as unknown as RendererElementInstance;
  }
}

extendPrototype([BaseRenderer, SVGRendererBase, ICompElement, SVGBaseElement], SVGCompElement);

registerSVGCompElement(SVGCompElement);

export default SVGCompElement;
