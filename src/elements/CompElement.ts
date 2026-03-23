import { copyPrototypeDescriptors } from '../utils/functionExtensions';
import type { CompChildElement, CompLayerData, GlobalData } from '../types/lottieRuntime';
import BaseElement from './BaseElement';
import TransformElement from './helpers/TransformElement';
import HierarchyElement from './helpers/HierarchyElement';
import FrameElement from './helpers/FrameElement';
import RenderableDOMElement from './helpers/RenderableDOMElement';

/** Time remap property on comps (`PropertyFactory` or placeholder). */
type CompTimeRemapProp = { _placeholder: true } | { _placeholder?: false; v: number };

class ICompElement {
  declare initFrame: () => void;
  declare initBaseData: (data: CompLayerData, globalData: GlobalData, comp: unknown) => void;
  declare initTransform: (data: CompLayerData, globalData: GlobalData, comp: unknown) => void;
  declare initRenderable: () => void;
  declare initHierarchy: () => void;
  declare initRendererElement: () => void;
  declare createContainerElements: () => void;
  declare createRenderableComponents: () => void;
  declare hide: () => void;
  declare prepareRenderableFrame: (num: number) => void;
  declare prepareProperties: (num: number, isVisible: boolean) => void;
  declare isInRange: boolean;
  declare destroyBaseElement: () => void;
  declare buildAllItems: () => void;
  declare checkLayers: (frame: number) => void;
  declare elements: Array<CompChildElement | null | undefined>;
  declare layers: CompLayerData['layers'];
  declare completeLayers: boolean;
  declare renderedFrame: number;
  declare _mdf: boolean;
  declare data: CompLayerData;
  declare tm: CompTimeRemapProp;

  setElements(elems: Array<CompChildElement | null | undefined>) {
    this.elements = elems;
  }

  getElements() {
    return this.elements;
  }

  destroyElements() {
    let i: number;
    const len = this.layers.length;
    for (i = 0; i < len; i += 1) {
      if (this.elements[i]) {
        this.elements[i]!.destroy();
      }
    }
  }

  initElement(data: CompLayerData, globalData: GlobalData, comp: unknown) {
    this.initFrame();
    this.initBaseData(data, globalData, comp);
    this.initTransform(data, globalData, comp);
    this.initRenderable();
    this.initHierarchy();
    this.initRendererElement();
    this.createContainerElements();
    this.createRenderableComponents();
    if (this.data.xt || !globalData.progressiveLoad) {
      this.buildAllItems();
    }
    this.hide();
  }

  prepareFrame(num: number) {
    this._mdf = false;
    this.prepareRenderableFrame(num);
    this.prepareProperties(num, this.isInRange);
    if (!this.isInRange && !this.data.xt) {
      return;
    }

    if (!('_placeholder' in this.tm) || !this.tm._placeholder) {
      let timeRemapped = (this.tm as { v: number }).v;
      if (timeRemapped === this.data.op) {
        timeRemapped = this.data.op - 1;
      }
      this.renderedFrame = timeRemapped;
    } else {
      this.renderedFrame = num / this.data.sr;
    }
    let i: number;
    const len = this.elements.length;
    if (!this.completeLayers) {
      this.checkLayers(this.renderedFrame);
    }
    for (i = len - 1; i >= 0; i -= 1) {
      if (this.completeLayers || this.elements[i]) {
        this.elements[i]!.prepareFrame(this.renderedFrame - this.layers[i].st);
        if (this.elements[i]!._mdf) {
          this._mdf = true;
        }
      }
    }
  }

  renderInnerContent() {
    let i: number;
    const len = this.layers.length;
    for (i = 0; i < len; i += 1) {
      if (this.completeLayers || this.elements[i]) {
        this.elements[i]!.renderFrame();
      }
    }
  }

  destroy() {
    this.destroyElements();
    this.destroyBaseElement();
  }
}

const icompInitElement = ICompElement.prototype.initElement;
const icompPrepareFrame = ICompElement.prototype.prepareFrame;
const icompRenderInnerContent = ICompElement.prototype.renderInnerContent;
const icompDestroy = ICompElement.prototype.destroy;

copyPrototypeDescriptors(
  [BaseElement, TransformElement, HierarchyElement, FrameElement, RenderableDOMElement],
  ICompElement,
);

ICompElement.prototype.initElement = icompInitElement;
ICompElement.prototype.prepareFrame = icompPrepareFrame;
ICompElement.prototype.renderInnerContent = icompRenderInnerContent;
ICompElement.prototype.destroy = icompDestroy;

export default ICompElement;
