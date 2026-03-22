// @ts-nocheck
import { extendPrototype } from '../utils/functionExtensions';
import BaseElement from './BaseElement';
import TransformElement from './helpers/TransformElement';
import HierarchyElement from './helpers/HierarchyElement';
import FrameElement from './helpers/FrameElement';
import RenderableDOMElement from './helpers/RenderableDOMElement';

class ICompElement {
  setElements(elems) {
    this.elements = elems;
  }

  getElements() {
    return this.elements;
  }

  destroyElements() {
    let i;
    const len = this.layers.length;
    for (i = 0; i < len; i += 1) {
      if (this.elements[i]) {
        this.elements[i].destroy();
      }
    }
  }

  initElement(data, globalData, comp) {
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

  prepareFrame(num) {
    this._mdf = false;
    this.prepareRenderableFrame(num);
    this.prepareProperties(num, this.isInRange);
    if (!this.isInRange && !this.data.xt) {
      return;
    }

    if (!this.tm._placeholder) {
      let timeRemapped = this.tm.v;
      if (timeRemapped === this.data.op) {
        timeRemapped = this.data.op - 1;
      }
      this.renderedFrame = timeRemapped;
    } else {
      this.renderedFrame = num / this.data.sr;
    }
    let i;
    const len = this.elements.length;
    if (!this.completeLayers) {
      this.checkLayers(this.renderedFrame);
    }
    for (i = len - 1; i >= 0; i -= 1) {
      if (this.completeLayers || this.elements[i]) {
        this.elements[i].prepareFrame(this.renderedFrame - this.layers[i].st);
        if (this.elements[i]._mdf) {
          this._mdf = true;
        }
      }
    }
  }

  renderInnerContent() {
    let i;
    const len = this.layers.length;
    for (i = 0; i < len; i += 1) {
      if (this.completeLayers || this.elements[i]) {
        this.elements[i].renderFrame();
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

extendPrototype([BaseElement, TransformElement, HierarchyElement, FrameElement, RenderableDOMElement], ICompElement);

ICompElement.prototype.initElement = icompInitElement;
ICompElement.prototype.prepareFrame = icompPrepareFrame;
ICompElement.prototype.renderInnerContent = icompRenderInnerContent;
ICompElement.prototype.destroy = icompDestroy;

export default ICompElement;
