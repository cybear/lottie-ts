import { getLocationHref } from './main';
import { createElementID } from './utils/common';
import { createSizedArray } from './utils/helpers/arrays';
import PropertyFactory from './utils/PropertyFactory';
import ShapePropertyFactory from './utils/shapes/ShapeProperty';
import type { ShapePropertyFactoryApi } from './utils/shapes/shapePropertyFactoryTypes';
import createNS from './utils/helpers/svg_elements';
import type {
  GlobalData,
  MaskDefinitionJson,
  MaskHostLayerData,
  RenderableComponentEntry,
} from './types/lottieRuntime';

const shapeFactory = ShapePropertyFactory as ShapePropertyFactoryApi;

/** Bezier path value passed to `drawPath` (`prop.v` from shape property). */
interface MaskPathNodes {
  v: number[][];
  o: number[][];
  i: number[][];
  _length: number;
  c?: boolean;
}

interface MaskOpacityProp {
  v: number;
  _mdf?: boolean;
}

/** Shape property for a mask path (`viewData[i].prop` on SVG; canvas stores this shape directly on `viewData[i]`). */
export interface MaskShapeProp {
  v: MaskPathNodes;
  _mdf?: boolean;
  k?: boolean;
}

type MaskViewDataEntry = {
  elem: SVGElement;
  lastPath: string;
  op: MaskOpacityProp;
  prop: MaskShapeProp;
  invRect?: SVGElement | null;
};

interface MaskExpanderProp {
  v: number;
  _mdf?: boolean;
}

interface StoredMaskRow {
  elem: SVGElement;
  x: MaskExpanderProp | null;
  expan: SVGElement | null;
  lastPath: string;
  lastOperator: string;
  filterId: string | undefined;
  lastRadius: number;
}

/** Layer host passed into `MaskElement` (SVG / HTML bases satisfy at runtime; structurally loose for mixin classes). */
export interface MaskHostElement {
  comp: { data: { w?: number; h?: number } };
  maskedElement: SVGElement;
  finalTransform: {
    mat: { getInverseMatrix(): { to2dCSS(): string } };
    mProp: { _mdf?: boolean };
  };
  addRenderableComponent(comp: RenderableComponentEntry): void;
}

class MaskElement {
  declare data: MaskHostLayerData;
  declare element: MaskHostElement;
  declare globalData: GlobalData;
  storedData: (StoredMaskRow | undefined)[];
  masksProperties: MaskDefinitionJson[];
  maskElement: SVGElement | null;
  viewData: MaskViewDataEntry[];
  solidPath: string;

  constructor(data: MaskHostLayerData, element: MaskHostElement, globalData: GlobalData) {
    this.data = data;
    this.element = element;
    this.globalData = globalData;
    this.storedData = [];
    this.masksProperties = this.data.masksProperties || [];
    this.maskElement = null;
    const defs = this.globalData.defs as SVGDefsElement;
    let i: number;
    let len = this.masksProperties ? this.masksProperties.length : 0;
    this.viewData = createSizedArray(len) as MaskViewDataEntry[];
    this.solidPath = '';

    let path: SVGElement;
    const properties = this.masksProperties;
    let count = 0;
    const currentMasks: SVGElement[] = [];
    let j: number;
    let jLen: number;
    const layerId = createElementID();
    let rect: SVGElement | null;
    let expansor: SVGElement;
    let feMorph: SVGElement | null;
    let x: MaskExpanderProp | null;
    let maskType: 'clipPath' | 'mask' = 'clipPath';
    let maskRef: 'clip-path' | 'mask' = 'clip-path';
    for (i = 0; i < len; i += 1) {
      const opacityProp = properties[i].o as { k: number; x?: unknown };
      if (
        (properties[i].mode !== 'a' && properties[i].mode !== 'n') ||
        properties[i].inv ||
        opacityProp.k !== 100 ||
        opacityProp.x
      ) {
        maskType = 'mask';
        maskRef = 'mask';
      }

      if ((properties[i].mode === 's' || properties[i].mode === 'i') && count === 0) {
        rect = createNS('rect');
        rect.setAttribute('fill', '#ffffff');
        rect.setAttribute('width', String(this.element.comp.data.w || 0));
        rect.setAttribute('height', String(this.element.comp.data.h || 0));
        currentMasks.push(rect);
      } else {
        rect = null;
      }

      path = createNS('path');
      if (properties[i].mode === 'n') {
        this.viewData[i] = {
          op: PropertyFactory.getProp(this.element, properties[i].o, 0, 0.01, this.element) as MaskOpacityProp,
          prop: shapeFactory.getShapeProp(this.element, properties[i], 3) as MaskShapeProp,
          elem: path,
          lastPath: '',
        };
        defs.appendChild(path);
      } else {
        count += 1;

        path.setAttribute('fill', properties[i].mode === 's' ? '#000000' : '#ffffff');
        path.setAttribute('clip-rule', 'nonzero');
        let filterID: string | undefined;

        if ((properties[i].x as { k: number }).k !== 0) {
          maskType = 'mask';
          maskRef = 'mask';
          x = PropertyFactory.getProp(this.element, properties[i].x, 0, null, this.element) as MaskExpanderProp;
          filterID = createElementID();
          expansor = createNS('filter');
          expansor.setAttribute('id', filterID);
          feMorph = createNS('feMorphology');
          feMorph.setAttribute('operator', 'erode');
          feMorph.setAttribute('in', 'SourceGraphic');
          feMorph.setAttribute('radius', '0');
          expansor.appendChild(feMorph);
          defs.appendChild(expansor);
          path.setAttribute('stroke', properties[i].mode === 's' ? '#000000' : '#ffffff');
        } else {
          feMorph = null;
          x = null;
        }

        this.storedData[i] = {
          elem: path,
          x: x,
          expan: feMorph,
          lastPath: '',
          lastOperator: '',
          filterId: filterID,
          lastRadius: 0,
        };
        if (properties[i].mode === 'i') {
          jLen = currentMasks.length;
          const g = createNS('g');
          for (j = 0; j < jLen; j += 1) {
            g.appendChild(currentMasks[j]);
          }
          const mask = createNS('mask');
          mask.setAttribute('mask-type', 'alpha');
          mask.setAttribute('id', layerId + '_' + count);
          mask.appendChild(path);
          defs.appendChild(mask);
          g.setAttribute('mask', 'url(' + getLocationHref() + '#' + layerId + '_' + count + ')');

          currentMasks.length = 0;
          currentMasks.push(g);
        } else {
          currentMasks.push(path);
        }
        if (properties[i].inv && !this.solidPath) {
          this.solidPath = this.createLayerSolidPath();
        }
        this.viewData[i] = {
          elem: path,
          lastPath: '',
          op: PropertyFactory.getProp(this.element, properties[i].o, 0, 0.01, this.element) as MaskOpacityProp,
          prop: shapeFactory.getShapeProp(this.element, properties[i], 3) as MaskShapeProp,
          invRect: rect ?? undefined,
        };
        if (!this.viewData[i].prop.k) {
          this.drawPath(properties[i], this.viewData[i].prop.v, this.viewData[i]);
        }
      }
    }

    this.maskElement = createNS(maskType);

    len = currentMasks.length;
    for (i = 0; i < len; i += 1) {
      this.maskElement.appendChild(currentMasks[i]);
    }

    if (count > 0) {
      this.maskElement.setAttribute('id', layerId);
      this.element.maskedElement.setAttribute(maskRef, 'url(' + getLocationHref() + '#' + layerId + ')');
      defs.appendChild(this.maskElement);
    }
    if (this.viewData.length) {
      this.element.addRenderableComponent(this);
    }
  }

  getMaskProperty(pos: number): MaskShapeProp {
    return this.viewData[pos].prop;
  }

  renderFrame(isFirstFrame: boolean) {
    const finalMat = this.element.finalTransform.mat;
    let i: number;
    const len = this.masksProperties.length;
    for (i = 0; i < len; i += 1) {
      if (this.viewData[i].prop._mdf || isFirstFrame) {
        this.drawPath(this.masksProperties[i], this.viewData[i].prop.v, this.viewData[i]);
      }
      if (this.viewData[i].op._mdf || isFirstFrame) {
        this.viewData[i].elem.setAttribute('fill-opacity', String(this.viewData[i].op.v));
      }
      if (this.masksProperties[i].mode !== 'n') {
        if (this.viewData[i].invRect && (this.element.finalTransform.mProp._mdf || isFirstFrame)) {
          this.viewData[i].invRect!.setAttribute('transform', finalMat.getInverseMatrix().to2dCSS());
        }
        const stored = this.storedData[i];
        if (stored?.x && (stored.x._mdf || isFirstFrame)) {
          const feMorph = stored.expan;
          if (stored.x.v < 0) {
            if (stored.lastOperator !== 'erode') {
              stored.lastOperator = 'erode';
              stored.elem.setAttribute('filter', 'url(' + getLocationHref() + '#' + stored.filterId + ')');
            }
            feMorph!.setAttribute('radius', String(-stored.x.v));
          } else {
            if (stored.lastOperator !== 'dilate') {
              stored.lastOperator = 'dilate';
              stored.elem.setAttribute('filter', null as unknown as string);
            }
            stored.elem.setAttribute('stroke-width', String(stored.x.v * 2));
          }
        }
      }
    }
  }

  getMaskelement() {
    return this.maskElement;
  }

  createLayerSolidPath() {
    const compSize = this.globalData.compSize!;
    let path = 'M0,0 ';
    path += ' h' + compSize.w;
    path += ' v' + compSize.h;
    path += ' h-' + compSize.w;
    path += ' v-' + compSize.h + ' ';
    return path;
  }

  drawPath(pathData: MaskDefinitionJson, pathNodes: MaskPathNodes, viewData: MaskViewDataEntry) {
    let pathString = ' M' + pathNodes.v[0][0] + ',' + pathNodes.v[0][1];
    let i: number;
    const len = pathNodes._length;
    for (i = 1; i < len; i += 1) {
      pathString +=
        ' C' +
        pathNodes.o[i - 1][0] +
        ',' +
        pathNodes.o[i - 1][1] +
        ' ' +
        pathNodes.i[i][0] +
        ',' +
        pathNodes.i[i][1] +
        ' ' +
        pathNodes.v[i][0] +
        ',' +
        pathNodes.v[i][1];
    }
    if (pathNodes.c && len > 1) {
      pathString +=
        ' C' +
        pathNodes.o[i - 1][0] +
        ',' +
        pathNodes.o[i - 1][1] +
        ' ' +
        pathNodes.i[0][0] +
        ',' +
        pathNodes.i[0][1] +
        ' ' +
        pathNodes.v[0][0] +
        ',' +
        pathNodes.v[0][1];
    }

    if (viewData.lastPath !== pathString) {
      let pathShapeValue = '';
      if (viewData.elem) {
        if (pathNodes.c) {
          pathShapeValue = pathData.inv ? this.solidPath + pathString : pathString;
        }
        viewData.elem.setAttribute('d', pathShapeValue);
      }
      viewData.lastPath = pathString;
    }
  }

  destroy() {
    this.element = null as unknown as MaskHostElement;
    this.globalData = null as unknown as GlobalData;
    this.maskElement = null;
    this.data = null as unknown as MaskHostLayerData;
    this.masksProperties = null as unknown as MaskDefinitionJson[];
  }
}

export default MaskElement;
