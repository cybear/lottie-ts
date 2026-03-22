/* eslint-disable @typescript-eslint/no-explicit-any -- HTML shape bbox + inherited SVG shape graph */
import { bmPow, bmMax, bmMin, bmSqrt } from '../../utils/common';
import { extendPrototype } from '../../utils/functionExtensions';
import createNS from '../../utils/helpers/svg_elements';
import RenderableElement from '../helpers/RenderableElement';
import BaseElement from '../BaseElement';
import TransformElement from '../helpers/TransformElement';
import HierarchyElement from '../helpers/HierarchyElement';
import FrameElement from '../helpers/FrameElement';
import HBaseElement from './HBaseElement';
import HSolidElement from './HSolidElement';
import SVGShapeElement from '../svgElements/SVGShapeElement';
import type { ElementData, GlobalDataSvgShape, ShapeJsonNode } from '../../types/lottieRuntime';
import type SVGShapeData from '../helpers/shapes/SVGShapeData';

class HShapeElement {
  declare initElement: (data: ElementData, globalData: GlobalDataSvgShape, comp: unknown) => void;
  declare data: ElementData & { shapes: ShapeJsonNode[]; hasMask?: boolean };
  declare globalData: GlobalDataSvgShape;
  declare comp: HBaseElement['comp'];
  declare layerElement: globalThis.SVGGElement;
  declare svgElement: SVGSVGElement;
  declare baseElement: HTMLElement;
  declare hidden: boolean;
  declare _isFirstFrame: boolean;
  declare _mdf: boolean;
  declare searchShapes: (
    data: ShapeJsonNode[],
    items: unknown[],
    prev: unknown[],
    container: SVGElement,
    level: number,
    transformers: unknown[],
    tag: boolean,
  ) => void;
  declare filterUniqueShapes: () => void;

  shapes: InstanceType<typeof SVGShapeData>[];
  shapesData: ShapeJsonNode[];
  stylesList: any[];
  shapeModifiers: any[];
  itemsData: any[];
  processedElements: any[];
  animatedContents: any[];
  shapesContainer!: SVGGElement;
  prevViewData: any[];
  currentBBox: { x: number; y: number; h: number; w: number };
  shapeCont!: SVGSVGElement | SVGElement;
  shapeBoundingBox!: { left: number; right: number; top: number; bottom: number };
  tempBoundingBox!: { x: number; xMax: number; y: number; yMax: number; width: number; height: number };
  _renderShapeFrame!: () => void;

  constructor(data: ElementData & { shapes: ShapeJsonNode[] }, globalData: GlobalDataSvgShape, comp: unknown) {
    // List of drawable elements
    this.shapes = [];
    // Full shape data
    this.shapesData = data.shapes;
    // List of styles that will be applied to shapes
    this.stylesList = [];
    // List of modifiers that will be applied to shapes
    this.shapeModifiers = [];
    // List of items in shape tree
    this.itemsData = [];
    // List of items in previous shape tree
    this.processedElements = [];
    // List of animated components
    this.animatedContents = [];
    this.shapesContainer = createNS('g') as SVGGElement;
    this.initElement(data, globalData, comp);
    // Moving any property that doesn't get too much access after initialization because of v8 way of handling more than 10 properties.
    // List of elements that have been created
    this.prevViewData = [];
    this.currentBBox = {
      x: 999999,
      y: -999999,
      h: 0,
      w: 0,
    };
  }

  getTransformedPoint(
    transformers: Array<{ mProps: { v: { applyToPointArray: (x: number, y: number, z: number) => number[] } } }>,
    point: number[],
  ) {
    let i;
    const len = transformers.length;
    for (i = 0; i < len; i += 1) {
      point = transformers[i].mProps.v.applyToPointArray(point[0], point[1], 0);
    }
    return point;
  }

  calculateShapeBoundingBox(item: any, boundingBox: any) {
    const shape = item.sh.v;
    const transformers = item.transformers;
    let i;
    const len = shape._length;
    let vPoint;
    let oPoint;
    let nextIPoint;
    let nextVPoint;
    if (len <= 1) {
      return;
    }
    for (i = 0; i < len - 1; i += 1) {
      vPoint = this.getTransformedPoint(transformers, shape.v[i]);
      oPoint = this.getTransformedPoint(transformers, shape.o[i]);
      nextIPoint = this.getTransformedPoint(transformers, shape.i[i + 1]);
      nextVPoint = this.getTransformedPoint(transformers, shape.v[i + 1]);
      this.checkBounds(vPoint, oPoint, nextIPoint, nextVPoint, boundingBox);
    }
    if (shape.c) {
      vPoint = this.getTransformedPoint(transformers, shape.v[i]);
      oPoint = this.getTransformedPoint(transformers, shape.o[i]);
      nextIPoint = this.getTransformedPoint(transformers, shape.i[0]);
      nextVPoint = this.getTransformedPoint(transformers, shape.v[0]);
      this.checkBounds(vPoint, oPoint, nextIPoint, nextVPoint, boundingBox);
    }
  }

  checkBounds(vPoint: number[], oPoint: number[], nextIPoint: number[], nextVPoint: number[], boundingBox: any) {
    this.getBoundsOfCurve(vPoint, oPoint, nextIPoint, nextVPoint);
    const bounds = this.shapeBoundingBox;
    boundingBox.x = bmMin(bounds.left, boundingBox.x);
    boundingBox.xMax = bmMax(bounds.right, boundingBox.xMax);
    boundingBox.y = bmMin(bounds.top, boundingBox.y);
    boundingBox.yMax = bmMax(bounds.bottom, boundingBox.yMax);
  }

  getBoundsOfCurve(p0: number[], p1: number[], p2: number[], p3: number[]) {
    const bounds = [
      [p0[0], p3[0]],
      [p0[1], p3[1]],
    ];

    for (let a, b, c, t, b2ac, t1, t2, i = 0; i < 2; ++i) {
      // eslint-disable-line no-plusplus
      b = 6 * p0[i] - 12 * p1[i] + 6 * p2[i];
      a = -3 * p0[i] + 9 * p1[i] - 9 * p2[i] + 3 * p3[i];
      c = 3 * p1[i] - 3 * p0[i];

      b |= 0; // eslint-disable-line no-bitwise
      a |= 0; // eslint-disable-line no-bitwise
      c |= 0; // eslint-disable-line no-bitwise

      if (a === 0 && b === 0) {
        //
      } else if (a === 0) {
        t = -c / b;

        if (t > 0 && t < 1) {
          bounds[i].push(this.calculateF(t, p0, p1, p2, p3, i));
        }
      } else {
        b2ac = b * b - 4 * c * a;

        if (b2ac >= 0) {
          t1 = (-b + bmSqrt(b2ac)) / (2 * a);
          if (t1 > 0 && t1 < 1) bounds[i].push(this.calculateF(t1, p0, p1, p2, p3, i));
          t2 = (-b - bmSqrt(b2ac)) / (2 * a);
          if (t2 > 0 && t2 < 1) bounds[i].push(this.calculateF(t2, p0, p1, p2, p3, i));
        }
      }
    }

    this.shapeBoundingBox.left = bmMin(...bounds[0]);
    this.shapeBoundingBox.top = bmMin(...bounds[1]);
    this.shapeBoundingBox.right = bmMax(...bounds[0]);
    this.shapeBoundingBox.bottom = bmMax(...bounds[1]);
  }

  calculateF(t: number, p0: number[], p1: number[], p2: number[], p3: number[], i: number) {
    return (
      bmPow(1 - t, 3) * p0[i] +
      3 * bmPow(1 - t, 2) * t * p1[i] +
      3 * (1 - t) * bmPow(t, 2) * p2[i] +
      bmPow(t, 3) * p3[i]
    );
  }

  calculateBoundingBox(itemsData: any[], boundingBox: any) {
    let i;
    const len = itemsData.length;
    for (i = 0; i < len; i += 1) {
      if (itemsData[i] && itemsData[i].sh) {
        this.calculateShapeBoundingBox(itemsData[i], boundingBox);
      } else if (itemsData[i] && itemsData[i].it) {
        this.calculateBoundingBox(itemsData[i].it, boundingBox);
      } else if (itemsData[i] && itemsData[i].style && itemsData[i].w) {
        this.expandStrokeBoundingBox(itemsData[i].w, boundingBox);
      }
    }
  }

  expandStrokeBoundingBox(widthProperty: any, boundingBox: any) {
    let width = 0;
    if (widthProperty.keyframes) {
      for (let i = 0; i < widthProperty.keyframes.length; i += 1) {
        const kfw = widthProperty.keyframes[i].s;
        if (kfw > width) {
          width = kfw;
        }
      }
      width *= widthProperty.mult;
    } else {
      width = widthProperty.v * widthProperty.mult;
    }

    boundingBox.x -= width;
    boundingBox.xMax += width;
    boundingBox.y -= width;
    boundingBox.yMax += width;
  }

  currentBoxContains(box: { x: number; y: number; width: number; height: number }) {
    return (
      this.currentBBox.x <= box.x &&
      this.currentBBox.y <= box.y &&
      this.currentBBox.w + this.currentBBox.x >= box.x + box.width &&
      this.currentBBox.h + this.currentBBox.y >= box.y + box.height
    );
  }

  createContent() {
    let cont: SVGSVGElement;
    this.baseElement.style.fontSize = '0';
    if (this.data.hasMask) {
      this.layerElement.appendChild(this.shapesContainer);
      cont = this.svgElement;
    } else {
      cont = createNS('svg') as SVGSVGElement;
      const size = (this.comp.data ?? this.globalData.compSize) as { w: number; h: number };
      cont.setAttribute('width', String(size.w));
      cont.setAttribute('height', String(size.h));
      cont.appendChild(this.shapesContainer);
      this.layerElement.appendChild(cont);
    }

    this.searchShapes(this.shapesData, this.itemsData, this.prevViewData, this.shapesContainer, 0, [], true);
    this.filterUniqueShapes();
    this.shapeCont = cont;
  }

  renderInnerContent() {
    this._renderShapeFrame();

    if (!this.hidden && (this._isFirstFrame || this._mdf)) {
      const tempBoundingBox = this.tempBoundingBox;
      const max = 999999;
      tempBoundingBox.x = max;
      tempBoundingBox.xMax = -max;
      tempBoundingBox.y = max;
      tempBoundingBox.yMax = -max;
      this.calculateBoundingBox(this.itemsData, tempBoundingBox);
      tempBoundingBox.width = tempBoundingBox.xMax < tempBoundingBox.x ? 0 : tempBoundingBox.xMax - tempBoundingBox.x;
      tempBoundingBox.height = tempBoundingBox.yMax < tempBoundingBox.y ? 0 : tempBoundingBox.yMax - tempBoundingBox.y;
      // var tempBoundingBox = this.shapeCont.getBBox();
      if (this.currentBoxContains(tempBoundingBox)) {
        return;
      }
      let changed = false;
      if (this.currentBBox.w !== tempBoundingBox.width) {
        this.currentBBox.w = tempBoundingBox.width;
        this.shapeCont.setAttribute('width', String(tempBoundingBox.width));
        changed = true;
      }
      if (this.currentBBox.h !== tempBoundingBox.height) {
        this.currentBBox.h = tempBoundingBox.height;
        this.shapeCont.setAttribute('height', String(tempBoundingBox.height));
        changed = true;
      }
      if (changed || this.currentBBox.x !== tempBoundingBox.x || this.currentBBox.y !== tempBoundingBox.y) {
        this.currentBBox.w = tempBoundingBox.width;
        this.currentBBox.h = tempBoundingBox.height;
        this.currentBBox.x = tempBoundingBox.x;
        this.currentBBox.y = tempBoundingBox.y;

        this.shapeCont.setAttribute(
          'viewBox',
          this.currentBBox.x + ' ' + this.currentBBox.y + ' ' + this.currentBBox.w + ' ' + this.currentBBox.h,
        );
        const shapeStyle = this.shapeCont.style;
        const shapeTransform = 'translate(' + this.currentBBox.x + 'px,' + this.currentBBox.y + 'px)';
        shapeStyle.transform = shapeTransform;
        shapeStyle.webkitTransform = shapeTransform;
      }
    }
  }
}

const hShapeCreateContent = HShapeElement.prototype.createContent;
const hShapeRenderInnerContent = HShapeElement.prototype.renderInnerContent;

extendPrototype(
  [
    BaseElement,
    TransformElement,
    HSolidElement,
    SVGShapeElement,
    HBaseElement,
    HierarchyElement,
    FrameElement,
    RenderableElement,
  ],
  HShapeElement,
);

HShapeElement.prototype._renderShapeFrame = HShapeElement.prototype.renderInnerContent;
HShapeElement.prototype.createContent = hShapeCreateContent;
HShapeElement.prototype.renderInnerContent = hShapeRenderInnerContent;

const hShapeProto = HShapeElement.prototype as unknown as {
  shapeBoundingBox: { left: number; right: number; top: number; bottom: number };
  tempBoundingBox: { x: number; xMax: number; y: number; yMax: number; width: number; height: number };
};
hShapeProto.shapeBoundingBox = {
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
};

hShapeProto.tempBoundingBox = {
  x: 0,
  xMax: 0,
  y: 0,
  yMax: 0,
  width: 0,
  height: 0,
};

export default HShapeElement;
