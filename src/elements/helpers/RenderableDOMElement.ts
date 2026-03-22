/* eslint-disable @typescript-eslint/no-explicit-any -- DOM renderable mixin (proxy prototype) */
import { extendPrototype, createProxyFunction } from '../../utils/functionExtensions';
import RenderableElement from './RenderableElement';

class RenderableDOMElement {}

(function () {
  const _prototype = {
    initElement: function (this: any, data: any, globalData: any, comp: any) {
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
    },
    hide: function (this: any) {
      // console.log('HIDE', this);
      if (!this.hidden && (!this.isInRange || this.isTransparent)) {
        const elem = this.baseElement || this.layerElement;
        elem.style.display = 'none';
        this.hidden = true;
      }
    },
    show: function (this: any) {
      // console.log('SHOW', this);
      if (this.isInRange && !this.isTransparent) {
        if (!this.data.hd) {
          const elem = this.baseElement || this.layerElement;
          elem.style.display = 'block';
        }
        this.hidden = false;
        this._isFirstFrame = true;
      }
    },
    renderFrame: function (this: any) {
      // If it is exported as hidden (data.hd === true) no need to render
      // If it is not visible no need to render
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
    },
    renderInnerContent: function (this: any) {},
    prepareFrame: function (this: any, num: any) {
      this._mdf = false;
      this.prepareRenderableFrame(num);
      this.prepareProperties(num, this.isInRange);
      this.checkTransparency();
    },
    destroy: function (this: any) {
      this.innerElem = null;
      this.destroyBaseElement();
    },
  };
  extendPrototype([RenderableElement, createProxyFunction(_prototype) as any], RenderableDOMElement as any);
})();

export default RenderableDOMElement;
