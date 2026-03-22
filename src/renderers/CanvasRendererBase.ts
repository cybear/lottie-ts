import { createSizedArray } from '../utils/helpers/arrays';
import createTag from '../utils/helpers/html_elements';
import type {
  AnimationItemRendererPartial,
  AnimationRootData,
  GlobalData,
  RendererElementInstance,
  RendererElementSlot,
  RendererLayerData,
  RenderConfig,
} from '../types/lottieRuntime';
import SVGRendererBase from './SVGRendererBase';
import BaseRenderer from './BaseRenderer';
import CVShapeElement from '../elements/canvasElements/CVShapeElement';
import CVTextElement from '../elements/canvasElements/CVTextElement';
import CVImageElement from '../elements/canvasElements/CVImageElement';
import CVSolidElement from '../elements/canvasElements/CVSolidElement';
import CVContextData from '../elements/canvasElements/CVContextData';

export interface CanvasTransformCanvas {
  w: number;
  h: number;
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  props?: number[];
}

export type CanvasRendererConfig = RenderConfig & {
  clearCanvas: boolean;
  dpr: number;
  preserveAspectRatio: string;
  context: CanvasRenderingContext2D | null;
};

abstract class CanvasRendererBase extends BaseRenderer {
  declare animationItem: AnimationItemRendererPartial;
  canvasContext!: CanvasRenderingContext2D;
  contextData!: CVContextData;
  transformCanvas!: CanvasTransformCanvas;
  data!: AnimationRootData;
  destroyed!: boolean;
  renderedFrame!: number;
  renderConfig!: CanvasRendererConfig;
  declare globalData: GlobalData;
  declare layers: RendererLayerData[];
  declare elements: RendererElementSlot[];

  abstract createComp(data: RendererLayerData): RendererElementInstance;

  createShape(data: RendererLayerData): RendererElementInstance {
    return new CVShapeElement(data, this.globalData, this) as unknown as RendererElementInstance;
  }

  createText(data: RendererLayerData): RendererElementInstance {
    return new CVTextElement(data, this.globalData, this) as unknown as RendererElementInstance;
  }

  createImage(data: RendererLayerData): RendererElementInstance {
    return new CVImageElement(data, this.globalData, this) as unknown as RendererElementInstance;
  }

  createSolid(data: RendererLayerData): RendererElementInstance {
    return new CVSolidElement(data, this.globalData, this) as unknown as RendererElementInstance;
  }

  createNull(data: RendererLayerData): RendererElementInstance {
    return SVGRendererBase.prototype.createNull.call(this, data) as RendererElementInstance;
  }

  ctxTransform(props: number[]) {
    if (props[0] === 1 && props[1] === 0 && props[4] === 0 && props[5] === 1 && props[12] === 0 && props[13] === 0) {
      return;
    }
    this.canvasContext.transform(props[0], props[1], props[4], props[5], props[12], props[13]);
  }

  ctxOpacity(op: number) {
    this.canvasContext.globalAlpha *= op < 0 ? 0 : op;
  }

  ctxFillStyle(value: string | CanvasGradient | CanvasPattern) {
    this.canvasContext.fillStyle = value;
  }

  ctxStrokeStyle(value: string | CanvasGradient | CanvasPattern) {
    this.canvasContext.strokeStyle = value;
  }

  ctxLineWidth(value: number) {
    this.canvasContext.lineWidth = value;
  }

  ctxLineCap(value: CanvasLineCap) {
    this.canvasContext.lineCap = value;
  }

  ctxLineJoin(value: CanvasLineJoin) {
    this.canvasContext.lineJoin = value;
  }

  ctxMiterLimit(value: number) {
    this.canvasContext.miterLimit = value;
  }

  ctxFill(rule: CanvasFillRule) {
    this.canvasContext.fill(rule);
  }

  ctxFillRect(x: number, y: number, w: number, h: number) {
    this.canvasContext.fillRect(x, y, w, h);
  }

  ctxStroke() {
    this.canvasContext.stroke();
  }

  reset() {
    if (!this.renderConfig.clearCanvas) {
      this.canvasContext.restore();
      return;
    }
    this.contextData.reset();
  }

  save(_saveOnNativeFlag?: boolean) {
    this.canvasContext.save();
  }

  restore(actionFlag?: boolean) {
    if (!this.renderConfig.clearCanvas) {
      this.canvasContext.restore();
      return;
    }
    if (actionFlag) {
      this.globalData.blendMode = 'source-over';
    }
    this.contextData.restore(actionFlag);
  }

  configAnimation(animData: AnimationRootData) {
    if (this.animationItem.wrapper) {
      this.animationItem.container = createTag('canvas') as HTMLCanvasElement;
      const containerStyle = this.animationItem.container.style as CSSStyleDeclaration & {
        mozTransformOrigin?: string;
        webkitTransformOrigin?: string;
        ['-webkit-transform']?: string;
      };
      containerStyle.width = '100%';
      containerStyle.height = '100%';
      const origin = '0px 0px 0px';
      containerStyle.transformOrigin = origin;
      containerStyle.mozTransformOrigin = origin;
      containerStyle.webkitTransformOrigin = origin;
      containerStyle['-webkit-transform'] = origin;
      containerStyle.contentVisibility = this.renderConfig.contentVisibility ?? 'visible';
      this.animationItem.wrapper.appendChild(this.animationItem.container);
      const canvasEl = this.animationItem.container as HTMLCanvasElement;
      this.canvasContext = canvasEl.getContext('2d')!;
      if (this.renderConfig.className) {
        canvasEl.setAttribute('class', this.renderConfig.className);
      }
      if (this.renderConfig.id) {
        canvasEl.setAttribute('id', String(this.renderConfig.id));
      }
    } else {
      this.canvasContext = this.renderConfig.context!;
    }
    this.contextData.setContext(this.canvasContext);
    this.data = animData;
    this.layers = animData.layers;
    this.transformCanvas = {
      w: animData.w,
      h: animData.h,
      sx: 0,
      sy: 0,
      tx: 0,
      ty: 0,
    };
    this.setupGlobalData(animData, document.body);
    this.globalData.canvasContext = this.canvasContext;
    this.globalData.renderer = this;
    this.globalData.isDashed = false;
    this.globalData.progressiveLoad = this.renderConfig.progressiveLoad;
    this.globalData.transformCanvas = this.transformCanvas;
    this.elements = createSizedArray(animData.layers.length) as RendererElementSlot[];

    this.updateContainerSize();
  }

  updateContainerSize(width?: number, height?: number) {
    this.reset();
    let elementWidth: number;
    let elementHeight: number;
    if (width) {
      elementWidth = width;
      elementHeight = height ?? width;
      this.canvasContext.canvas.width = elementWidth;
      this.canvasContext.canvas.height = elementHeight;
    } else {
      if (this.animationItem.wrapper && this.animationItem.container) {
        elementWidth = this.animationItem.wrapper.offsetWidth;
        elementHeight = this.animationItem.wrapper.offsetHeight;
      } else {
        elementWidth = this.canvasContext.canvas.width;
        elementHeight = this.canvasContext.canvas.height;
      }
      this.canvasContext.canvas.width = elementWidth * this.renderConfig.dpr;
      this.canvasContext.canvas.height = elementHeight * this.renderConfig.dpr;
    }

    let elementRel;
    let animationRel;
    if (
      this.renderConfig.preserveAspectRatio.indexOf('meet') !== -1 ||
      this.renderConfig.preserveAspectRatio.indexOf('slice') !== -1
    ) {
      const par = this.renderConfig.preserveAspectRatio.split(' ');
      const fillType = par[1] || 'meet';
      const pos = par[0] || 'xMidYMid';
      const xPos = pos.substr(0, 4);
      const yPos = pos.substr(4);
      elementRel = elementWidth / elementHeight;
      animationRel = this.transformCanvas.w / this.transformCanvas.h;
      if ((animationRel > elementRel && fillType === 'meet') || (animationRel < elementRel && fillType === 'slice')) {
        this.transformCanvas.sx = elementWidth / (this.transformCanvas.w / this.renderConfig.dpr);
        this.transformCanvas.sy = elementWidth / (this.transformCanvas.w / this.renderConfig.dpr);
      } else {
        this.transformCanvas.sx = elementHeight / (this.transformCanvas.h / this.renderConfig.dpr);
        this.transformCanvas.sy = elementHeight / (this.transformCanvas.h / this.renderConfig.dpr);
      }

      if (
        xPos === 'xMid' &&
        ((animationRel < elementRel && fillType === 'meet') || (animationRel > elementRel && fillType === 'slice'))
      ) {
        this.transformCanvas.tx =
          ((elementWidth - this.transformCanvas.w * (elementHeight / this.transformCanvas.h)) / 2) *
          this.renderConfig.dpr;
      } else if (
        xPos === 'xMax' &&
        ((animationRel < elementRel && fillType === 'meet') || (animationRel > elementRel && fillType === 'slice'))
      ) {
        this.transformCanvas.tx =
          (elementWidth - this.transformCanvas.w * (elementHeight / this.transformCanvas.h)) * this.renderConfig.dpr;
      } else {
        this.transformCanvas.tx = 0;
      }
      if (
        yPos === 'YMid' &&
        ((animationRel > elementRel && fillType === 'meet') || (animationRel < elementRel && fillType === 'slice'))
      ) {
        this.transformCanvas.ty =
          ((elementHeight - this.transformCanvas.h * (elementWidth / this.transformCanvas.w)) / 2) *
          this.renderConfig.dpr;
      } else if (
        yPos === 'YMax' &&
        ((animationRel > elementRel && fillType === 'meet') || (animationRel < elementRel && fillType === 'slice'))
      ) {
        this.transformCanvas.ty =
          (elementHeight - this.transformCanvas.h * (elementWidth / this.transformCanvas.w)) * this.renderConfig.dpr;
      } else {
        this.transformCanvas.ty = 0;
      }
    } else if (this.renderConfig.preserveAspectRatio === 'none') {
      this.transformCanvas.sx = elementWidth / (this.transformCanvas.w / this.renderConfig.dpr);
      this.transformCanvas.sy = elementHeight / (this.transformCanvas.h / this.renderConfig.dpr);
      this.transformCanvas.tx = 0;
      this.transformCanvas.ty = 0;
    } else {
      this.transformCanvas.sx = this.renderConfig.dpr;
      this.transformCanvas.sy = this.renderConfig.dpr;
      this.transformCanvas.tx = 0;
      this.transformCanvas.ty = 0;
    }
    this.transformCanvas.props = [
      this.transformCanvas.sx,
      0,
      0,
      0,
      0,
      this.transformCanvas.sy,
      0,
      0,
      0,
      0,
      1,
      0,
      this.transformCanvas.tx,
      this.transformCanvas.ty,
      0,
      1,
    ];
    /* var i, len = this.elements.length;
    for(i=0;i<len;i+=1){
        if(this.elements[i] && this.elements[i].data.ty === 0){
            this.elements[i].resize(this.globalData.transformCanvas);
        }
    } */
    this.ctxTransform(this.transformCanvas.props!);
    this.canvasContext.beginPath();
    this.canvasContext.rect(0, 0, this.transformCanvas.w, this.transformCanvas.h);
    this.canvasContext.closePath();
    this.canvasContext.clip();

    this.renderFrame(this.renderedFrame, true);
  }

  destroy() {
    if (this.renderConfig.clearCanvas && this.animationItem.wrapper) {
      this.animationItem.wrapper.innerText = '';
    }
    let i;
    const len = this.layers ? this.layers.length : 0;
    for (i = len - 1; i >= 0; i -= 1) {
      const slot = this.elements[i];
      if (slot && slot !== true) {
        (slot as RendererElementInstance).destroy();
      }
    }
    this.elements.length = 0;
    this.globalData.canvasContext = null;
    this.animationItem.container = null;
    this.destroyed = true;
  }

  renderFrame(num: number, forceRender?: boolean) {
    if (
      (this.renderedFrame === num && this.renderConfig.clearCanvas === true && !forceRender) ||
      this.destroyed ||
      num === -1
    ) {
      return;
    }
    this.renderedFrame = num;
    this.globalData.frameNum = num - (this.animationItem._isFirstFrame ?? 0);
    this.globalData.frameId = (this.globalData.frameId ?? 0) + 1;
    this.globalData._mdf = !this.renderConfig.clearCanvas || !!forceRender;
    (this.globalData.projectInterface as { currentFrame: number }).currentFrame = num;

    // console.log('--------');
    // console.log('NEW: ',num);
    let i;
    const len = this.layers.length;
    if (!this.completeLayers) {
      this.checkLayers(num);
    }

    for (i = len - 1; i >= 0; i -= 1) {
      if (this.completeLayers || this.elements[i]) {
        (this.elements[i] as RendererElementInstance).prepareFrame(num - this.layers[i].st);
      }
    }
    if (this.globalData._mdf) {
      if (this.renderConfig.clearCanvas === true) {
        this.canvasContext.clearRect(0, 0, this.transformCanvas.w, this.transformCanvas.h);
      } else {
        this.save();
      }
      for (i = len - 1; i >= 0; i -= 1) {
        if (this.completeLayers || this.elements[i]) {
          (this.elements[i] as RendererElementInstance).renderFrame();
        }
      }
      if (this.renderConfig.clearCanvas !== true) {
        this.restore();
      }
    }
  }

  buildItem(pos: number) {
    const elements = this.elements;
    if (elements[pos] || this.layers[pos].ty === 99) {
      return;
    }
    const element = this.createItem(this.layers[pos], this, this.globalData) as RendererElementInstance;
    elements[pos] = element;
    element.initExpressions();
    /* if(this.layers[pos].ty === 0){
        element.resize(this.globalData.transformCanvas);
    } */
  }

  checkPendingElements() {
    while (this.pendingElements.length) {
      const element = this.pendingElements.pop()!;
      element.checkParenting();
    }
  }

  hide() {
    this.animationItem.container!.style.display = 'none';
  }

  show() {
    this.animationItem.container!.style.display = 'block';
  }
}

export default CanvasRendererBase;
