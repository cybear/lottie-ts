// @ts-nocheck
import { extendPrototype } from '../../utils/functionExtensions';
import { createSizedArray } from '../../utils/helpers/arrays';
import PropertyFactory from '../../utils/PropertyFactory';
import BaseRenderer from '../../renderers/BaseRenderer';
import CanvasRendererBase from '../../renderers/CanvasRendererBase';
import CVBaseElement from './CVBaseElement';
import ICompElement from '../CompElement';

class CVCompElement {
  constructor(data, globalData, comp) {
    this.completeLayers = false;
    this.layers = data.layers;
    this.pendingElements = [];
    this.elements = createSizedArray(this.layers.length);
    this.initElement(data, globalData, comp);
    this.tm = data.tm ? PropertyFactory.getProp(this, data.tm, 0, globalData.frameRate, this) : { _placeholder: true };
  }

  createComp(data) {
    return new CVCompElement(data, this.globalData, this);
  }

  renderInnerContent() {
    const ctx = this.canvasContext;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(this.data.w, 0);
    ctx.lineTo(this.data.w, this.data.h);
    ctx.lineTo(0, this.data.h);
    ctx.lineTo(0, 0);
    ctx.clip();
    let i;
    const len = this.layers.length;
    for (i = len - 1; i >= 0; i -= 1) {
      if (this.completeLayers || this.elements[i]) {
        this.elements[i].renderFrame();
      }
    }
  }

  destroy() {
    let i;
    const len = this.layers.length;
    for (i = len - 1; i >= 0; i -= 1) {
      if (this.elements[i]) {
        this.elements[i].destroy();
      }
    }
    this.layers = null;
    this.elements = null;
  }
}

const cvCompRenderInnerContent = CVCompElement.prototype.renderInnerContent;
const cvCompDestroy = CVCompElement.prototype.destroy;

extendPrototype([BaseRenderer, CanvasRendererBase, ICompElement, CVBaseElement], CVCompElement);

CVCompElement.prototype.renderInnerContent = cvCompRenderInnerContent;
CVCompElement.prototype.destroy = cvCompDestroy;

export default CVCompElement;
