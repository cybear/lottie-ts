import { createSizedArray } from '../../utils/helpers/arrays';

import ShapePropertyFactory from '../../utils/shapes/ShapeProperty';
import type { ShapePropertyFactoryApi } from '../../utils/shapes/shapePropertyFactoryTypes';
import type { MaskShapeProp } from '../../mask';
import type {
  GlobalData,
  MaskDefinitionJson,
  MaskHostLayerData,
  RenderableComponentEntry,
} from '../../types/lottieRuntime';

const shapeFactory = ShapePropertyFactory as ShapePropertyFactoryApi;

interface PointTransformMatrix {
  applyToPointArray(x: number, y: number, z: number): number[];
  applyToTriplePoints(o: unknown, i: unknown, v: unknown): number[];
}

/** Canvas layer host for mask path rendering (`CVBaseElement` subset at runtime). */
export interface CVMaskLayerHost {
  finalTransform: { mat: PointTransformMatrix };
  canvasContext: CanvasRenderingContext2D;
  globalData: GlobalData & { compSize: { w: number; h: number }; renderer: { save(force?: boolean): void } };
  addRenderableComponent(c: RenderableComponentEntry): void;
}

type MaskPathNodes = MaskShapeProp['v'];

class CVMaskElement {
  declare data: MaskHostLayerData;
  declare element: CVMaskLayerHost;
  masksProperties: MaskDefinitionJson[];
  viewData: MaskShapeProp[];
  hasMasks: boolean;

  constructor(data: MaskHostLayerData, element: CVMaskLayerHost) {
    this.data = data;
    this.element = element;
    this.masksProperties = this.data.masksProperties || [];
    this.viewData = createSizedArray(this.masksProperties.length) as MaskShapeProp[];
    let i: number;
    const len = this.masksProperties.length;
    let hasMasks = false;
    for (i = 0; i < len; i += 1) {
      if (this.masksProperties[i].mode !== 'n') {
        hasMasks = true;
      }
      this.viewData[i] = shapeFactory.getShapeProp(this.element, this.masksProperties[i], 3) as MaskShapeProp;
    }
    this.hasMasks = hasMasks;
    if (hasMasks) {
      this.element.addRenderableComponent(this);
    }
  }

  renderFrame() {
    if (!this.hasMasks) {
      return;
    }
    const transform = this.element.finalTransform.mat;
    const ctx = this.element.canvasContext;
    let i: number;
    const len = this.masksProperties.length;
    let pt: number[];
    let pts: number[];
    let data: MaskPathNodes;
    ctx.beginPath();
    for (i = 0; i < len; i += 1) {
      if (this.masksProperties[i].mode !== 'n') {
        if (this.masksProperties[i].inv) {
          ctx.moveTo(0, 0);
          ctx.lineTo(this.element.globalData.compSize.w, 0);
          ctx.lineTo(this.element.globalData.compSize.w, this.element.globalData.compSize.h);
          ctx.lineTo(0, this.element.globalData.compSize.h);
          ctx.lineTo(0, 0);
        }
        data = this.viewData[i].v;
        pt = transform.applyToPointArray(data.v[0][0], data.v[0][1], 0);
        ctx.moveTo(pt[0], pt[1]);
        let j: number;
        const jLen = data._length;
        for (j = 1; j < jLen; j += 1) {
          pts = transform.applyToTriplePoints(data.o[j - 1], data.i[j], data.v[j]);
          ctx.bezierCurveTo(pts[0], pts[1], pts[2], pts[3], pts[4], pts[5]);
        }
        pts = transform.applyToTriplePoints(data.o[j - 1], data.i[0], data.v[0]);
        ctx.bezierCurveTo(pts[0], pts[1], pts[2], pts[3], pts[4], pts[5]);
      }
    }
    this.element.globalData.renderer.save(true);
    ctx.clip();
  }

  /** Text-on-path (`TextAnimatorProperty`) expects the same shape as SVG `MaskElement.getMaskProperty` (a `MaskShapeProp`), not `viewData[i].prop`. */
  getMaskProperty(pos: number): MaskShapeProp {
    return this.viewData[pos];
  }

  destroy() {
    this.element = null as unknown as CVMaskLayerHost;
  }
}

export default CVMaskElement;
