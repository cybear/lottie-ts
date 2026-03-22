// @ts-nocheck
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

class HybridRendererBase extends BaseRenderer {
  constructor(animationItem, config) {
    super();
    this.animationItem = animationItem;
    this.layers = null;
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
      const element = this.pendingElements.pop();
      element.checkParenting();
    }
  }

  appendElementInPos(element, pos) {
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
        let nextDOMElement;
        let nextLayer;
        let tmpDOMElement;
        while (i < pos) {
          if (this.elements[i] && this.elements[i] !== true && this.elements[i].getBaseElement) {
            nextLayer = this.elements[i];
            tmpDOMElement = this.layers[i].ddd ? this.getThreeDContainerByPos(i) : nextLayer.getBaseElement();
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

  createShape(data) {
    if (!this.supports3d) {
      return new SVGShapeElement(data, this.globalData, this);
    }
    return new HShapeElement(data, this.globalData, this);
  }

  createText(data) {
    if (!this.supports3d) {
      return new SVGTextLottieElement(data, this.globalData, this);
    }
    return new HTextElement(data, this.globalData, this);
  }

  createCamera(data) {
    this.camera = new HCameraElement(data, this.globalData, this);
    return this.camera;
  }

  createImage(data) {
    if (!this.supports3d) {
      return new IImageElement(data, this.globalData, this);
    }
    return new HImageElement(data, this.globalData, this);
  }

  createSolid(data) {
    if (!this.supports3d) {
      return new ISolidElement(data, this.globalData, this);
    }
    return new HSolidElement(data, this.globalData, this);
  }

  getThreeDContainerByPos(pos) {
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

  createThreeDContainer(pos, type) {
    const perspectiveElem = createTag('div');
    let style;
    let containerStyle;
    styleDiv(perspectiveElem);
    const container = createTag('div');
    styleDiv(container);
    if (type === '3d') {
      style = perspectiveElem.style;
      style.width = this.globalData.compSize.w + 'px';
      style.height = this.globalData.compSize.h + 'px';
      const center = '50% 50%';
      style.webkitTransformOrigin = center;
      style.mozTransformOrigin = center;
      style.transformOrigin = center;
      containerStyle = container.style;
      const matrix = 'matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1)';
      containerStyle.transform = matrix;
      containerStyle.webkitTransform = matrix;
    }

    perspectiveElem.appendChild(container);
    // this.resizerElem.appendChild(perspectiveElem);
    const threeDContainerData = {
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
    let i;
    let len = this.layers.length;
    let lastThreeDContainerData;
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

  addTo3dContainer(elem, pos) {
    let i = 0;
    const len = this.threeDElements.length;
    while (i < len) {
      if (pos <= this.threeDElements[i].endPos) {
        let j = this.threeDElements[i].startPos;
        let nextElement;
        while (j < pos) {
          if (this.elements[j] && this.elements[j].getBaseElement) {
            nextElement = this.elements[j].getBaseElement();
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

  configAnimation(animData) {
    const resizerElem = createTag('div');
    const wrapper = this.animationItem.wrapper;
    const style = resizerElem.style;
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
    styleDiv(svg);
    this.resizerElem.appendChild(svg);
    const defs = createNS('defs');
    svg.appendChild(defs);
    this.data = animData;
    // Mask animation
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
    let i;
    const len = this.layers ? this.layers.length : 0;
    for (i = 0; i < len; i += 1) {
      if (this.elements[i] && this.elements[i].destroy) {
        this.elements[i].destroy();
      }
    }
    this.elements.length = 0;
    this.destroyed = true;
    this.animationItem = null;
  }

  updateContainerSize() {
    const elementWidth = this.animationItem.wrapper.offsetWidth;
    const elementHeight = this.animationItem.wrapper.offsetHeight;
    const elementRel = elementWidth / elementHeight;
    const animationRel = this.globalData.compSize.w / this.globalData.compSize.h;
    let sx;
    let sy;
    let tx;
    let ty;
    if (animationRel > elementRel) {
      sx = elementWidth / this.globalData.compSize.w;
      sy = elementWidth / this.globalData.compSize.w;
      tx = 0;
      ty = (elementHeight - this.globalData.compSize.h * (elementWidth / this.globalData.compSize.w)) / 2;
    } else {
      sx = elementHeight / this.globalData.compSize.h;
      sy = elementHeight / this.globalData.compSize.h;
      tx = (elementWidth - this.globalData.compSize.w * (elementHeight / this.globalData.compSize.h)) / 2;
      ty = 0;
    }
    const style = this.resizerElem.style;
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
      const cWidth = this.globalData.compSize.w;
      const cHeight = this.globalData.compSize.h;
      let i;
      const len = this.threeDElements.length;
      for (i = 0; i < len; i += 1) {
        const style = this.threeDElements[i].perspectiveElem.style;
        style.webkitPerspective = Math.sqrt(Math.pow(cWidth, 2) + Math.pow(cHeight, 2)) + 'px';
        style.perspective = style.webkitPerspective;
      }
    }
  }

  searchExtraCompositions(assets) {
    let i;
    const len = assets.length;
    const floatingContainer = createTag('div');
    for (i = 0; i < len; i += 1) {
      if (assets[i].xt) {
        const comp = this.createComp(assets[i], floatingContainer, this.globalData.comp, null);
        comp.initExpressions();
        this.globalData.projectInterface.registerComposition(comp);
      }
    }
  }
}

HybridRendererBase.prototype.buildItem = SVGRendererBase.prototype.buildItem;
HybridRendererBase.prototype.renderFrame = SVGRendererBase.prototype.renderFrame;
HybridRendererBase.prototype.createNull = SVGRendererBase.prototype.createNull;

export default HybridRendererBase;
