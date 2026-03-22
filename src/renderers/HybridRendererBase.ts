import createNS from '../utils/helpers/svg_elements';
import createTag from '../utils/helpers/html_elements';
import SVGRendererBase from './SVGRendererBase';
import HSolidElement from '../elements/htmlElements/HSolidElement';
import { styleDiv } from '../utils/common';
import BaseRenderer from './BaseRenderer';
import IImageElement from '../elements/ImageElement';
import SVGShapeElement from '../elements/svgElements/SVGShapeElement';
import HShapeElement from '../elements/htmlElements/HShapeElement';
import HTextElement from '../elements/htmlElements/HTextElement';
import HCameraElement from '../elements/htmlElements/HCameraElement';
import HImageElement from '../elements/htmlElements/HImageElement';
import ISolidElement from '../elements/SolidElement';
import SVGTextLottieElement from '../elements/svgElements/SVGTextElement';
import type {
  AnimationItemRendererPartial,
  AnimationRootData,
  ElementData,
  GlobalData,
  ProjectInterfaceLike,
  RefIdLayerData,
  RendererElementInstance,
  RendererElementSlot,
  RendererLayerData,
  RenderConfig,
  SolidColorLayerData,
} from '../types/lottieRuntime';

export interface HybridThreeDContainer {
  container: HTMLDivElement;
  perspectiveElem: HTMLDivElement;
  startPos: number;
  endPos: number;
  type: string;
}

/** Camera layer instance (`HCameraElement`) used by hybrid init. */
export interface HybridCameraInstance extends RendererElementInstance {
  setup(): void;
}

abstract class HybridRendererBase extends BaseRenderer {
  declare animationItem: AnimationItemRendererPartial;
  renderConfig!: RenderConfig;
  globalData!: GlobalData;
  data!: AnimationRootData;
  layers!: RendererLayerData[];
  elements!: RendererElementSlot[];
  pendingElements!: RendererElementInstance[];
  completeLayers!: boolean;
  renderedFrame!: number;
  destroyed!: boolean;
  resizerElem!: HTMLDivElement;
  layerElement!: HTMLDivElement;
  threeDElements!: HybridThreeDContainer[];
  camera: HybridCameraInstance | null;
  supports3d: boolean;
  rendererType: string;

  abstract createComp(data: RendererLayerData, ...args: unknown[]): RendererElementInstance;

  constructor(animationItem: AnimationItemRendererPartial, config?: Partial<RenderConfig>) {
    super();
    this.animationItem = animationItem;
    this.layers = null as unknown as RendererLayerData[];
    this.renderedFrame = -1;
    this.renderConfig = {
      className: (config && config.className) || '',
      imagePreserveAspectRatio: (config && config.imagePreserveAspectRatio) || 'xMidYMid slice',
      hideOnTransparent: !(config && config.hideOnTransparent === false),
      filterSize: {
        width: (config && config.filterSize && config.filterSize.width) || '400%',
        height: (config && config.filterSize && config.filterSize.height) || '400%',
        x: (config && config.filterSize && config.filterSize.x) || '-100%',
        y: (config && config.filterSize && config.filterSize.y) || '-100%',
      },
    };
    this.globalData = {
      _mdf: false,
      frameNum: -1,
      renderConfig: this.renderConfig,
    };
    this.pendingElements = [];
    this.elements = [];
    this.threeDElements = [];
    this.destroyed = false;
    this.camera = null;
    this.supports3d = true;
    this.rendererType = 'html';
  }

  checkPendingElements() {
    while (this.pendingElements.length) {
      const element = this.pendingElements.pop()!;
      element.checkParenting();
    }
  }

  appendElementInPos(element: RendererElementInstance, pos: number) {
    const newDOMElement = element.getBaseElement();
    if (!newDOMElement) {
      return;
    }
    const layer = this.layers[pos];
    if (!layer.ddd || !this.supports3d) {
      if (this.threeDElements) {
        this.addTo3dContainer(newDOMElement, pos);
      } else {
        let i = 0;
        let nextDOMElement: Element | undefined;
        let nextLayer: RendererElementInstance;
        let tmpDOMElement: Element | null;
        while (i < pos) {
          const slot = this.elements[i];
          if (slot && slot !== true && (slot as RendererElementInstance).getBaseElement) {
            nextLayer = slot as RendererElementInstance;
            tmpDOMElement = this.layers[i].ddd
              ? (this.getThreeDContainerByPos(i) as Element | null)
              : nextLayer.getBaseElement();
            nextDOMElement = tmpDOMElement || nextDOMElement;
          }
          i += 1;
        }
        if (nextDOMElement) {
          if (!layer.ddd || !this.supports3d) {
            this.layerElement.insertBefore(newDOMElement, nextDOMElement);
          }
        } else if (!layer.ddd || !this.supports3d) {
          this.layerElement.appendChild(newDOMElement);
        }
      }
    } else {
      this.addTo3dContainer(newDOMElement, pos);
    }
  }

  createShape(data: RendererLayerData): RendererElementInstance {
    if (!this.supports3d) {
      return new SVGShapeElement(data, this.globalData, this) as unknown as RendererElementInstance;
    }
    return new HShapeElement(data, this.globalData, this) as unknown as RendererElementInstance;
  }

  createText(data: RendererLayerData): RendererElementInstance {
    if (!this.supports3d) {
      return new SVGTextLottieElement(data, this.globalData, this) as unknown as RendererElementInstance;
    }
    return new HTextElement(data, this.globalData, this) as unknown as RendererElementInstance;
  }

  createCamera(data: RendererLayerData): RendererElementInstance {
    this.camera = new HCameraElement(data, this.globalData, this) as unknown as HybridCameraInstance;
    return this.camera;
  }

  createImage(data: RendererLayerData): RendererElementInstance {
    if (!this.supports3d) {
      return new IImageElement(
        data as unknown as RefIdLayerData,
        this.globalData,
        this,
      ) as unknown as RendererElementInstance;
    }
    return new HImageElement(data, this.globalData, this) as unknown as RendererElementInstance;
  }

  createSolid(data: RendererLayerData): RendererElementInstance {
    if (!this.supports3d) {
      return new ISolidElement(
        data as unknown as SolidColorLayerData,
        this.globalData,
        this,
      ) as unknown as RendererElementInstance;
    }
    return new HSolidElement(
      data as unknown as SolidColorLayerData,
      this.globalData,
      this,
    ) as unknown as RendererElementInstance;
  }

  createNull(data: RendererLayerData): RendererElementInstance {
    return SVGRendererBase.prototype.createNull.call(this, data) as RendererElementInstance;
  }

  buildItem(pos: number) {
    return SVGRendererBase.prototype.buildItem.call(this, pos);
  }

  renderFrame(num: number | null) {
    return SVGRendererBase.prototype.renderFrame.call(this, num);
  }

  getThreeDContainerByPos(pos: number): HTMLDivElement | null {
    let i = 0;
    const len = this.threeDElements.length;
    while (i < len) {
      if (this.threeDElements[i].startPos <= pos && this.threeDElements[i].endPos >= pos) {
        return this.threeDElements[i].perspectiveElem;
      }
      i += 1;
    }
    return null;
  }

  createThreeDContainer(pos: number, type: string): HybridThreeDContainer {
    const perspectiveElem = createTag('div') as HTMLDivElement;
    let style: CSSStyleDeclaration & {
      webkitTransformOrigin?: string;
      mozTransformOrigin?: string;
    };
    let containerStyle: CSSStyleDeclaration & { webkitTransform?: string };
    styleDiv(perspectiveElem);
    const container = createTag('div') as HTMLDivElement;
    styleDiv(container);
    if (type === '3d') {
      style = perspectiveElem.style as typeof style;
      const cs = this.globalData.compSize!;
      style.width = cs.w + 'px';
      style.height = cs.h + 'px';
      const center = '50% 50%';
      style.webkitTransformOrigin = center;
      style.mozTransformOrigin = center;
      style.transformOrigin = center;
      containerStyle = container.style as typeof containerStyle;
      const matrix = 'matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1)';
      containerStyle.transform = matrix;
      containerStyle.webkitTransform = matrix;
    }

    perspectiveElem.appendChild(container);
    const threeDContainerData: HybridThreeDContainer = {
      container: container,
      perspectiveElem: perspectiveElem,
      startPos: pos,
      endPos: pos,
      type: type,
    };
    this.threeDElements.push(threeDContainerData);
    return threeDContainerData;
  }

  build3dContainers() {
    let i: number;
    let len = this.layers.length;
    let lastThreeDContainerData!: HybridThreeDContainer;
    let currentContainer = '';
    for (i = 0; i < len; i += 1) {
      if (this.layers[i].ddd && this.layers[i].ty !== 3) {
        if (currentContainer !== '3d') {
          currentContainer = '3d';
          lastThreeDContainerData = this.createThreeDContainer(i, '3d');
        }
        lastThreeDContainerData.endPos = Math.max(lastThreeDContainerData.endPos, i);
      } else {
        if (currentContainer !== '2d') {
          currentContainer = '2d';
          lastThreeDContainerData = this.createThreeDContainer(i, '2d');
        }
        lastThreeDContainerData.endPos = Math.max(lastThreeDContainerData.endPos, i);
      }
    }
    len = this.threeDElements.length;
    for (i = len - 1; i >= 0; i -= 1) {
      this.resizerElem.appendChild(this.threeDElements[i].perspectiveElem);
    }
  }

  addTo3dContainer(elem: Element, pos: number) {
    let i = 0;
    const len = this.threeDElements.length;
    while (i < len) {
      if (pos <= this.threeDElements[i].endPos) {
        let j = this.threeDElements[i].startPos;
        let nextElement: Element | undefined;
        while (j < pos) {
          const slot = this.elements[j];
          if (slot && slot !== true && (slot as RendererElementInstance).getBaseElement) {
            nextElement = (slot as RendererElementInstance).getBaseElement()!;
          }
          j += 1;
        }
        if (nextElement) {
          this.threeDElements[i].container.insertBefore(elem, nextElement);
        } else {
          this.threeDElements[i].container.appendChild(elem);
        }
        break;
      }
      i += 1;
    }
  }

  configAnimation(animData: AnimationRootData) {
    const resizerElem = createTag('div') as HTMLDivElement;
    const wrapper = this.animationItem.wrapper;
    const style = resizerElem.style as CSSStyleDeclaration & {
      mozTransformStyle?: string;
      webkitTransformStyle?: string;
    };
    style.width = animData.w + 'px';
    style.height = animData.h + 'px';
    this.resizerElem = resizerElem;
    styleDiv(resizerElem);
    style.transformStyle = 'flat';
    style.mozTransformStyle = 'flat';
    style.webkitTransformStyle = 'flat';
    if (this.renderConfig.className) {
      resizerElem.setAttribute('class', this.renderConfig.className);
    }
    wrapper.appendChild(resizerElem);

    style.overflow = 'hidden';
    const svg = createNS('svg');
    svg.setAttribute('width', '1');
    svg.setAttribute('height', '1');
    styleDiv(svg as unknown as HTMLElement);
    this.resizerElem.appendChild(svg);
    const defs = createNS('defs');
    svg.appendChild(defs);
    this.data = animData;
    this.setupGlobalData(animData, svg);
    this.globalData.defs = defs;
    this.layers = animData.layers;
    this.layerElement = this.resizerElem;
    this.build3dContainers();
    this.updateContainerSize();
  }

  destroy() {
    if (this.animationItem.wrapper) {
      this.animationItem.wrapper.innerText = '';
    }
    this.animationItem.container = null;
    this.globalData.defs = null;
    let i: number;
    const len = this.layers ? this.layers.length : 0;
    for (i = 0; i < len; i += 1) {
      const slot = this.elements[i];
      if (slot && slot !== true && (slot as RendererElementInstance).destroy) {
        (slot as RendererElementInstance).destroy();
      }
    }
    this.elements.length = 0;
    this.destroyed = true;
    this.animationItem = null as unknown as AnimationItemRendererPartial;
  }

  updateContainerSize() {
    const elementWidth = this.animationItem.wrapper.offsetWidth;
    const elementHeight = this.animationItem.wrapper.offsetHeight;
    const elementRel = elementWidth / elementHeight;
    const cs = this.globalData.compSize!;
    const animationRel = cs.w / cs.h;
    let sx: number;
    let sy: number;
    let tx: number;
    let ty: number;
    if (animationRel > elementRel) {
      sx = elementWidth / cs.w;
      sy = elementWidth / cs.w;
      tx = 0;
      ty = (elementHeight - cs.h * (elementWidth / cs.w)) / 2;
    } else {
      sx = elementHeight / cs.h;
      sy = elementHeight / cs.h;
      tx = (elementWidth - cs.w * (elementHeight / cs.h)) / 2;
      ty = 0;
    }
    const style = this.resizerElem.style as CSSStyleDeclaration & { webkitTransform?: string };
    style.webkitTransform = 'matrix3d(' + sx + ',0,0,0,0,' + sy + ',0,0,0,0,1,0,' + tx + ',' + ty + ',0,1)';
    style.transform = style.webkitTransform;
  }

  hide() {
    this.resizerElem.style.display = 'none';
  }

  show() {
    this.resizerElem.style.display = 'block';
  }

  initItems() {
    this.buildAllItems();
    if (this.camera) {
      this.camera.setup();
    } else {
      const cWidth = this.globalData.compSize!.w;
      const cHeight = this.globalData.compSize!.h;
      let i: number;
      const len = this.threeDElements.length;
      for (i = 0; i < len; i += 1) {
        const elStyle = this.threeDElements[i].perspectiveElem.style as CSSStyleDeclaration & {
          webkitPerspective?: string;
        };
        elStyle.webkitPerspective = Math.sqrt(Math.pow(cWidth, 2) + Math.pow(cHeight, 2)) + 'px';
        elStyle.perspective = elStyle.webkitPerspective;
      }
    }
  }

  searchExtraCompositions(assets: Array<ElementData & { xt?: boolean }>) {
    let i: number;
    const len = assets.length;
    const floatingContainer = createTag('div') as HTMLDivElement;
    const pi = this.globalData.projectInterface as ProjectInterfaceLike;
    for (i = 0; i < len; i += 1) {
      if (assets[i].xt) {
        const comp = this.createComp(assets[i] as RendererLayerData, floatingContainer, this.globalData.comp, null);
        comp.initExpressions();
        pi.registerComposition(comp);
      }
    }
  }
}

export default HybridRendererBase;
