/* eslint-disable @typescript-eslint/no-explicit-any -- SVG style / mask graph mirrors PropertyFactory */
import { copyPrototypeDescriptors } from '../../utils/functionExtensions';
import { getLocationHref } from '../../main';
import ShapePropertyFactory from '../../utils/shapes/ShapeProperty';
import type { ShapePropertyFactoryApi } from '../../utils/shapes/shapePropertyFactoryTypes';
import BaseElement from '../BaseElement';
import TransformElement from '../helpers/TransformElement';
import SVGBaseElement from './SVGBaseElement';
import HierarchyElement from '../helpers/HierarchyElement';
import FrameElement from '../helpers/FrameElement';
import RenderableDOMElement from '../helpers/RenderableDOMElement';
import getBlendMode from '../../utils/helpers/blendModes';
import Matrix from '../../3rd_party/transformation-matrix';
import IShapeElement from '../ShapeElement';
import TransformPropertyFactory from '../../utils/TransformProperty';
import { ShapeModifiers } from '../../utils/shapes/ShapeModifiers';
import { lineCapEnum, lineJoinEnum } from '../../utils/helpers/shapeEnums';
import SVGShapeData, { type ShapeTransformerLike } from '../helpers/shapes/SVGShapeData';
import SVGStyleData from '../helpers/shapes/SVGStyleData';
import SVGStrokeStyleData from '../helpers/shapes/SVGStrokeStyleData';
import SVGFillStyleData from '../helpers/shapes/SVGFillStyleData';
import SVGNoStyleData from '../helpers/shapes/SVGNoStyleData';
import SVGGradientFillStyleData from '../helpers/shapes/SVGGradientFillStyleData';
import SVGGradientStrokeStyleData from '../helpers/shapes/SVGGradientStrokeStyleData';
import ShapeGroupData from '../helpers/shapes/ShapeGroupData';
import SVGTransformData from '../helpers/shapes/SVGTransformData';
import SVGElementsRenderer from '../helpers/shapes/SVGElementsRenderer';
import type { ElementData, GlobalDataSvgShape, ShapeJsonNode, ShapeModifierLike } from '../../types/lottieRuntime';
import type { LayerDynamicProperty } from '../../types/lottieRuntime';
import type ProcessedElement from '../helpers/shapes/ProcessedElement';

type ShapeModifierRuntime = ShapeModifierLike & {
  init: (...args: unknown[]) => void;
  closed?: boolean;
};

class SVGShapeElement {
  declare initElement: (data: ElementData, globalData: GlobalDataSvgShape, comp: unknown) => void;
  declare layerElement: SVGGElement;
  declare globalData: GlobalDataSvgShape;
  declare data: ElementData & { shapes: ShapeJsonNode[] };
  declare dynamicProperties: LayerDynamicProperty[];
  declare destroyBaseElement: () => void;
  declare addShapeToModifiers: (data: unknown) => void;
  declare renderModifiers: () => void;
  declare searchProcessedElement: (elem: unknown) => number;
  declare addProcessedElement: (elem: unknown, pos: number) => void;

  shapes: InstanceType<typeof SVGShapeData>[];
  shapesData: ShapeJsonNode[];
  stylesList: any[];
  shapeModifiers: ShapeModifierLike[];
  itemsData: any[];
  processedElements: ProcessedElement[];
  animatedContents: Array<{
    fn: (d: unknown, el: unknown, first: boolean) => void;
    element: unknown;
    data: unknown;
  }>;
  prevViewData: any[];
  _isFirstFrame!: boolean;

  constructor(data: ElementData & { shapes: ShapeJsonNode[] }, globalData: GlobalDataSvgShape, comp: unknown) {
    this.shapes = [];
    this.shapesData = data.shapes;
    this.stylesList = [];
    this.shapeModifiers = [];
    this.itemsData = [];
    this.processedElements = [];
    this.animatedContents = [];
    this.initElement(data, globalData, comp);
    this.prevViewData = [];
  }

  createContent() {
    this.searchShapes(this.shapesData, this.itemsData, this.prevViewData, this.layerElement, 0, [], true);
    this.filterUniqueShapes();
  }

  filterUniqueShapes() {
    let i: number;
    const len = this.shapes.length;
    let shape: InstanceType<typeof SVGShapeData>;
    let j: number;
    const jLen = this.stylesList.length;
    let styleRef: any;
    const tempShapes: InstanceType<typeof SVGShapeData>[] = [];
    let areAnimated = false;
    for (j = 0; j < jLen; j += 1) {
      styleRef = this.stylesList[j];
      areAnimated = false;
      tempShapes.length = 0;
      for (i = 0; i < len; i += 1) {
        shape = this.shapes[i];
        if (shape.styles.indexOf(styleRef) !== -1) {
          tempShapes.push(shape);
          areAnimated = shape._isAnimated || areAnimated;
        }
      }
      if (tempShapes.length > 1 && areAnimated) {
        this.setShapesAsAnimated(tempShapes);
      }
    }
  }

  setShapesAsAnimated(shapes: InstanceType<typeof SVGShapeData>[]) {
    let i: number;
    const len = shapes.length;
    for (i = 0; i < len; i += 1) {
      shapes[i].setAsAnimated();
    }
  }

  createStyleElement(data: ShapeJsonNode, level: number) {
    let elementData: any;
    const styleData = data as any;
    const styleOb = new SVGStyleData(styleData, level);

    const pathElement = styleOb.pElem;
    if (data.ty === 'st') {
      elementData = new SVGStrokeStyleData(this, styleData, styleOb);
    } else if (data.ty === 'fl') {
      elementData = new SVGFillStyleData(this, styleData, styleOb);
    } else if (data.ty === 'gf' || data.ty === 'gs') {
      const GradientConstructor = data.ty === 'gf' ? SVGGradientFillStyleData : SVGGradientStrokeStyleData;
      elementData = new GradientConstructor(this, styleData, styleOb);
      this.globalData.defs.appendChild(elementData.gf);
      if (elementData.maskId) {
        this.globalData.defs.appendChild(elementData.ms);
        this.globalData.defs.appendChild(elementData.of);
        pathElement.setAttribute('mask', 'url(' + getLocationHref() + '#' + elementData.maskId + ')');
      }
    } else if (data.ty === 'no') {
      elementData = new SVGNoStyleData(this, styleData, styleOb);
    }

    if (data.ty === 'st' || data.ty === 'gs') {
      pathElement.setAttribute('stroke-linecap', lineCapEnum[Number(data.lc) || 2]);
      pathElement.setAttribute('stroke-linejoin', lineJoinEnum[Number(data.lj) || 2]);
      pathElement.setAttribute('fill-opacity', '0');
      if (data.lj === 1) {
        pathElement.setAttribute('stroke-miterlimit', String(data.ml));
      }
    }

    if (data.r === 2) {
      pathElement.setAttribute('fill-rule', 'evenodd');
    }

    if (data.ln) {
      pathElement.setAttribute('id', String(data.ln));
    }
    if (data.cl) {
      pathElement.setAttribute('class', String(data.cl));
    }
    if (data.bm) {
      pathElement.style.setProperty('mix-blend-mode', getBlendMode(data.bm as number));
    }
    this.stylesList.push(styleOb);
    this.addToAnimatedContents(data, elementData);
    return elementData;
  }

  createGroupElement(data: ShapeJsonNode) {
    const elementData = new ShapeGroupData();
    if (data.ln) {
      elementData.gr.setAttribute('id', String(data.ln));
    }
    if (data.cl) {
      elementData.gr.setAttribute('class', String(data.cl));
    }
    if (data.bm) {
      elementData.gr.style.setProperty('mix-blend-mode', getBlendMode(data.bm as number));
    }
    return elementData;
  }

  createTransformElement(data: ShapeJsonNode, container: SVGElement) {
    const transformProperty = TransformPropertyFactory.getTransformProperty(this, data, this);
    const elementData = new SVGTransformData(transformProperty, transformProperty.o, container);
    this.addToAnimatedContents(data, elementData);
    return elementData;
  }

  createShapeElement(data: ShapeJsonNode, ownTransformers: unknown[], level: number) {
    let ty = 4;
    if (data.ty === 'rc') {
      ty = 5;
    } else if (data.ty === 'el') {
      ty = 6;
    } else if (data.ty === 'sr') {
      ty = 7;
    }
    const shapeProperty = (ShapePropertyFactory as ShapePropertyFactoryApi).getShapeProp(this, data, ty, this);
    const elementData = new SVGShapeData(
      ownTransformers as ShapeTransformerLike[],
      level,
      shapeProperty as { k?: unknown },
    );
    this.shapes.push(elementData);
    this.addShapeToModifiers(elementData);
    this.addToAnimatedContents(data, elementData);
    return elementData;
  }

  addToAnimatedContents(data: ShapeJsonNode, element: unknown) {
    let i = 0;
    const len = this.animatedContents.length;
    while (i < len) {
      if (this.animatedContents[i].element === element) {
        return;
      }
      i += 1;
    }
    const fn = SVGElementsRenderer.createRenderFunction(data);
    if (!fn) {
      return;
    }
    this.animatedContents.push({
      fn: fn as (d: unknown, el: unknown, first: boolean) => void,
      element: element,
      data: data,
    });
  }

  setElementStyles(elementData: { styles: any[] }) {
    const arr = elementData.styles;
    let j: number;
    const jLen = this.stylesList.length;
    for (j = 0; j < jLen; j += 1) {
      if (arr.indexOf(this.stylesList[j]) === -1 && !this.stylesList[j].closed) {
        arr.push(this.stylesList[j]);
      }
    }
  }

  reloadShapes() {
    this._isFirstFrame = true;
    let i: number;
    let len = this.itemsData.length;
    for (i = 0; i < len; i += 1) {
      this.prevViewData[i] = this.itemsData[i];
    }
    this.searchShapes(this.shapesData, this.itemsData, this.prevViewData, this.layerElement, 0, [], true);
    this.filterUniqueShapes();
    len = this.dynamicProperties.length;
    for (i = 0; i < len; i += 1) {
      this.dynamicProperties[i].getValue();
    }
    this.renderModifiers();
  }

  searchShapes(
    arr: ShapeJsonNode[],
    itemsData: any[],
    prevViewData: any[],
    container: SVGElement,
    level: number,
    transformers: unknown[],
    render: boolean,
  ) {
    const ownTransformers: unknown[] = transformers.slice();
    let i: number;
    let len = arr.length - 1;
    let j: number;
    let jLen: number;
    const ownStyles: { closed?: boolean }[] = [];
    const ownModifiers: ShapeModifierRuntime[] = [];
    let currentTransform: unknown;
    let modifier: ShapeModifierRuntime;
    let processedPos: number;
    for (i = len; i >= 0; i -= 1) {
      processedPos = this.searchProcessedElement(arr[i]);
      if (!processedPos) {
        arr[i]._render = render;
      } else {
        itemsData[i] = prevViewData[processedPos - 1];
      }
      if (arr[i].ty === 'fl' || arr[i].ty === 'st' || arr[i].ty === 'gf' || arr[i].ty === 'gs' || arr[i].ty === 'no') {
        if (!processedPos) {
          itemsData[i] = this.createStyleElement(arr[i], level);
        } else {
          itemsData[i].style.closed = !!arr[i].hd;
        }
        if (arr[i]._render) {
          if (itemsData[i].style.pElem.parentNode !== container) {
            container.appendChild(itemsData[i].style.pElem);
          }
        }
        ownStyles.push(itemsData[i].style);
      } else if (arr[i].ty === 'gr') {
        if (!processedPos) {
          itemsData[i] = this.createGroupElement(arr[i]);
        } else {
          jLen = itemsData[i].it.length;
          for (j = 0; j < jLen; j += 1) {
            itemsData[i].prevViewData[j] = itemsData[i].it[j];
          }
        }
        this.searchShapes(
          arr[i].it ?? [],
          itemsData[i].it,
          itemsData[i].prevViewData,
          itemsData[i].gr,
          level + 1,
          ownTransformers,
          render,
        );
        if (arr[i]._render) {
          if (itemsData[i].gr.parentNode !== container) {
            container.appendChild(itemsData[i].gr);
          }
        }
      } else if (arr[i].ty === 'tr') {
        if (!processedPos) {
          itemsData[i] = this.createTransformElement(arr[i], container);
        }
        currentTransform = itemsData[i].transform;
        ownTransformers.push(currentTransform);
      } else if (arr[i].ty === 'sh' || arr[i].ty === 'rc' || arr[i].ty === 'el' || arr[i].ty === 'sr') {
        if (!processedPos) {
          itemsData[i] = this.createShapeElement(arr[i], ownTransformers, level);
        }
        this.setElementStyles(itemsData[i]);
      } else if (
        arr[i].ty === 'tm' ||
        arr[i].ty === 'rd' ||
        arr[i].ty === 'ms' ||
        arr[i].ty === 'pb' ||
        arr[i].ty === 'zz' ||
        arr[i].ty === 'op'
      ) {
        if (!processedPos) {
          modifier = ShapeModifiers.getModifier(arr[i].ty) as ShapeModifierRuntime;
          modifier.init(this, arr[i]);
          itemsData[i] = modifier;
          this.shapeModifiers.push(modifier);
        } else {
          modifier = itemsData[i] as ShapeModifierRuntime;
          modifier.closed = false;
        }
        ownModifiers.push(modifier);
      } else if (arr[i].ty === 'rp') {
        if (!processedPos) {
          modifier = ShapeModifiers.getModifier(arr[i].ty) as ShapeModifierRuntime;
          itemsData[i] = modifier;
          modifier.init(this, arr, i, itemsData);
          this.shapeModifiers.push(modifier);
          render = false;
        } else {
          modifier = itemsData[i] as ShapeModifierRuntime;
          modifier.closed = true;
        }
        ownModifiers.push(modifier);
      }
      this.addProcessedElement(arr[i], i + 1);
    }
    len = ownStyles.length;
    for (i = 0; i < len; i += 1) {
      ownStyles[i].closed = true;
    }
    len = ownModifiers.length;
    for (i = 0; i < len; i += 1) {
      ownModifiers[i].closed = true;
    }
  }

  renderShape() {
    let i: number;
    const len = this.animatedContents.length;
    let animatedContent: (typeof this.animatedContents)[0];
    for (i = 0; i < len; i += 1) {
      animatedContent = this.animatedContents[i];
      if (
        (this._isFirstFrame || (animatedContent.element as { _isAnimated?: boolean })._isAnimated) &&
        animatedContent.data !== true
      ) {
        animatedContent.fn(animatedContent.data, animatedContent.element, this._isFirstFrame);
      }
    }
  }

  initSecondaryElement() {}

  buildExpressionInterface() {}

  renderInnerContent() {
    this.renderModifiers();
    let i: number;
    const len = this.stylesList.length;
    for (i = 0; i < len; i += 1) {
      this.stylesList[i].reset();
    }
    this.renderShape();
    for (i = 0; i < len; i += 1) {
      if (this.stylesList[i]._mdf || this._isFirstFrame) {
        if (this.stylesList[i].msElem) {
          this.stylesList[i].msElem.setAttribute('d', this.stylesList[i].d);
          this.stylesList[i].d = 'M0 0' + this.stylesList[i].d;
        }
        this.stylesList[i].pElem.setAttribute('d', this.stylesList[i].d || 'M0 0');
      }
    }
  }

  destroy() {
    this.destroyBaseElement();
    (this as { shapesData: ShapeJsonNode[] | null }).shapesData = null;
    (this as { itemsData: any[] | null }).itemsData = null;
  }
}

const svgShapeRenderInnerContent = SVGShapeElement.prototype.renderInnerContent;
const svgShapeDestroy = SVGShapeElement.prototype.destroy;

copyPrototypeDescriptors(
  [BaseElement, TransformElement, SVGBaseElement, IShapeElement, HierarchyElement, FrameElement, RenderableDOMElement],
  SVGShapeElement,
);

SVGShapeElement.prototype.renderInnerContent = svgShapeRenderInnerContent;
SVGShapeElement.prototype.destroy = svgShapeDestroy;

(
  SVGShapeElement as unknown as { prototype: { identityMatrix: InstanceType<typeof Matrix> } }
).prototype.identityMatrix = new Matrix();

export default SVGShapeElement;
