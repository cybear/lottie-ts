import { styleDiv } from '../../utils/common';
import createNS from '../../utils/helpers/svg_elements';
import createTag from '../../utils/helpers/html_elements';
import BaseRenderer from '../../renderers/BaseRenderer';
import SVGBaseElement from '../svgElements/SVGBaseElement';
import CVEffects from '../canvasElements/CVEffects';
import MaskElement from '../../mask';
import type { MaskHostElement } from '../../mask';
import type {
  BaseInitLayerData,
  GlobalData,
  RenderableComponentEntry,
  RendererElementInstance,
} from '../../types/lottieRuntime';
import type EffectsManager from '../../EffectsManager';

type MatrixCss = { toCSS(): string };

interface FinalTransformHtmlSlice {
  _matMdf: boolean;
  _opMdf: boolean;
  mat: MatrixCss;
  mProp: { o: { v: number } };
}

type LayerDataHtml = BaseInitLayerData & {
  tg?: string;
  hasMask?: boolean;
  ln?: string;
  cl?: string;
  bm?: number;
  hd?: boolean;
};

class HBaseElement {
  declare data: LayerDataHtml;
  declare globalData: GlobalData;
  declare comp: { data: { w?: number; h?: number } };
  declare baseElement: HTMLElement;
  declare svgElement: SVGSVGElement;
  declare layerElement: HTMLElement | SVGElement;
  declare maskedElement: HTMLElement | SVGElement;
  declare transformedElement: HTMLElement;
  declare finalTransform: FinalTransformHtmlSlice;
  declare hidden: boolean;
  declare _isFirstFrame: boolean;
  declare maskManager: MaskElement;
  declare effectsManager: EffectsManager;
  declare renderableEffectsManager: CVEffects;
  declare matteElement: HTMLElement | SVGGElement | null;
  declare renderTransform: () => void;
  declare renderRenderable: () => void;
  declare renderInnerContent: () => void;
  declare setBlendMode: () => void;
  declare addRenderableComponent: (c: RenderableComponentEntry) => void;

  checkBlendMode() {}

  initRendererElement() {
    this.baseElement = createTag(this.data.tg || 'div');
    if (this.data.hasMask) {
      this.svgElement = createNS('svg') as SVGSVGElement;
      this.layerElement = createNS('g') as SVGGElement;
      this.maskedElement = this.layerElement;
      this.svgElement.appendChild(this.layerElement as SVGElement);
      this.baseElement.appendChild(this.svgElement);
    } else {
      this.layerElement = this.baseElement;
    }
    styleDiv(this.baseElement);
  }

  createContainerElements() {
    this.renderableEffectsManager = new CVEffects(this);
    this.transformedElement = this.baseElement;
    this.maskedElement = this.layerElement;
    if (this.data.ln) {
      this.layerElement.setAttribute('id', this.data.ln);
    }
    if (this.data.cl) {
      this.layerElement.setAttribute('class', this.data.cl);
    }
    if (this.data.bm !== 0) {
      this.setBlendMode();
    }
  }

  renderElement() {
    const transformedElementStyle = this.transformedElement
      ? this.transformedElement.style
      : ({} as CSSStyleDeclaration);
    if (this.finalTransform._matMdf) {
      const matrixValue = this.finalTransform.mat.toCSS();
      transformedElementStyle.transform = matrixValue;
      (transformedElementStyle as CSSStyleDeclaration & { webkitTransform?: string }).webkitTransform = matrixValue;
    }
    if (this.finalTransform._opMdf) {
      transformedElementStyle.opacity = String(this.finalTransform.mProp.o.v);
    }
  }

  renderFrame() {
    if (this.data.hd || this.hidden) {
      return;
    }
    this.renderTransform();
    this.renderRenderable();
    this.renderElement();
    this.renderInnerContent();
    if (this._isFirstFrame) {
      this._isFirstFrame = false;
    }
  }

  destroy() {
    this.layerElement = null as unknown as HTMLElement;
    this.transformedElement = null as unknown as HTMLElement;
    if (this.matteElement) {
      this.matteElement = null;
    }
    if (this.maskManager) {
      this.maskManager.destroy();
      this.maskManager = null as unknown as MaskElement;
    }
  }

  createRenderableComponents() {
    this.maskManager = new MaskElement(this.data, this as unknown as MaskHostElement, this.globalData);
  }

  addEffects() {}

  setMatte() {}

  getBaseElement(): Element | null {
    return SVGBaseElement.prototype.getBaseElement.call(this) as Element | null;
  }

  buildElementParenting(element: RendererElementInstance, parentName: number, hierarchy: unknown[]) {
    return BaseRenderer.prototype.buildElementParenting.call(this, element, parentName, hierarchy);
  }
}

(HBaseElement.prototype as { destroyBaseElement?: typeof HBaseElement.prototype.destroy }).destroyBaseElement =
  HBaseElement.prototype.destroy;

export default HBaseElement;
