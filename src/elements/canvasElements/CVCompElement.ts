import { extendPrototype } from '../../utils/functionExtensions';
import { createSizedArray } from '../../utils/helpers/arrays';
import PropertyFactory from '../../utils/PropertyFactory';
import BaseRenderer from '../../renderers/BaseRenderer';
import CanvasRendererBase from '../../renderers/CanvasRendererBase';
import CVBaseElement from './CVBaseElement';
import ICompElement from '../CompElement';
import type {
  CompChildElement,
  CompLayerData,
  GlobalData,
  RendererElementInstance,
  RendererLayerData,
} from '../../types/lottieRuntime';

/** Time remap property on comps (`PropertyFactory` or placeholder). */
type CompTimeRemapProp = { _placeholder: true } | { _placeholder?: false; v: number };

class CVCompElement {
  declare initElement: (data: CompLayerData, globalData: GlobalData, comp: unknown) => void;
  declare globalData: GlobalData;
  declare layers: CompLayerData['layers'];
  declare completeLayers: boolean;
  declare pendingElements: RendererElementInstance[];
  declare elements: Array<CompChildElement | null | undefined>;
  declare data: CompLayerData;
  declare tm: CompTimeRemapProp;
  declare canvasContext: CanvasRenderingContext2D;

  constructor(data: RendererLayerData, globalData: GlobalData, comp: unknown) {
    const compData = data as unknown as CompLayerData;
    this.completeLayers = false;
    this.layers = compData.layers;
    this.pendingElements = [];
    this.elements = createSizedArray(this.layers.length) as Array<CompChildElement | null | undefined>;
    this.initElement(compData, globalData, comp);
    this.tm = compData.tm
      ? (PropertyFactory.getProp(this, compData.tm, 0, globalData.frameRate, this) as CompTimeRemapProp)
      : { _placeholder: true };
  }

  createComp(data: RendererLayerData): RendererElementInstance {
    return new CVCompElement(data, this.globalData, this) as unknown as RendererElementInstance;
  }

  renderInnerContent() {
    const ctx = this.canvasContext;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(this.data.w!, 0);
    ctx.lineTo(this.data.w!, this.data.h!);
    ctx.lineTo(0, this.data.h!);
    ctx.lineTo(0, 0);
    ctx.clip();
    let i: number;
    const len = this.layers.length;
    for (i = len - 1; i >= 0; i -= 1) {
      if (this.completeLayers || this.elements[i]) {
        this.elements[i]!.renderFrame();
      }
    }
  }

  destroy() {
    let i: number;
    const len = this.layers.length;
    for (i = len - 1; i >= 0; i -= 1) {
      if (this.elements[i]) {
        this.elements[i]!.destroy();
      }
    }
    this.layers = null as unknown as CompLayerData['layers'];
    this.elements = null as unknown as Array<CompChildElement | null | undefined>;
  }
}

const cvCompRenderInnerContent = CVCompElement.prototype.renderInnerContent;
const cvCompDestroy = CVCompElement.prototype.destroy;

extendPrototype([BaseRenderer, CanvasRendererBase, ICompElement, CVBaseElement], CVCompElement);

CVCompElement.prototype.renderInnerContent = cvCompRenderInnerContent;
CVCompElement.prototype.destroy = cvCompDestroy;

export default CVCompElement;
