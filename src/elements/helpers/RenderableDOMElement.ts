/* eslint-disable @typescript-eslint/no-explicit-any -- DOM renderable: host layer uses mixin `this` */
import RenderableElement from './RenderableElement';

class RenderableDOMElement extends RenderableElement {
  initElement(this: any, data: any, globalData: any, comp: any) {
    this.initFrame();
    this.initBaseData(data, globalData, comp);
    this.initTransform(data, globalData, comp);
    this.initHierarchy();
    this.initRenderable();
    this.initRendererElement();
    this.createContainerElements();
    this.createRenderableComponents();
    this.createContent();
    this.hide();
  }

  hide(this: any) {
    if (!this.hidden && (!this.isInRange || this.isTransparent)) {
      const elem = this.baseElement || this.layerElement;
      elem.style.display = 'none';
      this.hidden = true;
    }
  }

  show(this: any) {
    if (this.isInRange && !this.isTransparent) {
      if (!this.data.hd) {
        const elem = this.baseElement || this.layerElement;
        elem.style.display = 'block';
      }
      this.hidden = false;
      this._isFirstFrame = true;
    }
  }

  renderFrame(this: any) {
    if (this.data.hd || this.hidden) {
      return;
    }
    this.renderTransform();
    this.renderRenderable();
    this.renderLocalTransform();
    this.renderElement();
    this.renderInnerContent();
    if (this._isFirstFrame) {
      this._isFirstFrame = false;
    }
  }

  renderInnerContent(this: any) {}

  prepareFrame(this: any, num: any) {
    this._mdf = false;
    this.prepareRenderableFrame(num);
    this.prepareProperties(num, this.isInRange);
    this.checkTransparency();
  }

  destroy(this: any) {
    this.innerElem = null;
    this.destroyBaseElement();
  }
}

export default RenderableDOMElement;
