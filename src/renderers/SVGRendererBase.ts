import { getLocationHref } from '../main';
import { createElementID, getExpressionsPlugin } from '../utils/common';
import { createSizedArray } from '../utils/helpers/arrays';
import createNS from '../utils/helpers/svg_elements';
import type {
  AnimationItemRendererPartial,
  AnimationRootData,
  ElementData,
  GlobalData,
  GlobalDataDomText,
  GlobalDataSvgShape,
  RefIdLayerData,
  RendererElementInstance,
  RendererElementSlot,
  RendererLayerData,
  RenderConfig,
  ShapeJsonNode,
  SolidColorLayerData,
  TextLayerData,
} from '../types/lottieRuntime';
import BaseRenderer from './BaseRenderer';
import IImageElement from '../elements/ImageElement';
import SVGShapeElement from '../elements/svgElements/SVGShapeElement';
import SVGTextLottieElement from '../elements/svgElements/SVGTextElement';
import ISolidElement from '../elements/SolidElement';
import NullElement from '../elements/NullElement';

abstract class SVGRendererBase extends BaseRenderer {
  declare animationItem: AnimationItemRendererPartial;
  svgElement!: SVGSVGElement;
  layerElement!: SVGGElement;
  renderConfig!: RenderConfig;
  data!: AnimationRootData;
  destroyed!: boolean;
  renderedFrame!: number;
  declare globalData: GlobalData;
  declare layers: RendererLayerData[];
  declare elements: RendererElementSlot[];

  abstract createComp(data: RendererLayerData): RendererElementInstance;

  createNull(data: RendererLayerData): RendererElementInstance {
    return new NullElement(data as ElementData, this.globalData, this) as unknown as RendererElementInstance;
  }

  createShape(data: RendererLayerData): RendererElementInstance {
    return new SVGShapeElement(
      data as unknown as ElementData & { shapes: ShapeJsonNode[] },
      this.globalData as unknown as GlobalDataSvgShape,
      this,
    ) as unknown as RendererElementInstance;
  }

  createText(data: RendererLayerData): RendererElementInstance {
    return new SVGTextLottieElement(
      data as unknown as TextLayerData,
      this.globalData as unknown as GlobalDataDomText,
      this,
    ) as unknown as RendererElementInstance;
  }

  createImage(data: RendererLayerData): RendererElementInstance {
    return new IImageElement(
      data as unknown as RefIdLayerData,
      this.globalData,
      this,
    ) as unknown as RendererElementInstance;
  }

  createSolid(data: RendererLayerData): RendererElementInstance {
    return new ISolidElement(
      data as unknown as SolidColorLayerData,
      this.globalData,
      this,
    ) as unknown as RendererElementInstance;
  }

  configAnimation(animData: AnimationRootData) {
    this.svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    this.svgElement.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    if (this.renderConfig.viewBoxSize) {
      this.svgElement.setAttribute('viewBox', this.renderConfig.viewBoxSize as string);
    } else {
      this.svgElement.setAttribute('viewBox', '0 0 ' + animData.w + ' ' + animData.h);
    }

    if (!this.renderConfig.viewBoxOnly) {
      this.svgElement.setAttribute('width', String(animData.w));
      this.svgElement.setAttribute('height', String(animData.h));
      this.svgElement.style.width = '100%';
      this.svgElement.style.height = '100%';
      this.svgElement.style.transform = 'translate3d(0,0,0)';
      this.svgElement.style.contentVisibility = this.renderConfig.contentVisibility as string;
    }
    if (this.renderConfig.width) {
      this.svgElement.setAttribute('width', String(this.renderConfig.width));
    }
    if (this.renderConfig.height) {
      this.svgElement.setAttribute('height', String(this.renderConfig.height));
    }
    if (this.renderConfig.className) {
      this.svgElement.setAttribute('class', this.renderConfig.className);
    }
    if (this.renderConfig.id) {
      this.svgElement.setAttribute('id', String(this.renderConfig.id));
    }
    if (this.renderConfig.focusable !== undefined) {
      this.svgElement.setAttribute('focusable', this.renderConfig.focusable);
    }
    this.svgElement.setAttribute('preserveAspectRatio', this.renderConfig.preserveAspectRatio as string);
    this.animationItem.wrapper.appendChild(this.svgElement);
    const defs = this.globalData.defs as SVGDefsElement;

    this.setupGlobalData(animData, defs);
    this.globalData.progressiveLoad = this.renderConfig.progressiveLoad;
    this.data = animData;

    const maskElement = createNS('clipPath');
    const rect = createNS('rect');
    rect.setAttribute('width', String(animData.w));
    rect.setAttribute('height', String(animData.h));
    rect.setAttribute('x', '0');
    rect.setAttribute('y', '0');
    const maskId = createElementID();
    maskElement.setAttribute('id', maskId);
    maskElement.appendChild(rect);
    this.layerElement.setAttribute('clip-path', 'url(' + getLocationHref() + '#' + maskId + ')');

    defs.appendChild(maskElement);
    this.layers = animData.layers;
    this.elements = createSizedArray(animData.layers.length) as RendererElementSlot[];
  }

  destroy() {
    if (this.animationItem.wrapper) {
      this.animationItem.wrapper.innerText = '';
    }
    this.layerElement = null as unknown as SVGGElement;
    this.globalData.defs = null;
    let i: number;
    const len = this.layers ? this.layers.length : 0;
    for (i = 0; i < len; i += 1) {
      const slot = this.elements[i];
      if (slot && slot !== true) {
        (slot as RendererElementInstance).destroy();
      }
    }
    this.elements.length = 0;
    this.destroyed = true;
    this.animationItem = null as unknown as AnimationItemRendererPartial;
  }

  updateContainerSize() {}

  findIndexByInd(ind: number) {
    let i = 0;
    const len = this.layers.length;
    for (i = 0; i < len; i += 1) {
      if (this.layers[i].ind === ind) {
        return i;
      }
    }
    return -1;
  }

  buildItem(pos: number) {
    const elements = this.elements;
    if (elements[pos] || this.layers[pos].ty === 99) {
      return;
    }
    elements[pos] = true;
    const element = this.createItem(this.layers[pos]) as RendererElementInstance;

    elements[pos] = element;
    if (getExpressionsPlugin()) {
      if (this.layers[pos].ty === 0) {
        (this.globalData.projectInterface as { registerComposition(c: unknown): void }).registerComposition(element);
      }
      element.initExpressions();
    }
    this.appendElementInPos(element, pos);
    if (this.layers[pos].tt) {
      const layer = this.layers[pos] as RendererLayerData & { tp?: number };
      const elementIndex = 'tp' in layer ? this.findIndexByInd(layer.tp!) : pos - 1;
      if (elementIndex === -1) {
        return;
      }
      if (!this.elements[elementIndex] || this.elements[elementIndex] === true) {
        this.buildItem(elementIndex);
        this.addPendingElement(element);
      } else {
        const matteElement = elements[elementIndex] as RendererElementInstance;
        const matteMask = matteElement.getMatte!(this.layers[pos].tt);
        element.setMatte!(matteMask);
      }
    }
  }

  checkPendingElements() {
    while (this.pendingElements.length) {
      const element = this.pendingElements.pop()!;
      element.checkParenting();
      if (element.data.tt) {
        let i = 0;
        const len = this.elements.length;
        while (i < len) {
          if (this.elements[i] === element) {
            const ed = element.data as { tp?: number };
            const elementIndex = 'tp' in ed ? this.findIndexByInd(ed.tp!) : i - 1;
            const matteElement = this.elements[elementIndex] as RendererElementInstance;
            const matteMask = matteElement.getMatte!(this.layers[i].tt);
            element.setMatte!(matteMask);
            break;
          }
          i += 1;
        }
      }
    }
  }

  renderFrame(num: number | null) {
    if (this.renderedFrame === num || this.destroyed) {
      return;
    }
    if (num === null) {
      num = this.renderedFrame;
    } else {
      this.renderedFrame = num;
    }
    this.globalData.frameNum = num;
    this.globalData.frameId = (this.globalData.frameId ?? 0) + 1;
    (this.globalData.projectInterface as { currentFrame: number }).currentFrame = num;
    this.globalData._mdf = false;
    let i: number;
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
      for (i = 0; i < len; i += 1) {
        if (this.completeLayers || this.elements[i]) {
          (this.elements[i] as RendererElementInstance).renderFrame();
        }
      }
    }
  }

  appendElementInPos(element: RendererElementInstance, pos: number) {
    const newElement = element.getBaseElement();
    if (!newElement) {
      return;
    }
    let i = 0;
    let nextElement: Element | undefined;
    while (i < pos) {
      const slot = this.elements[i];
      if (slot && slot !== true && slot.getBaseElement()) {
        nextElement = slot.getBaseElement()!;
      }
      i += 1;
    }
    if (nextElement) {
      this.layerElement.insertBefore(newElement, nextElement);
    } else {
      this.layerElement.appendChild(newElement);
    }
  }

  hide() {
    this.layerElement.style.display = 'none';
  }

  show() {
    this.layerElement.style.display = 'block';
  }
}

export default SVGRendererBase;
